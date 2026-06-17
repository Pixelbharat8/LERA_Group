"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";

interface Registration {
  id: string;
  studentName: string;
  course: string;
  date: string;
  status: string;
  payment: string;
  amount?: number;
}

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleConfirm = async (id: string) => {
    if (!confirm("Confirm this registration?")) return;
    try {
      await apiFetch(`/api/student-registrations/${id}/confirm`, { method: "PUT" });
      fetchRegistrations();
    } catch (err) {
      console.error("Error confirming registration:", err);
    }
  };

  const fetchRegistrations = async () => {
    try {
      const data = await apiFetch("/api/student-registrations");
      const regsArray = Array.isArray(data) ? data : [];
      setRegistrations(regsArray.map((r: any) => ({
        id: r.id,
        studentName: r.studentName || r.student_name || "Unknown",
        course: r.courseName || r.course_name || "N/A",
        date: r.registrationDate?.split("T")[0] || r.registration_date || new Date().toISOString().split("T")[0],
        status: r.status === "CONFIRMED" ? "Confirmed" : r.status === "PENDING" ? "Pending" : r.status || "Pending",
        payment: r.paymentStatus === "PAID" ? "Paid" : r.paymentStatus === "PARTIAL" ? "Partial" : r.paymentStatus || "Pending",
        amount: r.amount
      })));
    } catch (err) {
      console.error("Error fetching registrations:", err);
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/superadmin" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-900">Registrations</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">📝 Registrations</h1>
          <p className="text-gray-500">Manage new student registrations</p>
        </div>
        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
          ➕ New Registration
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">📝</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{registrations.length}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">✅</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{registrations.filter(r => r.status === "Confirmed").length}</p>
              <p className="text-sm text-gray-500">Confirmed</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center text-2xl">⏳</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{registrations.filter(r => r.status === "Pending").length}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">💰</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{registrations.filter(r => r.payment === "Paid").length}</p>
              <p className="text-sm text-gray-500">Paid</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {registrations.map((reg) => (
              <tr key={reg.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium">{reg.studentName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{reg.course}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{reg.date}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    reg.status === "Confirmed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                  }`}>{reg.status}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    reg.payment === "Paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                  }`}>{reg.payment}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button className="text-blue-600 hover:text-blue-800 mr-3">View</button>
                  <button onClick={() => handleConfirm(reg.id)} className="text-green-600 hover:text-green-800">Confirm</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
