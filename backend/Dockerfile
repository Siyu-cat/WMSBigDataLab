# ---- 阶段1：Maven 构建 jar ----
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build
# 国内服务器访问 Maven Central 极慢，走阿里云镜像仓库
COPY deploy/maven-settings.xml /root/.m2/settings.xml
COPY backend/pom.xml .
# 预热依赖缓存（失败不阻断，后续 package 会补齐）
RUN mvn -B -q dependency:go-offline || true
COPY backend/src ./src
RUN mvn -B -q -DskipTests package

# ---- 阶段2：JRE 运行镜像 ----
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /build/target/WMSBigDataLab-1.0.0.jar /app/app.jar
# application.yml 里 wiki.upload.path=./uploads（相对 user.dir=/app）
RUN mkdir -p /app/uploads
EXPOSE 8080
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-jar", "/app/app.jar"]
