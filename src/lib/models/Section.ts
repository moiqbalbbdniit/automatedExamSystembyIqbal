import mongoose, { Schema, model, models } from "mongoose";

const SectionSchema = new Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

SectionSchema.index({ course: 1, code: 1 }, { unique: true });

const Section = models.Section || model("Section", SectionSchema);

export default Section;
