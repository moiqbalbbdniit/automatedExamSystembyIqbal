import mongoose, { Schema, models } from "mongoose";

const subjectSchema = new Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true }, // ✅ New field
    topics: [{ type: String }], // ✅ New field
    faculty: { type: Schema.Types.ObjectId, ref: "Faculty" },
  },
  { timestamps: true }
);

const Subject = models.Subject || mongoose.model("Subject", subjectSchema);

export default Subject;
