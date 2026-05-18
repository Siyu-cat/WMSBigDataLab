package com.wmsbigdatalab;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@MapperScan("com.wmsbigdatalab.mapper")
@EnableAsync
public class WmsBigDataLabApplication {
    public static void main(String[] args) {
        SpringApplication.run(WmsBigDataLabApplication.class, args);
    }
}