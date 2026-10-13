import React, { useState, useMemo } from 'react';
import {
  Utensils,
  Sparkles,
  Clock,
  Footprints,
  ShoppingBag,
  Plus,
  Minus,
  CheckCircle2,
  MapPin,
  Filter,
} from 'lucide-react';
import { useStadium } from '../context/StadiumContext';
import { calculateVenueRoute } from '../utils/queuePrediction';
import { MenuItem } from '../types/stadium';
import stadiumConcourseFoodImg from '../assets/images/stadium_concourse_food_1791698090785.jpg';

export const FoodFinderView: React.FC = () => {
  const {
    foodStalls,
    locations,
    queuePredictions,
    fanProfile,
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    placeSimulatedOrder,
    navigateToMapLocation,
    setFanTab,
  } = useStadium();

  const [vegOnly, setVegOnly] = useState(fanProfile.dietaryPreference === 'Veg Only');
  const [selectedCategory, setSelectedCategory] = useState<
    'All' | 'Snack' | 'Meal' | 'Beverage' | 'Dessert'
  >('All');
  const [maxPrice, setMaxPrice] = useState<number>(300);
  const [maxWaitMinutes, setMaxWaitMinutes] = useState<number>(20);
  const [availableOnly, setAvailableOnly] = useState<boolean>(true);
  const [fulfillmentType, setFulfillmentType] = useState<
    'Counter Pickup' | 'Seat Delivery (Simulated)'
  >('Counter Pickup');
  const [recentOrderBanner, setRecentOrderBanner] = useState<string | null>(null);

  const userOrigin = useMemo(
    () => locations.find((l) => l.id === fanProfile.currentLocationId) || locations[0],
    [locations, fanProfile.currentLocationId]
  );

  // Enrich stalls with route walking time and queue wait time
  const enrichedStalls = useMemo(() => {
    return foodStalls.map((stall) => {
      const loc = locations.find((l) => l.id === stall.locationId);
      const pred = loc ? queuePredictions[loc.id] : undefined;
      const route = loc
        ? calculateVenueRoute(
            userOrigin.id,
            loc.id,
            locations,
            fanProfile.preferAccessibleRoutes
          )
        : null;

      const waitMins = pred?.estimatedWaitMinutes ?? 4;
      const walkMins = route?.walkingMinutes ?? 2;

      const filteredMenu = stall.menu.filter((item) => {
        if (vegOnly && !item.isVeg) return false;
        if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
        if (item.priceINR > maxPrice) return false;
        if (availableOnly && !item.available) return false;
        return true;
      });

      return {
        stall,
        loc,
        pred,
        waitMins,
        walkMins,
        totalTime: waitMins + walkMins,
        filteredMenu,
      };
    });
  }, [
    foodStalls,
    locations,
    queuePredictions,
    userOrigin.id,
    fanProfile.preferAccessibleRoutes,
    vegOnly,
    selectedCategory,
    maxPrice,
    availableOnly,
  ]);

  const visibleStalls = useMemo(() => {
    return enrichedStalls
      .filter((s) => s.waitMins <= maxWaitMinutes && s.filteredMenu.length > 0)
      .sort((a, b) => a.totalTime - b.totalTime);
  }, [enrichedStalls, maxWaitMinutes]);

  // Smart Top Recommendation Banner (exact format requested in prompt)
  const topRecommendation = useMemo(() => {
    const candidates: {
      item: MenuItem;
      stallName: string;
      locationId: string;
      waitRange: string;
      walkMins: number;
      score: number;
    }[] = [];

    for (const s of visibleStalls) {
      if (!s.stall.isOpen || s.loc?.status === 'Closed') continue;
      for (const item of s.filteredMenu) {
        if (!item.available) continue;
        const score = s.waitMins * 2 + s.walkMins * 2 + item.priceINR / 50;
        candidates.push({
          item,
          stallName: s.stall.name.split(' · ')[0],
          locationId: s.stall.locationId,
          waitRange: s.pred
            ? `${s.pred.minWaitMinutes}–${s.pred.maxWaitMinutes} minutes`
            : '4–6 minutes',
          walkMins: s.walkMins,
          score,
        });
      }
    }
    candidates.sort((a, b) => a.score - b.score);
    return candidates[0] || null;
  }, [visibleStalls]);

  const cartTotalINR = cart.reduce((sum, c) => sum + c.item.priceINR * c.quantity, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const handleCheckout = () => {
    const order = placeSimulatedOrder(fulfillmentType);
    if (order) {
      setRecentOrderBanner(
        `Simulated Order ${order.orderNumber} confirmed for ${order.stallName} (Est. ready in ~${order.estimatedReadyMinutes} mins).`
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Smart Recommendation Banner */}
      {topRecommendation && (
        <div className="bg-[#111827] border border-[#84CC16]/40 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#84CC16]">
              <Sparkles className="w-4 h-4" />
              <span>Smart Turnaround Recommendation (Demo Dataset)</span>
            </div>
            <p className="text-sm sm:text-base font-medium text-white">
              “{topRecommendation.item.name} ({topRecommendation.item.isVeg ? 'Vegetarian' : 'Non-Veg'}{' '}
              {topRecommendation.item.category.toLowerCase()}) is available at{' '}
              <span className="text-[#84CC16] font-semibold">{topRecommendation.stallName}</span> for{' '}
              <span className="font-mono-tabular font-bold">₹{topRecommendation.item.priceINR}</span>.
              The estimated wait is{' '}
              <span className="font-mono-tabular font-semibold">{topRecommendation.waitRange}</span>,
              with approximately{' '}
              <span className="font-mono-tabular font-semibold">
                {topRecommendation.walkMins} minutes
              </span>{' '}
              of walking time from {userOrigin.name.split(' (')[0]}.”
            </p>
          </div>
          <button
            onClick={() => navigateToMapLocation(topRecommendation.locationId, true)}
            className="px-4 py-2 bg-[#0B1120] hover:bg-[#1E293B] text-[#84CC16] border border-[#1E293B] rounded-xl text-xs font-semibold shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Route to {topRecommendation.stallName}</span>
          </button>
        </div>
      )}

      {/* Confirmation Banner if an order was just placed */}
      {recentOrderBanner && (
        <div className="bg-[#111827] border border-[#22C55E] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-white">
            <CheckCircle2 className="w-5 h-5 text-[#22C55E] shrink-0" />
            <span>{recentOrderBanner}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFanTab('activity')}
              className="px-3 py-1.5 bg-[#84CC16] text-[#0B1120] font-semibold text-xs rounded-lg cursor-pointer"
            >
              Track in My Activity →
            </button>
            <button
              onClick={() => setRecentOrderBanner(null)}
              className="text-xs text-[#94A3B8] hover:text-white cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={stadiumConcourseFoodImg}
              alt="Match-Day Concourse Food Kiosks"
              className="w-16 h-12 object-cover rounded-xl border border-[#1E293B] shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#84CC16]" />
                <h1 className="text-lg font-bold text-white font-display">
                  Concourse Food & Beverage Finder
                </h1>
              </div>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Ranked by fastest combined walking + queue turnaround from {userOrigin.name.split(' (')[0]}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (visibleStalls[0]) {
                navigateToMapLocation(visibleStalls[0].stall.locationId, true);
              } else {
                setFanTab('map');
              }
            }}
            className="px-3.5 py-2 bg-[#0B1120] hover:bg-[#1E293B] border border-[#1E293B] text-xs font-semibold text-[#84CC16] rounded-xl transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>View Food on Map</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Category Segmented Filter */}
          <div>
            <label className="block text-xs text-[#94A3B8] mb-1.5">Category</label>
            <div className="flex items-center gap-1 bg-[#0B1120] border border-[#1E293B] rounded-xl p-1 overflow-x-auto">
              {(['All', 'Snack', 'Meal', 'Beverage', 'Dessert'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#84CC16] text-[#0B1120] font-semibold'
                      : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Dietary & Availability Toggles */}
          <div>
            <label className="block text-xs text-[#94A3B8] mb-1.5">Dietary & Stock</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setVegOnly(!vegOnly)}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                  vegOnly
                    ? 'bg-[#22C55E]/15 border-[#22C55E] text-[#22C55E] font-semibold'
                    : 'bg-[#0B1120] border-[#1E293B] text-[#94A3B8]'
                }`}
              >
                Pure Veg Only
              </button>
              <button
                onClick={() => setAvailableOnly(!availableOnly)}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                  availableOnly
                    ? 'bg-[#84CC16]/15 border-[#84CC16] text-[#84CC16] font-semibold'
                    : 'bg-[#0B1120] border-[#1E293B] text-[#94A3B8]'
                }`}
              >
                In-Stock Only
              </button>
            </div>
          </div>

          {/* Max Price Slider */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-[#94A3B8]">Max Price</span>
              <span className="font-mono-tabular font-semibold text-white">Up to ₹{maxPrice}</span>
            </div>
            <input
              type="range"
              min={80}
              max={300}
              step={20}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-[#84CC16] cursor-pointer"
            />
          </div>

          {/* Max Wait Time Slider */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-[#94A3B8]">Max Queue Wait</span>
              <span className="font-mono-tabular font-semibold text-white">
                ≤ {maxWaitMinutes} mins
              </span>
            </div>
            <input
              type="range"
              min={3}
              max={20}
              step={1}
              value={maxWaitMinutes}
              onChange={(e) => setMaxWaitMinutes(Number(e.target.value))}
              className="w-full accent-[#84CC16] cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Main Layout: Stalls & Menu Items (8 Cols) + Interactive Demo Cart Drawer (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          {visibleStalls.length === 0 ? (
            <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-8 text-center space-y-3">
              <Utensils className="w-8 h-8 text-[#94A3B8] mx-auto" />
              <h3 className="text-base font-bold text-white font-display">
                No food stalls match your current filters
              </h3>
              <p className="text-xs text-[#94A3B8]">
                Try increasing the maximum queue wait time or resetting the price filter.
              </p>
              <button
                onClick={() => {
                  setVegOnly(false);
                  setSelectedCategory('All');
                  setMaxPrice(300);
                  setMaxWaitMinutes(20);
                  setAvailableOnly(false);
                }}
                className="px-4 py-2 bg-[#84CC16] text-[#0B1120] font-semibold text-xs rounded-xl cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            visibleStalls.map(({ stall, loc, pred, waitMins, walkMins, filteredMenu }) => (
              <div
                key={stall.id}
                className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1E293B]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#94A3B8]">
                      <span>{stall.sectionLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>{stall.cuisine}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {stall.dataSource === 'manual_operator'
                          ? 'Operator Verified'
                          : 'Simulated Demo Data'}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-white font-display mt-1">
                      {stall.name}
                    </h2>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-mono-tabular text-white font-semibold flex items-center gap-1 justify-end">
                        <Clock className="w-3.5 h-3.5 text-[#84CC16]" />
                        <span>
                          {pred
                            ? `${pred.minWaitMinutes}–${pred.maxWaitMinutes}m queue`
                            : `~${waitMins}m queue`}
                        </span>
                      </div>
                      <div className="text-xs font-mono-tabular text-[#94A3B8] flex items-center gap-1 justify-end mt-0.5">
                        <Footprints className="w-3.5 h-3.5 text-[#38BDF8]" />
                        <span>~{walkMins}m walk</span>
                      </div>
                    </div>

                    {loc && (
                      <button
                        onClick={() => navigateToMapLocation(loc.id, true)}
                        className="px-3 py-1.5 bg-[#0B1120] hover:bg-[#1E293B] text-white border border-[#1E293B] rounded-lg text-xs font-medium cursor-pointer"
                      >
                        Map Route
                      </button>
                    )}
                  </div>
                </div>

                {/* Menu Items List */}
                <div className="divide-y divide-[#1E293B]">
                  {filteredMenu.map((item) => {
                    const inCartQty =
                      cart.find((c) => c.item.id === item.id)?.quantity || 0;
                    return (
                      <div
                        key={item.id}
                        className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-semibold ${
                                item.isVeg ? 'text-[#22C55E]' : 'text-[#F59E0B]'
                              }`}
                            >
                              {item.isVeg ? 'VEG' : 'NON-VEG'}
                            </span>
                            <span aria-hidden="true" className="text-[#64748B]">
                              ·
                            </span>
                            <h3 className="text-sm font-semibold text-white">
                              {item.name}
                            </h3>
                            <span aria-hidden="true" className="text-[#64748B]">
                              ·
                            </span>
                            <span className="text-sm font-bold text-[#84CC16] font-mono-tabular">
                              ₹{item.priceINR}
                            </span>
                          </div>
                          <p className="text-xs text-[#94A3B8]">{item.description}</p>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#64748B]">
                            <span>{item.dietaryLabels.join(' · ')}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono-tabular">
                              Prep: ~{item.prepTimeMinutes}m
                            </span>
                            {item.calories && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono-tabular">{item.calories} kcal</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          {!item.available ? (
                            <span className="text-xs text-[#EF4444] font-medium">
                              Currently Sold Out
                            </span>
                          ) : inCartQty > 0 ? (
                            <div className="flex items-center gap-2 bg-[#0B1120] border border-[#84CC16] rounded-xl px-2 py-1">
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="p-1 text-[#94A3B8] hover:text-white cursor-pointer"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-xs font-bold font-mono-tabular text-white px-1">
                                {inCartQty}
                              </span>
                              <button
                                onClick={() => addToCart(item, stall)}
                                className="p-1 text-[#84CC16] hover:text-white cursor-pointer"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(item, stall)}
                              className="px-3.5 py-1.5 bg-[#0B1120] hover:bg-[#84CC16] text-white hover:text-[#0B1120] border border-[#1E293B] hover:border-[#84CC16] rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 text-xs text-[#64748B] flex items-center justify-between">
                  <span>Pickup: {stall.pickupInstructions}</span>
                  <span>
                    {stall.supportsSeatDelivery
                      ? 'Supports Express Pickup & Simulated Seat Delivery'
                      : 'Counter Pickup Only'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right 4 Cols: Simulated Express Pre-Order Cart */}
        <div className="lg:col-span-4 bg-[#111827] border border-[#1E293B] rounded-2xl p-6 sticky top-20 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#84CC16]" />
              <h2 className="text-base font-bold text-white font-display">
                Simulated Pre-Order Cart
              </h2>
            </div>
            {cartCount > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-[#94A3B8] hover:text-white cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <p className="text-xs text-[#94A3B8]">
                Your match-day cart is empty. Select items from any counter to simulate an express pickup or seat delivery order.
              </p>
              <p className="text-[11px] text-[#64748B]">
                Demo Notice: No real payment gateway is charged.
              </p>
            </div>
          ) : (
            <>
              <div className="text-xs text-[#84CC16] font-medium">
                Ordering from: {cart[0].stallName}
              </div>

              <div className="divide-y divide-[#1E293B]">
                {cart.map(({ item, quantity }) => (
                  <div
                    key={item.id}
                    className="py-2.5 flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-medium text-white">{item.name}</div>
                      <div className="text-[#94A3B8] font-mono-tabular">
                        ₹{item.priceINR} × {quantity}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono-tabular font-bold text-white">
                        ₹{item.priceINR * quantity}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 text-[#94A3B8] hover:text-white cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Fulfillment Mode Selector */}
              <div className="pt-3 border-t border-[#1E293B]">
                <label className="block text-xs text-[#94A3B8] mb-1.5">
                  Fulfillment Option (Simulated)
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-[#0B1120] p-1 rounded-xl border border-[#1E293B]">
                  {(
                    ['Counter Pickup', 'Seat Delivery (Simulated)'] as const
                  ).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setFulfillmentType(mode)}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                        fulfillmentType === mode
                          ? 'bg-[#84CC16] text-[#0B1120] font-semibold'
                          : 'text-[#94A3B8] hover:text-white'
                      }`}
                    >
                      {mode === 'Counter Pickup' ? 'Express Pickup' : 'Seat Delivery'}
                    </button>
                  ))}
                </div>
                {fulfillmentType === 'Seat Delivery (Simulated)' && (
                  <div className="text-[11px] text-[#94A3B8] mt-1.5">
                    Delivering to: {fanProfile.section} · {fanProfile.row} · {fanProfile.seat}
                  </div>
                )}
              </div>

              {/* Total Breakdown */}
              <div className="pt-3 border-t border-[#1E293B] space-y-1.5 text-xs">
                <div className="flex justify-between text-[#94A3B8]">
                  <span>Items Subtotal ({cartCount})</span>
                  <span className="font-mono-tabular">₹{cartTotalINR}</span>
                </div>
                <div className="flex justify-between text-[#94A3B8]">
                  <span>Platform Convenience Fee (Demo)</span>
                  <span className="font-mono-tabular">₹0</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white pt-1">
                  <span>Total Payable (Simulated)</span>
                  <span className="font-mono-tabular text-[#84CC16]">₹{cartTotalINR}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full py-2.5 px-4 bg-[#84CC16] hover:bg-[#A3E635] text-[#0B1120] font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Confirm Simulated Order (₹{cartTotalINR})
              </button>

              <p className="text-[11px] text-[#64748B] text-center">
                Simulated demo checkout — generates an instant pickup token without charging any card.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
