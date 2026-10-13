import React from 'react';
import {
  ShoppingBag,
  MessageSquareWarning,
  Ticket,
  Clock,
  CheckCircle2,
  ArrowRight,
  Utensils,
} from 'lucide-react';
import { useStadium } from '../context/StadiumContext';

export const FanActivityView: React.FC = () => {
  const {
    orders,
    advanceOrderStatus,
    fanReports,
    fanProfile,
    setShowSetupModal,
    setFanTab,
  } = useStadium();

  return (
    <div className="space-y-6">
      {/* Seat & Preferences Summary Bar */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0B1120] border border-[#1E293B] flex items-center justify-center text-[#84CC16]">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white font-display">
              My Match-Day Activity & Orders
            </h1>
            <p className="text-xs text-[#94A3B8]">
              Active Seat Pass: {fanProfile.gate} · {fanProfile.section} · {fanProfile.row} ·{' '}
              {fanProfile.seat} · Dietary: {fanProfile.dietaryPreference}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowSetupModal(true)}
          className="px-4 py-2 bg-[#0B1120] hover:bg-[#1E293B] text-white border border-[#1E293B] rounded-xl text-xs font-semibold cursor-pointer"
        >
          Update Seat / Preferences
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Simulated Food & Beverage Orders */}
        <div className="lg:col-span-7 bg-[#111827] border border-[#1E293B] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#84CC16]" />
              <h2 className="text-base font-bold text-white font-display">
                Simulated Concourse Orders ({orders.length})
              </h2>
            </div>
            <button
              onClick={() => setFanTab('food')}
              className="text-xs font-semibold text-[#84CC16] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Order Food</span>
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <ShoppingBag className="w-8 h-8 text-[#64748B] mx-auto" />
              <div className="text-sm font-semibold text-white">No simulated orders yet</div>
              <p className="text-xs text-[#94A3B8] max-w-md mx-auto">
                Head to the Food & Drinks tab to add snacks or beverages and test the simulated pre-order pickup workflow.
              </p>
              <button
                onClick={() => setFanTab('food')}
                className="px-4 py-2 bg-[#84CC16] text-[#0B1120] font-semibold text-xs rounded-xl cursor-pointer"
              >
                Browse Food Counters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-[#0B1120] border border-[#1E293B] rounded-xl p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-mono-tabular font-bold text-[#84CC16]">
                        Order #{ord.orderNumber}
                      </span>
                      <span className="text-xs text-[#64748B] mx-2">·</span>
                      <span className="text-xs text-[#94A3B8]">{ord.createdAt}</span>
                    </div>
                    <span
                      className={`text-xs font-semibold ${
                        ord.status === 'Ready for Pickup'
                          ? 'text-[#22C55E]'
                          : ord.status === 'Preparing'
                          ? 'text-[#F59E0B]'
                          : 'text-[#38BDF8]'
                      }`}
                    >
                      Status: {ord.status} (Simulated)
                    </span>
                  </div>

                  <div className="text-sm font-bold text-white">{ord.stallName}</div>

                  <div className="divide-y divide-[#1E293B] text-xs">
                    {ord.items.map(({ item, quantity }) => (
                      <div key={item.id} className="py-1.5 flex justify-between text-[#CBD5E1]">
                        <span>
                          {quantity}× {item.name}
                        </span>
                        <span className="font-mono-tabular">₹{item.priceINR * quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-[#1E293B] flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="text-[#94A3B8]">
                      <span>{ord.fulfillmentType}</span>
                      <span aria-hidden="true"> · </span>
                      <span className="font-mono-tabular text-white font-semibold">
                        Total: ₹{ord.totalINR}
                      </span>
                    </div>

                    {ord.status !== 'Ready for Pickup' ? (
                      <button
                        onClick={() => advanceOrderStatus(ord.id)}
                        className="px-3 py-1 bg-[#111827] hover:bg-[#1E293B] text-[#84CC16] border border-[#1E293B] rounded-lg text-xs font-medium cursor-pointer flex items-center gap-1"
                      >
                        <Clock className="w-3 h-3" />
                        <span>Simulate Next Order Step</span>
                      </button>
                    ) : (
                      <span className="text-xs text-[#22C55E] flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ready at {ord.pickupLocationName}</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 5 Cols: Submitted Fan Feedback & Assistance Requests */}
        <div className="lg:col-span-5 bg-[#111827] border border-[#1E293B] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
            <div className="flex items-center gap-2">
              <MessageSquareWarning className="w-4 h-4 text-[#38BDF8]" />
              <h2 className="text-base font-bold text-white font-display">
                Submitted Venue Reports ({fanReports.length})
              </h2>
            </div>
            <button
              onClick={() => setFanTab('safety')}
              className="text-xs font-semibold text-[#84CC16] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>New Report</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-[#1E293B]">
            {fanReports.map((rep) => (
              <div key={rep.id} className="py-3.5 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">
                    {rep.category} · <span className="text-[#94A3B8]">{rep.locationName}</span>
                  </span>
                  <span
                    className={`font-medium ${
                      rep.status === 'Resolved'
                        ? 'text-[#22C55E]'
                        : rep.status === 'In Progress'
                        ? 'text-[#F59E0B]'
                        : 'text-[#38BDF8]'
                    }`}
                  >
                    {rep.status}
                  </span>
                </div>
                <p className="text-xs text-[#CBD5E1]">{rep.description}</p>
                <div className="text-[11px] text-[#64748B] flex items-center justify-between">
                  <span>ID: {rep.id}</span>
                  <span>{rep.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
