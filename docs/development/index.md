# 开发指南

欢迎参与 ZoteroPatch AI Reader 的开发！本指南将帮助你搭建开发环境并了解项目结构。

## 技术栈

- **语言**: TypeScript 5.3+
- **构建工具**: esbuild（快速编译和打包）
- **目标平台**: Firefox 102+（Zotero 7 基于 Firefox）
- **插件类型**: Bootstrapped 插件（支持热加载/卸载）
- **任务管理**: just (命令行任务工具)

## 环境准备

### 必需软件

- **Node.js** 18+ 和 npm
- **Zotero** 7.0+
- **Git**
- **just** (推荐) - [安装指南](https://github.com/casey/just#installation)

### 克隆仓库

```bash
git clone https://github.com/yourusername/ZoteroPatch-AI-Reader.git
cd ZoteroPatch-AI-Reader
```

### 安装依赖

::: code-group

```bash [just]
# 使用 just 一键设置
just setup
```

```bash [npm]
# 手动安装
npm install
npm run prepare
npm run build
```

:::

## 项目结构

```
ZoteroPatch-AI-Reader/
├── src/                      # 源代码
│   ├── index.ts             # 主入口
│   ├── types/               # TypeScript 类型定义
│   ├── panel/               # UI 面板
│   ├── services/            # 核心服务
│   └── prefs/               # 首选项
├── bootstrap.js             # Zotero 插件引导
├── manifest.json           # 插件清单
├── scripts/                # 构建脚本
├── build/                  # 构建输出
├── docs/                   # VitePress 文档
├── justfile               # Just 任务定义
└── package.json           # npm 配置
```

详细的项目结构说明请参考 [项目结构](/development/structure)。

## 开发工作流

### 1. 开发模式

启动监听模式，自动重新编译：

```bash
just dev
# 或
npm run build:watch
```

### 2. 安装到 Zotero

#### 方法一：直接安装构建目录（推荐）

设置环境变量：

```bash
# macOS/Linux
export ZOTERO_PLUGIN_DIR="$HOME/Library/Application Support/Zotero/Profiles/<profile>/extensions/"

# Windows (PowerShell)
$env:ZOTERO_PLUGIN_DIR = "$env:APPDATA\Zotero\Zotero\Profiles\<profile>\extensions\"
```

然后安装：

```bash
just install-zotero
```

#### 方法二：创建符号链接

```bash
# 进入 Zotero 扩展目录
cd "$HOME/Library/Application Support/Zotero/Profiles/<profile>/extensions/"

# 创建符号链接
ln -s /path/to/ZoteroPatch-AI-Reader/build ai-reader@zoteropatch.com
```

### 3. 调试

#### 启用 Debug 输出

1. Zotero → 编辑 → 首选项 → 高级 → 配置编辑器
2. 搜索 `extensions.zotero.debug.output`
3. 设置为 `true`

#### 查看日志

- Zotero → 帮助 → Debug Output Logging → View Output
- 搜索 `[AI Reader]` 前缀的日志

#### 浏览器控制台

在 Zotero 中按 `Ctrl+Shift+Alt+I`（macOS: `Cmd+Shift+Alt+I`）打开开发者工具。

### 4. 测试

```bash
# 运行 lint 检查
just lint

# 类型检查
just typecheck

# 完整检查
just check
```

### 5. 构建发布版本

```bash
# 构建生产版本
just build

# 打包为 .xpi
just package
```

## Just 命令参考

### 常用命令

| 命令 | 说明 |
|------|------|
| `just` | 显示所有可用命令 |
| `just dev` | 启动开发模式（监听） |
| `just build` | 构建生产版本 |
| `just clean` | 清理构建产物 |
| `just lint` | 运行代码检查 |
| `just test` | 运行测试 |
| `just package` | 打包为 .xpi |

### 开发命令

| 命令 | 说明 |
|------|------|
| `just setup` | 一键设置开发环境 |
| `just install-zotero` | 安装到 Zotero |
| `just quick-dev` | 快速开发循环 |
| `just status` | 查看项目状态 |

### 文档命令

| 命令 | 说明 |
|------|------|
| `just docs-dev` | 启动文档开发服务器 |
| `just docs-build` | 构建文档 |
| `just docs-preview` | 预览文档构建 |

### 发布命令

| 命令 | 说明 |
|------|------|
| `just pre-release` | 发布前检查 |
| `just release-patch` | 发布补丁版本 |
| `just release-minor` | 发布次版本 |
| `just release-major` | 发布主版本 |

完整命令列表请运行 `just --list`。

## 代码规范

### TypeScript 风格

- 使用 `async/await` 而非 Promise 链
- 优先使用接口（interface）而非类型别名（type）
- 所有公共函数必须有 JSDoc 注释
- 使用 `private`/`public` 明确成员可见性

示例：

```typescript
/**
 * Create a new session for a reader
 * @param itemID - The Zotero item ID
 * @param readerInstance - The reader instance
 * @returns The created session context
 */
createSession(itemID: number, readerInstance: ZoteroReader): SessionContext {
  // Implementation
}
```

### 命名约定

- **类名**: PascalCase（如 `ReaderPanelManager`）
- **方法名**: camelCase（如 `createPanel`）
- **常量**: UPPER_SNAKE_CASE（如 `MAX_RETRIES`）
- **文件名**: PascalCase（如 `SessionManager.ts`）

### 日志规范

所有日志必须包含组件标识：

```typescript
console.log('[ComponentName] Message');
console.error('[ComponentName] Error:', error);
console.warn('[ComponentName] Warning:', warning);
```

### 错误处理

```typescript
try {
  await someAsyncOperation();
} catch (error) {
  console.error('[Component] Operation failed:', error);
  // 向用户显示友好的错误提示
  showErrorMessage('操作失败，请重试');
}
```

## 编辑器配置

### VS Code

推荐安装以下扩展：

- ESLint
- Prettier
- TypeScript Vue Plugin (Volar)

配置 `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## 下一步

- 了解[项目结构](/development/structure)
- 学习[插件架构](/development/architecture)
- 查看[测试指南](/development/testing)
- 阅读 [API 文档](/api/)

## 需要帮助？

- 查看 [GitHub Issues](https://github.com/yourusername/ZoteroPatch-AI-Reader/issues)
- 加入 [讨论区](https://github.com/yourusername/ZoteroPatch-AI-Reader/discussions)
- 阅读 [Zotero 插件开发文档](https://www.zotero.org/support/dev/client_coding/plugin_development)
