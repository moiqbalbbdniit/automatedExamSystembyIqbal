import { NextResponse } from "next/server";
import UserModel from "@/lib/models/User";
import { connectDB } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET(req: Request, context: { params: Promise<{ id: string }>  }) {

  const { id } =  await context.params; 
  
  if (!id) {
    return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
  }
  
  try {
    await connectDB();
    const user = await UserModel.findById(id).select("-password");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(user, { status: 200 });

  } catch (err: any) {
    console.error("GET /api/users/[id] error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch user" }, { status: 500 });
  }
}


export async function PATCH(req: Request , context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    // const id = url.pathname.split("/").pop();
    const {id} =  await context.params;

    if (!id) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    console.log("PATCH request for user ID:", id);

    const data = await req.json();
    const { firstName, lastName, email, role, status, password, username,
        // --- NEW DESTRUCTURED FIELDS ---
        phone, address, zipCode, country, language 

     } = data;

    // Build update object dynamically
    const updateData: Record<string, any> = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (status) updateData.status = status;
    if (username) updateData.username = username;
        if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (zipCode !== undefined) updateData.zipCode = zipCode;
    if (country !== undefined) updateData.country = country;
    if (language !== undefined) updateData.language = language;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    const updatedUser = await UserModel.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.log("Update data sent to DB:", updateData);

    return NextResponse.json({ message: "User updated successfully", user: updatedUser }, { status: 200 });
  } catch (err) {
    console.error("PATCH /api/users/[id] error:", err);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}



// delete a users 
export async function DELETE(req: Request) {
  try {
    await connectDB();

    // Extract id from URL manually
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop(); // gets the [id] from /api/users/[id]

    if (!id) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    const deletedUser = await UserModel.findByIdAndDelete(id);
    if (!deletedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "User deleted successfully" }, { status: 200 });
  } catch (err) {
    console.error("DELETE /api/users/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}