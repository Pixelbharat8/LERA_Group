"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { exportToCsv, datedFilename } from "@/lib/export-csv";

interface Report {
  id: string;
  name: string;
  description: string;
  type: "financial" | "academic" | "enrollment" | "attendance" | "marketing";
  generatedAt?: string;
  status: "ready" | "generating" | "scheduled";
  format: "pdf" | "excel" | "csv";
  size?: string;
}

interface ScheduledReport {
  id: string;
  name: string;
  frequency: "daily" | "weekly" | "monthly" | "quarterly";
  nextRun: string;
  recipients: string[];
}

export default function ChairmanReportsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"available" | "scheduled" | "history">("available");
  const [reports, setReports] = useState<Report[]>([]);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  // Schedule modal
  const [showSchedule, setShowSchedule] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ name: "", reportType: "SUMMARY", frequency: "WEEKLY", recipients: "" });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      // Fetch real reports from API
      const response = await apiFetch("/api/reports").catch(() => null);

      const reportsArray = Array.isArray(response) ? response : response?.data || response?.content || [];
      if (reportsArray.length > 0) {
        setReports(reportsArray.map((r: any) => ({
          id: r.id,
          name: r.name || r.title || "Report",
          description: r.description || "",
          type: r.type || "financial",
          generatedAt: r.generatedAt || r.createdAt,
          status: r.status || "ready",
          format: r.format || "pdf",
          size: r.size || "N/A",
        })));
      } else {
        setReports([]);
      }

      const sched = await apiFetch("/api/reports/scheduled").catch(() => []);
      setScheduledReports((Array.isArray(sched) ? sched : []).map((s: any) => ({
        id: s.id,
        name: s.name,
        frequency: (s.frequency || "weekly").toLowerCase(),
        nextRun: s.nextRun || "",
        recipients: s.recipients ? String(s.recipients).split(",").map((x: string) => x.trim()).filter(Boolean) : [],
      })));
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCsvString = (filename: string, csv: string) => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateReport = async (report: Report) => {
    // Generate from live data on the server, then download the returned CSV.
    setGeneratingReport(report.id);
    try {
      const res: any = await apiFetch("/api/reports/generate", {
        method: "POST",
        body: JSON.stringify({ type: (report.type || "SUMMARY").toUpperCase() }),
      });
      if (res?.csv) downloadCsvString(res.filename || `${report.name}.csv`, res.csv);
      else alert("Report generated, but no content was returned.");
    } catch (e) {
      alert("Could not generate the report.");
    } finally {
      setGeneratingReport(null);
    }
  };

  const openSchedule = (s?: ScheduledReport) => {
    if (s) {
      setEditId(s.id);
      setScheduleForm({ name: s.name, reportType: "SUMMARY", frequency: (s.frequency || "weekly").toUpperCase(), recipients: (s.recipients || []).join(", ") });
    } else {
      setEditId(null);
      setScheduleForm({ name: "", reportType: "SUMMARY", frequency: "WEEKLY", recipients: "" });
    }
    setShowSchedule(true);
  };

  const saveSchedule = async () => {
    if (!scheduleForm.name.trim()) { alert("Give the scheduled report a name."); return; }
    setSavingSchedule(true);
    try {
      const body = JSON.stringify({
        name: scheduleForm.name.trim(),
        reportType: scheduleForm.reportType,
        frequency: scheduleForm.frequency,
        recipients: scheduleForm.recipients.trim(),
      });
      if (editId) {
        await apiFetch(`/api/reports/scheduled/${editId}`, { method: "PUT", body });
      } else {
        await apiFetch("/api/reports/scheduled", { method: "POST", body });
      }
      setShowSchedule(false);
      await fetchReports();
    } catch (e: any) {
      alert(e?.message || "Could not save the schedule.");
    } finally {
      setSavingSchedule(false);
    }
  };

  const deleteSchedule = async (id: string) => {
    if (!confirm("Delete this scheduled report?")) return;
    try {
      await apiFetch(`/api/reports/scheduled/${id}`, { method: "DELETE" });
      await fetchReports();
    } catch (e: any) {
      alert(e?.message || "Could not delete.");
    }
  };

  const downloadReport = (report: Report) => {
    exportToCsv(
      datedFilename((report.name ?? "report").replace(/\s+/g, "_")),
      [report],
      [
        { key: "name", label: "Name" },
        { key: "description", label: "Description" },
        { key: "type", label: "Type" },
        { key: "status", label: "Status" },
        { key: "format", label: "Format" },
        { key: "generatedAt", label: "Generated" },
        { key: "size", label: "Size" },
      ]
    );
  };

  const createCustomReport = async () => {
    try {
      await apiFetch("/api/reports/generate", {
        method: "POST",
        body: JSON.stringify({ type: "custom" }),
      });
      await fetchReports();
      alert("Report generation started.");
    } catch (error) {
      console.error("Error creating report:", error);
      alert("Failed to create report.");
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "financial": return "bg-green-100 text-green-700";
      case "academic": return "bg-blue-100 text-blue-700";
      case "enrollment": return "bg-purple-100 text-purple-700";
      case "attendance": return "bg-orange-100 text-orange-700";
      case "marketing": return "bg-pink-100 text-pink-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "financial": return "💰";
      case "academic": return "📚";
      case "enrollment": return "👨‍🎓";
      case "attendance": return "✅";
      case "marketing": return "📣";
      default: return "📄";
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "pdf": return "📕";
      case "excel": return "📗";
      case "csv": return "📋";
      default: return "📄";
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case "daily": return "Every day";
      case "weekly": return "Every week";
      case "monthly": return "Every month";
      case "quarterly": return "Every quarter";
      default: return frequency;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/chairman" className="text-gray-500 hover:text-gray-700">
                ← Back
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">📄 Reports Center</h1>
                <p className="text-sm text-gray-500">Generate and download comprehensive reports</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { window.location.href = "/dashboard/chairman/settings"; }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                ⚙️ Report Settings
              </button>
              <button
                onClick={createCustomReport}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                ➕ Create Custom Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-3xl font-bold text-blue-600">{reports.length}</div>
            <div className="text-sm text-gray-500">Available Reports</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-3xl font-bold text-green-600">{scheduledReports.length}</div>
            <div className="text-sm text-gray-500">Scheduled Reports</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-3xl font-bold text-purple-600">
              {reports.filter((r: any) => {
                const d = r.generatedDate || r.createdAt;
                if (!d) return false;
                const dt = new Date(d);
                const now = new Date();
                return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
              }).length}
            </div>
            <div className="text-sm text-gray-500">Reports This Month</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-3xl font-bold text-orange-600">—</div>
            <div className="text-sm text-gray-500">Total Storage Used</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-200">
            {[
              { id: "available", label: "Available Reports", icon: "📄" },
              { id: "scheduled", label: "Scheduled Reports", icon: "🗓️" },
              { id: "history", label: "Report History", icon: "📜" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === "available" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reports.map((report) => (
                  <div key={report.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition">
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-3xl">{getTypeIcon(report.type)}</div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(report.type)}`}>
                        {report.type}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{report.name}</h3>
                    <p className="text-sm text-gray-500 mb-4">{report.description}</p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        {getFormatIcon(report.format)} {(report.format ?? "").toUpperCase()}
                      </span>
                      {report.size && <span>{report.size}</span>}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => generateReport(report)}
                        disabled={generatingReport === report.id}
                        className="flex-1 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 disabled:opacity-50"
                      >
                        {generatingReport === report.id ? "Generating..." : "🔄 Generate"}
                      </button>
                      <button
                        onClick={() => downloadReport(report)}
                        className="flex-1 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200"
                      >
                        📥 Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "scheduled" && (
              <div className="space-y-4">
                {scheduledReports.map((report) => (
                  <div key={report.id} className="border border-gray-200 rounded-xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">
                        🗓️
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{report.name}</h3>
                        <p className="text-sm text-gray-500">
                          {getFrequencyLabel(report.frequency)} • Next: {new Date(report.nextRun).toLocaleDateString()}
                        </p>
                        <div className="flex gap-2 mt-1">
                          {report.recipients.map((email, i) => (
                            <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {email}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openSchedule(report)} className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm">
                        Edit
                      </button>
                      <button onClick={() => deleteSchedule(report.id)} className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}

                <button onClick={() => openSchedule()} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-600 transition">
                  ➕ Schedule New Report
                </button>
              </div>
            )}

            {activeTab === "history" && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Report</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Generated</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Format</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {reports.filter(r => r.generatedAt).map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{report.name}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(report.type)}`}>
                            {report.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {report.generatedAt && new Date(report.generatedAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{report.format.toUpperCase()}</td>
                        <td className="px-4 py-3 text-gray-500">{report.size}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => downloadReport(report)}
                            className="text-blue-600 hover:text-blue-700 text-sm"
                          >
                            Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {showSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !savingSchedule && setShowSchedule(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{editId ? "Edit scheduled report" : "Schedule a report"}</h2>
              <button onClick={() => !savingSchedule && setShowSchedule(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report name *</label>
                <input value={scheduleForm.name} onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })} placeholder="e.g. Weekly centre summary" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={scheduleForm.reportType} onChange={(e) => setScheduleForm({ ...scheduleForm, reportType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    {["SUMMARY", "STUDENTS", "TEACHERS", "ENROLLMENTS"].map((t) => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                  <select value={scheduleForm.frequency} onChange={(e) => setScheduleForm({ ...scheduleForm, frequency: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    {["DAILY", "WEEKLY", "MONTHLY"].map((f) => <option key={f} value={f}>{f.charAt(0) + f.slice(1).toLowerCase()}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recipients (comma-separated emails)</label>
                <input value={scheduleForm.recipients} onChange={(e) => setScheduleForm({ ...scheduleForm, recipients: e.target.value })} placeholder="ceo@leraacademy.edu.vn, director@leraacademy.edu.vn" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <p className="text-xs text-gray-400 mt-1">Emails send only once SMTP is configured (MAIL_ENABLED); the report still generates & is logged meanwhile.</p>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={saveSchedule} disabled={savingSchedule} className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50">
                  {savingSchedule ? "Saving…" : editId ? "Save changes" : "Schedule report"}
                </button>
                <button onClick={() => setShowSchedule(false)} disabled={savingSchedule} className="px-5 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
