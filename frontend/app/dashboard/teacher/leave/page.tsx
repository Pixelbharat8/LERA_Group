'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { apiFetch, hasAuthSession } from '../../../../lib/api';
import type { LeaveRequest } from '../../../../lib/leave';

export default function TeacherLeavePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [leaveBalance, setLeaveBalance] = useState({ remainingLeaves: 12, totalLeaves: 12, usedLeaves: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    leaveDate: '',
    endDate: '',
    leaveType: 'CASUAL_LEAVE',
    reason: '',
    documents: '',
    halfDay: false,
    startTime: '',
    endTime: ''
  });

  useEffect(() => {
    const userDataStr = Cookies.get('userData');
    
    if (!hasAuthSession()) {
      router.push('/auth/login');
      return;
    }
    
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        setUser(userData);
        
        if (userData.id) {
          fetchLeaves(userData.id);
          fetchLeaveBalance(userData.id);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        router.push('/auth/login');
      }
    } else {
      router.push('/auth/login');
    }
  }, [router]);

  const fetchLeaves = async (userId: string) => {
    try {
      const data = await apiFetch(`/api/leaves/user/${userId}`);
      const leavesArray = Array.isArray(data) ? data : [];
      setLeaves(leavesArray as any);
    } catch (error) {
      console.error('Error fetching leaves:', error);
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveBalance = async (userId: string) => {
    try {
      const data = await apiFetch(`/api/leaves/balance/${userId}`);
      if (data && typeof data === 'object') {
        setLeaveBalance(data);
      }
    } catch (error) {
      console.error('Error fetching leave balance:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      const leaveData = {
        userId: user.id,
        centerId: user.centerId,
        userType: 'TEACHER',
        leaveDate: formData.leaveDate,
        endDate: formData.endDate || null,
        leaveType: formData.leaveType,
        reason: formData.reason,
        documents: formData.documents || null,
        halfDay: formData.halfDay,
        startTime: formData.startTime || null,
        endTime: formData.endTime || null,
        requestedBy: user.id,
        isPaid: true
      };

      await apiFetch('/api/leaves/apply', {
        method: 'POST',
        body: JSON.stringify(leaveData)
      });

      alert('Leave request submitted successfully!');
      setShowForm(false);
      fetchLeaves(user.id);
      fetchLeaveBalance(user.id);
      
      // Reset form
      setFormData({
        leaveDate: '',
        endDate: '',
        leaveType: 'CASUAL_LEAVE',
        reason: '',
        documents: '',
        halfDay: false,
        startTime: '',
        endTime: ''
      });
    } catch (error) {
      console.error('Error submitting leave:', error);
      alert('Error submitting leave request');
    }
  };

  const cancelLeave = async (leaveId: string) => {
    if (!user || !confirm('Are you sure you want to cancel this leave request?')) return;
    
    try {
      await apiFetch(`/api/leaves/${leaveId}?userId=${user.id}`, {
        method: 'DELETE'
      });

      alert('Leave request cancelled successfully');
      fetchLeaves(user.id);
      fetchLeaveBalance(user.id);
    } catch (error) {
      console.error('Error cancelling leave:', error);
      alert('Error cancelling leave request');
    }
  };

  const getStatusBadge = (status?: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800'
    };
    return (status && styles[status]) || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Leave Requests</h1>
              <p className="text-gray-600 mt-1">Manage your leave applications</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              {showForm ? 'Cancel' : '+ Request Leave'}
            </button>
          </div>
        </div>

        {/* Leave Balance Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">Total Annual Leave</h3>
            <p className="text-4xl font-bold">{leaveBalance.totalLeaves}</p>
            <p className="text-blue-100 text-sm mt-1">days per year</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">Remaining Leave</h3>
            <p className="text-4xl font-bold">{leaveBalance.remainingLeaves}</p>
            <p className="text-green-100 text-sm mt-1">days available</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">Used Leave</h3>
            <p className="text-4xl font-bold">{leaveBalance.usedLeaves}</p>
            <p className="text-orange-100 text-sm mt-1">days taken</p>
          </div>
        </div>

        {/* Leave Request Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">New Leave Request</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Leave Type *
                  </label>
                  <select
                    value={formData.leaveType}
                    onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="CASUAL_LEAVE">Casual Leave</option>
                    <option value="SICK_LEAVE">Sick Leave</option>
                    <option value="ANNUAL_LEAVE">Annual Leave</option>
                    <option value="EMERGENCY">Emergency</option>
                    <option value="MATERNITY">Maternity Leave</option>
                    <option value="PATERNITY">Paternity Leave</option>
                    <option value="BEREAVEMENT">Bereavement Leave</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.leaveDate}
                    onChange={(e) => setFormData({ ...formData, leaveDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date (for multi-day leave)
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    min={formData.leaveDate}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.halfDay}
                      onChange={(e) => setFormData({ ...formData, halfDay: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Half Day Leave</span>
                  </label>
                </div>

                {formData.halfDay && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason *
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Please provide a reason for your leave..."
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supporting Documents (URLs, comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.documents}
                    onChange={(e) => setFormData({ ...formData, documents: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/document1.pdf, https://example.com/document2.pdf"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Submit Leave Request
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Leave History */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Leave History</h2>
          
          {leaves.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No leave requests</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new leave request.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date(s)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaves.map((leave) => (
                    <tr key={leave.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {leave.leaveType?.replace(/_/g, ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(leave.leaveDate)}
                        {leave.endDate && ` - ${formatDate(leave.endDate)}`}
                        {leave.halfDay && <span className="ml-2 text-xs text-blue-600">(Half Day)</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {leave.daysCount || (leave.halfDay ? '0.5' : '1')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {leave.reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(leave.status)}`}>
                          {leave.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(leave.status === 'PENDING' || leave.status === 'APPROVED') && (
                          <button
                            onClick={() => cancelLeave(leave.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Cancel
                          </button>
                        )}
                        {leave.status === 'REJECTED' && leave.rejectionReason && (
                          <span className="text-xs text-gray-500" title={leave.rejectionReason}>
                            View reason
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
