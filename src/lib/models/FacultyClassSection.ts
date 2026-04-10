import mongoose, { Schema, model, models } from "mongoose";

const FacultyClassSectionSchema = new Schema(
  {
    facultyUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

FacultyClassSectionSchema.index({ facultyUserId: 1, course: 1, section: 1 }, { unique: true });

const FacultyClassSection =
  models.FacultyClassSection || model("FacultyClassSection", FacultyClassSectionSchema);

export default FacultyClassSection;
