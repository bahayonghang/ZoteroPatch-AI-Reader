# API 参考

本节提供 ZoteroPatch AI Reader 的完整 API 文档。

## 核心类

### [AIReaderPlugin](/api/plugin)

主插件控制器，管理插件生命周期和窗口。

```typescript
class AIReaderPlugin {
  async startup(): Promise<void>
  async shutdown(): Promise<void>
}
```

## UI 管理

### [ReaderPanelManager](/api/panel-manager)

管理 PDF 阅读器右侧栏的 AI 助手面板。

```typescript
class ReaderPanelManager {
  async createPanel(reader: ZoteroReader): Promise<void>
  removePanel(reader: ZoteroReader): void
  removeAllPanels(): void
}
```

### [SelectionMenuManager](/api/selection-manager)

管理文本选区的右键菜单扩展。

```typescript
class SelectionMenuManager {
  registerToReader(reader: ZoteroReader): void
  registerAction(action: SelectionAction): void
  unregisterAction(actionId: string): void
}
```

## 服务层

### [SessionManager](/api/session-manager)

管理每个文献的会话上下文和消息历史。

```typescript
class SessionManager {
  createSession(itemID: number, readerInstance: ZoteroReader): SessionContext
  getSession(itemID: number): SessionContext | undefined
  addMessage(itemID: number, message: ChatMessage): void
}
```

### [ConfigManager](/api/config-manager)

管理插件配置，使用 Zotero Preferences 持久化存储。

```typescript
class ConfigManager {
  async load(): Promise<PluginConfig>
  async save(config: Partial<PluginConfig>): Promise<void>
  validate(): { valid: boolean; errors: string[] }
}
```

### [LLMClient](/api/llm-client)

封装 OpenAI 兼容的 API 调用。

```typescript
class LLMClient {
  async chat(messages: ChatMessage[]): Promise<LLMResponse>
  async translate(text: string, targetLanguage: string): Promise<string>
  async explain(text: string, language: string): Promise<string>
  async summarize(text: string, language: string): Promise<string>
}
```

### [NotesSyncService](/api/notes-sync)

将 AI 生成的内容写入 Zotero 笔记。

```typescript
class NotesSyncService {
  async writeToNote(itemID: number, content: string, options: NoteSyncOptions): Promise<void>
  async writeSummary(itemID: number, summary: string): Promise<void>
  async writeKeyPoints(itemID: number, keyPoints: string[]): Promise<void>
}
```

## 类型定义

### [接口和类型](/api/types)

完整的 TypeScript 类型定义，包括：

- `ZoteroReader`
- `ChatMessage`
- `SessionContext`
- `PluginConfig`
- 等等

### [配置选项](/api/config-types)

插件配置相关的类型定义：

- `PluginConfig`
- `LLMClientOptions`
- `NoteSyncOptions`

## 快速导航

<div class="api-grid">

**UI 层**
- [AIReaderPlugin](/api/plugin) - 主插件类
- [ReaderPanelManager](/api/panel-manager) - 面板管理
- [SelectionMenuManager](/api/selection-manager) - 菜单管理

**服务层**
- [SessionManager](/api/session-manager) - 会话管理
- [ConfigManager](/api/config-manager) - 配置管理
- [LLMClient](/api/llm-client) - LLM 客户端
- [NotesSyncService](/api/notes-sync) - 笔记同步

**类型**
- [接口和类型](/api/types) - 所有类型定义
- [配置选项](/api/config-types) - 配置相关类型

</div>

<style>
.api-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.api-grid > div {
  padding: 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
}

.api-grid h3 {
  margin-top: 0;
  font-size: 1.1rem;
}

.api-grid ul {
  margin: 0.5rem 0 0 0;
  padding-left: 1.2rem;
}

.api-grid li {
  margin: 0.3rem 0;
}
</style>

## 使用示例

### 创建自定义选区动作

```typescript
import { SelectionMenuManager } from './panel/SelectionMenuManager'

const menuManager = new SelectionMenuManager()

menuManager.registerAction({
  id: 'custom-action',
  label: '自定义操作',
  icon: '✨',
  handler: (text, reader) => {
    console.log('Selected text:', text)
    // 执行自定义操作
  }
})
```

### 监听会话变化

```typescript
import { SessionManager } from './services/SessionManager'

const sessionManager = new SessionManager()

// 创建会话
const session = sessionManager.createSession(itemID, reader)

// 添加消息
sessionManager.addMessage(itemID, {
  id: Date.now().toString(),
  role: 'user',
  content: 'Hello',
  timestamp: Date.now()
})

// 获取会话
const currentSession = sessionManager.getSession(itemID)
console.log(currentSession.messages)
```

### 自定义 LLM 请求

```typescript
import { LLMClient } from './services/LLMClient'

const client = new LLMClient({
  apiKey: 'your-api-key',
  apiEndpoint: 'https://api.openai.com/v1',
  model: 'gpt-4',
  temperature: 0.7
})

// 发送自定义请求
const response = await client.chat([
  { role: 'system', content: 'You are a helpful assistant' },
  { role: 'user', content: 'Explain quantum computing' }
])

console.log(response.content)
```

## 相关资源

- [TypeScript 文档](https://www.typescriptlang.org/docs/)
- [Zotero API 文档](https://www.zotero.org/support/dev/client_coding/javascript_api)
- [OpenAI API 文档](https://platform.openai.com/docs/api-reference)
