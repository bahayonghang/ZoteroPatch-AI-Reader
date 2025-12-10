<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

---

# ZoteroPatch AI Reader - 项目指南

## 项目概述

ZoteroPatch AI Reader 是一个 Zotero 7 PDF 阅读器的 AI 助手插件，在阅读器右侧边栏提供智能翻译、摘要生成、要点提取、上下文问答和笔记写回功能。

## 技术栈

- **语言**: TypeScript 5.3+
- **构建工具**: esbuild
- **目标平台**: Zotero 7.0+ (基于 Firefox/XUL)
- **API 兼容**: OpenAI-compatible API (支持 OpenAI、国产模型、本地部署)
- **依赖库**: zotero-plugin-toolkit, zotero-types

## 项目架构

```
ZoteroPatch-AI-Reader/
├── src/
│   ├── index.ts                    # 入口点，插件生命周期管理
│   ├── types/
│   │   └── index.ts                # TypeScript 类型定义
│   ├── panel/                      # UI 面板层
│   │   ├── ReaderPanelManager.ts   # 侧边栏面板管理
│   │   └── SelectionMenuManager.ts # 文本选择右键菜单
│   ├── services/                   # 核心服务层
│   │   ├── SessionManager.ts       # 会话上下文和历史管理
│   │   ├── ConfigManager.ts        # 配置偏好管理
│   │   ├── LLMClient.ts            # OpenAI 兼容 API 客户端
│   │   └── NotesSyncService.ts     # 笔记写回服务
│   └── prefs/
│       └── PreferencesPanel.ts     # 偏好设置面板
├── bootstrap.js                    # Zotero 插件引导文件
├── manifest.json                   # 插件清单
├── scripts/
│   ├── build.js                    # 构建脚本
│   └── prepare.js                  # 项目准备脚本
└── docs/                           # VitePress 文档站点
```

## 核心模块说明

### 1. 入口与生命周期 (`src/index.ts`)

- **AIReaderPlugin 类**: 插件主类，管理整个插件生命周期
- **startup()**: 初始化配置、LLM 客户端、注册窗口监听器
- **shutdown()**: 清理资源、移除面板和监听器
- **窗口监听**: 通过 `Services.wm` 监听 Reader 窗口创建/销毁

### 2. 面板层 (`src/panel/`)

- **ReaderPanelManager**: 
  - 管理 AI 助手侧边栏面板
  - 构建 UI 结构（标签页：对话/摘要/要点）
  - 处理用户交互事件
  
- **SelectionMenuManager**:
  - 扩展 PDF 文本选择的右键菜单
  - 提供翻译、解释、提问、摘要等快捷操作

### 3. 服务层 (`src/services/`)

- **LLMClient**:
  - OpenAI 兼容 API 封装
  - 支持 chat、translate、explain、summarize 方法
  - 内置重试机制（最多 3 次）
  -