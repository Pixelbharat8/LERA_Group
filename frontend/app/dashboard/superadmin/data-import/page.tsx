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
    headers: ["specialization", "qualification", "yearsOfExperience", "nationality", "bio", "hourlyRate", "contractType", "status"],
    sample: ["English", "BA Education", "5", "Vietnamese", "Experienced English teacher", "200000", "FULL_TIME", "ACTIVE"]
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

    setResult(results);
    setImporting(false);
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
          <p className="text-gray-500">Import students, teachers, classes, and more from CSV files</p>
        </div>
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
                href={`/dashboard/superadmin/${selectedType}`}
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
