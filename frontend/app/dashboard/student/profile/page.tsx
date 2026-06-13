"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { resolveMyStudent } from "../../../../lib/student-context";

interface ProfileData {
  id: string;
  fullname: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  country?: string;
  studentCode?: string;
  enrollmentDate?: string;
  status?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  profileImage?: string;
  centerName?: string;
}

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<ProfileData>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const studentData = await resolveMyStudent();
      const authUserId = studentData?.userId;
      const userDataFetch = authUserId
        ? await apiFetch(`/api/users/${authUserId}`).catch(() => null)
        : null;

      if (studentData) {
        setProfile({
          id: studentData.id,
          fullname: studentData.fullname || studentData.fullName || `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim(),
          firstName: studentData.firstName,
          lastName: studentData.lastName,
          email: studentData.email || userDataFetch?.email,
          phone: studentData.phone,
          dateOfBirth: studentData.dateOfBirth || studentData.date_of_birth,
          gender: studentData.gender,
          address: studentData.address,
          city: studentData.city,
          country: studentData.country || "Vietnam",
          studentCode: studentData.studentCode || studentData.student_code,
          enrollmentDate: studentData.enrollmentDate || studentData.created_at,
          status: studentData.status || "ACTIVE",
          emergencyContact: studentData.emergencyContact || studentData.emergency_contact,
          emergencyPhone: studentData.emergencyPhone || studentData.emergency_phone,
          profileImage: studentData.profileImage || studentData.avatar,
          centerName: studentData.center?.name || studentData.centerName
        });
        setFormData(studentData);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile?.id) return;
    
    setSaving(true);
    setMessage(null);
    
    try {
      await apiFetch(`/api/students/${profile.id}`, {
        method: "PUT",
        body: JSON.stringify(formData)
      });
      
      setProfile({ ...profile, ...formData });
      setEditing(false);
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to update profile. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(profile || {});
    setEditing(false);
    setMessage(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard/student" className="hover:text-blue-600">Dashboard</Link>
          <span>/</span>
          <span className="text-gray-900">My Profile</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">👤 My Profile</h1>
            <p className="text-gray-500 mt-1">View and manage your personal information</p>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              ✏️ Edit Profile
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {message.type === "success" ? "✅" : "❌"} {message.text}
        </div>
      )}

      {/* Profile Header Card */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl text-blue-600 font-bold">
            {profile?.fullname?.charAt(0) || "S"}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{profile?.fullname}</h2>
            <p className="opacity-90">Student Code: {profile?.studentCode}</p>
            <p className="opacity-75 text-sm">{profile?.centerName}</p>
            <div className="mt-2 flex gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                profile?.status === "ACTIVE" ? "bg-green-400 text-green-900" : "bg-gray-400 text-gray-900"
              }`}>
                {profile?.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span>📋</span> Personal Information
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">First Name</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.firstName || ""}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="font-medium">{profile?.firstName || "—"}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Last Name</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.lastName || ""}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="font-medium">{profile?.lastName || "—"}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">Email</label>
              <p className="font-medium">{profile?.email || "—"}</p>
              <p className="text-xs text-gray-400">Email cannot be changed</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Phone</label>
                {editing ? (
                  <input
                    type="tel"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="font-medium">{profile?.phone || "—"}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Date of Birth</label>
                {editing ? (
                  <input
                    type="date"
                    value={formData.dateOfBirth?.split("T")[0] || ""}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="font-medium">
                    {profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : "—"}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">Gender</label>
              {editing ? (
                <select
                  value={formData.gender || ""}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <p className="font-medium">{profile?.gender || "—"}</p>
              )}
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span>📍</span> Address
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Street Address</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.address || ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="font-medium">{profile?.address || "—"}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">City</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.city || ""}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="font-medium">{profile?.city || "—"}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Country</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.country || ""}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="font-medium">{profile?.country || "—"}</p>
                )}
              </div>
            </div>
          </div>

          <h3 className="text-lg font-bold mt-6 mb-4 flex items-center gap-2">
            <span>🚨</span> Emergency Contact
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Contact Name</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.emergencyContact || ""}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="font-medium">{profile?.emergencyContact || "—"}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Contact Phone</label>
              {editing ? (
                <input
                  type="tel"
                  value={formData.emergencyPhone || ""}
                  onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="font-medium">{profile?.emergencyPhone || "—"}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Academic Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span>🎓</span> Academic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1">Student Code</label>
            <p className="font-medium text-blue-600">{profile?.studentCode || "—"}</p>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Enrollment Date</label>
            <p className="font-medium">
              {profile?.enrollmentDate ? new Date(profile.enrollmentDate).toLocaleDateString() : "—"}
            </p>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Center</label>
            <p className="font-medium">{profile?.centerName || "—"}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {editing && (
        <div className="flex justify-end gap-4">
          <button
            onClick={handleCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
}
