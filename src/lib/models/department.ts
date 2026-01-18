import mongoose, { Schema, models } from "mongoose";

const DepartmentSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

const Department =
  models.Department || mongoose.model("Department", DepartmentSchema);

export default Department;
