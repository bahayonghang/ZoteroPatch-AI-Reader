/**
 * Session Manager
 * Manages per-item per-reader session contexts including messages and summaries
 */

import type { SessionContext, ChatMessage, ZoteroReader } from '../types';

export class SessionManager {
  private sessions: Map<number, SessionContext>;
  private readonly MAX_MESSAGES_PER_SESSION = 100;
  private readonly SESSION_TIMEOUT_MS = 3600000; // 1 hour

  constructor() {
    this.sessions = new Map();
    console.log('[SessionManager] Initialized');
  }

  /**
   * Create a new session for a reader
   */
  createSession(itemID: number, readerInstance: ZoteroReader): SessionContext {
    const session: SessionContext = {
      itemID,
      readerInstance,
      messages: [],
      lastUpdated: Date.now(),
    };

    this.sessions.set(itemID, session);
    console.log(`[SessionManager] Created session for item ${itemID}`);

    return session;
  }

  /**
   * Get session by item ID
   */
  getSession(itemID: number): SessionContext | undefined {
    const session = this.sessions.get(itemID);

    // Check session timeout
    if (session && Date.now() - session.lastUpdated > this.SESSION_TIMEOUT_MS) {
      console.log(`[SessionManager] Session for item ${itemID} expired`);
      this.removeSession(itemID);
      return undefined;
    }

    return session;
  }

  /**
   * Add message to session
   */
  addMessage(itemID: number, message: ChatMessage): void {
    const session = this.getSession(itemID);
    if (!session) {
      console.warn(`[SessionManager] Session not found for item ${itemID}`);
      return;
    }

    session.messages.push(message);
    session.lastUpdated = Date.now();

    // Enforce message limit
    if (session.messages.length > this.MAX_MESSAGES_PER_SESSION) {
      // Keep system messages and recent user messages
      const systemMessages = session.messages.filter(m => m.role === 'system');
      const recentMessages = session.messages.slice(-this.MAX_MESSAGES_PER_SESSION + systemMessages.length);
      session.messages = [...systemMessages, ...recentMessages];
    }

    console.log(`[SessionManager] Added message to session ${itemID}, total: ${session.messages.length}`);
  }

  /**
   * Update session summary
   */
  updateSummary(itemID: number, summary: string): void {
    const session = this.getSession(itemID);
    if (session) {
      session.summary = summary;
      session.lastUpdated = Date.now();
      console.log(`[SessionManager] Updated summary for item ${itemID}`);
    }
  }

  /**
   * Update session key points
   */
  updateKeyPoints(itemID: number, keyPoints: string[]): void {
    const session = this.getSession(itemID);
    if (session) {
      session.keyPoints = keyPoints;
      session.lastUpdated = Date.now();
      console.log(`[SessionManager] Updated key points for item ${itemID}`);
    }
  }

  /**
   * Remove session
   */
  removeSession(itemID: number): void {
    this.sessions.delete(itemID);
    console.log(`[SessionManager] Removed session for item ${itemID}`);
  }

  /**
   * Clear all sessions
   */
  clearAll(): void {
    this.sessions.clear();
    console.log('[SessionManager] Cleared all sessions');
  }

  /**
   * Get session count
   */
  getSessionCount(): number {
    return this.sessions.size;
  }
}
