FROM node:20-alpine

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

COPY package.json package-lock.json* ./
# --include=dev: the build needs next/prisma/typescript even when the builder
# sets NODE_ENV=production, which would otherwise skip devDependencies.
RUN npm ci --include=dev --legacy-peer-deps

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npx prisma generate && npx next build

ENV NODE_ENV=production

# Uploads live on a Railway volume mounted at /data
RUN mkdir -p /data/uploads
ENV UPLOAD_DIR=/data/uploads

EXPOSE 3000

# The web server starts immediately and migrations run alongside it. Running
# them first meant an unreachable database could stall boot past the platform's
# healthcheck window, failing the deploy with nothing serving to diagnose from.
# -H 0.0.0.0 so the container is reachable from outside, not just localhost.
CMD ["sh", "-c", "( npx prisma migrate deploy && echo '[migrate] applied' || echo '[migrate] FAILED — check DATABASE_URL' ) & echo \"[boot] starting on port ${PORT:-3000}\"; exec npx next start -H 0.0.0.0 -p ${PORT:-3000}"]
