package com.wmsbigdatalab.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.wmsbigdatalab.common.Result;
import com.wmsbigdatalab.entity.Admin;
import com.wmsbigdatalab.service.AdminService;
import com.wmsbigdatalab.util.JwtUtil;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;
    private final JwtUtil jwtUtil;

    public AdminController(AdminService adminService, JwtUtil jwtUtil) {
        this.adminService = adminService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/login")
    public Result<Map<String, String>> login(@RequestBody Map<String, String> loginData, HttpServletResponse response) {
        try {
            String username = loginData.get("username");
            String password = loginData.get("password");

            if (username == null || password == null) {
                return Result.error(400, "用户名或密码不能为空");
            }

            Admin admin = adminService.login(username, password);
            if (admin == null) {
                return Result.error(401, "用户名或密码错误");
            }

            String token = jwtUtil.generateToken(admin.getId(), admin.getUsername());

            Map<String, String> result = new HashMap<>();
            result.put("token", token);
            result.put("username", admin.getUsername());

            response.setHeader("X-CSRF-Token", jwtUtil.generateToken(admin.getId(), admin.getUsername() + "-csrf"));

            return Result.success(result);
        } catch (Exception e) {
            e.printStackTrace();
            return Result.error(500, "登录失败: " + e.getMessage());
        }
    }

    @GetMapping("/info")
    public Result<Admin> getAdminInfo(@RequestHeader("Authorization") String token) {
        try {
            String username = jwtUtil.getUsername(token.replace("Bearer ", ""));
            Admin admin = adminService.getOne(new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Admin>()
                    .eq(Admin::getUsername, username));
            admin.setPassword(null);
            return Result.success(admin);
        } catch (Exception e) {
            return Result.error(401, "未登录");
        }
    }

    @PostMapping("/refresh-token")
    public Result<Map<String, String>> refreshToken(@RequestHeader("Authorization") String token) {
        try {
            Long adminId = jwtUtil.getAdminId(token.replace("Bearer ", ""));
            Admin admin = adminService.getById(adminId);
            if (admin == null) {
                return Result.error(401, "用户不存在");
            }

            String newToken = jwtUtil.generateToken(admin.getId(), admin.getUsername());
            Map<String, String> result = new HashMap<>();
            result.put("token", newToken);

            return Result.success(result);
        } catch (Exception e) {
            return Result.error(401, "Token无效");
        }
    }
}