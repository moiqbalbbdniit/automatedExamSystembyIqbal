// app/api/admin/notifications/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db"; 
import Notification from "@/lib/models/Notification"; 

export async function POST(request: Request) {
    try {
        await connectDB();
        
        const body = await request.json();
        const { message, targetUser } = body;

        if (!message) {
            return NextResponse.json(
                { message: "Notification message is required." }, 
                { status: 400 }
            );
        }

        // Create and save the new notification
        const newNotification = await Notification.create({
            message,
            targetUser: targetUser || 'all',
            // createdAt is handled by the model default
        });

        return NextResponse.json(
            { 
                message: "Notification posted successfully.", 
                notification: newNotification 
            }, 
            { status: 201 } // 201 Created
        );

    } catch (error) {
        console.error("Error posting notification:", error);
        return NextResponse.json(
            { message: "Failed to post notification.", error }, 
            { status: 500 }
        );
    }
}


export async function GET(request: Request) {
    try {
        await connectDB();
        
        // 🚨 AUTHENTICATION CHECK HERE 🚨
        // In a real app, you would extract the userId from the request (e.g., via session or token).
        // const userId = getUserIdFromRequest(request); 

        // Fetch notifications:
        // For simplicity, we fetch all system-wide ('all') notifications.
        // If you had a userId, the query would be: 
        // { $or: [{ targetUser: 'all' }, { targetUser: userId }] }

        const notifications = await Notification.find({ 
            targetUser: 'all' // Simplified query
        })
        .sort({ createdAt: -1 }) // Newest first
        .select('-__v'); // Exclude Mongoose version field

        // Filter out sensitive fields if necessary before sending

        return NextResponse.json(
            { 
                notifications, 
                count: notifications.length 
            }, 
            { status: 200 } // 200 OK
        );

    } catch (error) {
        console.error("Error fetching notifications:", error);
        return NextResponse.json(
            { message: "Failed to retrieve notifications." }, 
            { status: 500 }
        );
    }
}