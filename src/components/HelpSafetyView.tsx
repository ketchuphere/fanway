import React, { useState } from 'react';
import {
  ShieldAlert,
  PhoneCall,
  HeartPulse,
  Footprints,
  Accessibility,
  UserCheck,
  MessageSquarePlus,
  CheckCircle2,
  MapPin,
} from 'lucide-react';
import { useStadium } from '../context/StadiumContext';
import { TRANSLATIONS } from '../utils/i18n';
import { FanReport } from '../types/stadium';
import stadiumControlOpsImg from '../assets/images/stadium_control_ops_1791698103620.jpg';

export const HelpSafetyView: React.FC = () => {
  const {
    venueConfig,
    locations,
    fanProfile,
    language,
    submitFanReport,
    navigateToMapLocation,
  } = useStadium();

  const t = TRANSLATIONS[language];

  // Staff Assistance Form State
  const [assistLocationId, setAssistLocationId] = useState(fanProfile.currentLocationId);
  const [assistType, setAssistType] = useState(
    'Wheelchair / Step-Free Escort'
  );
  const [assistNotes, setAssistNotes] = useState('');
  const [assistSubmitted, setAssistSubmitted] = useState<string | null>(null);

  // Issue / Lost & Found Report State
  const [reportCategory, setReportCategory] =
    useState<FanReport['category']>('Cleanliness');
  const [reportLocationId, setReportLocationId] = useState('wash-w1');
  const [reportDescription, setReportDescription] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState<string | null>(null);

  const firstAidLocations = locations.filter((l) => l.category === 'first_aid');
  const exitLocations = locations.filter((l) => l.category === 'exit' || l.category === 'gate');
  const accessibleLocations = locations.filter((l) => l.accessible);

  const handleAssistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const loc = locations.find((l) => l.id === assistLocationId) || locations[0];
    const created = submitFanReport({
      category: 'Accessibility',
      locationId: loc.id,
      locationName: loc.name,
      description: `[Steward Assistance: ${assistType}] ${
        assistNotes.trim() || 'Requested immediate steward assistance at seat/section.'
      }`,
      seatInfo: `${fanProfile.section} · ${fanProfile.row} · ${fanProfile.seat}`,
      priority: 'High',
      isStaffAssistanceRequest: true,
    });
    setAssistSubmitted(
      `Steward request ${created.id} logged for ${loc.name}. A venue operator has been notified.`
    );
    setAssistNotes('');
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDescription.trim()) return;
    const loc = locations.find((l) => l.id === reportLocationId) || locations[0];
    const created = submitFanReport({
      category: reportCategory,
      locationId: loc.id,
      locationName: loc.name,
      description: reportDescription.trim(),
      seatInfo: `${fanProfile.section} · ${fanProfile.row} · ${fanProfile.seat}`,
      priority: reportCategory === 'Safety & Medical' ? 'Urgent' : 'Normal',
    });
    setReportSubmitted(
      `Report ${created.id} (${reportCategory}) submitted to Venue Operations.`
    );
    setReportDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Direct Emergency & Medical Dispatch Banner (Never relies solely on AI chatbot) */}
      <div className="bg-[#111827] border border-[#EF4444]/60 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#EF4444]">
              <ShieldAlert className="w-4 h-4" />
              <span>{t.emergencyBannerTitle} (Configured by Venue Admin)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white font-display">
              Direct Emergency Helpline: {venueConfig.emergencyPhone}
            </h1>
            <p className="text-xs text-[#CBD5E1] max-w-3xl leading-relaxed">
              {venueConfig.medicalDispatchNote}
            </p>
            <div className="pt-1 flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigateToMapLocation(firstAidLocations[0]?.id || 'aid-n1', true)}
                className="px-4 py-2.5 bg-[#EF4444] hover:bg-[#DC2626] text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-[#EF4444]/20"
              >
                <HeartPulse className="w-4 h-4" />
                <span>Route to Nearest Paramedic Station</span>
              </button>
            </div>
          </div>

          {/* Arena Control Center & Paramedic Dispatch Visual Reference */}
          <div className="w-full lg:w-72 shrink-0 bg-[#0B1120] border border-[#1E293B] rounded-xl overflow-hidden p-2.5 flex items-center gap-3">
            <img
              src={stadiumControlOpsImg}
              alt="Arena Operations & Safety Control"
              className="w-24 h-16 object-cover rounded-lg shrink-0 border border-[#1E293B]"
            />
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#EF4444] block">
                Arena Control Post
              </span>
              <p className="text-xs font-semibold text-white truncate">
                Central Operations Desk
              </p>
              <p className="text-[10px] text-[#94A3B8] mt-0.5">
                On-duty stewards & medical team
              </p>
            </div>
          </div>
        </div>

        {/* Official Assembly Points */}
        <div className="pt-4 border-t border-[#1E293B] grid grid-cols-1 md:grid-cols-3 gap-3">
          {venueConfig.assemblyPoints.map((pt, idx) => (
            <div
              key={idx}
              className="bg-[#0B1120] border border-[#1E293B] rounded-xl p-3 text-xs"
            >
              <div className="text-[#94A3B8] font-mono-tabular">
                Official Assembly Zone 0{idx + 1}
              </div>
              <div className="text-white font-medium mt-0.5">{pt}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Verified First-Aid Stations, Exits & Accessible Facilities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* First Aid Stations */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white font-display">
            <HeartPulse className="w-4 h-4 text-[#EF4444]" />
            <span>First-Aid & Medical Posts (Demo)</span>
          </div>
          <div className="divide-y divide-[#1E293B]">
            {firstAidLocations.map((loc) => (
              <div key={loc.id} className="py-3 space-y-1.5">
                <div className="text-xs font-semibold text-white">{loc.name}</div>
                <p className="text-xs text-[#94A3B8]">{loc.description}</p>
                <button
                  onClick={() => navigateToMapLocation(loc.id, true)}
                  className="text-xs font-semibold text-[#84CC16] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <MapPin className="w-3 h-3" />
                  <span>View Directions on Map</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Exits & Egress Gates */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white font-display">
            <Footprints className="w-4 h-4 text-[#F59E0B]" />
            <span>Emergency Exits & Egress Gates</span>
          </div>
          <div className="divide-y divide-[#1E293B]">
            {exitLocations.map((loc) => (
              <div key={loc.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                <div>
                  <div className="font-semibold text-white">{loc.name}</div>
                  <div className="text-[#94A3B8]">{loc.zone} Zone · {loc.level}</div>
                </div>
                <button
                  onClick={() => navigateToMapLocation(loc.id, true)}
                  className="px-2.5 py-1 bg-[#0B1120] hover:bg-[#1E293B] text-white border border-[#1E293B] rounded-lg shrink-0 cursor-pointer"
                >
                  Route
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Step-Free Accessible Facilities */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white font-display">
            <Accessibility className="w-4 h-4 text-[#84CC16]" />
            <span>Step-Free Accessible Facilities ({accessibleLocations.length})</span>
          </div>
          <p className="text-xs text-[#94A3B8]">
            Includes elevator-connected gates, PRM washrooms, and step-free viewing decks.
          </p>
          <div className="divide-y divide-[#1E293B] max-h-56 overflow-y-auto pr-1">
            {accessibleLocations.slice(0, 6).map((loc) => (
              <div key={loc.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                <span className="text-white truncate">{loc.name}</span>
                <button
                  onClick={() => navigateToMapLocation(loc.id, true)}
                  className="text-[#84CC16] hover:underline shrink-0 cursor-pointer"
                >
                  Map
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Interactive Forms: 1) Request Steward/Staff Assistance, 2) Report Facility Issue / Lost & Found */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form 1: Request Staff Assistance */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#84CC16]" />
            <h2 className="text-base font-bold text-white font-display">
              {t.requestStaffHelp}
            </h2>
          </div>
          <p className="text-xs text-[#94A3B8]">
            Request an official venue steward for wheelchair escort, sensory room access, or seating assistance. Updates the Venue Operator dashboard immediately.
          </p>

          {assistSubmitted && (
            <div className="p-3 bg-[#0B1120] border border-[#22C55E] rounded-xl text-xs text-[#22C55E] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{assistSubmitted}</span>
            </div>
          )}

          <form onSubmit={handleAssistSubmit} className="space-y-3">
            <div>
              <label className="block text-xs text-[#94A3B8] mb-1">
                Assistance Type
              </label>
              <select
                value={assistType}
                onChange={(e) => setAssistType(e.target.value)}
                className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#84CC16] focus:outline-none"
              >
                <option value="Wheelchair / Step-Free Escort">
                  Wheelchair / Step-Free Escort
                </option>
                <option value="First-Aid Non-Critical Escort">
                  First-Aid Non-Critical Escort
                </option>
                <option value="Sensory / Quiet Room Access">
                  Sensory / Quiet Room Access
                </option>
                <option value="Seating / Wayfinding Steward">
                  Seating / Wayfinding Steward
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-[#94A3B8] mb-1">
                Your Current Location / Pickup Node
              </label>
              <select
                value={assistLocationId}
                onChange={(e) => setAssistLocationId(e.target.value)}
                className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#84CC16] focus:outline-none"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-[#94A3B8] mb-1">
                Additional Details (Seat {fanProfile.section} · {fanProfile.row} · {fanProfile.seat})
              </label>
              <input
                type="text"
                value={assistNotes}
                onChange={(e) => setAssistNotes(e.target.value)}
                placeholder="e.g. Wearing blue jersey near Gate A elevator..."
                className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#84CC16] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#84CC16] hover:bg-[#A3E635] text-[#0B1120] font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Submit Steward Assistance Request
            </button>
          </form>
        </div>

        {/* Form 2: Report Facility Issue or Lost & Found */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="w-5 h-5 text-[#38BDF8]" />
            <h2 className="text-base font-bold text-white font-display">
              {t.reportIssue} & Lost-and-Found
            </h2>
          </div>
          <p className="text-xs text-[#94A3B8]">
            Report washroom cleanliness, long queues, lost items, or facility hazards directly to stadium operations.
          </p>

          {reportSubmitted && (
            <div className="p-3 bg-[#0B1120] border border-[#22C55E] rounded-xl text-xs text-[#22C55E] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{reportSubmitted}</span>
            </div>
          )}

          <form onSubmit={handleReportSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#94A3B8] mb-1">Category</label>
                <select
                  value={reportCategory}
                  onChange={(e) => setReportCategory(e.target.value as FanReport['category'])}
                  className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#84CC16] focus:outline-none"
                >
                  <option value="Cleanliness">Cleanliness / Housekeeping</option>
                  <option value="Long Queue">Long Queue / Bottleneck</option>
                  <option value="Lost & Found">Lost & Found Item</option>
                  <option value="Facility Issue">Facility / Water / Lighting Issue</option>
                  <option value="Accessibility">Accessibility Obstacle</option>
                  <option value="Safety & Medical">Safety / Medical Concern</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-[#94A3B8] mb-1">Facility Location</label>
                <select
                  value={reportLocationId}
                  onChange={(e) => setReportLocationId(e.target.value)}
                  className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#84CC16] focus:outline-none"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#94A3B8] mb-1">
                Issue or Lost Item Description
              </label>
              <textarea
                rows={2}
                required
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Describe what needs attention (e.g. Water dispenser empty at East Stand, or black wallet lost near Gate B)..."
                className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#84CC16] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#0B1120] hover:bg-[#1E293B] text-white border border-[#84CC16]/50 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Send Report to Venue Operations
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
