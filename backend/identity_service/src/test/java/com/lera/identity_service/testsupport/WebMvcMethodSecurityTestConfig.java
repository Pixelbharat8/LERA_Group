package com.lera.identity_service.testsupport;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Lets {@code @WebMvcTest} exercise {@code @PreAuthorize} without the full production
 * SecurityConfig (JWT filter, CORS, etc.). Every request is permitted at the URL layer,
 * so only the method-level @PreAuthorize annotations decide access — exactly what the
 * authorization regression tests need to assert.
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
     * JdbcTemplate. The filter is designed to FAIL OPEN when its permission lookup throws, so a
     * mock that throws on every call turns the filter into a pass-through — leaving the method-level
     * @PreAuthorize annotations as the sole access decider, which is exactly what these tests assert.
     */
    @Bean
    org.springframework.jdbc.core.JdbcTemplate jdbcTemplate() throws java.sql.SQLException {
        javax.sql.DataSource ds = org.mockito.Mockito.mock(javax.sql.DataSource.class);
        org.mockito.Mockito.when(ds.getConnection())
                .thenThrow(new java.sql.SQLException("no DB in @WebMvcTest slice"));
        return new org.springframework.jdbc.core.JdbcTemplate(ds);
    }
}
