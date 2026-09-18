"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";

/**
 * View shape. The API's Lead has parentName / parentPhone / parentEmail / utmSource — reading
 * name / email / phone / source left every column of this table blank, and POSTing those names
 * dropped them, so lead creation failed outright against the NOT NULL parent_name and
 * parent_phone. Status is stored UPPERCASE (NEW, CONTACTED, QUALIFIED, CONVERTED, LOST); the
 * lowercase values this page used matched nothing and wrote a status no other screen recognises.
 */
interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  assignedTo?: string;
  notes?: string;
  createdAt: string;
}

interface Deal {
  id: string;
  dealCode: string;
  title: string;
  leadId?: string;
  leadName?: string;
  value: number;
  stage: string;
  probability: number;
  expectedCloseDate?: string;
  notes?: string;
  createdAt: string;
}

export default function CRMManagement() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"leads" | "pipeline" | "clients" | "deals">("leads");
  const [showModal, setShowModal] = useState(false);
  const [showDealModal, setShowDealModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", source: "website", status: "NEW" });
  const [dealForm, setDealForm] = useState({ dealCode: "", title: "", leadId: "", value: 0, stage: "prospecting", probability: 10, expectedCloseDate: "", notes: "" });

  useEffect(() => {
    fetchLeads().then(fetchDeals);
  }, []);

  const toView = (l: any): Lead => ({
    ...l,
    name: l.parentName || l.studentName || "",
    email: l.parentEmail || "",
    phone: l.parentPhone || "",
    source: l.utmSource || "",
    status: String(l.status || "NEW").toUpperCase(),
  });

  const fetchLeads = async (): Promise<Lead[]> => {
    try {
      const data = await apiFetch("/api/leads");
      const mapped = (Array.isArray(data) ? data : []).map(toView);
      setLeads(mapped);
      return mapped;
    } catch (error) {
      console.error("Error fetching leads:", error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Takes the leads it needs as an argument: this used to read the `leads` state, which is still
  // empty when both fetches start together, so every deal was labelled "Unknown" regardless.
  const fetchDeals = async (knownLeads: Lead[]) => {
    try {
      const data = await apiFetch("/api/deals");
      const dealsArr = Array.isArray(data) ? data : [];
      const byId = new Map(knownLeads.map((l) => [l.id, l]));
      const hydratedDeals = dealsArr.map((deal: Deal) =>
        deal.leadId ? { ...deal, leadName: byId.get(deal.leadId)?.name || "" } : deal
      );
      setDeals(hydratedDeals);
    } catch (error) {
      console.error("Error fetching deals:", error);
      setDeals([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    // The API binds the Lead entity: parent_name and parent_phone are NOT NULL and the
    // controller rejects either blank, so these names are not cosmetic.
    const body = {
      parentName: formData.name,
      parentEmail: formData.email || null,
      parentPhone: formData.phone,
      utmSource: formData.source || null,
      status: formData.status,
    };
    try {
      if (editingLead) {
        await apiFetch(`/api/leads/${editingLead.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch("/api/leads", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      setShowModal(false);
      setEditingLead(null);
      const refreshed = await fetchLeads();
      await fetchDeals(refreshed);
      setFormData({ name: "", email: "", phone: "", source: "website", status: "NEW" });
    } catch (error) {
      console.error("Error saving lead:", error);
      setSaveError("Could not save the lead. Name and phone are both required.");
    }
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      source: lead.source,
      status: lead.status,
    });
    setShowModal(true);
  };

  const handleFollowUp = async (lead: Lead) => {
    const newStatus = lead.status === "NEW" ? "CONTACTED" : lead.status === "CONTACTED" ? "QUALIFIED" : lead.status;
    if (newStatus === lead.status) return;
    try {
      // Send only the status — spreading the view object back would post the view's own field
      // names, and writing a lowercase status made the lead invisible to every other screen.
      await apiFetch(`/api/leads/${lead.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      const refreshed = await fetchLeads();
      await fetchDeals(refreshed);
      alert(`Lead "${lead.name}" moved to ${newStatus} status`);
    } catch (error) {
      console.error("Error following up:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    try {
      await apiFetch(`/api/leads/${id}`, { method: "DELETE" });
      const refreshed = await fetchLeads();
      await fetchDeals(refreshed);
    } catch (error) {
      console.error("Error deleting lead:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "new": return "bg-blue-100 text-blue-800";
      case "contacted": return "bg-yellow-100 text-yellow-800";
      case "qualified": return "bg-purple-100 text-purple-800";
      case "converted": return "bg-green-100 text-green-800";
      case "lost": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleDealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDeal) {
        await apiFetch(`/api/deals/${editingDeal.id}`, {
          method: "PUT",
          body: JSON.stringify(dealForm),
        });
      } else {
        await apiFetch("/api/deals", {
          method: "POST",
          body: JSON.stringify(dealForm),
        });
      }
      setShowDealModal(false);
      setEditingDeal(null);
      fetchDeals(leads);
      setDealForm({ dealCode: "", title: "", leadId: "", value: 0, stage: "prospecting", probability: 10, expectedCloseDate: "", notes: "" });
    } catch (error) {
      console.error("Error saving deal:", error);
    }
  };

  const handleDealDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this deal?")) return;
    try {
      await apiFetch(`/api/deals/${id}`, { method: "DELETE" });
      fetchDeals(leads);
    } catch (error) {
      console.error("Error deleting deal:", error);
    }
  };

  const getDealStageColor = (stage: string) => {
    switch (stage?.toLowerCase()) {
      case "prospecting": return "bg-blue-100 text-blue-800";
      case "proposal": return "bg-yellow-100 text-yellow-800";
      case "negotiation": return "bg-purple-100 text-purple-800";
      case "closed-won": return "bg-green-100 text-green-800";
      case "closed-lost": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CRM Management</h1>
          <p className="text-gray-500">Manage leads, clients, and sales pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/superadmin/crm/pipeline" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
            🧲 Pipeline
          </Link>
          <Link href="/dashboard/superadmin/crm/team-performance" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
            🏆 Team Performance
          </Link>
          <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            + Add Lead
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <h3 className="text-gray-500 text-sm">New Leads</h3>
          <p className="text-2xl font-bold">{leads.filter(l => l.status === "NEW").length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <h3 className="text-gray-500 text-sm">Contacted</h3>
          <p className="text-2xl font-bold">{leads.filter(l => l.status === "CONTACTED").length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <h3 className="text-gray-500 text-sm">Qualified</h3>
          <p className="text-2xl font-bold">{leads.filter(l => l.status === "QUALIFIED").length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <h3 className="text-gray-500 text-sm">Converted</h3>
          <p className="text-2xl font-bold">{leads.filter(l => l.status === "CONVERTED").length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <h3 className="text-gray-500 text-sm">Lost</h3>
          <p className="text-2xl font-bold">{leads.filter(l => l.status === "LOST").length}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex">
            {(["leads", "pipeline", "clients", "deals"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-4 text-sm font-medium capitalize ${activeTab === tab ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === "leads" && (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leads.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No leads found. Add your first lead!</td></tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{lead.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{lead.email}</div>
                      <div className="text-sm text-gray-500">{lead.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 capitalize">{lead.source}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(lead.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button onClick={() => handleEdit(lead)} className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                      <button onClick={() => handleFollowUp(lead)} className="text-green-600 hover:text-green-900 mr-3">Follow Up</button>
                      <button onClick={() => handleDelete(lead.id)} className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {activeTab === "pipeline" && (
          <div className="p-6">
            <div className="grid grid-cols-5 gap-4">
              {["New", "Contacted", "Qualified", "Negotiation", "Won"].map((stage, i) => (
                <div key={stage} className="bg-gray-100 rounded-lg p-4">
                  <h3 className="font-medium text-gray-700 mb-3">{stage}</h3>
                  <div className="space-y-2">
                    {leads.filter(l => l.status?.toLowerCase() === stage.toLowerCase()).slice(0, 3).map(lead => (
                      <div key={lead.id} className="bg-white p-3 rounded shadow-sm">
                        <p className="font-medium text-sm">{lead.name}</p>
                        <p className="text-xs text-gray-500">{lead.email}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "clients" && (
          <div className="p-8 text-center text-gray-500">
            <p>Client management - Converted leads become clients</p>
            <p className="mt-2">{leads.filter(l => l.status === "CONVERTED").length} clients</p>
          </div>
        )}

        {activeTab === "deals" && (
          <div>
            <div className="p-4 border-b flex justify-between items-center">
              <div className="flex items-center gap-4">
                <span className="text-gray-600">{deals.length} deals</span>
                <span className="text-green-600 font-medium">
                  Total Value: ${deals.reduce((sum, d) => sum + (d.value || 0), 0).toLocaleString()}
                </span>
                <span className="text-blue-600 font-medium">
                  Weighted: ${deals.reduce((sum, d) => sum + ((d.value || 0) * (d.probability || 0) / 100), 0).toLocaleString()}
                </span>
              </div>
              <button onClick={() => { setEditingDeal(null); setDealForm({ dealCode: "", title: "", leadId: "", value: 0, stage: "prospecting", probability: 10, expectedCloseDate: "", notes: "" }); setShowDealModal(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Add Deal</button>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deal Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Probability</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected Close</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deals.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500">No deals yet. Create your first deal!</td></tr>
                ) : (
                  deals.map((deal) => (
                    <tr key={deal.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{deal.dealCode}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{deal.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{deal.leadName || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">${(deal.value || 0).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{deal.probability}%</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs ${getDealStageColor(deal.stage)}`}>{deal.stage}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button onClick={() => { setEditingDeal(deal); setDealForm({ dealCode: deal.dealCode, title: deal.title, leadId: deal.leadId || "", value: deal.value, stage: deal.stage, probability: deal.probability, expectedCloseDate: deal.expectedCloseDate || "", notes: deal.notes || "" }); setShowDealModal(true); }} className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                        <button onClick={() => handleDealDelete(deal.id)} className="text-red-600 hover:text-red-900">Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingLead ? "Edit Lead" : "Add New Lead"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                  <select value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                    <option value="website">Website</option>
                    <option value="referral">Referral</option>
                    <option value="social">Social Media</option>
                    <option value="advertisement">Advertisement</option>
                    <option value="walk-in">Walk-in</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                {saveError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                    {saveError}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                    <option value="NEW">New</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="QUALIFIED">Qualified</option>
                    <option value="CONVERTED">Converted</option>
                    <option value="LOST">Lost</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { setShowModal(false); setEditingLead(null); }} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingLead ? "Save Changes" : "Add Lead"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDealModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">{editingDeal ? "Edit Deal" : "Add New Deal"}</h2>
            <form onSubmit={handleDealSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deal Code *</label>
                  <input type="text" required value={dealForm.dealCode} onChange={(e) => setDealForm({ ...dealForm, dealCode: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="e.g., DL001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input type="text" required value={dealForm.title} onChange={(e) => setDealForm({ ...dealForm, title: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="Annual Subscription" />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Associated Lead</label>
                <select value={dealForm.leadId} onChange={(e) => setDealForm({ ...dealForm, leadId: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                  <option value="">-- No Lead --</option>
                  {leads.map((lead) => (
                    <option key={lead.id} value={lead.id}>{lead.name} ({lead.email})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deal Value *</label>
                  <input type="number" required min="0" value={dealForm.value} onChange={(e) => setDealForm({ ...dealForm, value: parseFloat(e.target.value) })} className="w-full border rounded-lg px-3 py-2" placeholder="10000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Probability %</label>
                  <input type="number" min="0" max="100" value={dealForm.probability} onChange={(e) => setDealForm({ ...dealForm, probability: parseInt(e.target.value) })} className="w-full border rounded-lg px-3 py-2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stage *</label>
                  <select required value={dealForm.stage} onChange={(e) => setDealForm({ ...dealForm, stage: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                    <option value="prospecting">Prospecting</option>
                    <option value="proposal">Proposal</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="closed-won">Closed Won</option>
                    <option value="closed-lost">Closed Lost</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Close Date</label>
                  <input type="date" value={dealForm.expectedCloseDate} onChange={(e) => setDealForm({ ...dealForm, expectedCloseDate: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={3} value={dealForm.notes} onChange={(e) => setDealForm({ ...dealForm, notes: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="Additional notes about this deal..."></textarea>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { setShowDealModal(false); setEditingDeal(null); }} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingDeal ? "Save Changes" : "Add Deal"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
