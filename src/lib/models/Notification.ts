// lib/models/Notification.ts
import mongoose, { Schema, Document } from 'mongoose';

// Define the TypeScript interface for the document
export interface INotification extends Document {
    message: string;
    read: boolean;
    targetUser: 'all' | string; // 'all' for system-wide, or a user ID
    createdAt: Date;
}

const NotificationSchema: Schema = new Schema({
    message: {
        type: String,
        required: [true, 'Notification message is required.'],
        trim: true,
        maxlength: 500,
    },
    read: {
        type: Boolean,
        default: false,
    },
    targetUser: {
        type: String,
        default: 'all',
        enum: ['all', 'admin'], // Extend as needed
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Use existing model or create a new one
const Notification = (mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema));

export default Notification;