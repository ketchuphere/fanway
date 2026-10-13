import React from 'react';
import {
  MapPin,
  Utensils,
  Trophy,
  ShieldAlert,
  ClipboardList,
  Home,
  Globe,
  Ticket,
  ShoppingBag,
} from 'lucide-react';
import { useStadium, FanTab } from '../context/StadiumContext';
import { TRANSLATIONS, LANGUAGE_LABELS } from '../utils/i18n';
import { Language } from '../types/stadium';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    setShowLanding,
    language,
    setLanguage,
    fanTab,
    setFanTab,
    fanProfile,
    setShowSetupModal,
    cart,
    orders,
  } = useStadium();

  const t = TRANSLATIONS[language];

  const fanNavItems: { id: FanTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'home', label: t.navHome, icon: <Home className="w-4 h-4" /> },
    { id: 'map', label: t.navMap, icon: <MapPin className="w-4 h-4" /> },
    {
      id: 'food',
      label: t.navFood,
      icon: <Utensils className="w-4 h-4" />,
      badge: cart.reduce((s, c) => s + c.quantity, 0) || undefined,
    },
    { id: 'match', label: t.navMatch, icon: <Trophy className="w-4 h-4" /> },
    { id: 'safety', label: t.navSafety, icon: <ShieldAlert className="w-4 h-4" /> },
    {
      id: 'activity',
      label: t.navActivity,
      icon: <ClipboardList className="w-4 h-4" />,
      badge: orders.length || undefined,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B1120] text-[#F8FAFC] flex flex-col pb-20 lg:pb-8">
      {/* Zone 1–3 Strict Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-[#0B1120]/95 backdrop-blur-md border-b border-[#1E293B] px-4 sm:px-8 h-14 flex items-center justify-between gap-8">
        {/* Zone 1: Single text wordmark */}
        <button
          onClick={() => setFanTab('home')}
          className="text-xl font-bold tracking-tight text-white font-display whitespace-nowrap shrink-0 cursor-pointer focus:outline-none"
        >
          Fan<span className="text-[#84CC16]">Way</span>
        </button>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#94A3B8]">
          {fanNavItems.slice(0, 5).map((item) => (
            <button
              key={item.id}
              onClick={() => setFanTab(item.id)}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                fanTab === item.id
                  ? 'text-[#F8FAFC] border-[#84CC16]'
                  : 'border-transparent hover:text-[#F8FAFC]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            onClick={() => setFanTab('map')}
            className="px-4 py-2 text-xs font-semibold text-[#0B1120] bg-[#84CC16] rounded-lg hover:bg-[#A3E635] transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{t.openStadiumMap}</span>
          </button>
        </div>
      </header>

      {/* Workspace Control & Fan Context Toolbar (Below Header) */}
      <div className="bg-[#111827] border-b border-[#1E293B] px-4 sm:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Project Overview Link */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowLanding(true)}
              className="px-3 py-1.5 text-xs font-medium bg-[#0B1120] hover:bg-[#1E293B] text-[#CBD5E1] hover:text-white border border-[#1E293B] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              ← Overview
            </button>
            <span className="hidden sm:inline text-xs text-[#64748B] font-medium">
              Live Fan Match Companion
            </span>
          </div>

          {/* Right: Seat Configurator & Language Selector */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Fan Seat Trigger */}
            <button
              onClick={() => setShowSetupModal(true)}
              className="px-3 py-1.5 text-xs font-medium bg-[#0B1120] hover:bg-[#1E293B] text-[#F8FAFC] border border-[#1E293B] rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              title="Configure your Gate, Section, Row, and Seat"
            >
              <Ticket className="w-3.5 h-3.5 text-[#84CC16]" />
              <span>
                {fanProfile.gate} · {fanProfile.section} · {fanProfile.seat.split(' (')[0]}
              </span>
            </button>

            {/* Multilingual Selector (English / Hindi / Odia) */}
            <div className="flex items-center gap-1 bg-[#0B1120] border border-[#1E293B] rounded-lg px-2 py-1">
              <Globe className="w-3.5 h-3.5 text-[#94A3B8]" />
              <select
                aria-label="Select Interface Language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="bg-transparent text-xs font-medium text-[#F8FAFC] focus:outline-none cursor-pointer"
              >
                {(Object.keys(LANGUAGE_LABELS) as Language[]).map((langKey) => (
                  <option key={langKey} value={langKey} className="bg-[#111827] text-white">
                    {LANGUAGE_LABELS[langKey]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Full Navigation Bar for Desktop/Tablet */}
      <div className="bg-[#0B1120] border-b border-[#1E293B] px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto py-2 no-scrollbar">
          {fanNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setFanTab(item.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                fanTab === item.id
                  ? 'bg-[#1E293B] text-[#84CC16] font-semibold'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#111827]'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge ? (
                <span className="font-mono-tabular text-[11px] text-[#84CC16]">
                  ({item.badge})
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* Safety Language Notice if Hindi or Odia is selected */}
      {t.safetyTranslationNotice && (
        <div className="bg-[#111827] border-b border-[#1E293B] px-4 sm:px-8 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-xs text-[#E2E8F0]">
            <span>{t.safetyTranslationNotice}</span>
            <button
              onClick={() => setFanTab('safety')}
              className="text-[#84CC16] hover:underline whitespace-nowrap shrink-0 cursor-pointer font-medium"
            >
              {t.navSafety} →
            </button>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6">
        {children}
      </main>

      {/* Mobile Compact Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0B1120]/95 backdrop-blur-md border-t border-[#1E293B] grid grid-cols-5 items-center h-14 px-2"
      >
        {(
          [
            { id: 'home', label: t.navHome, icon: <Home className="w-5 h-5" /> },
            { id: 'map', label: 'Map', icon: <MapPin className="w-5 h-5" /> },
            { id: 'food', label: 'Food', icon: <ShoppingBag className="w-5 h-5" /> },
            { id: 'match', label: 'Match', icon: <Trophy className="w-5 h-5" /> },
            { id: 'safety', label: 'Safety', icon: <ShieldAlert className="w-5 h-5" /> },
          ] as { id: FanTab; label: string; icon: React.ReactNode }[]
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFanTab(tab.id)}
            className={`min-h-[44px] flex flex-col items-center justify-center transition-colors cursor-pointer ${
              fanTab === tab.id ? 'text-[#84CC16]' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            {tab.icon}
            <span className="text-[10px] font-medium tracking-tight mt-0.5 whitespace-nowrap">
              {tab.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
};
