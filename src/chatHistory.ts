import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'image';
  imageUrl?: string;
  thumbnailUrl?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: ChatMessage[];
  messageCount: number;
}

const SESSIONS_DIR = path.join(process.cwd(), 'chat_sessions');

// Ensure sessions directory exists
if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

export class ChatHistory {

  // Create a new chat session
  static createSession(title?: string): ChatSession {
    const sessionId = uuidv4();
    const now = new Date();

    const session: ChatSession = {
      id: sessionId,
      title: title || 'New Chat',
      createdAt: now,
      updatedAt: now,
      messages: [],
      messageCount: 0
    };

    this.saveSession(session);
    return session;
  }

  // Load a session by ID
  static loadSession(sessionId: string): ChatSession | null {
    try {
      const sessionPath = path.join(SESSIONS_DIR, `${sessionId}.json`);
      if (!fs.existsSync(sessionPath)) {
        return null;
      }

      const sessionData = fs.readFileSync(sessionPath, 'utf8');
      const session = JSON.parse(sessionData);

      // Convert date strings back to Date objects
      session.createdAt = new Date(session.createdAt);
      session.updatedAt = new Date(session.updatedAt);
      session.messages = session.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));

      return session;
    } catch (error) {
      console.error(`[ERROR] Failed to load session ${sessionId}:`, error);
      return null;
    }
  }

  // Save a session to disk
  static saveSession(session: ChatSession): void {
    try {
      const sessionPath = path.join(SESSIONS_DIR, `${session.id}.json`);
      fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));
    } catch (error) {
      console.error(`[ERROR] Failed to save session ${session.id}:`, error);
    }
  }

  // Add a message to a session
  static addMessage(sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatSession | null {
    const session = this.loadSession(sessionId);
    if (!session) return null;

    const newMessage: ChatMessage = {
      id: uuidv4(),
      timestamp: new Date(),
      ...message
    };

    session.messages.push(newMessage);
    session.messageCount = session.messages.length;
    session.updatedAt = new Date();

    // Auto-generate title from first user message
    if (!session.title || session.title === 'New Chat') {
      const firstUserMessage = session.messages.find(m => m.role === 'user');
      if (firstUserMessage) {
        session.title = this.generateTitle(firstUserMessage.content);
      }
    }

    this.saveSession(session);
    return session;
  }

  // Generate a title from the first message
  private static generateTitle(content: string): string {
    // Clean and truncate the content for title
    const cleaned = content.replace(/\s+/g, ' ').trim();
    if (cleaned.length <= 50) return cleaned;

    // Find a good breaking point
    const truncated = cleaned.substring(0, 47);
    const lastSpace = truncated.lastIndexOf(' ');
    return lastSpace > 20 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
  }

  // Get all sessions sorted by last updated
  static getAllSessions(): ChatSession[] {
    try {
      const files = fs.readdirSync(SESSIONS_DIR)
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));

      const sessions = files
        .map(sessionId => this.loadSession(sessionId))
        .filter(session => session !== null) as ChatSession[];

      // Sort by updatedAt descending (most recent first)
      return sessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (error) {
      console.error('[ERROR] Failed to load sessions:', error);
      return [];
    }
  }

  // Search sessions by content
  static searchSessions(query: string): ChatSession[] {
    const allSessions = this.getAllSessions();
    const lowercaseQuery = query.toLowerCase();

    return allSessions.filter(session => {
      // Search in title
      if (session.title.toLowerCase().includes(lowercaseQuery)) {
        return true;
      }

      // Search in messages
      return session.messages.some(message =>
        message.content.toLowerCase().includes(lowercaseQuery)
      );
    });
  }

  // Delete a session
  static deleteSession(sessionId: string): boolean {
    try {
      const sessionPath = path.join(SESSIONS_DIR, `${sessionId}.json`);
      if (fs.existsSync(sessionPath)) {
        fs.unlinkSync(sessionPath);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`[ERROR] Failed to delete session ${sessionId}:`, error);
      return false;
    }
  }

  // Get session summary for listing
  static getSessionSummary(sessionId: string): { id: string; title: string; updatedAt: Date; messageCount: number } | null {
    const session = this.loadSession(sessionId);
    if (!session) return null;

    return {
      id: session.id,
      title: session.title,
      updatedAt: session.updatedAt,
      messageCount: session.messageCount
    };
  }

  // Clean old sessions (optional utility)
  static cleanOldSessions(daysOld: number = 30): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const allSessions = this.getAllSessions();
    let deletedCount = 0;

    allSessions.forEach(session => {
      if (session.updatedAt < cutoffDate) {
        if (this.deleteSession(session.id)) {
          deletedCount++;
        }
      }
    });

    return deletedCount;
  }
}

// Export default instance
export default ChatHistory;