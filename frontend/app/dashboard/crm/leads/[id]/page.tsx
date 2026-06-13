"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../../lib/api";
import { ConvertLeadStudentModal } from "../../components/ConvertLeadStudentModal";
import {
  formatConvertLeadMessage,
  formatPlacementResyncMessage,
  leadNotesSuggestPlacementImport,
  type ConvertLeadApiResponse,
  type PlacementSyncPayload,
} from "../../placementSyncAlert";
import { ConvertLeadResultBanner } from "../../components/ConvertLeadResultBanner";

interface Lead {
  id: string;
  parentName?: string;
  fullName?: string;
  parentPhone?: string;
  phone?: string;
  parentEmail?: string;
  email?: string;
  status: string;
  utmSource?: string;
  source?: string;
  centerId?: string;
  studentAge?: number;
  notes?: string;
  createdAt?: string;
  preferredSchedule?: string;
  /** UUID of the Academy student this lead was converted to (set by backend on convert). */
  convertedStudentId?: string;
}

interface LeadNote {
  id: string;
  leadId: string;
  note: string;
  createdBy?: string;
  createdAt?: string;
}

interface LeadActivity {
  id: string;
  leadId: string;
  activityType: string;
  description?: string;
  outcome?: string;
  createdBy?: string;
  createdAt?: string;
}

interface LeadTag {
  id: string;
  name: string;
  color?: string;
}

interface Followup {
  id: string;
  leadId: string;
  actionType: string;
  nextFollowupDate?: string;
  notes?: string;
  outcome?: string;
  status?: string;
}

interface Center {
  id: string;
  name: string;
}

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [lead, setLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [tags, setTags] = useState<LeadTag[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "notes" | "activities" | "followups">("overview");
  
  // Modals
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [pendingConvertLeadId, setPendingConvertLeadId] = useState<string | null>(null);
  const [convertBanner, setConvertBanner] = useState<{
    message: string;
    sync?: PlacementSyncPayload;
  } | null>(null);
  const [resyncing, setResyncing] = useState(false);
  
  // Form data
  const [newNote, setNewNote] = useState("");
  const [newActivity, setNewActivity] = useState({ activityType: "CALL", description: "", outcome: "" });
  const [newFollowup, setNewFollowup] = useState({ actionType: "CALL", nextFollowupDate: "", notes: "" });

  useEffect(() => {
    fetchAllData();
  }, [id]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [leadData, notesData, activitiesData, followupsData, tagsData, centersData] = await Promise.all([
        apiFetch(`/api/leads/${id}`).catch(() => null),
        apiFetch(`/api/lead-notes/lead/${id}`).catch(() => []),
        apiFetch(`/api/lead-activities/lead/${id}`).catch(() => []),
        apiFetch(`/api/followups/lead/${id}`).catch(() => []),
        apiFetch("/api/lead-tags").catch(() => []),
        apiFetch("/api/centers").catch(() => []),
      ]);

      setLead(leadData);
      setNotes(Array.isArray(notesData) ? notesData : []);
      setActivities(Array.isArray(activitiesData) ? activitiesData : []);
      setFollowups(Array.isArray(followupsData) ? followupsData : []);
      setTags(Array.isArray(tagsData) ? tagsData : []);
      setCenters(Array.isArray(centersData) ? centersData : []);
    } catch (err) {
      console.error("Error fetching lead data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      await apiFetch("/api/lead-notes", {
        method: "POST",
        body: JSON.stringify({ leadId: id, note: newNote }),
      });
      setNewNote("");
      setShowNoteModal(false);
      fetchAllData();
    } catch (err) {
      console.error("Error adding note:", err);
    }
  };

  const handleAddActivity = async () => {
    try {
      await apiFetch("/api/lead-activities", {
        method: "POST",
        body: JSON.stringify({ leadId: id, ...newActivity }),
      });
      setNewActivity({ activityType: "CALL", description: "", outcome: "" });
      setShowActivityModal(false);
      fetchAllData();
    } catch (err) {
      console.error("Error adding activity:", err);
    }
  };

  const handleAddFollowup = async () => {
    try {
      await apiFetch("/api/followups", {
        method: "POST",
        body: JSON.stringify({ leadId: id, ...newFollowup }),
      });
      setNewFollowup({ actionType: "CALL", nextFollowupDate: "", notes: "" });
      setShowFollowupModal(false);
      fetchAllData();
    } catch (err) {
      console.error("Error adding followup:", err);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      await apiFetch(`/api/leads/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      fetchAllData();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const openConvertModal = () => {
    setPendingConvertLeadId(id);
    setConvertModalOpen(true);
  };

  const executeConvert = async (studentId: string | null) => {
    const leadId = pendingConvertLeadId;
    setConvertModalOpen(false);
    setPendingConvertLeadId(null);
    if (!leadId) return;
    setConverting(true);
    try {
      const data = (await apiFetch(`/api/leads/${leadId}/convert`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentId ? { studentId } : {}),
      })) as ConvertLeadApiResponse;
      setConvertBanner({
        message: formatConvertLeadMessage(data),
        sync: data.placementSync,
      });
      await fetchAllData();
    } catch (err) {
      console.error("Error converting lead:", err);
      alert("Error converting lead");
    } finally {
      setConverting(false);
    }
  };

  const handleResyncPlacement = async () => {
    if (!lead || !lead.convertedStudentId) return;
    setResyncing(true);
    try {
      const result = (await apiFetch(`/api/leads/${id}/placement-sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: lead.convertedStudentId }),
      })) as PlacementSyncPayload;
      setConvertBanner({
        message: formatPlacementResyncMessage(result),
        sync: result,
      });
    } catch (err) {
      console.error("Error re-importing placement:", err);
      alert("Error re-importing placement");
    } finally {
      setResyncing(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Delete this note?")) return;
    try {
      await apiFetch(`/api/lead-notes/${noteId}`, { method: "DELETE" });
      fetchAllData();
    } catch (err) {
      console.error("Error deleting note:", err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "NEW": return "bg-blue-100 text-blue-800";
      case "CONTACTED": return "bg-yellow-100 text-yellow-800";
      case "QUALIFIED": return "bg-green-100 text-green-800";
      case "CONVERTED": return "bg-purple-100 text-purple-800";
      case "LOST": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getCenterName = (centerId?: string) => {
    if (!centerId) return "Unassigned";
    return centers.find(c => c.id === centerId)?.name || "Unknown";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const combinedNotesForPlacement = lead
    ? [lead.notes, ...notes.map((n) => n.note)].filter(Boolean).join("\n")
    : "";
  const placementImportLikely = leadNotesSuggestPlacementImport(combinedNotesForPlacement);

  if (!lead) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-700">Lead not found</h2>
        <Link href="/dashboard/crm/leads" className="text-blue-600 hover:underline mt-4 inline-block">
          ← Back to Leads
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {convertBanner && (
        <ConvertLeadResultBanner
          message={convertBanner.message}
          sync={convertBanner.sync}
          onDismiss={() => setConvertBanner(null)}
        />
      )}
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <Link href="/dashboard/crm/leads" className="hover:text-blue-600">Leads</Link>
            <span>/</span>
            <span className="text-gray-900">{lead.parentName || lead.fullName}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">👤 {lead.parentName || lead.fullName}</h1>
          <p className="text-gray-500">Lead Details & Activity History</p>
        </div>
        <div className="flex gap-2">
          <select
            value={lead.status}
            onChange={(e) => handleUpdateStatus(e.target.value)}
            className={`px-4 py-2 rounded-lg border font-medium ${getStatusColor(lead.status)}`}
          >
            <option value="NEW">NEW</option>
            <option value="CONTACTED">CONTACTED</option>
            <option value="QUALIFIED">QUALIFIED</option>
            <option value="CONVERTED">CONVERTED</option>
            <option value="LOST">LOST</option>
          </select>
          <button
            onClick={() => setShowEditModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ✏️ Edit
          </button>
          {lead.status?.toUpperCase() !== "CONVERTED" && (
            <button
              onClick={() => openConvertModal()}
              disabled={converting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {converting ? "Converting…" : "Convert lead"}
            </button>
          )}
          {lead.status?.toUpperCase() === "CONVERTED" && lead.convertedStudentId && (
            <button
              onClick={handleResyncPlacement}
              disabled={resyncing || !placementImportLikely}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              title={
                placementImportLikely
                  ? "Re-run the placement import (Academy upserts by lead id)"
                  : "No informal placement block in initial or activity notes. Add [placement] scoreOutOf16=… or trackEn=… first."
              }
            >
              {resyncing ? "Re-importing…" : "Re-import placement"}
            </button>
          )}
        </div>
      </div>

      {/* Lead Info Card */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Contact Info</h3>
            <p className="mt-1 font-medium">{lead.parentPhone || lead.phone || "No phone"}</p>
            <p className="text-sm text-gray-500">{lead.parentEmail || lead.email || "No email"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Source</h3>
            <p className="mt-1 font-medium">{lead.utmSource || lead.source || "Direct"}</p>
            <p className="text-sm text-gray-500">Center: {getCenterName(lead.centerId)}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Created</h3>
            <p className="mt-1 font-medium">{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "Unknown"}</p>
            <p className="text-sm text-gray-500">Student Age: {lead.studentAge || "N/A"}</p>
          </div>
        </div>
        {lead.notes && (
          <div className="mt-4 pt-4 border-t">
            <h3 className="text-sm font-medium text-gray-500">Initial Notes</h3>
            <p className="mt-1 text-gray-700">{lead.notes}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {[
            { id: "overview", label: "📊 Overview", count: null },
            { id: "notes", label: "📝 Notes", count: notes.length },
            { id: "activities", label: "📋 Activities", count: activities.length },
            { id: "followups", label: "📞 Follow-ups", count: followups.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label} {tab.count !== null && <span className="ml-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs">{tab.count}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800">📝 Notes</h4>
              <p className="text-2xl font-bold text-blue-600">{notes.length}</p>
              <button onClick={() => setShowNoteModal(true)} className="mt-2 text-sm text-blue-600 hover:underline">+ Add Note</button>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-800">📋 Activities</h4>
              <p className="text-2xl font-bold text-green-600">{activities.length}</p>
              <button onClick={() => setShowActivityModal(true)} className="mt-2 text-sm text-green-600 hover:underline">+ Log Activity</button>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800">📞 Follow-ups</h4>
              <p className="text-2xl font-bold text-yellow-600">{followups.length}</p>
              <button onClick={() => setShowFollowupModal(true)} className="mt-2 text-sm text-yellow-600 hover:underline">+ Schedule</button>
            </div>
          </div>
        )}

        {activeTab === "notes" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Lead Notes</h3>
              <button onClick={() => setShowNoteModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Add Note</button>
            </div>
            {notes.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No notes yet. Add your first note!</p>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between">
                      <p className="text-gray-700">{note.note}</p>
                      <button onClick={() => handleDeleteNote(note.id)} className="text-red-500 hover:text-red-700 text-sm">🗑️</button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">{note.createdAt ? new Date(note.createdAt).toLocaleString() : "Just now"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "activities" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Activity Log</h3>
              <button onClick={() => setShowActivityModal(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">+ Log Activity</button>
            </div>
            {activities.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No activities logged yet.</p>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="p-4 bg-gray-50 rounded-lg flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                      {activity.activityType === "CALL" ? "📞" : activity.activityType === "EMAIL" ? "📧" : activity.activityType === "MEETING" ? "🤝" : "📋"}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="font-medium">{activity.activityType}</span>
                        <span className="text-xs text-gray-400">{activity.createdAt ? new Date(activity.createdAt).toLocaleString() : ""}</span>
                      </div>
                      <p className="text-gray-600 text-sm">{activity.description}</p>
                      {activity.outcome && <p className="text-xs text-gray-500 mt-1">Outcome: {activity.outcome}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "followups" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Scheduled Follow-ups</h3>
              <button onClick={() => setShowFollowupModal(true)} className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">+ Schedule</button>
            </div>
            {followups.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No follow-ups scheduled.</p>
            ) : (
              <div className="space-y-3">
                {followups.map((followup) => (
                  <div key={followup.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-medium">{followup.actionType}</span>
                        <p className="text-sm text-gray-600">{followup.notes}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{followup.nextFollowupDate ? new Date(followup.nextFollowupDate).toLocaleDateString() : "TBD"}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${followup.outcome ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                          {followup.outcome || "Pending"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold mb-4">Add Note</h2>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Enter your note..."
              className="w-full px-4 py-2 border rounded-lg h-32 resize-none"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowNoteModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button onClick={handleAddNote} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Activity Modal */}
      {showActivityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold mb-4">Log Activity</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Activity Type</label>
                <select
                  value={newActivity.activityType}
                  onChange={(e) => setNewActivity({ ...newActivity, activityType: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="CALL">📞 Call</option>
                  <option value="EMAIL">📧 Email</option>
                  <option value="MEETING">🤝 Meeting</option>
                  <option value="MESSAGE">💬 Message</option>
                  <option value="OTHER">📋 Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg h-20 resize-none"
                  placeholder="What happened?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Outcome</label>
                <select
                  value={newActivity.outcome}
                  onChange={(e) => setNewActivity({ ...newActivity, outcome: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Select outcome...</option>
                  <option value="INTERESTED">Interested</option>
                  <option value="NOT_INTERESTED">Not Interested</option>
                  <option value="CALLBACK">Callback Requested</option>
                  <option value="NO_ANSWER">No Answer</option>
                  <option value="SCHEDULED_DEMO">Demo Scheduled</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowActivityModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button onClick={handleAddActivity} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Followup Modal */}
      {showFollowupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold mb-4">Schedule Follow-up</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={newFollowup.actionType}
                  onChange={(e) => setNewFollowup({ ...newFollowup, actionType: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="CALL">📞 Call</option>
                  <option value="EMAIL">📧 Email</option>
                  <option value="MEETING">🤝 Meeting</option>
                  <option value="DEMO">🎯 Demo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="datetime-local"
                  value={newFollowup.nextFollowupDate}
                  onChange={(e) => setNewFollowup({ ...newFollowup, nextFollowupDate: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={newFollowup.notes}
                  onChange={(e) => setNewFollowup({ ...newFollowup, notes: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg h-20 resize-none"
                  placeholder="Follow-up notes..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowFollowupModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button onClick={handleAddFollowup} className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">Schedule</button>
            </div>
          </div>
        </div>
      )}

      <ConvertLeadStudentModal
        open={convertModalOpen}
        onClose={() => {
          setConvertModalOpen(false);
          setPendingConvertLeadId(null);
        }}
        centerId={lead.centerId}
        onConfirm={(studentId) => void executeConvert(studentId)}
      />
    </div>
  );
}
