# Vercel部署指南

## 环境变量配置

### 本地开发环境设置

1. 复制示例环境文件：
```bash
cp .env.example .env.local
```

2. 编辑 `.env.local` 文件，填入真实的API密钥：
```env
VUE_APP_API_KEY=sk-5568c74f05f34ff89578c6c198c0f2bd
VUE_APP_BASE_URL=https://api.deepseek.com/v1
VUE_APP_BACKUP_API_KEY=sk-5568c74f05f34ff89578c6c198c0f2bd
VUE_APP_MODEL=deepseek-chat
VUE_APP_API_TIMEOUT=60000
```

### Vercel环境变量配置

#### 方法1：通过Vercel Dashboard设置

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 进入 **Settings** → **Environment Variables**
4. 添加以下环境变量：

| 变量名 | 值 | 环境 |
|--------|-----|------|
| `VUE_APP_API_KEY` | `sk-5568c74f05f34ff89578c6c198c0f2bd` | Production, Preview, Development |
| `VUE_APP_BASE_URL` | `https://api.deepseek.com/v1` | Production, Preview, Development |
| `VUE_APP_BACKUP_API_KEY` | `sk-5568c74f05f34ff89578c6c198c0f2bd` | Production, Preview, Development |
| `VUE_APP_MODEL` | `deepseek-chat` | Production, Preview, Development |
| `VUE_APP_API_TIMEOUT` | `60000` | Production, Preview, Development |

#### 方法2：通过Vercel CLI设置

```bash
# 安装Vercel CLI
npm i -g vercel

# 登录Vercel
vercel login

# 设置环境变量
vercel env add VUE_APP_API_KEY
vercel env add VUE_APP_BASE_URL
vercel env add VUE_APP_BACKUP_API_KEY
vercel env add VUE_APP_MODEL
vercel env add VUE_APP_API_TIMEOUT
```

## 部署步骤

### 首次部署

1. **连接GitHub仓库**
   - 在Vercel Dashboard中点击 "New Project"
   - 选择你的GitHub仓库
   - 配置构建设置（通常自动检测）

2. **配置构建设置**
   ```
   Framework Preset: Vue.js
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

3. **设置环境变量**（按上述方法）

4. **部署**
   - 点击 "Deploy" 按钮
   - 等待构建完成

### 后续部署

每次推送到主分支时，Vercel会自动重新部署。

## 安全注意事项

✅ **已完成的安全措施：**
- API密钥已从代码中移除
- 使用环境变量存储敏感信息
- `.env.local` 已添加到 `.gitignore`
- 创建了 `.env.example` 作为模板

⚠️ **重要提醒：**
- 永远不要将 `.env.local` 文件提交到Git
- 定期轮换API密钥
- 监控API使用情况
- 为不同环境使用不同的API密钥

## 故障排除

### 常见问题

1. **API密钥未生效**
   - 检查环境变量名称是否正确（必须以 `VUE_APP_` 开头）
   - 确认在Vercel中设置了正确的环境
   - 重新部署项目

2. **构建失败**
   - 检查 `package.json` 中的依赖
   - 确认Node.js版本兼容性
   - 查看构建日志中的错误信息

3. **API调用失败**
   - 验证API密钥是否有效
   - 检查API端点URL是否正确
   - 确认网络连接和CORS设置

### 调试命令

```bash
# 本地测试环境变量
npm run serve

# 检查环境变量是否加载
console.log(process.env.VUE_APP_API_KEY)

# Vercel本地预览
vercel dev
```

## 监控和维护

- 定期检查API使用量
- 监控应用性能
- 更新依赖包
- 备份重要配置
