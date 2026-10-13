import React, { useState } from 'react';
import {
  LayoutDashboard,
  Clock,
  Store,
  Building2,
  MessageSquareWarning,
  BarChart3,
  Settings,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Megaphone,
  Accessibility,
} from 'lucide-react';
import { useStadium } from '../context/StadiumContext';
import { LocationCategory } from '../types/stadium';

export const OperatorDashboardView: React.FC = () => {
  const {
    operatorTab,
    setOperatorTab,
    venueConfig,
    updateVenueConfig,
    activeEvent,
    events,
    selectEvent,
    updateEvent,
    locations,
    queuePredictions,
    updateLocationQueue,
    updateLocationDetails,
    addLocation,
    foodStalls,
    updateMenuItem,
    updateFoodStall,
    queueLogs,
    fanReports,
    updateFanReportStatus,
    announcements,
    addAnnouncement,
    searchQueriesLog,
    orders,
  } = useStadium();

  // State for Adding a New Facility
  const [newLocName, setNewLocName] = useState('');
  const [newLocCategory, setNewLocCategory] = useState<LocationCategory>('water');
  const [newLocZone, setNewLocZone] = useState<'North' | 'South' | 'East' | 'West'>('North');
  const [newLocAccessible, setNewLocAccessible] = useState(true);
  const [newLocDescription, setNewLocDescription] = useState('');

  // State for Adding an Announcement
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annCategory, setAnnCategory] = useState<
    'Safety' | 'Match' | 'Transport' | 'Concessions'
  >('Concessions');
  const [annPriority, setAnnPriority] = useState<'Normal' | 'Important' | 'Emergency'>('Important');

  // State for feedback filter
  const [reportFilter, setReportFilter] = useState<'All' | 'Submitted' | 'In Progress' | 'Resolved'>(
    'All'
  );

  // Computed KPIs from live state
  const openFacilitiesCount = locations.filter((l) => l.status !== 'Closed').length;
  const busyFacilitiesCount = locations.filter(
    (l) => queuePredictions[l.id]?.status === 'Busy'
  ).length;
  const unresolvedReportsCount = fanReports.filter((r) => r.status !== 'Resolved').length;
  const avgWaitAcrossVenue = Math.round(
    locations.reduce((acc, l) => acc + (queuePredictions[l.id]?.estimatedWaitMinutes || 0), 0) /
      Math.max(1, locations.length)
  );

  const handleAddFacility = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName.trim()) return;
    const zoneCoords = {
      North: { x: 450, y: 135, conn: 'sec-n1' },
      East: { x: 800, y: 310, conn: 'sec-e1' },
      South: { x: 460, y: 560, conn: 'sec-s1' },
      West: { x: 200, y: 310, conn: 'sec-w1' },
    }[newLocZone];

    addLocation({
      name: newLocName.trim(),
      category: newLocCategory,
      level: 'Level 1 Concourse',
      zone: newLocZone,
      x: zoneCoords.x,
      y: zoneCoords.y,
      accessible: newLocAccessible,
      status: 'Open',
      description:
        newLocDescription.trim() ||
        `Operator-configured ${newLocCategory} station in ${newLocZone} Zone.`,
      connectedTo: [zoneCoords.conn],
      observedQueueLength: 2,
      openCounters: 4,
      avgServiceTimeSeconds: 20,
      dataSource: 'manual_operator',
    });
    setNewLocName('');
    setNewLocDescription('');
  };

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annMessage.trim()) return;
    addAnnouncement({
      title: annTitle.trim(),
      message: annMessage.trim(),
      category: annCategory,
      priority: annPriority,
      source: 'Venue Operations',
    });
    setAnnTitle('');
    setAnnMessage('');
  };

  return (
    <div className="space-y-6">
      {/* Top Operator Context Banner */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#84CC16] font-semibold">
            <span>Venue Operations & Admin Control Plane</span>
            <span aria-hidden="true">·</span>
            <span>Synchronized with Fan App</span>
          </div>
          <h1 className="text-xl font-bold text-white font-display mt-0.5">
            {venueConfig.name} — {activeEvent.title}
          </h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Any edits to queue observations, menu stock, facility status, or announcements immediately update the fan-facing experience.
          </p>
        </div>

        {/* Sub-tab Quick Selector */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
              { id: 'queues', label: 'Queues', icon: <Clock className="w-3.5 h-3.5" /> },
              { id: 'food', label: 'Food & Stock', icon: <Store className="w-3.5 h-3.5" /> },
              { id: 'facilities', label: 'Facilities', icon: <Building2 className="w-3.5 h-3.5" /> },
              { id: 'feedback', label: 'Reports', icon: <MessageSquareWarning className="w-3.5 h-3.5" /> },
              { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-3.5 h-3.5" /> },
              { id: 'settings', label: 'Settings', icon: <Settings className="w-3.5 h-3.5" /> },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setOperatorTab(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                operatorTab === t.id
                  ? 'bg-[#84CC16] text-[#0B1120] font-semibold'
                  : 'bg-[#0B1120] text-[#94A3B8] hover:text-white border border-[#1E293B]'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4-Column KPI Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-4">
          <div className="text-xs text-[#94A3B8]">Active Facilities Open</div>
          <div className="text-2xl font-bold text-white font-mono-tabular mt-1">
            {openFacilitiesCount} / {locations.length}
          </div>
          <div className="text-xs text-[#22C55E] mt-1">
            {Math.round((openFacilitiesCount / Math.max(1, locations.length)) * 100)}% Operational Availability
          </div>
        </div>

        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-4">
          <div className="text-xs text-[#94A3B8]">Avg Venue Queue Estimate</div>
          <div className="text-2xl font-bold text-white font-mono-tabular mt-1">
            ~{avgWaitAcrossVenue} mins
          </div>
          <div className="text-xs text-[#F59E0B] mt-1">
            {busyFacilitiesCount} facilities currently marked Busy
          </div>
        </div>

        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-4">
          <div className="text-xs text-[#94A3B8]">Open Fan Reports & Help</div>
          <div className="text-2xl font-bold text-white font-mono-tabular mt-1">
            {unresolvedReportsCount}
          </div>
          <div className="text-xs text-[#38BDF8] mt-1">
            {fanReports.length} total reports logged today
          </div>
        </div>

        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-4">
          <div className="text-xs text-[#94A3B8]">Next Match Break Surge</div>
          <div className="text-2xl font-bold text-[#84CC16] font-mono-tabular mt-1">
            {activeEvent.nextBreakInMinutes} mins
          </div>
          <div className="text-xs text-[#94A3B8] mt-1 truncate">
            {activeEvent.breakLabel}
          </div>
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {operatorTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Cols: High-Priority Queue Conditions Across Venue */}
          <div className="lg:col-span-7 bg-[#111827] border border-[#1E293B] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
              <div>
                <h2 className="text-base font-bold text-white font-display">
                  Live Facility Queue Conditions
                </h2>
                <p className="text-xs text-[#94A3B8]">
                  Showing current wait estimates, open counters, and data provenance
                </p>
              </div>
              <button
                onClick={() => setOperatorTab('queues')}
                className="text-xs font-semibold text-[#84CC16] hover:underline cursor-pointer"
              >
                Edit Queues →
              </button>
            </div>

            <div className="divide-y divide-[#1E293B]">
              {locations
                .filter((l) => l.category === 'food' || l.category === 'washroom' || l.category === 'gate')
                .map((loc) => {
                  const pred = queuePredictions[loc.id];
                  return (
                    <div
                      key={loc.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-white">{loc.name}</div>
                        <div className="text-[#94A3B8] mt-0.5 flex flex-wrap items-center gap-2">
                          <span>Queue: {loc.observedQueueLength} pax</span>
                          <span aria-hidden="true">·</span>
                          <span>Counters: {loc.openCounters}</span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={
                              loc.dataSource === 'manual_operator'
                                ? 'text-[#84CC16]'
                                : 'text-[#94A3B8]'
                            }
                          >
                            {loc.dataSource === 'manual_operator'
                              ? 'Manual Operator Report'
                              : 'Simulated Heuristic'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`font-mono-tabular font-bold ${
                            pred.status === 'Low'
                              ? 'text-[#22C55E]'
                              : pred.status === 'Moderate'
                              ? 'text-[#F59E0B]'
                              : 'text-[#EF4444]'
                          }`}
                        >
                          {pred.status} (~{pred.estimatedWaitMinutes}m)
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Right 5 Cols: Recent Fan Incidents & Broadcast Announcement Publisher */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
                <h2 className="text-base font-bold text-white font-display">
                  Recent Fan Incidents & Requests
                </h2>
                <button
                  onClick={() => setOperatorTab('feedback')}
                  className="text-xs font-semibold text-[#84CC16] hover:underline cursor-pointer"
                >
                  Manage All →
                </button>
              </div>

              <div className="divide-y divide-[#1E293B]">
                {fanReports.slice(0, 4).map((rep) => (
                  <div key={rep.id} className="py-3 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">
                        {rep.category} · {rep.locationName.split(' (')[0]}
                      </span>
                      <span
                        className={
                          rep.status === 'Resolved'
                            ? 'text-[#22C55E]'
                            : rep.status === 'In Progress'
                            ? 'text-[#F59E0B]'
                            : 'text-[#38BDF8]'
                        }
                      >
                        {rep.status}
                      </span>
                    </div>
                    <p className="text-[#CBD5E1]">{rep.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Publish Live Announcement to Fan Home & Match Center */}
            <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white font-display">
                <Megaphone className="w-4 h-4 text-[#84CC16]" />
                <span>Publish Official Fan Announcement</span>
              </div>
              <form onSubmit={handleCreateAnnouncement} className="space-y-3">
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="Announcement Headline (e.g. Gate B Express Entry Open)"
                  className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#84CC16] focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={annCategory}
                    onChange={(e) => setAnnCategory(e.target.value as any)}
                    className="bg-[#0B1120] border border-[#1E293B] rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Concessions">Concessions</option>
                    <option value="Safety">Safety</option>
                    <option value="Transport">Transport</option>
                    <option value="Match">Match</option>
                  </select>
                  <select
                    value={annPriority}
                    onChange={(e) => setAnnPriority(e.target.value as any)}
                    className="bg-[#0B1120] border border-[#1E293B] rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Normal">Normal Priority</option>
                    <option value="Important">Important</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
                <textarea
                  rows={2}
                  required
                  value={annMessage}
                  onChange={(e) => setAnnMessage(e.target.value)}
                  placeholder="Enter announcement message visible on Fan Home & AI Concierge..."
                  className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#84CC16] focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-[#84CC16] hover:bg-[#A3E635] text-[#0B1120] font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Broadcast Announcement to Fans
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: QUEUE MONITOR */}
      {operatorTab === 'queues' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-[#111827] border border-[#1E293B] rounded-2xl p-6 space-y-4">
            <div className="pb-3 border-b border-[#1E293B]">
              <h2 className="text-lg font-bold text-white font-display">
                Interactive Queue Monitor & Counter Controls
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Adjust observed queue length or open service counters to immediately recalculate fan-facing waiting times.
              </p>
            </div>

            <div className="divide-y divide-[#1E293B]">
              {locations
                .filter((l) => l.category === 'food' || l.category === 'washroom' || l.category === 'gate')
                .map((loc) => {
                  const pred = queuePredictions[loc.id];
                  return (
                    <div
                      key={loc.id}
                      className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{loc.name}</span>
                          <span className="text-[11px] text-[#84CC16] font-mono-tabular">
                            (~{pred.estimatedWaitMinutes}m wait)
                          </span>
                        </div>
                        <div className="text-xs text-[#94A3B8] flex flex-wrap items-center gap-2">
                          <span>
                            Source:{' '}
                            {loc.dataSource === 'manual_operator'
                              ? 'Manual Operator Reported'
                              : 'Simulated Baseline'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{loc.lastUpdated}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {/* Queue Length Stepper */}
                        <div className="bg-[#0B1120] border border-[#1E293B] rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs">
                          <span className="text-[#94A3B8]">Queue Pax:</span>
                          <button
                            onClick={() =>
                              updateLocationQueue(
                                loc.id,
                                Math.max(0, loc.observedQueueLength - 4),
                                loc.openCounters,
                                loc.status
                              )
                            }
                            className="px-2 py-0.5 bg-[#111827] hover:bg-[#1E293B] rounded text-white cursor-pointer"
                          >
                            -4
                          </button>
                          <span className="font-mono-tabular font-bold text-white w-6 text-center">
                            {loc.observedQueueLength}
                          </span>
                          <button
                            onClick={() =>
                              updateLocationQueue(
                                loc.id,
                                loc.observedQueueLength + 4,
                                loc.openCounters,
                                loc.status
                              )
                            }
                            className="px-2 py-0.5 bg-[#111827] hover:bg-[#1E293B] rounded text-white cursor-pointer"
                          >
                            +4
                          </button>
                        </div>

                        {/* Open Counters Stepper */}
                        <div className="bg-[#0B1120] border border-[#1E293B] rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs">
                          <span className="text-[#94A3B8]">Counters:</span>
                          <button
                            onClick={() =>
                              updateLocationQueue(
                                loc.id,
                                loc.observedQueueLength,
                                Math.max(1, loc.openCounters - 1),
                                loc.status
                              )
                            }
                            className="px-2 py-0.5 bg-[#111827] hover:bg-[#1E293B] rounded text-white cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-mono-tabular font-bold text-[#84CC16] w-4 text-center">
                            {loc.openCounters}
                          </span>
                          <button
                            onClick={() =>
                              updateLocationQueue(
                                loc.id,
                                loc.observedQueueLength,
                                loc.openCounters + 1,
                                loc.status
                              )
                            }
                            className="px-2 py-0.5 bg-[#111827] hover:bg-[#1E293B] rounded text-white cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        {/* Status Selector */}
                        <select
                          value={loc.status}
                          onChange={(e) =>
                            updateLocationQueue(
                              loc.id,
                              loc.observedQueueLength,
                              loc.openCounters,
                              e.target.value as 'Open' | 'Busy' | 'Closed'
                            )
                          }
                          className="bg-[#0B1120] border border-[#1E293B] rounded-xl px-3 py-1.5 text-xs text-white cursor-pointer"
                        >
                          <option value="Open">Open</option>
                          <option value="Busy">Busy</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Right 4 Cols: Timestamped Observation Log */}
          <div className="lg:col-span-4 bg-[#111827] border border-[#1E293B] rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-white font-display pb-3 border-b border-[#1E293B]">
              Timestamped Queue Observation Log
            </h2>
            <div className="divide-y divide-[#1E293B] max-h-[540px] overflow-y-auto">
              {queueLogs.map((log) => (
                <div key={log.id} className="py-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">
                      {log.locationName.split(' · ')[0]}
                    </span>
                    <span className="font-mono-tabular text-[#84CC16]">
                      ~{log.estimatedWaitMinutes}m wait
                    </span>
                  </div>
                  <div className="text-[#94A3B8] flex items-center justify-between">
                    <span>
                      {log.observedQueueLength} in line · {log.openCounters} counters
                    </span>
                    <span className="font-mono-tabular">{log.timestamp}</span>
                  </div>
                  <div className="text-[11px] text-[#64748B]">
                    Source: {log.source === 'manual_operator' ? 'Operator Verified' : 'Simulated'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FOOD & INVENTORY */}
      {operatorTab === 'food' && (
        <div className="space-y-6">
          {foodStalls.map((stall) => (
            <div
              key={stall.id}
              className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[#1E293B]">
                <div>
                  <h2 className="text-base font-bold text-white font-display">
                    {stall.name}
                  </h2>
                  <p className="text-xs text-[#94A3B8]">
                    {stall.sectionLabel} · {stall.cuisine}
                  </p>
                </div>
                <button
                  onClick={() => updateFoodStall(stall.id, { isOpen: !stall.isOpen })}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                    stall.isOpen
                      ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]'
                      : 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]'
                  }`}
                >
                  {stall.isOpen ? 'Stall Open' : 'Stall Closed'}
                </button>
              </div>

              <div className="divide-y divide-[#1E293B]">
                {stall.menu.map((item) => (
                  <div
                    key={item.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-white">
                        {item.name}{' '}
                        <span className="text-[#94A3B8]">
                          ({item.dietaryLabels.join(', ')})
                        </span>
                      </div>
                      <div className="text-[#64748B] mt-0.5">{item.description}</div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                      {/* Price Editor */}
                      <div className="flex items-center gap-1.5 bg-[#0B1120] border border-[#1E293B] rounded-lg px-2.5 py-1">
                        <span className="text-[#94A3B8]">₹</span>
                        <input
                          type="number"
                          value={item.priceINR}
                          onChange={(e) =>
                            updateMenuItem(stall.id, item.id, {
                              priceINR: Math.max(20, Number(e.target.value)),
                            })
                          }
                          className="w-14 bg-transparent font-mono-tabular font-bold text-white focus:outline-none"
                        />
                      </div>

                      {/* Prep Time Editor */}
                      <div className="flex items-center gap-1.5 bg-[#0B1120] border border-[#1E293B] rounded-lg px-2.5 py-1">
                        <span className="text-[#94A3B8]">Prep:</span>
                        <input
                          type="number"
                          value={item.prepTimeMinutes}
                          onChange={(e) =>
                            updateMenuItem(stall.id, item.id, {
                              prepTimeMinutes: Math.max(1, Number(e.target.value)),
                            })
                          }
                          className="w-10 bg-transparent font-mono-tabular font-bold text-white focus:outline-none"
                        />
                        <span className="text-[#94A3B8]">m</span>
                      </div>

                      {/* Availability Toggle */}
                      <button
                        onClick={() =>
                          updateMenuItem(stall.id, item.id, { available: !item.available })
                        }
                        className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                          item.available
                            ? 'bg-[#84CC16] text-[#0B1120]'
                            : 'bg-[#0B1120] text-[#EF4444] border border-[#EF4444]'
                        }`}
                      >
                        {item.available ? 'In Stock' : 'Sold Out'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: FACILITY MANAGEMENT */}
      {operatorTab === 'facilities' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-[#111827] border border-[#1E293B] rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-white font-display pb-3 border-b border-[#1E293B]">
              Configured Venue Facilities ({locations.length})
            </h2>
            <div className="divide-y divide-[#1E293B]">
              {locations.map((loc) => (
                <div
                  key={loc.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-semibold text-white">{loc.name}</div>
                    <div className="text-[#94A3B8] mt-0.5">
                      {loc.category.toUpperCase()} · {loc.zone} Zone · {loc.level}
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      onClick={() =>
                        updateLocationDetails(loc.id, { accessible: !loc.accessible })
                      }
                      className={`px-2.5 py-1 rounded-lg border flex items-center gap-1 cursor-pointer ${
                        loc.accessible
                          ? 'border-[#84CC16] text-[#84CC16]'
                          : 'border-[#1E293B] text-[#64748B]'
                      }`}
                    >
                      <Accessibility className="w-3.5 h-3.5" />
                      <span>{loc.accessible ? 'Accessible' : 'Stairs Only'}</span>
                    </button>

                    <select
                      value={loc.status}
                      onChange={(e) =>
                        updateLocationDetails(loc.id, {
                          status: e.target.value as 'Open' | 'Busy' | 'Closed',
                        })
                      }
                      className="bg-[#0B1120] border border-[#1E293B] rounded-lg px-2.5 py-1 text-white cursor-pointer"
                    >
                      <option value="Open">Open</option>
                      <option value="Busy">Busy</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 bg-[#111827] border border-[#1E293B] rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-base font-bold text-white font-display">
              <Plus className="w-4 h-4 text-[#84CC16]" />
              <span>Add New Map Facility</span>
            </div>
            <form onSubmit={handleAddFacility} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#94A3B8] mb-1">Facility Name</label>
                <input
                  type="text"
                  required
                  value={newLocName}
                  onChange={(e) => setNewLocName(e.target.value)}
                  placeholder="e.g. North Express Water Refill 2"
                  className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#94A3B8] mb-1">Category</label>
                  <select
                    value={newLocCategory}
                    onChange={(e) => setNewLocCategory(e.target.value as LocationCategory)}
                    className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-3 py-2 text-white"
                  >
                    <option value="water">Water Station</option>
                    <option value="first_aid">First Aid</option>
                    <option value="washroom">Washroom</option>
                    <option value="food">Food Counter</option>
                    <option value="exit">Emergency Exit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#94A3B8] mb-1">Arena Zone</label>
                  <select
                    value={newLocZone}
                    onChange={(e) => setNewLocZone(e.target.value as any)}
                    className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-3 py-2 text-white"
                  >
                    <option value="North">North</option>
                    <option value="East">East</option>
                    <option value="South">South</option>
                    <option value="West">West</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[#94A3B8] mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newLocDescription}
                  onChange={(e) => setNewLocDescription(e.target.value)}
                  placeholder="Operational details & accessibility notes..."
                  className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-3 py-2 text-white"
                />
              </div>
              <button
                type="button"
                onClick={() => setNewLocAccessible(!newLocAccessible)}
                className="w-full py-2 px-3 bg-[#0B1120] border border-[#1E293B] rounded-xl text-left flex items-center justify-between text-white cursor-pointer"
              >
                <span>Step-Free Wheelchair Accessible</span>
                <span className="text-[#84CC16] font-bold">
                  {newLocAccessible ? 'Yes' : 'No'}
                </span>
              </button>
              <button
                type="submit"
                className="w-full py-2.5 bg-[#84CC16] hover:bg-[#A3E635] text-[#0B1120] font-semibold rounded-xl cursor-pointer"
              >
                Add Facility to Stadium Map
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 5: FAN FEEDBACK & INCIDENTS */}
      {operatorTab === 'feedback' && (
        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1E293B]">
            <div>
              <h2 className="text-lg font-bold text-white font-display">
                Fan Feedback & Staff Assistance Queue ({fanReports.length})
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Update status to In Progress or Resolved to sync with the Fan Activity screen
              </p>
            </div>

            <div className="flex items-center gap-1 bg-[#0B1120] border border-[#1E293B] rounded-xl p-1">
              {(['All', 'Submitted', 'In Progress', 'Resolved'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setReportFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                    reportFilter === st
                      ? 'bg-[#84CC16] text-[#0B1120] font-semibold'
                      : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-[#1E293B]">
            {fanReports
              .filter((r) => reportFilter === 'All' || r.status === reportFilter)
              .map((rep) => (
                <div
                  key={rep.id}
                  className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono-tabular font-bold text-[#84CC16]">
                        {rep.id}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-bold text-white">{rep.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#CBD5E1]">{rep.locationName}</span>
                      {rep.priority === 'High' || rep.priority === 'Urgent' ? (
                        <span className="text-[#EF4444] font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {rep.priority} Priority
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-white">{rep.description}</p>
                    <div className="text-[#64748B]">
                      Reported from: {rep.seatInfo || 'Concourse'} · {rep.timestamp}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {(['Submitted', 'In Progress', 'Resolved'] as const).map((statusOpt) => (
                      <button
                        key={statusOpt}
                        onClick={() => updateFanReportStatus(rep.id, statusOpt)}
                        className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer ${
                          rep.status === statusOpt
                            ? statusOpt === 'Resolved'
                              ? 'bg-[#22C55E] text-[#0B1120] font-semibold'
                              : 'bg-[#84CC16] text-[#0B1120] font-semibold'
                            : 'bg-[#0B1120] text-[#94A3B8] hover:text-white border border-[#1E293B]'
                        }`}
                      >
                        {statusOpt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 6: ANALYTICS (Derived directly from application state) */}
      {operatorTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Queue Wait Time Distribution by Facility */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white font-display">
                Current Estimated Wait Time by Facility (Live Application State)
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Derived from current observed queue lengths and open counter ratios
              </p>
            </div>
            <div className="space-y-3">
              {locations
                .filter((l) => l.category === 'food' || l.category === 'washroom' || l.category === 'gate')
                .map((loc) => {
                  const wait = queuePredictions[loc.id]?.estimatedWaitMinutes || 1;
                  const pct = Math.min(100, Math.round((wait / 18) * 100));
                  return (
                    <div key={loc.id} className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-white truncate">{loc.name}</span>
                        <span className="font-mono-tabular font-bold text-[#84CC16]">
                          {wait} mins ({loc.observedQueueLength} pax)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[#0B1120] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            wait >= 10
                              ? 'bg-[#EF4444]'
                              : wait >= 5
                              ? 'bg-[#F59E0B]'
                              : 'bg-[#84CC16]'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Chart 2: Most Searched Facilities & Fan Queries */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white font-display">
                Most Searched Venue Terms & Categories
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Updates dynamically as fans search the Stadium Map
              </p>
            </div>
            <div className="space-y-3">
              {searchQueriesLog.map((item, idx) => {
                const maxC = Math.max(...searchQueriesLog.map((q) => q.count), 1);
                const pct = Math.round((item.count / maxC) * 100);
                return (
                  <div key={idx} className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-white font-medium">{item.term}</span>
                      <span className="font-mono-tabular text-[#38BDF8]">
                        {item.count} searches
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#0B1120] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#38BDF8] rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart 3: Fan Reports Breakdown by Category */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-white font-display">
              Submitted Fan Reports by Issue Category
            </h2>
            <div className="divide-y divide-[#1E293B] text-xs">
              {(
                [
                  'Cleanliness',
                  'Long Queue',
                  'Accessibility',
                  'Lost & Found',
                  'Facility Issue',
                  'Safety & Medical',
                ] as const
              ).map((cat) => {
                const count = fanReports.filter((r) => r.category === cat).length;
                return (
                  <div key={cat} className="py-2.5 flex items-center justify-between">
                    <span className="text-[#CBD5E1]">{cat}</span>
                    <span className="font-mono-tabular font-bold text-white">
                      {count} report{count === 1 ? '' : 's'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart 4: Concourse Food Inventory & Simulated Order Telemetry */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-white font-display">
              Food & Beverage Menu Availability & Orders
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0B1120] border border-[#1E293B] rounded-xl p-4">
                <div className="text-xs text-[#94A3B8]">Menu Items In Stock</div>
                <div className="text-2xl font-bold text-[#84CC16] font-mono-tabular mt-1">
                  {foodStalls.reduce(
                    (acc, s) => acc + s.menu.filter((m) => m.available).length,
                    0
                  )}{' '}
                  /{' '}
                  {foodStalls.reduce((acc, s) => acc + s.menu.length, 0)}
                </div>
              </div>
              <div className="bg-[#0B1120] border border-[#1E293B] rounded-xl p-4">
                <div className="text-xs text-[#94A3B8]">Simulated Fan Orders</div>
                <div className="text-2xl font-bold text-white font-mono-tabular mt-1">
                  {orders.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: VENUE SETTINGS (Administrator Configuration) */}
      {operatorTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-white font-display pb-2 border-b border-[#1E293B]">
              Administrator Venue & Emergency Configuration
            </h2>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#94A3B8] mb-1">Venue Name</label>
                <input
                  type="text"
                  value={venueConfig.name}
                  onChange={(e) => updateVenueConfig({ name: e.target.value })}
                  className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-3.5 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-[#94A3B8] mb-1">
                  Official Emergency Helpline (Displayed across Help & Safety and AI Concierge)
                </label>
                <input
                  type="text"
                  value={venueConfig.emergencyPhone}
                  onChange={(e) => updateVenueConfig({ emergencyPhone: e.target.value })}
                  className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-3.5 py-2 text-white font-mono-tabular"
                />
              </div>
              <div>
                <label className="block text-[#94A3B8] mb-1">
                  Medical & Safety Dispatch Protocol Note
                </label>
                <textarea
                  rows={3}
                  value={venueConfig.medicalDispatchNote}
                  onChange={(e) => updateVenueConfig({ medicalDispatchNote: e.target.value })}
                  className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-3.5 py-2 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#94A3B8] mb-1">Weather Summary</label>
                  <input
                    type="text"
                    value={venueConfig.weatherSummary}
                    onChange={(e) => updateVenueConfig({ weatherSummary: e.target.value })}
                    className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-3.5 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[#94A3B8] mb-1">Temperature (°C)</label>
                  <input
                    type="number"
                    value={venueConfig.temperatureC}
                    onChange={(e) =>
                      updateVenueConfig({ temperatureC: Number(e.target.value) })
                    }
                    className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-3.5 py-2 text-white font-mono-tabular"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-white font-display pb-2 border-b border-[#1E293B]">
              Active Event & Break Timing Controls
            </h2>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#94A3B8] mb-1">Active Venue Fixture</label>
                <select
                  value={activeEvent.id}
                  onChange={(e) => selectEvent(e.target.value)}
                  className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-3.5 py-2 text-white"
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      [{ev.sport.toUpperCase()}] {ev.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#94A3B8] mb-1">
                  Minutes Until Next Break (Triggers Pre-Break Queue Surge when ≤ 8 mins)
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={activeEvent.nextBreakInMinutes}
                  onChange={(e) =>
                    updateEvent(activeEvent.id, {
                      nextBreakInMinutes: Math.max(1, Number(e.target.value)),
                    })
                  }
                  className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-3.5 py-2 text-white font-mono-tabular"
                />
              </div>

              <div>
                <label className="block text-[#94A3B8] mb-1">Match Status Line</label>
                <input
                  type="text"
                  value={activeEvent.status}
                  onChange={(e) => updateEvent(activeEvent.id, { status: e.target.value })}
                  className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-3.5 py-2 text-white"
                />
              </div>

              <div className="p-3.5 bg-[#0B1120] border border-[#1E293B] rounded-xl text-[#94A3B8] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#84CC16] shrink-0" />
                <span>
                  All changes made here immediately propagate to Fan Home, Match Center, Queue Prediction Engine, and AI Concierge context.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
