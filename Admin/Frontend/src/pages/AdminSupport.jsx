import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  MessageSquare,
  Paperclip,
  Send,
  ChevronDown,
  ChevronRight,
  Shield,
  User,
  CheckCheck
} from 'lucide-react';
import '../styles/dashboard.css';

export default function AdminSupport() {
  const [conversations, setConversations] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [inputMessage, setInputMessage] = useState('');
  const [activeChat, setActiveChat] = useState(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await api.get('/support');
      const formatted = res.data.data.map(t => ({
        id: t.id,
        name: t.customer?.user?.email?.split('@')[0] || 'Customer',
        phone: t.customer?.user?.phone || 'N/A',
        issue: t.subject,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        status: t.status,
        messages: [] // loaded on click
      }));
      setConversations(formatted);
      if (formatted.length > 0 && !selectedChatId) {
        handleSelectChat(formatted[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch support tickets', err);
    }
  };

  const handleSelectChat = async (id) => {
    setSelectedChatId(id);
    try {
      const res = await api.get(`/support/${id}`);
      const t = res.data.data;
      const formattedChat = {
        id: t.id,
        name: t.customer?.user?.email?.split('@')[0] || 'Customer',
        phone: t.customer?.user?.phone || 'N/A',
        issue: t.subject,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        status: t.status,
        messages: t.messages.map(m => ({
          sender: m.senderId === t.customer?.userId ? 'customer' : 'admin',
          text: m.message,
          time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }))
      };
      setActiveChat(formattedChat);
    } catch (err) {
      console.error('Failed to fetch ticket messages', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeChat) return;

    try {
      await api.post(`/support/${activeChat.id}/message`, {
        message: inputMessage
      });
      setInputMessage('');
      handleSelectChat(activeChat.id); // Refresh chat
    } catch (err) {
      alert('Failed to send message');
    }
  };

  return (
    <div className="support-view-container">
      <div className="support-chat-layout">
        {/* LEFT CONVERSATIONS LIST SIDEBAR */}
        <div className="chat-sidebar-panel">
          <div className="chat-sidebar-header">
            <MessageSquare size={18} color="#FFD21F" />
            <span>Conversations</span>
          </div>

          <div className="conversations-list">
            {conversations.map((chat) => (
              <div
                key={chat.id}
                className={`conversation-item ${chat.id === selectedChatId ? 'active' : ''}`}
                onClick={() => handleSelectChat(chat.id)}
              >
                <div className="chat-avatar-wrapper">
                  <img src={chat.avatar} alt={chat.name} className="chat-avatar" />
                </div>
                <div className="chat-meta">
                  <span className="chat-name">{chat.name}</span>
                  <span className="chat-issue">{chat.issue}</span>
                </div>
                <div className="chat-item-arrow">
                  {chat.id === selectedChatId ? (
                    <span className="yellow-dot-badge"></span>
                  ) : (
                    <ChevronRight size={14} color="#6B7280" />
                  )}
                </div>
              </div>
            ))}
          </div>

          <button className="view-all-convos-btn">View All Conversations</button>
        </div>

        {/* RIGHT CHAT WORKSPACE AREA */}
        <div className="chat-workspace-panel">
          {/* Top Header Bar */}
          <div className="chat-header-bar">
            <div className="active-user-meta">
              <img src={activeChat.avatar} alt={activeChat.name} className="chat-header-avatar" />
              <div>
                <h3 className="active-user-name">{activeChat.name}</h3>
                <span className="active-user-phone">{activeChat.phone}</span>
              </div>
            </div>

            <div className="status-dropdown-box">
              <span className="green-status-dot"></span>
              <span className="status-text">{activeChat.status}</span>
              <ChevronDown size={14} color="#9CA3AF" />
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="chat-messages-container">
            {activeChat.messages.map((msg, idx) => (
              <div key={idx} className={`message-row ${msg.sender}`}>
                {msg.sender === 'customer' && (
                  <img src={activeChat.avatar} alt={activeChat.name} className="msg-avatar" />
                )}
                <div className={`message-bubble ${msg.sender}`}>
                  <p className="msg-text">{msg.text}</p>
                  <div className="msg-footer">
                    <span className="msg-time">{msg.time}</span>
                    {msg.sender === 'admin' && (
                      <CheckCheck size={14} className="double-check-icon" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Message Input Bar */}
          <form className="chat-input-bar" onSubmit={handleSendMessage}>
            <input
              type="text"
              className="chat-text-input"
              placeholder="Type a message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
            />
            <div className="chat-input-actions">
              <button type="button" className="attach-btn" title="Attach file">
                <Paperclip size={18} />
              </button>
              <button type="submit" className="send-btn" title="Send Message">
                <Send size={16} fill="#000" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
