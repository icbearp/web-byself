# Cloudflare Pages 发布说明

这个仓库已经配置为由 GitHub 自动发布到 Cloudflare Pages。

## Cloudflare Pages 设置

- Framework preset: `None`
- Production branch: `main`
- Build command: `pnpm run build:pages`
- Build output directory: `dist-pages`
- Root directory: 留空

建议添加以下环境变量：

- `NODE_VERSION`: `22.13.0`
- `PNPM_VERSION`: `11.9.0`

## 日常更新

网站修改完成后，只需在项目目录运行：

```powershell
git add .
git commit -m "Update site"
git pull --rebase origin main
git push origin main
```

推送成功后，Cloudflare Pages 会自动读取 GitHub 的 `main` 分支并重新构建网站。

如果 `git commit` 显示没有可提交内容，可以直接运行后两条命令。如果
`git pull --rebase` 报告冲突，请先不要强制推送，检查冲突后再继续。

## D1 账户、账单与留言数据绑定

登录账户、云端账单、留言与建议使用 Cloudflare D1。未登录用户的账单仍只保存在自己的浏览器中。首次启用时：

1. 在 Cloudflare D1 控制台创建数据库。
2. 进入 Workers & Pages → 选择 Pages 项目 → Settings → Bindings → Add → D1 database bindings。
3. 变量名填写 `DB`，选择刚创建的数据库，并分别配置 Production 与 Preview。
4. 进入 Settings → Variables and Secrets，添加普通文本变量 `ADMIN_EMAIL`，值填写你的管理员登录邮箱。Production 与 Preview 建议分别配置。
5. 使用 `drizzle/0000_bright_menace.sql` 和后续迁移文件，按照文件编号从小到大在目标 D1 数据库执行迁移。
6. 重新部署 Pages 项目。
7. 使用 `ADMIN_EMAIL` 对应的邮箱注册。必须先配置变量再注册，该账户才会被标记为管理员并看到私有收件箱。

当前账户系统说明：

- 密码只保存 PBKDF2 派生结果和随机盐，不保存明文密码。
- 登录凭证使用 `HttpOnly`、`Secure`、`SameSite=Lax` Cookie，并在服务器端保存其哈希值。
- 普通用户只能查看和删除自己的账单；管理员可以查看用户主动保存的账单及提交的留言。
- 第一版暂不包含邮箱验证、找回密码和整账户注销；这些功能需要邮件服务后再启用。

Cloudflare 官方说明：Pages Functions 可以通过 Dashboard 或 Wrangler 配置 D1 绑定，绑定生效后必须重新部署项目。
[查看官方绑定文档](https://developers.cloudflare.com/pages/functions/bindings/)

## 访问稳定性说明

这种方式成本低，适合长期维护博客。但普通 Cloudflare Pages 不保证中国大陆
访问稳定性。如果未来需要更稳定的大陆访问，可以继续保留 GitHub 作为内容仓库，
再迁移到大陆云厂商并完成 ICP 备案。
