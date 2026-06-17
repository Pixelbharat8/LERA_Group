"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { exportToCsv, exportToExcel, datedFilename } from "@/lib/export-csv";

interface Report {
  id: string;
  title: string;
  type: "academic" | "financial" | "operational" | "hr" | "marketing";
  period: string;
  generatedDate: string;
  status: "ready" | "generating" | "failed";
  downloadUrl?: string;
}

interface ReportMetric {
  label: string;
  value: string | number;
  change?: number;
  trend?: "up" | "down" | "stable";
}

export default function DirectorReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<string>("all");
  const [metrics, setMetrics] = useState<ReportMetric[]>([]);

  useEffect(() => {
    fetchReports();
    fetchMetrics();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/api/reports").catch(() => []);
      
      if (Array.isArray(data) && data.length > 0) {
        setReports(data);
      } else {
        setReports([
          { id: "1", title: "Monthly Academic Performance Report", type: "academic", period: "January 2026", generatedDate: "2026-01-08", status: "ready" },
          { id: "2", title: "Q4 2025 Financial Summary", type: "financial", period: "Q4 2025", generatedDate: "2026-01-05", status: "ready" },
          { id: "3", title: "Weekly Attendance Report", type: "operational", period: "Week 1, Jan 2026", generatedDate: "2026-01-07", status: "ready" },
          { id: "4", title: "Staff Performance Review", type: "hr", period: "December 2025", generatedDate: "2026-01-03", status: "ready" },
          { id: "5", title: "Marketing Campaign Analysis", type: "marketing", period: "Q4 2025", generatedDate: "2026-01-02", status: "ready" },
          { id: "6", title: "Student Enrollment Trends", type: "academic", period: "2025 Annual", generatedDate: "2026-01-01", status: "ready" },
          { id: "7", title: "Center Comparison Report", type: "operational", period: "December 2025", generatedDate: "2025-12-31", status: "ready" },
          { id: "8", title: "February 2026 Forecast", type: "financial", period: "February 2026", generatedDate: "2026-01-08", status: "generating" },
        ]);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const [students, teachers, centers] = await Promise.all([
        apiFetch("/api/students").catch(() => []),
        apiFetch("/api/teachers").catch(() => []),
        apiFetch("/api/centers").catch(() => []),
      ]);

      setMetrics([
        { label: "Total Students", value: Array.isArray(students) ? students.length : 1230, change: 8.5, trend: "up" },
        { label: "Total Teachers", value: Array.isArray(teachers) ? teachers.length : 45, change: 4.2, trend: "up" },
        { label: "Active Centers", value: Array.isArray(centers) ? centers.filter((c: any) => c.status === "ACTIVE").length : 4, change: 0, trend: "stable" },
        { label: "Avg. Class Size", value: 18, change: -2.1, trend: "down" },
        { label: "Retention Rate", value: "92%", change: 1.5, trend: "up" },
        { label: "Satisfaction Score", value: "4.6/5", change: 0.2, trend: "up" },
      ]);
    } catch (error) {
      console.error("Error fetching metrics:", error);
    }
  };

  const reportColumns = [
    { key: "title" as const, label: "Title" },
    { key: "type" as const, label: "Type" },
    { key: "period" as const, label: "Period" },
    { key: "generatedDate" as const, label: "Generated Date" },
    { key: "status" as const, label: "Status" },
  ];

  const handleExportAll = () => {
    exportToExcel(datedFilename("reports"), filteredReports, reportColumns);
  };

  const handleDownloadReport = (report: Report) => {
    exportToCsv(datedFilename(report.title.replace(/\s+/g, "-").toLowerCase()), [report], reportColumns);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "academic": return "bg-blue-100 text-blue-800";
      case "financial": return "bg-green-100 text-green-800";
      case "operational": return "bg-purple-100 text-purple-800";
      case "hr": return "bg-orange-100 text-orange-800";
      case "marketing": return "bg-pink-100 text-pink-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case "up": return "📈";
      case "down": return "📉";
      default: return "➡️";
    }
  };

  const filteredReports = activeType === "all" 
    ? reports 
    : reports.filter(r => r.type === activeType);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Reports & Analytics</h1>
          <p className="text-gray-600">Access organizational reports and insights</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/director" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            ← Back to Dashboard
          </Link>
          <button onClick={handleExportAll} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            + Generate Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((metric, i) => (
          <div key={i} className="bg-white rounded-xl shadow p-4">
            <p className="text-gray-500 text-xs mb-1">{metric.label}</p>
            <p className="text-xl font-bold">{metric.value}</p>
            {metric.change !== undefined && (
              <div className="flex items-center gap-1 mt-1">
                <span>{getTrendIcon(metric.trend)}</span>
                <span className={`text-xs ${metric.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {metric.change >= 0 ? "+" : ""}{metric.change}%
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Report Type Filters */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex gap-2 flex-wrap">
          {["all", "academic", "financial", "operational", "hr", "marketing"].map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeType === type ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-xl shadow">
        <div className="p-6">
          <h3 className="text-lg font-bold mb-4">Available Reports</h3>
          <div className="space-y-3">
            {filteredReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">
                    {report.type === "academic" ? "📚" : 
                     report.type === "financial" ? "💰" :
                     report.type === "operational" ? "⚙️" :
                     report.type === "hr" ? "👥" : "📢"}
                  </div>
                  <div>
                    <h4 className="font-medium">{report.title}</h4>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>{report.period}</span>
                      <span>•</span>
                      <span>Generated: {new Date(report.generatedDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs ${getTypeColor(report.type)}`}>
                    {report.type.toUpperCase()}
                  </span>
                  {report.status === "ready" ? (
                    <button onClick={() => handleDownloadReport(report)} className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-2">
                      <span>📥</span> Download
                    </button>
                  ) : report.status === "generating" ? (
                    <button disabled className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg flex items-center gap-2">
                      <span className="animate-spin">⏳</span> Generating...
                    </button>
                  ) : (
                    <button className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                      Retry
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Report Generator */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-bold mb-4">Quick Report Generator</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: "📊", label: "Daily Summary", desc: "Today's key metrics" },
            { icon: "📈", label: "Weekly Trends", desc: "7-day comparison" },
            { icon: "💰", label: "Revenue Report", desc: "Income breakdown" },
            { icon: "👨‍🎓", label: "Student Report", desc: "Enrollment status" },
          ].map((item, i) => (
            <button key={i} className="p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left">
              <span className="text-2xl">{item.icon}</span>
              <p className="font-medium mt-2">{item.label}</p>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
