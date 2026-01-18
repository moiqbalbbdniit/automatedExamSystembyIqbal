import mongoose, { Schema, Document } from "mongoose";

export interface ISubmission extends Document {
  examId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  facultyId?: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  answers: {
    questionText: string;
    studentAnswer: string;
    marks: number;
  }[];
  total_score: number;
  max_score: number;
  status: "pending_evaluation" | "evaluated";
  evaluation_report?: Record<string, any>;
}

const AnswerSchema = new Schema(
  {
    questionText: { type: String, required: true },
    studentAnswer: { type: String, required: true },
    marks: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const SubmissionSchema = new Schema<ISubmission>(
  {
    examId: { type: Schema.Types.ObjectId, ref: "Exam", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    facultyId: { type: Schema.Types.ObjectId, ref: "Faculty" },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    answers: { type: [AnswerSchema], required: true },
    total_score: { type: Number, default: 0 },
    max_score: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending_evaluation", "evaluated"],
      default: "pending_evaluation",
    },
    evaluation_report: { type: Object, default: null },
  },
  { timestamps: true }
);

// Prevent model overwrite in hot reloads
export default mongoose.models.Submission ||
  mongoose.model<ISubmission>("Submission", SubmissionSchema);