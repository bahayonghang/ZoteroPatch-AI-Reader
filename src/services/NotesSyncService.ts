/**
 * Notes Sync Service
 * Handles writing AI-generated content back to Zotero notes
 */

import type { ZoteroNoteItem, ChatMessage, ChatHistorySaveOptions } from '../types';

export enum NoteSyncMode {
  APPEND = 'append',
  OVERWRITE = 'overwrite',
}

export interface NoteSyncOptions {
  mode: NoteSyncMode;
  addTimestamp: boolean;
  addSource: boolean;
}

export class NotesSyncService {
  private readonly NOTE_SOURCE_TAG = '[AI Reader Assistant]';
  private readonly CHAT_HISTORY_TAG = '<!-- AI-CHAT-HISTORY -->';

  constructor() {
    console.log('[NotesSyncService] Initialized');
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for save requests from panel
   */
  private setupEventListeners(): void {
    document.addEventListener('ai-reader-save-chat', async (event: Event) => {
      const customEvent = event as CustomEvent<{ itemID: number; messages: ChatMessage[] }>;
      const { itemID, messages } = customEvent.detail;
      try {
        await this.saveChatHistory({ itemID, messages });
        console.log('[NotesSyncService] Chat history saved via event');
      } catch (error) {
        console.error('[NotesSyncService] Failed to save chat history:', error);
      }
    });
  }

  /**
   * Write content to item note
   */
  async writeToNote(
    itemID: number,
    content: string,
    options: NoteSyncOptions = {
      mode: NoteSyncMode.APPEND,
      addTimestamp: true,
      addSource: true,
    }
  ): Promise<void> {
    try {
      console.log(`[NotesSyncService] Writing to note for item ${itemID}`);

      // Get or create note for item
      const note = await this.getOrCreateNote(itemID);

      // Format content
      const formattedContent = this.formatContent(content, options);

      // Update note based on mode
      if (options.mode === NoteSyncMode.OVERWRITE) {
        await this.overwriteNote(note, formattedContent);
      } else {
        await this.appendToNote(note, formattedContent);
      }

      console.log(`[NotesSyncService] Successfully wrote to note ${note.id}`);
    } catch (error) {
      console.error('[NotesSyncService] Failed to write to note:', error);
      throw new Error(`Failed to write to note: ${error}`);
    }
  }

  /**
   * Get existing note or create new one
   */
  private async getOrCreateNote(itemID: number): Promise<ZoteroNoteItem> {
    if (!Zotero.Items) {
      throw new Error('Zotero.Items is not available');
    }

    const item = await Zotero.Items.getAsync(itemID);
    if (!item) {
      throw new Error(`Item ${itemID} not found`);
    }

    // Get child notes
    const notes = item.getNotes?.() || [];

    // Look for AI Reader note
    let targetNote: ZoteroNoteItem | null = null;
    for (const noteID of notes) {
      const note = await Zotero.Items.getAsync(noteID);
      if (note && typeof (note as unknown as ZoteroNoteItem).getNote === 'function') {
        const noteItem = note as unknown as ZoteroNoteItem;
        const noteContent = noteItem.getNote();

        if (noteContent.includes(this.NOTE_SOURCE_TAG)) {
          targetNote = noteItem;
          break;
        }
      }
    }

    // Create new note if not found
    if (!targetNote) {
      console.log('[NotesSyncService] Creating new AI Reader note');
      if (!Zotero.Item) {
        throw new Error('Zotero.Item constructor is not available');
      }
      targetNote = new Zotero.Item('note') as ZoteroNoteItem;
      targetNote.parentID = itemID;
      targetNote.setNote(`<h2>${this.NOTE_SOURCE_TAG}</h2>\n`);
      await targetNote.saveTx();
    }

    return targetNote;
  }

  /**
   * Format content with metadata
   */
  private formatContent(content: string, options: NoteSyncOptions): string {
    let formatted = '';

    // Add timestamp
    if (options.addTimestamp) {
      const timestamp = new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
      formatted += `<p><em>生成时间: ${timestamp}</em></p>\n`;
    }

    // Add content
    formatted += `<div class="ai-generated-content">\n${content}\n</div>\n`;

    // Add separator
    formatted += '<hr/>\n';

    return formatted;
  }

  /**
   * Append content to existing note
   */
  private async appendToNote(note: ZoteroNoteItem, content: string): Promise<void> {
    const currentContent = note.getNote();
    const newContent = currentContent + '\n' + content;

    note.setNote(newContent);
    await note.saveTx();

    console.log('[NotesSyncService] Content appended to note');
  }

  /**
   * Overwrite note content
   */
  private async overwriteNote(note: ZoteroNoteItem, content: string): Promise<void> {
    const headerContent = `<h2>${this.NOTE_SOURCE_TAG}</h2>\n`;
    const newContent = headerContent + content;

    note.setNote(newContent);
    await note.saveTx();

    console.log('[NotesSyncService] Note content overwritten');
  }

  /**
   * Write summary to note
   */
  async writeSummary(itemID: number, summary: string): Promise<void> {
    const content = `
      <h3>📝 摘要</h3>
      <p>${summary.replace(/\n/g, '<br/>')}</p>
    `;

    await this.writeToNote(itemID, content, {
      mode: NoteSyncMode.APPEND,
      addTimestamp: true,
      addSource: false,
    });
  }

  /**
   * Write key points to note
   */
  async writeKeyPoints(itemID: number, keyPoints: string[]): Promise<void> {
    const listItems = keyPoints.map(point => `<li>${point}</li>`).join('\n');
    const content = `
      <h3>💡 关键要点</h3>
      <ul>
        ${listItems}
      </ul>
    `;

    await this.writeToNote(itemID, content, {
      mode: NoteSyncMode.APPEND,
      addTimestamp: true,
      addSource: false,
    });
  }

  /**
   * Write translation to note
   */
  async writeTranslation(itemID: number, original: string, translation: string): Promise<void> {
    const content = `
      <h3>🌐 翻译</h3>
      <blockquote>
        <strong>原文:</strong><br/>
        ${original}
      </blockquote>
      <p>
        <strong>译文:</strong><br/>
        ${translation}
      </p>
    `;

    await this.writeToNote(itemID, content, {
      mode: NoteSyncMode.APPEND,
      addTimestamp: true,
      addSource: false,
    });
  }

  /**
   * Write Q&A to note
   */
  async writeQA(itemID: number, question: string, answer: string): Promise<void> {
    const content = `
      <h3>❓ 问答</h3>
      <p><strong>问题:</strong> ${question}</p>
      <p><strong>回答:</strong> ${answer.replace(/\n/g, '<br/>')}</p>
    `;

    await this.writeToNote(itemID, content, {
      mode: NoteSyncMode.APPEND,
      addTimestamp: true,
      addSource: false,
    });
  }

  /**
   * Check if item has AI Reader note
   */
  async hasAIReaderNote(itemID: number): Promise<boolean> {
    try {
      if (!Zotero.Items) return false;

      const item = await Zotero.Items.getAsync(itemID);
      if (!item) return false;

      const notes = item.getNotes?.();
      if (!notes || notes.length === 0) return false;

      for (const noteID of notes) {
        const note = await Zotero.Items.getAsync(noteID);
        if (note && typeof (note as unknown as ZoteroNoteItem).getNote === 'function') {
          const noteItem = note as unknown as ZoteroNoteItem;
          const noteContent = noteItem.getNote();

          if (noteContent.includes(this.NOTE_SOURCE_TAG)) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error('[NotesSyncService] Error checking for AI Reader note:', error);
      return false;
    }
  }

  /**
   * Get AI Reader note content
   */
  async getAIReaderNoteContent(itemID: number): Promise<string | null> {
    try {
      const note = await this.getOrCreateNote(itemID);
      return note.getNote();
    } catch (error) {
      console.error('[NotesSyncService] Error getting AI Reader note:', error);
      return null;
    }
  }

  // ========================================
  // Chat History
  // ========================================

  /**
   * Save chat history to Zotero note
   */
  async saveChatHistory(options: ChatHistorySaveOptions): Promise<void> {
    const { itemID, messages, format = 'markdown', includeTimestamps = true } = options;

    if (!messages || messages.length === 0) {
      console.log('[NotesSyncService] No messages to save');
      return;
    }

    try {
      console.log(`[NotesSyncService] Saving chat history for item ${itemID}`);

      // Get or create chat history note
      const note = await this.getOrCreateChatHistoryNote(itemID);

      // Format messages
      const formattedContent = this.formatChatHistory(messages, format, includeTimestamps);

      // Update note
      const headerContent = `${this.CHAT_HISTORY_TAG}\n<h2>💬 AI 对话历史</h2>\n`;
      const timestamp = new Date().toLocaleString('zh-CN');
      const fullContent = headerContent + 
        `<p><em>保存时间: ${timestamp}</em></p>\n` +
        formattedContent;

      note.setNote(fullContent);
      await note.saveTx();

      console.log(`[NotesSyncService] Chat history saved to note ${note.id}`);
    } catch (error) {
      console.error('[NotesSyncService] Failed to save chat history:', error);
      throw new Error(`Failed to save chat history: ${error}`);
    }
  }

  /**
   * Get or create chat history note
   */
  private async getOrCreateChatHistoryNote(itemID: number): Promise<ZoteroNoteItem> {
    if (!Zotero.Items) {
      throw new Error('Zotero.Items is not available');
    }

    const item = await Zotero.Items.getAsync(itemID);
    if (!item) {
      throw new Error(`Item ${itemID} not found`);
    }

    // Get child notes
    const notes = item.getNotes?.() || [];

    // Look for chat history note
    for (const noteID of notes) {
      const note = await Zotero.Items.getAsync(noteID);
      if (note && typeof (note as unknown as ZoteroNoteItem).getNote === 'function') {
        const noteItem = note as unknown as ZoteroNoteItem;
        const noteContent = noteItem.getNote();

        if (noteContent.includes(this.CHAT_HISTORY_TAG)) {
          return noteItem;
        }
      }
    }

    // Create new chat history note
    console.log('[NotesSyncService] Creating new chat history note');
    if (!Zotero.Item) {
      throw new Error('Zotero.Item constructor is not available');
    }
    const newNote = new Zotero.Item('note') as ZoteroNoteItem;
    newNote.parentID = itemID;
    newNote.setNote(`${this.CHAT_HISTORY_TAG}\n<h2>💬 AI 对话历史</h2>\n`);
    await newNote.saveTx();

    return newNote;
  }

  /**
   * Format chat history to HTML
   */
  private formatChatHistory(
    messages: ChatMessage[],
    format: 'markdown' | 'html' | 'plain',
    includeTimestamps: boolean
  ): string {
    let html = '<div class="ai-chat-history">\n';

    for (const message of messages) {
      const roleLabel = message.role === 'user' ? '👤 用户' : '🤖 AI';
      const roleClass = message.role === 'user' ? 'user-message' : 'assistant-message';
      const timestamp = includeTimestamps
        ? `<span class="timestamp">(${new Date(message.timestamp).toLocaleTimeString('zh-CN')})</span>`
        : '';

      html += `<div class="${roleClass}">\n`;
      html += `  <p><strong>${roleLabel}</strong> ${timestamp}</p>\n`;

      if (format === 'markdown') {
        // Convert Markdown to HTML (basic conversion)
        const htmlContent = this.markdownToHtml(message.content);
        html += `  <div class="message-content">${htmlContent}</div>\n`;
      } else if (format === 'html') {
        html += `  <div class="message-content">${message.content}</div>\n`;
      } else {
        html += `  <p>${message.content.replace(/\n/g, '<br/>')}</p>\n`;
      }

      html += '</div>\n';
    }

    html += '</div>\n<hr/>\n';
    return html;
  }

  /**
   * Basic Markdown to HTML conversion
   */
  private markdownToHtml(markdown: string): string {
    let html = markdown;

    // Escape HTML
    html = html.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Code blocks
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Lists
    html = html.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>');

    // Line breaks
    html = html.replace(/\n/g, '<br/>');

    return html;
  }

  /**
   * Load chat history from note
   */
  async loadChatHistory(itemID: number): Promise<ChatMessage[]> {
    try {
      if (!Zotero.Items) return [];

      const item = await Zotero.Items.getAsync(itemID);
      if (!item) return [];

      const notes = item.getNotes?.() || [];

      for (const noteID of notes) {
        const note = await Zotero.Items.getAsync(noteID);
        if (note && typeof (note as unknown as ZoteroNoteItem).getNote === 'function') {
          const noteItem = note as unknown as ZoteroNoteItem;
          const noteContent = noteItem.getNote();

          if (noteContent.includes(this.CHAT_HISTORY_TAG)) {
            console.log('[NotesSyncService] Found chat history note');
            // Note: Full parsing would require more complex logic
            return [];
          }
        }
      }

      return [];
    } catch (error) {
      console.error('[NotesSyncService] Error loading chat history:', error);
      return [];
    }
  }
}
