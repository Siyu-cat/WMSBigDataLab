package com.wmsbigdatalab;

import com.wmsbigdatalab.service.EntryService;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@MapperScan("com.wmsbigdatalab.mapper")
@EnableAsync
@EnableCaching
public class WmsBigDataLabApplication {
    public static void main(String[] args) {
        SpringApplication.run(WmsBigDataLabApplication.class, args);
    }

    @Bean
    public CommandLineRunner generateSlugs(EntryService entryService) {
        return args -> entryService.generateSlugsForExistingEntries();
    }
}