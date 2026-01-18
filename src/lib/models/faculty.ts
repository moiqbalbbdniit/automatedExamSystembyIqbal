import mongoose, { Schema, model, models } from "mongoose";

const FacultySchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    department: { type: String, required: true },
  },
  { timestamps: true }
);

const Faculty = models.Faculty || model("Faculty", FacultySchema);
export default Faculty;
