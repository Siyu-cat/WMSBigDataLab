# ---- 阶段1：Node 构建百科静态资源 ----
FROM node:22-alpine AS build
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
# tsc -b && vite build（.env 中 VITE_API_BASE_URL=/api 需要随源码一起拷入）
RUN npm run build

# ---- 阶段2：Node 构建主页静态资源 ----
FROM node:22-alpine AS build-homepage
WORKDIR /build
COPY homepage/package.json homepage/package-lock.json ./
RUN npm ci
COPY homepage/ .
RUN npm run build

# ---- 阶段3：nginx 托管两个站点 + 反代配置 ----
FROM nginx:alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
# 主页挂根路径
COPY --from=build-homepage /build/dist /usr/share/nginx/html
# 百科站点挂到 /bigdatalab 子路径
COPY --from=build /build/dist /usr/share/nginx/html/bigdatalab
EXPOSE 80
