/**
 * Reader Panel Manager
 * Manages AI Assistant panels in Zotero Reader windows
 */

import type { ZoteroReader } from '../types';

export class ReaderPanelManager {
  private panels: Map<number, HTMLElement>;

  constructor() {
    this.panels = new Map();
    console.log('[ReaderPanelManager] Initialized');
  }

  /**
   * Create and register panel for a reader
   */
  async createPanel(reader: ZoteroReader): Promise<void> {
    try {
      if (this.panels.has(reader.itemID)) {
        console.warn(`[ReaderPanelManager] Panel already exists for item ${reader.itemID}`);
        return;
      }

      // Create panel UI
      const panel = this.buildPanelUI(reader);

      // Register panel to reader window
      this.registerPanel(reader, panel);

      // Store panel reference
      this.panels.set(reader.itemID, panel);

      console.log(`[ReaderPanelManager] Panel created for item ${reader.itemID}`);
    } catch (error) {
      console.error('[ReaderPanelManager] Failed to create panel:', error);
      throw error;
    }
  }

  /**
   * Build panel UI structure
   */
  private buildPanelUI(reader: ZoteroReader): HTMLElement {
    const panel = document.createElement('div');
    panel.id = `ai-reader-panel-${reader.itemID}`;
    panel.className = 'ai-reader-panel';

    // Panel header
    const header = document.createElement('div');
    header.className = 'ai-reader-header';
    header.innerHTML = `
      <h3>AI 助手</h3>
      <div class="ai-reader-header-actions">
        <button id="ai-summary-btn" title="生成摘要">📝</button>
        <button id="ai-settings-btn" title="设置">⚙️</button>
      </div>
    `;
    panel.appendChild(header);

    // Tab navigation
    const tabs = document.createElement('div');
    tabs.className = 'ai-reader-tabs';
    tabs.innerHTML = `
      <button class="tab-btn active" data-tab="chat">对话</button>
      <button class="tab-btn" data-tab="summary">摘要</button>
      <button class="tab-btn" data-tab="keypoints">要点</button>
    `;
    panel.appendChild(tabs);

    // Tab content
    const tabContent = document.createElement('div');
    tabContent.className = 'ai-reader-tab-content';
    tabContent.innerHTML = `
      <div id="chat-tab" class="tab-pane active">
        <div class="chat-messages" id="chat-messages"></div>
      </div>
      <div id="summary-tab" class="tab-pane">
        <div class="summary-content" id="summary-content">
          <p class="placeholder">暂无摘要，点击上方按钮生成</p>
        </div>
      </div>
      <div id="keypoints-tab" class="tab-pane">
        <div class="keypoints-content" id="keypoints-content">
          <p class="placeholder">暂无要点，选择文本后右键提取</p>
        </div>
      </div>
    `;
    panel.appendChild(tabContent);

    // Input area
    const inputArea = document.createElement('div');
    inputArea.className = 'ai-reader-input';
    inputArea.innerHTML = `
      <textarea id="ai-input" placeholder="输入问题或选择文本后右键..."></textarea>
      <button id="ai-send-btn" title="发送">发送</button>
    `;
    panel.appendChild(inputArea);

    // Add event listeners
    this.attachPanelEvents(panel, reader);

    return panel;
  }

  /**
   * Register panel to reader window
   */
  private registerPanel(reader: ZoteroReader, panel: HTMLElement): void {
    try {
      const readerWindow = reader._window;
      if (!readerWindow) {
        throw new Error('Reader window not found');
      }

      // TODO: Use Zotero 7 official API to register custom sidebar panel
      // For now, we'll append to the reader window as a placeholder
      const sidebarContainer = readerWindow.document.querySelector('.reader-sidebar')
        || readerWindow.document.body;

      if (sidebarContainer) {
        sidebarContainer.appendChild(panel);
        console.log(`[ReaderPanelManager] Panel registered to reader window`);
      } else {
        console.warn('[ReaderPanelManager] Sidebar container not found');
      }
    } catch (error) {
      console.error('[ReaderPanelManager] Failed to register panel:', error);
      throw error;
    }
  }

  /**
   * Attach event listeners to panel
   */
  private attachPanelEvents(panel: HTMLElement, reader: ZoteroReader): void {
    // Tab switching
    const tabButtons = panel.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const tabName = target.dataset.tab;

        // Update active tab
        tabButtons.forEach(b => b.classList.remove('active'));
        target.classList.add('active');

        // Update active tab pane
        const panes = panel.querySelectorAll('.tab-pane');
        panes.forEach(pane => pane.classList.remove('active'));
        panel.querySelector(`#${tabName}-tab`)?.classList.add('active');
      });
    });

    // Send button
    const sendBtn = panel.querySelector('#ai-send-btn');
    const inputArea = panel.querySelector('#ai-input') as HTMLTextAreaElement;

    sendBtn?.addEventListener('click', () => {
      const message = inputArea?.value.trim();
      if (message) {
        this.handleUserMessage(reader, message);
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

    console.log('[ReaderPanelManager] Panel events attached');
  }

  /**
   * Handle user message
   */
  private handleUserMessage(reader: ZoteroReader, message: string): void {
    console.log(`[ReaderPanelManager] User message for item ${reader.itemID}:`, message);
    // TODO: Send to LLM service and update chat
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
