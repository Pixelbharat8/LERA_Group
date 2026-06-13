/**
 * Shared shape for a staff/teacher leave request (backed by the
 * `teacher_staff_leaves` table). Used by the teacher leave page and the
 * approvals queue so both share one typed contract instead of `any[]`.
 */
export type LeaveRequest = {
  id: string;
  userId?: string;
  userType?: string;
  leaveType?: string;
  status?: string;
  leaveDate?: string;
  endDate?: string | null;
  halfDay?: boolean;
  daysCount?: number;
  reason?: string;
  rejectionReason?: string | null;
  requestedAt?: string;
  documents?: string;
  comments?: string;
};
