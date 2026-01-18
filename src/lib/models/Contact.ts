import mongoose, { Schema, model, models } from "mongoose";

interface IContact {
    name: string;
    email: string;
    university: string;
    message: string;
    createdAt: Date;
}

const contactSchema = new Schema<IContact>({
    name: { type: String, required: true },
    email: { type: String, required: true },
    university: { type: String, required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

// Prevent model overwrite issues
const Contact = models.Contact || model<IContact>("Contact", contactSchema);
export default Contact;

