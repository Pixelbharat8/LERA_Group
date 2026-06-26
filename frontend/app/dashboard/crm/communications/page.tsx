"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { useUserCenter, buildCenterFilterUrl } from "../../../hooks/useUserCenter";
import { toast } from "@/components/Toast";

interface CallLog {
  id: string;
  leadId?: string;
  leadName?: string;
  phoneNumber: string;
  callType: string;
  duration?: number;
  outcome?: string;
  notes?: string;
  createdBy?: string;
  createdAt?: string;
}

interface EmailLog {
  id: string;
  leadId?: string;
  leadName?: string;
  toEmail: string;
  subject: string;
  status: string;
  sentAt?: string;
  openedAt?: string;
  clickedAt?: string;
}

export default function CommunicationsPage() {
  const { centerId: userCenterId, shouldFilterByCenter, loading: userLoading } = useUserCenter();
  const [activeTab, setActiveTab] = useState<"calls" | "emails">("calls");
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [callForm, setCallForm] = useState({ phoneNumber: "", callType: "OUTBOUND", duration: 0, outcome: "", notes: "" });
  const [emailForm, setEmailForm] = useState({ toEmail: "", subject: "", body: "" });

  useEffect(() => {
    if (!userLoading) {
      fetchLogs();
    }
  }, [userLoading, userCenterId, shouldFilterByCenter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const emailUrl = buildCenterFilterUrl(
        "/api/email-logs",
        shouldFilterByCenter ? userCenterId : null
      );
      const [calls, emails] = await Promise.all([
        apiFetch("/api/call-logs").catch(() => []),
        apiFetch(emailUrl).catch(() => []),
      ]);
      setCallLogs(Array.isArray(calls) ? calls : []);
      setEmailLogs(Array.isArray(emails) ? emails : []);
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogCall = async () => {
    try {
      await apiFetch("/api/call-logs", {
        method: "POST",
        body: JSON.stringify(callForm),
      });
      setShowCallModal(false);
      setCallForm({ phoneNumber: "", callType: "OUTBOUND", duration: 0, outcome: "", notes: "" });
      fetchLogs();
    } catch (err) {
      console.error("Error logging call:", err);
    }
  };

  const handleSendEmail = async () => {
    try {
      await apiFetch("/api/email-logs", {
        method: "POST",
        body: JSON.stringify({ ...emailForm, status: "SENT" }),
      });
      setShowEmailModal(false);
      setEmailForm({ toEmail: "", subject: "", body: "" });
      fetchLogs();
      toast("Email logged successfully!", "success");
    } catch (err) {
      console.error("Error sending email:", err);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <Link href="/dashboard/crm" className="hover:text-blue-600">CRM</Link>
            <span>/</span>
            <span className="text-gray-900">Communications</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">📞 Communications Log</h1>
          <p className="text-gray-500">Track all calls and emails with leads</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCallModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            📞 Log Call
          </button>
          <button
            onClick={() => setShowEmailModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            📧 Send Email
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">📞</div>
            <div>
              <p className="text-2xl font-bold">{callLogs.length}</p>
              <p className="text-sm text-gray-500">Total Calls</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">📧</div>
            <div>
              <p className="text-2xl font-bold">{emailLogs.length}</p>
              <p className="text-sm text-gray-500">Total Emails</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">✅</div>
            <div>
              <p className="text-2xl font-bold">{callLogs.filter(c => c.outcome === "CONNECTED").length}</p>
              <p className="text-sm text-gray-500">Connected Calls</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center text-2xl">👀</div>
            <div>
              <p className="text-2xl font-bold">{emailLogs.filter(e => e.openedAt).length}</p>
              <p className="text-sm text-gray-500">Emails Opened</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab("calls")}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "calls" ? "border-green-600 text-green-600" : "border-transparent text-gray-500"
            }`}
          >
            📞 Calls ({callLogs.length})
          </button>
          <button
            onClick={() => setActiveTab("emails")}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "emails" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"
            }`}
          >
            📧 Emails ({emailLogs.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm">
        {activeTab === "calls" && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outcome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {callLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No call logs yet. Log your first call!
                    </td>
                  </tr>
                ) : (
                  callLogs.map((call) => (
                    <tr key={call.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">{call.phoneNumber}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${call.callType === "OUTBOUND" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}>
                          {call.callType}
                        </span>
                      </td>
                      <td className="px-6 py-4">{formatDuration(call.duration)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          call.outcome === "CONNECTED" ? "bg-green-100 text-green-800" :
                          call.outcome === "NO_ANSWER" ? "bg-yellow-100 text-yellow-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {call.outcome || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm max-w-xs truncate">{call.notes || "-"}</td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {call.createdAt ? new Date(call.createdAt).toLocaleString() : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "emails" && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Opened</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {emailLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No email logs yet. Send your first email!
                    </td>
                  </tr>
                ) : (
                  emailLogs.map((email) => (
                    <tr key={email.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">{email.toEmail}</td>
                      <td className="px-6 py-4 max-w-xs truncate">{email.subject}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          email.status === "SENT" ? "bg-green-100 text-green-800" :
                          email.status === "FAILED" ? "bg-red-100 text-red-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {email.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {email.sentAt ? new Date(email.sentAt).toLocaleString() : "-"}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {email.openedAt ? new Date(email.openedAt).toLocaleString() : "Not opened"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Call Modal */}
      {showCallModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold mb-4">📞 Log Call</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number *</label>
                <input
                  type="tel"
                  value={callForm.phoneNumber}
                  onChange={(e) => setCallForm({ ...callForm, phoneNumber: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Enter phone number"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Call Type</label>
                  <select
                    value={callForm.callType}
                    onChange={(e) => setCallForm({ ...callForm, callType: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="OUTBOUND">Outbound</option>
                    <option value="INBOUND">Inbound</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Duration (sec)</label>
                  <input
                    type="number"
                    value={callForm.duration}
                    onChange={(e) => setCallForm({ ...callForm, duration: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border rounded-lg"
                    min="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Outcome</label>
                <select
                  value={callForm.outcome}
                  onChange={(e) => setCallForm({ ...callForm, outcome: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Select outcome...</option>
                  <option value="CONNECTED">Connected</option>
                  <option value="NO_ANSWER">No Answer</option>
                  <option value="BUSY">Busy</option>
                  <option value="VOICEMAIL">Voicemail</option>
                  <option value="WRONG_NUMBER">Wrong Number</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={callForm.notes}
                  onChange={(e) => setCallForm({ ...callForm, notes: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg h-20 resize-none"
                  placeholder="Call notes..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowCallModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button onClick={handleLogCall} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Log Call</button>
            </div>
          </div>
        </div>
      )}

      {/* Send Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
            <h2 className="text-lg font-semibold mb-4">📧 Send Email</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">To Email *</label>
                <input
                  type="email"
                  value={emailForm.toEmail}
                  onChange={(e) => setEmailForm({ ...emailForm, toEmail: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="recipient@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Subject *</label>
                <input
                  type="text"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Email subject"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Message</label>
                <textarea
                  value={emailForm.body}
                  onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg h-32 resize-none"
                  placeholder="Email content..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowEmailModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button onClick={handleSendEmail} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
