package com.lera.academy_service.service;

import com.lera.academy_service.client.NotificationClient;
import com.lera.academy_service.entity.Enrollment;
import com.lera.academy_service.entity.Student;
import com.lera.academy_service.entity.StudentParent;
import com.lera.academy_service.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Who gets told when a class is cancelled. This service has a history: a teacher was once added
 * by their teaching record instead of their user account, connect rejected the insert, and
 * because the roster is sent as ONE batch that single bad id meant nobody in the class was told.
 *
 * It resolved each enrolled student with its own findById — 30 queries to notify a class of 30.
 * Batching that is easy to get subtly wrong, so these pin the membership rules rather than the
 * query count alone: an enrolment with a null status counts as active, a dropped one does not,
 * and an enrolment pointing at a student row that no longer exists is skipped rather than
 * poisoning the batch.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ClassRosterRecipientsTest {

    @Mock private EnrollmentRepository enrollmentRepository;
    @Mock private TeacherRepository teacherRepository;
    @Mock private StudentParentRepository studentParentRepository;
    @Mock private StudentRepository studentRepository;
    @Mock private NotificationClient notificationClient;

    @InjectMocks private ClassRosterNotificationService service;

    private final UUID classId = UUID.randomUUID();

    private Enrollment enrolment(UUID studentId, String status) {
        Enrollment e = new Enrollment();
        e.setStudentId(studentId);
        e.setStatus(status);
        return e;
    }

    private Student student(UUID id, UUID userId, UUID parentId) {
        Student s = new Student();
        s.setId(id);
        s.setUserId(userId);
        s.setParentId(parentId);
        return s;
    }

    @Test
    @SuppressWarnings("unchecked")
    void includesActiveAndNullStatusEnrolmentsAndNotDroppedOnes() {
        UUID activeId = UUID.randomUUID(), nullStatusId = UUID.randomUUID(), droppedId = UUID.randomUUID();
        UUID activeUser = UUID.randomUUID(), nullUser = UUID.randomUUID(), droppedUser = UUID.randomUUID();
        when(enrollmentRepository.findByClassId(classId)).thenReturn(List.of(
                enrolment(activeId, "ACTIVE"), enrolment(nullStatusId, null), enrolment(droppedId, "DROPPED")));
        // Answer according to the ids actually asked for — stubbing any() would hide the
        // filter entirely, which is how the first version of this test passed a mutation that
        // dropped the null-status rule.
        Map<UUID, Student> rows = Map.of(
                activeId, student(activeId, activeUser, null),
                nullStatusId, student(nullStatusId, nullUser, null),
                droppedId, student(droppedId, droppedUser, null));
        when(studentRepository.findAllById(any())).thenAnswer(inv -> {
            List<UUID> asked = new ArrayList<>();
            ((Iterable<UUID>) inv.getArgument(0)).forEach(asked::add);
            return asked.stream().map(rows::get).filter(Objects::nonNull).toList();
        });
        when(studentParentRepository.findByStudentIdIn(any())).thenReturn(List.of());

        List<UUID> ids = service.resolveRecipientUserIds(classId, null, null);

        assertTrue(ids.contains(activeUser));
        assertTrue(ids.contains(nullUser), "a null status counted as active before batching");
        assertFalse(ids.contains(droppedUser), "a dropped student must not be notified");
    }

    @Test
    @SuppressWarnings("unchecked")
    void skipsAnEnrolmentWhoseStudentRowIsGone() {
        UUID presentId = UUID.randomUUID(), missingId = UUID.randomUUID(), presentUser = UUID.randomUUID();
        when(enrollmentRepository.findByClassId(classId)).thenReturn(List.of(
                enrolment(presentId, "ACTIVE"), enrolment(missingId, "ACTIVE")));
        // findAllById simply omits the missing row, as findById returning empty did
        Map<UUID, Student> rows2 = Map.of(presentId, student(presentId, presentUser, null));
        when(studentRepository.findAllById(any())).thenAnswer(inv -> {
            List<UUID> asked = new ArrayList<>();
            ((Iterable<UUID>) inv.getArgument(0)).forEach(asked::add);
            return asked.stream().map(rows2::get).filter(Objects::nonNull).toList();
        });
        when(studentParentRepository.findByStudentIdIn(any())).thenReturn(List.of());

        List<UUID> ids = service.resolveRecipientUserIds(classId, null, null);

        assertEquals(List.of(presentUser), ids);
    }

    @Test
    void stillReachesParentsLinkedThroughStudentParents() {
        UUID sid = UUID.randomUUID(), suser = UUID.randomUUID();
        UUID legacyParent = UUID.randomUUID(), linkedParent = UUID.randomUUID();
        StudentParent link = new StudentParent();
        link.setStudentId(sid);
        link.setParentId(linkedParent);
        when(enrollmentRepository.findByClassId(classId)).thenReturn(List.of(enrolment(sid, "ACTIVE")));
        when(studentRepository.findAllById(any())).thenReturn(List.of(student(sid, suser, legacyParent)));
        when(studentParentRepository.findByStudentIdIn(any())).thenReturn(List.of(link));

        List<UUID> ids = service.resolveRecipientUserIds(classId, null, null);

        assertTrue(ids.contains(legacyParent), "students.parent_id, the older single-parent column");
        assertTrue(ids.contains(linkedParent), "student_parents, what the Link a child UI writes");
    }

    @Test
    void asksOnceForTheRosterRatherThanOncePerEnrolment() {
        List<Enrollment> thirty = new ArrayList<>();
        for (int i = 0; i < 30; i++) thirty.add(enrolment(UUID.randomUUID(), "ACTIVE"));
        when(enrollmentRepository.findByClassId(classId)).thenReturn(thirty);
        when(studentRepository.findAllById(any())).thenReturn(List.of());
        when(studentParentRepository.findByStudentIdIn(any())).thenReturn(List.of());

        service.resolveRecipientUserIds(classId, null, null);

        verify(studentRepository, never()).findById(any());
        verify(studentRepository, times(1)).findAllById(any());
    }
}
