# Cloudflare 版

Cloudflare Pages 继续使用仓库根目录的现有配置：

- 构建命令：`pnpm run build:pages`
- 输出目录：`dist-pages`
- 生产分支：`main`
- Worker 入口：`worker/index.ts`

这条链路暂时不接阿里云数据库，也不改变现有页面和金融计算。阿里云版的 Node、MySQL、登录和账单服务放在 `deploy/aliyun/` 规划，等大陆服务器与备案完成后再启用。
