/**
 * Main entry point for Zotero AI Reader Assistant
 * Implements the plugin lifecycle using Zotero 7 APIs
 */

import { ReaderPanelManager } from './panel/ReaderPanelManager';
import { SelectionMenuManager } from './panel/SelectionMenuManager';
import { SessionManager } from './services/SessionManager';
import { ConfigManager } from './services/ConfigManager';
import { LLMClient } from './services/LLMClient';
import { NotesSyncService } from './services/NotesSyncService';
import type { ZoteroReader } from './types';

class AIReaderPlugin {
  private readerPanelManager: ReaderPanelManager;
  private selectionMenuManager: SelectionMenuManager;
  private sessionManager: SessionManager;
  private configManager: ConfigManager;
  private llmClient: LLMClient | null;
  private notesSyncService: NotesSyncService;
  private notifierID: string | null = null;
  private prefsPaneID: string | null = null;
  private readerTabID: string | null = null;
  private unregisterReaderSection: (() => void) | null = null;

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

    // Register preferences pane using Zotero 7 API
    this.registerPreferencesPane();

    // Register Reader sidebar section
    this.registerReaderSidebarSection();

    // Register notifier to track Reader tab open/close
    this.registerNotifier();

    Zotero.debug('[AI Reader] Plugin startup complete');
  }

  /**
   * Register preferences pane in Zotero settings
   */
  private registerPreferencesPane(): void {
    try {
      // Zotero 7 uses Zotero.PreferencePanes.register
      if (Zotero.PreferencePanes && typeof Zotero.PreferencePanes.register === 'function') {
        this.prefsPaneID = Zotero.PreferencePanes.register({
          pluginID: 'ai-reader@zoteropatch.com',
          src: 'chrome://aireader/content/preferences.xhtml',
          label: 'AI Reader',
          image: 'chrome://aireader/skin/icon-32.svg',
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
   * Register Reader sidebar section using Zotero 7 Reader API
   */
  private registerReaderSidebarSection(): void {
    try {
      const readerAPI = Zotero.Reader;
      
      if (!readerAPI) {
        Zotero.debug('[AI Reader] Zotero.Reader not available');
        return;
      }

      Zotero.debug('[AI Reader] Zotero.Reader available, checking for sidebar API...');
      Zotero.debug('[AI Reader] Available Reader methods: ' + Object.keys(readerAPI).join(', '));

      // Zotero 7.0+ uses Zotero.Reader.registerSidebarSection
      if (typeof readerAPI.registerSidebarSection === 'function') {
        Zotero.debug('[AI Reader] Using registerSidebarSection API');
        
        const sectionConfig = {
          paneID: 'ai-reader-pane',
          id: 'ai-reader-section', 
          title: 'AI 助手',
          index: 3,
          icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 5v3l2 2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
          init: this.handleSidebarInit.bind(this),
          destroy: this.handleSidebarDestroy.bind(this),
        };

        this.unregisterReaderSection = readerAPI.registerSidebarSection(sectionConfig);
        Zotero.debug('[AI Reader] Reader sidebar section registered successfully');
        return;
      }

      // Fallback for older API
      if (typeof readerAPI._registerSidebarSection === 'function') {
        Zotero.debug('[AI Reader] Using _registerSidebarSection API (internal)');
        
        this.unregisterReaderSection = readerAPI._registerSidebarSection({
          paneID: 'ai-reader-pane',
          id: 'ai-reader-section',
          title: 'AI 助手',
          init: this.handleSidebarInit.bind(this),
          destroy: this.handleSidebarDestroy.bind(this),
        });
        Zotero.debug('[AI Reader] Reader sidebar section registered via internal API');
        return;
      }

      Zotero.debug('[AI Reader] No sidebar registration API found');
    } catch (error) {
      Zotero.debug('[AI Reader] Failed to register sidebar section: ' + error);
      Zotero.logError(error);
    }
  }

  /**
   * Handle sidebar init callback
   */
  private handleSidebarInit(props: { body: HTMLElement; item?: { id?: number }; tabID: string; reader?: ZoteroReader }): void {
    try {
      Zotero.debug('[AI Reader] Sidebar init called with props: ' + JSON.stringify({
        hasBody: !!props.body,
        hasItem: !!props.item,
        tabID: props.tabID,
        hasReader: !!props.reader
      }));

      const { body, item, tabID } = props;
      
      if (!body) {
        Zotero.debug('[AI Reader] No body element provided');
        return;
      }

      // Get reader instance
      let reader = props.reader;
      if (!reader && tabID) {
        reader = Zotero.Reader.getByTabID?.(tabID);
      }

      if (!reader) {
        Zotero.debug('[AI Reader] Could not get reader instance');
        // Still create a basic panel
        this.createBasicPanel(body, item?.id || 0);
        return;
      }

      // Build panel UI
      const panel = this.readerPanelManager.buildPanelElement(reader);
      body.appendChild(panel);

      // Register selection menu
      this.selectionMenuManager.registerToReader(reader);

      // Create session
      this.sessionManager.createSession(reader.itemID, reader);

      Zotero.debug(`[AI Reader] Sidebar panel initialized for item ${reader.itemID}`);
    } catch (error) {
      Zotero.debug('[AI Reader] Failed to init sidebar panel: ' + error);
      Zotero.logError(error);
    }
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
      <h3 style="margin: 0 0 16px 0; font-size: 16px;">AI 助手</h3>
      <p style="color: #666; margin: 0;">请在设置中配置 API Key 后使用</p>
      <button id="ai-open-settings-${itemID}" style="margin-top: 16px; padding: 8px 16px; cursor: pointer;">
        打开设置
      </button>
    `;
    
    container.appendChild(panel);

    // Add click handler for settings button
    const settingsBtn = panel.querySelector(`#ai-open-settings-${itemID}`);
    settingsBtn?.addEventListener('click', () => {
      Zotero.Utilities.Internal?.openPreferences?.('ai-reader@zoteropatch.com');
    });
  }

  /**
   * Handle sidebar destroy callback
   */
  private handleSidebarDestroy(props: { body: HTMLElement; tabID: string; reader?: ZoteroReader }): void {
    try {
      Zotero.debug('[AI Reader] Sidebar destroy called');
      
      let reader = props.reader;
      if (!reader && props.tabID) {
        reader = Zotero.Reader.getByTabID?.(props.tabID);
      }

      if (reader) {
        this.readerPanelManager.removePanel(reader);
        this.selectionMenuManager.unregisterFromReader(reader);
        this.sessionManager.removeSession(reader.itemID);
        Zotero.debug(`[AI Reader] Sidebar panel destroyed for item ${reader.itemID}`);
      }
    } catch (error) {
      Zotero.debug('[AI Reader] Failed to destroy sidebar panel: ' + error);
    }
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

    // Unregister reader sidebar section
    if (this.unregisterReaderSection) {
      try {
        this.unregisterReaderSection();
        this.unregisterReaderSection = null;
        Zotero.debug('[AI Reader] Reader sidebar section unregistered');
      } catch (e) {
        Zotero.debug('[AI Reader] Error unregistering sidebar: ' + e);
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
