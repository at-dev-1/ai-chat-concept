// Chat application frontend logic
class ChatApp {
  constructor() {
    this.currentSessionId = null;
    this.isLoading = false;

    this.initializeElements();
    this.attachEventListeners();
    this.loadChatHistory();
    this.handleUrlParameters();
  }

  initializeElements() {
    // Sidebar elements
    this.newChatBtn = document.getElementById('newChatBtn');
    this.searchInput = document.getElementById('searchInput');
    this.chatCount = document.getElementById('chatCount');
    this.chatList = document.getElementById('chatList');

    // Main content elements
    this.chatTitle = document.getElementById('chatTitle');
    this.deleteChatBtn = document.getElementById('deleteChatBtn');
    this.messagesContainer = document.getElementById('messagesContainer');
    this.welcomeMessage = document.getElementById('welcomeMessage');
    this.messages = document.getElementById('messages');
    this.messageInput = document.getElementById('messageInput');
    this.sendBtn = document.getElementById('sendBtn');
    this.loadingOverlay = document.getElementById('loadingOverlay');
  }

  attachEventListeners() {
    // New chat button
    this.newChatBtn.addEventListener('click', () => this.createNewChat());

    // Search input
    this.searchInput.addEventListener('input', (e) => this.searchChats(e.target.value));

    // Delete chat button
    this.deleteChatBtn.addEventListener('click', () => this.deleteCurrentChat());

    // Message input
    this.messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Send button
    this.sendBtn.addEventListener('click', () => this.sendMessage());

    // Auto-resize textarea
    this.messageInput.addEventListener('input', () => this.autoResizeTextarea());
  }

  async loadChatHistory() {
    try {
      const response = await fetch('/api/sessions');
      const sessions = await response.json();

      this.renderChatList(sessions);
      this.updateChatCount(sessions.length);
    } catch (error) {
      console.error('Failed to load chat history:', error);
      this.chatCount.textContent = 'Failed to load chats';
    }
  }

  renderChatList(sessions) {
    this.chatList.innerHTML = '';

    if (sessions.length === 0) {
      this.chatList.innerHTML = `
        <div style="padding: 24px; text-align: center; color: #888;">
          <p>No chats yet</p>
          <p style="font-size: 12px; margin-top: 8px;">Start a new conversation above</p>
        </div>
      `;
      return;
    }

    sessions.forEach(session => {
      const chatItem = this.createChatItem(session);
      this.chatList.appendChild(chatItem);
    });
  }

  createChatItem(session) {
    const chatItem = document.createElement('div');
    chatItem.className = 'chat-item';
    chatItem.dataset.sessionId = session.id;

    const updatedAt = new Date(session.updatedAt);
    const timeAgo = this.formatTimeAgo(updatedAt);

    chatItem.innerHTML = `
      <div class="chat-item-title">${this.escapeHtml(session.title)}</div>
      <div class="chat-item-meta">
        <span>${session.messageCount} messages</span>
        <span>${timeAgo}</span>
      </div>
    `;

    chatItem.addEventListener('click', () => this.selectChat(session.id));

    return chatItem;
  }

  updateChatCount(count) {
    this.chatCount.textContent = `${count} chats with Corgan`;
  }

  async searchChats(query) {
    if (!query.trim()) {
      this.loadChatHistory();
      return;
    }

    try {
      const response = await fetch(`/api/sessions/search?q=${encodeURIComponent(query)}`);
      const sessions = await response.json();
      this.renderChatList(sessions);
    } catch (error) {
      console.error('Failed to search chats:', error);
    }
  }

  async createNewChat() {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const newSession = await response.json();

      this.selectChat(newSession.id);
      this.loadChatHistory(); // Refresh the sidebar
    } catch (error) {
      console.error('Failed to create new chat:', error);
    }
  }

  async selectChat(sessionId) {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      const session = await response.json();

      this.currentSessionId = sessionId;
      this.chatTitle.textContent = session.title;
      this.deleteChatBtn.style.display = 'block';

      // Update active chat in sidebar
      document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
      });
      document.querySelector(`[data-session-id="${sessionId}"]`)?.classList.add('active');

      // Show messages
      this.renderMessages(session.messages);
      this.hideWelcomeMessage();

    } catch (error) {
      console.error('Failed to load chat:', error);
    }
  }

  renderMessages(messages) {
    this.messages.innerHTML = '';

    messages.forEach(message => {
      const messageElement = this.createMessageElement(message);
      this.messages.appendChild(messageElement);
    });

    // Scroll to bottom
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  createMessageElement(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.role}`;

    const timestamp = new Date(message.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    let imageHtml = '';
    if (message.type === 'image' && message.thumbnailUrl) {
      imageHtml = `
        <div class="message-image">
          <img src="${message.thumbnailUrl}" alt="Generated image" onclick="window.open('${message.imageUrl}', '_blank')">
          <br>
          <a href="${message.imageUrl}" target="_blank" class="image-link">View Full Image</a>
        </div>
      `;
    }

    messageDiv.innerHTML = `
      <div class="message-header">
        <span class="message-role ${message.role}">${message.role}</span>
        <span class="message-timestamp">${timestamp}</span>
      </div>
      <div class="message-content">${this.escapeHtml(message.content)}</div>
      ${imageHtml}
    `;

    return messageDiv;
  }

  async sendMessage() {
    const content = this.messageInput.value.trim();
    if (!content || this.isLoading) return;

    // Create new session if none selected
    if (!this.currentSessionId) {
      await this.createNewChat();
    }

    if (!this.currentSessionId) return;

    this.isLoading = true;
    this.setLoadingState(true);

    // Add user message to UI immediately
    const userMessage = {
      id: 'temp-' + Date.now(),
      role: 'user',
      content: content,
      timestamp: new Date(),
      type: 'text'
    };

    this.appendMessage(userMessage);
    this.messageInput.value = '';
    this.autoResizeTextarea();

    // Show typing indicator
    this.showTypingIndicator();

    try {
      const response = await fetch(`/api/sessions/${this.currentSessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, role: 'user' })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const result = await response.json();

      // Remove typing indicator
      this.hideTypingIndicator();

      // Add assistant response
      if (result.assistantMessage) {
        this.appendMessage(result.assistantMessage);
      }

      // Update chat title if it was auto-generated
      if (result.session) {
        this.chatTitle.textContent = result.session.title;
        this.loadChatHistory(); // Refresh sidebar to show updated title
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      this.hideTypingIndicator();
      this.showError('Failed to send message. Please try again.');
    } finally {
      this.isLoading = false;
      this.setLoadingState(false);
    }
  }

  appendMessage(message) {
    const messageElement = this.createMessageElement(message);
    this.messages.appendChild(messageElement);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
      Corgan is typing
      <div class="typing-dots">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `;
    this.messages.appendChild(typingDiv);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  async deleteCurrentChat() {
    if (!this.currentSessionId) return;

    const confirmed = confirm('Are you sure you want to delete this chat? This action cannot be undone.');
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/sessions/${this.currentSessionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Reset UI
        this.currentSessionId = null;
        this.chatTitle.textContent = 'Select a chat or start a new conversation';
        this.deleteChatBtn.style.display = 'none';
        this.showWelcomeMessage();
        this.loadChatHistory(); // Refresh sidebar
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
      this.showError('Failed to delete chat. Please try again.');
    }
  }

  setLoadingState(loading) {
    this.sendBtn.disabled = loading;
    this.messageInput.disabled = loading;
    this.loadingOverlay.style.display = loading ? 'flex' : 'none';
  }

  showWelcomeMessage() {
    this.welcomeMessage.style.display = 'flex';
    this.messages.innerHTML = '';
  }

  hideWelcomeMessage() {
    this.welcomeMessage.style.display = 'none';
  }

  showError(message) {
    // Simple error display - you could make this more sophisticated
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #dc3545;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      z-index: 1001;
      font-size: 14px;
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }

  autoResizeTextarea() {
    const textarea = this.messageInput;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  }

  formatTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  handleUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session');

    if (sessionId) {
      // Wait a moment for the chat history to load, then select the session
      setTimeout(() => {
        this.selectChat(sessionId);
      }, 500);
    }
  }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new ChatApp();
});