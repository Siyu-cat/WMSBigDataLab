package com.wmsbigdatalab.config;

import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.core.handlers.MetaObjectHandler;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.OptimisticLockerInnerInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import org.apache.ibatis.executor.Executor;
import org.apache.ibatis.mapping.BoundSql;
import org.apache.ibatis.mapping.MappedStatement;
import org.apache.ibatis.mapping.SqlCommandType;
import org.apache.ibatis.plugin.*;
import org.apache.ibatis.reflection.MetaObject;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.lang.reflect.Field;
import java.sql.Connection;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Configuration
public class MyBatisPlusConfig implements MetaObjectHandler {

    private static final Set<String> SOFT_DELETE_TABLES = Set.of(
            "entry", "entry_version", "media", "category", "entry_annotation"
    );

    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        interceptor.addInnerInterceptor(new OptimisticLockerInnerInterceptor());
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.POSTGRE_SQL));
        return interceptor;
    }

    @Bean
    public SoftDeleteInterceptor softDeleteInterceptor() {
        return new SoftDeleteInterceptor();
    }

    @Override
    public void insertFill(MetaObject metaObject) {
        this.strictInsertFill(metaObject, "createdAt", LocalDateTime.class, LocalDateTime.now());
        this.strictInsertFill(metaObject, "updatedAt", LocalDateTime.class, LocalDateTime.now());
    }

    @Override
    public void updateFill(MetaObject metaObject) {
        this.strictUpdateFill(metaObject, "updatedAt", LocalDateTime.class, LocalDateTime.now());
    }

    @Intercepts({
        @Signature(type = Executor.class, method = "update",
                   args = {MappedStatement.class, Object.class})
    })
    public static class SoftDeleteInterceptor implements Interceptor {

        private static final Pattern DELETE_PATTERN =
                Pattern.compile("(?i)DELETE\\s+FROM\\s+(\\w+)\\s*(WHERE\\s+(.*))?");

        @Override
        public Object intercept(Invocation invocation) throws Throwable {
            Object[] args = invocation.getArgs();
            MappedStatement ms = (MappedStatement) args[0];
            SqlCommandType commandType = ms.getSqlCommandType();

            if (commandType == SqlCommandType.DELETE) {
                BoundSql boundSql = ms.getBoundSql(args[1]);
                String originalSql = boundSql.getSql();
                String newSql = convertDeleteToSoftDelete(originalSql);

                if (!newSql.equals(originalSql)) {
                    setSqlCommandType(ms, SqlCommandType.UPDATE);
                    setBoundSql(ms, args[1], newSql);
                }
            }

            return invocation.proceed();
        }

        private String convertDeleteToSoftDelete(String sql) {
            Matcher matcher = DELETE_PATTERN.matcher(sql);
            if (!matcher.find()) {
                return sql;
            }

            String tableName = matcher.group(1);
            if (!SOFT_DELETE_TABLES.contains(tableName.toLowerCase())) {
                return sql;
            }

            String whereClause = matcher.group(3);
            if (whereClause != null && !whereClause.trim().isEmpty()) {
                return "UPDATE " + tableName + " SET deleted_at = NOW() WHERE " + whereClause.trim();
            }
            return "UPDATE " + tableName + " SET deleted_at = NOW()";
        }

        private void setSqlCommandType(MappedStatement ms, SqlCommandType type) {
            try {
                Field field = MappedStatement.class.getDeclaredField("sqlCommandType");
                field.setAccessible(true);
                field.set(ms, type);
            } catch (Exception e) {
                throw new RuntimeException("Failed to set SqlCommandType to UPDATE", e);
            }
        }

        private void setBoundSql(MappedStatement ms, Object parameter, String newSql) {
            try {
                BoundSql boundSql = ms.getBoundSql(parameter);
                Field sqlField = BoundSql.class.getDeclaredField("sql");
                sqlField.setAccessible(true);
                sqlField.set(boundSql, newSql);
            } catch (Exception e) {
                throw new RuntimeException("Failed to set BoundSql", e);
            }
        }
    }
}
