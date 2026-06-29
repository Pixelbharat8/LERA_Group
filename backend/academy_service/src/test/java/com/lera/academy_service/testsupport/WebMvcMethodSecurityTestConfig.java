package com.lera.academy_service.testsupport;

import jakarta.persistence.EntityManagerFactory;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.transaction.PlatformTransactionManager;

import javax.sql.DataSource;
import java.util.Properties;

/**
 * Lets {@code @WebMvcTest} exercise {@code @PreAuthorize} without the full production
 * SecurityConfig (JWT filter, CORS, etc.). Every request is permitted at the URL layer,
 * so only the method-level @PreAuthorize annotations decide access — exactly what the
 * authorization regression tests need to assert.
 *
 * It also stands up a minimal JPA layer: the Application declares a multi-package
 * {@code @EnableJpaRepositories}, so the web slice still instantiates every repository and
 * needs a real EntityManagerFactory. We back it with in-memory H2 and {@code hbm2ddl=none}
 * — the repositories construct from the metamodel, but no schema is created (so Postgres-only
 * types like jsonb never reach H2). The controllers' repositories are @MockBean-ed, so no
 * real query ever runs against this EMF.
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

    @Bean
    DataSource dataSource() {
        return DataSourceBuilder.create()
                .driverClassName("org.h2.Driver")
                .url("jdbc:h2:mem:academy-slice;DB_CLOSE_DELAY=-1")
                .username("sa")
                .password("")
                .build();
    }

    @Bean
    LocalContainerEntityManagerFactoryBean entityManagerFactory(DataSource dataSource) {
        LocalContainerEntityManagerFactoryBean emf = new LocalContainerEntityManagerFactoryBean();
        emf.setDataSource(dataSource);
        emf.setPackagesToScan("com.lera");
        emf.setJpaVendorAdapter(new HibernateJpaVendorAdapter());
        Properties props = new Properties();
        props.put("hibernate.hbm2ddl.auto", "none");
        props.put("hibernate.dialect", "org.hibernate.dialect.H2Dialect");
        emf.setJpaProperties(props);
        return emf;
    }

    @Bean
    PlatformTransactionManager transactionManager(EntityManagerFactory emf) {
        return new JpaTransactionManager(emf);
    }

    /**
     * PermissionGateFilter needs a JdbcTemplate (@WebMvcTest excludes JdbcTemplateAutoConfiguration).
     * Backed by the same H2 DataSource; its role_permissions lookup throws on the empty schema, and
     * the filter is fail-open, so it becomes a pass-through and @PreAuthorize stays the sole decider.
     */
    @Bean
    org.springframework.jdbc.core.JdbcTemplate jdbcTemplate(DataSource dataSource) {
        return new org.springframework.jdbc.core.JdbcTemplate(dataSource);
    }
}
