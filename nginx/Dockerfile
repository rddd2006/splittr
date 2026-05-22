# ── Development ──────────────────────────────────────────────
FROM nginx:1.25-alpine AS development
COPY nginx.dev.conf /etc/nginx/nginx.conf
COPY errors/ /etc/nginx/errors/
EXPOSE 80

# ── Production ────────────────────────────────────────────────
FROM nginx:1.25-alpine AS production

# Create cache directory
RUN mkdir -p /var/cache/nginx/api \
    && chown -R nginx:nginx /var/cache/nginx

COPY nginx.prod.conf /etc/nginx/nginx.conf
COPY errors/ /etc/nginx/errors/

# Copy built frontend assets (injected at build time via multi-stage or volume)
# COPY --from=frontend-builder /app/dist /usr/share/nginx/html

EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
