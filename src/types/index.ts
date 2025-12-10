/**
 * Type definitions for Zotero API
 * Extended from zotero-types with custom additions
 */

/**
 * Zotero global object interface
 */
interface ZoteroGlobal {
  Reader: {
    _readers?: ZoteroReader[];
    registerSidebarSection?(config: {
      paneID: string;
      id: string;
      title: string;
      index?: number;
      icon?: string;
      init: (props: {
        body: HTMLElement;
        tabID: string;
        reader?: ZoteroReader;
        item?: { id?: number };
      }) => void;
      destroy?: (props: {
        body: HTMLElement;
        tabID: string;
        reader?: ZoteroReader;
        item?: { id?: number };
      }) => void;
    }): () => void;
    _registerSidebarSection?(config: {
      paneID: string;
      id: string;
      title: string;
      init: (props: {
        body: HTMLElement;
        tabID: string;
        reader?: ZoteroReader;
        item?: { id?: number };
      }) => void;
      destroy?: (props: {
        body: HTMLElement;
        tabID: string;
        reader?: ZoteroReader;
        item?: { id?: number };
      }) => void;
    }): () => void;
    getByTabID?(tabID: string): ZoteroReader | undefined;
  };
  AIReader?: unknown;
  Prefs: {
    get(key: string, defaultValue?: unknown): unknown;
    set(key: string, value: unknown, global?: boolean): void;
    openPreferences?(paneID: string): void;
  };
  PreferencePanes: {
    register(paneConfig: PreferencePaneConfig): string;
  };
  Items: {
    get(itemID: number): ZoteroItem;
    getAsync(itemID: number): Promise<ZoteroItem>;
  };
  Item?: new (type: string) => ZoteroNoteItem;
  Notifier: {
    registerObserver(
      observer: {
        notify(event: string, type: string, ids: number[], extraData?: unknown): void | Promise<void>;
      },
      types: string[],
      name: string
    ): string;
    unregisterObserver(observerID: string): void;
  };
  Utilities: {
    Internal?: {
      openPreferences?(paneID: string): void;
    };
  };
  debug(...args: unknown[]): void;
  logError(error: unknown): void;
  uiReadyPromise?: Promise<void>;
  [key: string]: unknown;
}

/**
 * Preference Pane Configuration
 */
export interface PreferencePaneConfig {
  pluginID: string;
  src: string;
  label: string;
  image?: string;
  defaultXUL?: boolean;
}

/**
 * Components global object interface
 */
interface ComponentsGlobal {
  classes: {
    "@mozilla.org/xmlextras/xmlhttprequest;1": {
      createInstance(iid: unknown): XMLHttpRequest;
    };
    [key: string]: unknown;
  };
  interfaces: {
    nsIInterfaceRequestor: unknown;
    nsIDOMWindow: unknown;
    nsIXMLHttpRequest: unknown;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Services global object interface
 */
interface ServicesGlobal {
  wm: {
    addListener(listener: WindowListener): void;
    removeListener(listener: WindowListener): void;
    getEnumerator(windowType: string): WindowEnumerator;
  };
  [key: string]: unknown;
}

/**
 * Window listener interface for Services.wm
 */
export interface WindowListener {
  onOpenWindow(xulWindow: XULWindow): void;
  onCloseWindow?(xulWindow: XULWindow): void;
}

/**
 * XUL Window interface
 */
export interface XULWindow {
  QueryInterface(iid: unknown): {
    getInterface(iid: unknown): Window;
  };
}

/**
 * Window enumerator interface
 */
export interface WindowEnumerator {
  hasMoreElements(): boolean;
  getNext(): Window;
}

declare global {
  const Zotero: ZoteroGlobal;
  const Components: ComponentsGlobal;
  const Services: ServicesGlobal;
  const ChromeUtils: unknown;

  interface Window {
    AIReaderPanel?: HTMLElement;
    Zotero?: ZoteroGlobal;
  }
}

/**
 * Zotero Item interface
 */
export interface ZoteroItem {
  id: number;
  libraryID: number;
  key: string;
  getNotes?(): number[];
  [key: string]: unknown;
}

/**
 * Zotero Note Item interface
 */
export interface ZoteroNoteItem {
  id: number;
  parentID?: number;
  getNote(): string;
  setNote(content: string): void;
  saveTx(): Promise<void>;
  [key: string]: unknown;
}

/**
 * Reader instance interface
 */
export interface ZoteroReader {
  itemID: number;
  _window: Window;
  _item: ZoteroItem;
  getSelectedText(): string;
  getPageNumber(): number;
}

/**
 * Prompt templates interface
 */
export interface PromptTemplates {
  translation: string;
  summary: string;
  keyPoints: string;
  qa: string;
}

/**
 * Plugin configuration interface
 */
export interface PluginConfig {
  apiKey: string;
  apiEndpoint: string;
  model: string;
  temperature: number;
  defaultLanguage: string;
  enableTranslation: boolean;
  enableSummary: boolean;
  enableQA: boolean;
  templates: PromptTemplates;
}

/**
 * Chat message interface
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  pageNumber?: number;
}

/**
 * Session context interface
 */
export interface SessionContext {
  itemID: number;
  readerInstance: ZoteroReader;
  messages: ChatMessage[];
  summary?: string;
  keyPoints?: string[];
  lastUpdated: number;
}

export {};
