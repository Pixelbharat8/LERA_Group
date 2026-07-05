"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";

type ImportType = "students" | "teachers" | "classes" | "payments" | "leads";

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

interface Center {
  id: string;
  name: string;
}

// CSV Templates for each entity type
const CSV_TEMPLATES: Record<ImportType, { headers: string[]; sample: string[] }> = {
  students: {
    headers: ["fullname", "fullnameVi", "email", "phone", "dateOfBirth", "gender", "schoolName", "grade", "status", "parentName", "parentPhone", "parentEmail", "emergencyContactName", "emergencyContactPhone"],
    sample: ["Nguyen Van A", "Nguyễn Văn A", "student@email.com", "0901234567", "2015-05-10", "MALE", "ABC Primary School", "5", "ACTIVE", "Nguyen Thi B", "0912345678", "parent@email.com", "Nguyen Van C", "0923456789"]
  },
  teachers: {
    headers: ["displayName", "email", "phone", "specialization", "qualification", "yearsOfExperience", "nationality", "bio", "hourlyRate", "contractType", "status"],
    sample: ["Nguyen Van Teacher", "teacher@email.com", "0901234567", "English", "BA Education", "5", "Vietnamese", "Experienced English teacher", "200000", "FULL_TIME", "ACTIVE"]
  },
  classes: {
    headers: ["name", "description", "level", "maxStudents", "schedule", "startDate", "endDate", "status"],
    sample: ["LERA Starters A1", "Beginner English class", "BEGINNER", "15", "Mon-Wed-Fri 9:00-11:00", "2026-02-01", "2026-06-30", "SCHEDULED"]
  },
  payments: {
    headers: ["studentEmail", "amount", "paymentMethod", "status", "notes", "transactionId"],
    sample: ["student@email.com", "2500000", "CASH", "COMPLETED", "Course fee - Term 1", "TXN123456"]
  },
  leads: {
    headers: ["parentName", "parentPhone", "parentEmail", "studentName", "studentAge", "source", "notes", "preferredSchedule"],
    sample: ["Parent Name", "0901234567", "parent@email.com", "Child Name", "7", "Facebook", "Interested in English classes", "Weekends"]
  }
};

export default function BulkImportPage() {
  const [selectedType, setSelectedType] = useState<ImportType>("students");
  const [selectedCenter, setSelectedCenter] = useState<string>("");
  const [centers, setCenters] = useState<Center[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [loadingCenters, setLoadingCenters] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [googleSheetUrl, setGoogleSheetUrl] = useState("");
  const [fetchingSheet, setFetchingSheet] = useState(false);
  // Login accounts auto-created by the last import (for the "download credentials" handout).
  const [credentials, setCredentials] = useState<{ name: string; email: string; role: string; phone: string }[]>([]);
  const IMPORT_DEFAULT_PASSWORD = "Lera@123";
  // Sending login links over WhatsApp/Zalo/SMS
  const [channelStatus, setChannelStatus] = useState<Record<string, boolean>>({});
  const [sendChannel, setSendChannel] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; skipped: number; failed: number; noPhone: number } | null>(null);
  const [emailing, setEmailing] = useState(false);
  const [emailResult, setEmailResult] = useState<{ emailed: number; notConfigured: number; failed: number } | null>(null);

  // Fetch centers on mount
  useState(() => {
    const fetchCenters = async () => {
      try {
        const data = await apiFetch("/api/centers");
        setCenters(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to fetch centers", e);
      } finally {
        setLoadingCenters(false);
      }
    };
    fetchCenters();
  });

  const parseCSV = (text: string): string[][] => {
    const lines = text.split("\n").filter(line => line.trim());
    return lines.map(line => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setResult(null);
    setPreviewMode(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length > 0) {
        setHeaders(parsed[0]);
        setCsvData(parsed.slice(1));
        setPreviewMode(true);
      }
    };
    reader.readAsText(uploadedFile);
  };

  // Pull a Google Sheet (shared "Anyone with the link can view") as CSV via the backend proxy,
  // then feed it into the exact same preview/import pipeline as an uploaded file.
  const loadFromGoogleSheet = async () => {
    if (!googleSheetUrl.trim()) return;
    setFetchingSheet(true);
    setResult(null);
    setPreviewMode(false);
    try {
      const resp: any = await apiFetch("/api/import/google-sheet", {
        method: "POST",
        body: JSON.stringify({ url: googleSheetUrl.trim() }),
      });
      if (!resp?.success || !resp?.csv) {
        alert(resp?.error || "Could not load the Google Sheet.");
        return;
      }
      const parsed = parseCSV(resp.csv);
      if (parsed.length < 2) {
        alert("The sheet looks empty (needs a header row + at least one data row).");
        return;
      }
      setFile(null);
      setHeaders(parsed[0]);
      setCsvData(parsed.slice(1));
      setPreviewMode(true);
    } catch (e: any) {
      alert(e?.message || "Failed to load the Google Sheet.");
    } finally {
      setFetchingSheet(false);
    }
  };

  const downloadTemplate = () => {
    const template = CSV_TEMPLATES[selectedType];
    const csvContent = [template.headers.join(","), template.sample.join(",")].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedType}_import_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const mapRowToEntity = (row: string[], type: ImportType): any => {
    const template = CSV_TEMPLATES[type];
    const entity: any = {};
    
    template.headers.forEach((header, index) => {
      if (row[index] !== undefined && row[index] !== "") {
        entity[header] = row[index];
      }
    });

    // Add centerId for entities that require it
    if (selectedCenter && ["students", "teachers", "classes", "payments", "leads"].includes(type)) {
      entity.centerId = selectedCenter;
    }

    return entity;
  };

  const importData = async () => {
    if (!selectedCenter) {
      alert("Please select a center first!");
      return;
    }

    if (csvData.length === 0) {
      alert("No data to import!");
      return;
    }

    setImporting(true);
    setResult(null);
    setCredentials([]);

    const results: ImportResult = { success: 0, failed: 0, errors: [] };

    // Map API endpoints (using bulk endpoints)
    const endpoints: Record<ImportType, string> = {
      students: "/api/students/bulk",
      teachers: "/api/teachers/bulk",
      classes: "/api/classes/bulk",
      payments: "/api/payments/bulk",
      leads: "/api/leads/bulk"
    };

    // Prepare all entities
    const entities: any[] = [];
    
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      if (row.every(cell => !cell.trim())) continue; // Skip empty rows

      try {
        const entity = mapRowToEntity(row, selectedType);
        
        // Special handling for different entity types
        if (selectedType === "students") {
          entity.status = entity.status || "ACTIVE";
        } else if (selectedType === "teachers") {
          entity.status = entity.status || "ACTIVE";
          if (entity.hourlyRate) entity.hourlyRate = Number(entity.hourlyRate);
          if (entity.yearsOfExperience) entity.yearsOfExperience = Number(entity.yearsOfExperience);
        } else if (selectedType === "payments") {
          entity.amount = Number(entity.amount);
          entity.currency = "VND";
        } else if (selectedType === "leads") {
          entity.status = "NEW";
          entity.utmSource = entity.source || "Import";
          if (entity.studentAge) entity.studentAge = Number(entity.studentAge);
          delete entity.source;
        } else if (selectedType === "classes") {
          if (entity.maxStudents) entity.maxStudents = Number(entity.maxStudents);
          entity.status = entity.status || "SCHEDULED";
        }

        entities.push(entity);
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Row ${i + 2}: ${error.message || "Invalid data format"}`);
      }
    }

    // Bulk import
    if (entities.length > 0) {
      try {
        const response = await apiFetch(endpoints[selectedType], {
          method: "POST",
          body: JSON.stringify(entities)
        });
        
        if (Array.isArray(response)) {
          results.success = response.length;
        } else if (response.data && Array.isArray(response.data)) {
          results.success = response.data.length;
          if (response.errors && Array.isArray(response.errors)) {
            results.failed = response.errors.length;
            results.errors = [...results.errors, ...response.errors];
          }
        } else {
          results.success = entities.length;
        }
      } catch (error: any) {
        // If bulk fails, try individual imports
        console.log("Bulk import failed, trying individual imports...");
        const singleEndpoint = endpoints[selectedType].replace("/bulk", "");
        
        for (let i = 0; i < entities.length; i++) {
          try {
            await apiFetch(singleEndpoint, {
              method: "POST",
              body: JSON.stringify(entities[i])
            });
            results.success++;
          } catch (err: any) {
            results.failed++;
            results.errors.push(`Row ${i + 2}: ${err.message || "Unknown error"}`);
          }
        }
      }
    }

    // Build the login-credentials handout for auto-provisioned accounts (students→parents, teachers).
    if (results.success > 0 && (selectedType === "students" || selectedType === "teachers")) {
      const seen = new Set<string>();
      const creds: { name: string; email: string; role: string; phone: string }[] = [];
      for (const e of entities) {
        const email = String((selectedType === "students" ? e.parentEmail : e.email) || "").trim();
        if (!email || seen.has(email.toLowerCase())) continue;
        seen.add(email.toLowerCase());
        creds.push({
          name: String((selectedType === "students" ? e.parentName : e.displayName) || "").trim(),
          email,
          role: selectedType === "students" ? "PARENT" : "TEACHER",
          phone: String((selectedType === "students" ? e.parentPhone : e.phone) || "").trim(),
        });
      }
      setCredentials(creds);
      setSendResult(null);
      // Load which messaging channels are live (Zalo/WhatsApp/SMS configured).
      apiFetch("/api/messaging/status", {}, { silent: true })
        .then((s: any) => {
          const st = s && typeof s === "object" ? s : {};
          setChannelStatus(st);
          const firstLive = Object.keys(st).find((k) => st[k]);
          if (firstLive) setSendChannel(firstLive);
        })
        .catch(() => setChannelStatus({}));
    }

    setResult(results);
    setImporting(false);
  };

  // Download a CSV of the login accounts created by this import so the admin can hand them out.
  const downloadCredentials = () => {
    if (credentials.length === 0) return;
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = [
      ["name", "email", "role", "temporaryPassword"].join(","),
      ...credentials.map((c) => [c.name, c.email, c.role, IMPORT_DEFAULT_PASSWORD].map(esc).join(",")),
    ].join("\n");
    const blob = new Blob([rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedType}_login_credentials.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Send each new account a one-time set-password link over the chosen channel (WhatsApp/Zalo/SMS).
  const sendLoginLinks = async () => {
    if (!sendChannel || credentials.length === 0) return;
    setSending(true);
    setSendResult(null);
    const tally = { sent: 0, skipped: 0, failed: 0, noPhone: 0 };
    for (const c of credentials) {
      if (!c.phone) { tally.noPhone++; continue; }
      try {
        const linkResp: any = await apiFetch("/api/auth/set-password-link", {
          method: "POST", body: JSON.stringify({ email: c.email }),
        }, { silent: true }).catch(() => null);
        if (!linkResp?.success || !linkResp?.link) { tally.failed++; continue; }
        const msg = `Xin chào ${c.name || ""}, tài khoản LERA của bạn đã sẵn sàng. Vui lòng đặt mật khẩu: ${linkResp.link}`;
        const sendResp: any = await apiFetch("/api/messaging/send", {
          method: "POST", body: JSON.stringify({ toPhone: c.phone, channel: sendChannel, message: msg }),
        }, { silent: true }).catch(() => null);
        const status = String(sendResp?.status || "").toUpperCase();
        if (status === "SENT") tally.sent++;
        else if (status === "SKIPPED") tally.skipped++;
        else tally.failed++;
      } catch {
        tally.failed++;
      }
    }
    setSendResult(tally);
    setSending(false);
  };

  // Email each new account a one-time set-password link (uses the account email — no phone needed).
  const sendEmailLinks = async () => {
    if (credentials.length === 0) return;
    setEmailing(true);
    setEmailResult(null);
    const tally = { emailed: 0, notConfigured: 0, failed: 0 };
    for (const c of credentials) {
      try {
        const r: any = await apiFetch("/api/auth/send-set-password-email", {
          method: "POST", body: JSON.stringify({ email: c.email }),
        }, { silent: true }).catch(() => null);
        if (r?.success && r?.sent) tally.emailed++;
        else if (r?.success && r?.sent === false) tally.notConfigured++;
        else tally.failed++;
      } catch {
        tally.failed++;
      }
    }
    setEmailResult(tally);
    setEmailing(false);
  };

  const getTypeIcon = (type: ImportType) => {
    switch (type) {
      case "students": return "👨‍🎓";
      case "teachers": return "👩‍🏫";
      case "classes": return "📚";
      case "payments": return "💰";
      case "leads": return "📞";
    }
  };

  const getTypeLabel = (type: ImportType) => {
    switch (type) {
      case "students": return "Students";
      case "teachers": return "Teachers";
      case "classes": return "Classes";
      case "payments": return "Payments";
      case "leads": return "Leads";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/superadmin" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-900">Bulk Import</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">📥 Bulk Data Import</h1>
          <p className="text-gray-500">Import students, teachers, classes, and more from CSV files or Google Sheets</p>
        </div>
      </div>

      {/* Auto-provisioning note */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        🔐 <b>Login profiles are created automatically.</b> Importing <b>students</b> creates a{" "}
        <b>Parent</b> account (from the <code>parentEmail</code> column); importing <b>teachers</b> creates a{" "}
        <b>Teacher</b> account (from the <code>email</code> column). New accounts get the default password{" "}
        <b>Lera@123</b> — ask users to change it after first login.
      </div>

      {/* Step 1: Select Type and Center */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Step 1: Select Import Type & Center</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Import Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">What do you want to import?</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(["students", "teachers", "classes", "payments", "leads"] as ImportType[]).map(type => (
                <button
                  key={type}
                  onClick={() => { setSelectedType(type); setFile(null); setCsvData([]); setResult(null); setPreviewMode(false); }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedType === type 
                      ? "border-blue-500 bg-blue-50 text-blue-700" 
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-2xl">{getTypeIcon(type)}</span>
                  <p className="mt-1 font-medium">{getTypeLabel(type)}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Center Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Center *</label>
            <select
              value={selectedCenter}
              onChange={(e) => setSelectedCenter(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg text-lg"
              disabled={loadingCenters}
            >
              <option value="">-- Select a Center --</option>
              {centers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {!selectedCenter && (
              <p className="mt-2 text-sm text-yellow-600">⚠️ You must select a center before importing</p>
            )}
          </div>
        </div>
      </div>

      {/* Step 2: Download Template & Upload File */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Step 2: Prepare & Upload CSV File</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Template Download */}
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
            <h3 className="font-medium text-blue-900 mb-2">📄 Download Template</h3>
            <p className="text-sm text-blue-700 mb-4">
              Download a CSV template with the required columns for {getTypeLabel(selectedType).toLowerCase()}.
            </p>
            <button
              onClick={downloadTemplate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ⬇️ Download {getTypeLabel(selectedType)} Template
            </button>
            
            <div className="mt-4 p-3 bg-white rounded-lg">
              <p className="text-xs font-medium text-gray-600 mb-2">Required Columns:</p>
              <div className="flex flex-wrap gap-1">
                {CSV_TEMPLATES[selectedType].headers.map(h => (
                  <span key={h} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                    {h}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="font-medium text-gray-900 mb-2">📤 Upload CSV File</h3>
            <p className="text-sm text-gray-600 mb-4">
              Upload your prepared CSV file with {getTypeLabel(selectedType).toLowerCase()} data.
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
            >
              {file ? (
                <div>
                  <span className="text-3xl">📁</span>
                  <p className="mt-2 font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">{csvData.length} rows detected</p>
                </div>
              ) : (
                <div>
                  <span className="text-3xl">📥</span>
                  <p className="mt-2 text-gray-600">Click to upload or drag & drop</p>
                  <p className="text-sm text-gray-400">CSV files only</p>
                </div>
              )}
            </div>

            {/* …or import straight from Google Sheets */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-1">📊 …or import from Google Sheets</p>
              <p className="text-xs text-gray-500 mb-2">
                In Google Sheets: <b>Share → General access → “Anyone with the link” → Viewer</b>, then paste the link. First row must be the column headers (matching the template).
              </p>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={googleSheetUrl}
                  onChange={(e) => setGoogleSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/…"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <button
                  onClick={loadFromGoogleSheet}
                  disabled={fetchingSheet || !googleSheetUrl.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 whitespace-nowrap"
                >
                  {fetchingSheet ? "Loading…" : "Load Sheet"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 3: Preview Data */}
      {previewMode && csvData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Step 3: Preview & Import</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">{csvData.length} records to import</span>
              <button
                onClick={importData}
                disabled={importing || !selectedCenter}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Importing...
                  </span>
                ) : (
                  "🚀 Start Import"
                )}
              </button>
            </div>
          </div>

          {/* Preview Table */}
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  {headers.map((h, i) => (
                    <th key={i} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {csvData.slice(0, 10).map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">{rowIndex + 1}</td>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-3 text-sm text-gray-900 max-w-[200px] truncate">
                        {cell || <span className="text-gray-300">-</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {csvData.length > 10 && (
              <div className="p-3 bg-gray-50 text-center text-sm text-gray-500">
                ... and {csvData.length - 10} more rows
              </div>
            )}
          </div>
        </div>
      )}

      {/* Import Results */}
      {result && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Import Results</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <div className="flex items-center gap-3">
                <span className="text-3xl">✅</span>
                <div>
                  <p className="text-2xl font-bold text-green-700">{result.success}</p>
                  <p className="text-sm text-green-600">Successfully imported</p>
                </div>
              </div>
            </div>
            <div className="bg-red-50 rounded-xl p-4 border border-red-100">
              <div className="flex items-center gap-3">
                <span className="text-3xl">❌</span>
                <div>
                  <p className="text-2xl font-bold text-red-700">{result.failed}</p>
                  <p className="text-sm text-red-600">Failed to import</p>
                </div>
              </div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <h3 className="font-medium text-red-800 mb-2">Errors ({result.errors.length})</h3>
              <ul className="space-y-1 max-h-60 overflow-y-auto">
                {result.errors.map((error, i) => (
                  <li key={i} className="text-sm text-red-700">• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {result.success > 0 && (
            <div className="mt-4 flex gap-3">
              <Link
                href={({
                  students: "/dashboard/superadmin/students",
                  teachers: "/dashboard/superadmin/teachers",
                  classes: "/dashboard/superadmin/classes",
                  payments: "/dashboard/payments",
                  leads: "/dashboard/crm/leads",
                } as Record<ImportType, string>)[selectedType]}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View {getTypeLabel(selectedType)} →
              </Link>
              <button
                onClick={() => { setFile(null); setCsvData([]); setResult(null); setPreviewMode(false); }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Import More
              </button>
            </div>
          )}

          {credentials.length > 0 && (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-sm font-medium text-green-900">
                🔑 {credentials.length} login {credentials.length === 1 ? "account" : "accounts"} to hand out
              </p>
              <p className="text-xs text-green-700 mt-1 mb-3">
                New accounts use the temporary password <b>{IMPORT_DEFAULT_PASSWORD}</b> — users must change it on first
                login. Anyone who already had an account keeps their existing password (ignore those rows).
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={downloadCredentials}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  ⬇️ Download credentials (CSV)
                </button>
                <button
                  onClick={sendEmailLinks} disabled={emailing}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm disabled:opacity-50"
                >
                  {emailing ? "Emailing…" : "✉️ Email set-password links"}
                </button>
                {emailResult && (
                  <span className="text-xs text-gray-700">
                    ✅ Emailed {emailResult.emailed}
                    {emailResult.notConfigured > 0 ? ` · ✉️ SMTP not configured (${emailResult.notConfigured})` : ""}
                    {emailResult.failed > 0 ? ` · ❌ ${emailResult.failed}` : ""}
                  </span>
                )}
              </div>

              {/* Send a one-time set-password link over WhatsApp/Zalo/SMS */}
              <div className="mt-4 pt-4 border-t border-green-200">
                <p className="text-sm font-medium text-green-900 mb-1">📤 Or send a one-time set-password link</p>
                {(() => {
                  const channels = Object.keys(channelStatus);
                  const live = channels.filter((c) => channelStatus[c]);
                  const withPhone = credentials.filter((c) => c.phone).length;
                  if (channels.length === 0) {
                    return <p className="text-xs text-gray-500">Messaging status unavailable.</p>;
                  }
                  if (live.length === 0) {
                    return (
                      <p className="text-xs text-amber-700">
                        No channel is configured yet ({channels.join(", ")}). Set provider credentials
                        (<code>messaging.zalo.*</code> / <code>messaging.whatsapp.*</code> / <code>messaging.sms.*</code>) to enable sending.
                      </p>
                    );
                  }
                  return (
                    <div className="flex flex-wrap items-center gap-2">
                      <select value={sendChannel} onChange={(e) => setSendChannel(e.target.value)}
                        className="h-9 rounded-md border border-gray-300 px-2 text-sm">
                        {live.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <button onClick={sendLoginLinks} disabled={sending || !sendChannel || withPhone === 0}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm disabled:opacity-50">
                        {sending ? "Sending…" : `Send to ${withPhone} recipient${withPhone === 1 ? "" : "s"}`}
                      </button>
                      {withPhone < credentials.length && (
                        <span className="text-xs text-gray-500">{credentials.length - withPhone} have no phone</span>
                      )}
                    </div>
                  );
                })()}
                {sendResult && (
                  <p className="text-xs text-gray-700 mt-2">
                    ✅ Sent {sendResult.sent} · ⏭️ Skipped {sendResult.skipped} · ❌ Failed {sendResult.failed}
                    {sendResult.noPhone > 0 ? ` · 📵 No phone ${sendResult.noPhone}` : ""}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Help Section */}
      <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-100">
        <h3 className="font-medium text-yellow-900 mb-2">💡 Import Tips</h3>
        <ul className="space-y-2 text-sm text-yellow-800">
          <li>• Download the template first to see the required column format</li>
          <li>• Make sure your CSV file has headers in the first row</li>
          <li>• Date format should be YYYY-MM-DD (e.g., 2026-01-15)</li>
          <li>• For students, valid status values are: ACTIVE, INACTIVE, GRADUATED, WITHDRAWN</li>
          <li>• For payments, use the student's email to link them automatically</li>
          <li>• Empty rows in the CSV will be skipped</li>
          <li>• If import fails for some rows, you'll see detailed error messages</li>
        </ul>
      </div>
    </div>
  );
}
