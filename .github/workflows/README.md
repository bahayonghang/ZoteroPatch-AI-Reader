# ZoteroPatch AI Reader - GitHub Workflows

本目录包含 GitHub Actions 工作流配置，用于自动化 CI/CD 流程。

## 🔄 工作流说明

### 1. CI (ci.yml)

**触发条件**：
- Push 到 `main`、`master` 或 `develop` 分支
- Pull Request 到上述分支
- 手动触发

**任务**：
- ✅ **Lint and Type Check**: ESLint 检查和 TypeScript 类型检查
- ✅ **Build Plugin**: 构建插件并上传构建产物
- ✅ **Run Tests**: 运行测试套件
- ✅ **Build Documentation**: 构建文档
- ✅ **Multi-OS Build**: 在 Ubuntu、Windows、macOS 上测试构建

### 2. Release (release.yml)

**触发条件**：
- Push 带有 `v*.*.*` 格式的 tag（如 `v0.1.0`）
- 手动触发（可指定 tag）

**任务**：
1. **Validate**: 运行所有检查（lint、typecheck、test）
2. **Build and Package**: 构建并打包为 .xpi 文件
3. **Build Docs**: 构建文档
4. **Create Release**: 创建 GitHub Release 并上传文件
5. **Notify**: 发送发布通知

### 3. Deploy Docs (docs.yml)

**触发条件**：
- Push 到 `main` 或 `master` 分支且 `docs/` 目录有变更
- 手动触发

**任务**：
- 构建 VitePress 文档
- 部署到 GitHub Pages

## 🚀 使用指南

### 创建发布

有两种方式创建发布：

#### 方法一：通过 Git Tag

```bash
# 1. 更新版本号
npm version patch  # 或 minor / major

# 2. 推送 tag
git push --tags

# 3. GitHub Actions 会自动：
#    - 运行所有检查
#    - 构建插件
#    - 打包为 .xpi
#    - 创建 GitHub Release
```

#### 方法二：手动触发

1. 访问 GitHub Actions 页面
2. 选择 "Release" 工作流
3. 点击 "Run workflow"
4. 输入要发布的 tag（如 `v0.1.0`）
5. 点击 "Run workflow"

### 部署文档

文档会在以下情况自动部署：
- Push 到主分支且 `docs/` 有变更
- 手动触发 "Deploy Docs" 工作流

访问地址：`https://<username>.github.io/ZoteroPatch-AI-Reader/`

### 查看构建状态

在仓库页面的 Actions 标签查看所有工作流的运行状态。

## 📋 工作流对应的 Just 命令

GitHub Actions 工作流与 `justfile` 命令保持一致：

| GitHub Actions 任务 | Just 命令 | 说明 |
|-------------------|-----------|------|
| Lint and Type Check | `just check` | 代码检查 |
| Build Plugin | `just build` | 构建插件 |
| Run Tests | `just test` | 运行测试 |
| Package | `just package` | 打包 .xpi |
| Pre-release | `just pre-release` | 发布前检查 |
| Build Docs | `just docs-build` | 构建文档 |

## 🔧 配置 GitHub Pages

要启用 GitHub Pages 自动部署：

1. 进入仓库 Settings → Pages
2. Source 选择 "GitHub Actions"
3. Push 到主分支后文档会自动部署

## 📦 Release 产物

每次发布会生成以下文件：

- `zoteropatch-ai-reader-v*.*.*.xpi` - 插件安装包
- 文档站点（部署到 GitHub Pages）
- 构建产物（Artifacts，保留 7 天）

## 🔐 所需权限

工作流需要以下权限（已配置）：

- `contents: write` - 创建 Release
- `pages: write` - 部署 Pages
- `id-token: write` - Pages 认证

## 🐛 故障排查

### 构建失败

1. 查看 Actions 日志
2. 本地运行 `just check` 复现问题
3. 修复后重新推送

### 发布失败

1. 确认 tag 格式正确（`v*.*.*`）
2. 确认所有检查通过
3. 查看 Release 工作流日志

### 文档部署失败

1. 确认 GitHub Pages 已启用
2. 检查文档构建是否成功
3. 查看 Deploy Docs 工作流日志

## 📝 注意事项

- 所有工作流都使用 Node.js 20
- 依赖缓存提高构建速度
- 构建产物保留 7 天
- Release 自动生成 changelog
- 支持多平台测试（Ubuntu、Windows、macOS）

## 🎯 最佳实践

1. **提交前本地检查**：
   ```bash
   just check    # 运行所有检查
   just build    # 测试构建
   ```

2. **创建 PR 前**：
   确保 CI 通过所有检查

3. **发布前**：
   ```bash
   just pre-release  # 完整的发布前检查
   ```

4. **更新文档后**：
   本地预览：`just docs-dev`

## 🔗 相关资源

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [VitePress 部署指南](https://vitepress.dev/guide/deploy)
- [Semantic Versioning](https://semver.org/)
