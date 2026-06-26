"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "../../../../../lib/api";

interface StudentProfile {
  id: string;
  studentCode: string;
  fullname?: string;
  fullName?: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  avatarUrl: string;
  status: string;
  enrollmentDate: string;
  centerId: string;
  centerName: string;
  currentClassId: string;
  currentClassName: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
}

interface AttendanceStats {
  totalClasses: number;
  present: number;
  absent: number;
  late: number;
  attendanceRate: number;
}

interface ClassHistory {
  id: string;
  className: string;
  classCode?: string;
  programName?: string;
  teacherName: string;
  startDate: string;
  endDate: string;
  status: string;
  attendanceRate: number;
  grade: string;
}

interface Payment {
  id: string;
  invoiceNumber: string;
  amount: number;
  paidAmount: number;
  status: string;
  dueDate: string;
  paidDate: string;
  description: string;
}

interface FileSubmission {
  id: string;
  fileName: string;
  fileType: string;
  uploadDate: string;
  status: string;
  size: string;
}

interface Referral {
  id: string;
  referredStudentName: string;
  referredDate: string;
  status: string;
  reward: number;
}

export default function StudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;
  
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [classHistory, setClassHistory] = useState<ClassHistory[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [files, setFiles] = useState<FileSubmission[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [dateFilter, setDateFilter] = useState("monthly");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<StudentProfile>>({});

  useEffect(() => {
    fetchAllData();
  }, [studentId, dateFilter]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchProfile(),
        fetchAttendanceStats(),
        fetchClassHistory(),
        fetchPayments(),
        fetchFiles(),
        fetchReferrals(),
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const fetchProfile = async () => {
    try {
      const data = await apiFetch(`/api/students/${studentId}`);
      setProfile(data.data || data);
      setEditData(data.data || data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchAttendanceStats = async () => {
    try {
      // Real attendance records from attendance_service, aggregated client-side.
      const data = await apiFetch(`/api/attendance/student/${studentId}`);
      const records: any[] = Array.isArray(data) ? data : (data?.data || []);
      const has = (r: any, kind: string) => new RegExp(kind, "i").test(String(r.status || ""));
      const present = records.filter((r) => has(r, "present")).length;
      const late = records.filter((r) => has(r, "late")).length;
      const absent = records.filter((r) => has(r, "absent")).length;
      const total = records.length;
      // Count "late" as attended for the rate.
      const attendanceRate = total ? Math.round(((present + late) / total) * 100) : 0;
      setAttendanceStats({ totalClasses: total, present, absent, late, attendanceRate });
    } catch (error) {
      console.error("Error fetching attendance:", error);
      setAttendanceStats({ totalClasses: 0, present: 0, absent: 0, late: 0, attendanceRate: 0 });
    }
  };

  const fetchClassHistory = async () => {
    try {
      const data = await apiFetch(`/api/students/${studentId}/class-history`);
      setClassHistory(data.data || data || []);
    } catch (error) {
      console.error("Error fetching class history:", error);
    }
  };

  const fetchPayments = async () => {
    try {
      // Real payments from payment_service (visible to finance-capable roles; empty otherwise).
      const data = await apiFetch(`/api/payments?studentId=${studentId}`);
      setPayments(Array.isArray(data) ? data : (data?.data || data?.content || []));
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  };

  const fetchFiles = async () => {
    try {
      // Real documents from academy student-documents.
      const data = await apiFetch(`/api/student-documents/student/${studentId}`);
      setFiles(Array.isArray(data) ? data : (data?.data || []));
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  const fetchReferrals = async () => {
    try {
      const data = await apiFetch(`/api/students/${studentId}/referrals`);
      setReferrals(data.data || data || []);
    } catch (error) {
      console.error("Error fetching referrals:", error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await apiFetch(`/api/students/${studentId}`, {
        method: "PUT",
        body: JSON.stringify(editData),
      });
      setProfile({ ...profile, ...editData } as StudentProfile);
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
    }
  };

  const paymentsArray = Array.isArray(payments) ? payments : [];
  const totalSpent = paymentsArray.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
  const pendingAmount = paymentsArray.reduce((sum, p) => p.status !== 'PAID' ? sum + (p.amount - (p.paidAmount || 0)) : sum, 0);

  const tabs = [
    { id: "overview", label: "Overview", icon: "👤" },
    { id: "attendance", label: "Attendance", icon: "📅" },
    { id: "classes", label: "Classes", icon: "📚" },
    { id: "payments", label: "Payments", icon: "💰" },
    { id: "files", label: "Files", icon: "📁" },
    { id: "referrals", label: "Referrals", icon: "🎁" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
              {(profile?.fullname || profile?.fullName || "S").charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{profile?.fullname || profile?.fullName}</h1>
              <p className="text-gray-500">Student Code: {profile?.studentCode}</p>
              <div className="flex gap-4 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  profile?.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                  profile?.status === 'INACTIVE' ? 'bg-gray-100 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {profile?.status}
                </span>
                <span className="text-gray-500">📍 {profile?.centerName}</span>
                <span className="text-gray-500">📚 {profile?.currentClassName}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              ← Back
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-5 gap-4 mt-6">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{attendanceStats?.attendanceRate || 0}%</p>
            <p className="text-sm text-gray-600">Attendance Rate</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{Array.isArray(classHistory) ? classHistory.length : 0}</p>
            <p className="text-sm text-gray-600">Total Classes</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{totalSpent.toLocaleString()}đ</p>
            <p className="text-sm text-gray-600">Total Spent</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{Array.isArray(files) ? files.length : 0}</p>
            <p className="text-sm text-gray-600">Files Submitted</p>
          </div>
          <div className="bg-pink-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-pink-600">{Array.isArray(referrals) ? referrals.length : 0}</p>
            <p className="text-sm text-gray-600">Referrals</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="flex border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Date Filter */}
        {(activeTab === "attendance" || activeTab === "payments") && (
          <div className="p-4 border-b flex gap-2">
            {["daily", "weekly", "monthly", "yearly"].map((filter) => (
              <button
                key={filter}
                onClick={() => setDateFilter(filter)}
                className={`px-4 py-2 rounded-lg capitalize ${
                  dateFilter === filter
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        )}

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Personal Information</h3>
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-600">Full Name</label>
                      <input
                        type="text"
                        value={editData.fullname || editData.fullName || ""}
                        onChange={(e) => setEditData({ ...editData, fullname: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600">Email</label>
                      <input
                        type="email"
                        value={editData.email || ""}
                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600">Phone</label>
                      <input
                        type="tel"
                        value={editData.phone || ""}
                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600">Address</label>
                      <textarea
                        value={editData.address || ""}
                        onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <button
                      onClick={handleSaveProfile}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Save Changes
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p><span className="text-gray-500">Email:</span> {profile?.email}</p>
                    <p><span className="text-gray-500">Phone:</span> {profile?.phone}</p>
                    <p><span className="text-gray-500">Date of Birth:</span> {profile?.dateOfBirth}</p>
                    <p><span className="text-gray-500">Gender:</span> {profile?.gender}</p>
                    <p><span className="text-gray-500">Address:</span> {profile?.address}</p>
                    <p><span className="text-gray-500">Enrollment Date:</span> {profile?.enrollmentDate}</p>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Parent/Guardian Information</h3>
                <div className="space-y-3">
                  <p><span className="text-gray-500">Parent Name:</span> {profile?.parentName}</p>
                  <p><span className="text-gray-500">Parent Phone:</span> {profile?.parentPhone}</p>
                  <p><span className="text-gray-500">Parent Email:</span> {profile?.parentEmail}</p>
                </div>
              </div>
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === "attendance" && (
            <div>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-3xl font-bold text-green-600">{attendanceStats?.present || 0}</p>
                  <p className="text-gray-600">Present</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-3xl font-bold text-red-600">{attendanceStats?.absent || 0}</p>
                  <p className="text-gray-600">Absent</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-3xl font-bold text-yellow-600">{attendanceStats?.late || 0}</p>
                  <p className="text-gray-600">Late</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-3xl font-bold text-blue-600">{attendanceStats?.totalClasses || 0}</p>
                  <p className="text-gray-600">Total Classes</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Attendance Rate</h4>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-green-500 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${attendanceStats?.attendanceRate || 0}%` }}
                  ></div>
                </div>
                <p className="text-right text-sm text-gray-600 mt-1">{attendanceStats?.attendanceRate || 0}%</p>
              </div>
            </div>
          )}

          {/* Classes Tab */}
          {activeTab === "classes" && (
            <div>
              <h3 className="font-semibold mb-4">Class History (Including Switched Classes)</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">Class</th>
                      <th className="px-4 py-3 text-left">Teacher</th>
                      <th className="px-4 py-3 text-left">Duration</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Attendance</th>
                      <th className="px-4 py-3 text-left">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Array.isArray(classHistory) && classHistory.length > 0) ? classHistory.map((cls) => (
                      <tr key={cls.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium">{cls.className}</p>
                          {cls.programName && (
                            <p className="text-sm text-gray-500">{cls.programName}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">{cls.teacherName}</td>
                        <td className="px-4 py-3">
                          <p>{cls.startDate}</p>
                          <p className="text-sm text-gray-500">to {cls.endDate || 'Present'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-sm ${
                            cls.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                            cls.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {cls.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">{cls.attendanceRate}%</td>
                        <td className="px-4 py-3">{cls.grade || '-'}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          No class history found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === "payments" && (
            <div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-green-600">{totalSpent.toLocaleString()}đ</p>
                  <p className="text-gray-600">Total Paid</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-red-600">{pendingAmount.toLocaleString()}đ</p>
                  <p className="text-gray-600">Pending</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-blue-600">{paymentsArray.length}</p>
                  <p className="text-gray-600">Total Invoices</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">Invoice</th>
                      <th className="px-4 py-3 text-left">Description</th>
                      <th className="px-4 py-3 text-left">Amount</th>
                      <th className="px-4 py-3 text-left">Paid</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentsArray.length > 0 ? paymentsArray.map((payment) => (
                      <tr key={payment.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{payment.invoiceNumber}</td>
                        <td className="px-4 py-3">{payment.description}</td>
                        <td className="px-4 py-3">{payment.amount?.toLocaleString()}đ</td>
                        <td className="px-4 py-3">{payment.paidAmount?.toLocaleString()}đ</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-sm ${
                            payment.status === 'PAID' ? 'bg-green-100 text-green-800' :
                            payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">{payment.dueDate}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          No payment records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Files Tab */}
          {activeTab === "files" && (
            <div>
              <div className="grid grid-cols-4 gap-4">
                {(Array.isArray(files) && files.length > 0) ? files.map((file) => (
                  <div key={file.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="text-4xl mb-2">
                      {file.fileType?.includes('pdf') ? '📄' :
                       file.fileType?.includes('image') ? '🖼️' :
                       file.fileType?.includes('doc') ? '📝' : '📎'}
                    </div>
                    <p className="font-medium truncate">{file.fileName}</p>
                    <p className="text-sm text-gray-500">{file.uploadDate}</p>
                    <p className="text-sm text-gray-500">{file.size}</p>
                    <span className={`inline-block mt-2 px-2 py-1 rounded text-xs ${
                      file.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      file.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {file.status}
                    </span>
                  </div>
                )) : (
                  <div className="col-span-4 text-center py-8 text-gray-500">
                    No files submitted yet
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Referrals Tab */}
          {activeTab === "referrals" && (
            <div>
              <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg p-6 text-white mb-6">
                <h3 className="text-xl font-bold mb-2">Referral Program</h3>
                <p>Total Referrals: {Array.isArray(referrals) ? referrals.length : 0}</p>
                <p>Total Rewards: {(Array.isArray(referrals) ? referrals : []).reduce((sum, r) => sum + (r.reward || 0), 0).toLocaleString()}đ</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">Referred Student</th>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Reward</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Array.isArray(referrals) && referrals.length > 0) ? referrals.map((ref) => (
                      <tr key={ref.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">{ref.referredStudentName}</td>
                        <td className="px-4 py-3">{ref.referredDate}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-sm ${
                            ref.status === 'CONVERTED' ? 'bg-green-100 text-green-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {ref.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">{ref.reward?.toLocaleString()}đ</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                          No referrals yet. Share your referral code to earn rewards!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
