package com.lera.academy_service.controller;

import com.lera.academy_service.entity.Exam;
import com.lera.academy_service.entity.ExamResult;
import com.lera.academy_service.repository.ExamRepository;
import com.lera.academy_service.repository.ExamResultRepository;
import com.lera.academy_service.security.AcademyAuthorizationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * mapGrades resolved the exam for every grade row with its own findById. A student's history of
 * 50 results cost 50 queries; for an org-wide caller, where the source list is every exam result
 * in the system, one per row over an unbounded list.
 *
 * The exam is not decoration here — it supplies the subject name, the assessment type, the max
 * score, AND two filters that skip rows (wrong class, wrong subject). So these assert the
 * filtering still behaves, not just the query count: a batching rewrite that loses a filter
 * silently widens what a caller can see.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class GradeBatchingTest {

    @Mock private ExamResultRepository examResultRepository;
    @Mock private ExamRepository examRepository;
    @Mock private AcademyAuthorizationService authz;

    @InjectMocks private GradeController controller;

    private ExamResult result(UUID examId) {
        ExamResult r = new ExamResult();
        r.setId(UUID.randomUUID());
        r.setExamId(examId);
        r.setStudentId(UUID.randomUUID());
        r.setScore(new BigDecimal("80"));
        return r;
    }

    private Exam exam(UUID id, String name, UUID classId) {
        Exam e = new Exam();
        e.setId(id);
        e.setName(name);
        e.setClassId(classId);
        return e;
    }

    @Test
    @SuppressWarnings("unchecked")
    void resolvesEveryExamInOneLookup() {
        UUID studentId = UUID.randomUUID();
        List<ExamResult> rows = new ArrayList<>();
        List<Exam> exams = new ArrayList<>();
        for (int i = 0; i < 50; i++) {
            UUID eid = UUID.randomUUID();
            exams.add(exam(eid, "Test " + i, null));
            rows.add(result(eid));
        }
        when(examResultRepository.findByStudentId(studentId)).thenReturn(rows);
        when(examRepository.findAllById(any())).thenReturn(exams);

        List<Map<String, Object>> body =
                (List<Map<String, Object>>) controller.getGrades(studentId, null, null, org.springframework.data.domain.Pageable.unpaged()).getBody();

        assertEquals(50, body.size());
        assertEquals("Test 0", body.get(0).get("subject"));
        verify(examRepository, never()).findById(any());
        verify(examRepository, times(1)).findAllById(any());
    }

    @Test
    @SuppressWarnings("unchecked")
    void stillSkipsAGradeFromAnotherClass() {
        UUID studentId = UUID.randomUUID(), wanted = UUID.randomUUID(), other = UUID.randomUUID();
        UUID keepId = UUID.randomUUID(), dropId = UUID.randomUUID();
        when(examResultRepository.findByStudentId(studentId))
                .thenReturn(List.of(result(keepId), result(dropId)));
        when(examRepository.findAllById(any()))
                .thenReturn(List.of(exam(keepId, "Kept", wanted), exam(dropId, "Dropped", other)));

        List<Map<String, Object>> body =
                (List<Map<String, Object>>) controller.getGrades(studentId, wanted, null, org.springframework.data.domain.Pageable.unpaged()).getBody();

        assertEquals(1, body.size(), "a result belonging to another class must not appear");
        assertEquals("Kept", body.get(0).get("subject"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void stillFiltersBySubject() {
        UUID studentId = UUID.randomUUID(), a = UUID.randomUUID(), b = UUID.randomUUID();
        when(examResultRepository.findByStudentId(studentId))
                .thenReturn(List.of(result(a), result(b)));
        when(examRepository.findAllById(any()))
                .thenReturn(List.of(exam(a, "Maths", null), exam(b, "English", null)));

        List<Map<String, Object>> body =
                (List<Map<String, Object>>) controller.getGrades(studentId, null, "English", org.springframework.data.domain.Pageable.unpaged()).getBody();

        assertEquals(1, body.size());
        assertEquals("English", body.get(0).get("subject"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void filtersByClassInTheDatabaseRatherThanLoadingEveryResult() {
        UUID classId = UUID.randomUUID(), examId = UUID.randomUUID();
        Exam e = exam(examId, "Unit 1", classId);
        when(examRepository.findByClassId(classId)).thenReturn(List.of(e));
        when(examResultRepository.findByExamIdIn(List.of(examId))).thenReturn(List.of(result(examId)));
        when(examRepository.findAllById(any())).thenReturn(List.of(e));

        List<Map<String, Object>> body = (List<Map<String, Object>>)
                controller.getGrades(null, classId, null,
                        org.springframework.data.domain.Pageable.unpaged()).getBody();

        assertEquals(1, body.size());
        verify(examResultRepository, never()).findAll();
        verify(examResultRepository, never()).findAll(any(org.springframework.data.domain.Pageable.class));
    }

    @Test
    void anUnfilteredRequestIsBoundedRatherThanLoadingTheWholeTable() {
        when(authz.isOrgWide()).thenReturn(true);
        org.springframework.data.domain.Pageable page =
                org.springframework.data.domain.PageRequest.of(0, 50);
        when(examResultRepository.findAll(page))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of()));

        controller.getGrades(null, null, null, page);

        verify(examResultRepository, times(1)).findAll(page);
        verify(examResultRepository, never()).findAll();   // the unbounded overload
    }
}
