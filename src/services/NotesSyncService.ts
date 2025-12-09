/**
 * Notes Sync Service
 * Handles writing AI-generated content back to Zotero notes
 */

import type { ZoteroNoteItem } from '../types';

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

  constructor() {
    console.log('[NotesSyncService] Initialized');
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
}
