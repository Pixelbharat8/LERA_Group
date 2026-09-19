package com.lera.academy_service.controller;

import com.lera.academy_service.entity.Exam;
import com.lera.academy_service.entity.ExamResult;
import com.lera.academy_service.entity.Student;
import com.lera.academy_service.repository.*;
import com.lera.academy_service.security.AcademyAuthorizationService;
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
 * Listing a centre's exam results was the heaviest query pattern in the codebase.
 *
 * Gathering: one query per exam, nested inside a loop over the centre's classes — 20 classes
 * with 6 exams each cost 1 + 20 + 120 queries before a single row was rendered.
 *
 * Rendering: buildResultResponse resolved the student AND the exam for every row, one findById
 * each. On 3,000 results that is 6,000 more queries — and the exams had already been loaded
 * while gathering, then thrown away.
 *
 * The rendered output must not change, so these assert the payload as well as the query count.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ExamResultBatchingTest {

    @Mock private ExamResultRepository examResultRepository;
    @Mock private ExamRepository examRepository;
    @Mock private StudentRepository studentRepository;
    @Mock private ClassRepository classRepository;
    @Mock private AcademyAuthorizationService authz;

    @InjectMocks private ExamResultController controller;

    private ExamResult result(UUID examId, UUID studentId) {
        ExamResult r = new ExamResult();
        r.setId(UUID.randomUUID());
        r.setExamId(examId);
        r.setStudentId(studentId);
        return r;
    }

    @Test
    @SuppressWarnings("unchecked")
    void rendersNamesWithoutAQueryPerRow() {
        UUID classId = UUID.randomUUID(), examId = UUID.randomUUID();
        List<ExamResult> rows = new ArrayList<>();
        List<Student> students = new ArrayList<>();
        for (int i = 0; i < 40; i++) {
            UUID sid = UUID.randomUUID();
            Student s = new Student();
            s.setId(sid);
            s.setFullname("Student " + i);
            students.add(s);
            rows.add(result(examId, sid));
        }
        Exam exam = new Exam();
        exam.setId(examId);
        exam.setName("Unit 3 Test");

        when(examRepository.findByClassId(classId)).thenReturn(List.of(exam));
        when(examResultRepository.findByExamIdIn(List.of(examId))).thenReturn(rows);
        when(studentRepository.findAllById(any())).thenReturn(students);
        when(examRepository.findAllById(any())).thenReturn(List.of(exam));

        List<Map<String, Object>> body =
                (List<Map<String, Object>>) controller.getAllResults(classId, null, null).getBody();

        assertEquals(40, body.size());
        assertEquals("Student 0", body.get(0).get("studentName"));
        assertEquals("Unit 3 Test", body.get(0).get("examName"));

        // the per-row lookups the old renderer made, 40 times each
        verify(studentRepository, never()).findById(any());
        verify(examRepository, never()).findById(any());
        verify(studentRepository, times(1)).findAllById(any());
        verify(examRepository, times(1)).findAllById(any());
    }

    @Test
    @SuppressWarnings("unchecked")
    void stillSaysUnknownWhenTheStudentOrExamIsMissing() {
        UUID classId = UUID.randomUUID(), examId = UUID.randomUUID();
        List<ExamResult> rows = List.of(result(examId, UUID.randomUUID()));
        Exam exam = new Exam();
        exam.setId(examId);

        when(examRepository.findByClassId(classId)).thenReturn(List.of(exam));
        when(examResultRepository.findByExamIdIn(List.of(examId))).thenReturn(rows);
        when(studentRepository.findAllById(any())).thenReturn(List.of());   // student row gone
        when(examRepository.findAllById(any())).thenReturn(List.of());      // exam row gone

        List<Map<String, Object>> body =
                (List<Map<String, Object>>) controller.getAllResults(classId, null, null).getBody();

        assertEquals("Unknown Student", body.get(0).get("studentName"));
        assertEquals("Unknown Exam", body.get(0).get("examName"));
    }

    @Test
    void gathersACentresResultsWithoutAQueryPerExam() {
        UUID centerId = UUID.randomUUID();
        List<com.lera.academy_service.entity.ClassEntity> classes = new ArrayList<>();
        for (int i = 0; i < 20; i++) {
            com.lera.academy_service.entity.ClassEntity c = new com.lera.academy_service.entity.ClassEntity();
            c.setId(UUID.randomUUID());
            classes.add(c);
        }
        when(authz.effectiveListCenterId(centerId)).thenReturn(centerId);
        when(classRepository.findByCenterId(centerId)).thenReturn(classes);
        when(examRepository.findByClassIdIn(any())).thenReturn(List.of());

        controller.getAllResults(null, centerId, null);

        verify(examRepository, times(1)).findByClassIdIn(any());
        verify(examRepository, never()).findByClassId(any());
        verify(examResultRepository, never()).findByExamId(any());
    }
}
