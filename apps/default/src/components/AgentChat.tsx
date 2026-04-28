/**
 * AgentChat.tsx — CryptoVerse AI Mentor floating chat widget
 *
 * Uses Agent Chat SDK v2 (@/lib/agent-chat/v2).
 * CRITICAL: conversation is created lazily (only when user opens the panel),
 * so NO network requests fire on page load.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useChat } from '@ai-sdk/react';
import { isToolUIPart } from 'ai';
import type { UIMessage } from 'ai';
import { ulid } from 'ulidx';
import { Bot, X, Send, User, Maximize2, Minimize2, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { createConversation, createAgentChat } from '@/lib/agent-chat/v2';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const AGENT_ID = '01KJBSVC0W4S444HXEJ7C2QJQP';

const STARTER_PROMPTS = [
  'Explain 100x leverage risks',
  'How does scalp trading work?',
  'Review my risk management',
  'Best bot strategy for beginners?',
  // §6.2 Sentiment-aware prompts
  'What does the current Fear & Greed Index mean?',
  'Should I buy when sentiment is extreme fear?',
  'Explain contrarian sentiment trading strategy',
  'How do social media sentiment signals work?',
];

// ─────────────────────────────────────────────────────────────────────────────
// INNER CHAT (only mounted after conversation is created)
// ─────────────────────────────────────────────────────────────────────────────

function ActiveChat({
  chat,
  onClose,
  isExpanded,
  onToggleExpand,
}: {
  chat: ReturnType<typeof createAgentChat>;
  onClose: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const { messages, status, addToolApprovalResponse } = useChat({ chat, id: chat.id });
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const isSending = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(async (text?: string) => {
    const msg = (text ?? inputText).trim();
    if (!msg || isSending) return;
    setInputText('');
    await chat.sendMessage({
      id: ulid(),
      role: 'user',
      parts: [{ type: 'text', text: msg }],
    });
  }, [chat, inputText, isSending]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/20 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.25)' }}>
              <Bot className="h-5 w-5" style={{ color: '#FFD700' }} />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-card" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground">CryptoVerse AI Mentor</h3>
            <p className="text-[10px] text-green-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <button
            onClick={onToggleExpand}
            className="p-1.5 hover:text-foreground transition-colors rounded-lg hover:bg-white/5"
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:text-foreground transition-colors rounded-lg hover:bg-white/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: 'rgba(255,215,0,0.10)', border: '1px solid rgba(255,215,0,0.20)' }}>
              <Sparkles className="h-7 w-7" style={{ color: '#FFD700' }} />
            </div>
            <h4 className="text-base font-bold text-foreground mb-1">CryptoVerse AI Mentor</h4>
            <p className="text-xs text-muted-foreground mb-5 max-w-[220px] mx-auto leading-relaxed">
              Your AI trading mentor. Ask about strategies, risk management, or bot configuration.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {STARTER_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="text-xs px-3 py-1.5 rounded-full transition-all"
                  style={{
                    background: 'rgba(255,215,0,0.08)',
                    border: '1px solid rgba(255,215,0,0.18)',
                    color: '#FFD700',
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg: UIMessage) => (
          <div
            key={msg.id}
            className={cn('flex gap-2.5', msg.role === 'user' ? 'flex-row-reverse' : '')}
          >
            {/* Avatar */}
            <div className={cn(
              'shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5',
              msg.role === 'user'
                ? 'bg-secondary'
                : 'bg-yellow-500/15'
            )}>
              {msg.role === 'user'
                ? <User className="h-3.5 w-3.5 text-muted-foreground" />
                : <Bot className="h-3.5 w-3.5" style={{ color: '#FFD700' }} />}
            </div>

            {/* Bubble */}
            <div className={cn(
              'max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground rounded-tr-none'
                : 'bg-secondary/50 border border-white/5 rounded-tl-none'
            )}>
              {msg.parts.map((part, i) => {
                if (part.type === 'text') {
                  return msg.role === 'user'
                    ? <span key={i}>{part.text}</span>
                    : <ReactMarkdown key={i} className="prose prose-invert prose-sm max-w-none">{part.text}</ReactMarkdown>;
                }
                if (isToolUIPart(part)) {
                  return (
                    <div key={i} className="text-xs text-muted-foreground italic">
                      {part.state === 'approval-requested' && part.approval != null ? (
                        <div className="flex gap-2 mt-1">
                          <span>Run: <strong>{part.toolName}</strong>?</span>
                          <button
                            onClick={() => addToolApprovalResponse({ id: part.approval!.id, approved: true })}
                            className="text-green-400 hover:text-green-300"
                          >Approve</button>
                          <button
                            onClick={() => addToolApprovalResponse({ id: part.approval!.id, approved: false })}
                            className="text-red-400 hover:text-red-300"
                          >Deny</button>
                        </div>
                      ) : (
                        <span>⚙ {part.toolName} [{part.state}]</span>
                      )}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isSending && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,215,0,0.12)' }}>
              <Bot className="h-3.5 w-3.5" style={{ color: '#FFD700' }} />
            </div>
            <div className="bg-secondary/50 border border-white/5 rounded-2xl rounded-tl-none px-3.5 py-2.5">
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/10 bg-black/20 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your mentor…"
            disabled={isSending}
            className="flex-1 bg-secondary/50 border border-white/10 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500/40 disabled:opacity-50 transition-all"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim() || isSending}
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #FFD700 0%, #FFA800 100%)' }}
          >
            {isSending
              ? <Loader2 className="h-4 w-4 animate-spin text-[#0A1929]" />
              : <Send className="h-4 w-4 text-[#0A1929]" />}
          </button>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OUTER COMPONENT — lazy conversation creation
// ─────────────────────────────────────────────────────────────────────────────

export function AgentChat() {
  const [isOpen,     setIsOpen]     = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [chat,       setChat]       = useState<ReturnType<typeof createAgentChat> | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  // Lazy init: only create conversation when user first opens the panel
  const handleOpen = useCallback(async () => {
    setIsOpen(true);
    if (chat) return; // already initialised
    setLoading(true);
    setError(null);
    try {
      const { conversationId } = await createConversation(AGENT_ID);
      setChat(createAgentChat(AGENT_ID, conversationId));
    } catch (e: any) {
      setError('Could not connect to AI mentor. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [chat]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setIsExpanded(false);
  }, []);

  // Floating button (chat closed)
  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-black/40 transition-all hover:scale-105 active:scale-[0.97] z-40"
        style={{
          background: 'linear-gradient(135deg, #FFD700 0%, #FFA800 100%)',
          boxShadow: '0 4px 24px rgba(255,215,0,0.30)',
        }}
        title="CryptoVerse AI Mentor"
      >
        <Bot className="h-6 w-6 text-[#0A1929]" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col overflow-hidden transition-all duration-300',
        'border border-white/10 shadow-2xl',
        isExpanded
          ? 'inset-0 rounded-none'
          : 'bottom-6 right-6 w-full max-w-sm sm:w-96 h-[600px] max-h-[85dvh] rounded-2xl',
      )}
      style={{ background: '#0A1929' }}
    >
      {chat ? (
        <ActiveChat
          chat={chat}
          onClose={handleClose}
          isExpanded={isExpanded}
          onToggleExpand={() => setIsExpanded(e => !e)}
        />
      ) : (
        /* Loading / error state */
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.25)' }}>
                <Bot className="h-5 w-5" style={{ color: '#FFD700' }} />
              </div>
              <span className="font-bold text-sm">CryptoVerse AI Mentor</span>
            </div>
            <button onClick={handleClose} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
            {loading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#FFD700' }} />
                <p className="text-sm text-muted-foreground">Connecting to AI Mentor…</p>
              </>
            ) : error ? (
              <>
                <Bot className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-red-400">{error}</p>
                <button
                  onClick={handleOpen}
                  className="text-xs px-4 py-2 rounded-xl transition-all"
                  style={{ background: 'rgba(255,215,0,0.10)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.22)' }}
                >
                  Retry
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
