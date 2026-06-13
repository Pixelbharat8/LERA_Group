"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { apiFetch } from "../../../../lib/api";

interface AuditLog {
  id: string;
  activityType: string;
  description: string;
  userId: string;
  userEmail?: string;
  ipAddress: string;
  createdAt: string;
  metadata?: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [actionFilter, setActionFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchLogs();
  }, [dateFilter, actionFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Get logs from today or filtered date range
      const startDate = `${dateFilter}T00:00:00`;
      const endDate = `${dateFilter}T23:59:59`;
      
      const data = await apiFetch(`/api/activity-logs/date-range?start=${startDate}&end=${endDate}`);
      
      let logList = data.data || data.content || data || [];
      if (!Array.isArray(logList)) logList = [];
      
      // Filter by action type if not ALL
      if (actionFilter !== "ALL") {
        logList = logList.filter((log: AuditLog) => log.activityType === actionFilter);
      }
      
      setLogs(logList);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    !searchTerm || 
    log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionColor = (action: string) => {
    switch (action) {
      case "LOGIN": return "bg-blue-100 text-blue-800";
      case "CREATE": return "bg-green-100 text-green-800";
      case "UPDATE": return "bg-yellow-100 text-yellow-800";
      case "DELETE": return "bg-red-100 text-red-800";
      case "LOGOUT": return "bg-gray-100 text-gray-800";
      default: return "bg-purple-100 text-purple-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard/superadmin" className="hover:text-blue-600">Dashboard</Link>
          <span>/</span>
          <span className="text-gray-900">Audit Logs</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">📋 Audit Logs</h1>
        <p className="text-gray-500">Track all system activities</p>
      </div>

      <div className="flex gap-4">
        <input
          type="date"
          className="px-4 py-2 border border-gray-300 rounded-lg"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />
        <select 
          className="px-4 py-2 border border-gray-300 rounded-lg"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          <option value="ALL">All Actions</option>
          <option value="LOGIN">LOGIN</option>
          <option value="LOGOUT">LOGOUT</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
        </select>
        <input
          type="text"
          placeholder="Search user..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button 
          onClick={fetchLogs}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading audit logs...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No audit logs found for the selected criteria
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getActionColor(log.activityType)}`}>
                        {log.activityType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{log.userEmail || log.userId}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-gray-500">{log.ipAddress || '-'}</td>
                    <td className="px-6 py-4 text-gray-500">{log.description}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
