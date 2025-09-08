# Filter Bubble 项目

一个研究过滤气泡和AI交互的应用程序。

## 项目部署指南

### GitHub Pages 部署

按照以下步骤将项目部署到GitHub Pages，使其可以通过互联网访问：

1. 创建GitHub仓库
   - 在GitHub上创建一个新的仓库，命名为 `filterbubble`
   - 不要初始化仓库（不添加README、.gitignore或许可证）

2. 将本地项目推送到GitHub
   ```bash
   # 在项目根目录初始化Git仓库
   git init
   
   # 添加所有文件到暂存区
   git add .
   
   # 提交更改
   git commit -m "Initial commit"
   
   # 添加远程仓库
   git remote add origin https://github.com/你的用户名/filterbubble.git
   
   # 推送到GitHub
   git push -u origin main
   ```

3. 启用GitHub Pages
   - 在GitHub仓库页面，点击 "Settings"
   - 滚动到 "GitHub Pages" 部分
   - 在 "Source" 下拉菜单中选择 "GitHub Actions"
   - 系统将自动使用我们已配置的工作流程文件

4. 手动部署（可选）
   ```bash
   # 使用npm脚本部署
   npm run deploy:gh-pages
   ```

5. 访问你的网站
   - 部署完成后，你的网站将可以通过 `https://你的用户名.github.io/filterbubble/` 访问

### 注意事项

- 确保在 `vite.config.js` 中的 `base` 路径与你的仓库名称匹配
- 如果使用自定义域名，需要在GitHub仓库设置中配置
- 部署后，可能需要几分钟网站才能生效
