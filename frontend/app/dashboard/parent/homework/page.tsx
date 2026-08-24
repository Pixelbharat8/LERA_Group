"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { loadMyChildren } from "../../../../lib/parent-context";
import { useLanguage } from "../../../context/LanguageContext";

interface Child {
  id: string;
  fullname: string;
  studentCode: string;
}

interface Assignment {
  id: number | string;
  title?: string;
  titleVi?: string;
  description?: string;
  descriptionVi?: string;
  assignmentType?: string;
  difficultyLevel?: string;
  estimatedDurationMinutes?: number;
  assignedDate?: string;
  dueDate?: string;
  maxScore?: number;
  isGraded?: boolean;
}

const TYPE_STYLES: Record<string, string> = {
  HOMEWORK: "bg-blue-100 text-blue-700",
  QUIZ: "bg-purple-100 text-purple-700",
  PROJECT: "bg-emerald-100 text-emerald-700",
  CLASSWORK: "bg-amber-100 text-amber-700",
  PRACTICE: "bg-cyan-100 text-cyan-700",
  EXAM_PREP: "bg-rose-100 text-rose-700",
  READING: "bg-indigo-100 text-indigo-700",
};

export default function ParentHomeworkPage() {
  const { language } = useLanguage();
  const vi = language === "VI";
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [items, setItems] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => { fetchChildren(); }, []);
  useEffect(() => { if (selectedChildId) fetchAssignments(selectedChildId); }, [selectedChildId]);

  const fetchChildren = async () => {
    try {
      const rows = await loadMyChildren();
      const mapped = rows.map((s) => ({ id: s.id, fullname: s.fullname || "Student", studentCode: s.studentCode || "" }));
      setChildren(mapped);
      if (mapped.length > 0) setSelectedChildId(mapped[0].id);
    } catch {
      setChildren([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async (studentId: string) => {
    setLoadingItems(true);
    try {
      const data = await apiFetch(`/api/assignments?studentId=${studentId}`).catch(() => []);
      const list: Assignment[] = Array.isArray(data) ? data : (data?.content || []);
      // Soonest due first; undated last.
      list.sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
      setItems(list);
    } catch {
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  const dueMeta = (due?: string) => {
    if (!due) return { label: vi ? "Không có hạn" : "No due date", tone: "text-gray-400" };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const d = new Date(due + "T00:00:00");
    const days = Math.round((d.getTime() - today.getTime()) / 86400000);
    if (days < 0) return { label: vi ? "Quá hạn" : "Overdue", tone: "text-red-600" };
    if (days === 0) return { label: vi ? "Đến hạn hôm nay" : "Due today", tone: "text-amber-600" };
    if (days <= 3) return { label: vi ? `Còn ${days} ngày` : `Due in ${days}d`, tone: "text-amber-600" };
    return { label: d.toLocaleDateString(), tone: "text-gray-500" };
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/parent" className="text-sm text-gray-500 hover:text-gray-700">← {vi ? "Quay lại" : "Back"}</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">📝 {vi ? "Bài tập về nhà" : "Homework"}</h1>
        <p className="text-gray-500 text-sm">{vi ? "Theo dõi bài tập của con em" : "Track your child's assignments"}</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">{vi ? "Đang tải…" : "Loading…"}</div>
      ) : children.length === 0 ? (
        <div className="text-center py-12 text-gray-500 border border-dashed border-gray-200 rounded-2xl">
          {vi ? "Chưa có con em nào được liên kết." : "No children linked yet."}
        </div>
      ) : (
        <>
          {/* Child selector */}
          {children.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {children.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedChildId(c.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                    selectedChildId === c.id ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  }`}
                >{c.fullname}</button>
              ))}
            </div>
          )}

          {loadingItems ? (
            <div className="text-center py-12 text-gray-400">{vi ? "Đang tải bài tập…" : "Loading assignments…"}</div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-gray-500 border border-dashed border-gray-200 rounded-2xl">
              {vi ? "Chưa có bài tập nào." : "No assignments yet."}
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((a) => {
                const meta = dueMeta(a.dueDate);
                const type = (a.assignmentType || "HOMEWORK").toUpperCase();
                return (
                  <div key={a.id} className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900">{(vi && a.titleVi) || a.title || (vi ? "Bài tập" : "Assignment")}</p>
                        {((vi && a.descriptionVi) || a.description) && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{(vi && a.descriptionVi) || a.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${TYPE_STYLES[type] || "bg-gray-100 text-gray-600"}`}>{type.replace("_", " ")}</span>
                          {a.difficultyLevel && <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-500">{a.difficultyLevel}</span>}
                          {a.estimatedDurationMinutes ? <span className="text-xs text-gray-400">~{a.estimatedDurationMinutes} {vi ? "phút" : "min"}</span> : null}
                          {a.maxScore ? <span className="text-xs text-gray-400">{vi ? "Điểm tối đa" : "Max"} {a.maxScore}</span> : null}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`text-sm font-medium ${meta.tone}`}>{meta.label}</span>
                        {a.isGraded && <p className="text-xs text-green-600 mt-1">{vi ? "Đã chấm" : "Graded"}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
