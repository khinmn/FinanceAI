import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Plus, Trash2, Send, Sparkles, Clock, Bot, User, Menu, X
} from 'lucide-react';
import { chatApi } from '../api/chat';
import type { ChatSession, ChatMessage } from '../types';
import Button from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';

export default function AiAssistantPage() {
  const aiDisclaimerEnabled = useAuthStore((s) => s.aiDisclaimerEnabled);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch all chat sessions on mount
  const loadSessions = useCallback(async (selectIdAfterLoad?: number) => {
    setSessionsLoading(true);
    try {
      const res = await chatApi.getSessions();
      setSessions(res.sessions);
      
      // Auto-select session if specified or if we have sessions and none is selected
      if (selectIdAfterLoad) {
        setActiveSessionId(selectIdAfterLoad);
      } else if (res.sessions.length > 0 && activeSessionId === null) {
        // Option to select first session by default
        setActiveSessionId(res.sessions[0].id);
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to load chat history.', 'error');
    } finally {
      setSessionsLoading(false);
    }
  }, [activeSessionId]);

  useEffect(() => {
    loadSessions();
  }, []);

  // Fetch messages for active session
  useEffect(() => {
    if (activeSessionId === null) {
      setMessages([]);
      return;
    }

    const loadSessionMessages = async () => {
      setChatLoading(true);
      try {
        const res = await chatApi.getSession(activeSessionId);
        setMessages(res.session.messages || []);
      } catch (e) {
        console.error(e);
        showToast('Failed to load messages.', 'error');
      } finally {
        setChatLoading(false);
      }
    };

    loadSessionMessages();
  }, [activeSessionId]);

  // Scroll to bottom whenever messages or loading state changes
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sendLoading]);

  // Handle start of new chat session
  const handleNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 100);
    // On small screens, hide sidebar after clicking new chat
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  // Handle sending a message
  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || sendLoading) return;

    // Build temporary user message
    const tempUserMsg: ChatMessage = {
      id: Date.now(),
      session_id: activeSessionId ?? 0,
      role: 'user',
      content: textToSend,
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setInput('');
    setSendLoading(true);

    try {
      const res = await chatApi.sendMessage(textToSend, activeSessionId ?? undefined);
      
      // Add assistant message
      setMessages((prev) => [...prev, res.assistant_message]);

      if (!activeSessionId) {
        // Dynamic new session was created on backend, set active and refresh session list
        setActiveSessionId(res.session_id);
        loadSessions(res.session_id);
      } else {
        // Just reload session list to update session timestamps/titles
        loadSessions(activeSessionId);
      }
    } catch (e: any) {
      console.error(e);
      const tempErrorMsg: ChatMessage = {
        id: Date.now() + 1,
        session_id: activeSessionId ?? 0,
        role: 'assistant',
        content: '⚠️ Sorry, I could not reach the server. Please check your connection and try again.',
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, tempErrorMsg]);
    } finally {
      setSendLoading(false);
    }
  };

  // Handle session deletion
  const handleDeleteSession = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent select session trigger
    if (!confirm('Are you sure you want to delete this conversation?')) return;

    try {
      await chatApi.deleteSession(id);
      showToast('Conversation deleted.');
      
      if (activeSessionId === id) {
        setActiveSessionId(null);
        setMessages([]);
      }
      
      // Reload sessions and select the first one if available
      const remainingSessions = sessions.filter(s => s.id !== id);
      setSessions(remainingSessions);
      if (remainingSessions.length > 0) {
        setActiveSessionId(remainingSessions[0].id);
      } else {
        setActiveSessionId(null);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to delete conversation.', 'error');
    }
  };

  // Custom block-based Markdown parser for Kyat signs, list alignment, and bold text
  const renderMarkdown = (text: string) => {
    const blocks = text.split(/\n\n+/);

    const parseInlineStyles = (rawText: string) => {
      const parts = rawText.split(/\*\*([^*]+)\*\*/g);
      if (parts.length === 1) return rawText;
      return parts.map((part, index) => {
        if (index % 2 === 1) {
          return <strong key={index} className="font-bold text-[#2D1A54] bg-[#EFE6FD] px-1 rounded">{part}</strong>;
        }
        return part;
      });
    };

    return blocks.map((block, bIdx) => {
      const trimmedBlock = block.trim();
      if (!trimmedBlock) return null;

      // Headers
      if (trimmedBlock.startsWith('# ')) {
        return (
          <h3 key={bIdx} className="text-[15px] font-extrabold text-[#2D1A54] border-b border-[#E5DCFC] pb-2 mt-2 first:mt-0">
            {parseInlineStyles(trimmedBlock.slice(2))}
          </h3>
        );
      }
      if (trimmedBlock.startsWith('## ')) {
        return (
          <h4 key={bIdx} className="text-[15px] font-extrabold text-[#5B39A8] mt-2 first:mt-0">
            {parseInlineStyles(trimmedBlock.slice(3))}
          </h4>
        );
      }
      if (trimmedBlock.startsWith('### ')) {
        return (
          <h5 key={bIdx} className="text-[15px] font-bold text-[#7C3AED] mt-2 first:mt-0">
            {parseInlineStyles(trimmedBlock.slice(4))}
          </h5>
        );
      }

      // Check if block represents a list
      const lines = trimmedBlock.split('\n');
      const isListBlock = lines.some(line => {
        const tLine = line.trim();
        return tLine.match(/^[-*]\s+/) || tLine.match(/^\*\*[-*]\s*/) || tLine.match(/^(\d+)\.\s+/) || tLine.match(/^\*\*(\d+)\.\s*/);
      });

      if (isListBlock) {
        return (
          <div key={bIdx} className="space-y-2">
            {lines.map((line, lIdx) => {
              const trimmedLine = line.trim();
              
              // Bullet lists
              let isBullet = false;
              let bulletRestText = '';
              const matchNormalBullet = trimmedLine.match(/^[-*]\s+(.*)/);
              const matchBoldBullet = trimmedLine.match(/^\*\*[-*]\s*(.*)/);

              if (matchBoldBullet) {
                isBullet = true;
                bulletRestText = matchBoldBullet[1].includes('**') ? '**' + matchBoldBullet[1] : matchBoldBullet[1];
              } else if (matchNormalBullet) {
                isBullet = true;
                bulletRestText = matchNormalBullet[1];
              }

              if (isBullet) {
                return (
                  <div key={lIdx} className="flex gap-1 text-[15px] text-[#3B3054] leading-relaxed items-start pl-4">
                    <span className="flex-shrink-0 w-5 flex justify-end items-center pr-1.5 h-6 text-[15px] text-[#3B3054] select-none font-bold">•</span>
                    <span className="flex-1">{parseInlineStyles(bulletRestText)}</span>
                  </div>
                );
              }

              // Numbered lists
              let isNumbered = false;
              let numRestText = '';
              const matchNormalNum = trimmedLine.match(/^(\d+)\.\s+(.*)/);
              const matchBoldStartNum = trimmedLine.match(/^\*\*(\d+)\.\s*(.*)/);
              const matchBoldBothNum = trimmedLine.match(/^\*\*(\d+)\.\*\*\s*(.*)/);

              if (matchBoldBothNum) {
                isNumbered = true;
                numRestText = matchBoldBothNum[2];
              } else if (matchBoldStartNum) {
                isNumbered = true;
                numRestText = matchBoldStartNum[2].includes('**') ? '**' + matchBoldStartNum[2] : matchBoldStartNum[2];
              } else if (matchNormalNum) {
                isNumbered = true;
                numRestText = matchNormalNum[2];
              }

              if (isNumbered) {
                return (
                  <div key={lIdx} className="flex gap-1 text-[15px] text-[#3B3054] leading-relaxed items-start pl-4">
                    <span className="flex-shrink-0 w-5 flex justify-end items-center pr-1.5 h-6 text-[15px] text-[#3B3054] select-none font-bold">•</span>
                    <span className="flex-1">{parseInlineStyles(numRestText)}</span>
                  </div>
                );
              }

              return (
                <p key={lIdx} className="text-[15px] text-[#3B3054] leading-relaxed pl-4">
                  {parseInlineStyles(trimmedLine)}
                </p>
              );
            })}
          </div>
        );
      }

      // Standard paragraph - merge single-line hard breaks
      const mergedText = lines.map(line => line.trim()).join(' ');

      return (
        <p key={bIdx} className="text-[15px] text-[#3B3054] leading-relaxed">
          {parseInlineStyles(mergedText)}
        </p>
      );
    });
  };

  const SUGGESTIONS = [
    { label: 'Summarize my net balance', text: 'What is my current net balance and monthly cash flow summary?' },
    { label: 'Find my highest expenses', text: 'Which categories are showing the highest expenses this month?' },
    { label: 'Exceeding budget alerts', text: 'Are there any budget limits that I have exceeded or am close to exceeding?' },
    { label: 'Cash flow improvement tips', text: 'How can I optimize my expenses and improve my overall savings rate?' },
  ];

  return (
    <div className="flex h-[calc(100vh-100px)] border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-soft font-sans relative">
      
      {/* Session History Sidebar */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="flex-shrink-0 bg-gray-50 border-r border-gray-100 flex flex-col h-full overflow-hidden"
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <span className="text-[15px] font-bold text-dark-500 uppercase tracking-wider">Chat History</span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1.5 rounded-lg text-dark-400 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* New Chat Button */}
            <div className="p-4">
              <Button
                onClick={handleNewChat}
                className="w-full flex items-center justify-center gap-2 text-[15px] shadow-sm py-2.5"
                size="sm"
              >
                <Plus className="w-4 h-4" />
                New Conversation
              </Button>
            </div>

            {/* Scrollable Session List */}
            <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
              {sessionsLoading && sessions.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-brand-400/30 border-t-brand-500 rounded-full animate-spin" />
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-[15px] text-dark-400 text-center py-8 font-medium">No previous conversations.</p>
              ) : (
                sessions.map((s) => {
                  const isActive = activeSessionId === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        setActiveSessionId(s.id);
                        if (window.innerWidth < 1024) setSidebarOpen(false);
                      }}
                      className={`group flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-all duration-200 ${
                        isActive
                          ? 'bg-[#EDE5FC] text-[#2D1A54] border border-[#E5DCFC] font-semibold'
                          : 'text-dark-600 hover:bg-gray-100 hover:text-dark-900 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <MessageSquare className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#7C3AED]' : 'text-dark-400'}`} />
                        <span className="text-[15px] truncate block pr-2 leading-tight">
                          {s.title || 'Finance Chat'}
                        </span>
                      </div>
                      
                      <button
                        onClick={(e) => handleDeleteSession(s.id, e)}
                        className={`p-1 rounded hover:bg-danger/10 hover:text-danger text-dark-400 transition-opacity ${
                          isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                        title="Delete Session"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Panel */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[#FDFDFD]">
        
        {/* Chat Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 -ml-2 rounded-xl text-dark-500 hover:bg-gray-50 focus:outline-none"
              title="Toggle Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#EDE5FC] text-[#7C3AED] border border-[#E5DCFC]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-dark-900 text-[15px] leading-tight">FinanceAI Assistant</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                <span className="text-[12px] text-dark-400 font-bold">Powered by Gemini 2.5 Flash</span>
              </div>
            </div>
          </div>
        </div>

        {/* Inline Toast Notification Banner */}
        <AnimatePresence>
          {toast && (
            <div className="px-6 pt-2">
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs font-semibold shadow-sm ${
                  toast.type === 'success'
                    ? 'bg-success/10 border-success/20 text-success'
                    : 'bg-danger/10 border-danger/20 text-danger'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span>{toast.type === 'success' ? '✓' : '⚠'}</span>
                  {toast.message}
                </span>
                <button type="button" onClick={() => setToast(null)} className="ml-2 opacity-65 hover:opacity-100 font-bold">
                  ✕
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Messages List Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 min-h-0 bg-gray-50/30">
          {chatLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <div className="w-8 h-8 border-3 border-brand-100 border-t-brand-500 rounded-full animate-spin" />
              <span className="text-[15px] text-dark-400 font-semibold">Loading messages...</span>
            </div>
          ) : messages.length === 0 ? (
            /* Suggestions Splash screen */
            <div className="max-w-2xl mx-auto h-full flex flex-col justify-center space-y-6">
              <div className="text-center space-y-2">
                <Sparkles className="w-12 h-12 text-[#7C3AED] mx-auto opacity-75" />
                <h3 className="text-lg font-bold text-dark-900">How can I assist your business today?</h3>
                <p className="text-[15px] text-dark-400 font-semibold max-w-md mx-auto">
                  I can analyze your transactions, review your category budgets, explain cash flow warnings, and suggest optimizations.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                {SUGGESTIONS.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(s.text)}
                    className="p-4 rounded-2xl bg-white border border-gray-100 text-dark-700 text-[15px] font-semibold hover:text-brand-600 hover:border-brand-200 hover:shadow-soft transition-all text-left flex flex-col justify-between h-28 hover:-translate-y-0.5 duration-200 group"
                  >
                    <span>{s.label}</span>
                    <span className="text-dark-400 font-medium group-hover:text-brand-500 truncate w-full mt-2 text-[13px]">
                      {s.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3.5 ${isUser ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-sm ${
                      isUser
                        ? 'bg-brand-50 text-brand-600 border-brand-100'
                        : 'bg-[#EDE5FC] text-[#7C3AED] border-[#E5DCFC]'
                    }`}>
                      {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    <div className={`flex flex-col space-y-1 max-w-[85%] ${isUser ? 'items-end' : ''}`}>
                      <div className={`rounded-2xl leading-relaxed shadow-sm ${
                        isUser
                          ? 'px-6 py-4 text-[15px] bg-brand-600 text-white rounded-tr-none'
                          : 'p-6 md:p-8 text-[15px] bg-[#F8F5FE] border border-[#E5DCFC] text-[#3B3054] rounded-tl-none'
                      }`}>
                        {isUser ? (
                          <p className="whitespace-pre-wrap font-medium">{msg.content}</p>
                        ) : (
                          <div className="max-w-none text-[#3B3054] leading-relaxed font-sans space-y-4">
                            {renderMarkdown(msg.content)}
                          </div>
                        )}
                      </div>
                      
                      {/* Timestamp */}
                      <span className="text-[12px] text-dark-400 font-bold px-1.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 opacity-60" />
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Server/AI Typing Indicator */}
              {sendLoading && (
                <div className="flex gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-[#EDE5FC] text-[#7C3AED] border-[#E5DCFC] flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Bot className="w-4 h-4 animate-pulse" />
                  </div>
                  <div className="px-4.5 py-3.5 rounded-2xl rounded-tl-none bg-[#F8F5FE] border border-[#E5DCFC] shadow-sm">
                    <div className="flex gap-1.5 items-center h-4">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={chatBottomRef} />
            </div>
          )}
        </div>

        {/* Input Bar Section */}
        <div className="px-6 py-4 border-t border-gray-100 bg-white">
          <div className="max-w-3xl mx-auto flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask me about budgets, cash flow, or transactions..."
              className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-dark-800 text-[15px] placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/40 transition-all font-medium"
              disabled={sendLoading}
            />
            
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || sendLoading}
              className="px-5 rounded-xl bg-brand-600 flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200 flex-shrink-0 hover:bg-brand-700"
            >
              <Send className="w-4 h-4 mr-2" />
              <span className="text-[15px] font-bold uppercase tracking-wider">Send</span>
            </motion.button>
          </div>
          {aiDisclaimerEnabled !== false && (
            <p className="text-dark-400 text-[12px] font-bold mt-2.5 text-center">
              AI Assistant responses are guidance notes. They do not constitute formal legal, accounting, or professional financial advice.
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
