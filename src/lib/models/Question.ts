import mongoose, { Schema, Document, models } from "mongoose";

type QuestionType = 'mcq' | 'short_answer' | 'long_answer' | 'coding';

export interface IQuestion extends Document {
  questionText: string;
  type: QuestionType;
  options?: string[];
}

const QuestionSchema = new Schema<IQuestion>({
  questionText: { type: String, required: true },
  type: {
    type: String,
    enum: ["mcq", "short_answer", "long_answer", "coding"],
    required: true,
  },
  options: {
    type: [String],
    validate: {
      validator: function(this: IQuestion, v: string[]) {
        return this.type !== "mcq" || (v && v.length > 0);
      },
      message: "MCQ questions must have options.",
    },
  },
});

export default models.Question || mongoose.model<IQuestion>("Question", QuestionSchema);