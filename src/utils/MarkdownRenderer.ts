/**
 * Markdown Renderer
 * Lightweight Markdown parser for AI responses
 * Supports: code blocks, lists, tables, inline formatting, links
 */

import type { MarkdownRenderOptions } from '../types';

export class MarkdownRenderer {
  private options: Required<MarkdownRenderOptions>;

  constructor(options: MarkdownRenderOptions = {}) {
    this.options = {
      enableCodeHighlight: options.enableCodeHighlight ?? true,
      enableTables: options.enableTables ?? true,
      enableLinks: options.enableLinks ?? true,
      sanitize: options.sanitize ?? true,
    };
  }

  /**
   * Render Markdown to HTML
   */
  render(markdown: string): string {
    if (!markdown) return '';

    let html = this.escapeHtml(markdown);

    // Process in order: code blocks first (to prevent inner processing)
    html = this.processCodeBlocks(html);
    html = this.processInlineCode(html);
    
    if (this.options.enableTables) {
      html = this.processTables(html);
    }
    
    html = this.processLists(html);
    html = this.processBlockquotes(html);
    html = this.processHeadings(html);
    html = this.processHorizontalRules(html);
    html = this.processInlineFormatting(html);
    
    if (this.options.enableLinks) {
      html = this.processLinks(html);
    }
    
    html = this.processParagraphs(html);

    return html;
  }

  /**
   * Render Markdown to DOM element
   */
  renderToElement(markdown: string, container: HTMLElement): void {
    container.innerHTML = this.render(markdown);
    
    // Add copy buttons to code blocks
    if (this.options.enableCodeHighlight) {
      this.addCopyButtons(container);
    }
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    if (!this.options.sanitize) return text;
    
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Process fenced code blocks (```language ... ```)
   */
  private processCodeBlocks(text: string): string {
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    
    return text.replace(codeBlockRegex, (_match, language, code) => {
      const lang = language || 'text';
      const escapedCode = code.trim();
      
      return `<div class="ai-code-block" data-language="${lang}">
        <div class="ai-code-header">
          <span class="ai-code-language">${lang}</span>
          <button class="ai-code-copy" title="复制代码">复制</button>
        </div>
        <pre><code class="language-${lang}">${escapedCode}</code></pre>
      </div>`;
    });
  }

  /**
   * Process inline code (`code`)
   */
  private processInlineCode(text: string): string {
    return text.replace(/`([^`\n]+)`/g, '<code class="ai-inline-code">$1</code>');
  }

  /**
   * Process tables
   */
  private processTables(text: string): string {
    const lines = text.split('\n');
    const result: string[] = [];
    let inTable = false;
    let tableRows: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if line is a table row (contains |)
      if (line.startsWith('|') && line.endsWith('|')) {
        if (!inTable) {
          inTable = true;
          tableRows = [];
        }
        tableRows.push(line);
      } else if (inTable) {
        // End of table
        result.push(this.renderTable(tableRows));
        inTable = false;
        tableRows = [];
        result.push(lines[i]);
      } else {
        result.push(lines[i]);
      }
    }

    // Handle table at end of text
    if (inTable && tableRows.length > 0) {
      result.push(this.renderTable(tableRows));
    }

    return result.join('\n');
  }

  /**
   * Render a Markdown table to HTML
   */
  private renderTable(rows: string[]): string {
    if (rows.length < 2) return rows.join('\n');

    const parseRow = (row: string): string[] => {
      return row.split('|')
        .filter((_, i, arr) => i > 0 && i < arr.length - 1)
        .map(cell => cell.trim());
    };

    // Check if second row is separator
    const isSeparator = (row: string): boolean => {
      return /^\|[\s\-:|]+\|$/.test(row);
    };

    let html = '<table class="ai-table">';
    const hasHeader = rows.length > 1 && isSeparator(rows[1]);

    if (hasHeader) {
      const headerCells = parseRow(rows[0]);
      html += '<thead><tr>';
      headerCells.forEach(cell => {
        html += `<th>${cell}</th>`;
      });
      html += '</tr></thead>';
      rows = rows.slice(2); // Skip header and separator
    }

    html += '<tbody>';
    rows.forEach(row => {
      if (!isSeparator(row)) {
        const cells = parseRow(row);
        html += '<tr>';
        cells.forEach(cell => {
          html += `<td>${cell}</td>`;
        });
        html += '</tr>';
      }
    });
    html += '</tbody></table>';

    return html;
  }

  /**
   * Process unordered and ordered lists
   */
  private processLists(text: string): string {
    const lines = text.split('\n');
    const result: string[] = [];
    let inList = false;
    let listType = '';
    let listItems: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const ulMatch = line.match(/^(\s*)[-*+]\s+(.+)$/);
      const olMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);

      if (ulMatch) {
        if (!inList || listType !== 'ul') {
          if (inList) {
            result.push(this.renderList(listItems, listType));
          }
          inList = true;
          listType = 'ul';
          listItems = [];
        }
        listItems.push(ulMatch[2]);
      } else if (olMatch) {
        if (!inList || listType !== 'ol') {
          if (inList) {
            result.push(this.renderList(listItems, listType));
          }
          inList = true;
          listType = 'ol';
          listItems = [];
        }
        listItems.push(olMatch[2]);
      } else {
        if (inList) {
          result.push(this.renderList(listItems, listType));
          inList = false;
          listItems = [];
        }
        result.push(line);
      }
    }

    if (inList) {
      result.push(this.renderList(listItems, listType));
    }

    return result.join('\n');
  }

  /**
   * Render list to HTML
   */
  private renderList(items: string[], type: string): string {
    const tag = type === 'ol' ? 'ol' : 'ul';
    const className = type === 'ol' ? 'ai-ordered-list' : 'ai-unordered-list';
    let html = `<${tag} class="${className}">`;
    items.forEach(item => {
      html += `<li>${item}</li>`;
    });
    html += `</${tag}>`;
    return html;
  }

  /**
   * Process blockquotes
   */
  private processBlockquotes(text: string): string {
    const lines = text.split('\n');
    const result: string[] = [];
    let inQuote = false;
    let quoteLines: string[] = [];

    for (const line of lines) {
      const quoteMatch = line.match(/^>\s*(.*)$/);
      
      if (quoteMatch) {
        if (!inQuote) {
          inQuote = true;
          quoteLines = [];
        }
        quoteLines.push(quoteMatch[1]);
      } else if (inQuote) {
        result.push(`<blockquote class="ai-blockquote">${quoteLines.join('<br>')}</blockquote>`);
        inQuote = false;
        quoteLines = [];
        result.push(line);
      } else {
        result.push(line);
      }
    }

    if (inQuote) {
      result.push(`<blockquote class="ai-blockquote">${quoteLines.join('<br>')}</blockquote>`);
    }

    return result.join('\n');
  }

  /**
   * Process headings (# Heading)
   */
  private processHeadings(text: string): string {
    return text.replace(/^(#{1,6})\s+(.+)$/gm, (_match, hashes, content) => {
      const level = hashes.length;
      return `<h${level} class="ai-heading ai-heading-${level}">${content}</h${level}>`;
    });
  }

  /**
   * Process horizontal rules (---, ***)
   */
  private processHorizontalRules(text: string): string {
    return text.replace(/^([-*_]){3,}$/gm, '<hr class="ai-hr">');
  }

  /**
   * Process inline formatting (bold, italic, strikethrough)
   */
  private processInlineFormatting(text: string): string {
    // Bold: **text** or __text__
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/__(.+?)__/g, '<strong>$1</strong>');
    
    // Italic: *text* or _text_
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
    text = text.replace(/_(.+?)_/g, '<em>$1</em>');
    
    // Strikethrough: ~~text~~
    text = text.replace(/~~(.+?)~~/g, '<del>$1</del>');
    
    return text;
  }

  /**
   * Process links [text](url)
   */
  private processLinks(text: string): string {
    // [text](url)
    text = text.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="ai-link" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    
    // Auto-link URLs
    text = text.replace(
      /(https?:\/\/[^\s<]+)/g,
      '<a href="$1" class="ai-link" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    
    return text;
  }

  /**
   * Process paragraphs (wrap loose text)
   */
  private processParagraphs(text: string): string {
    // Split by double newlines and wrap non-HTML blocks
    const blocks = text.split(/\n\n+/);
    
    return blocks.map(block => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      
      // Don't wrap if already an HTML element
      if (trimmed.startsWith('<') && !trimmed.startsWith('<code') && !trimmed.startsWith('<a')) {
        return trimmed;
      }
      
      // Don't wrap single-line items that are already processed
      if (/<(h[1-6]|ul|ol|table|blockquote|div|pre|hr)/i.test(trimmed)) {
        return trimmed;
      }
      
      // Wrap in paragraph, preserving line breaks
      return `<p class="ai-paragraph">${trimmed.replace(/\n/g, '<br>')}</p>`;
    }).join('\n');
  }

  /**
   * Add copy buttons to code blocks
   */
  private addCopyButtons(container: HTMLElement): void {
    const copyButtons = container.querySelectorAll('.ai-code-copy');
    
    copyButtons.forEach(button => {
      button.addEventListener('click', async (e) => {
        const codeBlock = (e.target as HTMLElement).closest('.ai-code-block');
        const code = codeBlock?.querySelector('code')?.textContent || '';
        
        try {
          await navigator.clipboard.writeText(code);
          (e.target as HTMLElement).textContent = '已复制!';
          setTimeout(() => {
            (e.target as HTMLElement).textContent = '复制';
          }, 2000);
        } catch (err) {
          console.error('[MarkdownRenderer] Copy failed:', err);
        }
      });
    });
  }

  /**
   * Get CSS styles for Markdown rendering
   */
  static getStyles(): string {
    return `
      .ai-paragraph {
        margin: 0 0 1em 0;
        line-height: 1.6;
      }
      
      .ai-heading {
        margin: 1.5em 0 0.5em 0;
        font-weight: 600;
        line-height: 1.3;
      }
      
      .ai-heading-1 { font-size: 1.5em; }
      .ai-heading-2 { font-size: 1.3em; }
      .ai-heading-3 { font-size: 1.15em; }
      .ai-heading-4 { font-size: 1em; }
      .ai-heading-5 { font-size: 0.9em; }
      .ai-heading-6 { font-size: 0.85em; }
      
      .ai-code-block {
        margin: 1em 0;
        border-radius: var(--ai-radius-md, 6px);
        overflow: hidden;
        background: var(--ai-code-bg, #f6f8fa);
        border: 1px solid var(--ai-code-border, #e1e4e8);
      }
      
      .ai-code-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background: var(--ai-bg-tertiary, #ebebeb);
        border-bottom: 1px solid var(--ai-code-border, #e1e4e8);
        font-size: 12px;
      }
      
      .ai-code-language {
        color: var(--ai-text-secondary, #666);
        font-family: var(--ai-font-mono, monospace);
      }
      
      .ai-code-copy {
        padding: 4px 8px;
        font-size: 11px;
        background: var(--ai-button-secondary-bg, #f5f5f5);
        border: 1px solid var(--ai-button-secondary-border, #ccc);
        border-radius: var(--ai-radius-sm, 4px);
        cursor: pointer;
        color: var(--ai-text-secondary, #666);
      }
      
      .ai-code-copy:hover {
        background: var(--ai-bg-secondary, #f5f5f5);
      }
      
      .ai-code-block pre {
        margin: 0;
        padding: 12px;
        overflow-x: auto;
      }
      
      .ai-code-block code {
        font-family: var(--ai-font-mono, monospace);
        font-size: 13px;
        line-height: 1.5;
        color: var(--ai-code-text, #24292e);
      }
      
      .ai-inline-code {
        padding: 2px 6px;
        background: var(--ai-code-bg, #f6f8fa);
        border-radius: 4px;
        font-family: var(--ai-font-mono, monospace);
        font-size: 0.9em;
        color: var(--ai-code-text, #24292e);
      }
      
      .ai-table {
        width: 100%;
        border-collapse: collapse;
        margin: 1em 0;
        font-size: 13px;
      }
      
      .ai-table th,
      .ai-table td {
        padding: 8px 12px;
        border: 1px solid var(--ai-border-color, #e0e0e0);
        text-align: left;
      }
      
      .ai-table th {
        background: var(--ai-bg-secondary, #f5f5f5);
        font-weight: 600;
      }
      
      .ai-table tr:nth-child(even) {
        background: var(--ai-bg-secondary, #f5f5f5);
      }
      
      .ai-unordered-list,
      .ai-ordered-list {
        margin: 0.5em 0;
        padding-left: 1.5em;
      }
      
      .ai-unordered-list li,
      .ai-ordered-list li {
        margin: 0.25em 0;
        line-height: 1.5;
      }
      
      .ai-blockquote {
        margin: 1em 0;
        padding: 0.5em 1em;
        border-left: 4px solid var(--ai-accent-color, #0066cc);
        background: var(--ai-bg-secondary, #f5f5f5);
        color: var(--ai-text-secondary, #666);
      }
      
      .ai-link {
        color: var(--ai-accent-color, #0066cc);
        text-decoration: none;
      }
      
      .ai-link:hover {
        text-decoration: underline;
      }
      
      .ai-hr {
        border: none;
        border-top: 1px solid var(--ai-border-color, #e0e0e0);
        margin: 1.5em 0;
      }
    `;
  }
}

// Export singleton instance
export const markdownRenderer = new MarkdownRenderer();
