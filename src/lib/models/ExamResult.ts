import mongoose, { Schema, Document } from "mongoose";

export interface IExamResult extends Document {
  examId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  facultyId: mongoose.Types.ObjectId;
  totalMarksObtained: number;
  totalMaxMarks: number;
  percentage: number;
  feedback: string; // overall feedback only
  strengths: string[];
  weaknesses: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ExamResultSchema = new Schema<IExamResult>(
  {
    examId: { type: Schema.Types.ObjectId, ref: "Exam", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    facultyId: { type: Schema.Types.ObjectId, ref: "Faculty", required: true },
    totalMarksObtained: { type: Number, required: true },
    totalMaxMarks: { type: Number, required: true },
    percentage: { type: Number, required: true },
    feedback: { type: String }, // overall_feedback from AI
    strengths: [{ type: String }], // collective_strengths
    weaknesses: [{ type: String }], // collective_weaknesses
  },
  { timestamps: true }
);

export default mongoose.models.ExamResult ||
  mongoose.model<IExamResult>("ExamResult", ExamResultSchema);
