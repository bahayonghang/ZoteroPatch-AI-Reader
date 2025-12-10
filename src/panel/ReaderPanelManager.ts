/**
 * Reader Panel Manager
 * Manages AI Assistant panels in Zotero Reader windows
 */

import type { ZoteroReader } from '../types';

interface LLMClientLike {
  chat(messages: { id: string; role: 'user' | 'assistant' | 'system'; content: string; timestamp: number }[]): Promise<{
    content: string;
  }>;
}

interface AIReaderGlobalLike {
  getLLMClient?(): LLMClientLike | null;
}

export class ReaderPanelManager {
  private panels: Map<number, HTMLElement>;

  constructor() {
    this.panels = new Map();
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
    panel.style.cssText = `
      display: flex;
      flex-direction: column;
      height: 100%;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
    `;

    // Panel header
    const header = doc.createElement('div');
    header.className = 'ai-reader-header';
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      border-bottom: 1px solid #e0e0e0;
    `;
    header.innerHTML = `
      <h3 style="margin: 0; font-size: 14px; font-weight: 600;">AI 助手</h3>
      <div class="ai-reader-header-actions" style="display: flex; gap: 4px;">
        <button id="ai-summary-btn-${reader.itemID}" title="生成摘要" style="background: none; border: none; cursor: pointer; padding: 4px; border-radius: 4px; font-size: 16px;">📝</button>
        <button id="ai-settings-btn-${reader.itemID}" title="设置" style="background: none; border: none; cursor: pointer; padding: 4px; border-radius: 4px; font-size: 16px;">⚙️</button>
      </div>
    `;
    panel.appendChild(header);

    // Tab navigation
    const tabs = doc.createElement('div');
    tabs.className = 'ai-reader-tabs';
    tabs.style.cssText = `display: flex; border-bottom: 1px solid #e0e0e0; padding: 0 8px;`;
    tabs.innerHTML = `
      <button class="tab-btn active" data-tab="chat" style="flex: 1; padding: 8px 12px; border: none; background: none; cursor: pointer; font-size: 13px; border-bottom: 2px solid #0066cc;">对话</button>
      <button class="tab-btn" data-tab="summary" style="flex: 1; padding: 8px 12px; border: none; background: none; cursor: pointer; font-size: 13px; border-bottom: 2px solid transparent;">摘要</button>
      <button class="tab-btn" data-tab="keypoints" style="flex: 1; padding: 8px 12px; border: none; background: none; cursor: pointer; font-size: 13px; border-bottom: 2px solid transparent;">要点</button>
    `;
    panel.appendChild(tabs);

    // Tab content
    const tabContent = doc.createElement('div');
    tabContent.className = 'ai-reader-tab-content';
    tabContent.style.cssText = `flex: 1; overflow-y: auto; padding: 12px;`;
    tabContent.innerHTML = `
      <div id="chat-tab-${reader.itemID}" class="tab-pane" style="display: block;">
        <div class="chat-messages" id="chat-messages-${reader.itemID}"></div>
      </div>
      <div id="summary-tab-${reader.itemID}" class="tab-pane" style="display: none;">
        <div class="summary-content" id="summary-content-${reader.itemID}">
          <p style="color: #888; text-align: center; padding: 20px;">暂无摘要，点击上方按钮生成</p>
        </div>
      </div>
      <div id="keypoints-tab-${reader.itemID}" class="tab-pane" style="display: none;">
        <div class="keypoints-content" id="keypoints-content-${reader.itemID}">
          <p style="color: #888; text-align: center; padding: 20px;">暂无要点，选择文本后右键提取</p>
        </div>
      </div>
    `;
    panel.appendChild(tabContent);

    // Input area
    const inputArea = doc.createElement('div');
    inputArea.className = 'ai-reader-input';
    inputArea.style.cssText = `display: flex; gap: 8px; padding: 12px; border-top: 1px solid #e0e0e0;`;
    inputArea.innerHTML = `
      <textarea id="ai-input-${reader.itemID}" placeholder="输入问题或选择文本后右键..." style="flex: 1; resize: none; border: 1px solid #e0e0e0; border-radius: 6px; padding: 8px; font-size: 13px; min-height: 60px;"></textarea>
      <button id="ai-send-btn-${reader.itemID}" title="发送" style="padding: 8px 16px; background: #0066cc; color: white; border: none; border-radius: 6px; cursor: pointer;">发送</button>
    `;
    panel.appendChild(inputArea);

    // Store panel reference
    this.panels.set(reader.itemID, panel);

    // Add event listeners
    this.attachPanelEvents(panel, reader);

    return panel;
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
        });
        target.style.borderBottomColor = '#0066cc';

        // Update active tab pane
        const panes = panel.querySelectorAll('.tab-pane');
        panes.forEach(pane => (pane as HTMLElement).style.display = 'none');
        const activePane = panel.querySelector(`#${tabName}-tab-${itemID}`);
        if (activePane) {
          (activePane as HTMLElement).style.display = 'block';
        }
      });
    });

    // Send button
    const sendBtn = panel.querySelector(`#ai-send-btn-${itemID}`);
    const inputArea = panel.querySelector(`#ai-input-${itemID}`) as HTMLTextAreaElement;

    sendBtn?.addEventListener('click', () => {
      const message = inputArea?.value.trim();
      if (message) {
        this.handleUserMessage(reader, message, panel);
        inputArea.value = '';
      }
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

    // Summary button
    const summaryBtn = panel.querySelector(`#ai-summary-btn-${itemID}`);
    summaryBtn?.addEventListener('click', () => {
      this.handleSummaryRequest(reader, panel);
    });

    console.log('[ReaderPanelManager] Panel events attached');
  }

  /**
   * Handle user message
   */
  private handleUserMessage(reader: ZoteroReader, message: string, panel: HTMLElement): void {
    console.log(`[ReaderPanelManager] User message for item ${reader.itemID}:`, message);

    const chatMessages = panel.querySelector(`#chat-messages-${reader.itemID}`);
    if (!chatMessages) return;

    // Add user message to chat
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-message user';
    userMsg.style.cssText = `
      padding: 8px 12px;
      border-radius: 8px;
      max-width: 90%;
      background: #0066cc;
      color: white;
      align-self: flex-end;
      margin-bottom: 8px;
      margin-left: auto;
    `;
    userMsg.textContent = message;
    chatMessages.appendChild(userMsg);

    // Add loading indicator
    const loadingMsg = document.createElement('div');
    loadingMsg.className = 'chat-message assistant loading';
    loadingMsg.style.cssText = `
      padding: 8px 12px;
      border-radius: 8px;
      max-width: 90%;
      background: #f0f0f0;
      margin-bottom: 8px;
    `;
    loadingMsg.textContent = '正在思考...';
    chatMessages.appendChild(loadingMsg);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Call LLM (async)
    this.sendToLLM(reader, message, panel, loadingMsg);
  }

  /**
   * Send message to LLM
   */
  private async sendToLLM(
    reader: ZoteroReader,
    message: string,
    panel: HTMLElement,
    loadingElement: HTMLElement
  ): Promise<void> {
    try {
      const aiReader = Zotero.AIReader as AIReaderGlobalLike | undefined;
      const llmClient = aiReader?.getLLMClient?.();
      if (!llmClient) {
        loadingElement.textContent = '请先在设置中配置 API Key';
        loadingElement.style.color = '#cc0000';
        return;
      }

      const response = await llmClient.chat([
        { id: Date.now().toString(), role: 'user', content: message, timestamp: Date.now() }
      ]);

      loadingElement.textContent = response.content;
      loadingElement.classList.remove('loading');
    } catch (error) {
      console.error('[ReaderPanelManager] LLM request failed:', error);
      loadingElement.textContent = `请求失败: ${error instanceof Error ? error.message : '未知错误'}`;
      loadingElement.style.color = '#cc0000';
    }
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
