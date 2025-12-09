/**
 * Main entry point for Zotero AI Reader Assistant
 * Implements the plugin lifecycle and window management
 */

import { ReaderPanelManager } from './panel/ReaderPanelManager';
import { SelectionMenuManager } from './panel/SelectionMenuManager';
import { SessionManager } from './services/SessionManager';
import { ConfigManager } from './services/ConfigManager';
import { LLMClient } from './services/LLMClient';
import { NotesSyncService } from './services/NotesSyncService';
import { PreferencesPanel } from './prefs/PreferencesPanel';
import type { ZoteroReader, WindowListener } from './types';

class AIReaderPlugin {
  private readerPanelManager: ReaderPanelManager;
  private selectionMenuManager: SelectionMenuManager;
  private sessionManager: SessionManager;
  private configManager: ConfigManager;
  private llmClient: LLMClient | null;
  private notesSyncService: NotesSyncService;
  private preferencesPanel: PreferencesPanel;
  private windowListeners: Map<Window, EventListener>;
  private serviceWindowListener: WindowListener | null;

  constructor() {
    this.readerPanelManager = new ReaderPanelManager();
    this.selectionMenuManager = new SelectionMenuManager();
    this.sessionManager = new SessionManager();
    this.configManager = new ConfigManager();
    this.llmClient = null;
    this.notesSyncService = new NotesSyncService();
    this.preferencesPanel = new PreferencesPanel();
    this.windowListeners = new Map();
    this.serviceWindowListener = null;

    console.log('[AI Reader] Plugin instance created');
  }

  /**
   * Startup - called by bootstrap.js
   */
  async startup(): Promise<void> {
    console.log('[AI Reader] Starting up plugin...');

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

    // Register preferences panel
    this.preferencesPanel.register();

    // Register window listeners for Reader windows
    this.registerWindowListeners();

    // Register to existing Reader windows (if any)
    await this.registerExistingReaders();

    console.log('[AI Reader] Plugin startup complete');
  }

  /**
   * Shutdown - called by bootstrap.js
   */
  async shutdown(): Promise<void> {
    console.log('[AI Reader] Shutting down plugin...');

    // Remove all window listeners
    this.unregisterWindowListeners();

    // Clean up reader panels
    this.readerPanelManager.removeAllPanels();

    // Clean up selection menus
    this.selectionMenuManager.clearAll();

    // Clear session data
    this.sessionManager.clearAll();

    // Clear LLM client
    this.llmClient = null;

    console.log('[AI Reader] Plugin shutdown complete');
  }

  /**
   * Register window listeners to detect Reader window creation
   */
  private registerWindowListeners(): void {
    this.serviceWindowListener = {
      onOpenWindow: (xulWindow) => {
        const window = xulWindow.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
          .getInterface(Components.interfaces.nsIDOMWindow);

        // Wait for window load
        const loadListener = () => {
          this.onWindowLoad(window);
        };
        window.addEventListener('load', loadListener, { once: true });

        // Store the listener for cleanup
        this.windowListeners.set(window, loadListener);
      },
    };

    Services.wm.addListener(this.serviceWindowListener);
  }

  /**
   * Handle window load event
   */
  private async onWindowLoad(window: Window): Promise<void> {
    // Check if this is a Reader window
    if (this.isReaderWindow(window)) {
      console.log('[AI Reader] Reader window detected');
      await this.addToWindow(window);
    }
  }

  /**
   * Check if window is a Reader window
   */
  private isReaderWindow(window: Window): boolean {
    // Zotero Reader window detection
    return window.location?.href?.includes('reader.html') ?? false;
  }

  /**
   * Register to existing Reader windows
   */
  private async registerExistingReaders(): Promise<void> {
    const windows = Services.wm.getEnumerator('navigator:browser');
    while (windows.hasMoreElements()) {
      const window = windows.getNext();
      if (this.isReaderWindow(window)) {
        await this.addToWindow(window);
      }
    }
  }

  /**
   * Add AI Reader panel to a Reader window
   */
  private async addToWindow(window: Window): Promise<void> {
    try {
      // Get reader instance from window
      const reader = this.getReaderFromWindow(window);
      if (!reader) {
        console.warn('[AI Reader] Could not get reader instance from window');
        return;
      }

      // Create and register panel
      await this.readerPanelManager.createPanel(reader);

      // Register selection menu
      this.selectionMenuManager.registerToReader(reader);

      // Initialize session for this reader
      this.sessionManager.createSession(reader.itemID, reader);

      console.log(`[AI Reader] Panel added to reader for item ${reader.itemID}`);
    } catch (error) {
      console.error('[AI Reader] Failed to add panel to window:', error);
    }
  }

  /**
   * Remove AI Reader panel from a Reader window
   */
  private async removeFromWindow(window: Window): Promise<void> {
    try {
      const reader = this.getReaderFromWindow(window);
      if (reader) {
        this.readerPanelManager.removePanel(reader);
        this.selectionMenuManager.unregisterFromReader(reader);
        this.sessionManager.removeSession(reader.itemID);
        console.log(`[AI Reader] Panel removed from reader for item ${reader.itemID}`);
      }
    } catch (error) {
      console.error('[AI Reader] Failed to remove panel from window:', error);
    }
  }

  /**
   * Get Reader instance from window
   */
  private getReaderFromWindow(window: Window): ZoteroReader | null {
    try {
      // Access Zotero Reader instance from window
      // This depends on Zotero's internal structure
      const readers = window.Zotero?.Reader?._readers;
      return (readers && readers.length > 0) ? readers[0] : null;
    } catch (error) {
      console.error('[AI Reader] Failed to get reader from window:', error);
      return null;
    }
  }

  /**
   * Unregister all window listeners
   */
  private unregisterWindowListeners(): void {
    // Remove window load listeners
    this.windowListeners.forEach((listener, window) => {
      window.removeEventListener('load', listener);
    });
    this.windowListeners.clear();

    // Remove service window listener
    if (this.serviceWindowListener) {
      Services.wm.removeListener(this.serviceWindowListener);
      this.serviceWindowListener = null;
    }
  }
}

// Export plugin instance to global Zotero namespace
if (typeof Zotero !== 'undefined') {
  Zotero.AIReader = new AIReaderPlugin();
}

export default AIReaderPlugin;
