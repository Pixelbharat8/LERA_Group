package com.lera.academy_service.config;

import com.lera.academy_service.entity.CourseProgram;
import com.lera.academy_service.entity.Testimonial;
import com.lera.academy_service.repository.CourseProgramRepository;
import com.lera.academy_service.repository.TestimonialRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataLoader implements CommandLineRunner {

    private final CourseProgramRepository courseProgramRepository;
    private final TestimonialRepository testimonialRepository;

    @Override
    public void run(String... args) {
        initCourses();
        initTestimonials();
    }

    private void initCourses() {
        if (courseProgramRepository.count() == 0) {
            log.info("Initializing sample courses...");
            
            CourseProgram starters = CourseProgram.builder()
                    .code("lera-starters")
                    .name("LERA Starters")
                    .nameVi("LERA Starters")
                    .description("Fun and interactive English for toddlers")
                    .descriptionVi("Tiếng Anh vui nhộn và tương tác cho trẻ nhỏ")
                    .ageFrom(2)
                    .ageTo(4)
                    .category("kids")
                    .level("beginner")
                    .price(new BigDecimal("2500000"))
                    .imageUrl("https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=300&fit=crop")
                    .color("#ec4899")
                    .isFeatured(true)
                    .isActive(true)
                    .displayOrder(1)
                    .build();
            courseProgramRepository.save(starters);

            CourseProgram explorers = CourseProgram.builder()
                    .code("lera-explorers")
                    .name("LERA Explorers")
                    .nameVi("LERA Explorers")
                    .description("Building confidence through exploration")
                    .descriptionVi("Xây dựng sự tự tin thông qua khám phá")
                    .ageFrom(5)
                    .ageTo(6)
                    .category("kids")
                    .level("beginner")
                    .price(new BigDecimal("2800000"))
                    .imageUrl("https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=400&h=300&fit=crop")
                    .color("#3b82f6")
                    .isFeatured(true)
                    .isActive(true)
                    .displayOrder(2)
                    .build();
            courseProgramRepository.save(explorers);

            CourseProgram primary = CourseProgram.builder()
                    .code("lera-primary")
                    .name("LERA Primary")
                    .nameVi("LERA Primary")
                    .description("Strong foundation for primary school students")
                    .descriptionVi("Nền tảng vững chắc cho học sinh tiểu học")
                    .ageFrom(7)
                    .ageTo(10)
                    .category("kids")
                    .level("elementary")
                    .price(new BigDecimal("3000000"))
                    .imageUrl("https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&h=300&fit=crop")
                    .color("#22c55e")
                    .isFeatured(true)
                    .isActive(true)
                    .displayOrder(3)
                    .build();
            courseProgramRepository.save(primary);

            CourseProgram teens = CourseProgram.builder()
                    .code("lera-teens")
                    .name("LERA Teens")
                    .nameVi("LERA Teens")
                    .description("Academic English for teenagers")
                    .descriptionVi("Tiếng Anh học thuật cho thiếu niên")
                    .ageFrom(11)
                    .ageTo(14)
                    .category("teens")
                    .level("intermediate")
                    .price(new BigDecimal("3500000"))
                    .imageUrl("https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=400&h=300&fit=crop")
                    .color("#a855f7")
                    .isFeatured(true)
                    .isActive(true)
                    .displayOrder(4)
                    .build();
            courseProgramRepository.save(teens);

            CourseProgram ielts = CourseProgram.builder()
                    .code("ielts-sat")
                    .name("IELTS & SAT")
                    .nameVi("IELTS & SAT")
                    .description("Test preparation for higher education")
                    .descriptionVi("Luyện thi cho giáo dục đại học")
                    .ageFrom(15)
                    .ageTo(18)
                    .category("adults")
                    .level("advanced")
                    .price(new BigDecimal("5000000"))
                    .imageUrl("https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop")
                    .color("#4f46e5")
                    .isFeatured(true)
                    .isActive(true)
                    .displayOrder(5)
                    .build();
            courseProgramRepository.save(ielts);

            CourseProgram business = CourseProgram.builder()
                    .code("business-english")
                    .name("Business English")
                    .nameVi("Tiếng Anh Thương Mại")
                    .description("Professional English for the workplace")
                    .descriptionVi("Tiếng Anh chuyên nghiệp cho môi trường làm việc")
                    .ageFrom(18)
                    .ageTo(50)
                    .category("adults")
                    .level("intermediate")
                    .price(new BigDecimal("6000000"))
                    .imageUrl("https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop")
                    .color("#7c3aed")
                    .isFeatured(false)
                    .isActive(true)
                    .displayOrder(6)
                    .build();
            courseProgramRepository.save(business);

            log.info("Sample courses initialized successfully!");
        }
    }

    private void initTestimonials() {
        if (testimonialRepository.count() == 0) {
            log.info("Initializing sample testimonials...");
            
            Testimonial t1 = new Testimonial();
            t1.setParentName("Nguyễn Minh Anh");
            t1.setParentNameVi("Nguyễn Minh Anh");
            t1.setStudentName("Bảo Ngọc");
            t1.setStudentAge(8);
            t1.setRating(5);
            t1.setContent("My child has improved tremendously after joining LERA. The Cambridge teaching methodology is excellent!");
            t1.setContentVi("Con tôi đã tiến bộ vượt bậc sau khi tham gia LERA. Phương pháp giảng dạy Cambridge thật tuyệt vời!");
            t1.setAvatarUrl("https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop");
            t1.setIsFeatured(true);
            t1.setIsPublished(true);
            t1.setDisplayOrder(1);
            testimonialRepository.save(t1);

            Testimonial t2 = new Testimonial();
            t2.setParentName("Trần Văn Hùng");
            t2.setParentNameVi("Trần Văn Hùng");
            t2.setStudentName("Minh Khang");
            t2.setStudentAge(12);
            t2.setRating(5);
            t2.setContent("The teachers are highly professional and caring. My son looks forward to every class!");
            t2.setContentVi("Các giáo viên rất chuyên nghiệp và tận tâm. Con trai tôi háo hức đến mỗi buổi học!");
            t2.setAvatarUrl("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop");
            t2.setIsFeatured(true);
            t2.setIsPublished(true);
            t2.setDisplayOrder(2);
            testimonialRepository.save(t2);

            Testimonial t3 = new Testimonial();
            t3.setParentName("Lê Thị Hương");
            t3.setParentNameVi("Lê Thị Hương");
            t3.setStudentName("Gia Hân");
            t3.setStudentAge(6);
            t3.setRating(5);
            t3.setContent("LERA's interactive learning approach has made my daughter love English. Highly recommended!");
            t3.setContentVi("Phương pháp học tương tác của LERA khiến con gái tôi yêu thích tiếng Anh. Rất đáng khuyến khích!");
            t3.setAvatarUrl("https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop");
            t3.setIsFeatured(true);
            t3.setIsPublished(true);
            t3.setDisplayOrder(3);
            testimonialRepository.save(t3);

            log.info("Sample testimonials initialized successfully!");
        }
    }
}
