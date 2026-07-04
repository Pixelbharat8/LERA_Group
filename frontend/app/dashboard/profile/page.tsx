"use client";

import { useState, useEffect, useRef } from "react";
import Cookies from "js-cookie";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../../lib/api";

const STAFF_ROLES = [
  "SUPER_ADMIN", "SUPERADMIN", "CHAIRMAN", "CEO", "DIRECTOR", "CENTER_MANAGER",
  "CENTER_ADMIN", "ACADEMIC_MANAGER", "ACCOUNTANT", "TEACHER", "STAFF", "TA",
  "TEACHING_ASSISTANT", "ADMIN",
];

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null); // full record from /me/settings, falls back to cookie
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ fullname: "", phone: "", email: "" });
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [students, setStudents] = useState<any[]>([]); // for a PARENT user
  const [studentSelf, setStudentSelf] = useState<any>(null); // for a STUDENT user
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const role = (user?.roleName || user?.role || "").toUpperCase();
  const isStaff = STAFF_ROLES.includes(role);
  const isParent = role === "PARENT";
  const isStudent = role === "STUDENT";

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  async function load() {
    // Seed instantly from the cookie, then hydrate with the authoritative record.
    let cookieUser: any = null;
    const s = Cookies.get("userData");
    if (s) { try { cookieUser = JSON.parse(s); setUser(cookieUser); } catch { /* ignore */ } }

    // GET /me/settings wraps the record as { success, data: user } — unwrap .data.
    const resp = await apiFetch("/api/users/me/settings", {}, { silent: true }).catch(() => null);
    const u = (resp && resp.data) ? resp.data : (cookieUser || {});
    setUser(u);
    setFormData({ fullname: u.fullname || "", phone: u.phone || "", email: u.email || "" });

    const r = (u.roleName || u.role || "").toUpperCase();
    try {
      if (r === "PARENT" && u.id) {
        const kids = await apiFetch(`/api/students/parent/${u.id}`, {}, { silent: true }).catch(() => []);
        setStudents(Array.isArray(kids) ? kids : []);
      } else if (r === "STUDENT") {
        const me = await apiFetch(`/api/students/me`, {}, { silent: true }).catch(() => null);
        setStudentSelf(me);
      }
    } catch { /* non-fatal */ }
    setLoading(false);
  }

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      // Self-service update — the /me/settings endpoint accepts your own edits and strips
      // privileged fields server-side (the admin PUT /api/users/{id} would 403 for most staff).
      await apiFetch(`/api/users/me/settings`, { method: "PUT", body: JSON.stringify(formData) });
      const updated = { ...user, ...formData };
      setUser(updated);
      Cookies.set("userData", JSON.stringify(updated));
      setMsg({ type: "ok", text: "Profile updated." });
    } catch (error) {
      setMsg({ type: "err", text: "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setMsg({ type: "err", text: "Please choose an image file." }); return; }
    if (file.size > 10 * 1024 * 1024) { setMsg({ type: "err", text: "Image must be under 10 MB." }); return; }
    setUploadingAvatar(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      // Self-service avatar endpoint — any authenticated user incl. PARENT (unlike /api/upload/image).
      const up: any = await apiFetch("/api/upload/avatar", { method: "POST", body: fd });
      const url = up?.url;
      if (!url) throw new Error("upload failed");
      // Persist the new avatar on the user (self endpoint; avatarUrl is a permitted self field).
      await apiFetch("/api/users/me/settings", { method: "PUT", body: JSON.stringify({ avatarUrl: url }) });
      const updated = { ...user, avatarUrl: url };
      setUser(updated);
      Cookies.set("userData", JSON.stringify(updated));
      setMsg({ type: "ok", text: "Photo updated." });
    } catch (e) {
      setMsg({ type: "err", text: "Failed to upload photo." });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUpdatePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) { setMsg({ type: "err", text: "Enter your current and new password." }); return; }
    if (passwordData.newPassword.length < 6) { setMsg({ type: "err", text: "New password must be at least 6 characters." }); return; }
    if (passwordData.newPassword !== passwordData.confirmPassword) { setMsg({ type: "err", text: "New password and confirmation do not match." }); return; }

    setUpdatingPassword(true);
    setMsg(null);
    try {
      await apiFetch(`/api/users/me/change-password`, {
        method: "PUT",
        body: JSON.stringify({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword }),
      });
      setMsg({ type: "ok", text: "Password updated." });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      setMsg({ type: "err", text: "Failed to update password (check your current password)." });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const fmtDate = (v: any) => (v ? new Date(v).toLocaleDateString() : "—");
  const pretty = (v: any) => (v == null || v === "" ? "—" : String(v).replace(/_/g, " "));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const initial = (formData.fullname || user?.email || "U").charAt(0).toUpperCase();

  // Employment fields, only rendered when present.
  const employment: [string, any][] = [
    ["Role", user?.roleName || user?.role],
    ["Job title", user?.jobTitle],
    ["Department", user?.departmentName],
    ["Centre", user?.centerName],
    ["Employment type", user?.employmentType && pretty(user.employmentType)],
    ["Reports to", user?.reportsToName],
    ["Status", user?.status],
    ["Member since", user?.createdAt && fmtDate(user.createdAt)],
    ["Last login", user?.lastLogin && fmtDate(user.lastLogin)],
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">👤 My Profile</h1>
          <p className="text-gray-500">Your details, employment info, and account settings</p>
        </div>
        <button onClick={() => router.back()} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">← Back</button>
      </div>

      {msg && (
        <div className={`rounded-lg px-4 py-2 text-sm ${msg.type === "ok" ? "border border-green-200 bg-green-50 text-green-700" : "border border-red-200 bg-red-50 text-red-700"}`}>
          {msg.text}
        </div>
      )}

      {/* Identity header */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-4">
          <div className="relative group shrink-0">
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}
              className="block w-20 h-20 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500" title="Change photo">
              {user?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt={formData.fullname} className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">{initial}</div>
              )}
              <span className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-lg transition">
                {uploadingAvatar ? "…" : "📷"}
              </span>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); }} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{formData.fullname || "—"}</h2>
            <p className="text-gray-500">{user?.email}</p>
            <div className="mt-1 flex flex-wrap gap-2">
              <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">{pretty(user?.roleName || user?.role)}</span>
              {user?.centerName && <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">{user.centerName}</span>}
              {user?.status && <span className={`px-2 py-0.5 text-xs rounded-full ${String(user.status).toUpperCase() === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{pretty(user.status)}</span>}
            </div>
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}
              className="mt-2 text-sm text-blue-600 hover:underline disabled:opacity-50">
              {uploadingAvatar ? "Uploading…" : "📷 Change photo"}
            </button>
          </div>
        </div>
      </div>

      {/* Employment details (staff) */}
      {isStaff && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">🧑‍💼 Employment</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {employment.filter(([, v]) => v).map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-sm text-gray-500">{label}</span>
                <span className="text-sm font-medium text-gray-800 text-right">{pretty(value)}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/dashboard/self-service" className="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">💵 My Payslips</Link>
            <Link href="/dashboard/self-service" className="px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">🕒 My Timesheet</Link>
            <Link href="/dashboard/self-service" className="px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">🏖️ My Leave</Link>
          </div>
        </div>
      )}

      {/* Parent → their students */}
      {isParent && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">🎓 My Students</h2>
          {students.length === 0 ? (
            <p className="text-gray-500 text-sm">No students linked to your account yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {students.map((s) => (
                <div key={s.id} className="border border-gray-100 rounded-lg p-4">
                  <p className="font-semibold text-gray-900">{s.fullname || s.fullnameVi || "Student"}</p>
                  <p className="text-xs text-gray-500">Code: {s.studentCode || "—"}{s.grade ? ` · Grade ${s.grade}` : ""}</p>
                  {s.schoolName && <p className="text-xs text-gray-500">{s.schoolName}</p>}
                  <span className={`mt-2 inline-block px-2 py-0.5 text-xs rounded-full ${String(s.status).toUpperCase() === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{pretty(s.status)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Student → academic card */}
      {isStudent && studentSelf && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">🎓 My Academic Profile</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {([
              ["Student code", studentSelf.studentCode],
              ["Grade", studentSelf.grade],
              ["School", studentSelf.schoolName],
              ["Centre", studentSelf.centerName || studentSelf.centerId],
              ["Enrolled", studentSelf.enrollmentDate && fmtDate(studentSelf.enrollmentDate)],
              ["Status", studentSelf.status],
            ] as [string, any][]).filter(([, v]) => v).map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-sm text-gray-500">{label}</span>
                <span className="text-sm font-medium text-gray-800 text-right">{pretty(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Editable account fields */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">✏️ Edit My Details</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" value={formData.fullname} onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input type="email" value={formData.email} disabled className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-500" />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>
        <div className="mt-6">
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Saving..." : "💾 Save Changes"}
          </button>
        </div>
      </div>

      {/* Password */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">🔒 Change Password</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input type="password" placeholder="Enter current password" value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input type="password" placeholder="Enter new password" value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input type="password" placeholder="Confirm new password" value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <button onClick={handleUpdatePassword} disabled={updatingPassword}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50">
            {updatingPassword ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>
    </div>
  );
}
