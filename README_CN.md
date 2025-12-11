# ZoteroPatch AI Reader

> 为 Zotero 7/8 PDF 阅读器增强 AI 助手功能

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Zotero](https://img.shields.io/badge/Zotero-7.0%20%7C%208.x-red.svg)](https://www.zotero.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)

## ✨ 功能特性

ZoteroPatch AI Reader 是一个为 Zotero 7/8 PDF 阅读器设计的插件，在右侧栏提供强大的 AI 助手功能：

- 🌐 **智能翻译** - 选中文本即可快速翻译，支持多语言
- 📝 **自动摘要** - 一键生成论文摘要，快速把握核心内容
- 💡 **要点提取** - 智能提取关键信息、方法论、数据集等结构化要点
- ❓ **智能问答** - 基于论文内容的上下文问答，深入理解文献
- 📄 **笔记写回** - 将 AI 生成的内容直接写入 Zotero 笔记，支持追加/覆盖模式

## 🚀 快速开始

### 系统要求

- Zotero 7.0+ 或 Zotero 8.x
- 一个 OpenAI 兼容的 API Key（OpenAI、国产大模型、本地部署等）

### 安装方法

1. 从 [Releases](https://github.com/yourusername/ZoteroPatch-AI-Reader/releases) 页面下载最新的 `.xpi` 文件
2. 在 Zotero 中，打开 `工具` → `插件`
3. 点击右上角齿轮图标，选择 `Install Add-on From File...`
4. 选择下载的 `.xpi` 文件进行安装
5. 重启 Zotero

### 配置 API

1. 安装完成后，打开 Zotero `编辑` → `首选项` → `AI Reader Assistant`
2. 填写以下信息：
   - **API Key**: 你的 OpenAI API Key 或其他兼容服务的密钥
   - **API 端点**: 默认为 `https://api.openai.com/v1`（可修改为其他兼容端点）
   - **模型**: 选择使用的模型（如 `gpt-3.5-turbo`、`gpt-4` 等）
   - **温度**: 模型创造性参数（0-2，建议 0.7）
3. 点击 `测试连接` 验证配置是否正确

## 📖 使用指南

### 打开 AI 助手面板

1. 在 Zotero 中打开任意 PDF 文献
2. 在 PDF 阅读器右侧会自动显示 **AI 助手** 面板
3. 面板包含三个 Tab：
   - **对话**: 进行问答交互
   - **摘要**: 查看文档摘要
   - **要点**: 查看提取的关键要点

### 使用选区功能

1. 在 PDF 中选中任意文本
2. 右键点击选中的文本
3. 选择以下操作之一：
   - 🌐 **翻译** - 将选中文本翻译成目标语言
   - 💡 **解释** - 让 AI 解释选中内容
   - ❓ **提问** - 基于选中内容提问
   - 📝 **摘要** - 生成选中段落的摘要

### 生成摘要

1. 点击面板顶部的 **📝** 按钮
2. AI 将自动分析当前论文并生成结构化摘要
3. 摘要包括：研究问题、方法、结论、局限性等
4. 点击 **写入笔记** 可将摘要保存到 Zotero 笔记

### 智能问答

1. 在 **对话** Tab 的输入框中输入问题
2. 按 `Enter` 发送（`Shift + Enter` 换行）
3. AI 将基于论文内容回答你的问题
4. 对话历史会自动保存在会话中

### 笔记管理

- 所有 AI 生成的内容都可以一键写入 Zotero 笔记
- 支持两种模式：
  - **追加模式**: 在现有笔记末尾添加新内容
  - **覆盖模式**: 替换整个笔记内容
- 自动添加时间戳和来源标记

## 🏗️ 架构设计

```
ZoteroPatch-AI-Reader/
├── src/
│   ├── index.ts              # 主入口，插件生命周期管理
│   ├── types/                # TypeScript 类型定义
│   ├── panel/                # UI 面板相关
│   │   ├── ReaderPanelManager.ts      # 侧栏面板管理
│   │   └── SelectionMenuManager.ts    # 选区菜单管理
│   ├── services/             # 核心服务层
│   │   ├── SessionManager.ts          # 会话管理
│   │   ├── ConfigManager.ts           # 配置管理
│   │   ├── LLMClient.ts              # LLM 客户端
│   │   └── NotesSyncService.ts        # 笔记同步
│   └── prefs/                # 首选项面板
│       └── PreferencesPanel.ts
├── bootstrap.js              # Zotero 插件引导文件
├── manifest.json            # 插件清单
└── scripts/                 # 构建脚本
    ├── build.js
    └── prepare.js
```

### 核心组件

- **ReaderPanelManager**: 管理 PDF 阅读器右侧栏的 AI 助手面板
- **SelectionMenuManager**: 处理文本选区的右键菜单扩展
- **SessionManager**: 管理每个文献的会话上下文和消息历史
- **LLMClient**: 封装 OpenAI 兼容的 API 调用，支持重试和错误处理
- **NotesSyncService**: 负责将 AI 内容写回 Zotero 笔记
- **ConfigManager**: 管理插件配置，使用 Zotero Preferences 存储

## 🛠️ 开发指南

### 环境准备

```bash
# 克隆仓库
git clone https://github.com/yourusername/ZoteroPatch-AI-Reader.git
cd ZoteroPatch-AI-Reader

# 安装依赖
npm install

# 准备项目目录
npm run prepare
```

### 开发模式

```bash
# 监听模式构建（热重载）
npm run build:watch

# 或使用简写命令
npm start
```

### 生产构建

```bash
# 构建生产版本
npm run build

# 构建产物在 build/ 目录
```

### 代码规范

```bash
# 运行 ESLint 检查
npm run lint

# 运行测试
npm test
```

### 调试技巧

1. **启用 Zotero 开发者模式**:
   - 打开 Zotero → `编辑` → `首选项` → `高级` → `配置编辑器`
   - 搜索 `extensions.zotero.debug.output` 并设置为 `true`

2. **查看日志**:
   - 打开 Zotero → `帮助` → `Debug Output Logging` → `View Output`
   - 所有日志以 `[AI Reader]` 前缀标识

3. **热重载**:
   - 使用 `npm run build:watch` 保持监听
   - 修改代码后在 Zotero 中禁用并重新启用插件

## 🔧 常见问题

### Q: 插件无法加载？

A: 请确保：
1. Zotero 版本为 7.0 或更高
2. 插件文件完整且未损坏
3. 查看 Zotero Debug Output 中的错误信息

### Q: API 调用失败？

A: 请检查：
1. API Key 是否正确
2. API 端点是否可访问
3. 网络连接是否正常
4. 是否有足够的 API 配额

### Q: 右侧栏不显示面板？

A: 可能的原因：
1. Zotero Reader 尚未完全加载
2. 插件初始化失败，查看控制台日志
3. 与其他插件冲突，尝试禁用其他插件

### Q: 如何使用本地部署的模型？

A:
1. 在配置中将 API 端点修改为本地地址（如 `http://localhost:8000/v1`）
2. 确保本地模型服务提供 OpenAI 兼容的 API
3. 根据需要调整模型名称

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出建议！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [Zotero](https://www.zotero.org/) - 优秀的文献管理工具
- [windingwind/zotero-plugin-template](https://github.com/windingwind/zotero-plugin-template) - Zotero 插件开发模板
- OpenAI - 强大的 AI 能力支持

## 📮 联系方式

- 问题反馈: [GitHub Issues](https://github.com/yourusername/ZoteroPatch-AI-Reader/issues)
- 功能建议: [GitHub Discussions](https://github.com/yourusername/ZoteroPatch-AI-Reader/discussions)

---

**注意**: 本插件仅为学术研究和个人学习使用，请遵守相关 API 服务提供商的使用条款。
