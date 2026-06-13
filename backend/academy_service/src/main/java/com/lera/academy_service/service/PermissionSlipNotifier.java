package com.lera.academy_service.service;

import com.lera.academy_service.entity.Enrollment;
import com.lera.academy_service.entity.PermissionSlip;
import com.lera.academy_service.entity.Student;
import com.lera.academy_service.repository.EnrollmentRepository;
import com.lera.academy_service.repository.StudentParentRepository;
import com.lera.academy_service.repository.StudentRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

/**
 * Pushes a "new permission slip" notification into {@code connect_service}
 * after a slip is created. Cross-service call so notification concerns stay
 * out of {@code academy_service}'s persistence path.
 *
 * <p>Routing model — based on the slip's targeting:
 * <ul>
 *   <li><b>classId set</b>: fan out to every parent of every student
 *       enrolled in that class (active enrolments). One bell row + one push
 *       per parent.</li>
 *   <li><b>centerId set, classId null</b>: fan out to every parent of every
 *       student attached to that centre.</li>
 *   <li><b>both null</b>: broadcast — single row with {@code userId=null},
 *       which {@link com.lera.connect_service.service.PushDispatcher} now
 *       fans out to every registered device token.</li>
 * </ul>
 *
 * <p>The cross-service call is best-effort: any failure is logged but never
 * propagated. A flaky connect_service must not block teachers from creating
 * slips, and a single-parent failure must not abort the rest of the fan-out.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PermissionSlipNotifier {

    private static final String NOTIFICATION_TYPE = "approval";
    private static final String REFERENCE_TYPE = "permission_slip";

    @Value("${lera.connect.url:http://127.0.0.1:8086}")
    private String connectUrl;

    private final StudentParentRepository studentParentRepo;
    private final StudentRepository studentRepo;
    private final EnrollmentRepository enrollmentRepo;

    private final RestTemplate restTemplate = new RestTemplate();

    public void notifySlipCreated(PermissionSlip slip) {
        if (slip == null) return;
        String token = currentBearerToken();

        // Whole-school slip (no targeting at all) → broadcast row. Anything
        // targeted at a class or centre fans out to that subset of parents,
        // even if the subset turns out to be empty (we'd rather drop a
        // misconfigured slip than spam the entire user base).
        if (slip.getClassId() == null && slip.getCenterId() == null) {
            postNotification(buildBody(slip, null), token);
            log.info("permission-slip notify slip={} mode=broadcast", slip.getId());
            return;
        }

        Set<UUID> recipients = resolveRecipients(slip);
        if (recipients.isEmpty()) {
            log.info("permission-slip notify slip={} targeted but resolved 0 recipients (likely empty class/centre)",
                    slip.getId());
            return;
        }

        // Per-parent rows so each parent gets a row in their bell feed and a
        // targeted native push instead of a single broadcast they'd all share.
        int ok = 0, failed = 0;
        for (UUID parentId : recipients) {
            try {
                postNotification(buildBody(slip, parentId), token);
                ok++;
            } catch (Exception e) {
                failed++;
                log.warn("permission-slip notify failed for parent {} on slip {}: {}",
                        parentId, slip.getId(), e.getMessage());
            }
        }
        log.info("permission-slip notify slip={} ok={} failed={} recipients={}",
                slip.getId(), ok, failed, recipients.size());
    }

    /**
     * Resolve the set of parent userIds the targeted slip is intended for.
     * Returns an empty set when the targeting points at a class/centre with
     * no enrolled students — the caller treats that as "send nothing", not
     * "broadcast", so a misconfigured slip never spams the whole user base.
     * For whole-school slips the caller short-circuits before reaching here.
     */
    Set<UUID> resolveRecipients(PermissionSlip slip) {
        Set<UUID> studentIds = new HashSet<>();
        if (slip.getClassId() != null) {
            for (Enrollment e : enrollmentRepo.findByClassId(slip.getClassId())) {
                if (e.getStudentId() == null) continue;
                if (e.getStatus() != null && !"ACTIVE".equalsIgnoreCase(e.getStatus())) continue;
                studentIds.add(e.getStudentId());
            }
        } else if (slip.getCenterId() != null) {
            for (Student s : studentRepo.findByCenterId(slip.getCenterId())) {
                studentIds.add(s.getId());
            }
        } else {
            return Set.of(); // caller's whole-school path; should be unreachable.
        }

        Set<UUID> parents = new HashSet<>();
        // Modern many-to-many via student_parents.
        for (UUID studentId : studentIds) {
            studentParentRepo.findByStudentId(studentId).forEach(sp -> {
                if (sp.getParentId() != null) parents.add(sp.getParentId());
            });
        }
        // Legacy denormalised pointer on Student.
        studentRepo.findAllById(studentIds).forEach(s -> {
            if (s.getParentId() != null) parents.add(s.getParentId());
        });
        parents.removeIf(Objects::isNull);
        return parents;
    }

    private static Map<String, Object> buildBody(PermissionSlip slip, UUID userId) {
        Map<String, Object> body = new HashMap<>();
        if (userId != null) body.put("userId", userId.toString());
        body.put("title", "New permission slip: " + slip.getTitle());
        body.put("message", slip.getDescription() != null ? slip.getDescription() : "Please review and reply.");
        body.put("type", NOTIFICATION_TYPE);
        body.put("referenceType", REFERENCE_TYPE);
        body.put("referenceId", slip.getId() != null ? slip.getId().toString() : null);
        return body;
    }

    private void postNotification(Map<String, Object> body, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (token != null) headers.setBearerAuth(token);
        restTemplate.postForEntity(connectUrl + "/api/notifications",
                new HttpEntity<>(body, headers), Map.class);
    }

    /**
     * Pull the bearer token off the inbound request so we can forward it.
     * Returns {@code null} when invoked outside an HTTP context (e.g. tests
     * or the scheduler).
     */
    private static String currentBearerToken() {
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs == null) return null;
            HttpServletRequest req = attrs.getRequest();
            String header = req.getHeader("Authorization");
            if (header != null && header.startsWith("Bearer ")) return header.substring(7);
            if (req.getCookies() != null) {
                for (jakarta.servlet.http.Cookie c : req.getCookies()) {
                    if ("token".equals(c.getName()) && c.getValue() != null && !c.getValue().isBlank()) {
                        return c.getValue();
                    }
                }
            }
        } catch (Exception ignored) {
            // No request context → caller is something else (test, scheduler, …).
        }
        return null;
    }
}
