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
} from 'lucide-react';
import { useStadium } from '../context/StadiumContext';
import { LocationCategory, VenueLocation } from '../types/stadium';
import { calculateVenueRoute } from '../utils/queuePrediction';

const CATEGORY_FILTERS: { id: 'all' | LocationCategory; label: string }[] = [
  { id: 'all', label: 'All Facilities' },
  { id: 'gate', label: 'Gates' },
  { id: 'section', label: 'Sections' },
  { id: 'food', label: 'Food & Drinks' },
  { id: 'washroom', label: 'Washrooms' },
  { id: 'first_aid', label: 'First Aid' },
  { id: 'exit', label: 'Exits' },
  { id: 'parking', label: 'Pickup & Parking' },
  { id: 'water', label: 'Water' },
];

export const StadiumMapView: React.FC = () => {
  const {
    locations,
    queuePredictions,
    fanProfile,
    updateFanProfile,
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
      }
    }
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
      default:
        return '#94A3B8';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Search Bar */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white font-display">
              Interactive Venue Schematic Map — Metro Sports Arena
            </h1>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Simulated schematic map (No indoor GPS claimed — manually select your current location or seat section below)
            </p>
          </div>

          {/* Starting Point Selector + Accessible Route Toggle */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-[#0B1120] border border-[#1E293B] rounded-xl px-3 py-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span className="text-xs text-[#94A3B8]">Your Location:</span>
              <select
                aria-label="Select Your Current Location"
                value={fanProfile.currentLocationId}
                onChange={(e) => updateFanProfile({ currentLocationId: e.target.value })}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
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
              <span>Accessible Step-Free Route</span>
            </button>
          </div>
        </div>

        {/* Search & Category Buttons */}
        <div className="flex flex-col md:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Gate B, Washrooms, Counter B, First Aid, Pickup Zone..."
              className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-[#64748B] focus:border-[#84CC16] focus:outline-none"
            />
          </form>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
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

      {/* Main Split: Interactive SVG Arena Schematic (7 Cols) + Location & Route Details Panel (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Interactive SVG Schematic Map */}
        <div className="lg:col-span-7 bg-[#111827] border border-[#1E293B] rounded-2xl p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs text-[#94A3B8]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8] inline-block" />
                <span>You ({userOrigin.name.split(' (')[0]})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#84CC16] inline-block" />
                <span>Selected Destination</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-[#84CC16] inline-block" />
                <span>Walking Route</span>
              </span>
            </div>
            <span className="font-mono-tabular">
              Showing {filteredLocations.length} of {locations.length} nodes
            </span>
          </div>

          <div className="relative w-full aspect-[10/7] bg-[#0B1120] border border-[#1E293B] rounded-xl overflow-hidden">
            <svg
              viewBox="0 0 1000 700"
              className="w-full h-full select-none"
              role="img"
              aria-label="Metro Sports Arena Interactive Schematic Map"
            >
              {/* Outer Stadium Plaza & Boundary */}
              <rect x="20" y="20" width="960" height="660" rx="48" fill="#0B1120" stroke="#1E293B" strokeWidth="2" />

              {/* Outer Concourse Ring */}
              <ellipse
                cx="500"
                cy="350"
                rx="410"
                ry="280"
                fill="#111827"
                stroke="#1E293B"
                strokeWidth="3"
              />

              {/* Seating Bowl Ring */}
              <ellipse
                cx="500"
                cy="350"
                rx="300"
                ry="200"
                fill="#162032"
                stroke="#334155"
                strokeWidth="2"
                strokeDasharray="6 4"
              />

              {/* Central Playing Field / Pitch */}
              <ellipse
                cx="500"
                cy="350"
                rx="175"
                ry="115"
                fill="#0F291E"
                stroke="#22C55E"
                strokeWidth="2"
              />
              {/* Center Pitch / Court Markings */}
              <rect
                x="475"
                y="310"
                width="50"
                height="80"
                rx="4"
                fill="#143829"
                stroke="#84CC16"
                strokeWidth="1.5"
              />
              <circle
                cx="500"
                cy="350"
                r="45"
                fill="none"
                stroke="#22C55E"
                strokeOpacity="0.35"
                strokeWidth="1.5"
              />

              {/* Cardinal Zone Labels */}
              <text x="500" y="42" textAnchor="middle" fill="#64748B" fontSize="12" fontWeight="600">
                NORTH PLAZA & CONCOURSE
              </text>
              <text x="500" y="672" textAnchor="middle" fill="#64748B" fontSize="12" fontWeight="600">
                SOUTH PAVILION & PICKUP ESPLANADE
              </text>
              <text
                x="962"
                y="350"
                textAnchor="middle"
                fill="#64748B"
                fontSize="12"
                fontWeight="600"
                transform="rotate(90, 962, 350)"
              >
                EAST METRO LINK
              </text>
              <text
                x="38"
                y="350"
                textAnchor="middle"
                fill="#64748B"
                fontSize="12"
                fontWeight="600"
                transform="rotate(-90, 38, 350)"
              >
                WEST TERRACE
              </text>

              {/* Background Concourse Walkway Graph Connections */}
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

              {/* Active Calculated Route Polyline */}
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
                    {/* Outer Highlight Ring for Selected or Origin */}
                    {(isSelected || isOrigin) && (
                      <circle
                        cx={loc.x}
                        cy={loc.y}
                        r={20}
                        fill={pinColor}
                        fillOpacity="0.2"
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
                      stroke="#0B1120"
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
                        fillOpacity="0.92"
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

                    {/* Wait Time Micro Indicator for Food/Washrooms */}
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

        {/* Right 5 Cols: Selected Location Details, Queue Status & Turn-by-Turn Route */}
        <div className="lg:col-span-5 space-y-5">
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
                  <span className="text-xs text-[#94A3B8]">Estimated Queue Wait</span>
                  <span className="text-sm font-bold text-white font-mono-tabular">
                    {selectedPrediction.minWaitMinutes}–{selectedPrediction.maxWaitMinutes} mins (~
                    {selectedPrediction.estimatedWaitMinutes}m)
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#94A3B8]">Current Status & Counters</span>
                  <span
                    className={
                      selectedPrediction.status === 'Low'
                        ? 'text-[#22C55E] font-semibold'
                        : selectedPrediction.status === 'Moderate'
                        ? 'text-[#F59E0B] font-semibold'
                        : 'text-[#EF4444] font-semibold'
                    }
                  >
                    {selectedPrediction.status} ({selectedLocation.openCounters} open ·{' '}
                    {selectedLocation.observedQueueLength} in line)
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

            {/* Route Directions from Fan's Current Location */}
            {activeRoute && (
              <div className="mt-5 pt-4 border-t border-[#1E293B]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-[#84CC16]" />
                    <h3 className="text-sm font-bold text-white font-display">
                      Suggested Walking Route
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
                      ? 'Verified step-free accessible path across all waypoints.'
                      : 'Standard concourse path (Toggle Step-Free above to avoid stairs).'}
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-5 pt-4 border-t border-[#1E293B] flex flex-wrap gap-2.5">
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
                    `Tell me about ${selectedLocation.name} and how to get there from ${userOrigin.name}.`
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
    </div>
  );
};
