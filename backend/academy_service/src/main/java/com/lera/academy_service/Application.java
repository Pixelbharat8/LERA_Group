package com.lera.academy_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

// Scan the whole `com.lera` tree, not just `com.lera.academy_service`: a set of newer
// controllers/entities/repositories (UserActivity, FormConfiguration, ClassSwitchHistory)
// live under `com.lera.academy.*` and were otherwise never loaded — their endpoints 500'd.
@SpringBootApplication(scanBasePackages = "com.lera")
@EntityScan(basePackages = "com.lera")
@EnableJpaRepositories(basePackages = "com.lera")
@EnableScheduling
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
