# Filterbubble 项目部署指南

本文档提供了将 Filterbubble 项目部署到 Surge.sh 的详细说明，以便长期维护和更新。

## 部署到 Surge.sh

### 前提条件

- Node.js 和 npm 已安装
- 已安装 Surge CLI（通过 `npm install --save-dev surge` 安装）
- Surge.sh 账户（首次部署时会提示创建）

### 使用部署脚本

我们提供了一个简单的部署脚本，可以一键部署项目：

```bash
./deploy-to-surge.sh
```

这个脚本会自动执行以下步骤：
1. 构建项目（`npm run build`）
2. 将构建后的文件部署到 Surge.sh（`npx surge dist filterbubble.surge.sh`）

### 手动部署步骤

如果你想手动部署，可以按照以下步骤操作：

1. 构建项目
   ```bash
   npm run build
   ```

2. 部署到 Surge.sh
   ```bash
   npx surge dist filterbubble.surge.sh
   ```

3. 首次部署时，Surge 会要求你创建账户或登录。按照提示操作即可。

### 部署后的网站

成功部署后，你的应用将可以通过以下 URL 访问：
```
https://filterbubble.surge.sh
```

## 更新已部署的应用

要更新已部署的应用，只需重复上述部署步骤。Surge.sh 会自动覆盖之前的部署。

## 自定义域名（可选）

如果你想使用自定义域名而不是 `filterbubble.surge.sh`，可以按照以下步骤操作：

1. 在你的域名注册商处添加一个 CNAME 记录，指向 `na-west1.surge.sh`
2. 使用自定义域名部署
   ```bash
   npx surge dist 你的自定义域名.com
   ```

## 常见问题解决

### 部署失败

如果部署失败，可能是由于以下原因：

1. **网络问题**：确保你的网络连接稳定
2. **权限问题**：确保你有足够的权限来执行部署脚本
3. **Surge 账户问题**：确保你的 Surge 账户有效

### 页面空白或加载失败

如果部署成功但页面空白或加载失败，可能是由于以下原因：

1. **路由问题**：检查 `src/router/index.js` 中的路由配置
2. **资源路径问题**：确保 `vite.config.js` 中的 `base` 路径设置为 `'/'`
3. **Firebase 连接问题**：检查 Firebase 配置和连接

## 注意事项

- Surge.sh 免费版有一些限制，但对于大多数项目来说已经足够
- 如果你的项目需要后端服务，需要单独部署后端
- 定期检查你的部署是否仍然可用，特别是在长时间不使用后
