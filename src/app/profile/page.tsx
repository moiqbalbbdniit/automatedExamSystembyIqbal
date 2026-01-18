"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import axios from "axios";
import { Loader2, User, Mail, Save, AlertTriangle, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const Input: React.FC<{
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  disabled?: boolean;
  name: string;
}> = ({ label, type = "text", value, onChange, placeholder, disabled = false, name }) => (
  <div className="space-y-1 w-full">
    <label className="text-sm font-medium text-indigo-300">{label}</label>
    <input
      type={type}
      name={name}
      value={value || ""}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-4 py-2 bg-slate-900 border border-indigo-700/50 rounded-lg text-white placeholder-gray-500 
                 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition duration-150 ease-in-out disabled:opacity-50"
    />
  </div>
);



const Button: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}> = ({ children, onClick, disabled = false, className = "" }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-xl 
                transition-all duration-200 text-white
                ${disabled ? "bg-gray-600 cursor-not-allowed" : "bg-blue-800 hover:bg-blue-900 shadow-lg hover:shadow-blue-500/30"} 
                ${className}`}
  >
    {children}
  </button>
);

const Message: React.FC<{ type: string; text: string }> = ({ type, text }) => {
  if (!text) return null;
  const color =
    type === "success"
      ? "bg-green-600/20 text-green-300 border-green-600"
      : "bg-red-600/20 text-red-300 border-red-600";
  return (
    <div className={`p-4 rounded-lg border flex items-center gap-3 ${color}`}>
      {type === "error" && <AlertTriangle className="w-5 h-5" />}
      {text}
    </div>
  );
};

export default function ProfileEditPage() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    role: "",
    phone: "",
    address: "",
    zipCode: "",
    country: "",
    language: "",
  });

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      setMessage({ type: "error", text: "You must be logged in to view this page." });
      setLoading(false);
      return;
    }
    fetchUserData();
  }, [userId, authLoading]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/users/${userId}`);
      const userData = res.data.user || res.data;
      setForm({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        username: userData.username || "",
        email: userData.email || "",
        role: userData.role || "student",
        phone: userData.phone || "",
        address: userData.address || "",
        zipCode: userData.zipCode || "",
        country: userData.country || "",
        language: userData.language || "",
      });
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch user data:", err);
      setMessage({
        type: "error",
        text: "Failed to load profile data. Ensure GET /api/users/[id] exists.",
      });
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setMessage({ type: "", text: "" });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const payload = { ...form };
      const res = await axios.patch(`/api/users/${userId}`, payload);
      setMessage({ type: "success", text: res.data.message || "Profile updated successfully!" });
    } catch (err) {
      console.error("Profile update failed:", err);
      const errMsg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "An unexpected error occurred during update.";
      setMessage({ type: "error", text: errMsg });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-indigo-400">
        <Loader2 className="w-8 h-8 animate-spin mr-2" /> Loading Profile...
      </div>
    );

  if (!userId)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-8">
        <Message type="error" text="Session expired or user not logged in." />
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 sm:px-6 lg:px-10 py-10">
      <div className="max-w-3xl mx-auto space-y-8 p-6 sm:p-8 lg:p-10 bg-slate-900 border border-indigo-900 rounded-3xl shadow-2xl shadow-indigo-900/20">
        {/* Header */}
        <header className="pb-4 border-b border-indigo-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-400 flex items-center gap-3">
            <User className="w-6 h-6 sm:w-7 sm:h-7" /> Edit Your Profile
          </h1>
         <button
      onClick={() => router.back()}
      className="text-indigo-400 hover:text-blue-800 cursor-pointer transition flex items-center gap-1 text-sm"
    >
      <ArrowLeft className="w-4 h-4" /> Back To Dashboard
    </button>
        </header>

        <Message type={message.type} text={message.text} />

        {/* Basic Info */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
          <Input label="First Name" name="firstName" value={form.firstName} onChange={handleChange} placeholder="e.g., Alex" />
          <Input label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} placeholder="e.g., Johnson" />
          <Input label="Username" name="username" value={form.username} disabled onChange={handleChange} placeholder="Unique system ID" />
          <Input label="Role" name="role" value={form.role.toUpperCase()} disabled onChange={handleChange} placeholder="Student/Faculty/Admin" />
          <div className="sm:col-span-2">
            <Input label="Email Address" type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@university.edu" />
          </div>
        </section>

        {/* Contact Info */}
        <section className="space-y-4 pt-4 border-t border-indigo-900">
          <h2 className="text-xl font-semibold text-indigo-300 flex items-center gap-2">
            <Mail className="w-5 h-5 text-teal-400" /> Contact & Location
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            <Input label="Phone Number" type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" />
            <Input label="Country" name="country" value={form.country} onChange={handleChange} placeholder="India" />
            <Input label="Language" name="language" value={form.language} onChange={handleChange} placeholder="English" />
            <Input label="Zip Code" name="zipCode" value={form.zipCode} onChange={handleChange} placeholder="e.g., 110001" />
            <div className="sm:col-span-2">
              <Input label="Street Address" name="address" value={form.address} onChange={handleChange} placeholder="123 Main St, Apt 4B" />
            </div>
          </div>
        </section>

        <div className="flex justify-center sm:justify-end pt-4">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Saving Changes...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" /> Save Profile
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}