"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "../../../../../lib/api";

interface TeacherProfile {
  id: string;
  teacherCode: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  avatarUrl: string;
  status: string;
  joinDate: string;
  centerId: string;
  centerName: string;
  specialization: string;
  qualification: string;
  experienceYears: number;
  employmentType: string;
  baseSalary: number;
  hourlyRate: number;
}

interface AttendanceStats {
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  leaves: number;
  attendanceRate: number;
}

interface ClassTaught {
  id: string;
  className: string;
  classCode?: string;
  programName?: string;
  courseName: string;
  studentsCount: number;
  startDate: string;
  endDate: string;
  status: string;
  schedule: string;
}

interface PayrollRecord {
  id: string;
  month: string;
  year: number;
  baseSalary: number;
  teachingHours: number;
  teachingAmount: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  status: string;
  paidDate: string;
}

interface StudentTaught {
  id: string;
  studentName: string;
  className: string;
  enrollmentDate: string;
  status: string;
  attendanceRate: number;
  currentGrade: string;
}

interface PerformanceRecord {
  id: string;
  evaluationPeriod: string;
  rating: number;
  feedback: string;
  evaluatedBy: string;
  evaluatedDate: string;
}

export default function TeacherProfilePage() {
  const params = useParams();
  const router = useRouter();
  const teacherId = params.id as string;

  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [classes, setClasses] = useState<ClassTaught[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [students, setStudents] = useState<StudentTaught[]>([]);
  const [performance, setPerformance] = useState<PerformanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [dateFilter, setDateFilter] = useState("monthly");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<TeacherProfile>>({});

  useEffect(() => {
    fetchAllData();
  }, [teacherId, dateFilter]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchProfile(),
        fetchAttendanceStats(),
        fetchClasses(),
        fetchPayroll(),
        fetchStudents(),
        fetchPerformance(),
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const fetchProfile = async () => {
    try {
      const data = await apiFetch(`/api/teachers/${teacherId}`);
      setProfile(data.data || data);
      setEditData(data.data || data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchAttendanceStats = async () => {
    try {
      const data = await apiFetch(`/api/teachers/${teacherId}/attendance-stats?period=${dateFilter}`);
      setAttendanceStats(data.data || data);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      setAttendanceStats({ totalDays: 0, present: 0, absent: 0, late: 0, leaves: 0, attendanceRate: 0 });
    }
  };

  const fetchClasses = async () => {
    try {
      const data = await apiFetch(`/api/teachers/${teacherId}/classes`);
      setClasses(data.data || data || []);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const fetchPayroll = async () => {
    try {
      // Real payroll records from payroll_service (visible to finance/admin roles; empty otherwise).
      const data = await apiFetch(`/api/payroll?teacherId=${teacherId}`);
      setPayroll(Array.isArray(data) ? data : (data?.data || data?.content || []));
    } catch (error) {
      console.error("Error fetching payroll:", error);
    }
  };

  const fetchStudents = async () => {
    try {
      const data = await apiFetch(`/api/teachers/${teacherId}/students`);
      setStudents(data.data || data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const fetchPerformance = async () => {
    try {
      const data = await apiFetch(`/api/teachers/${teacherId}/performance`);
      setPerformance(data.data || data || []);
    } catch (error) {
      console.error("Error fetching performance:", error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await apiFetch(`/api/teachers/${teacherId}`, {
        method: "PUT",
        body: JSON.stringify(editData),
      });
      setProfile({ ...profile, ...editData } as TeacherProfile);
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
    }
  };

  const payrollArray = Array.isArray(payroll) ? payroll : [];
  const classesArray = Array.isArray(classes) ? classes : [];
  const studentsArray = Array.isArray(students) ? students : [];
  
  const totalEarnings = payrollArray.reduce((sum, p) => sum + (p.netSalary || 0), 0);
  const totalHours = payrollArray.reduce((sum, p) => sum + (p.teachingHours || 0), 0);
  const activeClasses = classesArray.filter(c => c.status === 'ONGOING').length;
  const totalStudents = studentsArray.length;

  const tabs = [
    { id: "overview", label: "Overview", icon: "👤" },
    { id: "classes", label: "Classes", icon: "📚" },
    { id: "attendance", label: "Attendance", icon: "📅" },
    { id: "students", label: "Students", icon: "👨‍🎓" },
    { id: "payroll", label: "Payroll", icon: "💰" },
    { id: "performance", label: "Performance", icon: "⭐" },
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
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white text-3xl font-bold">
              {profile?.fullName?.charAt(0) || "T"}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{profile?.fullName}</h1>
              <p className="text-gray-500">Teacher Code: {profile?.teacherCode}</p>
              <div className="flex gap-4 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  profile?.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                  profile?.status === 'ON_LEAVE' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {profile?.status}
                </span>
                <span className="text-gray-500">📍 {profile?.centerName}</span>
                <span className="text-gray-500">🎓 {profile?.specialization}</span>
                <span className="text-gray-500">💼 {profile?.employmentType}</span>
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
            <p className="text-2xl font-bold text-blue-600">{activeClasses}</p>
            <p className="text-sm text-gray-600">Active Classes</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{totalStudents}</p>
            <p className="text-sm text-gray-600">Total Students</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{totalHours}h</p>
            <p className="text-sm text-gray-600">Teaching Hours</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{attendanceStats?.attendanceRate || 0}%</p>
            <p className="text-sm text-gray-600">Attendance Rate</p>
          </div>
          <div className="bg-pink-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-pink-600">{totalEarnings.toLocaleString()}đ</p>
            <p className="text-sm text-gray-600">Total Earnings</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="flex border-b overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap transition-colors ${
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
        {(activeTab === "attendance" || activeTab === "payroll") && (
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
                        value={editData.fullName || ""}
                        onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
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
                      <label className="block text-sm text-gray-600">Specialization</label>
                      <input
                        type="text"
                        value={editData.specialization || ""}
                        onChange={(e) => setEditData({ ...editData, specialization: e.target.value })}
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
                    <p><span className="text-gray-500">Join Date:</span> {profile?.joinDate}</p>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Professional Information</h3>
                <div className="space-y-3">
                  <p><span className="text-gray-500">Specialization:</span> {profile?.specialization}</p>
                  <p><span className="text-gray-500">Qualification:</span> {profile?.qualification}</p>
                  <p><span className="text-gray-500">Experience:</span> {profile?.experienceYears} years</p>
                  <p><span className="text-gray-500">Employment Type:</span> {profile?.employmentType}</p>
                  <p><span className="text-gray-500">Base Salary:</span> {profile?.baseSalary?.toLocaleString()}đ</p>
                  <p><span className="text-gray-500">Hourly Rate:</span> {profile?.hourlyRate?.toLocaleString()}đ</p>
                </div>
              </div>
            </div>
          )}

          {/* Classes Tab */}
          {activeTab === "classes" && (
            <div>
              <h3 className="font-semibold mb-4">Classes (Current & Past)</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">Class</th>
                      <th className="px-4 py-3 text-left">Course</th>
                      <th className="px-4 py-3 text-left">Students</th>
                      <th className="px-4 py-3 text-left">Schedule</th>
                      <th className="px-4 py-3 text-left">Duration</th>
                      <th className="px-4 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classesArray.length > 0 ? classesArray.map((cls) => (
                      <tr key={cls.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium">{cls.className}</p>
                          {cls.programName && (
                            <p className="text-sm text-gray-500">{cls.programName}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">{cls.courseName}</td>
                        <td className="px-4 py-3">{cls.studentsCount}</td>
                        <td className="px-4 py-3">{cls.schedule}</td>
                        <td className="px-4 py-3">
                          <p>{cls.startDate}</p>
                          <p className="text-sm text-gray-500">to {cls.endDate || 'Present'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-sm ${
                            cls.status === 'ONGOING' ? 'bg-green-100 text-green-800' :
                            cls.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {cls.status}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          No classes assigned
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === "attendance" && (
            <div>
              <div className="grid grid-cols-5 gap-4 mb-6">
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
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-3xl font-bold text-purple-600">{attendanceStats?.leaves || 0}</p>
                  <p className="text-gray-600">Leaves</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-3xl font-bold text-blue-600">{attendanceStats?.totalDays || 0}</p>
                  <p className="text-gray-600">Total Days</p>
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

          {/* Students Tab */}
          {activeTab === "students" && (
            <div>
              <h3 className="font-semibold mb-4">Students Taught ({studentsArray.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">Student</th>
                      <th className="px-4 py-3 text-left">Class</th>
                      <th className="px-4 py-3 text-left">Enrolled</th>
                      <th className="px-4 py-3 text-left">Attendance</th>
                      <th className="px-4 py-3 text-left">Grade</th>
                      <th className="px-4 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsArray.length > 0 ? studentsArray.map((student) => (
                      <tr key={student.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{student.studentName}</td>
                        <td className="px-4 py-3">{student.className}</td>
                        <td className="px-4 py-3">{student.enrollmentDate}</td>
                        <td className="px-4 py-3">{student.attendanceRate}%</td>
                        <td className="px-4 py-3">{student.currentGrade || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-sm ${
                            student.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {student.status}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          No students found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payroll Tab */}
          {activeTab === "payroll" && (
            <div>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-green-600">{totalEarnings.toLocaleString()}đ</p>
                  <p className="text-gray-600">Total Earnings</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-blue-600">{totalHours}h</p>
                  <p className="text-gray-600">Total Hours</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-purple-600">{payrollArray.reduce((sum, p) => sum + (p.bonus || 0), 0).toLocaleString()}đ</p>
                  <p className="text-gray-600">Total Bonus</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-red-600">{payrollArray.reduce((sum, p) => sum + (p.deductions || 0), 0).toLocaleString()}đ</p>
                  <p className="text-gray-600">Total Deductions</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">Period</th>
                      <th className="px-4 py-3 text-left">Base Salary</th>
                      <th className="px-4 py-3 text-left">Hours</th>
                      <th className="px-4 py-3 text-left">Teaching</th>
                      <th className="px-4 py-3 text-left">Bonus</th>
                      <th className="px-4 py-3 text-left">Deductions</th>
                      <th className="px-4 py-3 text-left">Net Salary</th>
                      <th className="px-4 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrollArray.length > 0 ? payrollArray.map((record) => (
                      <tr key={record.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{record.month}/{record.year}</td>
                        <td className="px-4 py-3">{record.baseSalary?.toLocaleString()}đ</td>
                        <td className="px-4 py-3">{record.teachingHours}h</td>
                        <td className="px-4 py-3">{record.teachingAmount?.toLocaleString()}đ</td>
                        <td className="px-4 py-3 text-green-600">+{record.bonus?.toLocaleString()}đ</td>
                        <td className="px-4 py-3 text-red-600">-{record.deductions?.toLocaleString()}đ</td>
                        <td className="px-4 py-3 font-bold">{record.netSalary?.toLocaleString()}đ</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-sm ${
                            record.status === 'PAID' ? 'bg-green-100 text-green-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                          No payroll records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === "performance" && (
            <div>
              <h3 className="font-semibold mb-4">Performance Reviews</h3>
              {(Array.isArray(performance) && performance.length > 0) ? (
                <div className="space-y-4">
                  {performance.map((review) => (
                    <div key={review.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{review.evaluationPeriod}</p>
                          <p className="text-sm text-gray-500">Evaluated by {review.evaluatedBy} on {review.evaluatedDate}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} className={star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}>
                              ⭐
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600">{review.feedback}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-gray-500">No performance reviews yet</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
