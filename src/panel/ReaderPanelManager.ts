/**
 * Reader Panel Manager
 * Manages AI Assistant panels in Zotero Reader windows
 * Supports streaming output, Markdown rendering, and theme switching
 */

import type { ZoteroReader, ChatMessage, StreamCallbacks } from '../types';
import { MarkdownRenderer } from '../utils/MarkdownRenderer';
import type { LLMClient } from '../services/LLMClient';
import type { ConfigManager } from '../services/ConfigManager';

interface AIReaderGlobalLike {
  getLLMClient?(): LLMClient | null;
  getConfigManager?(): ConfigManager | null;
}

export class ReaderPanelManager {
  private panels: Map<number, HTMLElement>;
  private chatHistories: Map<number, ChatMessage[]>;
  private markdownRenderer: MarkdownRenderer;
  private streamingStates: Map<number, boolean>;

  constructor() {
    this.panels = new Map();
    this.chatHistories = new Map();
    this.markdownRenderer = new MarkdownRenderer();
    this.streamingStates = new Map();
    console.log('[ReaderPanelManager] Initialized');
  }

  /**
   * Create and register panel for a reader (legacy method)
   */
  async createPanel(reader: ZoteroReader): Promise<void> {
    try {
      if (this.panels.has(reader.itemID)) {
        console.warn(`[ReaderPanelManager] Panel already exists for item ${reader.itemID}`);
        return;
      }

      // Create panel UI
      const panel = this.buildPanelElement(reader);

      // Store panel reference
      this.panels.set(reader.itemID, panel);

      console.log(`[ReaderPanelManager] Panel created for item ${reader.itemID}`);
    } catch (error) {
      console.error('[ReaderPanelManager] Failed to create panel:', error);
      throw error;
    }
  }

  /**
   * Build panel element - public method for sidebar section init
   */
  buildPanelElement(reader: ZoteroReader): HTMLElement {
    const doc = reader._window?.document || document;
    const panel = doc.createElement('div');
    panel.id = `ai-reader-panel-${reader.itemID}`;
    panel.className = 'ai-reader-panel';
    
    // Inject theme CSS and Markdown styles
    this.injectStyles(doc);
    
    panel.style.cssText = `
      display: flex;
      flex-direction: column;
      height: 100%;
      font-family: var(--ai-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
      font-size: var(--ai-font-size-md, 13px);
      background: var(--ai-bg-primary, #ffffff);
      color: var(--ai-text-primary, #333333);
    `;

    // Panel header
    const header = doc.createElement('div');
    header.className = 'ai-reader-header';
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      border-bottom: 1px solid var(--ai-border-color, #e0e0e0);
      background: var(--ai-bg-secondary, #f5f5f5);
    `;
    header.innerHTML = `
      <h3 style="margin: 0; font-size: 14px; font-weight: 600; color: var(--ai-text-primary, #333);">AI 助手</h3>
      <div class="ai-reader-header-actions" style="display: flex; gap: 4px;">
        <button id="ai-save-btn-${reader.itemID}" title="保存到笔记" style="background: none; border: none; cursor: pointer; padding: 4px; border-radius: 4px; font-size: 16px;">💾</button>
        <button id="ai-clear-btn-${reader.itemID}" title="清除对话" style="background: none; border: none; cursor: pointer; padding: 4px; border-radius: 4px; font-size: 16px;">🗑️</button>
        <button id="ai-settings-btn-${reader.itemID}" title="设置" style="background: none; border: none; cursor: pointer; padding: 4px; border-radius: 4px; font-size: 16px;">⚙️</button>
      </div>
    `;
    panel.appendChild(header);

    // Tab navigation
    const tabs = doc.createElement('div');
    tabs.className = 'ai-reader-tabs';
    tabs.style.cssText = `
      display: flex; 
      border-bottom: 1px solid var(--ai-border-color, #e0e0e0); 
      padding: 0 8px;
      background: var(--ai-bg-secondary, #f5f5f5);
    `;
    tabs.innerHTML = `
      <button class="tab-btn active" data-tab="chat" style="flex: 1; padding: 8px 12px; border: none; background: none; cursor: pointer; font-size: 13px; border-bottom: 2px solid var(--ai-accent-color, #0066cc); color: var(--ai-text-primary, #333);">对话</button>
      <button class="tab-btn" data-tab="summary" style="flex: 1; padding: 8px 12px; border: none; background: none; cursor: pointer; font-size: 13px; border-bottom: 2px solid transparent; color: var(--ai-text-secondary, #666);">摘要</button>
      <button class="tab-btn" data-tab="keypoints" style="flex: 1; padding: 8px 12px; border: none; background: none; cursor: pointer; font-size: 13px; border-bottom: 2px solid transparent; color: var(--ai-text-secondary, #666);">要点</button>
    `;
    panel.appendChild(tabs);

    // Tab content
    const tabContent = doc.createElement('div');
    tabContent.className = 'ai-reader-tab-content';
    tabContent.style.cssText = `flex: 1; overflow-y: auto; padding: 12px; background: var(--ai-bg-primary, #ffffff);`;
    tabContent.innerHTML = `
      <div id="chat-tab-${reader.itemID}" class="tab-pane" style="display: flex; flex-direction: column; gap: 12px;">
        <div class="chat-messages" id="chat-messages-${reader.itemID}" style="display: flex; flex-direction: column; gap: 12px;"></div>
      </div>
      <div id="summary-tab-${reader.itemID}" class="tab-pane" style="display: none;">
        <div class="summary-content" id="summary-content-${reader.itemID}">
          <p style="color: var(--ai-text-muted, #888); text-align: center; padding: 20px;">暂无摘要，选择文本后右键生成</p>
        </div>
      </div>
      <div id="keypoints-tab-${reader.itemID}" class="tab-pane" style="display: none;">
        <div class="keypoints-content" id="keypoints-content-${reader.itemID}">
          <p style="color: var(--ai-text-muted, #888); text-align: center; padding: 20px;">暂无要点，选择文本后右键提取</p>
        </div>
      </div>
    `;
    panel.appendChild(tabContent);

    // Input area
    const inputArea = doc.createElement('div');
    inputArea.className = 'ai-reader-input';
    inputArea.style.cssText = `
      display: flex; 
      flex-direction: column;
      gap: 8px; 
      padding: 12px; 
      border-top: 1px solid var(--ai-border-color, #e0e0e0);
      background: var(--ai-bg-secondary, #f5f5f5);
    `;
    inputArea.innerHTML = `
      <textarea id="ai-input-${reader.itemID}" placeholder="输入问题或选择文本后右键..." style="
        flex: 1; 
        resize: none; 
        border: 1px solid var(--ai-input-border, #ccc); 
        border-radius: 6px; 
        padding: 8px; 
        font-size: 13px; 
        min-height: 60px;
        background: var(--ai-input-bg, #fff);
        color: var(--ai-text-primary, #333);
      "></textarea>
      <div style="display: flex; gap: 8px; justify-content: flex-end;">
        <button id="ai-stop-btn-${reader.itemID}" title="停止生成" style="
          padding: 8px 16px; 
          background: var(--ai-button-secondary-bg, #f5f5f5); 
          color: var(--ai-text-primary, #333); 
          border: 1px solid var(--ai-button-secondary-border, #ccc); 
          border-radius: 6px; 
          cursor: pointer;
          display: none;
        ">停止</button>
        <button id="ai-send-btn-${reader.itemID}" title="发送" style="
          padding: 8px 16px; 
          background: var(--ai-button-primary-bg, #0066cc); 
          color: var(--ai-button-primary-text, white); 
          border: none; 
          border-radius: 6px; 
          cursor: pointer;
        ">发送</button>
      </div>
    `;
    panel.appendChild(inputArea);

    // Store panel reference and initialize chat history
    this.panels.set(reader.itemID, panel);
    if (!this.chatHistories.has(reader.itemID)) {
      this.chatHistories.set(reader.itemID, []);
    }

    // Add event listeners
    this.attachPanelEvents(panel, reader);

    return panel;
  }

  /**
   * Inject theme and Markdown styles into document
   */
  private injectStyles(doc: Document): void {
    const styleId = 'ai-reader-styles';
    if (doc.getElementById(styleId)) return;

    const style = doc.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Theme CSS Variables */
      :root {
        --ai-bg-primary: #ffffff;
        --ai-bg-secondary: #f5f5f5;
        --ai-bg-tertiary: #ebebeb;
        --ai-text-primary: #333333;
        --ai-text-secondary: #666666;
        --ai-text-muted: #999999;
        --ai-border-color: #e0e0e0;
        --ai-accent-color: #0066cc;
        --ai-user-bubble-bg: #0066cc;
        --ai-user-bubble-text: #ffffff;
        --ai-assistant-bubble-bg: #f0f0f0;
        --ai-assistant-bubble-text: #333333;
        --ai-input-bg: #ffffff;
        --ai-input-border: #cccccc;
        --ai-button-primary-bg: #0066cc;
        --ai-button-primary-text: #ffffff;
        --ai-button-secondary-bg: #f5f5f5;
        --ai-button-secondary-border: #cccccc;
        --ai-code-bg: #f6f8fa;
        --ai-code-text: #24292e;
        --ai-code-border: #e1e4e8;
        --ai-font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        --ai-font-mono: "SF Mono", Monaco, monospace;
        --ai-font-size-md: 13px;
        --ai-radius-md: 6px;
        --ai-radius-sm: 4px;
      }
      
      @media (prefers-color-scheme: dark) {
        :root {
          --ai-bg-primary: #1e1e1e;
          --ai-bg-secondary: #2d2d2d;
          --ai-bg-tertiary: #3d3d3d;
          --ai-text-primary: #e0e0e0;
          --ai-text-secondary: #a0a0a0;
          --ai-text-muted: #707070;
          --ai-border-color: #444444;
          --ai-accent-color: #4da6ff;
          --ai-assistant-bubble-bg: #3d3d3d;
          --ai-assistant-bubble-text: #e0e0e0;
          --ai-input-bg: #2d2d2d;
          --ai-input-border: #444444;
          --ai-button-secondary-bg: #3d3d3d;
          --ai-button-secondary-border: #555555;
          --ai-code-bg: #2d2d2d;
          --ai-code-text: #e0e0e0;
          --ai-code-border: #444444;
        }
      }

      /* Chat message styles */
      .chat-message {
        max-width: 90%;
        padding: 10px 14px;
        border-radius: 12px;
        line-height: 1.5;
        word-wrap: break-word;
      }
      
      .chat-message.user {
        background: var(--ai-user-bubble-bg);
        color: var(--ai-user-bubble-text);
        align-self: flex-end;
        border-bottom-right-radius: 4px;
      }
      
      .chat-message.assistant {
        background: var(--ai-assistant-bubble-bg);
        color: var(--ai-assistant-bubble-text);
        align-self: flex-start;
        border-bottom-left-radius: 4px;
      }
      
      .chat-message.loading {
        opacity: 0.7;
      }
      
      .chat-message.error {
        background: #ffe6e6;
        color: #cc0000;
      }
      
      @media (prefers-color-scheme: dark) {
        .chat-message.error {
          background: #3d2020;
          color: #ff6b6b;
        }
      }

      /* Markdown styles */
      ${MarkdownRenderer.getStyles()}
    `;
    doc.head.appendChild(style);
  }

  /**
   * Attach event listeners to panel
   */
  private attachPanelEvents(panel: HTMLElement, reader: ZoteroReader): void {
    const itemID = reader.itemID;

    // Tab switching
    const tabButtons = panel.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const tabName = target.dataset.tab;

        // Update active tab button styles
        tabButtons.forEach(b => {
          (b as HTMLElement).style.borderBottomColor = 'transparent';
          (b as HTMLElement).style.color = 'var(--ai-text-secondary, #666)';
        });
        target.style.borderBottomColor = 'var(--ai-accent-color, #0066cc)';
        target.style.color = 'var(--ai-text-primary, #333)';

        // Update active tab pane
        const panes = panel.querySelectorAll('.tab-pane');
        panes.forEach(pane => (pane as HTMLElement).style.display = 'none');
        const activePane = panel.querySelector(`#${tabName}-tab-${itemID}`);
        if (activePane) {
          (activePane as HTMLElement).style.display = 'flex';
        }
      });
    });

    // Send button
    const sendBtn = panel.querySelector(`#ai-send-btn-${itemID}`) as HTMLButtonElement;
    const stopBtn = panel.querySelector(`#ai-stop-btn-${itemID}`) as HTMLButtonElement;
    const inputArea = panel.querySelector(`#ai-input-${itemID}`) as HTMLTextAreaElement;

    sendBtn?.addEventListener('click', () => {
      const message = inputArea?.value.trim();
      if (message && !this.streamingStates.get(itemID)) {
        this.handleUserMessage(reader, message, panel);
        inputArea.value = '';
      }
    });

    // Stop button
    stopBtn?.addEventListener('click', () => {
      this.handleStopGeneration(reader);
    });

    // Enter key to send
    inputArea?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendBtn?.dispatchEvent(new Event('click'));
      }
    });

    // Settings button - open preferences
    const settingsBtn = panel.querySelector(`#ai-settings-btn-${itemID}`);
    settingsBtn?.addEventListener('click', () => {
      try {
        Zotero.Prefs?.openPreferences?.('ai-reader@zoteropatch.com');
      } catch (error) {
        console.error('[ReaderPanelManager] Failed to open preferences:', error);
      }
    });

    // Save button - save chat history to note
    const saveBtn = panel.querySelector(`#ai-save-btn-${itemID}`);
    saveBtn?.addEventListener('click', () => {
      this.handleSaveToNote(reader);
    });

    // Clear button - clear chat history
    const clearBtn = panel.querySelector(`#ai-clear-btn-${itemID}`);
    clearBtn?.addEventListener('click', () => {
      this.handleClearChat(reader, panel);
    });

    console.log('[ReaderPanelManager] Panel events attached');
  }

  /**
   * Handle stop generation
   */
  private handleStopGeneration(reader: ZoteroReader): void {
    const aiReader = Zotero.AIReader as AIReaderGlobalLike | undefined;
    const llmClient = aiReader?.getLLMClient?.();
    if (llmClient) {
      llmClient.abortStream();
    }
    this.streamingStates.set(reader.itemID, false);
    this.updateButtonStates(reader.itemID, false);
    console.log('[ReaderPanelManager] Generation stopped');
  }

  /**
   * Handle save to note
   */
  private async handleSaveToNote(reader: ZoteroReader): Promise<void> {
    const messages = this.chatHistories.get(reader.itemID);
    if (!messages || messages.length === 0) {
      console.log('[ReaderPanelManager] No messages to save');
      return;
    }

    try {
      // Trigger save via NotesSyncService (will be implemented)
      console.log('[ReaderPanelManager] Saving chat history to note...');
      // This will be connected to NotesSyncService
      const event = new CustomEvent('ai-reader-save-chat', {
        detail: { itemID: reader.itemID, messages }
      });
      document.dispatchEvent(event);
    } catch (error) {
      console.error('[ReaderPanelManager] Failed to save to note:', error);
    }
  }

  /**
   * Handle clear chat
   */
  private handleClearChat(reader: ZoteroReader, panel: HTMLElement): void {
    if (!confirm('确定要清除所有对话记录吗？')) return;

    this.chatHistories.set(reader.itemID, []);
    const chatMessages = panel.querySelector(`#chat-messages-${reader.itemID}`);
    if (chatMessages) {
      chatMessages.innerHTML = '';
    }
    console.log('[ReaderPanelManager] Chat cleared');
  }

  /**
   * Update button states based on streaming status
   */
  private updateButtonStates(itemID: number, isStreaming: boolean): void {
    const panel = this.panels.get(itemID);
    if (!panel) return;

    const sendBtn = panel.querySelector(`#ai-send-btn-${itemID}`) as HTMLButtonElement;
    const stopBtn = panel.querySelector(`#ai-stop-btn-${itemID}`) as HTMLButtonElement;

    if (sendBtn) {
      sendBtn.disabled = isStreaming;
      sendBtn.style.opacity = isStreaming ? '0.5' : '1';
    }
    if (stopBtn) {
      stopBtn.style.display = isStreaming ? 'block' : 'none';
    }
  }

  /**
   * Handle user message
   */
  private handleUserMessage(reader: ZoteroReader, message: string, panel: HTMLElement): void {
    console.log(`[ReaderPanelManager] User message for item ${reader.itemID}:`, message);

    const chatMessages = panel.querySelector(`#chat-messages-${reader.itemID}`);
    if (!chatMessages) return;

    // Create user message object
    const userChatMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: Date.now(),
    };

    // Add to chat history
    const history = this.chatHistories.get(reader.itemID) || [];
    history.push(userChatMessage);
    this.chatHistories.set(reader.itemID, history);

    // Add user message to UI
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-message user';
    userMsg.textContent = message;
    chatMessages.appendChild(userMsg);

    // Add loading indicator
    const loadingMsg = document.createElement('div');
    loadingMsg.className = 'chat-message assistant loading';
    loadingMsg.innerHTML = '<span class="loading-dots">正在思考...</span>';
    chatMessages.appendChild(loadingMsg);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Update button states
    this.streamingStates.set(reader.itemID, true);
    this.updateButtonStates(reader.itemID, true);

    // Call LLM (async)
    this.sendToLLM(reader, panel, loadingMsg);
  }

  /**
   * Send message to LLM with streaming support
   */
  private async sendToLLM(
    reader: ZoteroReader,
    panel: HTMLElement,
    loadingElement: HTMLElement
  ): Promise<void> {
    const itemID = reader.itemID;
    const chatMessages = panel.querySelector(`#chat-messages-${itemID}`);
    
    try {
      const aiReader = Zotero.AIReader as AIReaderGlobalLike | undefined;
      const llmClient = aiReader?.getLLMClient?.();
      const configManager = aiReader?.getConfigManager?.();
      
      if (!llmClient) {
        loadingElement.textContent = '请先在设置中配置 API Key';
        loadingElement.classList.add('error');
        loadingElement.classList.remove('loading');
        this.streamingStates.set(itemID, false);
        this.updateButtonStates(itemID, false);
        return;
      }

      const history = this.chatHistories.get(itemID) || [];
      const enableStreaming = configManager?.getConfig()?.enableStreaming ?? true;
      
      // Limit history to configured max
      const maxHistory = configManager?.getConfig()?.maxHistory ?? 10;
      const messagesToSend = history.slice(-maxHistory);

      let fullContent = '';

      if (enableStreaming) {
        // Streaming mode
        const callbacks: StreamCallbacks = {
          onStart: () => {
            loadingElement.textContent = '';
            loadingElement.classList.remove('loading');
          },
          onChunk: (chunk: string) => {
            fullContent += chunk;
            // Render Markdown as content streams in
            loadingElement.innerHTML = this.markdownRenderer.render(fullContent);
            // Scroll to bottom
            if (chatMessages) {
              chatMessages.scrollTop = chatMessages.scrollHeight;
            }
          },
          onComplete: (text: string) => {
            // Final render with Markdown
            loadingElement.innerHTML = this.markdownRenderer.render(text);
            loadingElement.classList.remove('loading');
            
            // Add to chat history
            const assistantMessage: ChatMessage = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: text,
              timestamp: Date.now(),
            };
            history.push(assistantMessage);
            this.chatHistories.set(itemID, history);
            
            // Update states
            this.streamingStates.set(itemID, false);
            this.updateButtonStates(itemID, false);
            
            // Add copy buttons to code blocks
            this.addCopyButtonsToCodeBlocks(loadingElement);
          },
          onError: (error: Error) => {
            console.error('[ReaderPanelManager] Stream error:', error);
            loadingElement.textContent = `请求失败: ${error.message}`;
            loadingElement.classList.add('error');
            loadingElement.classList.remove('loading');
            this.streamingStates.set(itemID, false);
            this.updateButtonStates(itemID, false);
          },
        };

        await llmClient.streamChat(messagesToSend, callbacks);
      } else {
        // Non-streaming mode
        const response = await llmClient.chat(messagesToSend);
        
        // Render with Markdown
        loadingElement.innerHTML = this.markdownRenderer.render(response.content);
        loadingElement.classList.remove('loading');
        
        // Add to chat history
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.content,
          timestamp: Date.now(),
        };
        history.push(assistantMessage);
        this.chatHistories.set(itemID, history);
        
        // Update states
        this.streamingStates.set(itemID, false);
        this.updateButtonStates(itemID, false);
        
        // Add copy buttons to code blocks
        this.addCopyButtonsToCodeBlocks(loadingElement);
      }
    } catch (error) {
      console.error('[ReaderPanelManager] LLM request failed:', error);
      loadingElement.textContent = `请求失败: ${error instanceof Error ? error.message : '未知错误'}`;
      loadingElement.classList.add('error');
      loadingElement.classList.remove('loading');
      this.streamingStates.set(itemID, false);
      this.updateButtonStates(itemID, false);
    }
  }

  /**
   * Add copy buttons to code blocks
   */
  private addCopyButtonsToCodeBlocks(container: HTMLElement): void {
    const copyButtons = container.querySelectorAll('.ai-code-copy');
    copyButtons.forEach(button => {
      button.addEventListener('click', async (e) => {
        const codeBlock = (e.target as HTMLElement).closest('.ai-code-block');
        const code = codeBlock?.querySelector('code')?.textContent || '';
        
        try {
          await navigator.clipboard.writeText(code);
          (e.target as HTMLElement).textContent = '已复制!';
          setTimeout(() => {
            (e.target as HTMLElement).textContent = '复制';
          }, 2000);
        } catch (err) {
          console.error('[ReaderPanelManager] Copy failed:', err);
        }
      });
    });
  }

  /**
   * Get chat history for an item
   */
  getChatHistory(itemID: number): ChatMessage[] {
    return this.chatHistories.get(itemID) || [];
  }

  /**
   * Handle summary request
   */
  private async handleSummaryRequest(reader: ZoteroReader, panel: HTMLElement): Promise<void> {
    console.log(`[ReaderPanelManager] Summary request for item ${reader.itemID}`);

    const summaryContent = panel.querySelector(`#summary-content-${reader.itemID}`);
    if (!summaryContent) return;

    summaryContent.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">正在生成摘要...</p>';

    try {
      const aiReader = Zotero.AIReader as AIReaderGlobalLike | undefined;
      const llmClient = aiReader?.getLLMClient?.();
      if (!llmClient) {
        summaryContent.innerHTML = '<p style="color: #cc0000; text-align: center; padding: 20px;">请先在设置中配置 API Key</p>';
        return;
      }

      // For now, show a placeholder message
      summaryContent.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">请选择文本后使用右键菜单生成摘要</p>';
    } catch (error) {
      console.error('[ReaderPanelManager] Summary request failed:', error);
      summaryContent.innerHTML = `<p style="color: #cc0000; text-align: center; padding: 20px;">生成摘要失败: ${error instanceof Error ? error.message : '未知错误'}</p>`;
    }
  }

  /**
   * Remove panel from reader
   */
  removePanel(reader: ZoteroReader): void {
    const panel = this.panels.get(reader.itemID);
    if (panel) {
      panel.remove();
      this.panels.delete(reader.itemID);
      console.log(`[ReaderPanelManager] Panel removed for item ${reader.itemID}`);
    }
  }

  /**
   * Remove all panels
   */
  removeAllPanels(): void {
    this.panels.forEach(panel => panel.remove());
    this.panels.clear();
    console.log('[ReaderPanelManager] All panels removed');
  }

  /**
   * Get panel count
   */
  getPanelCount(): number {
    return this.panels.size;
  }
}
