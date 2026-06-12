package com.lera.academy_service.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI leraAcademyOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("LERA Academy - Academy Service API")
                .description("API documentation for LERA Academy Service. " +
                    "This service handles students, teachers, classes, courses, exams, assignments, and academic operations.")
                .version("1.0.0")
                .contact(new Contact()
                    .name("LERA Academy")
                    .email("support@leraacademy.edu.vn")
                    .url("https://leraacademy.edu.vn"))
                .license(new License()
                    .name("Proprietary")
                    .url("https://leraacademy.edu.vn/license")))
            .servers(List.of(
                new Server().url("http://localhost:8082").description("Local Development"),
                new Server().url("https://api.leraacademy.edu.vn").description("Production")
            ))
            .components(new Components()
                .addSecuritySchemes("bearerAuth", new SecurityScheme()
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")
                    .description("JWT Authorization header using the Bearer scheme.")))
            .addSecurityItem(new SecurityRequirement().addList("bearerAuth"));
    }
}
