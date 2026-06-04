import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MessageSquare, Send, Trash2, X, Bot } from 'lucide-react';
import { useAppStore } from '../store/appStore';

function AssistantChat() {
  const appLanguage = useAppStore((s) => s.appLanguage);
  const currentTask = useAppStore((s) => s.currentTask);
  const chatHistory = useAppStore((s) => s.assistantChatHistory);
  const isThinking = useAppStore((s) => s.isAssistantThinking);
  
  const addMessage = useAppStore((s) => s.addAssistantMessage);
  const clearChat = useAppStore((s) => s.clearAssistantChat);
  const setThinking = useAppStore((s) => s.setIsAssistantThinking);

  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Localization strings
  const strings = {
    ru: {
      title: 'AI Наставник',
      placeholder: 'Задайте вопрос...',
      clearConfirm: 'Очистить историю чата?',
      welcome: 'Привет! Я твой AI-помощник CodeMentor. 🚀\n\nТы можешь задать мне любой вопрос по текущей задаче (я помогу разобраться с условием и логикой, но не выдам готовое решение!) или спросить о программировании в целом.',
    },
    en: {
      title: 'AI Mentor',
      placeholder: 'Ask a question...',
      clearConfirm: 'Clear chat history?',
      welcome: 'Hello! I am your CodeMentor AI Assistant. 🚀\n\nFeel free to ask me anything about the current task (I can clarify instructions or logic, but won\'t spoil the solution!) or ask general programming questions.',
    }
  };

  const activeStrings = strings[appLanguage] || strings.ru;

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isThinking, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isThinking) return;

    const userQuery = inputText.trim();
    setInputText('');

    // 1. Add User Message to local state
    addMessage({ role: 'user', content: userQuery });
    setThinking(true);

    try {
      // Prepare message chain for LLM context (exclude timestamp for LLM processing)
      const messageChain = [
        ...chatHistory.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userQuery }
      ];

      // 2. Call Electron IPC api:ask-assistant
      if (window.electronAPI && window.electronAPI.askAssistant) {
        const response = await window.electronAPI.askAssistant({
          messages: messageChain,
          currentTask: currentTask || null,
          appLanguage
        });

        if (response.success && response.data) {
          addMessage({ role: 'assistant', content: response.data });
        } else {
          const errorMsg = appLanguage === 'ru'
            ? 'Произошла ошибка при получении ответа от AI. Пожалуйста, проверьте API-ключи в настройках.'
            : 'An error occurred while getting response from AI. Please check your API keys in Settings.';
          addMessage({ role: 'assistant', content: `❌ *${errorMsg}*` });
        }
      } else {
        // Fallback for browser environments / debug mock
        setTimeout(() => {
          addMessage({
            role: 'assistant',
            content: appLanguage === 'ru' 
              ? 'Я работаю только в десктопной версии (Electron), так как требуются API-ключи.'
              : 'I only work in the desktop version (Electron) because API keys are required.'
          });
        }, 1000);
      }
    } catch (err) {
      addMessage({ role: 'assistant', content: `❌ Error: ${err.message}` });
    } finally {
      setThinking(false);
    }
  };

  const handleClear = () => {
    if (window.confirm(activeStrings.clearConfirm)) {
      clearChat();
    }
  };

  const formatMessageTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Floating Chat Bubble Button */}
      <button
        className={`assistant-chat-bubble ${isOpen ? 'assistant-chat-bubble--active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle AI Assistant"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {/* Chat Window Popup */}
      <div className={`assistant-chat-window ${!isOpen ? 'assistant-chat-window--hidden' : ''}`}>
        {/* Chat Header */}
        <div className="assistant-chat-header">
          <div className="assistant-chat-title">
            <div className="assistant-chat-avatar">
              <Bot size={16} />
            </div>
            <span>{activeStrings.title}</span>
            <span className="assistant-chat-status" />
          </div>
          <div className="assistant-chat-actions">
            {chatHistory.length > 0 && (
              <button 
                className="assistant-chat-action-btn" 
                onClick={handleClear}
                title="Clear Chat"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button 
              className="assistant-chat-action-btn" 
              onClick={() => setIsOpen(false)}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Chat Messages Body */}
        <div className="assistant-chat-body">
          {/* Welcome Message (displayed if no custom chat messages exist) */}
          {chatHistory.length === 0 && (
            <div className="assistant-chat-msg assistant-chat-msg--assistant">
              <div className="assistant-chat-bubble-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {activeStrings.welcome}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Render Message History */}
          {chatHistory.map((msg, index) => (
            <div 
              key={index} 
              className={`assistant-chat-msg assistant-chat-msg--${msg.role}`}
            >
              <div className="assistant-chat-bubble-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content}
                </ReactMarkdown>
              </div>
              <span className="assistant-chat-msg-time">
                {formatMessageTime(msg.timestamp)}
              </span>
            </div>
          ))}

          {/* AI Thinking / Loading indicator */}
          {isThinking && (
            <div className="assistant-chat-thinking">
              <div className="assistant-chat-dot" />
              <div className="assistant-chat-dot" />
              <div className="assistant-chat-dot" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Footer */}
        <div className="assistant-chat-footer">
          <form className="assistant-chat-form" onSubmit={handleSend}>
            <input
              ref={inputRef}
              type="text"
              className="assistant-chat-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={activeStrings.placeholder}
              disabled={isThinking}
            />
            <button
              type="submit"
              className="assistant-chat-send-btn"
              disabled={!inputText.trim() || isThinking}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default AssistantChat;
