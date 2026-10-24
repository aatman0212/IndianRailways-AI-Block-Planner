import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Clock,
  Zap,
  TrendingDown,
  Train,
  Sparkles,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { ScheduledBlock, PlanAnalytics, DelayImpact, CopilotMessage } from '../types';

interface RailCopilotProps {
  onPlanUpdated: (newBlocks: ScheduledBlock[], newAnalytics: PlanAnalytics) => void;
  blocks: ScheduledBlock[];
  analytics: PlanAnalytics | null;
}

const SAMPLE_PROMPTS = [
  {
    label: '🚄 Rajdhani 45m Late',
    query: 'Train 12424 Rajdhani Express is delayed by 45 min near Kanpur. Re-schedule routine blocks to protect punctuality.',
  },
  {
    label: '🚨 Emergency Rail Crack',
    query: 'Inject emergency rail fracture and weld flaw at Panki Up line at KM 1018 and re-optimize immediately.',
  },
  {
    label: '📜 Welding Safety Rules',
    query: 'What are the mandatory precautions under IRPWM Para 605 for thermit welding and cooling buffers?',
  },
  {
    label: '📄 Draft Caution Order',
    query: 'Draft official Form T/409 Caution Order with ACTM 25kV OHE earthing rules for the Kanpur block.',
  },
  {
    label: '💰 Delay Savings Report',
    query: 'How many passenger train delay minutes and freight demurrage costs did multi-department bundling save today?',
  },
];

// Helper to format inline text without any raw asterisks (*)
const formatInlineText = (text: string): React.ReactNode => {
  // If no markdown tokens, return clean text with all raw asterisks removed
  if (!text.includes('*') && !text.includes('`')) {
    return text;
  }

  // Tokenize string for **bold** and `code`
  const parts: React.ReactNode[] = [];
  // Regex matches **bold** or `code` or _italic_
  const regex = /(\*\*.*?\*\*|`.*?`|_.*?_)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      // Clean regular text slice of any stray asterisks
      const plain = text.substring(lastIndex, matchIndex).replace(/\*/g, '');
      parts.push(plain);
    }

    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      // Bold text without asterisks
      const boldText = token.slice(2, -2).replace(/\*/g, '');
      parts.push(
        <strong key={matchIndex} className="font-bold text-white">
          {boldText}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      // Code pill
      const codeText = token.slice(1, -1);
      parts.push(
        <code
          key={matchIndex}
          className="font-mono bg-slate-950 px-1.5 py-0.5 rounded text-blue-300 border border-slate-800 text-[11px]"
        >
          {codeText}
        </code>
      );
    } else if (token.startsWith('_') && token.endsWith('_')) {
      // Italic text
      const italicText = token.slice(1, -1);
      parts.push(
        <em key={matchIndex} className="italic text-slate-200">
          {italicText}
        </em>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    // Remaining plain text with stray asterisks stripped
    parts.push(text.substring(lastIndex).replace(/\*/g, ''));
  }

  return parts;
};

// Formats full message body into clean, asterisk-free HTML elements
const renderCleanMessage = (rawText: string) => {
  const paragraphs = rawText.split('\n\n');

  return paragraphs.map((para, paraIdx) => {
    const trimmed = para.trim();

    // 1. Heading (### Header)
    if (trimmed.startsWith('### ')) {
      const headingText = trimmed.replace('### ', '').replace(/\*/g, '');
      return (
        <h4
          key={paraIdx}
          className="text-xs font-extrabold text-blue-300 mt-2 mb-1.5 pb-1 border-b border-slate-800 flex items-center gap-1.5"
        >
          {headingText}
        </h4>
      );
    }

    // 2. Blockquote (> Note)
    if (trimmed.startsWith('> ')) {
      const quoteText = trimmed.replace(/^>\s*/, '');
      return (
        <blockquote
          key={paraIdx}
          className="border-l-2 border-blue-500 pl-3 italic text-slate-200 bg-slate-950/70 py-1.5 rounded-r-lg text-[11px] my-1.5 leading-relaxed"
        >
          {formatInlineText(quoteText)}
        </blockquote>
      );
    }

    // 3. Multi-line bullet list or plain lines
    const lines = trimmed.split('\n');
    if (lines.some((l) => l.trim().startsWith('* ') || l.trim().startsWith('• ') || l.trim().startsWith('- '))) {
      return (
        <ul key={paraIdx} className="space-y-1.5 my-1.5 text-xs">
          {lines.map((line, lineIdx) => {
            const cleanLine = line.trim();
            if (
              cleanLine.startsWith('* ') ||
              cleanLine.startsWith('• ') ||
              cleanLine.startsWith('- ')
            ) {
              const itemContent = cleanLine.replace(/^[*•-]\s+/, '');
              return (
                <li key={lineIdx} className="flex items-start gap-2 text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  <span>{formatInlineText(itemContent)}</span>
                </li>
              );
            }
            if (cleanLine.length > 0) {
              return (
                <div key={lineIdx} className="text-slate-300">
                  {formatInlineText(cleanLine)}
                </div>
              );
            }
            return null;
          })}
        </ul>
      );
    }

    // 4. Regular Paragraph
    return (
      <p key={paraIdx} className="text-slate-300 leading-relaxed text-xs">
        {formatInlineText(trimmed)}
      </p>
    );
  });
};

export const RailCopilot: React.FC<RailCopilotProps> = ({ onPlanUpdated, blocks, analytics }) => {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'welcome_1',
      sender: 'assistant',
      text: `### Welcome to IR-Copilot (AI Assistant)

I can help you coordinate corridor maintenance and protect train schedules:
• Train Delay Handling: Tell me about delayed passenger trains, and I will re-calculate maintenance windows using OR-Tools.
• Railway Rulebook Lookups: Citations directly from IRPWM, ACTM, SEM, and G&SR.
• Savings Reports: Real-time estimates on minutes and money saved by bundling repairs.

Click any suggestion chip below or type your instruction in plain English.`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [delayImpact, setDelayImpact] = useState<DelayImpact | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch initial delay impact metrics
  useEffect(() => {
    fetch('/api/copilot/delay-impact')
      .then((res) => res.json())
      .then((data) => setDelayImpact(data))
      .catch((err) => console.error('Failed to fetch delay impact:', err));
  }, [blocks.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: CopilotMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query }),
      });

      const data = await res.json();

      const assistantMsg: CopilotMessage = {
        id: `assistant_${Date.now()}`,
        sender: 'assistant',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        action_type: data.action_type,
        tools_executed: data.tools_executed,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (data.blocks && data.analytics) {
        onPlanUpdated(data.blocks, data.analytics);
      }
      if (data.delay_impact) {
        setDelayImpact(data.delay_impact);
      }
    } catch (err) {
      console.error('Copilot request failed:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'assistant',
          text: 'Unable to reach backend API. Please make sure the backend server is running.',
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[720px] overflow-hidden shadow-xl">
      {/* Top Telemetry & Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-100">
                AI Railway Controller Assistant
              </h2>
              <span className="text-[10px] text-blue-400 font-semibold bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded-full">
                Rulebook RAG + Solver
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Prayagraj Division • Trained on official IRPWM, ACTM, SEM & G&SR
            </p>
          </div>
        </div>

        {/* Live Telemetry Ribbon */}
        {delayImpact && (
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <div className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-medium leading-none">Delay Saved</span>
                <span className="font-bold text-slate-200 font-mono">
                  {delayImpact.passenger_delay_minutes_saved} mins
                </span>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-2">
              <Train className="w-3.5 h-3.5 text-emerald-400" />
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-medium leading-none">Trains Protected</span>
                <span className="font-bold text-slate-200 font-mono">
                  {delayImpact.trains_protected_count} Express
                </span>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-2">
              <TrendingDown className="w-3.5 h-3.5 text-purple-400" />
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-medium leading-none">Demurrage Saved</span>
                <span className="font-bold text-slate-200 font-mono">
                  ₹{delayImpact.freight_demurrage_saved_inr.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/70">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center shrink-0 text-blue-400 mt-1 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-2xl rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-900 text-slate-200 border border-slate-800'
              }`}
            >
              {/* Tool Execution Badges */}
              {msg.tools_executed && msg.tools_executed.length > 0 && (
                <div className="mb-2 space-y-1 pb-2 border-b border-slate-800/80">
                  {msg.tools_executed.map((t, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950 border border-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-lg flex items-center gap-1.5 font-mono"
                    >
                      <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="text-slate-400">{t.tool}</span>
                      <span className="text-slate-600">→</span>
                      <span className="text-emerald-400 font-medium">
                        {typeof t.result === 'string' ? t.result : 'Done'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Message Content: Clean formatting with all raw asterisks removed */}
              <div className="space-y-1.5">
                {renderCleanMessage(msg.text)}
              </div>

              <div
                className={`text-[9px] mt-2 font-mono text-right ${
                  msg.sender === 'user' ? 'text-blue-200/80' : 'text-slate-500'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5 justify-start items-center text-xs text-slate-400 bg-slate-900/80 p-3 rounded-xl border border-slate-800 w-fit shadow-sm">
            <Bot className="w-4 h-4 animate-spin text-blue-400" />
            <span>Consulting railway rulebooks and calculating optimal train paths...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Action Prompt Chips */}
      <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 text-[11px] shrink-0 font-semibold uppercase tracking-wider mr-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Try:
          </span>
          {SAMPLE_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p.query)}
              disabled={loading}
              className="bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 px-3 py-1.5 rounded-xl text-xs shrink-0 transition-colors disabled:opacity-50 cursor-pointer font-medium shadow-sm"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Type a message or command (e.g. "Rajdhani 45 min late, replan" or "What does IRPWM 605 say?")'
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 disabled:opacity-40 transition-colors cursor-pointer shrink-0 shadow-md shadow-blue-600/30"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
