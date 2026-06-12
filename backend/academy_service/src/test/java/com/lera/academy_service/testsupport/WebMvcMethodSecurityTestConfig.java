package com.lera.academy_service.testsupport;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Lets {@code @WebMvcTest} exercise {@code @PreAuthorize} without the full
 * production {@code SecurityConfig} (JWT filter, CORS, etc.).
 */
@TestConfiguration
@EnableWebSecurity
@EnableMethodSecurity
public class WebMvcMethodSecurityTestConfig {

    @Bean
    SecurityFilterChain testChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable());
        http.authorizeHttpRequests(a -> a.anyRequest().permitAll());
        return http.build();
    }
}
