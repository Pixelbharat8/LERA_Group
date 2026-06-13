"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface StrategicGoal {
  id: string;
  title: string;
  description: string;
  category: "growth" | "operations" | "finance" | "hr" | "marketing";
  status: "on_track" | "at_risk" | "delayed" | "completed" | "in_progress";
  progress: number;
  dueDate: string;
  owner: string;
  kpis: { name: string; target: string; current: string; status: "green" | "yellow" | "red" }[];
}

interface Initiative {
  id: string;
  name: string;
  description: string;
  priority: "high" | "medium" | "low";
  status: "planned" | "in_progress" | "completed";
  budget: number;
  startDate: string;
  endDate: string;
}

export default function CEOStrategyPage() {
  const [goals, setGoals] = useState<StrategicGoal[]>([]);
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState<StrategicGoal | null>(null);
  const [activeTab, setActiveTab] = useState<"goals" | "initiatives" | "roadmap">("goals");

  useEffect(() => {
    fetchStrategicData();
  }, []);

  const fetchStrategicData = async () => {
    try {
      setLoading(true);
      // Demo strategic data
      setGoals([
        {
          id: "1",
          title: "Expand to 8 Centers by 2027",
          description: "Open 3 new learning centers across Hai Phong and neighboring provinces",
          category: "growth",
          status: "on_track",
          progress: 60,
          dueDate: "2027-12-31",
          owner: "CEO / Expansion Team",
          kpis: [
            { name: "New Centers Opened", target: "3", current: "2", status: "green" },
            { name: "Site Identified", target: "3", current: "3", status: "green" },
            { name: "Construction Started", target: "3", current: "1", status: "yellow" },
          ]
        },
        {
          id: "2",
          title: "Reach 3,000 Active Students",
          description: "Increase total enrolled students to 3,000 across all centers",
          category: "growth",
          status: "on_track",
          progress: 41,
          dueDate: "2027-06-30",
          owner: "Marketing Director",
          kpis: [
            { name: "Total Students", target: "3000", current: "1230", status: "yellow" },
            { name: "Monthly New Enrollments", target: "100", current: "85", status: "yellow" },
            { name: "Retention Rate", target: "90%", current: "92%", status: "green" },
          ]
        },
        {
          id: "3",
          title: "Achieve ₫25B Annual Revenue",
          description: "Grow annual revenue to 25 billion VND through service expansion and efficiency",
          category: "finance",
          status: "at_risk",
          progress: 62,
          dueDate: "2026-12-31",
          owner: "CFO",
          kpis: [
            { name: "Annual Revenue", target: "₫25B", current: "₫15.5B", status: "yellow" },
            { name: "Profit Margin", target: "45%", current: "47%", status: "green" },
            { name: "Collection Rate", target: "98%", current: "95%", status: "yellow" },
          ]
        },
        {
          id: "4",
          title: "Launch Online Learning Platform",
          description: "Develop and launch hybrid online/offline learning capabilities",
          category: "operations",
          status: "in_progress",
          progress: 35,
          dueDate: "2026-06-30",
          owner: "CTO / IT Team",
          kpis: [
            { name: "Platform Development", target: "100%", current: "35%", status: "yellow" },
            { name: "Content Digitized", target: "50 courses", current: "12 courses", status: "yellow" },
            { name: "Pilot Users", target: "500", current: "0", status: "red" },
          ]
        },
        {
          id: "5",
          title: "Build World-Class Teaching Team",
          description: "Recruit and retain top native English teachers and local educators",
          category: "hr",
          status: "on_track",
          progress: 80,
          dueDate: "2026-06-30",
          owner: "HR Director",
          kpis: [
            { name: "Native Teachers", target: "25", current: "20", status: "green" },
            { name: "Teacher Satisfaction", target: "4.5/5", current: "4.3/5", status: "green" },
            { name: "Training Hours/Year", target: "100h", current: "85h", status: "green" },
          ]
        },
      ]);

      setInitiatives([
        { id: "1", name: "Hai An Center Construction", description: "Build new 500sqm center in Hai An district", priority: "high", status: "planned", budget: 3000000000, startDate: "2026-03-01", endDate: "2026-12-31" },
        { id: "2", name: "AI-Powered Learning Platform", description: "Integrate AI tutoring and personalized learning", priority: "high", status: "in_progress", budget: 1500000000, startDate: "2025-06-01", endDate: "2026-06-30" },
        { id: "3", name: "Corporate Training Division", description: "Launch B2B corporate English training services", priority: "medium", status: "planned", budget: 500000000, startDate: "2026-06-01", endDate: "2026-12-31" },
        { id: "4", name: "Summer Camp Program", description: "Intensive summer English camp for kids", priority: "medium", status: "completed", budget: 200000000, startDate: "2025-05-01", endDate: "2025-08-31" },
        { id: "5", name: "Franchise Model Development", description: "Create franchise system for national expansion", priority: "low", status: "planned", budget: 800000000, startDate: "2027-01-01", endDate: "2027-12-31" },
      ]);
    } catch (error) {
      console.error("Error fetching strategic data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) return `₫${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `₫${(amount / 1000000).toFixed(0)}M`;
    return `₫${amount.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "on_track": case "completed": case "green": return "bg-green-100 text-green-800";
      case "at_risk": case "yellow": return "bg-yellow-100 text-yellow-800";
      case "delayed": case "red": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "growth": return "bg-blue-500";
      case "operations": return "bg-purple-500";
      case "finance": return "bg-green-500";
      case "hr": return "bg-orange-500";
      case "marketing": return "bg-pink-500";
      default: return "bg-gray-500";
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-800">Strategic Plans</h1>
          <p className="text-gray-600">Long-term goals and strategic initiatives</p>
        </div>
        <Link href="/dashboard/ceo" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
          ← Back to Dashboard
        </Link>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex gap-2">
          {(["goals", "initiatives", "roadmap"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === tab ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Goals Tab */}
      {activeTab === "goals" && (
        <div className="space-y-4">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className="bg-white rounded-xl shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedGoal(goal)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-full ${getCategoryColor(goal.category)} rounded-full`}></div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{goal.title}</h3>
                    <p className="text-gray-600 text-sm">{goal.description}</p>
                    <p className="text-gray-500 text-xs mt-1">Owner: {goal.owner}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(goal.status)}`}>
                  {goal.status.replace("_", " ").toUpperCase()}
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{goal.progress}%</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${goal.progress >= 70 ? "bg-green-500" : goal.progress >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Due Date</p>
                  <p className="font-medium">{new Date(goal.dueDate).toLocaleDateString()}</p>
                </div>
              </div>

              {/* KPIs Preview */}
              <div className="mt-4 pt-4 border-t flex gap-4">
                {goal.kpis.slice(0, 3).map((kpi, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(kpi.status).replace("text", "bg").split(" ")[0]}`}></div>
                    <span className="text-xs text-gray-600">{kpi.name}: {kpi.current}/{kpi.target}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Initiatives Tab */}
      {activeTab === "initiatives" && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4">Initiative</th>
                <th className="text-left py-3 px-4">Priority</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-right py-3 px-4">Budget</th>
                <th className="text-left py-3 px-4">Timeline</th>
              </tr>
            </thead>
            <tbody>
              {initiatives.map((initiative) => (
                <tr key={initiative.id} className="border-t hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <p className="font-medium">{initiative.name}</p>
                    <p className="text-sm text-gray-500">{initiative.description}</p>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      initiative.priority === "high" ? "bg-red-100 text-red-800" :
                      initiative.priority === "medium" ? "bg-yellow-100 text-yellow-800" :
                      "bg-green-100 text-green-800"
                    }`}>
                      {initiative.priority.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      initiative.status === "completed" ? "bg-green-100 text-green-800" :
                      initiative.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {initiative.status.replace("_", " ").toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right font-medium">{formatCurrency(initiative.budget)}</td>
                  <td className="py-4 px-4 text-sm text-gray-600">
                    {new Date(initiative.startDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })} - {new Date(initiative.endDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Roadmap Tab */}
      {activeTab === "roadmap" && (
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold mb-6">Strategic Roadmap 2025-2027</h3>
          <div className="space-y-8">
            {[2025, 2026, 2027].map((year) => (
              <div key={year}>
                <h4 className="text-xl font-bold text-blue-600 mb-4">{year}</h4>
                <div className="grid grid-cols-4 gap-4">
                  {["Q1", "Q2", "Q3", "Q4"].map((quarter) => (
                    <div key={quarter} className="border rounded-lg p-4">
                      <p className="font-medium text-gray-600 mb-2">{quarter}</p>
                      <div className="space-y-2 text-sm">
                        {year === 2025 && quarter === "Q1" && (
                          <>
                            <p className="bg-blue-50 p-2 rounded">🚀 AI Platform Beta</p>
                            <p className="bg-green-50 p-2 rounded">📈 Revenue Target: ₫3.5B</p>
                          </>
                        )}
                        {year === 2025 && quarter === "Q2" && (
                          <>
                            <p className="bg-purple-50 p-2 rounded">🏫 Teacher Training Program</p>
                            <p className="bg-orange-50 p-2 rounded">📱 Mobile App Launch</p>
                          </>
                        )}
                        {year === 2025 && quarter === "Q3" && (
                          <>
                            <p className="bg-pink-50 p-2 rounded">🎯 Corporate Sales Push</p>
                            <p className="bg-teal-50 p-2 rounded">🌟 Quality Certification</p>
                          </>
                        )}
                        {year === 2025 && quarter === "Q4" && (
                          <>
                            <p className="bg-yellow-50 p-2 rounded">🎉 Year-end Review</p>
                            <p className="bg-indigo-50 p-2 rounded">📊 2026 Planning</p>
                          </>
                        )}
                        {year === 2026 && quarter === "Q1" && (
                          <>
                            <p className="bg-blue-50 p-2 rounded">🏗️ Hai An Construction</p>
                            <p className="bg-green-50 p-2 rounded">💰 Series A Funding</p>
                          </>
                        )}
                        {year === 2026 && quarter === "Q2" && (
                          <>
                            <p className="bg-purple-50 p-2 rounded">🎓 Online Platform Live</p>
                            <p className="bg-orange-50 p-2 rounded">👥 Hire 10 Teachers</p>
                          </>
                        )}
                        {year === 2026 && quarter === "Q3" && (
                          <>
                            <p className="bg-pink-50 p-2 rounded">🏢 Center #6 Open</p>
                            <p className="bg-teal-50 p-2 rounded">🌍 Regional Expansion</p>
                          </>
                        )}
                        {year === 2026 && quarter === "Q4" && (
                          <>
                            <p className="bg-yellow-50 p-2 rounded">🎯 ₫25B Revenue Goal</p>
                            <p className="bg-indigo-50 p-2 rounded">📈 3000 Students</p>
                          </>
                        )}
                        {year === 2027 && quarter === "Q1" && (
                          <>
                            <p className="bg-blue-50 p-2 rounded">🚀 Franchise Launch</p>
                            <p className="bg-green-50 p-2 rounded">🏢 Center #7</p>
                          </>
                        )}
                        {year === 2027 && quarter === "Q2" && (
                          <>
                            <p className="bg-purple-50 p-2 rounded">🌏 Vietnam Expansion</p>
                            <p className="bg-orange-50 p-2 rounded">💼 IPO Preparation</p>
                          </>
                        )}
                        {year === 2027 && quarter === "Q3" && (
                          <p className="bg-gray-50 p-2 rounded text-gray-400">Planning...</p>
                        )}
                        {year === 2027 && quarter === "Q4" && (
                          <p className="bg-gray-50 p-2 rounded text-gray-400">Planning...</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goal Detail Modal */}
      {selectedGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(selectedGoal.status)}`}>
                  {selectedGoal.status.replace("_", " ").toUpperCase()}
                </span>
                <h2 className="text-xl font-bold mt-2">{selectedGoal.title}</h2>
                <p className="text-gray-600">{selectedGoal.description}</p>
              </div>
              <button onClick={() => setSelectedGoal(null)} className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Owner</p>
                  <p className="font-medium">{selectedGoal.owner}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Due Date</p>
                  <p className="font-medium">{new Date(selectedGoal.dueDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">Overall Progress</p>
                <div className="bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${selectedGoal.progress >= 70 ? "bg-green-500" : selectedGoal.progress >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
                    style={{ width: `${selectedGoal.progress}%` }}
                  />
                </div>
                <p className="text-right text-sm font-medium mt-1">{selectedGoal.progress}%</p>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Key Performance Indicators</h4>
                <div className="space-y-3">
                  {selectedGoal.kpis.map((kpi, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(kpi.status).replace("text", "bg").split(" ")[0]}`}></div>
                        <span>{kpi.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">{kpi.current}</span>
                        <span className="text-gray-400"> / {kpi.target}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
