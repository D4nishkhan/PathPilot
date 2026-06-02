import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { Bot, Send, Loader2, Plus, Copy } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { aiAPI } from '../lib/api';
import type { AIChat, ChatMessage } from '../types/index';
import { useAuthStore } from '../store';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

export default function AITutor() {
  const { user } = useAuthStore();
  const [chats, setChats] = useState<AIChat[]>([]);
  const [currentChat, setCurrentChat] = useState<AIChat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);
  const sidebarVisible = true;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => {
    aiAPI.getChatHistory().then((res) => {
      setChats(res.data.chats);
    }).finally(() => setLoadingChats(false));
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const loadChat = async (chat: AIChat) => {
    const res = await aiAPI.getChat(chat._id);
    setCurrentChat(res.data.chat);
    setMessages(res.data.chat.messages || []);
  };

  const startNewChat = () => {
    setCurrentChat(null);
    setMessages([]);
    inputRef.current?.focus();
  };

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = { role: 'user', content: input, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiAPI.sendMessage({
        message: input,
        chatId: currentChat?._id,
      });

      const aiMessage: ChatMessage = { role: 'assistant', content: res.data.response, timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, aiMessage]);

      // Update chat ID if new chat
      if (!currentChat) {
        const chatId = res.data.chatId;
        setCurrentChat({ _id: chatId, title: input.substring(0, 50), sessionType: 'tutor', messages: [], totalMessages: 2, updatedAt: new Date().toISOString() });
        // Refresh chat list
        aiAPI.getChatHistory().then((r) => setChats(r.data.chats));
      }
    } catch (err: any) {
      if (err.response?.data?.code === 'UPGRADE_REQUIRED') {
        toast.error(err.response.data.message);
        setMessages(prev => prev.slice(0, -1));
        setInput(userMessage.content);
      } else {
        toast.error('Failed to get response');
        setMessages(prev => prev.slice(0, -1));
      }
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  };

  const QUICK_PROMPTS = [
    'Explain recursion with an example and use case',
    'What is the difference between Stack and Heap?',
    'How does async/await work in JavaScript?',
    'Explain the SOLID principles with examples',
    'What is time complexity of common algorithms?',
    'Debug: my React component re-renders infinitely',
  ];

  return (
    <AppLayout title="AI Tutor">
      <div className="max-w-7xl mx-auto flex gap-4 h-[calc(100vh-9rem)]">
        {/* Sidebar */}
        <div className={`w-64 flex-shrink-0 flex flex-col gap-3 ${sidebarVisible ? '' : 'hidden lg:flex'}`}>
          <button onClick={startNewChat} className="btn-primary text-sm justify-center py-2.5">
            <Plus size={16} /> New Chat
          </button>

          <div className="glass-card flex-1 overflow-y-auto p-2 space-y-1">
            <p className="text-xs text-slate-600 uppercase tracking-wider px-2 py-1">Chat History</p>
            {loadingChats ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="skeleton h-12 rounded-lg" />)}
              </div>
            ) : chats.length === 0 ? (
              <p className="text-xs text-slate-600 text-center py-6">No conversations yet</p>
            ) : (
              chats.map((chat) => (
                <button
                  key={chat._id}
                  onClick={() => loadChat(chat)}
                  className={`w-full text-left p-2.5 rounded-xl text-sm transition-all ${
                    currentChat?._id === chat._id
                      ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/25'
                      : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
                  }`}
                >
                  <p className="truncate font-medium text-xs">{chat.title}</p>
                  <p className="text-xs text-slate-700 mt-0.5">
                    {formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true })}
                  </p>
                </button>
              ))
            )}
          </div>

          {/* Usage info */}
          {user?.plan === 'free' && (
            <div className="glass-card p-3 text-center">
              <p className="text-xs text-slate-500">Free: 10 messages/day</p>
              <a href="/pricing" className="btn-primary text-xs py-1.5 mt-2 w-full justify-center">Upgrade →</a>
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 glass-card flex flex-col overflow-hidden">
          {/* Chat header */}
          <div className="flex items-center gap-3 p-4 border-b border-white/5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Bot size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">PathPilot AI Tutor</p>
              <p className="text-xs text-green-400">● Online</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-4 animate-pulse-glow">
                  <Bot size={32} className="text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-300 mb-2">Your AI Tutor is Ready!</h3>
                <p className="text-slate-500 text-sm mb-6 max-w-sm">
                  Ask me anything — programming concepts, debugging help, DSA problems, system design, or interview prep.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
                  {QUICK_PROMPTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setInput(p)}
                      className="text-left px-3 py-2.5 bg-white/3 border border-white/8 rounded-xl text-xs text-slate-400 hover:bg-indigo-500/10 hover:border-indigo-500/30 hover:text-slate-200 transition-all"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot size={15} className="text-white" />
                    </div>
                  )}
                  <div className={msg.role === 'user' ? 'chat-user' : 'chat-ai max-w-[90%]'}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-200">{msg.content}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-slate-700">
                        {msg.timestamp ? formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true }) : ''}
                      </span>
                      {msg.role === 'assistant' && (
                        <button
                          onClick={() => copyText(msg.content)}
                          className="text-slate-700 hover:text-slate-400 transition-colors"
                        >
                          <Copy size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Loading indicator */}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Bot size={15} className="text-white" />
                </div>
                <div className="chat-ai flex items-center gap-2">
                  <Loader2 size={15} className="text-indigo-400 animate-spin" />
                  <span className="text-sm text-slate-500">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/5">
            <form onSubmit={sendMessage} className="flex gap-3">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(e as any);
                  }
                }}
                placeholder="Ask anything — code, concepts, debugging, interview prep..."
                id="ai-tutor-input"
                className="input-field flex-1 resize-none min-h-[44px] max-h-32"
                rows={1}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="btn-primary px-4 flex-shrink-0 self-end"
              >
                <Send size={18} />
              </button>
            </form>
            <p className="text-xs text-slate-700 mt-2 text-center">Press Enter to send, Shift+Enter for new line</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
