---
layout: home

hero:
  name: ZoteroPatch AI Reader
  text: AI 增强的 Zotero 阅读器
  tagline: 为 Zotero 7 PDF 阅读器提供智能翻译、摘要、问答和笔记功能
  image:
    src: /logo.svg
    alt: ZoteroPatch AI Reader
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 查看 GitHub
      link: https://github.com/yourusername/ZoteroPatch-AI-Reader

features:
  - icon: 🌐
    title: 智能翻译
    details: 选中文本即可快速翻译，支持多语言，无缝集成到阅读流程
  - icon: 📝
    title: 自动摘要
    details: 一键生成论文摘要，快速把握核心内容，节省阅读时间
  - icon: 💡
    title: 要点提取
    details: 智能提取关键信息、方法论、数据集等结构化要点
  - icon: ❓
    title: 智能问答
    details: 基于论文内容的上下文问答，深入理解文献细节
  - icon: 📄
    title: 笔记写回
    details: 将 AI 生成的内容直接写入 Zotero 笔记，支持追加/覆盖模式
  - icon: ⚙️
    title: 灵活配置
    details: 支持 OpenAI 兼容的多种 API，可使用本地模型
---

## 安装方式

::: code-group

```bash [npm]
# 克隆仓库
git clone https://github.com/yourusername/ZoteroPatch-AI-Reader.git
cd ZoteroPatch-AI-Reader

# 安装依赖
npm install

# 构建插件
npm run build
```

```bash [just]
# 使用 just 构建
just setup
```

:::

## 快速配置

1. 在 Zotero 中安装插件
2. 打开 `编辑` → `首选项` → `AI Reader Assistant`
3. 填写 API Key 和端点
4. 选择模型并测试连接

## 开始使用

打开任意 PDF 文献，右侧栏会自动显示 AI 助手面板。选中文本后右键即可使用翻译、解释等功能。

[了解更多 →](/guide/basic-usage)
