"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../../lib/api";

interface Campaign {
  id: string;
  name: string;
  description: string;
  campaignType: string;
  channel: string;
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  status: string;
  leads: number;
  conversions: number;
  roi: number;
}

interface AdAccount {
  id: string;
  platform: string;
  accountId: string;
  accountName: string;
  status: string;
  balance: number;
  currency: string;
}

const CAMPAIGN_TYPES = ["AWARENESS", "LEAD_GEN", "CONVERSION", "RETARGETING", "BRAND"];
const CHANNELS = ["FACEBOOK", "INSTAGRAM", "GOOGLE", "TIKTOK", "ZALO", "YOUTUBE", "EMAIL", "SMS"];
const STATUSES = ["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"];

export default function AdsCampaignsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"campaigns" | "accounts" | "analytics">("campaigns");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([
    { id: "1", platform: "Facebook", accountId: "act_123456789", accountName: "LERA Main", status: "ACTIVE", balance: 5000000, currency: "VND" },
    { id: "2", platform: "Google", accountId: "123-456-7890", accountName: "LERA Ads", status: "ACTIVE", balance: 3000000, currency: "VND" },
    { id: "3", platform: "TikTok", accountId: "7012345678901234", accountName: "LERA TikTok", status: "ACTIVE", balance: 2000000, currency: "VND" },
  ]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterChannel, setFilterChannel] = useState<string>("ALL");

  const [newCampaign, setNewCampaign] = useState<Partial<Campaign>>({
    name: "",
    description: "",
    campaignType: "LEAD_GEN",
    channel: "FACEBOOK",
    budget: 0,
    startDate: "",
    endDate: "",
    status: "DRAFT",
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const data = await apiFetch("/api/marketing-campaigns").catch(() => []);
      if (Array.isArray(data) && data.length > 0) {
        // Transform API data to Campaign format
        const transformedCampaigns: Campaign[] = data.map((c: Record<string, unknown>) => ({
          id: c.id as string,
          name: c.campaignName as string || "",
          description: c.description as string || "",
          campaignType: c.campaignType as string || "LEAD_GEN",
          channel: c.campaignType as string || "FACEBOOK",
          budget: Number(c.budget) || 0,
          spent: Number(c.spentAmount) || 0,
          startDate: c.startDate as string || "",
          endDate: c.endDate as string || "",
          status: c.status as string || "DRAFT",
          leads: c.leadsGenerated as number || 0,
          conversions: c.conversions as number || 0,
          roi: c.conversions && c.spentAmount ? ((c.conversions as number) * 1000000 / Number(c.spentAmount)) : 0,
        }));
        setCampaigns(transformedCampaigns);
      } else {
        setCampaigns(getDemoCampaigns());
      }
      
      // Also fetch ad accounts
      const accountsData = await apiFetch("/api/ad-accounts/active").catch(() => []);
      if (Array.isArray(accountsData) && accountsData.length > 0) {
        setAdAccounts(accountsData.map((a: Record<string, unknown>) => ({
          id: a.id as string,
          platform: a.platform as string,
          accountId: a.accountId as string,
          accountName: a.accountName as string || "",
          status: a.isActive ? "ACTIVE" : "INACTIVE",
          balance: Number(a.monthlyBudget) - Number(a.totalSpend) || 0,
          currency: a.currency as string || "VND",
        })));
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      setCampaigns(getDemoCampaigns());
    } finally {
      setIsLoading(false);
    }
  };

  const getDemoCampaigns = (): Campaign[] => [
    {
      id: "1",
      name: "Back to School 2026",
      description: "Enrollment campaign for new semester",
      campaignType: "LEAD_GEN",
      channel: "FACEBOOK",
      budget: 50000000,
      spent: 32500000,
      startDate: "2026-01-01",
      endDate: "2026-01-31",
      status: "ACTIVE",
      leads: 245,
      conversions: 48,
      roi: 2.4,
    },
    {
      id: "2",
      name: "Summer Camp Promo",
      description: "Early bird registration for summer programs",
      campaignType: "CONVERSION",
      channel: "INSTAGRAM",
      budget: 30000000,
      spent: 28000000,
      startDate: "2025-12-15",
      endDate: "2026-01-15",
      status: "ACTIVE",
      leads: 180,
      conversions: 35,
      roi: 1.8,
    },
    {
      id: "3",
      name: "Brand Awareness Q1",
      description: "General brand visibility campaign",
      campaignType: "AWARENESS",
      channel: "TIKTOK",
      budget: 20000000,
      spent: 15000000,
      startDate: "2026-01-01",
      endDate: "2026-03-31",
      status: "ACTIVE",
      leads: 0,
      conversions: 0,
      roi: 0,
    },
    {
      id: "4",
      name: "Holiday Special 2025",
      description: "Christmas and New Year promotion",
      campaignType: "CONVERSION",
      channel: "GOOGLE",
      budget: 40000000,
      spent: 40000000,
      startDate: "2025-12-01",
      endDate: "2025-12-31",
      status: "COMPLETED",
      leads: 320,
      conversions: 72,
      roi: 3.2,
    },
  ];

  const handleCreateCampaign = async () => {
    try {
      const created = await apiFetch("/api/marketing-campaigns", {
        method: "POST",
        body: JSON.stringify(newCampaign),
      }).catch(() => null);

      if (created) {
        setCampaigns([...campaigns, { ...newCampaign, id: created.id || Date.now().toString(), spent: 0, leads: 0, conversions: 0, roi: 0 } as Campaign]);
      } else {
        // Local add for demo
        setCampaigns([...campaigns, { ...newCampaign, id: Date.now().toString(), spent: 0, leads: 0, conversions: 0, roi: 0 } as Campaign]);
      }
      setShowCreateModal(false);
      setNewCampaign({ name: "", description: "", campaignType: "LEAD_GEN", channel: "FACEBOOK", budget: 0, startDate: "", endDate: "", status: "DRAFT" });
    } catch (error) {
      console.error("Error creating campaign:", error);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await apiFetch(`/api/marketing-campaigns/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      }).catch(() => null);

      setCampaigns(campaigns.map((c) => (c.id === id ? { ...c, status } : c)));
    } catch (error) {
      console.error("Error updating campaign:", error);
    }
  };

  const handleDisconnectAccount = async (id: string, name: string) => {
    if (!confirm(`Disconnect ad account "${name}"? This will revoke its access tokens.`)) return;
    try {
      await apiFetch(`/api/ad-accounts/${id}/disconnect`, { method: "PUT" });
      await fetchCampaigns();
    } catch (error) {
      console.error("Error disconnecting ad account:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  const filteredCampaigns = campaigns.filter((c) => {
    if (filterStatus !== "ALL" && c.status !== filterStatus) return false;
    if (filterChannel !== "ALL" && c.channel !== filterChannel) return false;
    return true;
  });

  const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0);
  const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0);
  const totalLeads = campaigns.reduce((sum, c) => sum + c.leads, 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-700";
      case "PAUSED": return "bg-yellow-100 text-yellow-700";
      case "COMPLETED": return "bg-blue-100 text-blue-700";
      case "CANCELLED": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "FACEBOOK": return "📘";
      case "INSTAGRAM": return "📸";
      case "GOOGLE": return "🔍";
      case "TIKTOK": return "🎵";
      case "ZALO": return "💬";
      case "YOUTUBE": return "▶️";
      case "EMAIL": return "📧";
      case "SMS": return "📱";
      default: return "📣";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
              <Link href="/dashboard/chairman/marketing" className="text-gray-500 hover:text-gray-700">
                ← Back
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">📣 Ads & Campaigns</h1>
                <p className="text-sm text-gray-500">Manage advertising campaigns and ad accounts</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              ➕ New Campaign
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Total Budget</div>
            <div className="text-xl font-bold text-gray-900">{formatCurrency(totalBudget)}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Total Spent</div>
            <div className="text-xl font-bold text-orange-600">{formatCurrency(totalSpent)}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Total Leads</div>
            <div className="text-xl font-bold text-blue-600">{totalLeads}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Conversions</div>
            <div className="text-xl font-bold text-green-600">{totalConversions}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Conversion Rate</div>
            <div className="text-xl font-bold text-purple-600">
              {totalLeads > 0 ? ((totalConversions / totalLeads) * 100).toFixed(1) : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex gap-2 border-b border-gray-200">
          {[
            { id: "campaigns", label: "📊 Campaigns" },
            { id: "accounts", label: "💳 Ad Accounts" },
            { id: "analytics", label: "📈 Analytics" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === "campaigns" && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-4 items-center">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="ALL">All Statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select
                value={filterChannel}
                onChange={(e) => setFilterChannel(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="ALL">All Channels</option>
                {CHANNELS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <span className="text-sm text-gray-500">
                Showing {filteredCampaigns.length} of {campaigns.length} campaigns
              </span>
            </div>

            {/* Campaign Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredCampaigns.map((campaign) => (
                <div key={campaign.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{getChannelIcon(campaign.channel)}</div>
                      <div>
                        <h3 className="font-bold text-gray-900">{campaign.name}</h3>
                        <p className="text-sm text-gray-500">{campaign.description}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                      {campaign.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-3 mb-4">
                    <div>
                      <div className="text-xs text-gray-500">Budget</div>
                      <div className="font-medium text-sm">{formatCurrency(campaign.budget)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Spent</div>
                      <div className="font-medium text-sm text-orange-600">{formatCurrency(campaign.spent)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Leads</div>
                      <div className="font-medium text-sm text-blue-600">{campaign.leads}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">ROI</div>
                      <div className={`font-medium text-sm ${campaign.roi >= 2 ? "text-green-600" : campaign.roi >= 1 ? "text-yellow-600" : "text-red-600"}`}>
                        {campaign.roi}x
                      </div>
                    </div>
                  </div>

                  {/* Budget Progress */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Budget Used</span>
                      <span>{((campaign.spent / campaign.budget) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${campaign.spent / campaign.budget > 0.9 ? "bg-red-500" : "bg-blue-500"}`}
                        style={{ width: `${Math.min((campaign.spent / campaign.budget) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{campaign.startDate} → {campaign.endDate}</span>
                    <div className="flex gap-2">
                      {campaign.status === "ACTIVE" && (
                        <button
                          onClick={() => handleUpdateStatus(campaign.id, "PAUSED")}
                          className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                        >
                          Pause
                        </button>
                      )}
                      {campaign.status === "PAUSED" && (
                        <button
                          onClick={() => handleUpdateStatus(campaign.id, "ACTIVE")}
                          className="px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                        >
                          Resume
                        </button>
                      )}
                      <button className="px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "accounts" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h2 className="font-bold text-gray-900">Connected Ad Accounts</h2>
                <p className="text-sm text-gray-500">Manage your advertising platform accounts</p>
              </div>
              <div className="divide-y divide-gray-100">
                {adAccounts.map((account) => (
                  <div key={account.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-xl">
                        {account.platform === "Facebook" && "📘"}
                        {account.platform === "Google" && "🔍"}
                        {account.platform === "TikTok" && "🎵"}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{account.accountName}</div>
                        <div className="text-sm text-gray-500">{account.platform} • {account.accountId}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Balance</div>
                        <div className="font-bold text-green-600">{formatCurrency(account.balance)}</div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${account.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                        {account.status}
                      </span>
                      <button
                        onClick={() => handleDisconnectAccount(account.id, account.accountName)}
                        className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => { window.location.href = "/dashboard/connect"; }}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-500 transition"
            >
              ➕ Connect New Ad Account
            </button>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* Performance Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="font-bold text-gray-900 mb-4">📈 Performance Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                  <div className="text-4xl font-bold text-blue-600">{totalLeads}</div>
                  <div className="text-gray-600 mt-1">Total Leads Generated</div>
                  <div className="text-green-600 text-sm mt-2">↑ 23% vs last month</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                  <div className="text-4xl font-bold text-green-600">{totalConversions}</div>
                  <div className="text-gray-600 mt-1">Conversions</div>
                  <div className="text-green-600 text-sm mt-2">↑ 18% vs last month</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                  <div className="text-4xl font-bold text-purple-600">
                    {formatCurrency(totalLeads > 0 ? totalSpent / totalLeads : 0)}
                  </div>
                  <div className="text-gray-600 mt-1">Cost per Lead</div>
                  <div className="text-red-600 text-sm mt-2">↓ 8% vs last month</div>
                </div>
              </div>
            </div>

            {/* Channel Performance */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="font-bold text-gray-900 mb-4">📊 Channel Performance</h2>
              <div className="space-y-4">
                {CHANNELS.slice(0, 5).map((channel) => {
                  const channelCampaigns = campaigns.filter((c) => c.channel === channel);
                  const channelLeads = channelCampaigns.reduce((sum, c) => sum + c.leads, 0);
                  const channelSpent = channelCampaigns.reduce((sum, c) => sum + c.spent, 0);
                  const percentage = totalLeads > 0 ? (channelLeads / totalLeads) * 100 : 0;

                  return (
                    <div key={channel} className="flex items-center gap-4">
                      <div className="w-24 text-sm font-medium text-gray-700 flex items-center gap-2">
                        {getChannelIcon(channel)} {channel}
                      </div>
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="h-3 rounded-full bg-blue-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="w-20 text-right text-sm text-gray-600">{channelLeads} leads</div>
                      <div className="w-32 text-right text-sm text-gray-600">{formatCurrency(channelSpent)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Create New Campaign</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
                <input
                  type="text"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., Summer Enrollment 2026"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Type</label>
                  <select
                    value={newCampaign.campaignType}
                    onChange={(e) => setNewCampaign({ ...newCampaign, campaignType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {CAMPAIGN_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                  <select
                    value={newCampaign.channel}
                    onChange={(e) => setNewCampaign({ ...newCampaign, channel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {CHANNELS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget (VND)</label>
                <input
                  type="number"
                  value={newCampaign.budget}
                  onChange={(e) => setNewCampaign({ ...newCampaign, budget: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., 10000000"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newCampaign.startDate}
                    onChange={(e) => setNewCampaign({ ...newCampaign, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={newCampaign.endDate}
                    onChange={(e) => setNewCampaign({ ...newCampaign, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCampaign}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
