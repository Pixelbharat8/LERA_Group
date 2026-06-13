package com.lera.academy_service.config;

import com.lera.academy_service.storage.LocalFileStorage;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Serves {@code GET /uploads/**} from the local upload directory when {@code lera.storage.backend=local}.
 * S3 mode returns absolute URLs — no local handler needed.
 */
@Configuration
@ConditionalOnBean(LocalFileStorage.class)
public class LocalUploadResourceConfig implements WebMvcConfigurer {

    private final LocalFileStorage localFileStorage;

    public LocalUploadResourceConfig(LocalFileStorage localFileStorage) {
        this.localFileStorage = localFileStorage;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String location = localFileStorage.rootPath().toUri().toString();
        if (!location.endsWith("/")) {
            location = location + "/";
        }
        registry.addResourceHandler("/uploads/**").addResourceLocations(location);
    }
}
