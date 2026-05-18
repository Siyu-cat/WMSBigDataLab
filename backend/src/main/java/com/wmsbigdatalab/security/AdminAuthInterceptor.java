package com.wmsbigdatalab.security;

import com.wmsbigdatalab.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AdminAuthInterceptor implements HandlerInterceptor {

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if ("OPTIONS".equals(request.getMethod())) {
            return true;
        }

        String path = request.getRequestURI();
        String method = request.getMethod();

        if (path.startsWith("/api/admin/login") || path.startsWith("/api/admin/register") || path.startsWith("/api/media/uploads")) {
            return true;
        }

        if (path.startsWith("/api/category/tree") || path.startsWith("/api/category/list")) {
            return true;
        }

        if (path.equals("/api/entry/page") || path.equals("/api/entry/search") ||
                path.equals("/api/entry/hot")) {
            return true;
        }

        if (path.matches("/api/entry/\\d+") && "GET".equals(method)) {
            return true;
        }

        if (path.startsWith("/api/annotation/list/") && "GET".equals(method)) {
            return true;
        }

        if (path.startsWith("/api/version/list/") && "GET".equals(method)) {
            return true;
        }

        String token = request.getHeader("Authorization");
        if (token == null || token.isEmpty()) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"code\":401,\"message\":\"未登录\"}");
            return false;
        }

        try {
            token = token.replace("Bearer ", "");
            if (jwtUtil.isTokenExpired(token)) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"code\":401,\"message\":\"Token已过期\"}");
                return false;
            }
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"code\":401,\"message\":\"Token无效\"}");
            return false;
        }

        return true;
    }
}