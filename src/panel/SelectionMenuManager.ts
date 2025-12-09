/**
 * Selection Menu Manager
 * Manages text selection popup menu actions in Reader
 */

import type { ZoteroReader } from '../types';

export interface SelectionAction {
  id: string;
  label: string;
  icon?: string;
  handler: (text: string, reader: ZoteroReader) => void;
}

export class SelectionMenuManager {
  private actions: Map<string, SelectionAction>;
  private registeredReaders: Set<number>;

  constructor() {
    this.actions = new Map();
    this.registeredReaders = new Set();
    console.log('[SelectionMenuManager] Initialized');

    // Register default actions
    this.registerDefaultActions();
  }

  /**
   * Register default selection actions
   */
  private registerDefaultActions(): void {
    this.registerAction({
      id: 'translate',
      label: '翻译',
      icon: '🌐',
      handler: (text, reader) => {
        console.log('[SelectionMenuManager] Translate action:', text);
        // TODO: Send to translation service
        this.notifyPanel(reader, 'translate', text);
      },
    });

    this.registerAction({
      id: 'explain',
      label: '解释',
      icon: '💡',
      handler: (text, reader) => {
        console.log('[SelectionMenuManager] Explain action:', text);
        // TODO: Send to LLM for explanation
        this.notifyPanel(reader, 'explain', text);
      },
    });

    this.registerAction({
      id: 'ask',
      label: '提问',
      icon: '❓',
      handler: (text, reader) => {
        console.log('[SelectionMenuManager] Ask action:', text);
        // TODO: Open chat panel with context
        this.notifyPanel(reader, 'ask', text);
      },
    });

    this.registerAction({
      id: 'summarize',
      label: '摘要',
      icon: '📝',
      handler: (text, reader) => {
        console.log('[SelectionMenuManager] Summarize action:', text);
        // TODO: Generate summary
        this.notifyPanel(reader, 'summarize', text);
      },
    });

    console.log(`[SelectionMenuManager] Registered ${this.actions.size} default actions`);
  }

  /**
   * Register a new selection action
   */
  registerAction(action: SelectionAction): void {
    this.actions.set(action.id, action);
    console.log(`[SelectionMenuManager] Registered action: ${action.id}`);
  }

  /**
   * Unregister an action
   */
  unregisterAction(actionId: string): void {
    this.actions.delete(actionId);
    console.log(`[SelectionMenuManager] Unregistered action: ${actionId}`);
  }

  /**
   * Register selection menu to a reader
   */
  registerToReader(reader: ZoteroReader): void {
    if (this.registeredReaders.has(reader.itemID)) {
      console.warn(`[SelectionMenuManager] Menu already registered for item ${reader.itemID}`);
      return;
    }

    try {
      // Hook into Zotero Reader's text selection popup
      this.injectMenuActions(reader);
      this.registeredReaders.add(reader.itemID);

      console.log(`[SelectionMenuManager] Menu registered for item ${reader.itemID}`);
    } catch (error) {
      console.error('[SelectionMenuManager] Failed to register menu:', error);
      throw error;
    }
  }

  /**
   * Inject menu actions into reader selection popup
   */
  private injectMenuActions(reader: ZoteroReader): void {
    const readerWindow = reader._window;
    if (!readerWindow) {
      throw new Error('Reader window not found');
    }

    // Listen for text selection events
    const doc = readerWindow.document;

    // Create custom context menu
    doc.addEventListener('contextmenu', (e: MouseEvent) => {
      const selection = readerWindow.getSelection();
      const selectedText = selection?.toString().trim();

      if (selectedText && selectedText.length > 0) {
        e.preventDefault();
        this.showSelectionMenu(e, selectedText, reader);
      }
    });

    console.log('[SelectionMenuManager] Menu actions injected');
  }

  /**
   * Show selection menu at cursor position
   */
  private showSelectionMenu(event: MouseEvent, text: string, reader: ZoteroReader): void {
    const readerWindow = reader._window;
    const doc = readerWindow.document;

    // Remove existing menu
    const existingMenu = doc.querySelector('.ai-selection-menu');
    if (existingMenu) {
      existingMenu.remove();
    }

    // Create menu element
    const menu = doc.createElement('div');
    menu.className = 'ai-selection-menu';
    menu.style.cssText = `
      position: fixed;
      left: ${event.clientX}px;
      top: ${event.clientY}px;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      padding: 4px 0;
      z-index: 10000;
      min-width: 120px;
    `;

    // Add action buttons
    this.actions.forEach(action => {
      const button = doc.createElement('button');
      button.className = 'ai-selection-action';
      button.textContent = `${action.icon || ''} ${action.label}`;
      button.style.cssText = `
        display: block;
        width: 100%;
        padding: 8px 16px;
        border: none;
        background: none;
        text-align: left;
        cursor: pointer;
        font-size: 14px;
      `;

      button.addEventListener('mouseenter', () => {
        button.style.background = '#f0f0f0';
      });

      button.addEventListener('mouseleave', () => {
        button.style.background = 'none';
      });

      button.addEventListener('click', () => {
        action.handler(text, reader);
        menu.remove();
      });

      menu.appendChild(button);
    });

    // Add to document
    doc.body.appendChild(menu);

    // Close menu on click outside
    const closeMenu = (e: MouseEvent) => {
      if (!menu.contains(e.target as Node)) {
        menu.remove();
        doc.removeEventListener('click', closeMenu);
      }
    };

    setTimeout(() => {
      doc.addEventListener('click', closeMenu);
    }, 0);

    console.log('[SelectionMenuManager] Menu shown with', this.actions.size, 'actions');
  }

  /**
   * Notify panel of action
   */
  private notifyPanel(reader: ZoteroReader, action: string, text: string): void {
    // Dispatch custom event to panel
    const event = new CustomEvent('ai-selection-action', {
      detail: { action, text, itemID: reader.itemID },
    });

    reader._window.dispatchEvent(event);
    console.log(`[SelectionMenuManager] Notified panel of ${action} action`);
  }

  /**
   * Unregister menu from reader
   */
  unregisterFromReader(reader: ZoteroReader): void {
    this.registeredReaders.delete(reader.itemID);
    console.log(`[SelectionMenuManager] Menu unregistered for item ${reader.itemID}`);
  }

  /**
   * Clear all registered menus
   */
  clearAll(): void {
    this.registeredReaders.clear();
    console.log('[SelectionMenuManager] All menus cleared');
  }
}
