# LERA Social Media Service - Dockerfile v11
FROM maven:3.9.15-eclipse-temurin-26 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -DskipTests package

FROM eclipse-temurin:17-jdk-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
# Healthcheck client (curl) + non-root user (uid 1001)
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r app && useradd -r -g app -u 1001 app && chown -R app:app /app
USER app
EXPOSE 8089
ENTRYPOINT ["java", "-jar", "app.jar"]
