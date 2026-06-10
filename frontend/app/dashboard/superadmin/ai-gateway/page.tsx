"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";

interface ServiceStatus {
  name: string;
  status: "running" | "stopped" | "error" | "not_configured";
  port?: string;
  message?: string;
}

export default function AIGatewayPage() {
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: "AI Gateway Service", status: "stopped", port: "8087" },
    { name: "OpenAI Integration", status: "not_configured" },
    { name: "Rule Engine", status: "stopped", port: "8088" },
  ]);
  const [stats, setStats] = useState({
    tutorSessions: 0,
    autoGradedEssays: 0,
    chatbotQueries: 0,
  });

  useEffect(() => {
    checkServiceStatus();
    fetchStats();
  }, []);

  const checkServiceStatus = async () => {
    setLoading(true);
    try {
      // Check AI Gateway (apiFetch sends auth; raw fetch reported "stopped" on a 401).
      const aiGateway = await apiFetch("/api/ai/health").then(() => "running").catch(() => "stopped");

      // Check Rule Engine
      const ruleEngine = await apiFetch("/api/rules/health").then(() => "running").catch(() => "stopped");

      setServices([
        { name: "AI Gateway Service", status: aiGateway as any, port: "8087" },
        { name: "OpenAI Integration", status: "not_configured", message: "API key required" },
        { name: "Rule Engine", status: ruleEngine as any, port: "8088" },
      ]);
    } catch (error) {
      console.error("Error checking services:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await apiFetch("/api/ai/stats").catch(() => null);
      if (data) {
        setStats({
          tutorSessions: data.tutorSessions || 0,
          autoGradedEssays: data.gradedEssays || 0,
          chatbotQueries: data.chatQueries || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching AI stats:", error);
    }
  };

  const getStatusBadge = (status: ServiceStatus["status"]) => {
    switch (status) {
      case "running":
        return "bg-green-100 text-green-800";
      case "stopped":
        return "bg-red-100 text-red-800";
      case "not_configured":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/superadmin" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-900">AI Gateway</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">🤖 AI Gateway</h1>
          <p className="text-gray-500">Configure AI services and integrations</p>
        </div>
        <button
          onClick={() => { checkServiceStatus(); fetchStats(); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>🔄</span> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-4">🧠</div>
              <h3 className="text-lg font-bold">AI Tutor</h3>
              <p className="text-sm text-gray-500 mb-2">Intelligent tutoring assistance</p>
              <p className="text-2xl font-bold text-blue-600 mb-2">{stats.tutorSessions}</p>
              <p className="text-xs text-gray-400">Sessions today</p>
              <span className="mt-2 inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-4">📝</div>
              <h3 className="text-lg font-bold">Auto Grading</h3>
              <p className="text-sm text-gray-500 mb-2">Automatic essay grading</p>
              <p className="text-2xl font-bold text-purple-600 mb-2">{stats.autoGradedEssays}</p>
              <p className="text-xs text-gray-400">Essays graded</p>
              <span className="mt-2 inline-block px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Beta</span>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-4">💬</div>
              <h3 className="text-lg font-bold">Chatbot</h3>
              <p className="text-sm text-gray-500 mb-2">24/7 student support</p>
              <p className="text-2xl font-bold text-green-600 mb-2">{stats.chatbotQueries}</p>
              <p className="text-xs text-gray-400">Queries handled</p>
              <span className="mt-2 inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">API Status</h2>
            <div className="space-y-3">
              {services.map((service, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                  <span>{service.name}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(service.status)}`}>
                    {service.status === "running" && service.port ? `Running on :${service.port}` : 
                     service.status === "not_configured" ? "Not Configured" :
                     service.status === "stopped" ? "Stopped" : service.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
