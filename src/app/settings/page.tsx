"use client";

import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "@/lib/hooks/useAuth";
import { Loader2, Key, CheckCircle, AlertTriangle , ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
const InputField: React.FC<{
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
}> = ({ label, type = "password", value, onChange, placeholder }) => (
  <div className="space-y-1 w-full">
    <label className="text-sm font-medium text-indigo-300">{label}</label>
    <input
      type={type}
      value={value || ""}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-4 py-2 bg-slate-900 border border-indigo-700/50 rounded-lg text-white placeholder-gray-500 
                 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition duration-150 ease-in-out"
    />
  </div>
);

const Message: React.FC<{ type: "success" | "error"; text: string }> = ({ type, text }) => {
  if (!text) return null;
  const color =
    type === "success"
      ? "bg-green-600/20 text-green-300 border-green-600"
      : "bg-red-600/20 text-red-300 border-red-600";
  return (
    <div className={`p-4 rounded-lg border flex items-center gap-3 ${color}`}>
      {type === "error" && <AlertTriangle className="w-5 h-5" />}
      {type === "success" && <CheckCircle className="w-5 h-5" />}
      <span>{text}</span>
    </div>
  );
};

export default function ChangePasswordPage() {
  const { user } = useAuth();
  const userId = user?.id;
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: "error", text: "All fields are required." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New password and confirmation do not match." });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await axios.patch(`/api/users/${userId}/change-password`, {
        currentPassword,
        newPassword,
      });

      setMessage({ type: "success", text: res.data.message || "Password changed successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const errMsg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to change password.";
      setMessage({ type: "error", text: errMsg });
    } finally {
      setLoading(false);
    }
  };

  if (!userId) return <Message type="error" text="You must be logged in." />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md space-y-6 p-6 bg-slate-900 border border-indigo-800 rounded-3xl shadow-lg">
                <header className="pb-4 border-b border-indigo-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-indigo-400 flex items-center gap-2">
          <Key className="w-6 h-6" /> Change Password
        </h1>
          <button
      onClick={() => router.back()}
      className="text-indigo-400 hover:text-blue-800 cursor-pointer transition flex items-center gap-1 text-lg"
    >
      <ArrowLeft className="w-6 h-6" /> Back 
    </button>
    </header>

        <Message type={message.type as any} text={message.text} />

        <InputField
          label="Current Password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Enter current password"
        />
        <InputField
          label="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Enter new password"
        />
        <InputField
          label="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
        />

        <button
          onClick={handleChangePassword}
          disabled={loading}
          className={`w-full flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-xl 
                      text-white transition-all duration-200
                      ${loading ? "bg-gray-600 cursor-not-allowed" : "bg-blue-800 hover:bg-blue-900 shadow-lg hover:shadow-blue-500/30"}`}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Update Password"}
        </button>
      </div>
    </div>
  );
}