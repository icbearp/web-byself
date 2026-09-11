# 双部署结构

本仓库保留一套共享页面与计算逻辑，同时准备两条发布链路：

- `deploy/cloudflare/`：现有 Cloudflare Pages 发布说明；根目录的 `app/`、`worker/`、`vite.config.ts` 和 `scripts/` 继续服务这条链路。
- `deploy/aliyun/`：面向中国大陆的阿里云部署契约、环境变量和上线检查清单。

不要把 `app/` 或 `worker/` 复制成两份。金融计算、车型内容和页面样式只有一份，避免 Cloudflare 与阿里云版本逐渐不一致。GitHub Actions 也必须放在仓库根目录的 `.github/workflows/`，不能移动到子目录后期待 GitHub 自动识别。

阿里云版本分两阶段：

1. 先完成域名、ECS 和 ICP 备案，验证大陆访问。
2. 再接入阿里云 Node 服务、MySQL、账号登录、用户账单和管理员账单收件箱。

在第二阶段完成前，Cloudflare 版本继续保留，浏览器本地账单逻辑不改变。
