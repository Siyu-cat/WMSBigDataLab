package com.wmsbigdatalab.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.concurrent.TimeUnit;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private final RedisTemplate<String, Object> redisTemplate;

    @Value("${wiki.rate-limit.tokens-per-second:10}")
    private int tokensPerSecond;

    @Value("${wiki.rate-limit.bucket-size:20}")
    private int bucketSize;

    public RateLimitInterceptor(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if ("OPTIONS".equals(request.getMethod())) {
            return true;
        }

        try {
            String clientIp = getClientIp(request);
            String key = "rate_limit:" + clientIp;

            Integer currentTokens = (Integer) redisTemplate.opsForValue().get(key);

            if (currentTokens == null) {
                currentTokens = bucketSize;
                redisTemplate.opsForValue().set(key, currentTokens, 1, TimeUnit.SECONDS);
            }

            if (currentTokens > 0) {
                redisTemplate.opsForValue().set(key, currentTokens - 1, 1, TimeUnit.SECONDS);
                return true;
            }

            response.setStatus(429);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"code\":429,\"message\":\"请求过于频繁，请稍后再试\"}");
            return false;
        } catch (Exception e) {
            return true;
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}