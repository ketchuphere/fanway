import React, { useState, useMemo } from 'react';
import {
  Search,
  Navigation,
  Accessibility,
  MapPin,
  Clock,
  Footprints,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Ticket,
  Building2,
  ChevronRight,
  ShieldCheck,
  Compass,
  Trophy,
} from 'lucide-react';
import { useStadium } from '../context/StadiumContext';
import { LocationCategory, VenueLocation } from '../types/stadium';
import { calculateVenueRoute } from '../utils/queuePrediction';
import { StadiumStand } from '../data/iplStadiumsData';

const CATEGORY_FILTERS: { id: 'all' | LocationCategory; label: string }[] = [
  { id: 'all', label: 'All Facilities' },
  { id: 'section', label: 'Stands & Bowls' },
  { id: 'gate', label: 'Gates & Turnstiles' },
  { id: 'food', label: 'Food & Drinks' },
  { id: 'washroom', label: 'Washrooms' },
  { id: 'first_aid', label: 'First Aid & Medical' },
  { id: 'exit', label: 'Exits & Metro Link' },
  { id: 'parking', label: 'Pickups & Transit' },
  { id: 'water', label: 'Free Water' },
];

export const StadiumMapView: React.FC = () => {
  const {
    iplStadiums,
    activeStadiumId,
    activeStadium,
    selectStadium,
    locations,
    queuePredictions,
    fanProfile,
    updateFanProfile,
    assignSeat,
    selectedMapLocationId,
    setSelectedMapLocationId,
    mapRouteDestinationId,
    setMapRouteDestinationId,
    recordSearchTerm,
    setFanTab,
    askConciergeQuestion,
  } = useStadium();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | LocationCategory>('all');
  const [accessibleOnly, setAccessibleOnly] = useState(false);
  const [showSeatAssignerModal, setShowSeatAssignerModal] = useState(false);

  // Seat Assigner local state
  const [assignStandId, setAssignStandId] = useState<string>(
    activeStadium.stands[0]?.id || ''
  );
  const [assignTier, setAssignTier] = useState<string>(
    activeStadium.stands[0]?.tierLevels[0] || 'Lower Bowl'
  );
  const [assignRow, setAssignRow] = useState<string>(fanProfile.row || 'Row A');
  const [assignSeatNum, setAssignSeatNum] = useState<string>(
    fanProfile.seat.replace(/[^0-9]/g, '') || '04'
  );

  const selectedStand = useMemo(() => {
    return (
      activeStadium.stands.find((s) => s.id === assignStandId) ||
      activeStadium.stands[0]
    );
  }, [activeStadium.stands, assignStandId]);

  const userOrigin = useMemo(
    () => locations.find((l) => l.id === fanProfile.currentLocationId) || locations[0],
    [locations, fanProfile.currentLocationId]
  );

  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      if (activeCategory !== 'all' && loc.category !== activeCategory) return false;
      if (accessibleOnly && !loc.accessible) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          loc.name.toLowerCase().includes(q) ||
          loc.zone.toLowerCase().includes(q) ||
          loc.description.toLowerCase().includes(q) ||
          loc.category.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [locations, activeCategory, accessibleOnly, searchQuery]);

  const selectedLocation: VenueLocation = useMemo(() => {
    return (
      locations.find((l) => l.id === selectedMapLocationId) ||
      filteredLocations[0] ||
      locations[0]
    );
  }, [locations, selectedMapLocationId, filteredLocations]);

  const activeRoute = useMemo(() => {
    const destId = mapRouteDestinationId || selectedLocation.id;
    return calculateVenueRoute(
      userOrigin.id,
      destId,
      locations,
      fanProfile.preferAccessibleRoutes
    );
  }, [userOrigin.id, mapRouteDestinationId, selectedLocation.id, locations, fanProfile.preferAccessibleRoutes]);

  const selectedPrediction = queuePredictions[selectedLocation.id];

  // Nearby facilities to the selected location
  const nearbyFacilities = useMemo(() => {
    return locations
      .filter((l) => l.id !== selectedLocation.id && l.status !== 'Closed')
      .map((l) => ({
        loc: l,
        dist: Math.round(Math.hypot(l.x - selectedLocation.x, l.y - selectedLocation.y) * 0.55),
        pred: queuePredictions[l.id],
      }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 3);
  }, [locations, selectedLocation, queuePredictions]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      recordSearchTerm(searchQuery.trim());
      if (filteredLocations.length > 0) {
        setSelectedMapLocationId(filteredLocations[0].id);
        setMapRouteDestinationId(filteredLocations[0].id);
      }
    }
  };

  const handleSelectStandFromMap = (stand: StadiumStand) => {
    setAssignStandId(stand.id);
    setAssignTier(stand.tierLevels[0] || 'Lower Bowl');
    // Find matching venue location
    const matchedLoc = locations.find(
      (l) => l.name.toLowerCase().includes(stand.name.toLowerCase().split(' ')[0]) || l.category === 'section'
    );
    if (matchedLoc) {
      setSelectedMapLocationId(matchedLoc.id);
      setMapRouteDestinationId(matchedLoc.id);
    }
  };

  const handleApplySeatAssignment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const formattedSeat = `Seat ${assignSeatNum.padStart(2, '0')}`;
    const formattedRow = assignRow.startsWith('Row') ? assignRow : `Row ${assignRow}`;

    // Find stand location
    const standLoc =
      locations.find(
        (l) =>
          l.id.includes(selectedStand.shortCode.toLowerCase()) ||
          l.name.toLowerCase().includes(selectedStand.name.toLowerCase().split(' ')[0])
      ) ||
      locations.find((l) => l.category === 'section') ||
      locations[0];

    const gateLoc = locations.find((l) => l.id === selectedStand.entryGateId) || locations[0];

    updateFanProfile({
      stadiumId: activeStadium.id,
      currentLocationId: standLoc.id,
      section: selectedStand.name,
      tier: assignTier,
      row: formattedRow,
      seat: formattedSeat,
      gate: gateLoc.name.split(' (')[0],
      hasCompletedOnboarding: true,
    });

    setSelectedMapLocationId(standLoc.id);
    setMapRouteDestinationId(standLoc.id);
    setShowSeatAssignerModal(false);
  };

  const handleNavigateToAssignedSeat = () => {
    // Find the section location corresponding to assigned seat
    const seatLoc =
      locations.find((l) => l.name.toLowerCase().includes(fanProfile.section.toLowerCase().split(' ')[0])) ||
      locations.find((l) => l.category === 'section') ||
      locations[0];

    setSelectedMapLocationId(seatLoc.id);
    setMapRouteDestinationId(seatLoc.id);
  };

  const getPinColor = (loc: VenueLocation, isSelected: boolean, isOrigin: boolean) => {
    if (isSelected) return '#84CC16'; // Electric lime
    if (isOrigin) return '#38BDF8'; // Sky blue for fan's current location
    switch (loc.category) {
      case 'first_aid':
        return '#EF4444';
      case 'food':
        return '#F59E0B';
      case 'washroom':
        return '#60A5FA';
      case 'exit':
        return '#10B981';
      case 'gate':
        return '#A78BFA';
      case 'parking':
        return '#F472B6';
      case 'water':
        return '#06B6D4';
      default:
        return '#94A3B8';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. IPL Cricket Stadium Selector Bar */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1E293B]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#84CC16]/10 border border-[#84CC16]/30 flex items-center justify-center shrink-0">
              <Compass className="w-5 h-5 text-[#84CC16]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#84CC16]/15 text-[#84CC16]">
                  TATA IPL 2026 Seating Map
                </span>
                <span className="text-xs text-[#94A3B8]">· {activeStadium.franchise}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white font-display mt-0.5">
                {activeStadium.name}
              </h1>
            </div>
          </div>

          {/* Quick Seat & Navigation Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowSeatAssignerModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#84CC16] hover:bg-[#A3E635] text-[#0B1120] transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-[#84CC16]/10"
            >
              <Ticket className="w-4 h-4" />
              <span>Assign & Change Seat Number</span>
            </button>

            <button
              onClick={handleNavigateToAssignedSeat}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#0B1120] hover:bg-[#1E293B] border border-[#1E293B] text-white transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Navigation className="w-4 h-4 text-[#84CC16]" />
              <span>Route to My Seat ({fanProfile.seat.split(' (')[0]})</span>
            </button>
          </div>
        </div>

        {/* Stadium Switching Pills */}
        <div className="pt-3">
          <div className="flex items-center justify-between text-xs text-[#94A3B8] mb-2 font-medium">
            <span>Select IPL Cricket Stadium to view official Seating Map & Navigation:</span>
            <span className="text-[#84CC16]">{iplStadiums.length} Premier Grounds</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {iplStadiums.map((std) => {
              const isActive = std.id === activeStadiumId;
              return (
                <button
                  key={std.id}
                  onClick={() => selectStadium(std.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-2.5 border ${
                    isActive
                      ? 'bg-[#1E293B] border-[#84CC16] text-white shadow-md'
                      : 'bg-[#0B1120] border-[#1E293B] text-[#94A3B8] hover:text-white hover:border-[#334155]'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: std.franchiseThemeColor }}
                  />
                  <div className="text-left">
                    <span className="block leading-none">{std.name}</span>
                    <span className="text-[10px] text-[#64748B] block mt-0.5">
                      {std.franchiseShort} · {std.capacity.toLocaleString()} seats
                    </span>
                  </div>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#84CC16] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Top Filter & Starting Point Bar */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#94A3B8]">
            <span className="text-white font-medium">Match:</span>
            <span className="text-[#84CC16] font-semibold">{activeStadium.activeMatch.title}</span>
            <span aria-hidden="true">·</span>
            <span>{activeStadium.city}</span>
            <span aria-hidden="true">·</span>
            <span>Capacity: {activeStadium.capacity.toLocaleString()}</span>
          </div>

          {/* Starting Point Selector + Accessible Route Toggle */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-[#0B1120] border border-[#1E293B] rounded-xl px-3 py-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span className="text-xs text-[#94A3B8]">Starting From:</span>
              <select
                aria-label="Select Your Starting Location"
                value={fanProfile.currentLocationId}
                onChange={(e) => updateFanProfile({ currentLocationId: e.target.value })}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer max-w-[180px] truncate"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id} className="bg-[#111827] text-white">
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                const nextVal = !fanProfile.preferAccessibleRoutes;
                updateFanProfile({ preferAccessibleRoutes: nextVal });
                setAccessibleOnly(nextVal);
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                fanProfile.preferAccessibleRoutes
                  ? 'bg-[#84CC16]/15 border-[#84CC16] text-[#84CC16]'
                  : 'bg-[#0B1120] border-[#1E293B] text-[#94A3B8] hover:text-white'
              }`}
            >
              <Accessibility className="w-3.5 h-3.5" />
              <span>Step-Free Accessible Route</span>
            </button>
          </div>
        </div>

        {/* Search & Category Filter Buttons */}
        <div className="flex flex-col md:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stands, turnstile gates, kiosks, restrooms, first aid, water..."
              className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-[#64748B] focus:border-[#84CC16] focus:outline-none"
            />
          </form>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
            {CATEGORY_FILTERS.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-[#84CC16] text-[#0B1120] font-semibold'
                    : 'bg-[#0B1120] text-[#94A3B8] hover:text-white border border-[#1E293B]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Main Split: Interactive Cricket Arena Seating SVG (7 Cols) + Wayfinding & Seat Details (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Interactive SVG Cricket Stadium Seating Map */}
        <div className="lg:col-span-7 bg-[#111827] border border-[#1E293B] rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#94A3B8]">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8] inline-block" />
                <span>You ({userOrigin.name.split(' (')[0]})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#84CC16] animate-pulse inline-block" />
                <span>Your Seat ({fanProfile.seat.split(' (')[0]})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-[#84CC16] inline-block" />
                <span>Active Route</span>
              </span>
            </div>
            <span className="font-mono-tabular text-[11px] text-[#64748B]">
              Tip: Click any Stand polygon on map to assign seat
            </span>
          </div>

          {/* SVG Map Container */}
          <div className="relative w-full aspect-[10/7] bg-[#070D18] border border-[#1E293B] rounded-xl overflow-hidden shadow-inner">
            <svg
              viewBox="0 0 1000 700"
              className="w-full h-full select-none"
              role="img"
              aria-label={`${activeStadium.name} Interactive Seating Map`}
            >
              <defs>
                <radialGradient id="pitchGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#1E3A2F" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#0B1B14" stopOpacity="0.2" />
                </radialGradient>
                <linearGradient id="pitchStrip" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#C4A47C" />
                  <stop offset="50%" stopColor="#DFBF9B" />
                  <stop offset="100%" stopColor="#B89467" />
                </linearGradient>
              </defs>

              {/* Outer Stadium Plaza & Boundary */}
              <rect
                x="15"
                y="15"
                width="970"
                height="670"
                rx="48"
                fill="#070D18"
                stroke="#1E293B"
                strokeWidth="2"
              />

              {/* Concourse Outer Ring */}
              <ellipse
                cx="500"
                cy="350"
                rx="430"
                ry="300"
                fill="#0B1120"
                stroke="#1E293B"
                strokeWidth="3"
              />

              {/* ----------------- INTERACTIVE STANDS POLYGONS / ARCS ----------------- */}
              {activeStadium.stands.map((stand) => {
                const isStandActive =
                  fanProfile.section.toLowerCase().includes(stand.name.toLowerCase().split(' ')[0]) ||
                  selectedLocation.name.toLowerCase().includes(stand.name.toLowerCase().split(' ')[0]);

                return (
                  <g
                    key={stand.id}
                    onClick={() => handleSelectStandFromMap(stand)}
                    className="cursor-pointer group"
                  >
                    <path
                      d={stand.pathData}
                      fill={isStandActive ? activeStadium.accentColor : stand.color}
                      fillOpacity={isStandActive ? 0.35 : 0.16}
                      stroke={isStandActive ? '#84CC16' : stand.color}
                      strokeWidth={isStandActive ? 3 : 1.5}
                      strokeDasharray={isStandActive ? 'none' : '4 2'}
                      className="transition-all duration-200 group-hover:fill-opacity-40"
                    />
                    {/* Stand Label */}
                    <text
                      x={stand.labelX}
                      y={stand.labelY}
                      textAnchor="middle"
                      fill={isStandActive ? '#84CC16' : '#E2E8F0'}
                      fontSize="11"
                      fontWeight="700"
                      letterSpacing="0.5"
                      className="pointer-events-none drop-shadow"
                    >
                      {stand.name}
                    </text>
                    <text
                      x={stand.labelX}
                      y={stand.labelY + 13}
                      textAnchor="middle"
                      fill="#94A3B8"
                      fontSize="9"
                      fontWeight="500"
                      className="pointer-events-none"
                    >
                      {stand.rowRange}
                    </text>
                  </g>
                );
              })}

              {/* Seating Bowl Inner Perimeter */}
              <ellipse
                cx="500"
                cy="350"
                rx="290"
                ry="195"
                fill="#0D1F18"
                stroke="#1E3A2F"
                strokeWidth="2"
              />

              {/* Cricket Boundary Rope (Oval) */}
              <ellipse
                cx="500"
                cy="350"
                rx="250"
                ry="170"
                fill="#0A2419"
                stroke="#F8FAFC"
                strokeWidth="2"
                strokeDasharray="8 4"
              />

              {/* 30-Yard Fielding Inner Circle */}
              <ellipse
                cx="500"
                cy="350"
                rx="140"
                ry="95"
                fill="#0F2E20"
                stroke="#22C55E"
                strokeWidth="1.5"
                strokeDasharray="5 5"
                strokeOpacity="0.6"
              />

              {/* Center Cricket Pitch Strip (22 Yards) */}
              <rect
                x="485"
                y="305"
                width="30"
                height="90"
                rx="3"
                fill="url(#pitchStrip)"
                stroke="#84CC16"
                strokeWidth="1"
              />

              {/* Pitch Bowling & Popping Crease Lines */}
              {/* North Crease */}
              <line x1="480" y1="318" x2="520" y2="318" stroke="#FFFFFF" strokeWidth="1.5" />
              {/* North Stumps (3 timber dots) */}
              <circle cx="496" cy="315" r="1.5" fill="#582F0E" />
              <circle cx="500" cy="315" r="1.5" fill="#582F0E" />
              <circle cx="504" cy="315" r="1.5" fill="#582F0E" />

              {/* South Crease */}
              <line x1="480" y1="382" x2="520" y2="382" stroke="#FFFFFF" strokeWidth="1.5" />
              {/* South Stumps (3 timber dots) */}
              <circle cx="496" cy="385" r="1.5" fill="#582F0E" />
              <circle cx="500" cy="385" r="1.5" fill="#582F0E" />
              <circle cx="504" cy="385" r="1.5" fill="#582F0E" />

              {/* Team Dugout Shelters on Boundary Rope */}
              <g transform="translate(420, 520)">
                <rect x="0" y="0" width="60" height="14" rx="4" fill="#004BA0" stroke="#FFFFFF" strokeWidth="1" />
                <text x="30" y="10" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="700">
                  DUGOUT A
                </text>
              </g>
              <g transform="translate(520, 520)">
                <rect x="0" y="0" width="60" height="14" rx="4" fill="#FDB913" stroke="#000000" strokeWidth="1" />
                <text x="30" y="10" textAnchor="middle" fill="#000000" fontSize="8" fontWeight="700">
                  DUGOUT B
                </text>
              </g>

              {/* Sight Screens North & South */}
              <rect x="470" y="170" width="60" height="8" rx="2" fill="#FFFFFF" stroke="#334155" strokeWidth="1" />
              <rect x="470" y="522" width="60" height="8" rx="2" fill="#FFFFFF" stroke="#334155" strokeWidth="1" />

              {/* Cardinal Gate / Concourse Direction Markers */}
              <text x="500" y="42" textAnchor="middle" fill="#64748B" fontSize="11" fontWeight="700">
                NORTH PAVILION & MAIN TURNSTILES
              </text>
              <text x="500" y="675" textAnchor="middle" fill="#64748B" fontSize="11" fontWeight="700">
                SOUTH ESPLANADE & VIP ENTRANCE
              </text>
              <text
                x="970"
                y="350"
                textAnchor="middle"
                fill="#64748B"
                fontSize="11"
                fontWeight="700"
                transform="rotate(90, 970, 350)"
              >
                EAST METRO & HIGHWAY LINK
              </text>
              <text
                x="32"
                y="350"
                textAnchor="middle"
                fill="#64748B"
                fontSize="11"
                fontWeight="700"
                transform="rotate(-90, 32, 350)"
              >
                WEST TERRACE PROMENADE
              </text>

              {/* Concourse Walkway Routing Graph Lines */}
              {locations.map((loc) =>
                loc.connectedTo.map((targetId) => {
                  const target = locations.find((l) => l.id === targetId);
                  if (!target || loc.id > target.id) return null;
                  return (
                    <line
                      key={`${loc.id}-${target.id}`}
                      x1={loc.x}
                      y1={loc.y}
                      x2={target.x}
                      y2={target.y}
                      stroke="#1E293B"
                      strokeWidth="2"
                    />
                  );
                })
              )}

              {/* Active Calculated Route Polyline (Walking Path) */}
              {activeRoute && activeRoute.pathIds.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#84CC16"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="10 6"
                  points={activeRoute.pathIds
                    .map((id) => {
                      const pt = locations.find((l) => l.id === id);
                      return pt ? `${pt.x},${pt.y}` : '';
                    })
                    .filter(Boolean)
                    .join(' ')}
                />
              )}

              {/* Interactive Location Nodes */}
              {filteredLocations.map((loc) => {
                const isSelected = loc.id === selectedLocation.id;
                const isOrigin = loc.id === userOrigin.id;
                const pinColor = getPinColor(loc, isSelected, isOrigin);
                const pred = queuePredictions[loc.id];

                return (
                  <g
                    key={loc.id}
                    onClick={() => {
                      setSelectedMapLocationId(loc.id);
                      setMapRouteDestinationId(loc.id);
                    }}
                    className="cursor-pointer group"
                  >
                    {/* Outer Radiating Highlight for Selected or Origin */}
                    {(isSelected || isOrigin) && (
                      <circle
                        cx={loc.x}
                        cy={loc.y}
                        r={22}
                        fill={pinColor}
                        fillOpacity="0.25"
                        stroke={pinColor}
                        strokeWidth="1.5"
                      />
                    )}

                    {/* Node Circle */}
                    <circle
                      cx={loc.x}
                      cy={loc.y}
                      r={isSelected ? 11 : 8.5}
                      fill={pinColor}
                      stroke="#070D18"
                      strokeWidth="2.5"
                    />

                    {/* Compact Label Box */}
                    <g transform={`translate(${loc.x}, ${loc.y + 22})`}>
                      <rect
                        x="-68"
                        y="-10"
                        width="136"
                        height="20"
                        rx="5"
                        fill={isSelected ? '#84CC16' : '#0B1120'}
                        fillOpacity="0.94"
                        stroke={isSelected ? '#84CC16' : '#1E293B'}
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="3.5"
                        textAnchor="middle"
                        fill={isSelected ? '#0B1120' : '#F8FAFC'}
                        fontSize="10"
                        fontWeight={isSelected ? '700' : '500'}
                      >
                        {loc.name.split(' (')[0].slice(0, 21)}
                      </text>
                    </g>

                    {/* Wait Time Indicator for Food/Washrooms */}
                    {(loc.category === 'food' || loc.category === 'washroom') && pred && (
                      <g transform={`translate(${loc.x + 14}, ${loc.y - 12})`}>
                        <rect
                          x="0"
                          y="-9"
                          width="34"
                          height="15"
                          rx="4"
                          fill="#111827"
                          stroke="#334155"
                          strokeWidth="1"
                        />
                        <text
                          x="17"
                          y="1.5"
                          textAnchor="middle"
                          fill={
                            pred.status === 'Low'
                              ? '#22C55E'
                              : pred.status === 'Moderate'
                              ? '#F59E0B'
                              : '#EF4444'
                          }
                          fontSize="9"
                          fontWeight="700"
                        >
                          ~{pred.estimatedWaitMinutes}m
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Right 5 Cols: Selected Location Details, Seat Assignment Card & Route Directions */}
        <div className="lg:col-span-5 space-y-5">
          {/* Fan's Assigned Seat & Quick Navigator Card */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-[#84CC16]" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Your Match Pass & Assigned Seat
                </span>
              </div>
              <button
                onClick={() => setShowSeatAssignerModal(true)}
                className="text-xs font-semibold text-[#84CC16] hover:underline cursor-pointer"
              >
                Change Seat →
              </button>
            </div>

            <div className="mt-3.5 flex items-center justify-between gap-3">
              <div>
                <span className="text-[11px] text-[#94A3B8]">Assigned Stand:</span>
                <h3 className="text-base font-bold text-white font-display">
                  {fanProfile.section}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-[#CBD5E1]">
                  <span className="px-2 py-0.5 rounded bg-[#0B1120] border border-[#1E293B] text-[#84CC16] font-semibold">
                    {fanProfile.row}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#0B1120] border border-[#1E293B] text-white font-bold">
                    {fanProfile.seat}
                  </span>
                  <span className="text-[#94A3B8]">via {fanProfile.gate}</span>
                </div>
              </div>

              <button
                onClick={handleNavigateToAssignedSeat}
                className="p-3 rounded-xl bg-[#84CC16] hover:bg-[#A3E635] text-[#0B1120] transition-colors shrink-0 cursor-pointer shadow-lg shadow-[#84CC16]/10"
                title="Plot walking route to your seat"
              >
                <Navigation className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Selected Location / Stand Details & Queue Status */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                  <span className="uppercase tracking-wider text-[#84CC16] font-semibold">
                    {selectedLocation.category.replace('_', ' ')}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedLocation.level}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedLocation.zone} Zone</span>
                </div>
                <h2 className="text-xl font-bold text-white font-display mt-1">
                  {selectedLocation.name}
                </h2>
              </div>

              {selectedLocation.accessible ? (
                <span
                  className="text-xs text-[#84CC16] flex items-center gap-1 shrink-0"
                  title="Wheelchair & Step-Free Accessible"
                >
                  <Accessibility className="w-4 h-4" />
                  <span>Accessible</span>
                </span>
              ) : (
                <span className="text-xs text-[#F59E0B] flex items-center gap-1 shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Stairs Only</span>
                </span>
              )}
            </div>

            <p className="text-xs text-[#CBD5E1] mt-2.5 leading-relaxed">
              {selectedLocation.description}
            </p>

            {/* Queue Prediction Box */}
            {selectedPrediction && (
              <div className="mt-4 bg-[#0B1120] border border-[#1E293B] rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#94A3B8]">Estimated Concourse Wait</span>
                  <span className="text-sm font-bold text-white font-mono-tabular">
                    {selectedPrediction.minWaitMinutes}–{selectedPrediction.maxWaitMinutes} mins (~
                    {selectedPrediction.estimatedWaitMinutes}m)
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#94A3B8]">Throughput & Status</span>
                  <span
                    className={
                      selectedPrediction.status === 'Low'
                        ? 'text-[#22C55E] font-semibold'
                        : selectedPrediction.status === 'Moderate'
                        ? 'text-[#F59E0B] font-semibold'
                        : 'text-[#EF4444] font-semibold'
                    }
                  >
                    {selectedPrediction.status} ({selectedLocation.openCounters} active counters ·{' '}
                    {selectedLocation.observedQueueLength} fans waiting)
                  </span>
                </div>
                <div className="pt-2 border-t border-[#1E293B] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#64748B]">
                  <span>{selectedPrediction.confidenceLabel}</span>
                  <span>Updated: {selectedLocation.lastUpdated}</span>
                </div>

                {selectedPrediction.alternativeFacility && (
                  <div className="pt-2 border-t border-[#1E293B] flex items-center justify-between gap-2">
                    <span className="text-xs text-[#84CC16]">
                      Faster Alternative: {selectedPrediction.alternativeFacility.name} (~
                      {selectedPrediction.alternativeFacility.estimatedWaitMinutes}m wait)
                    </span>
                    <button
                      onClick={() => {
                        setSelectedMapLocationId(selectedPrediction.alternativeFacility!.id);
                        setMapRouteDestinationId(selectedPrediction.alternativeFacility!.id);
                      }}
                      className="text-xs font-semibold text-white hover:text-[#84CC16] underline shrink-0 cursor-pointer"
                    >
                      Switch
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Turn-by-Turn Route Directions */}
            {activeRoute && (
              <div className="mt-5 pt-4 border-t border-[#1E293B]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-[#84CC16]" />
                    <h3 className="text-sm font-bold text-white font-display">
                      Suggested Walking Directions
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono-tabular text-[#84CC16]">
                    <Footprints className="w-3.5 h-3.5" />
                    <span>
                      {activeRoute.distanceMeters}m · ~{activeRoute.walkingMinutes} min walk
                    </span>
                  </div>
                </div>

                <ol className="space-y-2 text-xs text-[#CBD5E1]">
                  {activeRoute.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="font-mono-tabular text-[#84CC16] font-bold shrink-0">
                        0{i + 1}.
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>

                <div className="mt-3 flex items-center gap-2 text-[11px] text-[#94A3B8]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#84CC16]" />
                  <span>
                    {activeRoute.isAccessibleRoute
                      ? 'Step-free route verified across all concourse corridors.'
                      : 'Standard walking path (Toggle Step-Free to avoid stairways).'}
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-5 pt-4 border-t border-[#1E293B] flex flex-wrap gap-2.5">
              {selectedLocation.category === 'section' && (
                <button
                  onClick={() => {
                    const matchStand = activeStadium.stands.find((s) =>
                      selectedLocation.name.toLowerCase().includes(s.name.toLowerCase().split(' ')[0])
                    );
                    if (matchStand) {
                      setAssignStandId(matchStand.id);
                    }
                    setShowSeatAssignerModal(true);
                  }}
                  className="flex-1 py-2 px-3 bg-[#84CC16] hover:bg-[#A3E635] text-[#0B1120] font-semibold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Assign Seat in this Stand</span>
                </button>
              )}

              {selectedLocation.category === 'food' && (
                <button
                  onClick={() => setFanTab('food')}
                  className="flex-1 py-2 px-3 bg-[#84CC16] hover:bg-[#A3E635] text-[#0B1120] font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  View Stall Menu & Order
                </button>
              )}

              <button
                onClick={() =>
                  askConciergeQuestion(
                    `Tell me about ${selectedLocation.name} at ${activeStadium.name} and how to get there from ${userOrigin.name}.`
                  )
                }
                className="flex-1 py-2 px-3 bg-[#0B1120] hover:bg-[#1E293B] text-white border border-[#1E293B] font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#84CC16]" />
                <span>Ask AI About This Spot</span>
              </button>

              <button
                onClick={() => updateFanProfile({ currentLocationId: selectedLocation.id })}
                className="py-2 px-3 bg-[#0B1120] hover:bg-[#1E293B] text-[#38BDF8] border border-[#1E293B] font-medium text-xs rounded-xl transition-colors cursor-pointer"
              >
                Set as My Location
              </button>
            </div>
          </div>

          {/* Nearby Facilities Card */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white font-display mb-3">
              Nearby Facilities from {selectedLocation.name.split(' (')[0]}
            </h3>
            <div className="divide-y divide-[#1E293B]">
              {nearbyFacilities.map(({ loc, dist, pred }) => (
                <div
                  key={loc.id}
                  className="py-2.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <button
                      onClick={() => {
                        setSelectedMapLocationId(loc.id);
                        setMapRouteDestinationId(loc.id);
                      }}
                      className="font-medium text-white hover:text-[#84CC16] truncate block cursor-pointer"
                    >
                      {loc.name}
                    </button>
                    <div className="text-[#94A3B8] mt-0.5 flex items-center gap-2">
                      <span className="font-mono-tabular">{dist}m away</span>
                      <span aria-hidden="true">·</span>
                      <span>Wait: ~{pred?.estimatedWaitMinutes || 1}m</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedMapLocationId(loc.id);
                      setMapRouteDestinationId(loc.id);
                    }}
                    className="px-2.5 py-1 bg-[#0B1120] hover:bg-[#1E293B] border border-[#1E293B] rounded-lg text-white shrink-0 cursor-pointer"
                  >
                    Select
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Dedicated Seat Assigner Modal */}
      {showSeatAssignerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
              <div className="flex items-center gap-2.5">
                <Ticket className="w-5 h-5 text-[#84CC16]" />
                <div>
                  <h2 className="text-lg font-bold text-white font-display">
                    Assign Your Match-Day Seat
                  </h2>
                  <p className="text-xs text-[#94A3B8]">{activeStadium.name} Seating Map</p>
                </div>
              </div>
              <button
                onClick={() => setShowSeatAssignerModal(false)}
                className="text-[#94A3B8] hover:text-white p-1 text-sm font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplySeatAssignment} className="space-y-4">
              {/* Stand Selection */}
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
                  Select Stand / Bowl Section
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {activeStadium.stands.map((st) => (
                    <button
                      type="button"
                      key={st.id}
                      onClick={() => {
                        setAssignStandId(st.id);
                        setAssignTier(st.tierLevels[0] || 'Lower Bowl');
                      }}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-colors cursor-pointer ${
                        assignStandId === st.id
                          ? 'bg-[#84CC16]/15 border-[#84CC16] text-white'
                          : 'bg-[#0B1120] border-[#1E293B] text-[#94A3B8] hover:text-white'
                      }`}
                    >
                      <span className="font-bold block text-white">{st.name}</span>
                      <span className="text-[10px] text-[#64748B] block mt-0.5">
                        {st.zone} Zone · {st.rowRange}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tier Selection */}
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
                  Seating Tier / Level
                </label>
                <select
                  value={assignTier}
                  onChange={(e) => setAssignTier(e.target.value)}
                  className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#84CC16] focus:outline-none"
                >
                  {selectedStand.tierLevels.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

              {/* Row & Seat Number */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
                    Row Identifier
                  </label>
                  <select
                    value={assignRow}
                    onChange={(e) => setAssignRow(e.target.value)}
                    className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#84CC16] focus:outline-none"
                  >
                    {['Row A', 'Row B', 'Row C', 'Row D', 'Row E', 'Row F', 'Row G', 'Row H', 'Row K', 'Row L', 'Row M', 'Row N'].map(
                      (r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
                    Seat Number (1–{selectedStand.seatsPerRow})
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedStand.seatsPerRow}
                    value={assignSeatNum}
                    onChange={(e) => setAssignSeatNum(e.target.value)}
                    className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#84CC16] focus:outline-none font-mono-tabular"
                  />
                </div>
              </div>

              {/* Interactive Mini Seat Row Picker */}
              <div className="pt-2">
                <span className="block text-[11px] text-[#94A3B8] mb-1.5">
                  Quick Seat Selector for {assignRow}:
                </span>
                <div className="grid grid-cols-10 gap-1 bg-[#0B1120] p-2 rounded-xl border border-[#1E293B]">
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => {
                    const isPicked = String(n) === String(parseInt(assignSeatNum, 10));
                    return (
                      <button
                        type="button"
                        key={n}
                        onClick={() => setAssignSeatNum(String(n))}
                        className={`h-7 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                          isPicked
                            ? 'bg-[#84CC16] text-[#0B1120]'
                            : 'bg-[#111827] text-[#94A3B8] hover:text-white hover:bg-[#1E293B]'
                        }`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setShowSeatAssignerModal(false)}
                  className="px-4 py-2 text-xs font-medium text-[#94A3B8] hover:text-white bg-[#0B1120] border border-[#1E293B] rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-[#0B1120] bg-[#84CC16] hover:bg-[#A3E635] rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Assign Seat & Show on Map</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
