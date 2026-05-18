package com.wmsbigdatalab.service;

import cn.hutool.crypto.digest.DigestUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.wmsbigdatalab.entity.Admin;
import com.wmsbigdatalab.mapper.AdminMapper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminService extends ServiceImpl<AdminMapper, Admin> {

    public Admin login(String username, String password) {
        String encryptedPassword = DigestUtil.sha256Hex(password);
        return getOne(new LambdaQueryWrapper<Admin>()
                .eq(Admin::getUsername, username)
                .eq(Admin::getPassword, encryptedPassword));
    }

    public boolean register(String username, String password) {
        String encryptedPassword = DigestUtil.sha256Hex(password);
        Admin admin = new Admin();
        admin.setUsername(username);
        admin.setPassword(encryptedPassword);
        return save(admin);
    }
}