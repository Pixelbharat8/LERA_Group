"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "../../../../../lib/api";

interface Parent {
  id: string;
  parentCode: string;
  userId: string;
  fullName?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  occupation?: string;
  workAddress?: string;
  address?: string;
  relationship?: string;
  status: string;
  createdAt?: string;
}

interface Child {
  id: string;
  fullname: string;
  studentCode: string;
  className?: string;
  classId?: string;
  status: string;
  attendanceRate?: number;
}

interface Payment {
  id: string;
  description?: string;
  amount: number;
  date?: string;
  paymentDate?: string;
  createdAt?: string;
  status: string;
  studentName?: string;
}

interface Communication {
  id: string;
  type: string;
  subject?: string;
  title?: string;
  message?: string;
  date?: string;
  createdAt?: string;
  status: string;
}

export default function ParentProfilePage() {
  const params = useParams();
  const parentId = params.id as string;
  
  const [parent, setParent] = useState<Parent | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [dateFilter, setDateFilter] = useState("monthly");

  // Real data from APIs
  const [children, setChildren] = useState<Child[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [stats, setStats] = useState({
    totalChildren: 0,
    totalPaid: 0,
    pendingAmount: 0,
    attendanceRate: 0,
    totalReferrals: 0,
    presentDays: 0,
    absentDays: 0,
    lateDays: 0
  });

  useEffect(() => {
    fetchAllData();
  }, [parentId]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch parent profile
      const parentData = await apiFetch(`/api/parents/${parentId}`).catch(() => null);
      
      let enrichedParent = parentData;
      if (parentData?.userId) {
        // Fetch user details to get name, email, phone
        const userData = await apiFetch(`/api/users/${parentData.userId}`).catch(() => null);
        if (userData) {
          enrichedParent = {
            ...parentData,
            fullName: userData.fullname || userData.name,
            email: userData.email,
            phone: userData.phone
          };
        }
      }
      
      setParent(enrichedParent);

      // Fetch children via student-parents relationship
      const studentParentsData = await apiFetch(`/api/student-parents?parentId=${parentId}`).catch(() => []);
      const studentParents = Array.isArray(studentParentsData) ? studentParentsData : [];
      
      // Fetch details for each child
      const childrenPromises = studentParents.map(async (sp: { studentId: string; relationship?: string }) => {
        const studentData = await apiFetch(`/api/students/${sp.studentId}`).catch(() => null);
        if (studentData) {
          // Get student name from user if available
          let fullname = studentData.fullname || "Unknown";
          if (studentData.userId) {
            const userData = await apiFetch(`/api/users/${studentData.userId}`).catch(() => null);
            if (userData) {
              fullname = userData.fullname || userData.name || fullname;
            }
          }
          
          // Get class info
          let className = "";
          if (studentData.classId) {
            const classData = await apiFetch(`/api/classes/${studentData.classId}`).catch(() => null);
            if (classData) {
              className = classData.name;
            }
          }
          
          // Get attendance for this student
          const attendanceData = await apiFetch(`/api/attendance?studentId=${sp.studentId}`).catch(() => []);
          const attendanceRecords = Array.isArray(attendanceData) ? attendanceData : [];
          const presentCount = attendanceRecords.filter((a: { status: string }) => a.status === "PRESENT").length;
          const totalRecords = attendanceRecords.length || 1;
          
          return {
            id: studentData.id,
            fullname,
            studentCode: studentData.studentCode || `STU${studentData.id.slice(-4)}`,
            className,
            classId: studentData.classId,
            status: studentData.status || "ACTIVE",
            attendanceRate: Math.round((presentCount / totalRecords) * 100)
          };
        }
        return null;
      });
      
      const childrenData = (await Promise.all(childrenPromises)).filter(Boolean) as Child[];
      setChildren(childrenData);

      // Fetch payments for children
      let allPayments: Payment[] = [];
      let totalPaid = 0;
      let pendingAmount = 0;
      
      for (const child of childrenData) {
        const paymentsData = await apiFetch(`/api/payments?studentId=${child.id}`).catch(() => []);
        const studentPayments = Array.isArray(paymentsData) ? paymentsData : [];
        
        studentPayments.forEach((p: Payment) => {
          allPayments.push({
            ...p,
            description: p.description || `Payment - ${child.fullname}`,
            studentName: child.fullname
          });
          
          if (p.status === "PAID" || p.status === "COMPLETED") {
            totalPaid += p.amount || 0;
          } else if (p.status === "PENDING") {
            pendingAmount += p.amount || 0;
          }
        });
      }
      
      setPayments(allPayments.sort((a, b) => 
        new Date(b.paymentDate || b.createdAt || '').getTime() - new Date(a.paymentDate || a.createdAt || '').getTime()
      ));

      // Fetch communications/notifications for parent
      // Backend: GET /api/notifications/user/{userId} (no query param support)
      const userId = parentData?.userId || parentId;
      const communicationsData = await apiFetch(`/api/notifications/user/${userId}`).catch(() => []);
      setCommunications(Array.isArray(communicationsData) ? communicationsData : []);

      // Calculate attendance stats
      let totalPresent = 0;
      let totalAbsent = 0;
      let totalLate = 0;
      let totalAttendance = 0;
      
      childrenData.forEach(child => {
        totalAttendance += child.attendanceRate || 0;
      });
      
      const avgAttendance = childrenData.length > 0 ? Math.round(totalAttendance / childrenData.length) : 0;

      // Fetch referrals count
      const referralsData = await apiFetch(`/api/referrals?parentId=${parentId}`).catch(() => []);
      const referralsCount = Array.isArray(referralsData) ? referralsData.length : 0;

      setStats({
        totalChildren: childrenData.length,
        totalPaid,
        pendingAmount,
        attendanceRate: avgAttendance,
        totalReferrals: referralsCount,
        presentDays: 0, // Would need detailed calculation
        absentDays: 0,
        lateDays: 0
      });

    } catch (error) {
      console.error("Error fetching parent data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "children", label: "Children", icon: "👨‍👧‍👦" },
    { id: "payments", label: "Payments", icon: "💳" },
    { id: "attendance", label: "Attendance", icon: "📅" },
    { id: "communications", label: "Communications", icon: "📧" },
    { id: "referrals", label: "Referrals", icon: "🎁" },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/superadmin" className="hover:text-blue-600">Dashboard</Link>
        <span>/</span>
        <Link href="/dashboard/academy/parents" className="hover:text-blue-600">Parents</Link>
        <span>/</span>
        <span className="text-gray-900">{parent?.fullName || "Parent Profile"}</span>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-4xl">
              👨‍👩‍👧
            </div>
            <div>
              <h1 className="text-2xl font-bold">{parent?.fullName || "Parent Name"}</h1>
              <p className="text-orange-200">Code: {parent?.parentCode || "N/A"} • {parent?.relationship}</p>
              <p className="text-orange-200">{parent?.occupation}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm ${parent?.status === "ACTIVE" ? "bg-green-500" : "bg-gray-500"}`}>
                  {parent?.status || "ACTIVE"}
                </span>
                <span className="text-sm">📧 {parent?.email}</span>
                <span className="text-sm">📞 {parent?.phone}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => { window.location.href = "/dashboard/academy/parents"; }}
            className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
          >
            ✏️ Edit Profile
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">👨‍👧‍👦</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalChildren}</p>
              <p className="text-xs text-gray-500">Children</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-xl">💰</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">${stats.totalPaid.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Total Paid</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-xl">⏳</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">${stats.pendingAmount}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center text-xl">📈</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.attendanceRate}%</p>
              <p className="text-xs text-gray-500">Kids Attendance</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-xl">🎁</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalReferrals}</p>
              <p className="text-xs text-gray-500">Referrals</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b overflow-x-auto">
          <div className="flex">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition ${
                  activeTab === tab.id 
                    ? "text-orange-600 border-b-2 border-orange-600" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Filter */}
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">
            {tabs.find(t => t.id === activeTab)?.icon} {tabs.find(t => t.id === activeTab)?.label}
          </h3>
          <div className="flex gap-2">
            {["daily", "weekly", "monthly", "yearly"].map(period => (
              <button
                key={period}
                onClick={() => setDateFilter(period)}
                className={`px-3 py-1 text-sm rounded-lg ${
                  dateFilter === period 
                    ? "bg-orange-600 text-white" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-4">📞 Contact Information</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Email:</span><span>{parent?.email}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Phone:</span><span>{parent?.phone}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Alternate Phone:</span><span>{parent?.alternatePhone || "N/A"}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Work Address:</span><span>{parent?.workAddress || "N/A"}</span></div>
                </div>
              </div>

              {/* Account Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-4">💳 Account Summary</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Total Paid:</span><span className="text-green-600 font-medium">${stats.totalPaid.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Pending Amount:</span><span className="text-red-600 font-medium">${stats.pendingAmount}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Total Children:</span><span className="font-medium">{stats.totalChildren}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Member Since:</span><span>{parent?.createdAt}</span></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "children" && (
            <div className="space-y-4">
              {children.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No children linked to this parent</div>
              ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {children.map(child => (
                  <div key={child.id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                        👨‍🎓
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{child.fullname}</p>
                        <p className="text-sm text-gray-500">{child.studentCode} {child.className && `• ${child.className}`}</p>
                        {child.attendanceRate !== undefined && (
                          <p className="text-xs text-gray-500">Attendance: <span className={child.attendanceRate >= 90 ? "text-green-600" : child.attendanceRate >= 75 ? "text-yellow-600" : "text-red-600"}>{child.attendanceRate}%</span></p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        child.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}>{child.status}</span>
                      <Link href={`/dashboard/academy/students/${child.id}`} className="text-orange-600 hover:underline text-sm">
                        View Profile →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
          )}

          {activeTab === "payments" && (
            <div className="space-y-4">
              {payments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No payment records found</div>
              ) : (
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payments.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p>{p.description || "Payment"}</p>
                          {p.studentName && <p className="text-xs text-gray-500">Student: {p.studentName}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">${(p.amount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-500">{p.paymentDate || p.createdAt ? new Date(p.paymentDate || p.createdAt || '').toLocaleDateString() : "N/A"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          p.status === "PAID" || p.status === "COMPLETED" ? "bg-green-100 text-green-800" : 
                          p.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>{p.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
          )}

          {activeTab === "attendance" && (
            <div className="space-y-4">
              <p className="text-gray-600">Combined attendance statistics for all children:</p>
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.attendanceRate}%</p>
                  <p className="text-sm text-gray-600">Overall Rate</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{children.length}</p>
                  <p className="text-sm text-gray-600">Children</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-purple-600">{children.filter(c => (c.attendanceRate || 0) >= 90).length}</p>
                  <p className="text-sm text-gray-600">Good Attendance</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">{children.filter(c => (c.attendanceRate || 0) < 75).length}</p>
                  <p className="text-sm text-gray-600">Needs Attention</p>
                </div>
              </div>
              {children.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Per Child Attendance</h4>
                  <div className="space-y-2">
                    {children.map(child => (
                      <div key={child.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span>{child.fullname}</span>
                        <span className={`font-medium ${(child.attendanceRate || 0) >= 90 ? "text-green-600" : (child.attendanceRate || 0) >= 75 ? "text-yellow-600" : "text-red-600"}`}>
                          {child.attendanceRate || 0}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "communications" && (
            <div className="space-y-4">
              {communications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No communications found</div>
              ) : (
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {communications.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">{c.type || "Notification"}</span>
                      </td>
                      <td className="px-4 py-3">{c.subject || c.title || c.message?.slice(0, 50) || "N/A"}</td>
                      <td className="px-4 py-3 text-gray-500">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : c.date}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          c.status === "READ" || c.status === "Sent" || c.status === "Delivered" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}>{c.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
          )}

          {activeTab === "referrals" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-purple-600">{stats.totalReferrals}</p>
                  <p className="text-sm text-gray-600">Total Referrals</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">$100</p>
                  <p className="text-sm text-gray-600">Credits Earned</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-blue-600">1</p>
                  <p className="text-sm text-gray-600">Pending</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
