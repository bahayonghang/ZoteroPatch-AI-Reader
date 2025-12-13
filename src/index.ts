/**
 * Main entry point for Zotero AI Reader Assistant
 * Implements the plugin lifecycle using Zotero 7/8 APIs
 */

import { ReaderPanelManager } from './panel/ReaderPanelManager';
import { SelectionMenuManager } from './panel/SelectionMenuManager';
import { SessionManager } from './services/SessionManager';
import { ConfigManager } from './services/ConfigManager';
import { LLMClient } from './services/LLMClient';
import { NotesSyncService } from './services/NotesSyncService';
import type { ChatMessage, ReaderEventForType, ZoteroReader } from './types';

// Plugin ID constant
const PLUGIN_ID = 'ai-reader@zoteropatch.com';

class AIReaderPlugin {
  private readerPanelManager: ReaderPanelManager;
  private selectionMenuManager: SelectionMenuManager;
  private sessionManager: SessionManager;
  private configManager: ConfigManager;
  private llmClient: LLMClient | null;
  private notesSyncService: NotesSyncService;
  private notifierID: string | null = null;
  private prefsPaneID: string | null = null;
  private itemPaneSectionID: string | null = null;
  private readerEventListeners: Array<() => void> = [];

  constructor() {
    this.readerPanelManager = new ReaderPanelManager();
    this.selectionMenuManager = new SelectionMenuManager();
    this.sessionManager = new SessionManager();
    this.configManager = new ConfigManager();
    this.llmClient = null;
    this.notesSyncService = new NotesSyncService();

    Zotero.debug('[AI Reader] Plugin instance created');
  }

  /**
   * Startup - called by bootstrap.js
   */
  async startup(): Promise<void> {
    Zotero.debug('[AI Reader] Starting up plugin...');

    // Wait for Zotero to be ready
    if (Zotero.uiReadyPromise) {
      await Zotero.uiReadyPromise;
    }

    // Initialize configuration
    await this.configManager.load();

    // Initialize LLM client
    const config = this.configManager.getConfig();
    if (config.apiKey) {
      this.llmClient = new LLMClient({
        apiKey: config.apiKey,
        apiEndpoint: config.apiEndpoint,
        model: config.model,
        temperature: config.temperature,
      });
    }

    // Register localization resources for l10n IDs used in plugin UI
    this.registerLocalizationResources();

    // Register preferences pane in Zotero settings
    await this.registerPreferencesPane();

    // Register Item Pane section (for sidebar in item view)
    this.registerItemPaneSection();

    // Register Reader event listeners (for text selection popup)
    this.registerReaderEventListeners();

    // Register notifier to track Reader tab open/close
    this.registerNotifier();

    Zotero.debug('[AI Reader] Plugin startup complete');
  }

  /**
   * Register preferences pane in Zotero settings
   */
  private registerLocalizationResources(): void {
    try {
      const resourceId = 'chrome://aireader/locale/aireader.ftl';
      const windows = typeof Zotero.getMainWindows === 'function'
        ? Zotero.getMainWindows()
        : (typeof Zotero.getMainWindow === 'function' ? [Zotero.getMainWindow()] : []);

      windows.forEach(win => {
        try {
          win?.document?.l10n?.addResourceIds([resourceId]);
        } catch (_e) {
          // Ignore per-window l10n failures
        }
      });

      Zotero.debug('[AI Reader] Localization resources registered');
    } catch (error) {
      Zotero.debug('[AI Reader] Failed to register localization resources: ' + error);
    }
  }

  /**
   * Register preferences pane in Zotero settings
   */
  private async registerPreferencesPane(): Promise<void> {
    try {
      // Zotero 7 uses Zotero.PreferencePanes.register
      if (Zotero.PreferencePanes && typeof Zotero.PreferencePanes.register === 'function') {
        this.prefsPaneID = await Zotero.PreferencePanes.register({
          pluginID: PLUGIN_ID,
          // Relative to plugin root
          src: 'chrome/content/preferences.xhtml',
          label: 'AI Reader',
          // Relative to plugin root
          image: 'skin/icon-32.svg',
          defaultXUL: false,
        });
        Zotero.debug('[AI Reader] Preferences pane registered with ID: ' + this.prefsPaneID);
      } else {
        Zotero.debug('[AI Reader] Zotero.PreferencePanes.register not available');
      }
    } catch (error) {
      Zotero.debug('[AI Reader] Failed to register preferences pane: ' + error);
      Zotero.logError(error);
    }
  }

  /**
   * Register Item Pane section using Zotero 7/8 ItemPaneManager API
   * This creates a sidebar section in the item detail view
   */
  private registerItemPaneSection(): void {
    try {
      // Check for ItemPaneManager API (Zotero 7+)
      if (Zotero.ItemPaneManager && typeof Zotero.ItemPaneManager.registerSection === 'function') {
        Zotero.debug('[AI Reader] Using ItemPaneManager.registerSection API');

        const sectionID = Zotero.ItemPaneManager.registerSection({
          paneID: 'ai-reader-section',
          pluginID: PLUGIN_ID,
          header: {
            l10nID: 'ai-reader-header',
            icon: 'chrome://aireader/skin/icon-16.svg',
            darkIcon: 'chrome://aireader/skin/icon-16-dark.svg',
          },
          sidenav: {
            l10nID: 'ai-reader-sidenav',
            icon: 'chrome://aireader/skin/icon-16.svg',
            darkIcon: 'chrome://aireader/skin/icon-16-dark.svg',
          },
          bodyXHTML: '<div id="ai-reader-container"></div>',
          onInit: this.handleItemPaneSectionInit.bind(this),
          onDestroy: this.handleItemPaneSectionDestroy.bind(this),
          onItemChange: this.handleItemPaneSectionItemChange.bind(this),
        });

        if (!sectionID) {
          Zotero.debug('[AI Reader] Item pane section registration failed, falling back');
          this.registerLegacyReaderIntegration();
          return;
        }

        this.itemPaneSectionID = sectionID;
        Zotero.debug('[AI Reader] Item pane section registered with ID: ' + this.itemPaneSectionID);
        return;
      }

      // Fallback: Try legacy approach with direct DOM manipulation for older versions
      Zotero.debug('[AI Reader] ItemPaneManager not available, using fallback approach');
      this.registerLegacyReaderIntegration();

    } catch (error) {
      Zotero.debug('[AI Reader] Failed to register item pane section: ' + error);
      Zotero.logError(error);
    }
  }

  /**
   * Legacy approach for reader integration when ItemPaneManager is not available
   * Uses Notifier to detect when PDF tabs are opened
   */
  private registerLegacyReaderIntegration(): void {
    Zotero.debug('[AI Reader] Setting up legacy reader integration');

    // This will be handled through the notifier system
    // When a PDF tab is opened, we'll inject our panel directly
  }

  private findOpenReaderByItemID(itemID: number): ZoteroReader | null {
    try {
      // Not part of the public API, but available in Zotero 7/8
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const readers = (Zotero.Reader as any)?._readers as ZoteroReader[] | undefined;
      return readers?.find(r => r?.itemID === itemID) || null;
    } catch {
      return null;
    }
  }

  /**
   * Handle Item Pane section init callback
   */
  private handleItemPaneSectionInit(props: {
    body: HTMLElement;
    item: { id?: number } | null;
    editable: boolean;
    tabType: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    refresh: () => Promise<any>;
  }): void {
    try {
      const { body, item, tabType } = props;

      Zotero.debug('[AI Reader] Item pane section init - tabType: ' + tabType + ', itemID: ' + (item?.id || 'none'));

      if (!body) {
        Zotero.debug('[AI Reader] No body element provided');
        return;
      }

      // Get container element
      const container = body.querySelector('#ai-reader-container') || body;

      // Get the item ID
      const itemID = item?.id;
      if (!itemID) {
        this.createConfigurePanel(container as HTMLElement);
        return;
      }

      const reader = tabType === 'reader' ? this.findOpenReaderByItemID(itemID) : null;

      if (reader) {
        const panelReader = reader._window
          ? reader
          : ({ itemID, _window: body.ownerDocument.defaultView } as unknown as ZoteroReader);

        // Build full panel UI with reader
        const panel = this.readerPanelManager.buildPanelElement(panelReader);
        container.appendChild(panel);

        // Register selection menu
        try {
          this.selectionMenuManager.registerToReader(reader);
        } catch (e) {
          Zotero.debug('[AI Reader] Failed to register selection menu: ' + e);
        }

        // Create session
        this.sessionManager.createSession(reader.itemID, reader);

        Zotero.debug(`[AI Reader] Full panel initialized for reader item ${itemID}`);
      } else {
        // Create basic panel for non-reader context
        this.createBasicPanel(container as HTMLElement, itemID);
        Zotero.debug(`[AI Reader] Basic panel initialized for item ${itemID}`);
      }

    } catch (error) {
      Zotero.debug('[AI Reader] Failed to init item pane section: ' + error);
      Zotero.logError(error);
    }
  }

  /**
   * Handle Item Pane section destroy callback
   */
  private handleItemPaneSectionDestroy(): void {
    try {
      Zotero.debug('[AI Reader] Item pane section destroy called');
      // Cleanup is handled per-panel in handleItemPaneSectionItemChange
    } catch (error) {
      Zotero.debug('[AI Reader] Failed to destroy item pane section: ' + error);
    }
  }

  /**
   * Handle item change in Item Pane section
   */
  private handleItemPaneSectionItemChange(props: {
    body: HTMLElement;
    item: { id?: number } | null;
    tabType: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    refresh: () => Promise<any>;
  }): void {
    try {
      const { body, item, tabType } = props;
      const oldItemID = body.dataset.currentItemId;
      const newItemID = item?.id?.toString();

      Zotero.debug(`[AI Reader] Item change - old: ${oldItemID}, new: ${newItemID}`);

      // Cleanup old item
      if (oldItemID) {
        const oldID = parseInt(oldItemID, 10);
        this.sessionManager.removeSession(oldID);
      }

      // Clear container
      const container = body.querySelector('#ai-reader-container') || body;
      container.innerHTML = '';

      // Store current item ID
      if (newItemID) {
        body.dataset.currentItemId = newItemID;
      } else {
        delete body.dataset.currentItemId;
      }

      // Re-initialize with new item
      this.handleItemPaneSectionInit({ body, item, tabType, editable: false, refresh: props.refresh });

    } catch (error) {
      Zotero.debug('[AI Reader] Failed to handle item change: ' + error);
    }
  }

  /**
   * Register Reader event listeners for text selection popup
   */
  private registerReaderEventListeners(): void {
    try {
      const readerAPI = Zotero.Reader;

      if (!readerAPI) {
        Zotero.debug('[AI Reader] Zotero.Reader not available');
        return;
      }

      // Check for registerEventListener API
      if (typeof readerAPI.registerEventListener !== 'function' || typeof readerAPI.unregisterEventListener !== 'function') {
        Zotero.debug('[AI Reader] Zotero.Reader.registerEventListener not available');
        Zotero.debug('[AI Reader] Available Reader methods: ' + Object.keys(readerAPI).join(', '));
        return;
      }

      Zotero.debug('[AI Reader] Registering reader event listeners...');

      const registerEventListener = readerAPI.registerEventListener.bind(readerAPI);
      const unregisterEventListener = readerAPI.unregisterEventListener.bind(readerAPI);

      // Register text selection popup handler
      const onRenderTextSelectionPopup = (event: ReaderEventForType<'renderTextSelectionPopup'>): void => {
        try {
          const selectedText = event?.params?.annotation?.text;
          if (!selectedText || selectedText.trim().length === 0) return;
          this.renderTextSelectionActions(event.reader, event.doc, selectedText, event.append);
        } catch (e) {
          Zotero.debug('[AI Reader] Failed to handle renderTextSelectionPopup: ' + e);
        }
      };

      registerEventListener('renderTextSelectionPopup', onRenderTextSelectionPopup, PLUGIN_ID);
      this.readerEventListeners.push(() => {
        try {
          unregisterEventListener('renderTextSelectionPopup', onRenderTextSelectionPopup);
        } catch (e) {
          Zotero.debug('[AI Reader] Failed to unregister renderTextSelectionPopup: ' + e);
        }
      });
      Zotero.debug('[AI Reader] Text selection popup handler registered');

    } catch (error) {
      Zotero.debug('[AI Reader] Failed to register reader event listeners: ' + error);
      Zotero.logError(error);
    }
  }

  /**
   * Render actions in text selection popup
   */
  private renderTextSelectionActions(
    reader: ZoteroReader,
    doc: Document,
    selectedText: string,
    append: (...node: Array<Node | string>) => void
  ): void {
    try {
      if (!selectedText || selectedText.trim().length === 0) {
        return;
      }

      Zotero.debug('[AI Reader] Rendering text selection actions for: ' + selectedText.substring(0, 50) + '...');

      // Create AI actions container
      const container = doc.createElement('div');
      container.className = 'ai-reader-selection-actions';
      container.style.cssText = 'display: flex; gap: 4px; padding: 4px 0; border-top: 1px solid #eee; margin-top: 4px;';

      const config = this.configManager.getConfig();
      const actions = [
        { id: 'translate', label: '翻译', enabled: config.enableTranslation },
        { id: 'explain', label: '解释', enabled: config.enableQA },
        { id: 'summarize', label: '摘要', enabled: config.enableSummary },
      ];

      actions.forEach(action => {
        if (!action.enabled) return;

        const button = doc.createElement('button');
        button.textContent = action.label;
        button.className = 'ai-reader-action-btn';
        button.style.cssText = `
          padding: 4px 8px;
          font-size: 12px;
          border: 1px solid #ccc;
          border-radius: 4px;
          background: #fff;
          cursor: pointer;
        `;

        button.addEventListener('click', () => {
          this.handleSelectionAction(action.id, selectedText, reader);
        });

        container.appendChild(button);
      });

      if (container.children.length > 0) {
        append(container);
      }

    } catch (error) {
      Zotero.debug('[AI Reader] Failed to render text selection actions: ' + error);
    }
  }

  /**
   * Handle selection action (translate, explain, summarize)
   */
  private async handleSelectionAction(action: string, text: string, reader: ZoteroReader): Promise<void> {
    try {
      Zotero.debug(`[AI Reader] Handling selection action: ${action}`);

      if (!this.llmClient) {
        Zotero.debug('[AI Reader] LLM client not initialized');
        // Show notification to configure API
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (Zotero as any).ProgressWindowSet?.add?.({
          title: 'AI Reader',
          text: '请先在设置中配置 API Key',
          type: 'warning'
        });
        return;
      }

      // Get or create session
      let session = this.sessionManager.getSession(reader.itemID);
      if (!session) {
        this.sessionManager.createSession(reader.itemID, reader);
        session = this.sessionManager.getSession(reader.itemID);
      }

      // Build prompt based on action
      let prompt = '';
      switch (action) {
        case 'translate':
          prompt = `请将以下文本翻译成${this.configManager.getConfig().defaultLanguage === 'en' ? '英文' : '中文'}:\n\n${text}`;
          break;
        case 'explain':
          prompt = `请解释以下内容:\n\n${text}`;
          break;
        case 'summarize':
          prompt = `请总结以下内容的要点:\n\n${text}`;
          break;
        default:
          prompt = text;
      }

      // Send to LLM (this will be displayed in the panel if available)
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: prompt,
        timestamp: Date.now(),
      };
      const response = await this.llmClient.chat([userMessage]);

      // Add to session history
      if (session) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.content,
          timestamp: Date.now(),
        };

        this.sessionManager.addMessage(reader.itemID, userMessage);
        this.sessionManager.addMessage(reader.itemID, assistantMessage);
      }

      Zotero.debug('[AI Reader] Selection action completed');

    } catch (error) {
      Zotero.debug('[AI Reader] Failed to handle selection action: ' + error);
    }
  }

  /**
   * Create annotation context menu items
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private createAnnotationContextMenuItems(_reader: ZoteroReader, _params: any, _showMenu: (items: any[]) => void): void {
    // This can be extended to add context menu items for annotations
    Zotero.debug('[AI Reader] Annotation context menu triggered');
  }

  /**
   * Create a basic panel when reader is not available
   */
  private createBasicPanel(container: HTMLElement, itemID: number): void {
    const panel = container.ownerDocument.createElement('div');
    panel.id = `ai-reader-panel-${itemID}`;
    panel.style.cssText = `
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;
    panel.innerHTML = `
      <h3 style="margin: 0 0 16px 0; font-size: 16px; color: var(--fill-primary, #333);">AI 助手</h3>
      <p style="color: var(--fill-secondary, #666); margin: 0 0 16px 0; font-size: 13px;">
        在 PDF 阅读器中选中文本以使用 AI 功能
      </p>
      <button id="ai-open-settings-${itemID}" style="
        padding: 8px 16px;
        cursor: pointer;
        border: 1px solid var(--fill-quinary, #ccc);
        border-radius: 6px;
        background: var(--material-background, #fff);
        color: var(--fill-primary, #333);
        font-size: 13px;
      ">
        打开设置
      </button>
    `;

    container.appendChild(panel);

    // Add click handler for settings button
    const settingsBtn = panel.querySelector(`#ai-open-settings-${itemID}`);
    settingsBtn?.addEventListener('click', () => {
      Zotero.Utilities.Internal?.openPreferences?.(PLUGIN_ID);
    });
  }

  /**
   * Create configure panel when no item is selected
   */
  private createConfigurePanel(container: HTMLElement): void {
    const panel = container.ownerDocument.createElement('div');
    panel.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 16px;
      text-align: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;
    panel.innerHTML = `
      <p style="color: var(--fill-secondary, #666); margin: 0; font-size: 13px;">
        选择一个项目以使用 AI 助手
      </p>
    `;

    container.appendChild(panel);
  }

  /**
   * Register Zotero notifier to track events
   */
  private registerNotifier(): void {
    try {
      this.notifierID = Zotero.Notifier.registerObserver(
        {
          notify: async (event: string, type: string, ids: number[], _extraData: unknown) => {
            if (type === 'tab') {
              Zotero.debug(`[AI Reader] Tab event: ${event}, ids: ${ids}`);
            }
          },
        },
        ['tab'],
        'AIReader'
      );
      Zotero.debug('[AI Reader] Notifier registered with ID: ' + this.notifierID);
    } catch (error) {
      Zotero.debug('[AI Reader] Failed to register notifier: ' + error);
    }
  }

  /**
   * Shutdown - called by bootstrap.js
   */
  async shutdown(): Promise<void> {
    Zotero.debug('[AI Reader] Shutting down plugin...');

    // Unregister reader event listeners
    this.readerEventListeners.forEach(unregister => {
      try {
        unregister();
      } catch (e) {
        Zotero.debug('[AI Reader] Error unregistering event listener: ' + e);
      }
    });
    this.readerEventListeners = [];

    // Unregister item pane section
    if (this.itemPaneSectionID && Zotero.ItemPaneManager?.unregisterSection) {
      try {
        Zotero.ItemPaneManager.unregisterSection(this.itemPaneSectionID);
        this.itemPaneSectionID = null;
        Zotero.debug('[AI Reader] Item pane section unregistered');
      } catch (e) {
        Zotero.debug('[AI Reader] Error unregistering item pane section: ' + e);
      }
    }

    // Unregister notifier
    if (this.notifierID) {
      Zotero.Notifier.unregisterObserver(this.notifierID);
      this.notifierID = null;
    }

    // Clean up reader panels
    this.readerPanelManager.removeAllPanels();

    // Clean up selection menus
    this.selectionMenuManager.clearAll();

    // Clear session data
    this.sessionManager.clearAll();

    // Clear LLM client
    this.llmClient = null;

    Zotero.debug('[AI Reader] Plugin shutdown complete');
  }

  /**
   * Get LLM client instance
   */
  getLLMClient(): LLMClient | null {
    return this.llmClient;
  }

  /**
   * Get config manager
   */
  getConfigManager(): ConfigManager {
    return this.configManager;
  }
}

// Export plugin instance to global Zotero namespace
if (typeof Zotero !== 'undefined') {
  Zotero.AIReader = new AIReaderPlugin();
}

export default AIReaderPlugin;
