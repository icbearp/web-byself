# Cloudflare Pages 发布说明

这个仓库已经整理成适合 GitHub + Cloudflare Pages 的发布方式。

## Cloudflare Pages 设置

- Framework preset: `None`
- Build command: `pnpm run build:pages`
- Build output directory: `dist-pages`
- Node.js version: `22` 或更高

## 工作流

1. 把这个项目推送到 GitHub 仓库。
2. 在 Cloudflare Pages 里选择 `Connect to Git`。
3. 选择这个 GitHub 仓库和 `main` 分支。
4. 填入上面的构建命令和输出目录。
5. 首次部署完成后，可以绑定自己的域名。

以后每日记录只需要更新代码并推送到 GitHub，Cloudflare Pages 会自动重新构建和发布。

## 访问稳定性说明

这种方式成本低，适合长期维护博客。但普通 Cloudflare Pages 不保证中国大陆访问稳定性。如果未来需要更稳定的大陆访问，建议继续保留 GitHub 作为内容仓库，再迁移到大陆云厂商并完成 ICP 备案。
