import mongoose, { Schema, model, models } from "mongoose";

const FacultySubjectAssignmentSchema = new Schema(
  {
    facultyUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  { timestamps: true }
);

FacultySubjectAssignmentSchema.index({ facultyUserId: 1, subject: 1 }, { unique: true });

const FacultySubjectAssignment =
  models.FacultySubjectAssignment ||
  model("FacultySubjectAssignment", FacultySubjectAssignmentSchema);

export default FacultySubjectAssignment;
