"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { useLanguage } from "../../../context/LanguageContext";

interface EventItem {
  id: string;
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  type?: string;
  location?: string;
  allDay?: boolean;
}
interface Rsvp {
  id: string;
  eventId: string;
  response: string;
}

const RESPONSES: { key: string; en: string; vi: string; on: string }[] = [
  { key: "GOING", en: "Going", vi: "Tham gia", on: "bg-green-600 text-white border-green-600" },
  { key: "MAYBE", en: "Maybe", vi: "Có thể", on: "bg-amber-500 text-white border-amber-500" },
  { key: "NOT_GOING", en: "Can't go", vi: "Không thể", on: "bg-gray-600 text-white border-gray-600" },
];

export default function ParentEventsPage() {
  const { language } = useLanguage();
  const vi = language === "VI";
  const [events, setEvents] = useState<EventItem[]>([]);
  const [rsvps, setRsvps] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [ev, rs] = await Promise.all([
        apiFetch(`/api/calendar/upcoming?limit=25`).catch(() => []),
        apiFetch(`/api/event-rsvps`).catch(() => []),
      ]);
      setEvents(Array.isArray(ev) ? ev : (ev?.content || []));
      const map: Record<string, string> = {};
      (Array.isArray(rs) ? rs : []).forEach((r: Rsvp) => { map[r.eventId] = r.response; });
      setRsvps(map);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const respond = async (eventId: string, response: string) => {
    setSaving(eventId);
    const prev = rsvps[eventId];
    setRsvps((m) => ({ ...m, [eventId]: response })); // optimistic
    try {
      await apiFetch(`/api/event-rsvps`, { method: "POST", body: JSON.stringify({ eventId, response }) });
    } catch {
      setRsvps((m) => ({ ...m, [eventId]: prev })); // revert on failure
    } finally {
      setSaving(null);
    }
  };

  const fmt = (d?: string) => {
    if (!d) return "";
    const dt = new Date(d);
    return dt.toLocaleDateString(vi ? "vi-VN" : "en-US", { weekday: "short", day: "numeric", month: "short" }) +
      " · " + dt.toLocaleTimeString(vi ? "vi-VN" : "en-US", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/parent" className="text-sm text-gray-500 hover:text-gray-700">← {vi ? "Quay lại" : "Back"}</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">🎉 {vi ? "Sự kiện trường" : "School Events"}</h1>
        <p className="text-gray-500 text-sm">{vi ? "Sự kiện sắp tới — cho chúng tôi biết bạn có tham gia không" : "Upcoming events — let us know if you're coming"}</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">{vi ? "Đang tải…" : "Loading…"}</div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 text-gray-500 border border-dashed border-gray-200 rounded-2xl">
          {vi ? "Chưa có sự kiện sắp tới." : "No upcoming events."}
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((e) => {
            const mine = rsvps[e.id];
            return (
              <div key={e.id} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{e.title || (vi ? "Sự kiện" : "Event")}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{fmt(e.startDate)}{e.location ? ` · 📍 ${e.location}` : ""}</p>
                    {e.description && <p className="text-sm text-gray-600 mt-2 line-clamp-3">{e.description}</p>}
                  </div>
                  {e.type && <span className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-600 flex-shrink-0">{e.type}</span>}
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {RESPONSES.map((r) => (
                    <button
                      key={r.key}
                      disabled={saving === e.id}
                      onClick={() => respond(e.id, r.key)}
                      className={`px-4 py-1.5 text-sm rounded-full border transition-colors disabled:opacity-60 ${
                        mine === r.key ? r.on : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                      }`}
                    >{vi ? r.vi : r.en}</button>
                  ))}
                  {mine && <span className="self-center text-xs text-gray-400 ml-1">{vi ? "Đã trả lời" : "RSVP saved"}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
