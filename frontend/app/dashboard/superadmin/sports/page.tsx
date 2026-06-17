"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { apiFetch } from "@/lib/api";

interface SportTeam {
  id: string;
  name: string;
  sportType?: string;
  coach?: string;
  maxMembers?: number;
  centerId?: string;
  status?: string;
}

interface SportMatch {
  id: string;
  homeTeamId?: string;
  awayTeamId?: string;
  homeTeamName?: string;
  awayTeamName?: string;
  matchDate?: string;
  venue?: string;
  homeScore?: number;
  awayScore?: number;
  status?: string;
  tournamentId?: string;
}

interface SportFacility {
  id: string;
  name: string;
  type?: string;
  capacity?: number;
  location?: string;
  status?: string;
}

interface SportEquipment {
  id: string;
  name: string;
  type?: string;
  quantity?: number;
  condition?: string;
  facilityId?: string;
}

interface SportType {
  id: string;
  name: string;
  description?: string;
  maxPlayers?: number;
  category?: string;
}

interface TrainingSession {
  id: string;
  teamId?: string;
  teamName?: string;
  facilityId?: string;
  facilityName?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
  status?: string;
}

type TabType = "teams" | "matches" | "facilities" | "equipment" | "types" | "training";

export default function SportsManagement() {
  const [language, setLanguage] = useState("EN");
  const [activeTab, setActiveTab] = useState<TabType>("teams");
  const [loading, setLoading] = useState(true);

  // Data
  const [teams, setTeams] = useState<SportTeam[]>([]);
  const [matches, setMatches] = useState<SportMatch[]>([]);
  const [facilities, setFacilities] = useState<SportFacility[]>([]);
  const [equipment, setEquipment] = useState<SportEquipment[]>([]);
  const [sportTypes, setSportTypes] = useState<SportType[]>([]);
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const savedLang = Cookies.get("language");
    if (savedLang) setLanguage(savedLang);
    fetchAllData();
  }, []);

  const t = (en: string, vi: string) => (language === "VI" ? vi : en);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [teamsRes, matchesRes, facilitiesRes, equipRes, typesRes, sessionsRes] = await Promise.all([
        apiFetch("/api/sport-teams").catch(() => []),
        apiFetch("/api/sport-matches").catch(() => []),
        apiFetch("/api/sport-facilities").catch(() => []),
        apiFetch("/api/sport-equipment").catch(() => []),
        apiFetch("/api/sport-types").catch(() => []),
        apiFetch("/api/sport-training-sessions").catch(() => []),
      ]);

      // apiFetch returns PARSED data (not a Response) — normalise directly.
      const list = (res: any): any[] => Array.isArray(res) ? res : (res?.data || res?.content || []);
      setTeams(list(teamsRes));
      setMatches(list(matchesRes));
      setFacilities(list(facilitiesRes));
      setEquipment(list(equipRes));
      setSportTypes(list(typesRes));
      setTrainingSessions(list(sessionsRes));
    } catch (e) {
      console.error("Failed to fetch sports data:", e);
    } finally {
      setLoading(false);
    }
  };

  const getApiEndpoint = (tab: TabType): string => {
    const endpoints: Record<TabType, string> = {
      teams: "/api/sport-teams",
      matches: "/api/sport-matches",
      facilities: "/api/sport-facilities",
      equipment: "/api/sport-equipment",
      types: "/api/sport-types",
      training: "/api/sport-training-sessions",
    };
    return endpoints[tab];
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({});
    setShowModal(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({ ...item });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("Are you sure you want to delete this item?", "Bạn có chắc chắn muốn xóa mục này?"))) return;
    try {
      const endpoint = getApiEndpoint(activeTab);
      await apiFetch(`${endpoint}/${id}`, { method: "DELETE" });
      fetchAllData();
    } catch (e) {
      console.error("Delete failed:", e);
      alert(t("Failed to delete", "Xóa thất bại"));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const endpoint = getApiEndpoint(activeTab);
      const method = editingItem ? "PUT" : "POST";
      const url = editingItem ? `${endpoint}/${editingItem.id}` : endpoint;

      await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      setShowModal(false);
      setEditingItem(null);
      setFormData({});
      fetchAllData();
    } catch (e) {
      console.error("Save failed:", e);
      alert(t("Failed to save", "Lưu thất bại"));
    } finally {
      setSaving(false);
    }
  };

  const tabs: { id: TabType; label: string; icon: string; count: number }[] = [
    { id: "teams", label: t("Teams", "Đội"), icon: "⚽", count: teams.length },
    { id: "matches", label: t("Matches", "Trận đấu"), icon: "🏆", count: matches.length },
    { id: "facilities", label: t("Facilities", "Cơ sở"), icon: "🏟️", count: facilities.length },
    { id: "equipment", label: t("Equipment", "Thiết bị"), icon: "🏋️", count: equipment.length },
    { id: "types", label: t("Sport Types", "Loại thể thao"), icon: "🎯", count: sportTypes.length },
    { id: "training", label: t("Training", "Huấn luyện"), icon: "📋", count: trainingSessions.length },
  ];

  const renderTeamsTable = () => {
    const filtered = teams.filter(
      (t) =>
        t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.sportType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.coach?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return (
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left p-3 font-semibold">{t("Name", "Tên")}</th>
            <th className="text-left p-3 font-semibold">{t("Sport Type", "Loại thể thao")}</th>
            <th className="text-left p-3 font-semibold">{t("Coach", "Huấn luyện viên")}</th>
            <th className="text-left p-3 font-semibold">{t("Max Members", "Số thành viên tối đa")}</th>
            <th className="text-left p-3 font-semibold">{t("Status", "Trạng thái")}</th>
            <th className="text-right p-3 font-semibold">{t("Actions", "Hành động")}</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((team) => (
            <tr key={team.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="p-3 font-medium">{team.name}</td>
              <td className="p-3">{team.sportType || "-"}</td>
              <td className="p-3">{team.coach || "-"}</td>
              <td className="p-3">{team.maxMembers || "-"}</td>
              <td className="p-3">
                <span className={`px-2 py-1 rounded-full text-xs ${team.status === "ACTIVE" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"}`}>
                  {team.status || "ACTIVE"}
                </span>
              </td>
              <td className="p-3 text-right">
                <button onClick={() => handleEdit(team)} className="text-blue-600 hover:text-blue-800 mr-3">✏️</button>
                <button onClick={() => handleDelete(team.id)} className="text-red-600 hover:text-red-800">🗑️</button>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr><td colSpan={6} className="text-center p-8 text-gray-500">{t("No teams found", "Không tìm thấy đội nào")}</td></tr>
          )}
        </tbody>
      </table>
    );
  };

  const renderMatchesTable = () => {
    const filtered = matches.filter(
      (m) =>
        m.homeTeamName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.awayTeamName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.venue?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return (
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left p-3 font-semibold">{t("Home Team", "Đội nhà")}</th>
            <th className="text-left p-3 font-semibold">{t("Away Team", "Đội khách")}</th>
            <th className="text-left p-3 font-semibold">{t("Date", "Ngày")}</th>
            <th className="text-left p-3 font-semibold">{t("Venue", "Địa điểm")}</th>
            <th className="text-left p-3 font-semibold">{t("Score", "Tỷ số")}</th>
            <th className="text-left p-3 font-semibold">{t("Status", "Trạng thái")}</th>
            <th className="text-right p-3 font-semibold">{t("Actions", "Hành động")}</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((match) => (
            <tr key={match.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="p-3 font-medium">{match.homeTeamName || match.homeTeamId || "-"}</td>
              <td className="p-3">{match.awayTeamName || match.awayTeamId || "-"}</td>
              <td className="p-3">{match.matchDate ? new Date(match.matchDate).toLocaleDateString() : "-"}</td>
              <td className="p-3">{match.venue || "-"}</td>
              <td className="p-3">{match.homeScore != null && match.awayScore != null ? `${match.homeScore} - ${match.awayScore}` : "-"}</td>
              <td className="p-3">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  match.status === "COMPLETED" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                  match.status === "IN_PROGRESS" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                }`}>
                  {match.status || "SCHEDULED"}
                </span>
              </td>
              <td className="p-3 text-right">
                <button onClick={() => handleEdit(match)} className="text-blue-600 hover:text-blue-800 mr-3">✏️</button>
                <button onClick={() => handleDelete(match.id)} className="text-red-600 hover:text-red-800">🗑️</button>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr><td colSpan={7} className="text-center p-8 text-gray-500">{t("No matches found", "Không tìm thấy trận đấu nào")}</td></tr>
          )}
        </tbody>
      </table>
    );
  };

  const renderFacilitiesTable = () => {
    const filtered = facilities.filter(
      (f) =>
        f.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.location?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return (
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left p-3 font-semibold">{t("Name", "Tên")}</th>
            <th className="text-left p-3 font-semibold">{t("Type", "Loại")}</th>
            <th className="text-left p-3 font-semibold">{t("Capacity", "Sức chứa")}</th>
            <th className="text-left p-3 font-semibold">{t("Location", "Vị trí")}</th>
            <th className="text-left p-3 font-semibold">{t("Status", "Trạng thái")}</th>
            <th className="text-right p-3 font-semibold">{t("Actions", "Hành động")}</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((facility) => (
            <tr key={facility.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="p-3 font-medium">{facility.name}</td>
              <td className="p-3">{facility.type || "-"}</td>
              <td className="p-3">{facility.capacity || "-"}</td>
              <td className="p-3">{facility.location || "-"}</td>
              <td className="p-3">
                <span className={`px-2 py-1 rounded-full text-xs ${facility.status === "AVAILABLE" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"}`}>
                  {facility.status || "AVAILABLE"}
                </span>
              </td>
              <td className="p-3 text-right">
                <button onClick={() => handleEdit(facility)} className="text-blue-600 hover:text-blue-800 mr-3">✏️</button>
                <button onClick={() => handleDelete(facility.id)} className="text-red-600 hover:text-red-800">🗑️</button>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr><td colSpan={6} className="text-center p-8 text-gray-500">{t("No facilities found", "Không tìm thấy cơ sở nào")}</td></tr>
          )}
        </tbody>
      </table>
    );
  };

  const renderEquipmentTable = () => {
    const filtered = equipment.filter(
      (e) =>
        e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.type?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return (
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left p-3 font-semibold">{t("Name", "Tên")}</th>
            <th className="text-left p-3 font-semibold">{t("Type", "Loại")}</th>
            <th className="text-left p-3 font-semibold">{t("Quantity", "Số lượng")}</th>
            <th className="text-left p-3 font-semibold">{t("Condition", "Tình trạng")}</th>
            <th className="text-right p-3 font-semibold">{t("Actions", "Hành động")}</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((item) => (
            <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="p-3 font-medium">{item.name}</td>
              <td className="p-3">{item.type || "-"}</td>
              <td className="p-3">{item.quantity || "-"}</td>
              <td className="p-3">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  item.condition === "GOOD" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                  item.condition === "FAIR" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                  item.condition === "POOR" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                  "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                }`}>
                  {item.condition || "GOOD"}
                </span>
              </td>
              <td className="p-3 text-right">
                <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800 mr-3">✏️</button>
                <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800">🗑️</button>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr><td colSpan={5} className="text-center p-8 text-gray-500">{t("No equipment found", "Không tìm thấy thiết bị nào")}</td></tr>
          )}
        </tbody>
      </table>
    );
  };

  const renderTypesTable = () => {
    const filtered = sportTypes.filter(
      (s) =>
        s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return (
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left p-3 font-semibold">{t("Name", "Tên")}</th>
            <th className="text-left p-3 font-semibold">{t("Category", "Danh mục")}</th>
            <th className="text-left p-3 font-semibold">{t("Max Players", "Số người chơi tối đa")}</th>
            <th className="text-left p-3 font-semibold">{t("Description", "Mô tả")}</th>
            <th className="text-right p-3 font-semibold">{t("Actions", "Hành động")}</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((type) => (
            <tr key={type.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="p-3 font-medium">{type.name}</td>
              <td className="p-3">{type.category || "-"}</td>
              <td className="p-3">{type.maxPlayers || "-"}</td>
              <td className="p-3 max-w-xs truncate">{type.description || "-"}</td>
              <td className="p-3 text-right">
                <button onClick={() => handleEdit(type)} className="text-blue-600 hover:text-blue-800 mr-3">✏️</button>
                <button onClick={() => handleDelete(type.id)} className="text-red-600 hover:text-red-800">🗑️</button>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr><td colSpan={5} className="text-center p-8 text-gray-500">{t("No sport types found", "Không tìm thấy loại thể thao nào")}</td></tr>
          )}
        </tbody>
      </table>
    );
  };

  const renderTrainingTable = () => {
    const filtered = trainingSessions.filter(
      (s) =>
        s.teamName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.facilityName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.notes?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return (
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left p-3 font-semibold">{t("Team", "Đội")}</th>
            <th className="text-left p-3 font-semibold">{t("Facility", "Cơ sở")}</th>
            <th className="text-left p-3 font-semibold">{t("Date", "Ngày")}</th>
            <th className="text-left p-3 font-semibold">{t("Time", "Thời gian")}</th>
            <th className="text-left p-3 font-semibold">{t("Status", "Trạng thái")}</th>
            <th className="text-right p-3 font-semibold">{t("Actions", "Hành động")}</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((session) => (
            <tr key={session.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="p-3 font-medium">{session.teamName || session.teamId || "-"}</td>
              <td className="p-3">{session.facilityName || session.facilityId || "-"}</td>
              <td className="p-3">{session.date ? new Date(session.date).toLocaleDateString() : "-"}</td>
              <td className="p-3">{session.startTime && session.endTime ? `${session.startTime} - ${session.endTime}` : session.startTime || "-"}</td>
              <td className="p-3">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  session.status === "COMPLETED" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                  session.status === "CANCELLED" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                }`}>
                  {session.status || "SCHEDULED"}
                </span>
              </td>
              <td className="p-3 text-right">
                <button onClick={() => handleEdit(session)} className="text-blue-600 hover:text-blue-800 mr-3">✏️</button>
                <button onClick={() => handleDelete(session.id)} className="text-red-600 hover:text-red-800">🗑️</button>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr><td colSpan={6} className="text-center p-8 text-gray-500">{t("No training sessions found", "Không tìm thấy buổi huấn luyện nào")}</td></tr>
          )}
        </tbody>
      </table>
    );
  };

  const renderTable = () => {
    switch (activeTab) {
      case "teams": return renderTeamsTable();
      case "matches": return renderMatchesTable();
      case "facilities": return renderFacilitiesTable();
      case "equipment": return renderEquipmentTable();
      case "types": return renderTypesTable();
      case "training": return renderTrainingTable();
    }
  };

  const renderFormFields = () => {
    switch (activeTab) {
      case "teams":
        return (
          <>
            <div className="space-y-3">
              <label className="block text-sm font-medium">{t("Team Name", "Tên đội")} *</label>
              <input type="text" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium">{t("Sport Type", "Loại thể thao")}</label>
              <input type="text" value={formData.sportType || ""} onChange={(e) => setFormData({ ...formData, sportType: e.target.value })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium">{t("Coach", "Huấn luyện viên")}</label>
              <input type="text" value={formData.coach || ""} onChange={(e) => setFormData({ ...formData, coach: e.target.value })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium">{t("Max Members", "Số thành viên tối đa")}</label>
              <input type="number" value={formData.maxMembers || ""} onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) || undefined })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium">{t("Status", "Trạng thái")}</label>
              <select value={formData.status || "ACTIVE"} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                <option value="ACTIVE">{t("Active", "Hoạt động")}</option>
                <option value="INACTIVE">{t("Inactive", "Không hoạt động")}</option>
              </select>
            </div>
          </>
        );
      case "matches":
        return (
          <>
            <div className="space-y-3">
              <label className="block text-sm font-medium">{t("Home Team", "Đội nhà")}</label>
              <select value={formData.homeTeamId || ""} onChange={(e) => setFormData({ ...formData, homeTeamId: e.target.value })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                <option value="">{t("Select Team", "Chọn đội")}</option>
                {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium">{t("Away Team", "Đội khách")}</label>
              <select value={formData.awayTeamId || ""} onChange={(e) => setFormData({ ...formData, awayTeamId: e.target.value })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                <option value="">{t("Select Team", "Chọn đội")}</option>
                {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium">{t("Match Date", "Ngày thi đấu")}</label>
              <input type="datetime-local" value={formData.matchDate || ""} onChange={(e) => setFormData({ ...formData, matchDate: e.target.value })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium">{t("Venue", "Địa điểm")}</label>
              <input type="text" value={formData.venue || ""} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-3">
                <label className="block text-sm font-medium">{t("Home Score", "Điểm đội nhà")}</label>
                <input type="number" value={formData.homeScore ?? ""} onChange={(e) => setFormData({ ...formData, homeScore: parseInt(e.target.value) || 0 })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-medium">{t("Away Score", "Điểm đội khách")}</label>
                <input type="number" value={formData.awayScore ?? ""} onChange={(e) => setFormData({ ...formData, awayScore: parseInt(e.target.value) || 0 })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
              </div>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium">{t("Status", "Trạng thái")}</label>
              <select value={formData.status || "SCHEDULED"} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                <option value="SCHEDULED">{t("Scheduled", "Đã lên lịch")}</option>
                <option value="IN_PROGRESS">{t("In Progress", "Đang diễn ra")}</option>
                <option value="COMPLETED">{t("Completed", "Hoàn thành")}</option>
                <option value="CANCELLED">{t("Cancelled", "Đã hủy")}</option>
              </select>
            </div>
          </>
        );
      case "facilities":
        return (
          <>
            <div className="space-y-3">
              <label className="block text-sm font-medium">{t("Facility Name", "Tên cơ sở")} *</label>
              <input type="text" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium">{t("Type", "Loại")}</label>
              <select value={formData.type || ""} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                <option value="">{t("Select Type", "Chọn loại")}</option>
                <option value="FIELD">{t("Field", "Sân")}</option>
                <option value="COURT">{t("Court", "Sân nhỏ")}</option>
                <option value="POOL">{t("Pool", "Hồ bơi")}</option>
                <option value="GYM">{t("Gym", "Phòng tập")}</option>
                <option value="TRACK">{t("Track", "Đường chạy")}</option>
                <option value="OTHER">{t("Other", "Khác")}</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium">{t("Capacity", "Sức chứa")}</label>
              <input type="number" value={formData.capacity || ""} onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || undefined })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium">{t("Location", "Vị trí")}</label>
              <input type="text" value={formData.location || ""} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium">{t("Status", "Trạng thái")}</label>
              <select value={formData.status || "AVAILABLE"} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                <option value="AVAILABLE">{t("Available", "Khả dụng")}</option>
                <option value="MAINTENANCE">{t("Under Maintenance", "Đang bảo trì")}</option>
                <option value="RESERVED">{t("Reserved", "Đã đặt")}</option>
              </select>
            </div>
          </>
        );
      case "equipment":
        return (
          <>
            <div className="space-y-3">
              <label className="block text-sm font-medium">{t("Equipment Name", "Tên thiết bị")} *</label>
              <input type="text" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium">{t("Type", "Loại")}</label>
              <input type="text" value={formData.type || ""} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium">{t("Quantity", "Số lượng")}</label>
              <input type="number" value={formData.quantity || ""} onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || undefined })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium">{t("Condition", "Tình trạng")}</label>
              <select value={formData.condition || "GOOD"} onChange={(e) => setFormData({ ...formData, condition: e.target.value })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                <option value="NEW">{t("New", "Mới")}</option>
                <option value="GOOD">{t("Good", "Tốt")}</option>
                <option value="FAIR">{t("Fair", "Khá")}</option>
                <option value="POOR">{t("Poor", "Kém")}</option>
                <option value="DAMAGED">{t("Damaged", "Hư hỏng")}</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium">{t("Facility", "Cơ sở")}</label>
              <select value={formData.facilityId || ""} onChange={(e) => setFormData({ ...formData, facilityId: e.target.value })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                <option value="">{t("Select Facility", "Chọn cơ sở")}</option>
                {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          </>
        );
      case "types":
        return (
          <>
            <div className="space-y-3">
              <label className="block text-sm font-medium">{t("Sport Name", "Tên thể thao")} *</label>
              <input type="text" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium">{t("Category", "Danh mục")}</label>
              <select value={formData.category || ""} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                <option value="">{t("Select Category", "Chọn danh mục")}</option>
                <option value="TEAM">{t("Team Sport", "Thể thao đội")}</option>
                <option value="INDIVIDUAL">{t("Individual", "Cá nhân")}</option>
                <option value="RACQUET">{t("Racquet", "Vợt")}</option>
                <option value="AQUATIC">{t("Aquatic", "Thể thao dưới nước")}</option>
                <option value="MARTIAL_ARTS">{t("Martial Arts", "Võ thuật")}</option>
                <option value="OTHER">{t("Other", "Khác")}</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium">{t("Max Players", "Số người chơi tối đa")}</label>
              <input type="number" value={formData.maxPlayers || ""} onChange={(e) => setFormData({ ...formData, maxPlayers: parseInt(e.target.value) || undefined })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium">{t("Description", "Mô tả")}</label>
              <textarea value={formData.description || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
            </div>
          </>
        );
      case "training":
        return (
          <>
            <div className="space-y-3">
              <label className="block text-sm font-medium">{t("Team", "Đội")}</label>
              <select value={formData.teamId || ""} onChange={(e) => setFormData({ ...formData, teamId: e.target.value })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                <option value="">{t("Select Team", "Chọn đội")}</option>
                {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium">{t("Facility", "Cơ sở")}</label>
              <select value={formData.facilityId || ""} onChange={(e) => setFormData({ ...formData, facilityId: e.target.value })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                <option value="">{t("Select Facility", "Chọn cơ sở")}</option>
                {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium">{t("Date", "Ngày")}</label>
              <input type="date" value={formData.date || ""} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-3">
                <label className="block text-sm font-medium">{t("Start Time", "Giờ bắt đầu")}</label>
                <input type="time" value={formData.startTime || ""} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-medium">{t("End Time", "Giờ kết thúc")}</label>
                <input type="time" value={formData.endTime || ""} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
              </div>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium">{t("Notes", "Ghi chú")}</label>
              <textarea value={formData.notes || ""} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium">{t("Status", "Trạng thái")}</label>
              <select value={formData.status || "SCHEDULED"} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                <option value="SCHEDULED">{t("Scheduled", "Đã lên lịch")}</option>
                <option value="COMPLETED">{t("Completed", "Hoàn thành")}</option>
                <option value="CANCELLED">{t("Cancelled", "Đã hủy")}</option>
              </select>
            </div>
          </>
        );
    }
  };

  const getModalTitle = () => {
    const titles: Record<TabType, string> = {
      teams: editingItem ? t("Edit Team", "Sửa đội") : t("Add Team", "Thêm đội"),
      matches: editingItem ? t("Edit Match", "Sửa trận đấu") : t("Add Match", "Thêm trận đấu"),
      facilities: editingItem ? t("Edit Facility", "Sửa cơ sở") : t("Add Facility", "Thêm cơ sở"),
      equipment: editingItem ? t("Edit Equipment", "Sửa thiết bị") : t("Add Equipment", "Thêm thiết bị"),
      types: editingItem ? t("Edit Sport Type", "Sửa loại thể thao") : t("Add Sport Type", "Thêm loại thể thao"),
      training: editingItem ? t("Edit Training Session", "Sửa buổi huấn luyện") : t("Add Training Session", "Thêm buổi huấn luyện"),
    };
    return titles[activeTab];
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          ⚽ {t("Sports Management", "Quản lý thể thao")}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {t("Manage teams, matches, facilities, equipment and training sessions", "Quản lý đội, trận đấu, cơ sở, thiết bị và buổi huấn luyện")}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSearchQuery(""); }}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              activeTab === tab.id
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md"
                : "border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:shadow-sm"
            }`}
          >
            <div className="text-2xl mb-1">{tab.icon}</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{tab.count}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{tab.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {tabs.find((t) => t.id === activeTab)?.icon} {tabs.find((t) => t.id === activeTab)?.label}
          </h2>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("Search...", "Tìm kiếm...")}
            className="flex-1 sm:w-64 px-4 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
          >
            + {t("Add New", "Thêm mới")}
          </button>
          <button
            onClick={fetchAllData}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          renderTable()
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{getModalTitle()}</h3>
                <button onClick={() => { setShowModal(false); setEditingItem(null); setFormData({}); }} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {renderFormFields()}
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => { setShowModal(false); setEditingItem(null); setFormData({}); }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                {t("Cancel", "Hủy")}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? t("Saving...", "Đang lưu...") : t("Save", "Lưu")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
