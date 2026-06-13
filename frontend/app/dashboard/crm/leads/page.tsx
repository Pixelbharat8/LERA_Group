"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { exportToCsv, datedFilename } from "../../../../lib/export-csv";
import { useUserCenter, buildCenterFilterUrl } from "../../../hooks/useUserCenter";
import { ConvertLeadStudentModal } from "../components/ConvertLeadStudentModal";
import { formatConvertLeadMessage, type ConvertLeadApiResponse, type PlacementSyncPayload } from "../placementSyncAlert";
import { ConvertLeadResultBanner } from "../components/ConvertLeadResultBanner";

interface Lead {
  id: string;
  fullName: string;
  name?: string;
  phone: string;
  email: string;
  source: string;
  status: string;
  assignedTo?: string;
  centerId?: string;
  centerName?: string;
  createdAt: string;
  interestedCourse?: string;
  studentAge?: number;
  studentName?: string;
  notes?: string;
  utmMedium?: string;
  utmCampaign?: string;
  preferredSchedule?: string;
}

interface Center {
  id: string;
  name: string;
}

export default function LeadsPage() {
  const { centerId: userCenterId, shouldFilterByCenter, loading: userLoading } = useUserCenter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [converting, setConverting] = useState<string | null>(null);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [pendingConvertLeadId, setPendingConvertLeadId] = useState<string | null>(null);
  const [pendingConvertCenterId, setPendingConvertCenterId] = useState<string | null>(null);
  const [convertBanner, setConvertBanner] = useState<{
    message: string;
    sync?: PlacementSyncPayload;
  } | null>(null);
  const [selectedCenter, setSelectedCenter] = useState<string>("all");
  const [newLead, setNewLead] = useState({ fullName: "", phone: "", email: "", source: "Website", interestedCourse: "", studentAge: 0, centerId: "", preferredSchedule: "" });

  useEffect(() => {
    if (!userLoading) {
      fetchData();
    }
  }, [userLoading, userCenterId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch leads with center filter for CENTER_MANAGER
      const leadsUrl = shouldFilterByCenter 
        ? buildCenterFilterUrl("/api/leads", userCenterId)
        : "/api/leads";
      
      const [leadsData, centersData] = await Promise.all([
        apiFetch(leadsUrl).catch(() => []),
        apiFetch("/api/centers").catch(() => [])
      ]);

      const centersArr = Array.isArray(centersData) ? centersData : [];
      setCenters(centersArr);

      const leadsArray = Array.isArray(leadsData) ? leadsData : [];
      setLeads(
        leadsArray.map((l: any) => ({
          ...l,
          fullName: l.parentName || l.fullName || "",
          name: l.parentName || l.fullName || "",
          phone: l.parentPhone || l.phone || "",
          email: l.parentEmail || l.email || "",
          source: l.utmSource || l.source || "Website",
          assignedTo: "Sales Team",
          centerName: centersArr.find((c: Center) => c.id === l.centerId)?.name || "N/A",
          createdAt: l.createdAt?.split("T")[0] || "",
        }))
      );
      
      // Calculate stats from filtered leads
      const convertedCount = leadsArray.filter((l: any) => l.status === "CONVERTED").length;
      setStats({
        total: leadsArray.length,
        new: leadsArray.filter((l: any) => l.status === "NEW").length,
        contacted: leadsArray.filter((l: any) => l.status === "CONTACTED").length,
        qualified: leadsArray.filter((l: any) => l.status === "QUALIFIED").length,
        converted: convertedCount,
        lost: leadsArray.filter((l: any) => l.status === "LOST").length,
        conversionRate: leadsArray.length > 0 ? Math.round((convertedCount / leadsArray.length) * 100) : 0,
      });
    } catch (err) {
      console.error("Error fetching data:", err);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async () => {
    await fetchData();
  };

  const fetchStats = async () => {
    // Stats are now calculated in fetchData
  };

  const handleAddLead = async () => {
    try {
      const leadData = {
        parentName: newLead.fullName,
        parentPhone: newLead.phone,
        parentEmail: newLead.email,
        studentAge: newLead.studentAge || null,
        centerId: newLead.centerId || (shouldFilterByCenter ? userCenterId : null),
        preferredSchedule: newLead.preferredSchedule || null,
        notes: newLead.interestedCourse ? `Interested Course: ${newLead.interestedCourse}` : "",
        utmSource: newLead.source || "Manual",
        status: "NEW"
      };
      await apiFetch("/api/leads", {
        method: "POST",
        body: JSON.stringify(leadData),
      });
      await fetchData();
      setShowAddModal(false);
      setNewLead({ fullName: "", phone: "", email: "", source: "Website", interestedCourse: "", studentAge: 0, centerId: "", preferredSchedule: "" });
    } catch (err) {
      console.error("Error adding lead:", err);
    }
  };

  const openConvertModal = (id: string, centerId?: string) => {
    setPendingConvertLeadId(id);
    setPendingConvertCenterId(centerId ?? null);
    setConvertModalOpen(true);
  };

  const executeConvert = async (studentId: string | null) => {
    const id = pendingConvertLeadId;
    setConvertModalOpen(false);
    setPendingConvertLeadId(null);
    if (!id) return;
    setConverting(id);
    try {
      const opts: RequestInit = {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentId ? { studentId } : {}),
      };
      const data = (await apiFetch(`/api/leads/${id}/convert`, opts)) as ConvertLeadApiResponse;
      setConvertBanner({
        message: formatConvertLeadMessage(data),
        sync: data.placementSync,
      });
      await fetchData();
    } catch (err) {
      console.error("Error converting lead:", err);
      alert("Error converting lead");
    } finally {
      setConverting(null);
    }
  };

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
    setShowViewModal(true);
  };

  const updateLeadStatus = async (id: string, newStatus: string) => {
    try {
      await apiFetch(`/api/leads/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus })
      });
      await fetchData();
      setShowViewModal(false);
    } catch (err) {
      console.error("Error updating lead:", err);
    }
  };

  const handleToggleStatus = async (lead: Lead) => {
    const statusOrder = ["NEW", "CONTACTED", "QUALIFIED", "TRIAL_BOOKED", "TRIAL_ATTENDED", "CONVERTED", "LOST"];
    const currentIndex = statusOrder.indexOf(lead.status?.toUpperCase() || "NEW");
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    const newStatus = statusOrder[nextIndex];
    
    if (!confirm(`Move lead "${lead.fullName}" from ${lead.status} to ${newStatus}?`)) return;
    
    try {
      await apiFetch(`/api/leads/${lead.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus })
      });
      await fetchData();
    } catch (err) {
      console.error("Error updating lead status:", err);
    }
  };

  const getStatusColor = (status: string) => {
    const s = status?.toUpperCase();
    switch (s) {
      case "NEW":
        return "bg-blue-100 text-blue-800";
      case "CONTACTED":
        return "bg-yellow-100 text-yellow-800";
      case "QUALIFIED":
        return "bg-green-100 text-green-800";
      case "TRIAL_BOOKED":
        return "bg-blue-100 text-blue-800";
      case "TRIAL_ATTENDED":
        return "bg-indigo-100 text-indigo-800";
      case "NO_SHOW":
        return "bg-orange-100 text-orange-800";
      case "CONVERTED":
        return "bg-purple-100 text-purple-800";
      case "LOST":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Filter leads by selected center (additional filter for non-CENTER_MANAGER)
  const filteredLeads = selectedCenter === "all" 
    ? leads 
    : leads.filter(l => l.centerId === selectedCenter);

  return (
    <div className="space-y-6">
      {convertBanner && (
        <ConvertLeadResultBanner
          message={convertBanner.message}
          sync={convertBanner.sync}
          onDismiss={() => setConvertBanner(null)}
        />
      )}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/superadmin" className="hover:text-blue-600">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-gray-900">Leads</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">📞 Leads Management</h1>
          <p className="text-gray-500">Manage potential student inquiries</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() =>
              exportToCsv(datedFilename("leads"), leads, [
                { key: "fullName", label: "Name" },
                { key: "phone", label: "Phone" },
                { key: "email", label: "Email" },
                { key: "source", label: "Source" },
                { key: "status", label: "Status" },
                { key: "interestedCourse", label: "Interested Course" },
                { key: "studentName", label: "Student" },
                { key: "studentAge", label: "Age" },
                { key: "preferredSchedule", label: "Preferred Schedule" },
                { key: "centerName", label: "Centre" },
                { key: "createdAt", label: "Created" },
              ])
            }
            disabled={leads.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            📤 Export CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            ➕ Add Lead
          </button>
        </div>
      </div>

      {/* Center Filter (for non-CENTER_MANAGER) */}
      {!shouldFilterByCenter && centers.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Filter by Center:</label>
            <select
              value={selectedCenter}
              onChange={(e) => setSelectedCenter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="all">All Centers ({leads.length})</option>
              {centers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({leads.filter(l => l.centerId === c.id).length})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add New Lead</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Parent/Guardian Name *"
                value={newLead.fullName}
                onChange={(e) => setNewLead({ ...newLead, fullName: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="tel"
                placeholder="Phone *"
                value={newLead.phone}
                onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="email"
                placeholder="Email"
                value={newLead.email}
                onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              {!shouldFilterByCenter && (
                <select
                  value={newLead.centerId}
                  onChange={(e) => setNewLead({ ...newLead, centerId: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Select Center</option>
                  {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
              <select
                value={newLead.source}
                onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="Website">Website</option>
                <option value="Facebook">Facebook</option>
                <option value="Referral">Referral</option>
                <option value="Walk-in">Walk-in</option>
                <option value="Phone">Phone</option>
                <option value="Zalo">Zalo</option>
              </select>
              <input
                type="text"
                placeholder="Interested Course/Program"
                value={newLead.interestedCourse}
                onChange={(e) => setNewLead({ ...newLead, interestedCourse: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="number"
                placeholder="Student Age"
                value={newLead.studentAge || ""}
                onChange={(e) => setNewLead({ ...newLead, studentAge: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Preferred Schedule (e.g., Weekends, Evenings)"
                value={newLead.preferredSchedule}
                onChange={(e) => setNewLead({ ...newLead, preferredSchedule: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <div className="flex gap-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddLead}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Add Lead
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">📥</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.new || 0}</p>
              <p className="text-sm text-gray-500">New</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center text-2xl">📞</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.contacted || 0}</p>
              <p className="text-sm text-gray-500">Contacted</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">✅</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.qualified || 0}</p>
              <p className="text-sm text-gray-500">Qualified</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">🎉</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.converted || 0}</p>
              <p className="text-sm text-gray-500">Converted</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-2xl">❌</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.lost || 0}</p>
              <p className="text-sm text-gray-500">Lost</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing <span className="font-medium">{filteredLeads.length}</span> leads
            {stats.conversionRate > 0 && <span className="ml-2 text-green-600">({stats.conversionRate}% conversion rate)</span>}
          </p>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Center</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No leads found. Click "Add Lead" to create one.
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium">{lead.name}</div>
                  {lead.studentName && <div className="text-sm text-gray-500">Student: {lead.studentName}</div>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm">{lead.phone}</div>
                  <div className="text-sm text-gray-500">{lead.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600">{lead.centerName || "N/A"}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{lead.source}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleStatus(lead)}
                    className={`px-2 py-1 text-xs rounded-full cursor-pointer hover:opacity-80 ${getStatusColor(lead.status)}`}
                    title="Click to change status"
                  >
                    {lead.status}
                  </button>
                  {(lead as any).temperature && (
                    <span
                      className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        (lead as any).temperature === "HOT" ? "bg-red-100 text-red-700" :
                        (lead as any).temperature === "WARM" ? "bg-amber-100 text-amber-700" :
                        "bg-blue-100 text-blue-700"
                      }`}
                      title={`Lead score: ${(lead as any).score ?? "—"}`}
                    >
                      {(lead as any).temperature === "HOT" ? "🔥" : (lead as any).temperature === "WARM" ? "🌡️" : "❄️"} {(lead as any).score ?? ""}
                    </span>
                  )}
                  {(lead as any).duplicate && (
                    <span className="ml-1 px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-700" title="Possible duplicate (same phone)">⚠️ dup</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{lead.createdAt}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link 
                    href={`/dashboard/crm/leads/${lead.id}`}
                    className="text-blue-600 hover:text-blue-800 mr-3"
                  >
                    View
                  </Link>
                  {lead.status !== "CONVERTED" && (
                    <button
                      onClick={() => openConvertModal(lead.id, lead.centerId)}
                      disabled={converting === lead.id}
                      className="text-green-600 hover:text-green-800 disabled:opacity-50"
                    >
                      {converting === lead.id ? "Converting..." : "Convert"}
                    </button>
                  )}
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View Lead Modal */}
      {showViewModal && selectedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-xl font-bold">Lead Details</h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Name</label>
                  <p className="font-medium">{selectedLead.name || selectedLead.fullName}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Status</label>
                  <p><span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedLead.status)}`}>{selectedLead.status}</span></p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Phone</label>
                  <p className="font-medium">{selectedLead.phone}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <p className="font-medium">{selectedLead.email || "-"}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Source</label>
                  <p className="font-medium">{selectedLead.source}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Created</label>
                  <p className="font-medium">{selectedLead.createdAt}</p>
                </div>
                {selectedLead.studentName && (
                  <div>
                    <label className="text-sm text-gray-500">Student Name</label>
                    <p className="font-medium">{selectedLead.studentName}</p>
                  </div>
                )}
                {selectedLead.studentAge && (
                  <div>
                    <label className="text-sm text-gray-500">Student Age</label>
                    <p className="font-medium">{selectedLead.studentAge} years</p>
                  </div>
                )}
              </div>
              {selectedLead.notes && (
                <div>
                  <label className="text-sm text-gray-500">Notes</label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">{selectedLead.notes}</p>
                </div>
              )}
              
              <div className="border-t pt-4">
                <label className="text-sm text-gray-500 block mb-2">Update Status</label>
                <div className="flex flex-wrap gap-2">
                  {["NEW", "CONTACTED", "QUALIFIED", "TRIAL_BOOKED", "TRIAL_ATTENDED", "NO_SHOW", "CONVERTED", "LOST"].map(status => (
                    <button
                      key={status}
                      onClick={() => updateLeadStatus(selectedLead.id, status)}
                      className={`px-3 py-1 text-sm rounded-full border ${
                        selectedLead.status === status 
                          ? "bg-blue-600 text-white border-blue-600" 
                          : "border-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                {selectedLead.status !== "CONVERTED" && (
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      openConvertModal(selectedLead.id, selectedLead.centerId);
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Convert to Student
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConvertLeadStudentModal
        open={convertModalOpen}
        onClose={() => {
          setConvertModalOpen(false);
          setPendingConvertLeadId(null);
          setPendingConvertCenterId(null);
        }}
        centerId={pendingConvertCenterId}
        onConfirm={(studentId) => void executeConvert(studentId)}
      />
    </div>
  );
}
