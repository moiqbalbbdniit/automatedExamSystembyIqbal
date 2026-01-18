# main.py
import os
import binascii
import secrets
from typing import Optional
import pandas as pd
import numpy as np
from fastapi import FastAPI, Request, Query, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from jinja2 import Template
import plotly.express as px
import plotly.graph_objects as go
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from dotenv import load_dotenv

load_dotenv()

# --- MongoDB Setup ---
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "test")  # your DB shown in screenshots is 'test'
EXAMRESULTS_COLLECTION = os.getenv("EXAMRESULTS_COLLECTION", "examresults")
EXAMS_COLLECTION = os.getenv("EXAMS_COLLECTION", "exams")
SUBJECTS_COLLECTION = os.getenv("SUBJECTS_COLLECTION", "subjects")
USERS_COLLECTION = os.getenv("USERS_COLLECTION", "users")

client = None
db = None
collection = None

try:
    client = MongoClient(MONGO_URI)
    # Basic connection test
    client.admin.command("ismaster")
    db = client[DB_NAME]
    collection = db[EXAMRESULTS_COLLECTION]
    print("Successfully connected to MongoDB Atlas.")
except ConnectionFailure as e:
    print(f"MongoDB Connection FAILED. Check MONGO_URI and network access. Error: {e}")
except Exception as e:
    print(f"An unexpected error occurred during MongoDB initialization: {e}")


# --- Helper to aggregate and load real data from examresults ---
def load_data_from_mongo():
    """
    Aggregate examresults -> join exams -> join subjects -> join users
    Build a normalized DataFrame and pivot by subject to one row per student.
    """
    if collection is None:
        raise Exception("MongoDB collection is not initialized. Cannot load data.")

    # Aggregation pipeline to fetch joined records
    pipeline = [
        # bring in exam doc
        {
            "$lookup": {
                "from": EXAMS_COLLECTION,
                "localField": "examId",
                "foreignField": "_id",
                "as": "exam",
            }
        },
        {"$unwind": {"path": "$exam", "preserveNullAndEmptyArrays": True}},
        # bring in subject doc via exam.subject
        {
            "$lookup": {
                "from": SUBJECTS_COLLECTION,
                "localField": "exam.subject",
                "foreignField": "_id",
                "as": "subject",
            }
        },
        {"$unwind": {"path": "$subject", "preserveNullAndEmptyArrays": True}},
        # bring in user (student)
        {
            "$lookup": {
                "from": USERS_COLLECTION,
                "localField": "studentId",
                "foreignField": "_id",
                "as": "student",
            }
        },
        {"$unwind": {"path": "$student", "preserveNullAndEmptyArrays": True}},
        # project useful fields
        {
            "$project": {
                "_id": 0,
                "raw_id": {"$toString": "$_id"},
                "examId": {"$toString": "$exam._id"},
                "examTitle": "$exam.title",
                "studentId": {"$toString": "$student._id"},
                "studentFirstName": "$student.firstName",
                "studentLastName": "$student.lastName",
                "Subject": "$subject.name",
                "Total_Score": {"$ifNull": ["$totalMarksObtained", 0]},
                "MaxTotal": {"$ifNull": ["$totalMaxMarks", 0]},
                "Percentage": {"$ifNull": ["$percentage", None]},
                "Feedback": {"$ifNull": ["$feedback", ""]},
                "evaluationDetails": {"$ifNull": ["$evaluationDetails", []]},
                "createdAt": 1,
            }
        },
    ]

    try:
        docs = list(collection.aggregate(pipeline))
    except Exception as e:
        raise Exception(f"MongoDB aggregation error: {e}")

    if not docs:
        # no data found — return empty DataFrame
        return pd.DataFrame(), []

    # Build processed rows: combine student name, subject, scores
    rows = []
    for d in docs:
        full_name = (
            (d.get("studentFirstName") or "") + " " + (d.get("studentLastName") or "")
        ).strip()
        rows.append(
            {
                "StudentID": d.get("studentId") or "",
                "Name": full_name or "Unknown Student",
                "Subject": d.get("Subject") or "Unknown",
                "Total_Score": d.get("Total_Score") or 0,
                "MaxTotal": d.get("MaxTotal") or 0,
                "Percentage": d.get(
                    "Percentage"
                ),  # may be None; we'll compute after grouping
                "Feedback": d.get("Feedback") or "",
                "evaluationDetails": d.get("evaluationDetails") or [],
                "examTitle": d.get("examTitle") or "",
                "createdAt": d.get("createdAt", None),
            }
        )

    df_raw = pd.DataFrame(rows)

    if df_raw.empty:
        return pd.DataFrame(), []

    # Aggregate per student+subject (sum scores/max) in case of multiple exam entries
    grouped = df_raw.groupby(["StudentID", "Name", "Subject"], as_index=False).agg(
        {
            "Total_Score": "sum",
            "MaxTotal": "sum",
            # pick the latest feedback/examTitle/createdAt for display (if multiple)
            "Feedback": lambda x: " ||| ".join([s for s in x if s]),
            "evaluationDetails": lambda x: [
                item for sub in x for item in (sub if isinstance(sub, list) else [])
            ],
            "examTitle": lambda x: " | ".join([s for s in x if s]),
            "createdAt": "max",
        }
    )

    # Compute percentage for aggregated rows
    def compute_pct(row):
        try:
            if row["MaxTotal"] and row["MaxTotal"] > 0:
                return (row["Total_Score"] / row["MaxTotal"]) * 100
        except Exception:
            pass
        return 0.0

    grouped["Percentage"] = grouped.apply(compute_pct, axis=1)

    # Pivot to prepare one-row-per-student with subject columns containing Total_Score
    subjects = sorted(grouped["Subject"].dropna().unique().tolist())
    df_pivot = grouped.pivot_table(
        index=["StudentID", "Name"],
        columns="Subject",
        values="Total_Score",
        fill_value=0,
    ).reset_index()

    # Ensure all subject columns exist
    for s in subjects:
        if s not in df_pivot.columns:
            df_pivot[s] = 0

    # Also compute aggregated totals per student across subjects (Total and MaxTotal)
    # To compute MaxTotal per subject we need subject-wise max totals; we'll compute per student from grouped.
    # Summation of grouped MaxTotal per student:
    max_by_student = grouped.groupby(["StudentID", "Name"], as_index=False)[
        "MaxTotal"
    ].sum()
    total_by_student = grouped.groupby(["StudentID", "Name"], as_index=False)[
        "Total_Score"
    ].sum()

    df_pivot = df_pivot.merge(total_by_student, on=["StudentID", "Name"], how="left")
    df_pivot = df_pivot.merge(
        max_by_student, on=["StudentID", "Name"], how="left", suffixes=("", "_Max")
    )

    # Normalize column names and ensure they are numeric
    df_pivot.rename(columns={"Total_Score": "Total"}, inplace=True)
    df_pivot["MaxTotal"] = pd.to_numeric(df_pivot["MaxTotal"], errors="coerce").fillna(
        0
    )

    # If columns inserted above have unexpected names, ensure 'Total' exists:
    if "Total" not in df_pivot.columns:
        # ensure subject columns are numeric before summing
        for s in subjects:
            df_pivot[s] = pd.to_numeric(df_pivot[s], errors="coerce").fillna(0)
        df_pivot["Total"] = df_pivot[subjects].sum(axis=1)

    # Ensure MaxTotal column exists and is numeric (from merge)
    if "MaxTotal" not in df_pivot.columns:
        df_pivot["MaxTotal"] = (
            grouped.groupby(["StudentID", "Name"])["MaxTotal"]
            .sum()
            .reindex(df_pivot.set_index(["StudentID", "Name"]).index)
            .fillna(0)
            .values
        )
    # Re-ensure MaxTotal is numeric after all joins/calculations
    df_pivot["MaxTotal"] = pd.to_numeric(df_pivot["MaxTotal"], errors="coerce").fillna(
        0
    )

    # Add Status and Feedback placeholder (we'll create aggregated feedback)
    df_pivot["Feedback"] = df_pivot.apply(
        lambda row: " ; ".join(
            grouped[
                (grouped["StudentID"] == row["StudentID"])
                & (grouped["Name"] == row["Name"])
            ]["Feedback"]
            .astype(str)
            .tolist()
        ),
        axis=1,
    )

    # Calculate Percentage
    # Calculate Percentage (using numpy.where for vectorized safety)
    # Ensure Total is numeric first
    df_pivot["Total"] = pd.to_numeric(df_pivot["Total"], errors="coerce").fillna(0)

    df_pivot["Percentage"] = np.where(
        df_pivot["MaxTotal"] > 0, (df_pivot["Total"] / df_pivot["MaxTotal"]) * 100, 0.0
    )

    # Calculate Status (pass if all subject percentages >= 40 else Fail) - using subject raw scores
    def status_for_row(r):
        # if any subject score < 40 (out of subject-level max unknown), we use percentage here: treat threshold per-subject as 40
        # simpler approach: fail if overall Percentage < 40
        return "Fail" if r.get("Percentage", 0) < 40 else "Pass"

    df_pivot["Status"] = df_pivot.apply(status_for_row, axis=1)

    # Return pivoted df and subjects list for dropdown
    return df_pivot, subjects


# --- Analyzer class (uses dynamic subjects list) ---
class PerformanceAnalyzer:
    def __init__(self, df: pd.DataFrame, subjects=None):
        self.df = df.copy() if isinstance(df, pd.DataFrame) else pd.DataFrame()
        self.subjects = subjects or []
        if not self.df.empty:
            self._preprocess_data()

    def _preprocess_data(self):
        total_marks = len(self.subjects) * 100 if self.subjects else 100
        # Percentage already computed earlier; but keep calculation to be safe
        if (
            "Total" in self.df.columns
            and "MaxTotal" in self.df.columns
            and self.df["MaxTotal"].sum() > 0
        ):
            self.df["Percentage"] = (self.df["Total"] / self.df["MaxTotal"]) * 100
        else:
            # fallback: if MaxTotal not present, assume 100 per subject
            self.df["Percentage"] = (
                (self.df["Total"] / (len(self.subjects) * 100)) * 100
                if self.subjects
                else 0
            )
        # Rank
        # Rank
        try:
            # Ensure Percentage is numeric before ranking, replace NaN with 0
            self.df["Percentage"] = pd.to_numeric(
                self.df["Percentage"], errors="coerce"
            ).fillna(0)
            self.df["Rank"] = (
                self.df["Percentage"].rank(method="max", ascending=False).astype(int)
            )
        except Exception:
            self.df["Rank"] = 0

        # Performance Level and Risk Level
        bins = [0, 50, 65, 80, 90, 100]
        labels = ["Needs Improvement", "Average", "Good", "Excellent", "Outstanding"]
        try:
            self.df["Performance Level"] = pd.cut(
                self.df["Percentage"], bins=bins, labels=labels
            )
        except Exception:
            self.df["Performance Level"] = "Unknown"
        self.df["Risk Level"] = self.df.apply(self._predict_risk_level, axis=1)

    def _predict_risk_level(self, row):
        if row.get("Status", "Fail") == "Fail" or row.get("Percentage", 0) < 50:
            return "High"
        if row.get("Percentage", 0) < 65:
            return "Medium"
        return "Low"

    def generate_ai_feedback(self, student_data):
        # student_data is a pandas Series row
        feedback_lines = []
        feedback_lines.append(
            f" Overall performance level: {student_data.get('Performance Level', 'Unknown')} ({student_data.get('Percentage', 0):.1f}%)."
        )
        feedback_lines.append(
            f" Risk level assessed: {student_data.get('Risk Level', 'Unknown')}. {student_data.get('Feedback', '')}"
        )
        # per-subject comments built from numeric values (if subjects available)
        for subject in self.subjects:
            score = student_data.get(subject, 0)
            if score >= 90:
                comment = f"{subject}: Outstanding! Deep understanding and accuracy."
            elif score >= 75:
                comment = (
                    f"{subject}: Very good performance, minor improvement possible."
                )
            elif score >= 60:
                comment = f"{subject}: Satisfactory, but consistency needed."
            elif score >= 45:
                comment = f"{subject}: Below average, more practice and focus required."
            else:
                comment = f"{subject}: Critical zone — needs urgent attention."
            feedback_lines.append("• " + comment)
        return "\n".join(feedback_lines)

    # Plotly chart functions - reused from your original code, adapted to use data from self.df

    def plot_score_distribution(self, df=None):
        if df is None:
            df = self.df.copy()
        if df.empty:
            return ""
        df["PercentageRange"] = (
            (
                df["Percentage"].replace([np.inf, -np.inf], np.nan)
            ).fillna(  # remove infinities
                0
            )  # replace NaN with 0
            // 10
            * 10
        ).astype(int)

        df_grouped = df.groupby("PercentageRange").size().reset_index(name="Count")
        df_grouped["Range"] = (
            df_grouped["PercentageRange"].astype(str)
            + "-"
            + (df_grouped["PercentageRange"] + 9).astype(str)
        )
        fig = px.bar(
            df_grouped, x="Range", y="Count", text="Count", title="Score Distribution"
        )
        fig.update_layout(
            template="plotly_dark",
            title_font_color="#ECEFF1",
            paper_bgcolor="#1C1C1C",
            plot_bgcolor="#1C1C1C",
        )
        fig.update_traces(textposition="outside", textfont_color="#ECEFF1")
        return fig.to_html(full_html=False)

    def plot_performance_distribution(self, df=None):
        if df is None:
            df = self.df
        if df.empty:
            return ""
        fig = px.histogram(
            df,
            x="Performance Level",
            color="Performance Level",
            title="Performance Level Distribution",
        )
        fig.update_layout(
            template="plotly_dark",
            paper_bgcolor="#1C1C1C",
            plot_bgcolor="#1C1C1C",
            title_font_color="#ECEFF1",
        )
        return fig.to_html(full_html=False)

    def plot_risk_distribution(self, df=None):
        if df is None:
            df = self.df
        if df.empty:
            return ""
        fig = px.histogram(
            df, x="Risk Level", color="Risk Level", title="Risk Level Distribution"
        )
        fig.update_layout(
            template="plotly_dark",
            paper_bgcolor="#1C1C1C",
            plot_bgcolor="#1C1C1C",
            title_font_color="#ECEFF1",
        )
        return fig.to_html(full_html=False)

    def plot_student_marks(self, student_data):
        fig = px.bar(
            x=self.subjects,
            y=[student_data.get(sub, 0) for sub in self.subjects],
            title=f"{student_data.get('Name', '')}'s Marks",
            text=[student_data.get(sub, 0) for sub in self.subjects],
        )
        fig.update_layout(
            template="plotly_dark",
            paper_bgcolor="#1C1C1C",
            plot_bgcolor="#1C1C1C",
            title_font_color="#ECEFF1",
        )
        fig.update_traces(textposition="auto", textfont_color="#ECEFF1")
        return fig.to_html(full_html=False)

    def plot_student_vs_class(self, student_data):
        class_avg = self.df[self.subjects].mean() if self.subjects else []
        fig = go.Figure()
        fig.add_trace(go.Bar(x=self.subjects, y=class_avg, name="Class Average"))
        fig.add_trace(
            go.Bar(
                x=self.subjects,
                y=[student_data.get(sub, 0) for sub in self.subjects],
                name=student_data.get("Name", "Student"),
            )
        )
        fig.update_layout(
            template="plotly_dark",
            title=f"{student_data.get('Name','')} vs Class Average",
            barmode="group",
            yaxis=dict(range=[0, 100]),
            paper_bgcolor="#1C1C1C",
            plot_bgcolor="#1C1C1C",
            title_font_color="#ECEFF1",
        )
        return fig.to_html(full_html=False)

    def plot_student_pie(self, student_data):
        fig = px.pie(
            values=[student_data.get(sub, 0) for sub in self.subjects],
            names=self.subjects,
            title=f"{student_data.get('Name','')}'s Subject-wise Mark Distribution",
            hole=0.3,
        )
        fig.update_layout(
            template="plotly_dark", paper_bgcolor="#1C1C1C", title_font_color="#ECEFF1"
        )
        return fig.to_html(full_html=False)

    def get_student_data(self, student_id):
        df_student = self.df[self.df["StudentID"] == str(student_id)]
        if df_student.empty:
            return None
        return df_student.iloc[0]


# --- Live Data Loader used by routes ---
def get_latest_analyzer():
    if collection is None:
        raise HTTPException(
            status_code=500, detail="Database connection failed or not initialized."
        )
    try:
        df, subjects = load_data_from_mongo()
        analyzer = PerformanceAnalyzer(df, subjects=subjects)
        return analyzer
    except ValueError as e:
        print(f"Data loading error: {e}")
        return PerformanceAnalyzer(pd.DataFrame(), subjects=[])
    except Exception as e:
        print(f"Unexpected error in get_latest_analyzer: {e}")
        return PerformanceAnalyzer(pd.DataFrame(), subjects=[])


# --- Initialize Analyzer (best-effort on startup) ---
try:
    df_init, subjects_init = load_data_from_mongo()
    analyzer = PerformanceAnalyzer(df_init, subjects=subjects_init)
except Exception as e:
    print("⚠️ Initial MongoDB data load failed:", e)
    analyzer = PerformanceAnalyzer(pd.DataFrame(), subjects=[])


# --- FastAPI App ---
app = FastAPI(title="📊 FastAPI Student Dashboard")


# --- HTML templates (unchanged structure, using Template strings) ---
HOME_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Class Performance Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
  <style>
    /* Loader animation */
    .loader {
      border: 4px solid rgba(255, 255, 255, 0.1);
      border-left-color: #3b82f6;
      border-radius: 50%;
      width: 48px;
      height: 48px;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 font-sans min-h-screen p-6">
  <h1 class="text-3xl font-bold text-center mb-8 text-slate-100">
    Class Performance Dashboard
  </h1>

  <!-- Filters -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <div>
      <label class="block mb-1 text-sm font-medium">Performance Level</label>
      <select id="performance" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100">
        <option value="">All</option>
        {% for p in levels %}<option value="{{p}}">{{p}}</option>{% endfor %}
      </select>
    </div>

    <div>
      <label class="block mb-1 text-sm font-medium">Risk Level</label>
      <select id="risk" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100">
        <option value="">All</option>
        {% for r in risks %}<option value="{{r}}">{{r}}</option>{% endfor %}
      </select>
    </div>

    <div>
      <label class="block mb-1 text-sm font-medium">Search Name</label>
      <input type="text" id="search" placeholder="Search by Name" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 placeholder-slate-500"/>
    </div>

    <div>
      <label class="block mb-1 text-sm font-medium">Subject &lt; Marks</label>
      <div class="flex gap-2">
        <select id="subject" class="w-1/2 bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100">
          <option value="">Select</option>
          {% for s in subjects %}<option value="{{s}}">{{s}}</option>{% endfor %}
        </select>
        <input type="number" id="below" placeholder="60" class="w-1/2 bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 placeholder-slate-500"/>
      </div>
    </div>
  </div>

  <div class="text-right mb-8">
    <button id="applyFilters" class="bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg transition-all">
      Apply Filters
    </button>
  </div>

  <!-- Loader -->
  <div id="loader" class="hidden fixed inset-0 bg-slate-950 bg-opacity-70 flex items-center justify-center z-50">
    <div class="flex flex-col items-center">
      <div class="loader mb-3"></div>
      <p class="text-slate-300 text-sm">Fetching data...</p>
    </div>
  </div>

  <!-- Charts (stacked vertically) -->
  <div id="charts" class="space-y-6 mb-10 text-center">
    {{ score_dist|safe }}
    {{ perf_dist|safe }}
    {{ risk_dist|safe }}
  </div>

  <!-- Table -->
  <div class="overflow-x-auto bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
    <table class="min-w-full divide-y divide-slate-800">
      <thead class="bg-slate-900">
        <tr>
          <th class="px-4 py-3 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">Name</th>
          <th class="px-4 py-3 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">Percentage</th>
          <th class="px-4 py-3 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">Rank</th>
          <th class="px-4 py-3 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">Status</th>
          <th class="px-4 py-3 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">Report</th>
        </tr>
      </thead>
      <tbody id="student_table" class="divide-y divide-slate-800">
        {% for s in students %}
        <tr class="hover:bg-slate-800 transition-all">
          <td class="px-4 py-3 text-slate-200">{{s.Name}}</td>
          <td class="px-4 py-3 text-slate-200">{{"%.2f"|format(s.Percentage)}}</td>
          <td class="px-4 py-3 text-slate-200">{{s.Rank}}</td>
          <td class="px-4 py-3 text-slate-200">{{s.Status}}</td>
          <td class="px-4 py-3">
            <a href="/report/{{s.StudentID}}" class="text-blue-400 hover:text-blue-300 underline">View Report</a>
          </td>
        </tr>
        {% endfor %}
      </tbody>
    </table>
  </div>

  <script>
    function showLoader(show) {
      if (show) {
        $("#loader").removeClass("hidden");
      } else {
        $("#loader").addClass("hidden");
      }
    }

    function update_dashboard() {
      showLoader(true);
      const perf = $("#performance").val();
      const risk = $("#risk").val();
      const search = $("#search").val();
      const subject = $("#subject").val();
      const below = $("#below").val();

      $.get("/filter", { performance: perf, risk: risk, search: search, subject: subject, below: below }, function(data) {
        $("#student_table").html(data.table_html);
        $("#charts").html(data.charts_html);
        showLoader(false);
      }).fail(function() {
        showLoader(false);
        alert("Error fetching data from server.");
      });
    }

    $("#applyFilters").click(update_dashboard);

    // Show loader on page navigation
    $(document).on("click", "a", function() {
      showLoader(true);
    });
  </script>
</body>
</html>
"""


REPORT_HTML = """<!DOCTYPE html>
<html>
<head>
<title>{{ student.Name }} Report</title>
<script src="https://cdn.tailwindcss.com"></script>
</head>

<body class="bg-slate-950 text-gray-100 p-6">

<h2 class="text-3xl font-bold text-center mb-6">{{ student.Name }}'s Performance Report</h2>

<div class="mb-6 space-y-2">
    <p><span class="font-semibold">Student ID:</span> {{ student.StudentID }}</p>
    <p><span class="font-semibold">Status:</span> {{ student.Status }}</p>
    <p><span class="font-semibold">Average Score:</span> {{ "%.2f"|format(student.Percentage) }}</p>
    <p><span class="font-semibold">Rank:</span> {{ student.Rank }}</p>
    <p><span class="font-semibold">Performance Level:</span> {{ student["Performance Level"] }}</p>
    <p><span class="font-semibold">Risk Level:</span> {{ student["Risk Level"] }}</p>
</div>

<div class="mb-6">
    <h3 class="font-semibold text-lg mb-2">Subject-wise Feedback:</h3>
    <div class="max-h-96 overflow-y-auto border border-gray-700 rounded-lg p-4 bg-slate-800">
        <button id="toggleFeedback" class="w-full text-left font-bold text-md mb-2 focus:outline-none bg-slate-700 rounded-md p-2">
            See the full Feedback of your Subjects
        </button>
        <pre id="feedbackContent" class="whitespace-pre-wrap text-gray-100 hidden">
{{ feedback }}
        </pre>
    </div>
</div>

<div class="grid grid-cols-1 md:grid-cols-1 gap-6 text-center">
    {{ marks_chart|safe }}
    {{ compare_chart|safe }}
    {{ pie_chart|safe }}
</div>

<script>
// Simple toggle for feedback area
document.getElementById('toggleFeedback').addEventListener('click', function() {
    const content = document.getElementById('feedbackContent');
    content.classList.toggle('hidden');
});
</script>

</body>
</html>
"""


# --- Routes ---
@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    analyzer = get_latest_analyzer()
    # Convert DataFrame rows to list of dicts for template
    students = analyzer.df.to_dict("records") if not analyzer.df.empty else []
    html = Template(HOME_HTML).render(
        students=students,
        levels=(
            sorted(
                analyzer.df["Performance Level"].dropna().astype(str).unique().tolist()
            )
            if not analyzer.df.empty
            else []
        ),
        risks=(
            sorted(analyzer.df["Risk Level"].dropna().astype(str).unique().tolist())
            if not analyzer.df.empty
            else []
        ),
        subjects=analyzer.subjects,
        score_dist=analyzer.plot_score_distribution(),
        perf_dist=analyzer.plot_performance_distribution(),
        risk_dist=analyzer.plot_risk_distribution(),
    )
    return HTMLResponse(html)


@app.get("/filter", response_class=JSONResponse)
async def filter_data(
    performance: Optional[str] = Query(None),
    risk: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    subject: Optional[str] = Query(None),
    below: Optional[str] = Query(None),  # <-- keep as str
):
    analyzer = get_latest_analyzer()
    df_filtered = analyzer.df.copy()

    # Convert below to int if possible, else None
    try:
        below_value = int(below) if below and below.strip() != "" else None
    except ValueError:
        below_value = None

    # Subject filtering
    if subject:
        if subject in df_filtered.columns:
            df_filtered = df_filtered[df_filtered[subject] > 0]
        else:
            df_filtered = df_filtered.iloc[0:0]  # empty

    if performance:
        df_filtered = df_filtered[df_filtered["Performance Level"] == performance]
    if risk:
        df_filtered = df_filtered[df_filtered["Risk Level"] == risk]
    if search:
        df_filtered = df_filtered[
            df_filtered["Name"].str.contains(search, case=False, na=False)
            | (df_filtered["StudentID"].astype(str) == search)
        ]
    if subject and below_value is not None and (subject in df_filtered.columns):
        df_filtered = df_filtered[df_filtered[subject] < below_value]

    table_html = ""
    for _, s in df_filtered.iterrows():
        table_html += f"<tr><td>{s.StudentID}</td><td>{s.Name}</td><td>{s.Percentage:.2f}</td><td>{s.Rank}</td><td>{s.Status}</td><td><a href='/report/{s.StudentID}'>View Report</a></td></tr>"

    charts_html = (
        analyzer.plot_score_distribution(df_filtered)
        + analyzer.plot_performance_distribution(df_filtered)
        + analyzer.plot_risk_distribution(df_filtered)
    )

    return JSONResponse({"table_html": table_html, "charts_html": charts_html})


@app.get("/report/{student_id}", response_class=HTMLResponse)
async def report(student_id: str):
    analyzer = get_latest_analyzer()
    student = analyzer.get_student_data(student_id)
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")

    # Fetch detailed examresults for this student to show AI feedback and evaluationDetails
    # We'll join subject and exam again to make the feedback readable
    try:
        pipeline = [
            (
                {"$match": {"studentId": {"$in": [student_id, {"$oid": student_id}]}}}
                if False
                else {"$match": {"studentId": {"$eq": None}}}
            )
        ]
        # Simpler approach: use a fresh aggregation with stringified studentId
        pipeline = [
            {"$addFields": {"studentIdStr": {"$toString": "$studentId"}}},
            {"$match": {"studentIdStr": student_id}},
            {
                "$lookup": {
                    "from": EXAMS_COLLECTION,
                    "localField": "examId",
                    "foreignField": "_id",
                    "as": "exam",
                }
            },
            {"$unwind": {"path": "$exam", "preserveNullAndEmptyArrays": True}},
            {
                "$lookup": {
                    "from": SUBJECTS_COLLECTION,
                    "localField": "exam.subject",
                    "foreignField": "_id",
                    "as": "subject",
                }
            },
            {"$unwind": {"path": "$subject", "preserveNullAndEmptyArrays": True}},
            {
                "$project": {
                    "_id": {"$toString": "$_id"},
                    "examTitle": "$exam.title",
                    "subjectName": "$subject.name",
                    "totalMarksObtained": {"$ifNull": ["$totalMarksObtained", 0]},
                    "totalMaxMarks": {"$ifNull": ["$totalMaxMarks", 0]},
                    "percentage": {"$ifNull": ["$percentage", 0]},
                    "feedback": {"$ifNull": ["$feedback", ""]},
                    "evaluationDetails": {"$ifNull": ["$evaluationDetails", []]},
                    "createdAt": 1,
                }
            },
        ]
        records = list(collection.aggregate(pipeline))
    except Exception as e:
        print("Error fetching detailed records for report:", e)
        records = []

    # Build feedback string concatenating feedbacks per record
    feedback_texts = []
    for rec in records:
        subj = rec.get("subjectName", "Unknown")
        fb = rec.get("feedback", "")
        feedback_texts.append(f"{subj}:\n{fb}")

    feedback = (
        "\n\n".join(feedback_texts)
        if feedback_texts
        else (student.get("Feedback", "") if isinstance(student, dict) else "")
    )

    marks_chart = analyzer.plot_student_marks(student)
    compare_chart = analyzer.plot_student_vs_class(student)
    pie_chart = analyzer.plot_student_pie(student)
    html = Template(REPORT_HTML).render(
        student=student,
        feedback=feedback,
        marks_chart=marks_chart,
        compare_chart=compare_chart,
        pie_chart=pie_chart,
    )
    return HTMLResponse(html)


# --- Run Server ---
if __name__ == "__main__":
    import uvicorn

    print("Server running at http://127.0.0.1:8000")

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

    uvicorn.run("main:app", reload=True)
