"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { useUserCenter, buildCenterFilterUrl } from "../../../hooks/useUserCenter";

interface Followup {
  id: string;
  leadName: string;
  type: string;
  date: string;
  time?: string;
  status: string;
  notes: string;
}

export default function FollowupsPage() {
  const { centerId: userCenterId, shouldFilterByCenter, loading: userLoading } = useUserCenter();
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userLoading) {
      fetchFollowups();
    }
  }, [userLoading, userCenterId, shouldFilterByCenter]);

  const fetchFollowups = async () => {
    try {
      const url = buildCenterFilterUrl(
        "/api/followups",
        shouldFilterByCenter ? userCenterId : null
      );
      const data = await apiFetch(url);
      const followupsArray = Array.isArray(data) ? data : [];
      setFollowups(followupsArray.map((f: any) => ({
        id: f.id,
        leadName: f.lead?.parentName || f.leadName || "Unknown Lead",
        type: f.actionType || f.action_type || f.type || "Call",
        date: f.nextFollowupDate?.split("T")[0] || f.next_followup_date || new Date().toISOString().split("T")[0],
        time: "10:00",
        status: f.outcome === "INTERESTED" ? "Scheduled" : f.outcome === "CALLBACK" ? "Pending" : f.outcome === "SCHEDULED_DEMO" ? "Scheduled" : f.outcome ? "Completed" : "Pending",
        notes: f.notes || ""
      })));
    } catch (err) {
      console.error("Error fetching followups:", err);
      setFollowups([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return "bg-yellow-100 text-yellow-800";
      case "Completed": return "bg-green-100 text-green-800";
      case "Scheduled": return "bg-blue-100 text-blue-800";
      case "Missed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/superadmin" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-900">Follow-ups</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">📋 Follow-ups</h1>
          <p className="text-gray-500">Track lead follow-up activities</p>
        </div>
        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
          ➕ Schedule Follow-up
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center text-2xl">⏳</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{followups.filter(f => f.status === "Pending").length}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">📅</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{followups.filter(f => f.status === "Scheduled").length}</p>
              <p className="text-sm text-gray-500">Scheduled</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">✅</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{followups.filter(f => f.status === "Completed").length}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-2xl">❌</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{followups.filter(f => f.status === "Missed").length}</p>
              <p className="text-sm text-gray-500">Missed</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {followups.map((followup) => (
              <tr key={followup.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium">{followup.leadName}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs bg-gray-100 rounded">{followup.type}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{followup.date} {followup.time}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(followup.status)}`}>{followup.status}</span>
                </td>
                <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{followup.notes}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button className="text-blue-600 hover:text-blue-800 mr-3">Edit</button>
                  <button className="text-green-600 hover:text-green-800">Complete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
