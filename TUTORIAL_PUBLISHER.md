# 教程发布工具

双击仓库根目录的 `打开教程发布工具.cmd`，浏览器会自动打开本地编辑器。

- “保存到本地”只更新 `content/tutorials.json`，适合继续修改。
- “发布到 GitHub”会更新教程与 `content/changelog.json`，只提交这两个文件，然后推送当前分支。
- Cloudflare 连接 GitHub 后会自动构建更新网站。
- 可以导入 `.md`、`.txt` 或教程 `.json` 文件；Word 内容可复制到正文窗口。
- 这个工具只监听 `127.0.0.1`，不会把编辑接口开放到公网。

如果系统找不到 Git，请安装 GitHub Desktop 或 Git for Windows；也可以设置 `GIT_PATH` 环境变量指向 `git.exe`。
