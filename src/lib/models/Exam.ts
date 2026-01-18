import Subject from "./subject";
import mongoose, { Schema, Document } from "mongoose";

const QuestionSchema = new Schema(
  {
    Q_ID: String,
    question: String,
    options: [String],

  },
  { _id: false }
);

// A schema for the entire question paper OBJECT structure
const QuestionPaperSchema = new Schema(
  {
    MCQs: [QuestionSchema],
    Theory: [QuestionSchema],
    Coding: [QuestionSchema],
  },
  { _id: false }
);

const ExamSchema = new Schema(
  {
    title: { type: String, required: true },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course", 
    },
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    facultyId: { type: String, required: true }, // Matches frontend useAuth hook
    duration: { type: Number, default: 180 }, // FIX: Name is 'duration'
    veryShort: { count: Number, difficulty: String },
    short: { count: Number, difficulty: String },
    long: { count: Number, difficulty: String },
    coding: { count: Number },
    instructions: { type: String },
    status: {
      type: String,
      enum: ["draft", "generated", "published"],
      default: "draft",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isPublished: { type: Boolean, default: false },

    publishedAt: { type: Date, required: false },
        proctoringEnabled: { type: Boolean, default: false },


    questions: QuestionPaperSchema,

    // This stores the map of Q_ID -> {type, question, correct_answer} from the Python API
    paper_solutions_map: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

const Exam = mongoose.models.Exam || mongoose.model("Exam", ExamSchema);

export default Exam;