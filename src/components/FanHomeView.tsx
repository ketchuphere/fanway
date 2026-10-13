import React from 'react';
import {
  MapPin,
  Utensils,
  ShieldAlert,
  Navigation,
  Clock,
  CloudSun,
  ArrowRight,
  Ticket,
  Accessibility,
  Megaphone,
  Footprints,
} from 'lucide-react';
import { useStadium } from '../context/StadiumContext';
import { TRANSLATIONS } from '../utils/i18n';
import { calculateVenueRoute } from '../utils/queuePrediction';

export const FanHomeView: React.FC = () => {
  const {
    venueConfig,
    activeEvent,
    locations,
    queuePredictions,
    announcements,
    fanProfile,
    language,
    setFanTab,
    setShowSetupModal,
    setShowTicketAuth,
    navigateToMapLocation,
  } = useStadium();

  const t = TRANSLATIONS[language];

  const userOrigin =
    locations.find((l) => l.id === fanProfile.currentLocationId) ||
    locations[0] || {
      id: 'origin-stand',
      name: fanProfile.section || 'My Stand',
      category: 'section' as const,
      zone: 'Concourse' as const,
      x: 50,
      y: 50,
      openCounters: 1,
      accessible: true,
      dataSource: 'verified_config' as const,
      lastUpdated: 'Just now',
    };

  // Key facilities to highlight on home screen
  const featuredFacilities = locations
    .filter((l) => l.category === 'food' || l.category === 'washroom' || l.category === 'first_aid')
    .slice(0, 6)
    .map((loc) => {
      const pred = queuePredictions[loc.id];
      const route = calculateVenueRoute(
        userOrigin.id,
        loc.id,
        locations,
        fanProfile.preferAccessibleRoutes
      );
      return {
        loc,
        pred,
        walkMins: route?.walkingMinutes ?? 2,
      };
    });

  const nearestWashroom =
    locations
      .filter((l) => l.category === 'washroom' && (!fanProfile.preferAccessibleRoutes || l.accessible))
      .sort(
        (a, b) =>
          Math.hypot(a.x - userOrigin.x, a.y - userOrigin.y) -
          Math.hypot(b.x - userOrigin.x, b.y - userOrigin.y)
      )[0] ||
    locations.find((l) => l.category === 'washroom') ||
    locations.find((l) => l.name.toLowerCase().includes('washroom') || l.name.toLowerCase().includes('toilet')) ||
    locations.find((l) => l.category === 'gate') ||
    userOrigin;

  const nearestExit =
    locations
      .filter((l) => l.category === 'exit' || l.category === 'gate')
      .sort(
        (a, b) =>
          Math.hypot(a.x - userOrigin.x, a.y - userOrigin.y) -
          Math.hypot(b.x - userOrigin.x, b.y - userOrigin.y)
      )[0] ||
    locations.find((l) => l.category === 'exit') ||
    locations.find((l) => l.category === 'gate') ||
    locations.find((l) => l.name.toLowerCase().includes('gate') || l.name.toLowerCase().includes('exit')) ||
    userOrigin;

  const nearestFirstAid =
    locations
      .filter((l) => l.category === 'first_aid')
      .sort(
        (a, b) =>
          Math.hypot(a.x - userOrigin.x, a.y - userOrigin.y) -
          Math.hypot(b.x - userOrigin.x, b.y - userOrigin.y)
      )[0] ||
    locations.find((l) => l.category === 'first_aid') ||
    locations.find((l) => l.name.toLowerCase().includes('aid') || l.name.toLowerCase().includes('medical')) ||
    userOrigin;

  return (
    <div className="space-y-8">
      {/* Top Hero Split: Match Context & Personal Seat Companion */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left 7 Cols: Live Event & Mission Card */}
        <div className="lg:col-span-7 bg-[#111827] border border-[#1E293B] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#94A3B8] mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[#84CC16] font-semibold">
                  {venueConfig.name}
                </span>
                <span aria-hidden="true">·</span>
                <span>{activeEvent.tournament}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#E2E8F0]">
                <CloudSun className="w-3.5 h-3.5 text-[#84CC16]" />
                <span className="font-mono-tabular">
                  {venueConfig.temperatureC}°C · {venueConfig.weatherSummary}
                </span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white font-display tracking-tight">
              {activeEvent.title}
            </h1>
            <p className="text-sm text-[#94A3B8] mt-1">{t.brandMission}</p>

            {/* Score & Match Phase Strip */}
            <div className="mt-5 pt-5 border-t border-[#1E293B] grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#0B1120] border border-[#1E293B] rounded-xl p-4">
                <div className="text-xs text-[#94A3B8]">{activeEvent.teamA.name}</div>
                <div className="text-2xl font-bold text-white font-mono-tabular mt-1">
                  {activeEvent.teamA.score}
                </div>
                <div className="text-xs text-[#84CC16] mt-1">{activeEvent.teamA.detail}</div>
              </div>

              <div className="bg-[#0B1120] border border-[#1E293B] rounded-xl p-4">
                <div className="text-xs text-[#94A3B8]">{activeEvent.teamB.name}</div>
                <div className="text-2xl font-bold text-white font-mono-tabular mt-1">
                  {activeEvent.teamB.score}
                </div>
                <div className="text-xs text-[#94A3B8] mt-1">{activeEvent.teamB.detail}</div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-[#1E293B] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-[#E2E8F0]">
              <Clock className="w-4 h-4 text-[#84CC16]" />
              <span>{activeEvent.status}</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#84CC16] font-medium">{activeEvent.matchPhase}</span>
            </div>
            <button
              onClick={() => setFanTab('match')}
              className="text-[#84CC16] hover:underline font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>Full Match Center</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right 5 Cols: Fan Seat Pass & Prominent Ask FanWay Concierge CTA */}
        <div className="lg:col-span-5 bg-[#111827] border border-[#1E293B] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-medium text-[#94A3B8]">
                {fanProfile.isAuthenticatedTicket && fanProfile.ticketId ? (
                  <span className="text-[#84CC16] font-semibold">
                    Verified Pass: {fanProfile.ticketId} ({fanProfile.transactionId})
                  </span>
                ) : (
                  <span>{t.yourSeatLocation}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowTicketAuth(true)}
                  className="text-xs font-semibold text-[#84CC16] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Scan / Switch Ticket</span>
                </button>
                <button
                  onClick={() => setShowSetupModal(true)}
                  className="text-xs font-medium text-[#94A3B8] hover:text-white cursor-pointer"
                >
                  Edit Seat
                </button>
              </div>
            </div>

            {fanProfile.holderName && (
              <div className="mt-1.5 text-xs text-[#CBD5E1]">
                Spectator: <span className="font-semibold text-white">{fanProfile.holderName}</span>
                {fanProfile.tier ? ` · ${fanProfile.tier}` : ''}
              </div>
            )}

            <div className="mt-3 grid grid-cols-4 gap-2 bg-[#0B1120] border border-[#1E293B] rounded-xl p-3.5 text-center">
              <div>
                <div className="text-[11px] text-[#94A3B8]">Gate</div>
                <div className="text-sm font-bold text-white font-mono-tabular mt-0.5">
                  {fanProfile.gate.replace('Gate ', '')}
                </div>
              </div>
              <div className="border-l border-[#1E293B]">
                <div className="text-[11px] text-[#94A3B8]">Section</div>
                <div className="text-sm font-bold text-[#84CC16] font-mono-tabular mt-0.5">
                  {fanProfile.section.replace('Section ', '')}
                </div>
              </div>
              <div className="border-l border-[#1E293B]">
                <div className="text-[11px] text-[#94A3B8]">Row</div>
                <div className="text-sm font-bold text-white font-mono-tabular mt-0.5">
                  {fanProfile.row.replace('Row ', '')}
                </div>
              </div>
              <div className="border-l border-[#1E293B]">
                <div className="text-[11px] text-[#94A3B8]">Seat</div>
                <div className="text-sm font-bold text-white font-mono-tabular mt-0.5">
                  {fanProfile.seat.split(' (')[0].replace('Seat ', '')}
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-[#94A3B8]">
              <span>Current Map Node: {userOrigin.name}</span>
              {fanProfile.preferAccessibleRoutes && (
                <span className="text-[#84CC16] flex items-center gap-1">
                  <Accessibility className="w-3.5 h-3.5" />
                  Step-Free Active
                </span>
              )}
            </div>

            {/* Auto-Detected Services Unlocked by Ticket */}
            {fanProfile.includedServices && fanProfile.includedServices.length > 0 && (
              <div className="mt-4 pt-3.5 border-t border-[#1E293B]">
                <div className="text-xs font-semibold text-white mb-2">
                  Auto-Detected Services for Your Ticket:
                </div>
                <div className="space-y-1 text-xs text-[#CBD5E1]">
                  {fanProfile.includedServices.slice(0, 3).map((srv, idx) => (
                    <div key={idx} className="flex items-center gap-2 truncate">
                      <span className="text-[#84CC16] font-mono-tabular font-bold">✓</span>
                      <span className="truncate">{srv}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Concourse Quick Shortcuts */}
            <div className="mt-5 pt-4 border-t border-[#1E293B]">
              <div className="text-xs font-medium text-white mb-2.5 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-[#84CC16]" />
                <span>Quick Seat Actions</span>
              </div>
              <div className="space-y-1.5">
                <button
                  onClick={() => {
                    if (nearestWashroom?.id) navigateToMapLocation(nearestWashroom.id, true);
                    else setFanTab('map');
                  }}
                  className="w-full text-left text-xs text-[#CBD5E1] hover:text-white bg-[#0B1120] hover:bg-[#1E293B] border border-[#1E293B] rounded-lg px-3 py-2 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                >
                  <span className="truncate">Route to nearest washroom ({nearestWashroom?.name || 'Washroom'})</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#84CC16] shrink-0" />
                </button>
                <button
                  onClick={() => setFanTab('food')}
                  className="w-full text-left text-xs text-[#CBD5E1] hover:text-white bg-[#0B1120] hover:bg-[#1E293B] border border-[#1E293B] rounded-lg px-3 py-2 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                >
                  <span className="truncate">Explore food & beverages with shortest queue</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#84CC16] shrink-0" />
                </button>
                <button
                  onClick={() => {
                    if (nearestExit?.id) navigateToMapLocation(nearestExit.id, true);
                    else setFanTab('map');
                  }}
                  className="w-full text-left text-xs text-[#CBD5E1] hover:text-white bg-[#0B1120] hover:bg-[#1E293B] border border-[#1E293B] rounded-lg px-3 py-2 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                >
                  <span className="truncate">Directions to nearest exit ({nearestExit?.name || 'Gate / Exit'})</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#84CC16] shrink-0" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              onClick={() => setFanTab('map')}
              className="py-2.5 px-4 bg-[#84CC16] hover:bg-[#A3E635] text-[#0B1120] font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <MapPin className="w-4 h-4" />
              <span>{t.openStadiumMap}</span>
            </button>
            <button
              onClick={() => setFanTab('food')}
              className="py-2.5 px-4 bg-[#0B1120] hover:bg-[#1E293B] text-white border border-[#1E293B] font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Utensils className="w-4 h-4 text-[#84CC16]" />
              <span>{t.findFood}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4-Column Quick Action Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => setFanTab('food')}
          className="bg-[#111827] hover:bg-[#1E293B]/80 border border-[#1E293B] rounded-2xl p-4 text-left transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <Utensils className="w-5 h-5 text-[#84CC16]" />
            <span className="text-xs font-mono-tabular text-[#84CC16]">4 Counters Open</span>
          </div>
          <div className="text-base font-bold text-white font-display mt-3 group-hover:text-[#84CC16] transition-colors">
            {t.findFood}
          </div>
          <div className="text-xs text-[#94A3B8] mt-1">
            Compare wait times, veg menus & walk distance
          </div>
        </button>

        <button
          onClick={() => {
            if (nearestWashroom?.id) navigateToMapLocation(nearestWashroom.id, true);
            else setFanTab('map');
          }}
          className="bg-[#111827] hover:bg-[#1E293B]/80 border border-[#1E293B] rounded-2xl p-4 text-left transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <Navigation className="w-5 h-5 text-[#38BDF8]" />
            <span className="text-xs font-mono-tabular text-[#94A3B8]">
              ~{nearestWashroom?.id && queuePredictions[nearestWashroom.id]?.estimatedWaitMinutes ? queuePredictions[nearestWashroom.id].estimatedWaitMinutes : 2}m wait
            </span>
          </div>
          <div className="text-base font-bold text-white font-display mt-3 group-hover:text-[#38BDF8] transition-colors">
            {t.nearestWashroom}
          </div>
          <div className="text-xs text-[#94A3B8] mt-1 truncate">
            Route to {nearestWashroom?.name || 'Washroom'}
          </div>
        </button>

        <button
          onClick={() => {
            if (nearestExit?.id) navigateToMapLocation(nearestExit.id, true);
            else setFanTab('map');
          }}
          className="bg-[#111827] hover:bg-[#1E293B]/80 border border-[#1E293B] rounded-2xl p-4 text-left transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <Footprints className="w-5 h-5 text-[#F59E0B]" />
            <span className="text-xs font-mono-tabular text-[#94A3B8]">Step-Free Egress</span>
          </div>
          <div className="text-base font-bold text-white font-display mt-3 group-hover:text-[#F59E0B] transition-colors">
            {t.emergencyExits}
          </div>
          <div className="text-xs text-[#94A3B8] mt-1 truncate">
            Nearest: {nearestExit?.name || 'Gate / Exit'}
          </div>
        </button>

        <button
          onClick={() => {
            if (nearestFirstAid?.id) navigateToMapLocation(nearestFirstAid.id, true);
            else setFanTab('safety');
          }}
          className="bg-[#111827] hover:bg-[#1E293B]/80 border border-[#1E293B] rounded-2xl p-4 text-left transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <ShieldAlert className="w-5 h-5 text-[#EF4444]" />
            <span className="text-xs font-mono-tabular text-[#E2E8F0]">Verified Config</span>
          </div>
          <div className="text-base font-bold text-white font-display mt-3 group-hover:text-[#EF4444] transition-colors">
            {t.firstAidHelp}
          </div>
          <div className="text-xs text-[#94A3B8] mt-1 truncate">
            Nearest: {nearestFirstAid?.name || 'First Aid Post'}
          </div>
        </button>
      </section>

      {/* Main Content Split: Live Queue Conditions (7 Cols) + Announcements (5 Cols) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Estimated Queue Conditions */}
        <div className="lg:col-span-7 bg-[#111827] border border-[#1E293B] rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#1E293B]">
            <div>
              <h2 className="text-lg font-bold text-white font-display">
                {t.liveQueueSnapshot}
              </h2>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Transparent heuristic estimates from observed queue lengths & open counters
              </p>
            </div>
            <button
              onClick={() => setFanTab('map')}
              className="text-xs font-medium text-[#84CC16] hover:underline cursor-pointer"
            >
              View All on Map →
            </button>
          </div>

          <div className="divide-y divide-[#1E293B] mt-2">
            {featuredFacilities.map(({ loc, pred, walkMins }) => {
              const statusTextColor =
                pred.status === 'Low'
                  ? 'text-[#22C55E]'
                  : pred.status === 'Moderate'
                  ? 'text-[#F59E0B]'
                  : 'text-[#EF4444]';

              return (
                <div
                  key={loc.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <button
                      onClick={() => navigateToMapLocation(loc.id, true)}
                      className="text-sm font-semibold text-white hover:text-[#84CC16] transition-colors text-left truncate block cursor-pointer"
                    >
                      {loc.name}
                    </button>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#94A3B8] mt-1">
                      <span>{loc.zone} Zone</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">~{walkMins} min walk</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {loc.dataSource === 'manual_operator'
                          ? 'Operator Verified'
                          : loc.dataSource === 'verified_config'
                          ? 'Verified Facility'
                          : 'Simulated Estimate'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{loc.lastUpdated}</span>
                    </div>
                    {pred.alternativeFacility && (
                      <div className="text-xs text-[#84CC16] mt-1">
                        Faster nearby option: {pred.alternativeFacility.name} (~
                        {pred.alternativeFacility.estimatedWaitMinutes}m wait)
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-bold text-white font-mono-tabular">
                        {pred.minWaitMinutes}–{pred.maxWaitMinutes} min wait
                      </div>
                      <div className={`text-xs font-medium ${statusTextColor}`}>
                        Status: {pred.status} ({loc.openCounters} counters)
                      </div>
                    </div>
                    <button
                      onClick={() => navigateToMapLocation(loc.id, true)}
                      className="px-3 py-1.5 text-xs font-medium bg-[#0B1120] hover:bg-[#1E293B] text-white border border-[#1E293B] rounded-lg transition-colors cursor-pointer"
                    >
                      Route
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Official Venue Announcements */}
        <div className="lg:col-span-5 bg-[#111827] border border-[#1E293B] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#1E293B]">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-[#84CC16]" />
                <h2 className="text-lg font-bold text-white font-display">
                  {t.officialAnnouncements}
                </h2>
              </div>
              <span className="text-xs text-[#94A3B8]">Demo Feed</span>
            </div>

            <div className="divide-y divide-[#1E293B] mt-2">
              {announcements.map((ann) => (
                <div key={ann.id} className="py-4">
                  <div className="flex items-center justify-between text-xs text-[#94A3B8] mb-1">
                    <span
                      className={
                        ann.priority === 'Important' || ann.priority === 'Emergency'
                          ? 'text-[#F59E0B] font-semibold'
                          : 'text-[#84CC16]'
                      }
                    >
                      {ann.category} · {ann.priority}
                    </span>
                    <span>{ann.timestamp}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-white">{ann.title}</h3>
                  <p className="text-xs text-[#CBD5E1] mt-1 leading-relaxed">
                    {ann.message}
                  </p>
                  <div className="text-[11px] text-[#64748B] mt-1.5">
                    Source: {ann.source}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[#1E293B] flex items-center justify-between">
            <span className="text-xs text-[#94A3B8]">
              Spot a facility or queue issue?
            </span>
            <button
              onClick={() => setFanTab('safety')}
              className="text-xs font-semibold text-[#84CC16] hover:underline cursor-pointer"
            >
              {t.reportIssue} →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
