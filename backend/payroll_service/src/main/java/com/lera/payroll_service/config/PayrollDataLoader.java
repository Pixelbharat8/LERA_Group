package com.lera.payroll_service.config;

import com.lera.payroll_service.repository.PayrollRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class PayrollDataLoader implements CommandLineRunner {

    private final PayrollRepository payrollRepository;

    public PayrollDataLoader(PayrollRepository payrollRepository) {
        this.payrollRepository = payrollRepository;
    }

    @Override
    public void run(String... args) {
        // Disabled: inserting sample payroll rows can violate FK constraints (payroll.teacher_id -> teachers.id)
        // depending on the state of the local database. Keep startup safe.
        // If you want demo data, seed teachers first and then implement FK-safe seeding.
        if (payrollRepository.count() == 0) {
            // no-op
        }
    }
}
