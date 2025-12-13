/**
 * Type definitions for Zotero API
 * Extended from zotero-types with custom additions
 */

/**
 * Item Pane Section Configuration (Zotero 7+)
 */
export interface ItemPaneSectionConfig {
  paneID: string;
  pluginID: string;
  header: {
    l10nID: string;
    l10nArgs?: string;
    icon?: string;
    darkIcon?: string;
  };
  sidenav?: {
    l10nID: string;
    l10nArgs?: string;
    icon?: string;
    darkIcon?: string;
  };
  bodyXHTML?: string;
  onInit?: (props: ItemPaneSectionProps) => void;
  onDestroy?: (props: ItemPaneSectionProps) => void;
  onItemChange?: (props: ItemPaneSectionProps) => void;
  onRender?: (props: ItemPaneSectionProps) => void;
}

/**
 * Item Pane Section Props
 */
export interface ItemPaneSectionProps {
  body: HTMLElement;
  item: { id?: number } | null;
  editable: boolean;
  tabType: 'library' | 'reader';
  refresh: () => Promise<unknown>;
}

/**
 * Reader Event Listener Types
 */
export type ReaderEventType =
  | 'renderTextSelectionPopup'
  | 'createAnnotationContextMenu'
  | 'renderSidebarAnnotationHeader'
  | 'renderToolbar';

/**
 * Text Selection Popup Params
 */
export interface TextSelectionPopupParams {
  annotation?: {
    text?: string;
  };
}

export interface ReaderEvent<TParams = unknown, TAppend = unknown> {
  reader: ZoteroReader;
  doc: Document;
  params: TParams;
  append: TAppend;
  type: ReaderEventType;
}

export type ReaderAppendDOM = (...node: Array<Node | string>) => void;

export interface ReaderEventMap {
  renderTextSelectionPopup: TextSelectionPopupParams;
  createAnnotationContextMenu: unknown;
  renderSidebarAnnotationHeader: unknown;
  renderToolbar: unknown;
}

export interface ReaderAppendMap {
  renderTextSelectionPopup: ReaderAppendDOM;
  createAnnotationContextMenu: unknown;
  renderSidebarAnnotationHeader: ReaderAppendDOM;
  renderToolbar: ReaderAppendDOM;
}

export type ReaderEventForType<T extends ReaderEventType> = ReaderEvent<
  ReaderEventMap[T],
  ReaderAppendMap[T]
> & { type: T };

/**
 * Zotero global object interface
 */
interface ZoteroGlobal {
  Reader: {
    _readers?: ZoteroReader[];
    getByTabID?(tabID: string): ZoteroReader | undefined;
    /**
     * Register an event listener for reader events (Zotero 7+)
     * @param event - Event type to listen for
     * @param callback - Callback function
     * @param pluginID - Plugin identifier for cleanup
     */
    registerEventListener?<T extends ReaderEventType>(
      event: T,
      callback: (event: ReaderEventForType<T>) => void | Promise<void>,
      pluginID?: string
    ): void;

    unregisterEventListener?<T extends ReaderEventType>(
      event: T,
      callback: (event: ReaderEventForType<T>) => void | Promise<void>
    ): void;
  };
  /**
   * Item Pane Manager for sidebar sections (Zotero 7+)
   */
  ItemPaneManager?: {
    registerSection(config: ItemPaneSectionConfig): false | string;
    unregisterSection(sectionID: string): boolean;
  };
  AIReader?: unknown;
  Prefs: {
    get(key: string, defaultValue?: unknown): unknown;
    set(key: string, value: unknown, global?: boolean): void;
    openPreferences?(paneID: string): void;
  };
  PreferencePanes?: {
    register(paneConfig: PreferencePaneConfig): Promise<string>;
  };
  getMainWindow?(): Window;
  getMainWindows?(): Window[];
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
  getActiveZoteroPane?(): {
    getSelectedItems?(): ZoteroItem[];
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

  interface Document {
    l10n?: {
      addResourceIds(resourceIds: string[]): void;
    } | null;
  }

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
 * Prompt template interface (single template)
 */
export interface PromptTemplate {
  id: string;
  name: string;
  type: 'translation' | 'summary' | 'keyPoints' | 'qa' | 'custom';
  content: string;
  isDefault: boolean;
  createdAt?: number;
  updatedAt?: number;
}

/**
 * Prompt templates interface (legacy, for backward compatibility)
 */
export interface PromptTemplates {
  translation: string;
  summary: string;
  keyPoints: string;
  qa: string;
}

/**
 * Template placeholder variables
 */
export interface TemplatePlaceholders {
  text?: string;
  language?: string;
  context?: string;
  question?: string;
  title?: string;
  author?: string;
}

/**
 * Plugin configuration interface
 */
export interface PluginConfig {
  apiKey: string;
  apiEndpoint: string;
  model: string;
  customModel?: string;
  temperature: number;
  defaultLanguage: string;
  enableTranslation: boolean;
  enableSummary: boolean;
  enableQA: boolean;
  enableStreaming: boolean;
  autoSaveHistory: boolean;
  maxTokens: number;
  timeout: number;
  maxHistory: number;
  debugMode: boolean;
  templates: PromptTemplates;
  promptTemplates?: PromptTemplate[];
}

/**
 * Streaming callback interface
 */
export interface StreamCallbacks {
  onStart?: () => void;
  onChunk?: (chunk: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
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
  documentTitle?: string;
  documentAuthor?: string;
}

/**
 * Chat history save options
 */
export interface ChatHistorySaveOptions {
  itemID: number;
  messages: ChatMessage[];
  format?: 'markdown' | 'html' | 'plain';
  includeTimestamps?: boolean;
}

/**
 * Markdown renderer options
 */
export interface MarkdownRenderOptions {
  enableCodeHighlight?: boolean;
  enableTables?: boolean;
  enableLinks?: boolean;
  sanitize?: boolean;
}

export {};
