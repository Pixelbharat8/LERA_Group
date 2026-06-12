"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../../../../lib/api";

interface Certificate {
  id: string;
  certificateNumber: string;
  studentName: string;
  courseName: string;
  issueDate: string;
  expiryDate?: string;
  grade?: string;
  score?: number;
  isVerified: boolean;
  isRevoked: boolean;
}

export default function CertificateManagement() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ studentName: "", courseName: "", grade: "", score: 0 });

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const data = await apiFetch("/api/certificates");
      setCertificates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching certificates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/api/certificates", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      setShowModal(false);
      fetchCertificates();
      setFormData({ studentName: "", courseName: "", grade: "", score: 0 });
    } catch (error) {
      console.error("Error creating certificate:", error);
    }
  };

  const handleRevoke = async (id: string) => {
    const reason = prompt("Please enter the reason for revoking this certificate:");
    if (!reason) return;
    try {
      await apiFetch(`/api/certificates/${id}/revoke`, {
        method: "PATCH",
        body: JSON.stringify({ reason }),
      });
      fetchCertificates();
    } catch (error) {
      console.error("Error revoking certificate:", error);
    }
  };

  const [viewingCertificate, setViewingCertificate] = useState<Certificate | null>(null);

  const handleView = (cert: Certificate) => {
    setViewingCertificate(cert);
  };

  const handleDownload = async (cert: Certificate) => {
    try {
      // Try to get PDF from backend
      const response = await fetch(`/api/certificates/${cert.id}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `certificate-${cert.certificateNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        // Fallback: Generate simple certificate HTML and print
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head><title>Certificate - ${cert.certificateNumber}</title></head>
              <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h1 style="color: #1e40af;">LERA Academy</h1>
                <h2>Certificate of Completion</h2>
                <hr style="width: 50%; margin: 30px auto;"/>
                <p style="font-size: 24px;">This is to certify that</p>
                <p style="font-size: 32px; font-weight: bold; color: #1e40af;">${cert.studentName}</p>
                <p style="font-size: 24px;">has successfully completed</p>
                <p style="font-size: 28px; font-weight: bold;">${cert.courseName}</p>
                ${cert.grade ? `<p style="font-size: 20px;">Grade: ${cert.grade} ${cert.score ? `(${cert.score}%)` : ''}</p>` : ''}
                <p style="margin-top: 30px;">Issue Date: ${new Date(cert.issueDate).toLocaleDateString()}</p>
                <p>Certificate Number: ${cert.certificateNumber}</p>
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
        }
      }
    } catch (error) {
      console.error("Error downloading certificate:", error);
      alert("Failed to download certificate");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Certificate Management</h1>
          <p className="text-gray-500">Issue, manage and verify student certificates</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + Issue Certificate
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <h3 className="text-gray-500 text-sm">Total Issued</h3>
          <p className="text-2xl font-bold">{certificates.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <h3 className="text-gray-500 text-sm">Verified</h3>
          <p className="text-2xl font-bold">{certificates.filter(c => c.isVerified && !c.isRevoked).length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <h3 className="text-gray-500 text-sm">Revoked</h3>
          <p className="text-2xl font-bold">{certificates.filter(c => c.isRevoked).length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <h3 className="text-gray-500 text-sm">This Month</h3>
          <p className="text-2xl font-bold">{certificates.filter(c => {
            const issueDate = new Date(c.issueDate);
            const now = new Date();
            return issueDate.getMonth() === now.getMonth() && issueDate.getFullYear() === now.getFullYear();
          }).length}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Certificate #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {certificates.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No certificates issued yet.</td></tr>
            ) : (
              certificates.map((cert) => (
                <tr key={cert.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{cert.certificateNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{cert.studentName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{cert.courseName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{cert.grade || "-"} {cert.score ? `(${cert.score}%)` : ""}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(cert.issueDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs ${cert.isRevoked ? "bg-red-100 text-red-800" : cert.isVerified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                      {cert.isRevoked ? "Revoked" : cert.isVerified ? "Verified" : "Pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button onClick={() => handleView(cert)} className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                    <button onClick={() => handleDownload(cert)} className="text-green-600 hover:text-green-900 mr-3">Download</button>
                    {!cert.isRevoked && <button onClick={() => handleRevoke(cert.id)} className="text-red-600 hover:text-red-900">Revoke</button>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Issue New Certificate</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Student Name *</label>
                <input type="text" required value={formData.studentName} onChange={(e) => setFormData({ ...formData, studentName: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Name *</label>
                <input type="text" required value={formData.courseName} onChange={(e) => setFormData({ ...formData, courseName: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                  <select value={formData.grade} onChange={(e) => setFormData({ ...formData, grade: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                    <option value="">Select Grade</option>
                    <option value="A+">A+</option>
                    <option value="A">A</option>
                    <option value="B+">B+</option>
                    <option value="B">B</option>
                    <option value="C+">C+</option>
                    <option value="C">C</option>
                    <option value="Pass">Pass</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Score (%)</label>
                  <input type="number" min="0" max="100" value={formData.score} onChange={(e) => setFormData({ ...formData, score: parseInt(e.target.value) })} className="w-full border rounded-lg px-3 py-2" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Issue Certificate</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Certificate Modal */}
      {viewingCertificate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-2xl">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Certificate Details</h2>
              <button onClick={() => setViewingCertificate(null)} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
            </div>
            
            <div className="border-2 border-blue-200 rounded-lg p-8 bg-gradient-to-br from-blue-50 to-white text-center mb-6">
              <div className="text-4xl mb-4">🎓</div>
              <h3 className="text-3xl font-bold text-blue-800 mb-2">LERA Academy</h3>
              <p className="text-lg text-gray-600 mb-4">Certificate of Completion</p>
              <hr className="w-1/2 mx-auto border-blue-200 my-4"/>
              <p className="text-lg mb-2">This is to certify that</p>
              <p className="text-2xl font-bold text-blue-800 mb-2">{viewingCertificate.studentName}</p>
              <p className="text-lg mb-2">has successfully completed</p>
              <p className="text-xl font-semibold mb-4">{viewingCertificate.courseName}</p>
              {viewingCertificate.grade && (
                <p className="text-lg mb-4">
                  Grade: <strong>{viewingCertificate.grade}</strong>
                  {viewingCertificate.score && ` (${viewingCertificate.score}%)`}
                </p>
              )}
              <div className="mt-6 pt-4 border-t border-blue-200">
                <p className="text-sm text-gray-500">Certificate Number: {viewingCertificate.certificateNumber}</p>
                <p className="text-sm text-gray-500">Issue Date: {new Date(viewingCertificate.issueDate).toLocaleDateString()}</p>
                <div className="mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm ${viewingCertificate.isRevoked ? "bg-red-100 text-red-800" : viewingCertificate.isVerified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                    {viewingCertificate.isRevoked ? "❌ Revoked" : viewingCertificate.isVerified ? "✅ Verified" : "⏳ Pending Verification"}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button onClick={() => setViewingCertificate(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Close</button>
              <button onClick={() => handleDownload(viewingCertificate)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">📥 Download</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
