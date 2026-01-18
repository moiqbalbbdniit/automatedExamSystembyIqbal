import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db"; 
import Contact from "@/lib/models/Contact";

export async function POST(req: Request) {
    try {
        await connectDB();

        const body = await req.json();
        const { name, email, university, message } = body;

        if (!name || !email || !university || !message) {
            return NextResponse.json(
                { message: "All fields are required." },
                { status: 400 }
            );
        }

        const newContact = await Contact.create({ name, email, university, message });

        return NextResponse.json({ message: "Contact request submitted successfully!", contact: newContact });
    } catch (error: any) {
        console.error("Contact API error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}