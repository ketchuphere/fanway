import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  MapPin,
  Wrench,
  ShieldAlert,
  RotateCcw,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { useStadium } from '../context/StadiumContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  executedTools?: { name: string; args: any; summary: string }[];
  clientActions?: any[];
  isError?: boolean;
}

const SUGGESTED_QUESTIONS = [
  'Where is the nearest washroom to my section?',
  'Which food counter has the shortest queue right now?',
  'I have 10 minutes before play resumes. What can I do?',
  'How do I reach Gate C from my seat?',
  'Where can I find vegetarian food under ₹200?',
  'Where is the nearest first-aid station?',
  'Where should I meet my friends after the match?',
  'How do I reach the designated ride-share pickup point?',
  'What facilities are step-free accessible from my section?',
];

export const AIConciergeView: React.FC = () => {
  const {
    venueConfig,
    activeEvent,
    locations,
    foodStalls,
    announcements,
    fanProfile,
    language,
    conciergeInitialPrompt,
    setConciergeInitialPrompt,
    navigateToMapLocation,
    submitFanReport,
    setFanTab,
  } = useStadium();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'model',
      text: `Welcome to FanWay Concierge for ${venueConfig.name}. I am grounded in real-time application data for ${activeEvent.title}. Ask me about washroom queues, vegetarian food, walking routes from ${fanProfile.section}, accessible facilities, or post-match pickup zones.`,
      timestamp: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmedActions, setConfirmedActions] = useState<Record<string, boolean>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Trigger initial prompt if navigated from another screen
  useEffect(() => {
    if (conciergeInitialPrompt) {
      const promptToRun = conciergeInitialPrompt;
      setConciergeInitialPrompt(null);
      handleSendPrompt(promptToRun);
    }
  }, [conciergeInitialPrompt]);

  const handleSendPrompt = async (promptText: string) => {
    const cleanText = promptText.trim();
    if (!cleanText || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: cleanText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const historyPayload = messages
        .filter((m) => !m.isError)
        .map((m) => ({ role: m.role, text: m.text }));

      const response = await fetch('/api/concierge/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: cleanText,
          history: historyPayload,
          context: {
            venueConfig,
            activeEvent,
            locations,
            foodStalls,
            announcements,
            fanProfile,
            language,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to get response from FanWay Concierge.');
      }

      const modelMsg: ChatMessage = {
        id: `mdl-${Date.now()}`,
        role: 'model',
        text: data.reply,
        timestamp: data.sourceTimestamp || 'Just now',
        executedTools: data.executedTools || [],
        clientActions: data.clientActions || [],
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          text: `Unable to reach the FanWay Gemini Concierge service right now (${
            err?.message || 'Service Error'
          }). You can still use the Interactive Stadium Map, Food Finder, or Help & Safety tabs directly.`,
          timestamp: 'Just now',
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendPrompt(input);
  };

  const handleConfirmAction = (msgId: string, idx: number, action: any) => {
    const key = `${msgId}-${idx}`;
    if (confirmedActions[key]) return;

    if (action.type === 'SUBMIT_REPORT' || action.type === 'REQUEST_ASSISTANCE') {
      const matchedLoc =
        locations.find((l) =>
          l.name.toLowerCase().includes((action.payload.locationName || '').toLowerCase())
        ) || locations.find((l) => l.id === fanProfile.currentLocationId)!;

      submitFanReport({
        category: action.payload.category || 'Facility Issue',
        locationId: matchedLoc.id,
        locationName: matchedLoc.name,
        description: action.payload.description,
        seatInfo: `${fanProfile.section} · ${fanProfile.row} · ${fanProfile.seat}`,
        priority: action.type === 'REQUEST_ASSISTANCE' ? 'High' : 'Normal',
        isStaffAssistanceRequest: Boolean(action.payload.isStaffAssistanceRequest),
      });
      setConfirmedActions((prev) => ({ ...prev, [key]: true }));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left 8 Cols: Chat Conversation Interface */}
      <div className="lg:col-span-8 bg-[#111827] border border-[#1E293B] rounded-2xl flex flex-col h-[680px]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#1E293B] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#84CC16]/15 border border-[#84CC16]/40 flex items-center justify-center text-[#84CC16]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white font-display">
                FanWay AI Concierge
              </h1>
              <p className="text-xs text-[#94A3B8]">
                Grounded via server-side Gemini tool calling · Never invents unverified venue data
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              setMessages([
                {
                  id: `welcome-${Date.now()}`,
                  role: 'model',
                  text: `Conversation reset. Currently tracking ${activeEvent.title} from ${fanProfile.gate} · ${fanProfile.section}. How can I help?`,
                  timestamp: 'Just now',
                },
              ])
            }
            className="px-3 py-1.5 bg-[#0B1120] hover:bg-[#1E293B] text-[#94A3B8] hover:text-white border border-[#1E293B] rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Chat</span>
          </button>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#84CC16] text-[#0B1120] font-medium'
                    : msg.isError
                    ? 'bg-[#0B1120] border border-[#EF4444] text-[#FCA5A5]'
                    : 'bg-[#0B1120] border border-[#1E293B] text-[#F8FAFC]'
                }`}
              >
                {/* Executed Grounding Tools Trace */}
                {msg.executedTools && msg.executedTools.length > 0 && (
                  <div className="mb-3 pb-2.5 border-b border-[#1E293B] flex flex-wrap items-center gap-2 text-[11px] text-[#84CC16]">
                    <Wrench className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Grounded via tools:{' '}
                      {msg.executedTools.map((t) => t.name).join(' · ')}
                    </span>
                  </div>
                )}

                <div className="whitespace-pre-line">{msg.text}</div>

                {/* Interactive Client Action Confirmations / Map Shortcuts */}
                {msg.clientActions && msg.clientActions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#1E293B] space-y-2">
                    {msg.clientActions.map((act, idx) => {
                      const key = `${msg.id}-${idx}`;
                      const isDone = confirmedActions[key];

                      if (act.type === 'HIGHLIGHT_ROUTE') {
                        return (
                          <button
                            key={idx}
                            onClick={() => navigateToMapLocation(act.toLocationId, true)}
                            className="w-full py-2 px-3 bg-[#111827] hover:bg-[#1E293B] text-[#84CC16] border border-[#84CC16]/40 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5" />
                              <span>Open Interactive Map Route to {act.toLocationName}</span>
                            </span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        );
                      }

                      if (act.type === 'SUBMIT_REPORT' || act.type === 'REQUEST_ASSISTANCE') {
                        return (
                          <div
                            key={idx}
                            className="bg-[#111827] border border-[#1E293B] rounded-xl p-3 space-y-2"
                          >
                            <div className="text-xs font-semibold text-white">
                              Confirm Action:{' '}
                              {act.type === 'REQUEST_ASSISTANCE'
                                ? 'Dispatch Steward Assistance'
                                : 'Submit Fan Facility Report'}
                            </div>
                            <div className="text-[11px] text-[#94A3B8]">
                              {act.payload.locationName} — {act.payload.description}
                            </div>
                            {isDone ? (
                              <div className="flex items-center gap-1.5 text-xs text-[#22C55E] font-semibold">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Confirmed & Logged to Venue Operations</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleConfirmAction(msg.id, idx, act)}
                                className="px-3.5 py-1.5 bg-[#84CC16] hover:bg-[#A3E635] text-[#0B1120] font-semibold text-xs rounded-lg cursor-pointer"
                              >
                                Confirm & Submit Now
                              </button>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}
              </div>

              <span className="text-[11px] text-[#64748B] mt-1 px-1">
                {msg.role === 'user' ? 'You' : 'FanWay Concierge'} · {msg.timestamp}
              </span>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start">
              <div className="bg-[#0B1120] border border-[#1E293B] rounded-2xl p-4 text-xs text-[#94A3B8] flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-[#84CC16] animate-spin" />
                <span>Querying venue tools, queue heuristics & route graph...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleFormSubmit}
          className="p-4 border-t border-[#1E293B] bg-[#0B1120] rounded-b-2xl flex items-center gap-2.5"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about washrooms, shortest food queues, walking routes, or match timings..."
            className="flex-1 bg-[#111827] border border-[#1E293B] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-[#64748B] focus:border-[#84CC16] focus:outline-none"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2.5 bg-[#84CC16] hover:bg-[#A3E635] disabled:opacity-40 text-[#0B1120] font-semibold text-xs sm:text-sm rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Ask</span>
          </button>
        </form>
      </div>

      {/* Right 4 Cols: Suggested Questions & Reliability / Safety Guardrails */}
      <div className="lg:col-span-4 space-y-5">
        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5">
          <h2 className="text-sm font-bold text-white font-display mb-3">
            Try Contextual Match-Day Prompts
          </h2>
          <div className="space-y-2">
            {SUGGESTED_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendPrompt(q)}
                disabled={isLoading}
                className="w-full text-left text-xs text-[#CBD5E1] hover:text-white bg-[#0B1120] hover:bg-[#1E293B] border border-[#1E293B] rounded-xl p-3 transition-colors flex items-center justify-between gap-2 cursor-pointer"
              >
                <span>{q}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#84CC16] shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Reliability & Emergency Guardrail Notice */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <ShieldAlert className="w-4 h-4 text-[#EF4444]" />
            <span>AI Reliability & Safety Guardrails</span>
          </div>
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            FanWay Concierge uses structured function calling over configured venue data. It never invents facilities, prices, or emergency procedures, and requires explicit confirmation before submitting reports.
          </p>
          <div className="p-3 bg-[#0B1120] border border-[#1E293B] rounded-xl text-xs space-y-1">
            <div className="text-[#94A3B8]">Official Emergency Dispatch:</div>
            <div className="font-mono-tabular font-bold text-white">
              {venueConfig.emergencyPhone}
            </div>
          </div>
          <button
            onClick={() => setFanTab('safety')}
            className="w-full py-2 px-3 bg-[#0B1120] hover:bg-[#1E293B] text-[#EF4444] border border-[#1E293B] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Open Direct Help & Safety Controls →
          </button>
        </div>
      </div>
    </div>
  );
};
