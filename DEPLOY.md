# WMSBigDataLab 部署文档

部署日期：2026-10-28
部署方式：Docker Compose + Cloudflare Tunnel
服务器目录：`/opt/wmsbigdatalab`
访问地址：**https://wmsbigdatalab.top**（已验证 200）

## 架构

```
用户浏览器 --HTTPS--> Cloudflare 边缘 --加密隧道--> cloudflared(容器, host网络)
    --> nginx(127.0.0.1:80, 镜像内含前端 dist) --/api--> backend:8080
                                                        |--> db:5432 (PostgreSQL 18)
                                                        |--> redis:6379
```

- 对外只经 Cloudflare，服务器**不开任何入站端口**，HTTPS 由 Cloudflare 全自动管理
- nginx 只绑定 `127.0.0.1:80`，后端/数据库/Redis 均不直接对外

## 服务清单（docker compose）

| 服务 | 镜像 | 说明 |
|------|------|------|
| cloudflared | cloudflare/cloudflared | 隧道连接器，token 在 `deploy/.env` |
| nginx | wmsbigdatalab-nginx（构建） | 前端静态 + `/api` 反代 + `/uploads` 直链 |
| backend | wmsbigdatalab-backend（构建） | Spring Boot 3.2.5 / Java 17，端口 8080 |
| db | postgres:18-alpine | 库 `wmsbigdatalab`，首启自动导入 `database/wmsbigdatalab.sql` |
| redis | redis:7-alpine | 限流/缓存，开启 AOF |
| backup | postgres:18-alpine | 每 24h `pg_dump` 到 `backup/`，保留 7 份 |

## 常用命令

```bash
cd /opt/wmsbigdatalab/deploy

sudo docker compose ps                 # 查看状态
sudo docker compose logs -f backend    # 看后端日志
sudo docker compose logs -f cloudflared# 看隧道日志
sudo docker compose restart nginx      # 改了前端只需重建：compose build nginx && up -d nginx
sudo docker compose down               # 停止全部（数据卷保留）
sudo docker compose up -d              # 启动全部
```

## 更新代码（发版流程）

```bash
cd /opt/wmsbigdatalab && git pull
cd deploy
sudo docker compose build              # 重建前端/后端镜像
sudo docker compose up -d              # 滚动替换
```

仅改了 SQL 初始脚本无效——数据库卷已初始化，需手动导入或重建卷。

## 密钥与凭据

- `deploy/.env`（权限 600）：`DB_PASSWORD`、`JWT_SECRET`、`TUNNEL_TOKEN`
- 管理员账号：数据库 admin 表中的用户为 **`cat`**，密码为 SHA-256 哈希存储
  （仓库 `test-login.ps1` 里的 `admin/123456` 是开发库凭据，与本次导入的备份不符）
- ⚠️ **安全加固（2026-10-28 已实施）**：`/api/admin/register` 原本在 `AdminAuthInterceptor`
  白名单中，对公网开放（任何人可注册管理员）。已从白名单移除并重建后端镜像，
  现在未带有效 Token 调用返回 401。**如需新增管理员**：临时在
  `AdminAuthInterceptor.java` 白名单加回该路径 → `sudo docker compose build backend && up -d`，
  用完记得移除；或直接在数据库 admin 表插入 SHA-256（`echo -n 密码 | sha256sum`）哈希行
- 数据库仅监听 `127.0.0.1:5432`，本机连接：
  `PGPASSWORD=<DB_PASSWORD> psql -h 127.0.0.1 -U postgres -d wmsbigdatalab`

## 持久化数据

| 数据 | 位置 |
|------|------|
| 数据库 | Docker 卷 `wmsbigdatalab_pgdata` |
| Redis AOF | Docker 卷 `wmsbigdatalab_redisdata` |
| 上传文件 | `/opt/wmsbigdatalab/uploads` |
| 数据库备份 | `/opt/wmsbigdatalab/backup/*.sql.gz` |

## Cloudflare 配置

- 隧道 ID：`f2272cab-9de5-4f33-a488-2c3c8c3cc510`（后台 Networks → Tunnels 可见）
- Public Hostname：`wmsbigdatalab.top` → `http://localhost:80`（创建隧道时已由后台配好，已验证生效）
- cloudflared 容器使用 `network_mode: host`，直连本机 `127.0.0.1:80` 的 nginx

## 构建说明（国内服务器经验）

- 后端 Maven 走阿里云镜像（`deploy/maven-settings.xml`）：直连 Maven Central 只有 ~18KB/s，
  阿里云镜像可达 ~6MB/s。新增依赖后重建即可
- 前端 `npm ci` 走默认 registry 尚可；如变慢可在 `frontend/Dockerfile` 加 npm 镜像源
- **PostgreSQL 18 注意**：数据卷必须挂 `/var/lib/postgresql`（父目录），
  挂旧式的 `/var/lib/postgresql/data` 会启动失败（PG18 镜像规范变更）

## 自动部署（GitHub Actions，2026-10-28 配置）

```
本地 git push → GitHub Actions → SSH(部署专用密钥) → 服务器执行 deploy/deploy.sh
                                    → git pull + docker compose build + up -d
                                    → curl 验证 https://wmsbigdatalab.top 返回 200
```

- 工作流：`.github/workflows/deploy.yml`（push 到 main 自动触发，并发锁防并行部署）
- 部署脚本：`deploy/deploy.sh`（服务器端唯一入口）
- SSH 密钥：私钥存 GitHub Secrets `SSH_PRIVATE_KEY`；公钥在服务器
  `~/.ssh/authorized_keys`，带 `restrict,command=` 限制——该密钥**只能**运行 deploy.sh，
  不能开 shell、不能转发端口，即使泄露也无法被用于其他操作
- 主机指纹已固定写入 deploy.yml（`SHA256:g3l94...`），防止中间人；
  若重装服务器导致 sshd 主机密钥变化，需同步更新工作流里的 fingerprint
- 服务器拉取用匿名方式（`git -c credential.helper=`），不依赖任何令牌

## 与既有服务的关系

本机原有 `llbot`(3080)、`astrbot`(6185/6199) 容器，独立运行，互不干扰。
ufw 保持未启用（Docker 端口发布默认绕过 ufw，启用反而会造成管理混乱）。
