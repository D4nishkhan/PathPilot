import { useState, FormEvent, useEffect, useRef } from 'react';
import { Mic, Send, Loader2, ChevronRight, Trophy, ArrowLeft, FileText } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { aiAPI } from '../lib/api';
import type { ChatMessage } from '../types/index';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';

const MODES = [
  { id: 'java', label: 'Java Backend', icon: '☕', desc: 'Spring Boot, JPA, REST APIs, Collections, OOP' },
  { id: 'mern', label: 'MERN Stack', icon: '🌿', desc: 'React, Node.js, Express, MongoDB, APIs' },
  { id: 'dsa', label: 'DSA & Algorithms', icon: '🧮', desc: 'Arrays, Trees, Graphs, DP, Sorting' },
  { id: 'hr', label: 'HR Round', icon: '🤝', desc: 'Behavioral, situational, company fit questions' },
  { id: 'system-design', label: 'System Design', icon: '🏗️', desc: 'Scalability, databases, microservices' },
];

type Phase = 'select' | 'interview' | 'report';

export default function MockInterview() {
  const [mode, setMode] = useState('');
  const [phase, setPhase] = useState<Phase>('select');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [chatId, setChatId] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const startInterview = async () => {
    setLoading(true);
    try {
      const res = await aiAPI.startInterview({ mode });
      const aiMsg: ChatMessage = { role: 'assistant', content: res.data.response };
      setMessages([aiMsg]);
      setChatId(res.data.chatId);
      setPhase('interview');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to start interview');
    } finally {
      setLoading(false);
    }
  };

  const sendAnswer = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setQuestionCount(q => q + 1);

    try {
      const res = await aiAPI.startInterview({ message: input, chatId, mode });
      const aiMsg: ChatMessage = { role: 'assistant', content: res.data.response };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      toast.error('Failed to send answer');
    } finally {
      setLoading(false);
    }
  };

  const finishInterview = async () => {
    setLoading(true);
    try {
      const res = await aiAPI.getInterviewReport({ chatId, mode });
      setReport(res.data);
      setPhase('report');
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  // ─── SELECT PHASE ─────────────────────────────────────────────
  if (phase === 'select') return (
    <AppLayout title="Mock Interview">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Mic className="text-red-400" size={26} /> Mock Interview
          </h1>
          <p className="text-slate-500 text-sm mt-1">Practice with an AI interviewer. Get evaluated and improve.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`glass-card p-5 text-left transition-all ${
                mode === m.id ? 'border-indigo-500/50 bg-indigo-500/5' : ''
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{m.icon}</span>
                <span className="font-semibold text-slate-200">{m.label}</span>
              </div>
              <p className="text-xs text-slate-500">{m.desc}</p>
              {mode === m.id && (
                <div className="mt-2 badge badge-primary text-xs">Selected ✓</div>
              )}
            </button>
          ))}
        </div>

        <div className="glass-card p-5 mb-6 border-yellow-500/20 bg-yellow-500/5">
          <h3 className="text-sm font-semibold text-yellow-300 mb-2">📋 How it works</h3>
          <ul className="text-xs text-slate-400 space-y-1">
            <li>• AI will ask you 5-8 interview questions one at a time</li>
            <li>• Answer naturally, as you would in a real interview</li>
            <li>• AI evaluates your answers for correctness, depth, and clarity</li>
            <li>• After finishing, you'll receive a detailed evaluation report</li>
          </ul>
        </div>

        <button
          onClick={startInterview}
          disabled={!mode || loading}
          className="btn-primary text-base px-8 py-3 w-full justify-center"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : `Start ${MODES.find(m => m.id === mode)?.label || ''} Interview →`}
        </button>
      </div>
    </AppLayout>
  );

  // ─── INTERVIEW PHASE ─────────────────────────────────────────
  if (phase === 'interview') return (
    <AppLayout title="Mock Interview">
      <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-9rem)]">
        {/* Header */}
        <div className="glass-card p-4 flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
              <Mic size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">
                {MODES.find(m => m.id === mode)?.label} Interview
              </p>
              <p className="text-xs text-green-400">● Live Interview</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">{questionCount} questions answered</span>
            {questionCount >= 4 && (
              <button onClick={finishInterview} disabled={loading} className="btn-primary text-xs px-3 py-1.5">
                {loading ? <Loader2 size={12} className="animate-spin" /> : 'Finish & Get Report'}
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 glass-card p-4 overflow-y-auto space-y-4 mb-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center flex-shrink-0 mt-1 text-sm">
                  🎯
                </div>
              )}
              <div className={msg.role === 'user' ? 'chat-user' : 'chat-ai max-w-[85%]'}>
                {msg.role === 'assistant' ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm text-slate-200">{msg.content}</p>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-sm">🎯</div>
              <div className="chat-ai flex items-center gap-2">
                <Loader2 size={14} className="text-red-400 animate-spin" />
                <span className="text-sm text-slate-500">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendAnswer} className="flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAnswer(e as any); } }}
            placeholder="Type your answer here..."
            className="input-field flex-1 resize-none min-h-[44px]"
            rows={2}
          />
          <button type="submit" disabled={loading || !input.trim()} className="btn-primary px-4 self-end">
            <Send size={18} />
          </button>
        </form>
      </div>
    </AppLayout>
  );

  // ─── REPORT PHASE ─────────────────────────────────────────────
  return (
    <AppLayout title="Interview Report">
      <div className="max-w-2xl mx-auto">
        <div className="glass-card p-8 text-center mb-5">
          <Trophy size={48} className="text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Interview Complete!</h2>
          <div className="text-5xl font-black gradient-text my-4">{report?.interview?.overallScore ?? 0}%</div>
          <div className={`badge text-sm px-4 py-2 ${
            (report?.interview?.overallScore || 0) >= 70 ? 'badge-success' : 'badge-warning'
          }`}>
            {report?.report?.report?.verdict || 'Needs Improvement'}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Strengths */}
          <div className="glass-card p-5 border-green-500/20 bg-green-500/5">
            <h3 className="text-base font-semibold text-green-300 mb-3">💪 Strengths</h3>
            <ul className="space-y-2">
              {(report?.report?.report?.strengths || []).map((s: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                  <span className="text-green-400 mt-0.5">✓</span> {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Weaknesses */}
          <div className="glass-card p-5 border-red-500/20 bg-red-500/5">
            <h3 className="text-base font-semibold text-red-300 mb-3">📌 Areas to Improve</h3>
            <ul className="space-y-2">
              {(report?.report?.report?.weaknesses || []).map((w: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                  <span className="text-red-400 mt-0.5">✗</span> {w}
                </li>
              ))}
            </ul>
          </div>

          {/* Suggestions */}
          <div className="glass-card p-5 border-indigo-500/20 bg-indigo-500/5">
            <h3 className="text-base font-semibold text-indigo-300 mb-3">🎯 Suggestions</h3>
            <ul className="space-y-2">
              {(report?.report?.report?.suggestions || []).map((s: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                  <span className="text-indigo-400 mt-0.5">→</span> {s}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={() => { setPhase('select'); setMessages([]); setQuestionCount(0); setReport(null); setChatId(''); }}
            className="btn-secondary flex-1 justify-center">
            Try Again
          </button>
          <Link to="/dashboard" className="btn-primary flex-1 justify-center">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
