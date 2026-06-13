"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import { apiFetch } from "../../../../lib/api";

interface LeaderboardEntry {
  id: string;
  studentId: string;
  studentName?: string;
  totalPoints: number;
  currentLevel: number;
  lastActivityDate: string;
}

interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  pointsRequired: number;
}

export default function GamificationPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalPoints: 0, totalBadges: 0, totalAchievements: 0 });

  const defaultBadges: Badge[] = [
    { id: "1", name: "Beginner", icon: "🌟", description: "Complete first lesson", pointsRequired: 10 },
    { id: "2", name: "Reader", icon: "📚", description: "Read 5 lessons", pointsRequired: 50 },
    { id: "3", name: "Writer", icon: "✍️", description: "Submit 3 assignments", pointsRequired: 100 },
    { id: "4", name: "Achiever", icon: "🎯", description: "Score 90% on a test", pointsRequired: 200 },
    { id: "5", name: "Streak", icon: "🔥", description: "7 day learning streak", pointsRequired: 350 },
    { id: "6", name: "Champion", icon: "👑", description: "Top 3 in class", pointsRequired: 500 },
  ];

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const data = await apiFetch("/api/gamification/leaderboard");
      const entries = Array.isArray(data) ? data : data.data || [];
      setLeaderboard(entries);
      
      // Calculate stats
      const totalPoints = entries.reduce((sum: number, e: LeaderboardEntry) => sum + e.totalPoints, 0);
      setStats({
        totalPoints,
        totalBadges: defaultBadges.length,
        totalAchievements: entries.filter((e: LeaderboardEntry) => e.totalPoints > 100).length
      });
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
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
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard/superadmin" className="hover:text-blue-600">Dashboard</Link>
          <span>/</span>
          <span className="text-gray-900">Gamification</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">🎮 Gamification</h1>
        <p className="text-gray-500">Configure rewards, badges, and achievements</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <div className="text-4xl mb-2">🏆</div>
          <p className="text-2xl font-bold">{stats.totalAchievements}</p>
          <p className="text-sm text-gray-500">Achievements</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <div className="text-4xl mb-2">🎖️</div>
          <p className="text-2xl font-bold">{stats.totalBadges}</p>
          <p className="text-sm text-gray-500">Badges</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <div className="text-4xl mb-2">⭐</div>
          <p className="text-2xl font-bold">{stats.totalPoints.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Total Points</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <div className="text-4xl mb-2">👥</div>
          <p className="text-2xl font-bold">{leaderboard.length}</p>
          <p className="text-sm text-gray-500">Active Players</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold mb-4">Badges</h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {defaultBadges.map((badge) => (
            <div key={badge.id} className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              <div className="text-3xl mb-2">{badge.icon}</div>
              <p className="text-sm font-medium">{badge.name}</p>
              <p className="text-xs text-gray-500">{badge.pointsRequired} pts</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold mb-4">🏅 Leaderboard</h2>
        {leaderboard.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No leaderboard data yet. Points will appear as students engage with the platform.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leaderboard.slice(0, 10).map((entry, index) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-lg ${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''}`}>
                      {index < 3 ? '' : `#${index + 1}`}
                      {index === 0 && ' 🥇'}{index === 1 && ' 🥈'}{index === 2 && ' 🥉'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{entry.studentName || entry.studentId}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Level {entry.currentLevel}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-green-600">{entry.totalPoints.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
