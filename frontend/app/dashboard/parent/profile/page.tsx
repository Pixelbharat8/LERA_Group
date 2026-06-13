"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { loadMyChildren, resolveMyParentProfile, resolveMyParentUserId } from "../../../../lib/parent-context";

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
  occupation?: string;
  workplace?: string;
  relationship?: string;
  profileImage?: string;
  children?: ChildInfo[];
}

interface ChildInfo {
  id: string;
  fullname: string;
  studentCode: string;
  className?: string;
}

export default function ParentProfilePage() {
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
      const userId = await resolveMyParentUserId();
      const userDataFetch = userId
        ? await apiFetch(`/api/users/${userId}`).catch(() => null)
        : null;
      const parentData = await resolveMyParentProfile();

      const childRows = await loadMyChildren();
      const children: ChildInfo[] = childRows.map((s) => ({
        id: s.id,
        fullname: s.fullname || "Student",
        studentCode: s.studentCode || "",
        className: s.className,
      }));

      const data = parentData || userDataFetch;
      
      if (data) {

        setProfile({
          id: data.id,
          fullname: data.fullname || data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          dateOfBirth: data.dateOfBirth || data.date_of_birth,
          gender: data.gender,
          address: data.address,
          city: data.city,
          country: data.country || "Vietnam",
          occupation: data.occupation,
          workplace: data.workplace,
          relationship: data.relationship || "Parent",
          profileImage: data.profileImage || data.avatar,
          children: children.length > 0 ? children : undefined
        });
        setFormData(data);
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
      await apiFetch(`/api/users/${profile.id}`, {
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
          <Link href="/dashboard/parent" className="hover:text-blue-600">Dashboard</Link>
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
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl text-purple-600 font-bold">
            {profile?.fullname?.charAt(0) || "P"}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{profile?.fullname}</h2>
            <p className="opacity-90">{profile?.relationship} • {profile?.occupation}</p>
            <p className="opacity-75 text-sm">{profile?.workplace}</p>
            <div className="mt-2 flex gap-2">
              <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold">
                👶 {profile?.children?.length || 0} Children
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

            <div className="grid grid-cols-2 gap-4">
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
              <div>
                <label className="block text-sm text-gray-500 mb-1">Relationship</label>
                {editing ? (
                  <select
                    value={formData.relationship || ""}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select...</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Grandparent">Grandparent</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <p className="font-medium">{profile?.relationship || "—"}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Work & Address */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span>💼</span> Work Information
          </h3>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Occupation</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.occupation || ""}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="font-medium">{profile?.occupation || "—"}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Workplace</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.workplace || ""}
                  onChange={(e) => setFormData({ ...formData, workplace: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="font-medium">{profile?.workplace || "—"}</p>
              )}
            </div>
          </div>

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
        </div>
      </div>

      {/* Children Information */}
      {profile?.children && profile.children.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span>👶</span> My Children
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profile.children.map((child) => (
              <Link
                key={child.id}
                href={`/dashboard/parent/children?studentId=${child.id}`}
                className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                    {child.fullname.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold">{child.fullname}</div>
                    <div className="text-sm text-gray-500">{child.studentCode}</div>
                    {child.className && (
                      <div className="text-xs text-gray-400">{child.className}</div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

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
