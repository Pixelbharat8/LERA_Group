package com.lera.payroll_service.testsupport;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Lets {@code @WebMvcTest} exercise {@code @PreAuthorize} without the production
 * SecurityConfig. URL layer permits all; only the method/class @PreAuthorize decides.
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

    /**
     * PermissionGateFilter (a @Component OncePerRequestFilter pulled into @WebMvcTest) requires a
     * JdbcTemplate. The filter FAILS OPEN when its permission lookup throws, so a JdbcTemplate over
     * a DataSource that refuses connections turns the filter into a pass-through — leaving the
     * method-level @PreAuthorize annotations as the sole access decider, which these tests assert.
     */
    @Bean
    org.springframework.jdbc.core.JdbcTemplate jdbcTemplate() throws java.sql.SQLException {
        javax.sql.DataSource ds = org.mockito.Mockito.mock(javax.sql.DataSource.class);
        org.mockito.Mockito.when(ds.getConnection())
                .thenThrow(new java.sql.SQLException("no DB in @WebMvcTest slice"));
        return new org.springframework.jdbc.core.JdbcTemplate(ds);
    }
}
