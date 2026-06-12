package com.lera.academy_service.config;

import com.lera.academy_service.entity.*;
import com.lera.academy_service.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class AcademyDataLoader implements CommandLineRunner {

    private final CourseProgramRepository courseProgramRepository;
    private final ClassRepository classRepository;
    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;
    private final EnrollmentRepository enrollmentRepository;

    @Override
    public void run(String... args) throws Exception {
        loadCourses();
        loadTeachers();
        loadStudents();
        loadClasses();
        loadEnrollments();
    }

    private void loadCourses() {
        if (courseProgramRepository.count() == 0) {
            CourseProgram[] courses = {
                    CourseProgram.builder()
                            .code("STARTERS")
                            .name("LERA Starters")
                            .nameVi("LERA Khởi đầu")
                            .description("Foundation English for young learners")
                            .descriptionVi("Tiếng Anh nền tảng cho trẻ nhỏ")
                            .ageFrom(4).ageTo(6)
                            .category("kids")
                            .level("beginner")
                            .isFeatured(true)
                            .isActive(true)
                            .build(),
                    CourseProgram.builder()
                            .code("EXPLORERS")
                            .name("LERA Explorers")
                            .nameVi("LERA Khám phá")
                            .description("Interactive English exploration")
                            .descriptionVi("Khám phá Tiếng Anh tương tác")
                            .ageFrom(7).ageTo(9)
                            .category("kids")
                            .level("elementary")
                            .isFeatured(true)
                            .isActive(true)
                            .build(),
                    CourseProgram.builder()
                            .code("PRIMARY")
                            .name("LERA Primary")
                            .nameVi("LERA Tiểu học")
                            .description("Comprehensive English for primary students")
                            .descriptionVi("Tiếng Anh toàn diện cho học sinh tiểu học")
                            .ageFrom(10).ageTo(12)
                            .category("kids")
                            .level("intermediate")
                            .isFeatured(true)
                            .isActive(true)
                            .build()
            };

            for (CourseProgram course : courses) {
                courseProgramRepository.save(course);
            }
        }
    }

    private void loadTeachers() {
        if (teacherRepository.count() == 0) {
            Teacher[] teachers = {
                    Teacher.builder()
                            .teacherCode("TCH001")
                            .specialization("English Communication")
                            .qualification("Bachelor of Education")
                            .yearsOfExperience(8)
                            .isFeatured(true)
                            .status("ACTIVE")
                            .build(),
                    Teacher.builder()
                            .teacherCode("TCH002")
                            .specialization("Grammar & Writing")
                            .qualification("Master of English")
                            .yearsOfExperience(6)
                            .isFeatured(true)
                            .status("ACTIVE")
                            .build(),
                    Teacher.builder()
                            .teacherCode("TCH003")
                            .specialization("Phonics & Reading")
                            .qualification("Bachelor of Education")
                            .yearsOfExperience(5)
                            .isFeatured(false)
                            .status("ACTIVE")
                            .build()
            };

            for (Teacher teacher : teachers) {
                teacherRepository.save(teacher);
            }
        }
    }

    private void loadStudents() {
        if (studentRepository.count() == 0) {
            Student[] students = {
                    Student.builder()
                            .studentCode("STU001")
                            .fullname("Nguyen Minh Duc")
                            .fullnameVi("Nguyễn Minh Đức")
                            .dateOfBirth(LocalDate.of(2015, 5, 15))
                            .gender("Male")
                            .schoolName("Saigon School")
                            .grade("5")
                            .emergencyContactName("Nguyen Thi Lan")
                            .emergencyContactPhone("+84912345678")
                            .status("ACTIVE")
                            .build(),
                    Student.builder()
                            .studentCode("STU002")
                            .fullname("Tran Thi Hoa")
                            .fullnameVi("Trần Thị Hoa")
                            .dateOfBirth(LocalDate.of(2014, 8, 20))
                            .gender("Female")
                            .schoolName("Thảo Điền School")
                            .grade("6")
                            .emergencyContactName("Tran Van Hau")
                            .emergencyContactPhone("+84987654321")
                            .status("ACTIVE")
                            .build(),
                    Student.builder()
                            .studentCode("STU003")
                            .fullname("Le Hoang Tuan")
                            .fullnameVi("Lê Hoàng Tuấn")
                            .dateOfBirth(LocalDate.of(2016, 3, 10))
                            .gender("Male")
                            .schoolName("British International School")
                            .grade("4")
                            .emergencyContactName("Le Thi Hanh")
                            .emergencyContactPhone("+84911111111")
                            .status("ACTIVE")
                            .build(),
                    Student.builder()
                            .studentCode("STU004")
                            .fullname("Pham Thi Thanh")
                            .fullnameVi("Phạm Thị Thanh")
                            .dateOfBirth(LocalDate.of(2015, 11, 5))
                            .gender("Female")
                            .schoolName("Horizon International")
                            .grade("5")
                            .emergencyContactName("Pham Van Khanh")
                            .emergencyContactPhone("+84922222222")
                            .status("ACTIVE")
                            .build()
            };

            for (Student student : students) {
                studentRepository.save(student);
            }
        }
    }

    private void loadClasses() {
        if (classRepository.count() == 0) {
            // Get first course program and teacher
            var courses = courseProgramRepository.findAll();
            var teachers = teacherRepository.findAll();

            if (!courses.isEmpty() && !teachers.isEmpty()) {
                CourseProgram course = courses.get(0);
                Teacher teacher = teachers.get(0);

                ClassEntity[] classes = {
                        ClassEntity.builder()
                                .programId(course.getId())
                                .name("Starters - Monday Class")
                                .teacherId(teacher.getId())
                                .maxStudents(20)
                                .startDate(LocalDate.now())
                                .status("OPEN")
                                .build(),
                        ClassEntity.builder()
                                .programId(course.getId())
                                .name("Starters - Wednesday Class")
                                .teacherId(teacher.getId())
                                .maxStudents(20)
                                .startDate(LocalDate.now())
                                .status("OPEN")
                                .build()
                };

                for (ClassEntity classEntity : classes) {
                    classRepository.save(classEntity);
                }
            }
        }
    }

    private void loadEnrollments() {
        if (enrollmentRepository.count() == 0) {
            var students = studentRepository.findAll();
            var classes = classRepository.findAll();

            if (!students.isEmpty() && !classes.isEmpty()) {
                for (int i = 0; i < Math.min(students.size(), 3); i++) {
                    for (int j = 0; j < Math.min(classes.size(), 2); j++) {
                        Enrollment enrollment = Enrollment.builder()
                                .studentId(students.get(i).getId())
                                .classId(classes.get(j).getId())
                                .enrollmentDate(LocalDate.now().minusDays(30))
                                .status("ACTIVE")
                                .build();

                        if (!enrollmentRepository.existsByStudentIdAndClassId(enrollment.getStudentId(), enrollment.getClassId())) {
                            enrollmentRepository.save(enrollment);
                        }
                    }
                }
            }
        }
    }
}
