import React from 'react';
import {
  Trophy,
  Clock,
  CloudSun,
  Megaphone,
  Calendar,
  Utensils,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { useStadium } from '../context/StadiumContext';
import { SportType } from '../types/stadium';

export const MatchCenterView: React.FC = () => {
  const {
    events,
    activeEvent,
    selectEvent,
    venueConfig,
    announcements,
    setFanTab,
    askConciergeQuestion,
  } = useStadium();

  const sportBadges: Record<SportType, string> = {
    cricket: 'Cricket T20',
    football: 'Football',
    basketball: 'Basketball',
    tennis: 'Tennis',
  };

  return (
    <div className="space-y-6">
      {/* Multi-Sport Demo Event Selector Bar */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#84CC16] font-semibold">
            <Trophy className="w-4 h-4" />
            <span>Cross-Sport Configurable Event Model (Simulated Demo Fixtures)</span>
          </div>
          <h1 className="text-xl font-bold text-white font-display mt-1">
            Match Center — {venueConfig.name}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {events.map((ev) => (
            <button
              key={ev.id}
              onClick={() => selectEvent(ev.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeEvent.id === ev.id
                  ? 'bg-[#84CC16] text-[#0B1120]'
                  : 'bg-[#0B1120] text-[#94A3B8] hover:text-white border border-[#1E293B]'
              }`}
            >
              {sportBadges[ev.sport]}
            </button>
          ))}
        </div>
      </div>

      {/* Scoreboard & Break Planning Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 bg-[#111827] border border-[#1E293B] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#94A3B8]">
              <span>{activeEvent.tournament}</span>
              <span className="font-mono-tabular">
                Scheduled Start: {activeEvent.startTime} · Simulated Demo Data
              </span>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#0B1120] border border-[#1E293B] rounded-2xl p-5">
                <div className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider">
                  {activeEvent.teamA.shortName}
                </div>
                <div className="text-lg font-bold text-white font-display mt-0.5">
                  {activeEvent.teamA.name}
                </div>
                <div className="text-3xl font-bold text-[#84CC16] font-mono-tabular mt-3">
                  {activeEvent.teamA.score}
                </div>
                <div className="text-xs text-[#CBD5E1] mt-1">{activeEvent.teamA.detail}</div>
              </div>

              <div className="bg-[#0B1120] border border-[#1E293B] rounded-2xl p-5">
                <div className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider">
                  {activeEvent.teamB.shortName}
                </div>
                <div className="text-lg font-bold text-white font-display mt-0.5">
                  {activeEvent.teamB.name}
                </div>
                <div className="text-3xl font-bold text-white font-mono-tabular mt-3">
                  {activeEvent.teamB.score}
                </div>
                <div className="text-xs text-[#94A3B8] mt-1">{activeEvent.teamB.detail}</div>
              </div>
            </div>
          </div>

          {/* Match Statistics Comparison Table */}
          <div className="mt-6 pt-5 border-t border-[#1E293B]">
            <h2 className="text-sm font-bold text-white font-display mb-3">
              Key Match Telemetry (Simulated Demo Fixture)
            </h2>
            <div className="divide-y divide-[#1E293B]">
              {activeEvent.keyStats.map((st, idx) => (
                <div
                  key={idx}
                  className="py-2.5 grid grid-cols-3 items-center text-xs"
                >
                  <span className="font-mono-tabular font-semibold text-white">
                    {st.teamAVal}
                  </span>
                  <span className="text-center text-[#94A3B8]">{st.label}</span>
                  <span className="text-right font-mono-tabular font-semibold text-white">
                    {st.teamBVal}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Smart Interval & Concourse Break Planner */}
        <div className="lg:col-span-4 bg-[#111827] border border-[#1E293B] rounded-2xl p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-[#84CC16] font-semibold">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>Interval & Break Planner</span>
              </span>
              <span className="font-mono-tabular">In {activeEvent.nextBreakInMinutes} mins</span>
            </div>

            <div className="bg-[#0B1120] border border-[#1E293B] rounded-xl p-4 space-y-2">
              <div className="text-xs text-[#94A3B8]">Upcoming Break</div>
              <div className="text-base font-bold text-white font-display">
                {activeEvent.breakLabel}
              </div>
              <p className="text-xs text-[#CBD5E1] leading-relaxed">
                Concourse queues typically surge by 25–40% right as the interval whistle sounds. Heading out 3 minutes early or choosing Counter B saves ~8 minutes.
              </p>
            </div>

            <div className="bg-[#0B1120] border border-[#1E293B] rounded-xl p-4 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                <CloudSun className="w-4 h-4 text-[#84CC16]" />
                <span>Arena Weather Conditions</span>
              </div>
              <div className="text-sm font-semibold text-white font-mono-tabular">
                {venueConfig.temperatureC}°C · Humidity {venueConfig.humidityPercent}%
              </div>
              <div className="text-xs text-[#94A3B8]">{venueConfig.weatherSummary}</div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() =>
                askConciergeQuestion(
                  `I have ${activeEvent.nextBreakInMinutes} minutes until the ${activeEvent.breakLabel}. What is the fastest food and washroom plan from my seat?`
                )
              }
              className="w-full py-2.5 px-4 bg-[#84CC16] hover:bg-[#A3E635] text-[#0B1120] font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Plan My Break with AI Concierge
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFanTab('food')}
                className="py-2 px-3 bg-[#0B1120] hover:bg-[#1E293B] text-white border border-[#1E293B] rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Utensils className="w-3.5 h-3.5 text-[#84CC16]" />
                <span>Pre-Order Food</span>
              </button>
              <button
                onClick={() => setFanTab('map')}
                className="py-2 px-3 bg-[#0B1120] hover:bg-[#1E293B] text-white border border-[#1E293B] rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Concourse Map</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Split: Match-Day Schedule Timings (6 Cols) + Venue Announcements (6 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-[#111827] border border-[#1E293B] rounded-2xl p-6">
          <div className="flex items-center gap-2 pb-4 border-b border-[#1E293B]">
            <Calendar className="w-4 h-4 text-[#84CC16]" />
            <h2 className="text-base font-bold text-white font-display">
              Match-Day Schedule & Key Timings
            </h2>
          </div>

          <div className="divide-y divide-[#1E293B] mt-2">
            {activeEvent.keyTimings.map((item, idx) => (
              <div
                key={idx}
                className="py-3 flex items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono-tabular font-bold text-white w-14">
                    {item.time}
                  </span>
                  <span
                    className={
                      item.status === 'active'
                        ? 'text-[#84CC16] font-semibold'
                        : item.status === 'completed'
                        ? 'text-[#64748B] line-through'
                        : 'text-[#F8FAFC]'
                    }
                  >
                    {item.label}
                  </span>
                </div>
                <span className="text-[11px] text-[#94A3B8] capitalize flex items-center gap-1">
                  {item.status === 'completed' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#64748B]" />
                  )}
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-6 bg-[#111827] border border-[#1E293B] rounded-2xl p-6">
          <div className="flex items-center gap-2 pb-4 border-b border-[#1E293B]">
            <Megaphone className="w-4 h-4 text-[#84CC16]" />
            <h2 className="text-base font-bold text-white font-display">
              Match-Day Operational Notices
            </h2>
          </div>
          <div className="divide-y divide-[#1E293B] mt-2">
            {announcements.map((ann) => (
              <div key={ann.id} className="py-3.5 space-y-1">
                <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                  <span className="text-[#84CC16] font-medium">{ann.category}</span>
                  <span>{ann.timestamp}</span>
                </div>
                <div className="text-sm font-semibold text-white">{ann.title}</div>
                <p className="text-xs text-[#CBD5E1]">{ann.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
