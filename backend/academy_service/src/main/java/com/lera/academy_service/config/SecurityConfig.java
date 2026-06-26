package com.lera.academy_service.config;

import com.lera.academy_service.security.InternalApiKeyAuthFilter;
import com.lera.academy_service.security.JwtAuthenticationFilter;
import com.lera.academy_service.security.PermissionGateFilter;

import java.util.Arrays;
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpMethod;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final InternalApiKeyAuthFilter internalApiKeyAuthFilter;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final PermissionGateFilter permissionGateFilter;
    private final Environment environment;

    public SecurityConfig(
            InternalApiKeyAuthFilter internalApiKeyAuthFilter,
            JwtAuthenticationFilter jwtAuthenticationFilter,
            PermissionGateFilter permissionGateFilter,
            Environment environment) {
        this.internalApiKeyAuthFilter = internalApiKeyAuthFilter;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.permissionGateFilter = permissionGateFilter;
        this.environment = environment;
    }

    private boolean isProdProfile() {
        for (String p : environment.getActiveProfiles()) {
            // Treat docker/staging as production-hardened too: deployment runs with
            // SPRING_PROFILES_ACTIVE=docker, so swagger must be locked down there, not
            // only under the literal "prod" profile (which is never active in deployment).
            if ("prod".equalsIgnoreCase(p) || "docker".equalsIgnoreCase(p) || "staging".equalsIgnoreCase(p)) {
                return true;
            }
        }
        return false;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        boolean prod = isProdProfile();
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> {
                auth.requestMatchers("/actuator/health", "/actuator/info").permitAll();
                auth.requestMatchers("/actuator/**").authenticated();
                if (prod) {
                    auth.requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").authenticated();
                } else {
                    auth.requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll();
                }
                auth.requestMatchers(HttpMethod.GET, "/api/testimonials/public").permitAll();
                auth.requestMatchers(HttpMethod.GET, "/api/testimonials/published").permitAll();
                auth.requestMatchers(HttpMethod.GET, "/api/testimonials/featured").permitAll();
                auth.requestMatchers(HttpMethod.GET, "/api/courses/active").permitAll();
                auth.requestMatchers(HttpMethod.GET, "/api/courses/featured").permitAll();
                auth.requestMatchers(HttpMethod.GET, "/api/programs/active").permitAll();
                auth.requestMatchers(HttpMethod.GET, "/api/programs/featured").permitAll();
                // Public marketing content: published/active-only variants (the admin
                // base paths that include drafts stay authenticated).
                auth.requestMatchers(HttpMethod.GET, "/api/blog/published").permitAll();
                auth.requestMatchers(HttpMethod.GET, "/api/blog/featured").permitAll();
                auth.requestMatchers(HttpMethod.GET, "/api/blog/slug/*").permitAll();
                auth.requestMatchers(HttpMethod.GET, "/api/blog/category/*").permitAll();
                auth.requestMatchers(HttpMethod.GET, "/api/faqs/public").permitAll();
                auth.requestMatchers(HttpMethod.GET, "/api/faqs/page/*").permitAll();
                auth.requestMatchers(HttpMethod.GET, "/api/leadership-members/public").permitAll();
                auth.requestMatchers(HttpMethod.GET, "/api/teachers/public").permitAll();
                auth.requestMatchers(HttpMethod.GET, "/api/courses/code/*").permitAll();
                // Public website CMS slices (single path segment — not GET /map which lists all keys)
                auth.requestMatchers(HttpMethod.GET, "/api/cms-settings/map/*").permitAll();
                auth.requestMatchers(HttpMethod.GET, "/api/cms-settings/value/*").permitAll();
                auth.requestMatchers(HttpMethod.GET, "/uploads/**").permitAll();
                auth.requestMatchers("/api/internal/**").hasAuthority("ROLE_INTERNAL_SERVICE");
                auth.anyRequest().authenticated();
            })
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"success\":false,\"message\":\"Authentication required\"}");
                })
            )
            .addFilterBefore(internalApiKeyAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterAfter(permissionGateFilter, JwtAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of(
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3001",
            "http://localhost:3002",
            "http://127.0.0.1:3002",
            "capacitor://localhost",
            "ionic://localhost",
            "https://*.leraacademy.edu.vn"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With", "X-User-Id"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
