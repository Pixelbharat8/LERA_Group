'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { apiFetch, hasAuthSession } from '../../../../lib/api';
import type { LeaveRequest } from '../../../../lib/leave';

export default function LeaveApprovalsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [filteredLeaves, setFilteredLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [pendingCount, setPendingCount] = useState(0);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

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
        
        if (userData.centerId) {
          fetchLeaves(userData.centerId);
          fetchPendingCount(userData.centerId);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        router.push('/auth/login');
      }
    } else {
      router.push('/auth/login');
    }
  }, [router]);

  useEffect(() => {
    if (statusFilter === 'ALL') {
      setFilteredLeaves(leaves);
    } else {
      setFilteredLeaves(leaves.filter((leave: any) => leave.status === statusFilter));
    }
  }, [statusFilter, leaves]);

  const fetchLeaves = async (centerId: string) => {
    try {
      const data = await apiFetch(`/api/leaves/center/${centerId}`);
      setLeaves(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching leaves:', error);
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingCount = async (centerId: string) => {
    try {
      const data = await apiFetch(`/api/leaves/pending/count?centerId=${centerId}`);
      setPendingCount(data.pendingCount || 0);
    } catch (error) {
      console.error('Error fetching pending count:', error);
    }
  };

  const approveLeave = async (leaveId: string, isPaid = true) => {
    if (!user || !confirm('Are you sure you want to approve this leave?')) return;
    
    try {
      await apiFetch(`/api/leaves/${leaveId}/approve`, {
        method: 'PUT',
        body: JSON.stringify({
          approvedBy: user.id,
          approverRole: 'CENTER_ADMIN',
          isPaid: isPaid,
          comments: 'Approved by Center Admin'
        })
      });

      alert('Leave approved successfully!');
      fetchLeaves(user.centerId);
      fetchPendingCount(user.centerId);
      setShowDetailModal(false);
    } catch (error) {
      console.error('Error approving leave:', error);
      alert('Error approving leave');
    }
  };

  const rejectLeave = async (leaveId: string, reason?: string | null) => {
    if (!user) return;
    
    const rejectionReason = reason || prompt('Please provide a reason for rejection:');
    if (!rejectionReason) return;
    
    try {
      await apiFetch(`/api/leaves/${leaveId}/reject`, {
        method: 'PUT',
        body: JSON.stringify({
          rejectedBy: user.id,
          rejectionReason: rejectionReason,
          approverRole: 'CENTER_ADMIN'
        })
      });

      alert('Leave rejected successfully');
      fetchLeaves(user.centerId);
      fetchPendingCount(user.centerId);
      setShowDetailModal(false);
    } catch (error) {
      console.error('Error rejecting leave:', error);
      alert('Error rejecting leave');
    }
  };

  const viewDetails = (leave: LeaveRequest) => {
    setSelectedLeave(leave);
    setShowDetailModal(true);
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

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLeaveTypeColor = (type?: string) => {
    const colors: Record<string, string> = {
      SICK_LEAVE: 'text-red-600 bg-red-50',
      CASUAL_LEAVE: 'text-blue-600 bg-blue-50',
      ANNUAL_LEAVE: 'text-green-600 bg-green-50',
      EMERGENCY: 'text-orange-600 bg-orange-50',
      MATERNITY: 'text-pink-600 bg-pink-50',
      PATERNITY: 'text-purple-600 bg-purple-50',
      BEREAVEMENT: 'text-gray-600 bg-gray-50'
    };
    return (type && colors[type]) || 'text-gray-600 bg-gray-50';
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
              <h1 className="text-3xl font-bold text-gray-900">Leave Approvals</h1>
              <p className="text-gray-600 mt-1">Review and approve leave requests for your center</p>
            </div>
            <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg">
              <span className="font-semibold text-2xl">{pendingCount}</span>
              <span className="text-sm ml-2">Pending</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-yellow-900">Pending</h3>
            <p className="text-3xl font-bold text-yellow-600 mt-2">
              {leaves.filter(l => l.status === 'PENDING').length}
            </p>
          </div>
          <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-green-900">Approved</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {leaves.filter(l => l.status === 'APPROVED').length}
            </p>
          </div>
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-red-900">Rejected</h3>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {leaves.filter(l => l.status === 'REJECTED').length}
            </p>
          </div>
          <div className="bg-gray-50 border-l-4 border-gray-500 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900">Total</h3>
            <p className="text-3xl font-bold text-gray-600 mt-2">{leaves.length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-2">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Leave Requests Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {filteredLeaves.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No leave requests</h3>
              <p className="mt-1 text-sm text-gray-500">No {statusFilter.toLowerCase()} leave requests found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date(s)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLeaves.map((leave) => (
                    <tr key={leave.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">User ID: {leave.userId?.slice(0, 8)}...</div>
                        <div className="text-xs text-gray-500">{leave.userType}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getLeaveTypeColor(leave.leaveType)}`}>
                          {leave.leaveType?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(leave.leaveDate)}
                        {leave.endDate && <><br />{formatDate(leave.endDate)}</>}
                        {leave.halfDay && <span className="ml-2 text-xs text-blue-600">(Half)</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {leave.daysCount || (leave.halfDay ? '0.5' : '1')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(leave.requestedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(leave.status)}`}>
                          {leave.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => viewDetails(leave)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Details
                        </button>
                        {leave.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => approveLeave(leave.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => rejectLeave(leave.id, null)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Reject
                            </button>
                          </>
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

      {/* Detail Modal */}
      {showDetailModal && selectedLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Leave Request Details</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Leave Type</label>
                  <p className="text-gray-900">{selectedLeave.leaveType?.replace(/_/g, ' ')}</p>
                </div>
                
                <div>
                  <label className="text-sm font-semibold text-gray-700">Employee Type</label>
                  <p className="text-gray-900">{selectedLeave.userType}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Start Date</label>
                    <p className="text-gray-900">{formatDate(selectedLeave.leaveDate)}</p>
                  </div>
                  {selectedLeave.endDate && (
                    <div>
                      <label className="text-sm font-semibold text-gray-700">End Date</label>
                      <p className="text-gray-900">{formatDate(selectedLeave.endDate)}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Days Count</label>
                  <p className="text-gray-900">
                    {selectedLeave.daysCount || (selectedLeave.halfDay ? '0.5' : '1')} day(s)
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Reason</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedLeave.reason}</p>
                </div>

                {selectedLeave.documents && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Supporting Documents</label>
                    <p className="text-blue-600 text-sm break-all">{selectedLeave.documents}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-semibold text-gray-700">Status</label>
                  <p>
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(selectedLeave.status)}`}>
                      {selectedLeave.status}
                    </span>
                  </p>
                </div>

                {selectedLeave.status === 'REJECTED' && selectedLeave.rejectionReason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <label className="text-sm font-semibold text-red-900">Rejection Reason</label>
                    <p className="text-red-800 mt-1">{selectedLeave.rejectionReason}</p>
                  </div>
                )}

                {selectedLeave.status === 'APPROVED' && selectedLeave.comments && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <label className="text-sm font-semibold text-green-900">Approval Comments</label>
                    <p className="text-green-800 mt-1">{selectedLeave.comments}</p>
                  </div>
                )}
              </div>

              {selectedLeave.status === 'PENDING' && (
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => approveLeave(selectedLeave.id, true)}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                  >
                    Approve (Paid)
                  </button>
                  <button
                    onClick={() => approveLeave(selectedLeave.id, false)}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Approve (Unpaid)
                  </button>
                  <button
                    onClick={() => rejectLeave(selectedLeave.id, null)}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
