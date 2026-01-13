# Dockerfile para SIATEC Angular App
# Multi-stage build: construcción y despliegue

# ==========================================
# Stage 1: Build
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --legacy-peer-deps

COPY . .

# Build de producción
RUN npm run build -- --configuration production

# ==========================================
# Stage 2: Runtime (nginx)
# ==========================================
FROM nginx:alpine

# Argumentos opcionales para build-time
ARG BUILD_DATE
ARG VCS_REF
LABEL org.opencontainers.image.title="siatec-angular-app" \
    org.opencontainers.image.description="SIATEC Angular Frontend" \
    org.opencontainers.image.source="https://github.com/AldoRxz/Siatec-Web-Angular" \
    org.opencontainers.image.revision="$VCS_REF" \
    org.opencontainers.image.created="$BUILD_DATE"

# Variables de entorno para las APIs
ENV DEPLOYMENT_MODE="kubernetes" \
    AUTH_API_BASE_URL="http://dev.192.168.1.223.sslip.io/api/v1/auth" \
    CONTRIBUYENTES_API_BASE_URL="http://dev.192.168.1.223.sslip.io/api/v1/contribuyentes" \
    CONTRIBUCIONES_API_BASE_URL="http://dev.192.168.1.223.sslip.io/api/v1/contribuciones" \
    TESORERIA_API_BASE_URL="http://dev.192.168.1.223.sslip.io/api/v1/tesoreria" \
    NOTIFICACIONES_API_BASE_URL="http://dev.192.168.1.223.sslip.io/api/v1/notificaciones" \
    CAJA_API_BASE_URL="http://dev.192.168.1.223.sslip.io/api/v1/ordenes-pago" \
    CITAS_API_BASE_URL="http://dev.192.168.1.223.sslip.io/api/v1/citas" \
    TZ=UTC

# Copiar configuración nginx y script de arranque
COPY nginx.conf /etc/nginx/nginx.conf
COPY entrypoint.sh /entrypoint.sh

# Asegurar formato Unix (LF) y permisos ejecutables
RUN apk add --no-cache dos2unix && \
    dos2unix /entrypoint.sh && \
    chmod +x /entrypoint.sh && \
    apk del dos2unix

# Copiar archivos compilados desde el stage de build
COPY --from=builder /app/dist/siatec-app/browser /usr/share/nginx/html

# Exponer puerto
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1

# Usar shell para ejecutar el script
ENTRYPOINT ["/bin/sh", "/entrypoint.sh"]
