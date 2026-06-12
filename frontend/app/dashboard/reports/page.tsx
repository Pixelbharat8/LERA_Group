"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { useLanguage } from "../../context/LanguageContext";
import { apiFetch } from "@/lib/api";

interface ReportItem {
  id: string;
  title: string;
  type: "academic" | "attendance" | "financial" | "performance";
  generatedAt: Date;
  format: "pdf" | "excel" | "csv";
  size: string;
  status: "ready" | "generating" | "failed";
}

export default function ReportsPage() {
  const { language, t } = useLanguage();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [centreSummary, setCentreSummary] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetchReports();
    try {
      const raw = Cookies.get("userData");
      if (!raw) return;
      const u = JSON.parse(decodeURIComponent(raw));
      const cid = u.centerId as string | undefined;
      if (cid) {
        apiFetch(`/api/reports/centre-summary?centerId=${encodeURIComponent(cid)}`)
          .then((d) => setCentreSummary(d as Record<string, unknown>))
          .catch(() => setCentreSummary(null));
      }
    } catch {
      setCentreSummary(null);
    }
  }, []);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch("/api/reports");
      if (Array.isArray(data) && data.length > 0) {
        setReports(data);
      } else {
        setReports([]);
      }
    } catch {
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  };

  const reportTypes = [
    { id: "all", label: t("all"), icon: "📊" },
    { id: "academic", label: t("academic"), icon: "📚" },
    { id: "attendance", label: t("attendance"), icon: "✅" },
    { id: "financial", label: t("financial"), icon: "💰" },
    { id: "performance", label: t("performance"), icon: "📈" }
  ];

  const formatIcons: Record<string, string> = {
    pdf: "📄",
    excel: "📊",
    csv: "📝"
  };

  const typeColors: Record<string, string> = {
    academic: "bg-blue-100 text-blue-700",
    attendance: "bg-green-100 text-green-700",
    financial: "bg-yellow-100 text-yellow-700",
    performance: "bg-purple-100 text-purple-700"
  };

  const filteredReports = selectedType === "all" 
    ? reports 
    : reports.filter(r => r.type === selectedType);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(language === "VI" ? "vi-VN" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const handleDownload = async (reportId: string) => {
    try {
      const data = await apiFetch(`/api/reports/${reportId}/download`);
      if (data) {
        alert(t("downloadStarted") || "Download started");
      }
    } catch {
      alert(t("failedToDownload"));
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            📊 {t("reports")}
          </h1>
          <p className="text-gray-600 mt-1">
            {t("viewDownloadReports")}
          </p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + {t("generateReport")}
        </button>
      </div>

      {centreSummary && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4">
          <h2 className="text-lg font-semibold text-emerald-900 mb-2">
            {language === "VI" ? "Tóm tắt trung tâm (live)" : "Centre snapshot (live)"}
          </h2>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="text-gray-600">{language === "VI" ? "Học viên" : "Active students"}</dt>
              <dd className="font-semibold">{String(centreSummary.activeStudents ?? "—")}</dd>
            </div>
            <div>
              <dt className="text-gray-600">{language === "VI" ? "Lớp đang mở" : "Ongoing classes"}</dt>
              <dd className="font-semibold">{String(centreSummary.ongoingClasses ?? "—")}</dd>
            </div>
            <div>
              <dt className="text-gray-600">{language === "VI" ? "GV có lớp" : "Teachers w/ classes"}</dt>
              <dd className="font-semibold">{String(centreSummary.teachersWithClasses ?? "—")}</dd>
            </div>
            <div>
              <dt className="text-gray-600">{language === "VI" ? "Thu (30 ngày)" : "Paid revenue (30d)"}</dt>
              <dd className="font-semibold">{String(centreSummary.paidRevenueLast30Days ?? "—")}</dd>
            </div>
            <div>
              <dt className="text-gray-600">{language === "VI" ? "Điểm danh ~30d" : "Attendance ~30d"}</dt>
              <dd className="font-semibold">
                {centreSummary.approxAttendancePresentRate30d != null
                  ? `${Number(centreSummary.approxAttendancePresentRate30d).toFixed(1)}%`
                  : "—"}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">
              📊
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
              <p className="text-sm text-gray-600">{t("totalReports")}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-xl">
              ✅
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{reports.filter(r => r.status === "ready").length}</p>
              <p className="text-sm text-gray-600">{t("ready")}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center text-xl">
              ⏳
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{reports.filter(r => r.status === "generating").length}</p>
              <p className="text-sm text-gray-600">{t("generating")}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-xl">
              📁
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{new Set(reports.map(r => r.type)).size}</p>
              <p className="text-sm text-gray-600">{t("reportTypes")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Type Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {reportTypes.map(type => (
          <button
            key={type.id}
            onClick={() => setSelectedType(type.id)}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${
              selectedType === type.id
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <span>{type.icon}</span>
            <span>{type.label}</span>
          </button>
        ))}
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            {t("loading")}
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {t("noReportsFound")}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredReports.map(report => (
              <div key={report.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{formatIcons[report.format]}</div>
                    <div>
                      <h3 className="font-medium text-gray-900">{report.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${typeColors[report.type]}`}>
                          {reportTypes.find(t => t.id === report.type)?.label}
                        </span>
                        <span className="text-sm text-gray-500">{report.size}</span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-500">{formatDate(report.generatedAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {report.status === "generating" ? (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm flex items-center gap-1">
                        <span className="animate-spin">⏳</span>
                        {t("generating")}...
                      </span>
                    ) : report.status === "failed" ? (
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                        {t("failed")}
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleDownload(report.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          {t("download")}
                        </button>
                        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                          👁️
                        </button>
                        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generate Report Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {t("generateNewReport")}
              </h2>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("reportType")}
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="academic">{t("academicReport")}</option>
                  <option value="attendance">{t("attendanceReport")}</option>
                  <option value="financial">{t("financialReport")}</option>
                  <option value="performance">{t("performanceReport")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("dateRange")}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="date"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("format")}
                </label>
                <div className="flex gap-2">
                  {["pdf", "excel", "csv"].map(format => (
                    <label key={format} className="flex-1">
                      <input type="radio" name="format" value={format} className="sr-only peer" defaultChecked={format === "pdf"} />
                      <div className="p-3 text-center border rounded-lg cursor-pointer peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-700 hover:bg-gray-50 transition-colors">
                        <span className="text-2xl">{formatIcons[format]}</span>
                        <p className="text-xs mt-1 uppercase">{format}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {t("cancel")}
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {t("generate")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
