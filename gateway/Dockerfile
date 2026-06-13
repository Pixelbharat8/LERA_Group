# Unprivileged nginx — runs as uid 101 (non-root) and listens on 8080 by default.
# Pinned (not :latest) for reproducible, scannable builds.
FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY nginx/nginx.conf /etc/nginx/nginx.conf
EXPOSE 8080
