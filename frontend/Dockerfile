# ---- 阶段1：Node 构建静态资源 ----
FROM node:22-alpine AS build
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
# tsc -b && vite build（.env 中 VITE_API_BASE_URL=/api 需要随源码一起拷入）
RUN npm run build

# ---- 阶段2：nginx 托管 dist + 反代配置 ----
FROM nginx:alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /build/dist /usr/share/nginx/html
EXPOSE 80
