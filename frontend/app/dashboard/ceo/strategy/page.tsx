"use client";

import Link from "next/link";

/**
 * Strategic planning is a CEO-authored OKR module with no backend yet. Rather than show
 * fabricated goals/roadmap data, this is an honest placeholder pointing to the real,
 * data-backed CEO views (Growth + Analytics).
 */
export default function CEOStrategyPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Strategic Plans</h1>
          <p className="text-gray-600">Long-term goals and strategic initiatives</p>
        </div>
        <Link href="/dashboard/ceo" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
          ← Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow p-12 text-center">
        <div className="text-5xl mb-4">🧭</div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Strategic planning</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Goals, initiatives and the roadmap will appear here once your strategic plan is
          configured. For live business metrics see{" "}
          <Link href="/dashboard/ceo/growth" className="text-blue-600 hover:underline">CEO → Growth</Link>{" "}
          and{" "}
          <Link href="/dashboard/ceo/analytics" className="text-blue-600 hover:underline">Analytics</Link>.
        </p>
      </div>
    </div>
  );
}
