"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  category: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export default function ChairmanSupportPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"tickets" | "faq" | "contact">("tickets");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [newTicket, setNewTicket] = useState({
    subject: "",
    description: "",
    category: "technical",
    priority: "medium",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch FAQs from API
      const faqData = await apiFetch("/api/faqs").catch(() => []);
      const faqsArray = Array.isArray(faqData) ? faqData : [];
      if (faqsArray.length > 0) {
        setFaqs(faqsArray.map((f: any) => ({
          id: f.id,
          question: f.question || f.title || "",
          answer: f.answer || f.content || "",
          category: f.category || "General"
        })));
      } else {
        // Demo FAQs
        setFaqs([
          {
            id: "1",
            question: "How do I add a new center location?",
            answer: "Navigate to Settings > Centers > Add New Center. Fill in the required details including address, contact information, and operating hours. After saving, you can assign staff and configure resources for the new center.",
            category: "Administration",
          },
          {
            id: "2",
            question: "How can I generate financial reports?",
            answer: "Go to Reports Center and select the type of financial report you need. You can customize the date range, centers to include, and export format. Reports can be scheduled for automatic generation and email delivery.",
            category: "Finance",
          },
          {
            id: "3",
            question: "How do I manage user permissions?",
            answer: "Access Settings > Roles & Permissions to create custom roles or modify existing ones. You can assign specific permissions for each module and action. Changes take effect immediately for all users with that role.",
            category: "Security",
          },
          {
            id: "4",
            question: "How can I view analytics across all centers?",
            answer: "The Analytics dashboard provides a unified view of all centers. Use the filter options to compare performance between centers, view trends over time, and identify areas for improvement.",
            category: "Analytics",
          },
          {
            id: "5",
            question: "How do I configure marketing campaigns?",
            answer: "Navigate to Marketing > Ads & Campaigns to create and manage campaigns. You can set budgets, target audiences, and track ROI. The system integrates with major advertising platforms for unified management.",
            category: "Marketing",
          },
        ]);
      }

      // Demo tickets
      setTickets([
        {
          id: "1",
          subject: "Dashboard loading slowly",
          description: "The main dashboard takes more than 5 seconds to load",
          status: "in_progress",
          priority: "high",
          category: "Performance",
          createdAt: "2026-01-07T10:30:00",
          updatedAt: "2026-01-08T09:15:00",
          assignedTo: "Tech Support Team",
        },
        {
          id: "2",
          subject: "Need help with report customization",
          description: "I want to create a custom report that shows enrollment by age group",
          status: "open",
          priority: "medium",
          category: "Feature Request",
          createdAt: "2026-01-06T14:20:00",
          updatedAt: "2026-01-06T14:20:00",
        },
        {
          id: "3",
          subject: "Payment integration issue",
          description: "Bank transfer payments not reflecting in the system",
          status: "resolved",
          priority: "urgent",
          category: "Technical",
          createdAt: "2026-01-05T08:45:00",
          updatedAt: "2026-01-06T11:30:00",
          assignedTo: "Finance Team",
        },
      ]);
    } catch (error) {
      console.error("Error fetching support data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitTicket = async () => {
    try {
      // In real implementation, submit to API
      const newTicketData: SupportTicket = {
        id: Date.now().toString(),
        ...newTicket,
        status: "open",
        priority: newTicket.priority as SupportTicket["priority"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTickets([newTicketData, ...tickets]);
      setShowNewTicket(false);
      setNewTicket({ subject: "", description: "", category: "technical", priority: "medium" });
      alert("Support ticket submitted successfully!");
    } catch (error) {
      console.error("Error submitting ticket:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-100 text-blue-700";
      case "in_progress": return "bg-yellow-100 text-yellow-700";
      case "resolved": return "bg-green-100 text-green-700";
      case "closed": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-700";
      case "high": return "bg-orange-100 text-orange-700";
      case "medium": return "bg-yellow-100 text-yellow-700";
      case "low": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
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
                <h1 className="text-xl font-bold text-gray-900">🎧 Support Center</h1>
                <p className="text-sm text-gray-500">Get help and manage support tickets</p>
              </div>
            </div>
            <button
              onClick={() => setShowNewTicket(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              ➕ New Ticket
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-3xl font-bold text-blue-600">
              {tickets.filter(t => t.status === "open").length}
            </div>
            <div className="text-sm text-gray-500">Open Tickets</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-3xl font-bold text-yellow-600">
              {tickets.filter(t => t.status === "in_progress").length}
            </div>
            <div className="text-sm text-gray-500">In Progress</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-3xl font-bold text-green-600">
              {tickets.filter(t => t.status === "resolved").length}
            </div>
            <div className="text-sm text-gray-500">Resolved</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-3xl font-bold text-gray-600">{faqs.length}</div>
            <div className="text-sm text-gray-500">FAQs Available</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-200">
            {[
              { id: "tickets", label: "My Tickets", icon: "🎫" },
              { id: "faq", label: "FAQ", icon: "❓" },
              { id: "contact", label: "Contact Support", icon: "📞" },
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
            {activeTab === "tickets" && (
              <div className="space-y-4">
                {tickets.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎫</div>
                    <h3 className="text-xl font-semibold mb-2">No Tickets</h3>
                    <p className="text-gray-500">You haven't submitted any support tickets yet.</p>
                  </div>
                ) : (
                  tickets.map((ticket) => (
                    <div key={ticket.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-gray-900">{ticket.subject}</h3>
                          <p className="text-sm text-gray-500 mt-1">{ticket.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                            {ticket.status.replace("_", " ")}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-4">
                          <span>📁 {ticket.category}</span>
                          {ticket.assignedTo && <span>👤 {ticket.assignedTo}</span>}
                        </div>
                        <div className="flex items-center gap-4">
                          <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                          <button className="text-blue-600 hover:text-blue-700 font-medium">
                            View Details →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "faq" && (
              <div className="space-y-4">
                {faqs.map((faq) => (
                  <div key={faq.id} className="border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                      className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">❓</span>
                        <span className="font-medium text-gray-900">{faq.question}</span>
                      </div>
                      <span className={`transform transition ${expandedFaq === faq.id ? "rotate-180" : ""}`}>
                        ▼
                      </span>
                    </button>
                    {expandedFaq === faq.id && (
                      <div className="px-4 pb-4 pt-2 bg-gray-50 border-t">
                        <p className="text-gray-600 ml-9">{faq.answer}</p>
                        <span className="inline-block mt-2 ml-9 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {faq.category}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "contact" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <h3 className="font-bold text-lg text-gray-900">Contact Information</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl">
                      <div className="text-2xl">📧</div>
                      <div>
                        <div className="font-medium">Email Support</div>
                        <a href="mailto:support@lera.edu.vn" className="text-blue-600 hover:underline">
                          support@lera.edu.vn
                        </a>
                        <p className="text-sm text-gray-500 mt-1">Response within 24 hours</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-green-50 rounded-xl">
                      <div className="text-2xl">📞</div>
                      <div>
                        <div className="font-medium">Phone Support</div>
                        <a href="tel:+84123456789" className="text-green-600 hover:underline">
                          +84 123 456 789
                        </a>
                        <p className="text-sm text-gray-500 mt-1">Mon-Fri: 8:00 AM - 6:00 PM</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-xl">
                      <div className="text-2xl">💬</div>
                      <div>
                        <div className="font-medium">Live Chat</div>
                        <button className="text-purple-600 hover:underline">Start Chat Session</button>
                        <p className="text-sm text-gray-500 mt-1">Available 24/7</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-xl">
                      <div className="text-2xl">📚</div>
                      <div>
                        <div className="font-medium">Documentation</div>
                        <a href="#" className="text-orange-600 hover:underline">View User Guide</a>
                        <p className="text-sm text-gray-500 mt-1">Comprehensive documentation</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-bold text-lg text-gray-900 mb-4">Quick Contact Form</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Brief description of your inquiry"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                      <textarea
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Please describe your issue or question in detail..."
                      ></textarea>
                    </div>
                    <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                      Send Message
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Ticket Modal */}
      {showNewTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Create Support Ticket</h2>
              <button onClick={() => setShowNewTicket(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of your issue"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="technical">Technical Issue</option>
                    <option value="feature">Feature Request</option>
                    <option value="billing">Billing</option>
                    <option value="general">General Inquiry</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Please describe your issue in detail..."
                ></textarea>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowNewTicket(false)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitTicket}
                  disabled={!newTicket.subject || !newTicket.description}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Submit Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
