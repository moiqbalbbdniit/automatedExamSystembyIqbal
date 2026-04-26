import { NextRequest, NextResponse } from "next/server";
import UserModel from "@/lib/models/User";
import { connectDB } from "@/lib/db";
import bcrypt from "bcryptjs";
import FacultyClassSection from "@/lib/models/FacultyClassSection";
import { authorizeApiRoles } from "@/lib/apiAuth";

const canAccessUser = async (actor: { id: string; role: string }, target: any) => {
  if (!target) return false;
  if (actor.role === "admin") return target.role === "faculty";
  if (actor.role === "faculty") {
    if (target.role !== "student") return false;
    const assignments = await FacultyClassSection.find({
      facultyUserId: actor.id,
      isActive: true,
    })
      .select("course section")
      .lean();

    const allowed = new Set(
      (assignments as Array<{ course: unknown; section: unknown }>).map(
        (item) => `${String(item.course)}|${String(item.section)}`
      )
    );

    return allowed.has(`${String(target.course)}|${String(target.section)}`);
  }

  return actor.id === String(target._id);
};

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }>  }) {

  const auth = authorizeApiRoles(req, ["admin", "faculty", "student"]);
  if (!auth.ok) return auth.response;

  const { id } =  await context.params; 
  
  if (!id) {
    return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
  }
  
  try {
    await connectDB();
    const user = await UserModel.findById(id).select("-password");

    const selfAccess = auth.user.id === id;
    if (!selfAccess) {
      const allowed = await canAccessUser(auth.user, user);
      if (!allowed) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(user, { status: 200 });

  } catch (err: any) {
    console.error("GET /api/users/[id] error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch user" }, { status: 500 });
  }
}


export async function PATCH(req: NextRequest , context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const auth = authorizeApiRoles(req, ["admin", "faculty", "student"]);
    if (!auth.ok) return auth.response;

    const {id} =  await context.params;

    if (!id) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    console.log("PATCH request for user ID:", id);

    const existingUser = await UserModel.findById(id).select("role course section").lean();
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const selfAccess = auth.user.id === id;
    if (!selfAccess) {
      const allowed = await canAccessUser(auth.user, existingUser);
      if (!allowed) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

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
    if (role && auth.user.role === "admin") updateData.role = role;
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
export async function DELETE(req: NextRequest) {
  try {
    const auth = authorizeApiRoles(req, ["admin", "faculty"]);
    if (!auth.ok) return auth.response;

    await connectDB();

    // Extract id from URL manually
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop(); // gets the [id] from /api/users/[id]

    if (!id) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    const targetUser = await UserModel.findById(id).select("_id role course section").lean();
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const allowed = await canAccessUser(auth.user, targetUser);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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