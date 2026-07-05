"use client";

import { useState } from "react";
import Cookies from "js-cookie";
import { apiFetch } from "../../../lib/api";

/**
 * Forced first-login password change. Auto-provisioned import accounts (imported students' parents /
 * teachers) ship with a shared default password and land here after login; they can't enter the app
 * until they set a new password. The change-password call clears the server-side flag.
 */
export default function ForcedChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!currentPassword) { setError("Enter your current (temporary) password."); return; }
    if (newPassword.length < 6) { setError("New password must be at least 6 characters."); return; }
    if (newPassword === currentPassword) { setError("Choose a password different from the temporary one."); return; }
    if (newPassword !== confirm) { setError("The new passwords don't match."); return; }
    setSubmitting(true);
    try {
      await apiFetch("/api/users/me/change-password", {
        method: "PUT",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      // Clear the cached flag so the dashboard guard lets us through.
      try {
        const ud = JSON.parse(Cookies.get("userData") || "{}");
        ud.passwordChangeRequired = false;
        Cookies.set("userData", JSON.stringify(ud));
      } catch { /* ignore */ }
      window.location.href = "/dashboard";
    } catch (e: any) {
      setError(e?.message || "Couldn't change the password — check your current password and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">🔐 Set your password</h1>
        <p className="text-sm text-gray-500 mb-4">
          Your account was created with a temporary password. Choose a new one to continue.
        </p>
        {error && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Current (temporary) password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" autoFocus />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">New password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Confirm new password</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <button type="submit" disabled={submitting}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {submitting ? "Saving…" : "Set password & continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
