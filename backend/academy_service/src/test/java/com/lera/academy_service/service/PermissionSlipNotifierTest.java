package com.lera.academy_service.service;

import com.lera.academy_service.entity.Enrollment;
import com.lera.academy_service.entity.PermissionSlip;
import com.lera.academy_service.entity.Student;
import com.lera.academy_service.entity.StudentParent;
import com.lera.academy_service.repository.EnrollmentRepository;
import com.lera.academy_service.repository.StudentParentRepository;
import com.lera.academy_service.repository.StudentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;

/**
 * Tests the recipient-resolution logic in {@link PermissionSlipNotifier}.
 * The HTTP fan-out itself is best-effort and not exercised here — we only
 * care that the right set of parent userIds is identified for each kind of
 * slip targeting.
 */
@ExtendWith(MockitoExtension.class)
class PermissionSlipNotifierTest {

    @Mock private StudentParentRepository studentParents;
    @Mock private StudentRepository students;
    @Mock private EnrollmentRepository enrolments;

    @InjectMocks private PermissionSlipNotifier notifier;

    @Test
    void wholeSchoolSlip_resolveRecipients_returnsEmptySet() {
        // resolveRecipients is the *targeted* lookup. For a whole-school
        // slip notifySlipCreated short-circuits before calling it; here we
        // just confirm the helper returns empty rather than NPE-ing or
        // spuriously matching anyone.
        PermissionSlip slip = new PermissionSlip();
        slip.setId(UUID.randomUUID());

        Set<UUID> recipients = notifier.resolveRecipients(slip);
        assertThat(recipients).isEmpty();
    }

    @Test
    void classTargeted_collectsParentsViaEnrollmentAndStudentParents() {
        UUID classId = UUID.randomUUID();
        UUID studentA = UUID.randomUUID();
        UUID studentB = UUID.randomUUID();
        UUID parentA1 = UUID.randomUUID();
        UUID parentA2 = UUID.randomUUID();
        UUID parentB = UUID.randomUUID();

        Enrollment ea = new Enrollment();
        ea.setStudentId(studentA);
        ea.setStatus("ACTIVE");
        Enrollment eb = new Enrollment();
        eb.setStudentId(studentB);
        eb.setStatus("ACTIVE");
        Enrollment dropped = new Enrollment();
        dropped.setStudentId(UUID.randomUUID());
        dropped.setStatus("DROPPED"); // must be filtered out

        lenient().when(enrolments.findByClassId(classId)).thenReturn(List.of(ea, eb, dropped));
        lenient().when(studentParents.findByStudentId(studentA))
                .thenReturn(List.of(studentParent(studentA, parentA1), studentParent(studentA, parentA2)));
        lenient().when(studentParents.findByStudentId(studentB))
                .thenReturn(List.of(studentParent(studentB, parentB)));
        // Legacy parentId on Student → returned alongside the modern join.
        Student sA = new Student(); sA.setId(studentA);
        Student sB = new Student(); sB.setId(studentB); sB.setParentId(parentB);
        lenient().when(students.findAllById(any())).thenReturn(List.of(sA, sB));

        PermissionSlip slip = new PermissionSlip();
        slip.setClassId(classId);

        Set<UUID> recipients = notifier.resolveRecipients(slip);
        assertThat(recipients).containsExactlyInAnyOrder(parentA1, parentA2, parentB);
    }

    @Test
    void centerTargeted_collectsParentsViaCenterStudents() {
        UUID centerId = UUID.randomUUID();
        UUID studentA = UUID.randomUUID();
        UUID parentA = UUID.randomUUID();
        UUID legacyParent = UUID.randomUUID();

        Student sA = new Student(); sA.setId(studentA); sA.setParentId(legacyParent);
        lenient().when(students.findByCenterId(centerId)).thenReturn(List.of(sA));
        lenient().when(studentParents.findByStudentId(studentA))
                .thenReturn(List.of(studentParent(studentA, parentA)));
        lenient().when(students.findAllById(any())).thenReturn(List.of(sA));

        PermissionSlip slip = new PermissionSlip();
        slip.setCenterId(centerId);

        Set<UUID> recipients = notifier.resolveRecipients(slip);
        assertThat(recipients).containsExactlyInAnyOrder(parentA, legacyParent);
    }

    private static StudentParent studentParent(UUID studentId, UUID parentId) {
        StudentParent sp = new StudentParent();
        sp.setStudentId(studentId);
        sp.setParentId(parentId);
        return sp;
    }
}
