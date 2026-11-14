# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# NEXT_PUBLIC_* são gravadas no build: mudou o valor, rebuild da imagem.
ARG NEXT_PUBLIC_BASE_PATH=""
ARG NEXT_PUBLIC_API_URL="/condominio/gateway/morador"
ARG NEXT_PUBLIC_FINANCEIRO_API_URL="/condominio/gateway/financeiro"
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_FINANCEIRO_API_URL=$NEXT_PUBLIC_FINANCEIRO_API_URL \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- runtime ----
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=7520 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --chown=node:node servidor.js ./servidor.js
USER node
EXPOSE 7520
CMD ["node", "servidor.js"]
