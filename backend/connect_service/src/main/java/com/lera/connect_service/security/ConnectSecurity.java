package com.lera.connect_service.security;

import com.lera.connect_service.entity.ChatGroup;
import com.lera.connect_service.entity.Conversation;
import com.lera.connect_service.entity.Lead;
import com.lera.connect_service.entity.Notification;
import com.lera.connect_service.entity.ParentTeacherMeeting;
import com.lera.connect_service.entity.Task;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

/**
 * CRM / leads center scoping — org-wide roles may query across centers; everyone else is bound
 * to JWT {@code centerId} for list/stats and per-lead access.
 */
public final class ConnectSecurity {

    private static final Set<String> ORG_WIDE = Set.of(
            "SUPER_ADMIN", "SUPERADMIN", "CHAIRMAN", "CEO", "DIRECTOR");

    private static final Set<String> STAFF_NOTIFY = Set.of(
            "SUPER_ADMIN", "SUPERADMIN", "CHAIRMAN", "CEO", "DIRECTOR",
            "CENTER_ADMIN", "CENTER_MANAGER", "ACADEMIC_MANAGER", "TEACHER",
            "TEACHING_ASSISTANT", "TA", "STAFF");

    private ConnectSecurity() {}

    public static boolean isOrgWide(AuthUser user) {
        if (user == null || user.getRoleName() == null) {
            return false;
        }
        return ORG_WIDE.contains(user.getRoleName().toUpperCase());
    }

    /**
     * For list/stats: org-wide callers use {@code requestedCenterId} as passed (may be null = global).
     * Any other caller must have {@code centerId} on the JWT and is always scoped to that center;
     * a mismatched {@code requestedCenterId} yields 403. Callers without a JWT center cannot run
     * global or arbitrary-center list/stats.
     */
    public static UUID effectiveCenterId(AuthUser user, UUID requestedCenterId) {
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        if (isOrgWide(user)) {
            return requestedCenterId;
        }
        UUID jwtCenter = user.getCenterId();
        if (jwtCenter == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "JWT must include centerId for this operation");
        }
        if (requestedCenterId != null && !Objects.equals(requestedCenterId, jwtCenter)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot access another center's data");
        }
        return jwtCenter;
    }

    public static void assertCanAccessLead(AuthUser user, Lead lead) {
        if (lead == null) {
            return;
        }
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        if (isOrgWide(user)) {
            return;
        }
        UUID jwtCenter = user.getCenterId();
        if (jwtCenter == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "JWT must include centerId for this operation");
        }
        UUID leadCenter = lead.getCenterId();
        if (leadCenter == null || !Objects.equals(leadCenter, jwtCenter)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Lead is not in your center");
        }
    }

    public static UUID requireUserId(AuthUser user) {
        if (user == null || user.getUserId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return user.getUserId();
    }

    /** Reject body fields that try to impersonate another user (e.g. callerId in call APIs). */
    public static void assertActorIsSelf(AuthUser user, String claimedUserId) {
        requireUserId(user);
        if (claimedUserId == null || claimedUserId.isBlank()) {
            return;
        }
        if (!user.getUserId().toString().equals(claimedUserId.trim())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot act as another user");
        }
    }

    public static void assertQueryUserIsSelf(AuthUser user, String requestedUserId) {
        requireUserId(user);
        if (requestedUserId == null || requestedUserId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "userId is required");
        }
        if (!user.getUserId().toString().equals(requestedUserId.trim())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot query another user's calls");
        }
    }

    /** Voice/video calls are only for conversation participants (not org-wide bypass). */
    public static void assertCanAccessConversation(AuthUser user, Conversation conversation) {
        UUID self = requireUserId(user);
        if (conversation == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found");
        }
        if (Boolean.FALSE.equals(conversation.getIsActive())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Conversation is not active");
        }
        List<UUID> participants = conversation.getParticipantIds();
        if (participants == null || !participants.contains(self)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a participant in this conversation");
        }
    }

    /** Recipient may read/update their own notification; org-wide staff may access any. */
    public static void assertCanAccessNotification(AuthUser user, Notification notification) {
        if (notification == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        if (isOrgWide(user)) {
            return;
        }
        UUID self = requireUserId(user);
        if (notification.getUserId() != null && self.equals(notification.getUserId())) {
            return;
        }
        if (notification.getUserId() == null) {
            UUID jwtCenter = user.getCenterId();
            if (notification.getCenterId() == null
                    || jwtCenter == null
                    || jwtCenter.equals(notification.getCenterId())) {
                return;
            }
        }
        if (notification.getCenterId() != null
                && user.getCenterId() != null
                && user.getCenterId().equals(notification.getCenterId())
                && STAFF_NOTIFY.contains(safeRole(user))) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot access another user's notification");
    }

    /** Create notification for self, staff/org-wide, or family message types to staff. */
    public static void assertCanCreateNotification(AuthUser user, Notification notification) {
        requireUserId(user);
        if (notification == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        }
        UUID target = notification.getUserId();
        if (target == null) {
            if (!isOrgWide(user)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Broadcast notifications require an org-wide role");
            }
            return;
        }
        if (target.equals(user.getUserId())) {
            return;
        }
        if (isOrgWide(user) || STAFF_NOTIFY.contains(safeRole(user))) {
            return;
        }
        String type = notification.getType() == null ? "" : notification.getType().toUpperCase();
        String role = safeRole(user);
        if (("PARENT".equals(role) || "STUDENT".equals(role))
                && (type.contains("MESSAGE") || type.contains("MEETING"))) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot create a notification for another user");
    }

    private static String safeRole(AuthUser user) {
        return user.getRoleName() == null ? "" : user.getRoleName().toUpperCase();
    }

    public static void assertCanAccessMeeting(AuthUser user, ParentTeacherMeeting meeting) {
        if (meeting == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        if (isOrgWide(user)) {
            return;
        }
        UUID self = requireUserId(user);
        if (self.equals(meeting.getParentId())
                || self.equals(meeting.getTeacherId())
                || self.equals(meeting.getStudentId())) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot access this meeting");
    }

    /** Parent/teacher/student may only query their own participant id unless org-wide. */
    public static UUID effectiveMeetingParticipantId(AuthUser user, UUID requestedId) {
        UUID self = requireUserId(user);
        if (requestedId == null) {
            return self;
        }
        if (self.equals(requestedId)) {
            return requestedId;
        }
        if (isOrgWide(user)) {
            return requestedId;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot query another user's meetings");
    }

    /** Assignee may read/update their own task; org-wide staff may access any. */
    public static void assertCanAccessTask(AuthUser user, Task task) {
        if (task == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        if (isOrgWide(user)) {
            return;
        }
        UUID self = requireUserId(user);
        if (task.getAssigneeId() != null && self.equals(task.getAssigneeId())) {
            return;
        }
        if (task.getAssignedBy() != null && self.equals(task.getAssignedBy())) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot access another user's task");
    }

    /**
     * Task list: defaults to JWT user; org-wide roles may query another assignee.
     */
    public static UUID effectiveAssigneeId(AuthUser user, UUID requestedAssigneeId) {
        UUID self = requireUserId(user);
        if (requestedAssigneeId == null) {
            return self;
        }
        if (self.equals(requestedAssigneeId)) {
            return requestedAssigneeId;
        }
        if (isOrgWide(user)) {
            return requestedAssigneeId;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot query another user's tasks");
    }

    /**
     * Message/notification inbox: defaults to JWT user; org-wide roles may query another user.
     */
    public static UUID effectiveNotificationUserId(AuthUser user, UUID requestedUserId) {
        UUID self = requireUserId(user);
        if (requestedUserId == null) {
            return self;
        }
        if (self.equals(requestedUserId)) {
            return requestedUserId;
        }
        if (isOrgWide(user)) {
            return requestedUserId;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot query another user's messages");
    }

    public static UUID effectiveGroupUserId(AuthUser user, UUID requestedUserId) {
        UUID self = requireUserId(user);
        if (requestedUserId == null) {
            return self;
        }
        if (self.equals(requestedUserId)) {
            return requestedUserId;
        }
        if (isOrgWide(user)) {
            return requestedUserId;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot query another user's groups");
    }

    public static void assertGroupMember(AuthUser user, ChatGroup group) {
        if (group == null || !Boolean.TRUE.equals(group.getIsActive())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Group not found");
        }
        if (isOrgWide(user)) {
            return;
        }
        UUID self = requireUserId(user);
        if (group.getMemberIds() != null && group.getMemberIds().contains(self)) {
            return;
        }
        if (group.getAdminIds() != null && group.getAdminIds().contains(self)) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a member of this group");
    }

    public static void assertGroupAdmin(AuthUser user, ChatGroup group) {
        assertGroupMember(user, group);
        if (isOrgWide(user)) {
            return;
        }
        UUID self = requireUserId(user);
        if (group.getAdminIds() != null && group.getAdminIds().contains(self)) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Group admin role required");
    }

    public static boolean isAcademyStaff(AuthUser user) {
        if (user == null || user.getRoleName() == null) {
            return false;
        }
        String role = user.getRoleName().toUpperCase();
        return isOrgWide(user)
                || STAFF_NOTIFY.contains(role)
                || Set.of("CENTER_MANAGER", "CENTER_ADMIN", "ACADEMIC_MANAGER", "TEACHER",
                        "STAFF", "TEACHING_ASSISTANT", "TA").contains(role);
    }

    /** Stub {@code /api/activities} and {@code /api/documents} list/stats — staff only unless scoped to self. */
    public static void assertStaffOrSelfUserQuery(AuthUser user, String requestedUserId) {
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        if (isAcademyStaff(user)) {
            return;
        }
        if (requestedUserId == null || requestedUserId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Staff role required for this operation");
        }
        assertQueryUserIsSelf(user, requestedUserId);
    }

    public static void assertOrgWideMutation(AuthUser user) {
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        if (!isOrgWide(user)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Org-wide role required");
        }
    }

    public static UUID parseUuid(String raw, String fieldName) {
        if (raw == null || raw.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " is required");
        }
        try {
            return UUID.fromString(raw.trim());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid " + fieldName);
        }
    }
}
