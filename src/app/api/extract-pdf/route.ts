import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("pdfFile") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  const externalApiUrl =
    process.env.PDF_EXTRACTOR_URL || "http://127.0.0.1:8000/extract-pdf";

  try {
    const fd = new FormData();
    fd.append("pdfFile", file);

    const response = await fetch(externalApiUrl, {
      method: "POST",
      body: fd,
    });

    // Handle non-OK responses safely
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        // Try parsing JSON
        const errorData = await response.json();
        errorMessage = errorData?.error || errorMessage;
      } catch {
        // Fallback: if not JSON, get plain text
        const text = await response.text();
        errorMessage = text || errorMessage;
      }
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error calling Render API:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
