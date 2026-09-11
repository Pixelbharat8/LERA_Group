# LERA Academy Service - Dockerfile v11
FROM maven:3.9.12-eclipse-temurin-25 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -DskipTests package

FROM eclipse-temurin:25-jdk-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
# Healthcheck client (curl) + non-root user (uid 1001)
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r app && useradd -r -g app -u 1001 app && chown -R app:app /app \
    # LERA_UPLOAD_DIR (/var/lera/uploads) is a named volume in docker-compose. Docker seeds an
    # EMPTY named volume from the image path, ownership included — but only if the path exists
    # in the image. Without this the mountpoint is created root-owned, and LocalFileStorage's
    # @PostConstruct Files.createDirectories() fails as uid 1001 with AccessDeniedException,
    # so the service never starts. Sub-dirs match LocalFileStorage.init().
    && mkdir -p /var/lera/uploads/images /var/lera/uploads/documents /var/lera/uploads/temp \
    && chown -R app:app /var/lera
USER app
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]
