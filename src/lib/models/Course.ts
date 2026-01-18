import { Schema, model, models } from "mongoose";

const CourseSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

const Course = models.Course || model("Course", CourseSchema);

export default Course;
