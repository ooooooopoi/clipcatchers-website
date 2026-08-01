FROM node:20-alpine

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npx prisma generate && npx next build

# Uploads live on a Railway volume mounted at /data
RUN mkdir -p /data/uploads
ENV UPLOAD_DIR=/data/uploads

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npx next start -p ${PORT:-3000}"]
