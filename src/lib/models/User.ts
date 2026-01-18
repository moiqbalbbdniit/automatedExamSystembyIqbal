import mongoose, { Schema, Document, models } from "mongoose";
import "./Course";

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  // username: string;
  email: string;
  password: string;
  role: "student" | "faculty" | "admin";
  course?: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
    // --- NEW FIELDS ---
    phone?: string;
    address?: string;
    zipCode?: string;
    country?: string;
    language?: string;
}

const UserSchema = new Schema<IUser>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  // username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["student", "faculty", "admin"], default: "student" },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course", // 
  },
     // --- NEW SCHEMA DEFINITIONS ---
    phone: { type: String, required: false },
    address: { type: String, required: false },
    zipCode: { type: String, required: false },
    country: { type: String, required: false },
    language: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
});

export default models.User || mongoose.model<IUser>("User", UserSchema);