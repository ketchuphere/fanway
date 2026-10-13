import React from 'react';
import {
  ArrowRight,
  MapPin,
  Sparkles,
  Clock,
  Ticket,
  LayoutDashboard,
  Building2,
  ScanBarcode,
} from 'lucide-react';
import { useStadium } from '../context/StadiumContext';
import heroStadiumImg from '../assets/images/hero_stadium_night_1791698076150.jpg';

export const LandingPageView: React.FC = () => {
  const {
    setShowLanding,
    setShowTicketAuth,
    setRole,
    setFanTab,
    setOperatorTab,
    events,
    activeEvent,
    selectEvent,
    venueConfig,
  } = useStadium();

  const launchFanApp = (tab: 'home' | 'map' | 'food' | 'concierge' | 'match' | 'safety' = 'home') => {
    setRole('fan');
    setFanTab(tab);
    setShowLanding(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const launchOperatorDashboard = () => {
    setRole('operator');
    setOperatorTab('overview');
    setShowLanding(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const launchAdminSettings = () => {
    setRole('admin');
    setOperatorTab('settings');
    setShowLanding(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const launchTicketLogin = () => {
    setShowLanding(false);
    setShowTicketAuth(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-[#F8FAFC] flex flex-col selection:bg-[#84CC16] selection:text-[#0B1120]">
      {/* 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-[#0B1120]/90 backdrop-blur-md border-b border-[#1E293B] px-6 sm:px-10 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-white font-display">
            Fan<span className="text-[#84CC16]">Way</span>
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#94A3B8]">
          <a href="#features" className="hover:text-white transition-colors">
            Core Features
          </a>
          <a href="#roles" className="hover:text-white transition-colors">
            Interactive Views
          </a>
          <button
            onClick={launchTicketLogin}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Ticket & Barcode Scan
          </button>
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => launchFanApp('home')}
            className="px-4 py-2 text-xs font-semibold text-[#0B1120] bg-[#84CC16] rounded-lg hover:bg-[#A3E635] transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5"
          >
            <span>Launch App</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 sm:px-10 py-10 sm:py-16 space-y-16">
        {/* 1. HERO: Concise Value Statement + Instant Action Triggers */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-6">
            <h1 className="text-3xl sm:text-5xl font-bold text-white font-display tracking-tight leading-[1.12]">
              Spend less time managing the stadium.{' '}
              <span className="text-[#84CC16]">Spend more time enjoying the match.</span>
            </h1>

            <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed max-w-xl">
              FanWay is the intelligent match-day companion for the Indian Premier League (IPL). Scan your ticket or barcode to instantly explore authentic seating maps across all premier IPL stadiums (Wankhede, Chepauk, Narendra Modi Stadium, Eden Gardens, M. Chinnaswamy, and Arun Jaitley Kotla), assign your seat, monitor concourse queues, and navigate with AI assistance.
            </p>

            {/* Main Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={launchTicketLogin}
                className="px-5 py-3 bg-[#84CC16] hover:bg-[#A3E635] text-[#0B1120] font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-[#84CC16]/10"
              >
                <ScanBarcode className="w-4 h-4" />
                <span>IPL Ticket Login / Barcode Scan</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => launchFanApp('home')}
                className="px-5 py-3 bg-[#111827] hover:bg-[#1E293B] text-white border border-[#1E293B] font-semibold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
              >
                Fan Companion View
              </button>

              <button
                onClick={launchOperatorDashboard}
                className="px-4 py-3 bg-[#111827] hover:bg-[#1E293B] text-[#94A3B8] hover:text-white border border-[#1E293B] font-medium text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
              >
                Operator Console
              </button>
            </div>

            {/* Quick IPL Match Indicator */}
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
              <span>IPL Fixture:</span>
              <button
                onClick={() => {
                  if (events[0]) selectEvent(events[0].id);
                  launchFanApp('home');
                }}
                className="px-3 py-1 bg-[#0B1120] hover:bg-[#1E293B] text-[#84CC16] border border-[#1E293B] rounded-lg transition-colors cursor-pointer font-medium flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#84CC16]" />
                <span>TATA IPL · {activeEvent?.title || 'Chennai Super Kings vs Mumbai Indians'}</span>
              </button>
            </div>
          </div>

          {/* Hero Visual Card */}
          <div className="lg:col-span-5 relative rounded-2xl overflow-hidden border border-[#1E293B] bg-[#111827] aspect-[4/3] group">
            <img
              src={heroStadiumImg}
              alt="Metro Sports Arena under stadium lights"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-[#0B1120]/40 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 p-3 bg-[#111827]/90 backdrop-blur-md rounded-xl border border-[#1E293B] text-xs">
              <div className="flex items-center justify-between text-[#84CC16] font-semibold">
                <span>{venueConfig.name}</span>
                <span className="font-mono text-[11px]">{venueConfig.capacity.toLocaleString()} Seats</span>
              </div>
              <p className="text-[#94A3B8] text-[11px] mt-0.5">
                TATA IPL Match 38 (CSK vs MI) concourse data with Garware, Gavaskar & Tendulkar stands.
              </p>
            </div>
          </div>
        </section>

        {/* 2. CORE FEATURES: Simple 4-Card Grid */}
        <section id="features" className="space-y-6 pt-6 border-t border-[#1E293B]">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
              Platform Highlights
            </h2>
            <p className="text-xs sm:text-sm text-[#94A3B8]">
              Explore the primary modules implemented in this release.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1 */}
            <div
              onClick={() => launchFanApp('map')}
              className="p-5 bg-[#111827] hover:bg-[#1E293B]/70 border border-[#1E293B] rounded-2xl transition-all cursor-pointer space-y-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#0B1120] border border-[#1E293B] flex items-center justify-center text-[#84CC16]">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white group-hover:text-[#84CC16] transition-colors">
                Interactive Stadium Map
              </h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Clickable SVG concourse schematic with Dijkstra pathfinding, accessible step-free routes, and washroom queue indicators.
              </p>
            </div>

            {/* Card 2 */}
            <div
              onClick={() => launchFanApp('concierge')}
              className="p-5 bg-[#111827] hover:bg-[#1E293B]/70 border border-[#1E293B] rounded-2xl transition-all cursor-pointer space-y-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#0B1120] border border-[#1E293B] flex items-center justify-center text-[#84CC16]">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white group-hover:text-[#84CC16] transition-colors">
                Grounded AI Concierge
              </h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Server-side Gemini assistant with 9 live tools to check queues, menu items, routes, and assistance without hallucinations.
              </p>
            </div>

            {/* Card 3 */}
            <div
              onClick={() => launchFanApp('food')}
              className="p-5 bg-[#111827] hover:bg-[#1E293B]/70 border border-[#1E293B] rounded-2xl transition-all cursor-pointer space-y-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#0B1120] border border-[#1E293B] flex items-center justify-center text-[#84CC16]">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white group-hover:text-[#84CC16] transition-colors">
                Turnaround Food Finder
              </h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Ranks concourse food counters by walking time + estimated queue wait. Includes vegetarian filters and pre-ordering demo.
              </p>
            </div>

            {/* Card 4 */}
            <div
              onClick={launchTicketLogin}
              className="p-5 bg-[#111827] hover:bg-[#1E293B]/70 border border-[#1E293B] rounded-2xl transition-all cursor-pointer space-y-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#0B1120] border border-[#1E293B] flex items-center justify-center text-[#84CC16]">
                <ScanBarcode className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white group-hover:text-[#84CC16] transition-colors">
                Smart Ticket & Barcode Scan
              </h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Enter a Ticket ID, Transaction ID, or scan a barcode to automatically detect the fixture, seat pass, and unlocked venue services.
              </p>
            </div>
          </div>
        </section>

        {/* 3. ROLES STRIP: Simple 3-Box Switcher */}
        <section id="roles" className="space-y-6 pt-6 border-t border-[#1E293B]">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
              Three Interactive Perspectives
            </h2>
            <p className="text-xs sm:text-sm text-[#94A3B8]">
              Switch roles freely to test the app from any viewpoint.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Fan */}
            <div className="p-5 bg-[#111827] border border-[#1E293B] rounded-2xl flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Ticket className="w-4 h-4 text-[#84CC16]" />
                  <span>Fan Companion</span>
                </div>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  Mobile-optimized match screen, map routing, queue monitors, AI chat, and order activity.
                </p>
              </div>
              <button
                onClick={() => launchFanApp('home')}
                className="w-full py-2 bg-[#84CC16] hover:bg-[#A3E635] text-[#0B1120] font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Launch Fan View
              </button>
            </div>

            {/* Operator */}
            <div className="p-5 bg-[#111827] border border-[#1E293B] rounded-2xl flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <LayoutDashboard className="w-4 h-4 text-[#38BDF8]" />
                  <span>Venue Operator</span>
                </div>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  Real-time queue length overrides, counter management, food inventory, and incident triage.
                </p>
              </div>
              <button
                onClick={launchOperatorDashboard}
                className="w-full py-2 bg-[#0B1120] hover:bg-[#1E293B] text-white border border-[#1E293B] font-medium text-xs rounded-xl transition-colors cursor-pointer"
              >
                Launch Operator View
              </button>
            </div>

            {/* Admin */}
            <div className="p-5 bg-[#111827] border border-[#1E293B] rounded-2xl flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Building2 className="w-4 h-4 text-[#F59E0B]" />
                  <span>Stadium Admin</span>
                </div>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  Configure emergency contacts, match break timing, facility nodes, and safety notices.
                </p>
              </div>
              <button
                onClick={launchAdminSettings}
                className="w-full py-2 bg-[#0B1120] hover:bg-[#1E293B] text-white border border-[#1E293B] font-medium text-xs rounded-xl transition-colors cursor-pointer"
              >
                Launch Admin View
              </button>
            </div>
          </div>
        </section>

        {/* 4. FOOTER */}
        <footer className="pt-8 border-t border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white font-display">
              Fan<span className="text-[#84CC16]">Way</span>
            </span>
            <span>· Live Stadium Experience Platform</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => launchFanApp('home')}
              className="text-[#CBD5E1] hover:text-[#84CC16] transition-colors cursor-pointer"
            >
              Open Match Center
            </button>
            <button
              onClick={launchTicketLogin}
              className="text-[#CBD5E1] hover:text-[#84CC16] transition-colors cursor-pointer"
            >
              Scan Ticket
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
};
