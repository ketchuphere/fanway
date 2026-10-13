import React, { useState } from 'react';
import { X, Ticket, Accessibility, Check } from 'lucide-react';
import { useStadium } from '../context/StadiumContext';

export const SeatSetupModal: React.FC = () => {
  const {
    showSetupModal,
    setShowSetupModal,
    events,
    fanProfile,
    updateFanProfile,
    locations,
  } = useStadium();

  const [selectedEventId, setSelectedEventId] = useState(fanProfile.selectedEventId);
  const [gate, setGate] = useState(fanProfile.gate);
  const [sectionLocId, setSectionLocId] = useState(fanProfile.currentLocationId);
  const [row, setRow] = useState(fanProfile.row);
  const [seat, setSeat] = useState(fanProfile.seat);
  const [preferAccessible, setPreferAccessible] = useState(fanProfile.preferAccessibleRoutes);
  const [dietary, setDietary] = useState<'All' | 'Veg Only'>(fanProfile.dietaryPreference);

  if (!showSetupModal) return null;

  const sectionLocations = locations.filter((l) => l.category === 'section');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const chosenSec = sectionLocations.find((s) => s.id === sectionLocId);
    const sectionLabel = chosenSec ? chosenSec.name.split(' (')[0] : fanProfile.section;

    updateFanProfile({
      selectedEventId,
      currentLocationId: sectionLocId,
      gate,
      section: sectionLabel,
      row,
      seat,
      preferAccessibleRoutes: preferAccessible,
      dietaryPreference: dietary,
      hasCompletedOnboarding: true,
    });
    setShowSetupModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#1E293B]">
          <div className="flex items-center gap-2.5">
            <Ticket className="w-5 h-5 text-[#84CC16]" />
            <h2 className="text-lg font-bold text-white font-display">
              Match-Day Ticket & Seat Setup
            </h2>
          </div>
          <button
            onClick={() => setShowSetupModal(false)}
            className="p-2 text-[#94A3B8] hover:text-white rounded-lg cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-5 space-y-4">
          {/* Event Selection */}
          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
              Select Demo Sporting Event (Metro Sports Arena)
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-[#84CC16] focus:outline-none"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  [{ev.sport.toUpperCase()}] {ev.title} — {ev.startTime}
                </option>
              ))}
            </select>
          </div>

          {/* Entry Gate & Seating Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                Entry Gate
              </label>
              <select
                value={gate}
                onChange={(e) => setGate(e.target.value)}
                className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-[#84CC16] focus:outline-none"
              >
                <option value="Gate A">Gate A (North Main)</option>
                <option value="Gate B">Gate B (East Metro Link)</option>
                <option value="Gate C">Gate C (South Pavilion)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                Seating Section (Starting Point)
              </label>
              <select
                value={sectionLocId}
                onChange={(e) => setSectionLocId(e.target.value)}
                className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-[#84CC16] focus:outline-none"
              >
                {sectionLocations.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row & Seat */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                Row Number
              </label>
              <input
                type="text"
                value={row}
                onChange={(e) => setRow(e.target.value)}
                placeholder="e.g. Row E"
                className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-3.5 py-2 text-sm text-white focus:border-[#84CC16] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                Seat Number
              </label>
              <input
                type="text"
                value={seat}
                onChange={(e) => setSeat(e.target.value)}
                placeholder="e.g. Seat 12"
                className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-3.5 py-2 text-sm text-white focus:border-[#84CC16] focus:outline-none"
              />
            </div>
          </div>

          {/* Dietary & Accessibility Preferences */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                Food Preference
              </label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-[#0B1120] border border-[#1E293B] rounded-xl">
                {(['All', 'Veg Only'] as const).map((opt) => (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => setDietary(opt)}
                    className={`py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                      dietary === opt
                        ? 'bg-[#84CC16] text-[#0B1120] font-semibold'
                        : 'text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                Route Accessibility
              </label>
              <button
                type="button"
                onClick={() => setPreferAccessible(!preferAccessible)}
                className={`w-full py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                  preferAccessible
                    ? 'bg-[#84CC16]/15 border-[#84CC16] text-[#84CC16]'
                    : 'bg-[#0B1120] border-[#1E293B] text-[#94A3B8]'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Accessibility className="w-4 h-4" />
                  <span>Step-Free / Elevator</span>
                </span>
                {preferAccessible && <Check className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-[#1E293B] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowSetupModal(false)}
              className="px-4 py-2 text-xs font-medium text-[#94A3B8] hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-semibold bg-[#84CC16] hover:bg-[#A3E635] text-[#0B1120] rounded-xl transition-colors cursor-pointer"
            >
              Save Match-Day Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
