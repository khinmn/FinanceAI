import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Sparkles, Trash2 } from 'lucide-react';
import { chatApi } from '../../api/chat';
import type { ChatMessage } from '../../types';
import { useAuthStore } from '../../store/authStore';

export default function ChatWidget() {
  const aiDisclaimerEnabled = useAuthStore((s) => s.aiDisclaimerEnabled);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now(),
      session_id: sessionId ?? 0,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await chatApi.sendMessage(text, sessionId ?? undefined);
      if (!sessionId) setSessionId(res.session_id);
      setMessages((m) => [...m, res.assistant_message]);
      if (!open) setUnread((u) => u + 1);
    } catch (err) {
      const errMsg: ChatMessage = {
        id: Date.now() + 1,
        session_id: sessionId ?? 0,
        role: 'assistant',
        content: '⚠️ Sorry, I had trouble connecting. Please try again.',
        created_at: new Date().toISOString(),
      };
      setMessages((m) => [...m, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSessionId(null);
  };

  const renderMarkdown = (text: string) => {
    const blocks = text.split(/\n\n+/);

    const parseInlineStyles = (rawText: string) => {
      const parts = rawText.split(/\*\*([^*]+)\*\*/g);
      if (parts.length === 1) return rawText;
      return parts.map((part, index) => {
        if (index % 2 === 1) {
          return <strong key={index} className="font-bold text-[#2D1A54] dark:text-brand-300 bg-[#EFE6FD] dark:bg-brand-950/40 px-1 rounded text-sm">{part}</strong>;
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
          <h3 key={bIdx} className="text-sm font-extrabold text-[#2D1A54] dark:text-white mt-4 mb-2 first:mt-0 border-b border-[#E5DCFC] dark:border-dark-700 pb-1">
            {parseInlineStyles(trimmedBlock.slice(2))}
          </h3>
        );
      }
      if (trimmedBlock.startsWith('## ')) {
        return (
          <h4 key={bIdx} className="text-sm font-extrabold text-[#5B39A8] dark:text-brand-300 mt-4 mb-2 first:mt-0">
            {parseInlineStyles(trimmedBlock.slice(3))}
          </h4>
        );
      }
      if (trimmedBlock.startsWith('### ')) {
        return (
          <h5 key={bIdx} className="text-sm font-bold text-[#7C3AED] dark:text-brand-400 mt-3 mb-1">
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
          <div key={bIdx} className="space-y-1.5 my-1.5">
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
                  <div key={lIdx} className="flex gap-1 text-sm text-[#3B3054] dark:text-dark-300 leading-relaxed items-start pl-6">
                    <span className="flex-shrink-0 w-6 flex justify-end items-center pr-2 h-5 text-sm text-[#3B3054] dark:text-dark-300 select-none font-bold">•</span>
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
                  <div key={lIdx} className="flex gap-1 text-sm text-[#3B3054] dark:text-dark-300 leading-relaxed items-start pl-6">
                    <span className="flex-shrink-0 w-6 flex justify-end items-center pr-2 h-5 text-sm text-[#3B3054] dark:text-dark-300 select-none font-bold">•</span>
                    <span className="flex-1">{parseInlineStyles(numRestText)}</span>
                  </div>
                );
              }

              return (
                <p key={lIdx} className="text-sm text-[#3B3054] dark:text-dark-300 leading-relaxed pl-6">
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
        <p key={bIdx} className="text-sm text-[#3B3054] dark:text-dark-300 leading-relaxed my-1.5">
          {parseInlineStyles(mergedText)}
        </p>
      );
    });
  };

  const SUGGESTIONS = [
    'What is my net balance?',
    'Which expenses are highest?',
    'Am I spending too much?',
    'How can I improve cash flow?',
  ];

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-6 right-6 z-40">
        <AnimatePresence>
          {!open && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setOpen(true)}
              className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center shadow-xl shadow-brand-600/30 relative hover:bg-brand-500 transition-colors duration-200"
            >
              <MessageCircle className="w-6 h-6 text-white" />
              {unread > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {unread}
                </div>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="fixed bottom-6 right-6 z-40 w-[380px] h-[550px] max-h-[80vh] flex flex-col bg-white dark:bg-dark-800 border border-dark-100 dark:border-dark-700 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-dark-100/50 dark:border-dark-700 bg-white dark:bg-dark-800">
              <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-dark-900 dark:text-white text-sm font-bold">FinanceAI Assistant</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  <p className="text-dark-400 dark:text-dark-400 text-xs font-medium">Powered by Gemini 2.5 Flash</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={clearChat}
                    className="p-1.5 rounded-lg text-dark-400 hover:text-dark-700 dark:hover:text-white hover:bg-dark-50 dark:hover:bg-dark-700 transition-all"
                    title="Clear chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg text-dark-400 hover:text-dark-700 dark:hover:text-white hover:bg-dark-50 dark:hover:bg-dark-700 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0 bg-gray-50/50 dark:bg-dark-900/30">
              {messages.length === 0 && (
                <div className="space-y-4">
                  <div className="text-center py-2">
                    <p className="text-dark-400 dark:text-dark-400 text-xs font-medium">Ask me anything about your business finances</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => { setInput(s); inputRef.current?.focus(); }}
                        className="p-3 rounded-xl bg-white dark:bg-dark-800 border border-dark-100 dark:border-dark-700 text-dark-700 dark:text-dark-300 text-xs font-semibold hover:text-brand-600 hover:border-brand-200 dark:hover:border-brand-700 hover:shadow-soft transition-all text-left"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user'
                      ? 'bg-brand-50 dark:bg-brand-950/20 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-900/50 shadow-sm'
                      : 'bg-[#EDE5FC] dark:bg-brand-950/20 text-[#7C3AED] dark:text-brand-400 border border-[#E5DCFC] dark:border-brand-900/50 shadow-sm'
                  }`}>
                    {msg.role === 'user'
                      ? <User className="w-3.5 h-3.5" />
                      : <Bot className="w-3.5 h-3.5" />
                  }
                  </div>
                  <div className={`max-w-[80%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-brand-600 text-white rounded-tr-sm shadow-sm font-medium'
                      : 'bg-[#F8F5FE] dark:bg-dark-800 border border-[#E5DCFC] dark:border-dark-700 text-[#3B3054] dark:text-dark-300 rounded-tl-sm shadow-sm font-medium'
                  }`}>
                    {msg.role === 'user' ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="space-y-2">{renderMarkdown(msg.content)}</div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#EDE5FC] dark:bg-brand-950/20 text-[#7C3AED] dark:text-brand-400 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="px-3.5 py-3 rounded-xl rounded-tl-sm bg-[#F8F5FE] dark:bg-dark-800 border border-[#E5DCFC] dark:border-dark-700 shadow-sm">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-brand-400 dark:bg-brand-500 animate-pulse"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-dark-100/50 dark:border-dark-700 bg-white dark:bg-dark-800">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Ask about your finances…"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-dark-900 border border-dark-100 dark:border-dark-700 text-dark-800 dark:text-white text-sm placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/40 transition-all font-medium"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200 flex-shrink-0 hover:bg-brand-500"
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>
              {aiDisclaimerEnabled !== false && (
                <p className="text-dark-400 dark:text-dark-500 text-[10px] font-medium mt-2 text-center">
                  AI response is for guidance only and does not replace professional financial advice.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
