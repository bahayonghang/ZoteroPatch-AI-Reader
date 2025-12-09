# 快速开始

本指南将帮助你在几分钟内开始使用 ZoteroPatch AI Reader。

## 安装插件

### 从 Release 安装（推荐）

1. 访问 [Releases 页面](https://github.com/yourusername/ZoteroPatch-AI-Reader/releases)
2. 下载最新的 `.xpi` 文件
3. 在 Zotero 中，打开 `工具` → `插件`
4. 点击右上角齿轮图标，选择 `Install Add-on From File...`
5. 选择下载的 `.xpi` 文件
6. 重启 Zotero

### 从源码构建

如果你想使用开发版本或进行二次开发：

::: code-group

```bash [npm]
# 克隆仓库
git clone https://github.com/yourusername/ZoteroPatch-AI-Reader.git
cd ZoteroPatch-AI-Reader

# 安装依赖并构建
npm install
npm run build

# build/ 目录即为插件文件
```

```bash [just]
# 使用 just 命令
just setup

# 打包为 .xpi
just package
```

:::

## 配置 API

### 获取 API Key

你需要一个 OpenAI 兼容的 API Key。以下是一些选项：

#### OpenAI 官方

1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 注册并创建 API Key
3. 复制 API Key

#### 国产大模型

- **智谱 AI**: https://open.bigmodel.cn/
- **通义千问**: https://dashscope.aliyun.com/
- **Kimi**: https://platform.moonshot.cn/

#### 本地模型

如果你使用 Ollama、LocalAI 等本地服务，只需要本地 API 端点。

### 在插件中配置

1. 打开 Zotero
2. 进入 `编辑` → `首选项` (Windows/Linux) 或 `Zotero` → `Preferences` (macOS)
3. 点击左侧的 `AI Reader Assistant`
4. 填写配置信息：

| 配置项 | 说明 | 示例 |
|--------|------|------|
| API Key | 你的 API 密钥 | `sk-...` |
| API 端点 | API 服务地址 | `https://api.openai.com/v1` |
| 模型 | 使用的模型名称 | `gpt-3.5-turbo` |
| 温度 | 模型创造性 (0-2) | `0.7` |
| 默认语言 | 翻译目标语言 | `简体中文` |

5. 点击 **测试连接** 验证配置
6. 点击 **确定** 保存

::: tip 提示
首次使用建议使用 `gpt-3.5-turbo` 模型，它速度快且成本低。如需更高质量的回答，可使用 `gpt-4`。
:::

## 第一次使用

### 1. 打开 PDF 文献

在 Zotero 库中双击任意 PDF 文献，打开阅读器。

### 2. 查看 AI 面板

在阅读器右侧栏，你会看到 **AI 助手** 面板，包含三个 Tab：

- **对话**: 用于问答交互
- **摘要**: 显示文档摘要
- **要点**: 显示关键要点

### 3. 尝试翻译

1. 在 PDF 中选中一段英文文本
2. 右键点击选中的文本
3. 在弹出菜单中选择 **🌐 翻译**
4. AI 面板会显示翻译结果

### 4. 尝试问答

1. 在 **对话** Tab 的输入框中输入问题
   - 例如："这篇论文的主要贡献是什么？"
2. 按 `Enter` 发送
3. AI 会基于论文内容回答你的问题

### 5. 生成摘要

1. 点击面板顶部的 **📝** 按钮
2. AI 会分析论文并生成结构化摘要
3. 切换到 **摘要** Tab 查看结果
4. 点击 **写入笔记** 保存到 Zotero

## 常用功能

### 翻译专业术语

遇到不理解的专业术语时：

1. 选中术语
2. 右键 → **💡 解释**
3. AI 会给出通俗易懂的解释

### 提取方法论

需要了解论文使用的方法时：

1. 选中方法部分的文本
2. 右键 → **📝 摘要**
3. AI 会提取该部分的关键信息

### 对比分析

想要对比不同观点时：

1. 在对话框中询问："论文中提到的A方法和B方法有什么区别？"
2. AI 会基于论文内容进行对比分析

## 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `Enter` | 发送消息 |
| `Shift + Enter` | 换行（不发送） |
| `Ctrl/Cmd + K` | 聚焦输入框 |

## 下一步

- 了解[基础使用](/guide/basic-usage)的详细说明
- 查看[功能详解](/guide/translation)了解各项功能
- 遇到问题？查看 [FAQ](/guide/faq)

## 需要帮助？

如果遇到问题：

1. 查看 [FAQ](/guide/faq) 和 [故障排查](/guide/troubleshooting)
2. 在 [GitHub Issues](https://github.com/yourusername/ZoteroPatch-AI-Reader/issues) 报告问题
3. 加入 [讨论区](https://github.com/yourusername/ZoteroPatch-AI-Reader/discussions) 寻求帮助
