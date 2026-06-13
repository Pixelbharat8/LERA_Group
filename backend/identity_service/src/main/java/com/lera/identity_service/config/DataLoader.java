package com.lera.identity_service.config;

import com.lera.identity_service.entity.Role;
import com.lera.identity_service.entity.User;
import com.lera.identity_service.repository.RoleRepository;
import com.lera.identity_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.util.Base64;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataLoader implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${lera.seed.admin-password:}")
    private String adminSeedPassword;

    @Value("${lera.seed.chairman-password:}")
    private String chairmanSeedPassword;

    @Value("${lera.seed.ceo-password:}")
    private String ceoSeedPassword;

    private static final SecureRandom RANDOM = new SecureRandom();

    @Override
    public void run(String... args) {
        createDefaultRoles();
        createAdminUser();
        createChairmanAndCEO();
    }

    /**
     * Resolve a seed password from configuration, or generate a strong random one
     * and log it ONCE for first-boot bootstrap. Never falls back to a hardcoded
     * default, so no known credentials ship in source.
     */
    private String resolveSeedPassword(String configured, String accountLabel) {
        if (StringUtils.hasText(configured)) {
            return configured;
        }
        byte[] bytes = new byte[18];
        RANDOM.nextBytes(bytes);
        String generated = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        log.warn("No seed password configured for {} — generated a random one. "
                + "Set it via the corresponding lera.seed.* property/env to control it. "
                + "Generated password (shown once): {}", accountLabel, generated);
        return generated;
    }

    private void createDefaultRoles() {
        if (roleRepository.findByName("SUPER_ADMIN").isEmpty()) {
            Role superAdmin = Role.builder()
                    .name("SUPER_ADMIN")
                    .displayName("Super Administrator")
                    .description("Full system access")
                    .level(100)
                    .isSystemRole(true)
                    .build();
            roleRepository.save(superAdmin);
            log.info("Created SUPER_ADMIN role");
        }

        if (roleRepository.findByName("ADMIN").isEmpty()) {
            Role admin = Role.builder()
                    .name("ADMIN")
                    .displayName("Administrator")
                    .description("Administrative access")
                    .level(90)
                    .isSystemRole(true)
                    .build();
            roleRepository.save(admin);
            log.info("Created ADMIN role");
        }

        if (roleRepository.findByName("TEACHER").isEmpty()) {
            Role teacher = Role.builder()
                    .name("TEACHER")
                    .displayName("Teacher")
                    .description("Teacher access")
                    .level(50)
                    .isSystemRole(true)
                    .build();
            roleRepository.save(teacher);
            log.info("Created TEACHER role");
        }

        if (roleRepository.findByName("STUDENT").isEmpty()) {
            Role student = Role.builder()
                    .name("STUDENT")
                    .displayName("Student")
                    .description("Student access")
                    .level(10)
                    .isSystemRole(true)
                    .build();
            roleRepository.save(student);
            log.info("Created STUDENT role");
        }

        if (roleRepository.findByName("PARENT").isEmpty()) {
            Role parent = Role.builder()
                    .name("PARENT")
                    .displayName("Parent")
                    .description("Parent access")
                    .level(10)
                    .isSystemRole(true)
                    .build();
            roleRepository.save(parent);
            log.info("Created PARENT role");
        }

        // Add CHAIRMAN role
        if (roleRepository.findByName("CHAIRMAN").isEmpty()) {
            Role chairman = Role.builder()
                    .name("CHAIRMAN")
                    .displayName("Chairman")
                    .description("Board Chairman - highest authority")
                    .level(100)
                    .isSystemRole(true)
                    .build();
            roleRepository.save(chairman);
            log.info("Created CHAIRMAN role");
        }

        // Add CEO role
        if (roleRepository.findByName("CEO").isEmpty()) {
            Role ceo = Role.builder()
                    .name("CEO")
                    .displayName("CEO")
                    .description("Chief Executive Officer")
                    .level(95)
                    .isSystemRole(true)
                    .build();
            roleRepository.save(ceo);
            log.info("Created CEO role");
        }

        // Add DIRECTOR role
        if (roleRepository.findByName("DIRECTOR").isEmpty()) {
            Role director = Role.builder()
                    .name("DIRECTOR")
                    .displayName("Director")
                    .description("Director level access")
                    .level(85)
                    .isSystemRole(true)
                    .build();
            roleRepository.save(director);
            log.info("Created DIRECTOR role");
        }

        // Add CENTER_MANAGER role
        if (roleRepository.findByName("CENTER_MANAGER").isEmpty()) {
            Role centerManager = Role.builder()
                    .name("CENTER_MANAGER")
                    .displayName("Center Manager")
                    .description("Center Manager access")
                    .level(70)
                    .isSystemRole(true)
                    .build();
            roleRepository.save(centerManager);
            log.info("Created CENTER_MANAGER role");
        }

        // Add CENTER_ADMIN role
        if (roleRepository.findByName("CENTER_ADMIN").isEmpty()) {
            Role centerAdmin = Role.builder()
                    .name("CENTER_ADMIN")
                    .displayName("Center Admin")
                    .description("Center Administrator - manages a single center")
                    .level(75)
                    .isSystemRole(true)
                    .build();
            roleRepository.save(centerAdmin);
            log.info("Created CENTER_ADMIN role");
        }

        // Add STAFF role
        if (roleRepository.findByName("STAFF").isEmpty()) {
            Role staff = Role.builder()
                    .name("STAFF")
                    .displayName("Staff")
                    .description("Staff member access")
                    .level(40)
                    .isSystemRole(true)
                    .build();
            roleRepository.save(staff);
            log.info("Created STAFF role");
        }

        // Add TEACHING_ASSISTANT role
        if (roleRepository.findByName("TEACHING_ASSISTANT").isEmpty()) {
            Role ta = Role.builder()
                    .name("TEACHING_ASSISTANT")
                    .displayName("Teaching Assistant")
                    .description("Teaching Assistant - assists teachers in classes")
                    .level(35)
                    .isSystemRole(true)
                    .build();
            roleRepository.save(ta);
            log.info("Created TEACHING_ASSISTANT role");
        }

        // Add ACADEMIC_MANAGER role
        if (roleRepository.findByName("ACADEMIC_MANAGER").isEmpty()) {
            Role academicManager = Role.builder()
                    .name("ACADEMIC_MANAGER")
                    .displayName("Academic Manager")
                    .description("Academic Manager - manages curriculum, classes, and teachers")
                    .level(65)
                    .isSystemRole(true)
                    .build();
            roleRepository.save(academicManager);
            log.info("Created ACADEMIC_MANAGER role");
        }
    }

    private void createAdminUser() {
        if (userRepository.findByEmail("admin@lera.com").isEmpty()) {
            Role superAdminRole = roleRepository.findByName("SUPER_ADMIN").orElse(null);
            
            User admin = User.builder()
                    .email("admin@lera.com")
                    .passwordHash(passwordEncoder.encode(resolveSeedPassword(adminSeedPassword, "admin@lera.com")))
                    .fullname("Super Administrator")
                    .fullnameVi("Quản trị viên cao cấp")
                    .phone("+84901234567")
                    .roleId(superAdminRole != null ? superAdminRole.getId() : null)
                    .status("ACTIVE")
                    .emailVerified(true)
                    .build();
            
            userRepository.save(admin);
            log.info("Created admin user: admin@lera.com");
        } else {
            log.info("Admin user already exists");
        }
    }

    private void createChairmanAndCEO() {
        // Create Chairman user
        if (userRepository.findByEmail("Chairman@Leraacademy.edu.vn").isEmpty()) {
            Role chairmanRole = roleRepository.findByName("CHAIRMAN").orElse(null);
            
            User chairman = User.builder()
                    .email("Chairman@Leraacademy.edu.vn")
                    .passwordHash(passwordEncoder.encode(
                            resolveSeedPassword(chairmanSeedPassword, "Chairman@Leraacademy.edu.vn")))
                    .fullname("Rahul Sharma")
                    .fullnameVi("Rahul Sharma")
                    .phone("+84901234567")
                    .roleId(chairmanRole != null ? chairmanRole.getId() : null)
                    .status("ACTIVE")
                    .emailVerified(true)
                    .build();

            userRepository.save(chairman);
            log.info("Created Chairman user: Chairman@Leraacademy.edu.vn");
        }
        // NOTE: previously this re-set the Chairman password on every startup, which
        // silently reverted any password the user had changed. That behaviour is removed —
        // the seed only ever creates the account when it is absent.

        // Create CEO user
        if (userRepository.findByEmail("CEO@Leraacademy.edu.vn").isEmpty()) {
            Role ceoRole = roleRepository.findByName("CEO").orElse(null);
            
            User ceo = User.builder()
                    .email("CEO@Leraacademy.edu.vn")
                    .passwordHash(passwordEncoder.encode(
                            resolveSeedPassword(ceoSeedPassword, "CEO@Leraacademy.edu.vn")))
                    .fullname("Ledia Balliu")
                    .fullnameVi("Ledia Balliu")
                    .phone("+84901234568")
                    .roleId(ceoRole != null ? ceoRole.getId() : null)
                    .status("ACTIVE")
                    .emailVerified(true)
                    .build();

            userRepository.save(ceo);
            log.info("Created CEO user: CEO@Leraacademy.edu.vn");
        }
        // NOTE: removed the previous startup password reset for the same reason as Chairman above.
    }
}
