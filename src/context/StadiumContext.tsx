import React, { createContext, useContext, useState, useMemo } from 'react';
import {
  VenueConfig,
  SportEvent,
  VenueLocation,
  FoodStall,
  MenuItem,
  QueueObservationLog,
  FanReport,
  Announcement,
  SimulatedOrder,
  FanProfile,
  VerifiedTicketRecord,
  UserRole,
  Language,
  QueuePredictionResult,
} from '../types/stadium';
import {
  INITIAL_VENUE_CONFIG,
  INITIAL_EVENTS,
  INITIAL_LOCATIONS,
  INITIAL_FOOD_STALLS,
  INITIAL_QUEUE_OBSERVATIONS,
  INITIAL_FAN_REPORTS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_FAN_PROFILE,
  INITIAL_TICKETS,
} from '../data/seedData';
import { predictQueueForLocation } from '../utils/queuePrediction';

export type FanTab = 'home' | 'map' | 'food' | 'concierge' | 'match' | 'safety' | 'activity';
export type OperatorTab =
  | 'overview'
  | 'queues'
  | 'food'
  | 'facilities'
  | 'feedback'
  | 'analytics'
  | 'settings';

interface CartItem {
  item: MenuItem;
  stallId: string;
  stallName: string;
  quantity: number;
}

interface StadiumContextType {
  // User role & language
  showLanding: boolean;
  setShowLanding: (show: boolean) => void;
  showTicketAuth: boolean;
  setShowTicketAuth: (show: boolean) => void;
  verifiedTickets: VerifiedTicketRecord[];
  authenticateByTicketOrTxn: (code: string) => VerifiedTicketRecord | null;
  signOutTicket: () => void;
  role: UserRole;
  setRole: (role: UserRole) => void;
  language: Language;
  setLanguage: (lang: Language) => void;

  // Navigation
  fanTab: FanTab;
  setFanTab: (tab: FanTab) => void;
  operatorTab: OperatorTab;
  setOperatorTab: (tab: OperatorTab) => void;
  selectedMapLocationId: string | null;
  setSelectedMapLocationId: (id: string | null) => void;
  mapRouteDestinationId: string | null;
  setMapRouteDestinationId: (id: string | null) => void;
  conciergeInitialPrompt: string | null;
  setConciergeInitialPrompt: (prompt: string | null) => void;

  // Core data state
  venueConfig: VenueConfig;
  updateVenueConfig: (updates: Partial<VenueConfig>) => void;
  events: SportEvent[];
  activeEvent: SportEvent;
  selectEvent: (eventId: string) => void;
  updateEvent: (eventId: string, updates: Partial<SportEvent>) => void;

  locations: VenueLocation[];
  queuePredictions: Record<string, QueuePredictionResult>;
  updateLocationQueue: (
    locationId: string,
    observedQueueLength: number,
    openCounters: number,
    status: 'Open' | 'Busy' | 'Closed'
  ) => void;
  updateLocationDetails: (locationId: string, updates: Partial<VenueLocation>) => void;
  addLocation: (newLoc: Omit<VenueLocation, 'id' | 'lastUpdated'>) => void;

  foodStalls: FoodStall[];
  updateMenuItem: (stallId: string, itemId: string, updates: Partial<MenuItem>) => void;
  updateFoodStall: (stallId: string, updates: Partial<FoodStall>) => void;

  queueLogs: QueueObservationLog[];
  fanReports: FanReport[];
  submitFanReport: (
    report: Omit<FanReport, 'id' | 'status' | 'timestamp'>
  ) => FanReport;
  updateFanReportStatus: (reportId: string, status: FanReport['status']) => void;

  announcements: Announcement[];
  addAnnouncement: (ann: Omit<Announcement, 'id' | 'timestamp'>) => void;

  // Fan profile & onboarding
  fanProfile: FanProfile;
  updateFanProfile: (updates: Partial<FanProfile>) => void;
  showSetupModal: boolean;
  setShowSetupModal: (show: boolean) => void;

  // Cart & Simulated Orders
  cart: CartItem[];
  addToCart: (item: MenuItem, stall: FoodStall) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  orders: SimulatedOrder[];
  placeSimulatedOrder: (
    fulfillmentType: 'Counter Pickup' | 'Seat Delivery (Simulated)'
  ) => SimulatedOrder | null;
  advanceOrderStatus: (orderId: string) => void;

  // Analytics & Search Telemetry (real in-app interactions)
  searchQueriesLog: { term: string; count: number }[];
  recordSearchTerm: (term: string) => void;

  // Navigate helper to jump to map with a highlighted location
  navigateToMapLocation: (locationId: string, showRoute?: boolean) => void;
  askConciergeQuestion: (question: string) => void;
}

const StadiumContext = createContext<StadiumContextType | undefined>(undefined);

export const StadiumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showLanding, setShowLanding] = useState<boolean>(true);
  const [showTicketAuth, setShowTicketAuth] = useState<boolean>(false);
  const [verifiedTickets] = useState<VerifiedTicketRecord[]>(INITIAL_TICKETS);
  const [role, setRoleState] = useState<UserRole>('fan');
  const [language, setLanguage] = useState<Language>('en');
  const [fanTab, setFanTab] = useState<FanTab>('home');
  const [operatorTab, setOperatorTab] = useState<OperatorTab>('overview');

  const [selectedMapLocationId, setSelectedMapLocationId] = useState<string | null>('sec-n1');
  const [mapRouteDestinationId, setMapRouteDestinationId] = useState<string | null>(null);
  const [conciergeInitialPrompt, setConciergeInitialPrompt] = useState<string | null>(null);

  const [venueConfig, setVenueConfig] = useState<VenueConfig>(INITIAL_VENUE_CONFIG);
  const [events, setEvents] = useState<SportEvent[]>(INITIAL_EVENTS);
  const [locations, setLocations] = useState<VenueLocation[]>(INITIAL_LOCATIONS);
  const [foodStalls, setFoodStalls] = useState<FoodStall[]>(INITIAL_FOOD_STALLS);
  const [queueLogs, setQueueLogs] = useState<QueueObservationLog[]>(INITIAL_QUEUE_OBSERVATIONS);
  const [fanReports, setFanReports] = useState<FanReport[]>(INITIAL_FAN_REPORTS);
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);
  const [fanProfile, setFanProfile] = useState<FanProfile>(INITIAL_FAN_PROFILE);
  const [showSetupModal, setShowSetupModal] = useState<boolean>(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<SimulatedOrder[]>([]);

  const [searchQueriesLog, setSearchQueriesLog] = useState<{ term: string; count: number }[]>([
    { term: 'Washroom (Accessible)', count: 42 },
    { term: 'Vegetarian Snacks', count: 37 },
    { term: 'Gate B Metro Exit', count: 29 },
    { term: 'First-Aid & Medical', count: 18 },
    { term: 'Zone P1 Pickup', count: 24 },
  ]);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    if (newRole === 'admin') {
      setOperatorTab('settings');
    } else if (newRole === 'operator' && operatorTab === 'settings') {
      setOperatorTab('overview');
    }
  };

  const activeEvent = useMemo(
    () => events.find((e) => e.id === fanProfile.selectedEventId) || events[0],
    [events, fanProfile.selectedEventId]
  );

  const queuePredictions = useMemo(() => {
    const map: Record<string, QueuePredictionResult> = {};
    for (const loc of locations) {
      map[loc.id] = predictQueueForLocation(
        loc,
        locations,
        activeEvent,
        fanProfile.currentLocationId
      );
    }
    return map;
  }, [locations, activeEvent, fanProfile.currentLocationId]);

  const updateVenueConfig = (updates: Partial<VenueConfig>) => {
    setVenueConfig((prev) => ({ ...prev, ...updates }));
  };

  const selectEvent = (eventId: string) => {
    setFanProfile((prev) => ({ ...prev, selectedEventId: eventId }));
  };

  const updateEvent = (eventId: string, updates: Partial<SportEvent>) => {
    setEvents((prev) =>
      prev.map((evt) => (evt.id === eventId ? { ...evt, ...updates } : evt))
    );
  };

  const updateLocationQueue = (
    locationId: string,
    observedQueueLength: number,
    openCounters: number,
    status: 'Open' | 'Busy' | 'Closed'
  ) => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLocations((prev) =>
      prev.map((loc) => {
        if (loc.id !== locationId) return loc;
        return {
          ...loc,
          observedQueueLength: Math.max(0, observedQueueLength),
          openCounters: Math.max(0, openCounters),
          status,
          lastUpdated: `Operator updated at ${nowStr}`,
          dataSource: 'manual_operator',
        };
      })
    );

    const targetLoc = locations.find((l) => l.id === locationId);
    if (targetLoc) {
      const updatedLoc: VenueLocation = {
        ...targetLoc,
        observedQueueLength,
        openCounters,
        status,
        dataSource: 'manual_operator',
      };
      const pred = predictQueueForLocation(
        updatedLoc,
        locations,
        activeEvent,
        fanProfile.currentLocationId
      );
      const newLog: QueueObservationLog = {
        id: `obs-${Date.now()}`,
        locationId,
        locationName: targetLoc.name,
        observedQueueLength,
        estimatedWaitMinutes: pred.estimatedWaitMinutes,
        openCounters,
        source: 'manual_operator',
        timestamp: nowStr,
      };
      setQueueLogs((prev) => [newLog, ...prev]);
    }
  };

  const updateLocationDetails = (locationId: string, updates: Partial<VenueLocation>) => {
    setLocations((prev) =>
      prev.map((loc) =>
        loc.id === locationId
          ? { ...loc, ...updates, lastUpdated: 'Updated just now', dataSource: 'manual_operator' }
          : loc
      )
    );
  };

  const addLocation = (newLoc: Omit<VenueLocation, 'id' | 'lastUpdated'>) => {
    const created: VenueLocation = {
      ...newLoc,
      id: `loc-${Date.now()}`,
      lastUpdated: 'Added just now',
    };
    setLocations((prev) => [...prev, created]);
  };

  const updateMenuItem = (stallId: string, itemId: string, updates: Partial<MenuItem>) => {
    setFoodStalls((prev) =>
      prev.map((stall) => {
        if (stall.id !== stallId) return stall;
        return {
          ...stall,
          dataSource: 'manual_operator',
          menu: stall.menu.map((item) => (item.id === itemId ? { ...item, ...updates } : item)),
        };
      })
    );
  };

  const updateFoodStall = (stallId: string, updates: Partial<FoodStall>) => {
    setFoodStalls((prev) =>
      prev.map((stall) =>
        stall.id === stallId ? { ...stall, ...updates, dataSource: 'manual_operator' } : stall
      )
    );
  };

  const submitFanReport = (
    reportData: Omit<FanReport, 'id' | 'status' | 'timestamp'>
  ): FanReport => {
    const created: FanReport = {
      ...reportData,
      id: `rep-${Math.floor(100 + Math.random() * 900)}`,
      status: 'Submitted',
      timestamp: 'Just now',
    };
    setFanReports((prev) => [created, ...prev]);
    return created;
  };

  const updateFanReportStatus = (reportId: string, status: FanReport['status']) => {
    setFanReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status } : r))
    );
  };

  const addAnnouncement = (ann: Omit<Announcement, 'id' | 'timestamp'>) => {
    const created: Announcement = {
      ...ann,
      id: `ann-${Date.now()}`,
      timestamp: 'Just now',
    };
    setAnnouncements((prev) => [created, ...prev]);
  };

  const updateFanProfile = (updates: Partial<FanProfile>) => {
    setFanProfile((prev) => ({ ...prev, ...updates }));
  };

  const authenticateByTicketOrTxn = (rawInput: string): VerifiedTicketRecord | null => {
    const clean = rawInput.trim().toUpperCase();
    if (!clean) return null;

    // Match against Ticket ID, Transaction ID, or Barcode Payload
    let found = verifiedTickets.find(
      (t) =>
        t.ticketId.toUpperCase() === clean ||
        t.transactionId.toUpperCase() === clean ||
        t.barcodePayload.toUpperCase() === clean ||
        clean.includes(t.ticketId.toUpperCase()) ||
        clean.includes(t.transactionId.toUpperCase())
    );

    // Also allow any custom valid-looking Ticket/TXN code (e.g., TKT-xxxx or TXN-xxxx or 6+ chars) to dynamically provision a verified pass
    if (!found && clean.length >= 5) {
      const hash = clean.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
      const template = verifiedTickets[hash % verifiedTickets.length];
      found = {
        ...template,
        ticketId: clean.startsWith('TXN') ? `FWY-TKT-${1000 + (hash % 8999)}` : clean,
        transactionId: clean.startsWith('TXN') ? clean : `TXN-${100000 + (hash % 899999)}`,
        holderName: `Verified Spectator (${clean})`,
      };
    }

    if (!found) return null;

    setFanProfile({
      isAuthenticatedTicket: true,
      ticketId: found.ticketId,
      transactionId: found.transactionId,
      holderName: found.holderName,
      tier: found.tier,
      includedServices: found.includedServices,
      recommendedConcourseServices: found.recommendedConcourseServices,
      selectedEventId: found.eventId,
      currentLocationId: found.sectionLocationId,
      gate: found.gate,
      section: found.section,
      row: found.row,
      seat: found.seat,
      preferAccessibleRoutes: found.preferAccessibleRoutes,
      dietaryPreference: found.dietaryPreference,
      hasCompletedOnboarding: true,
    });

    setSelectedMapLocationId(found.sectionLocationId);
    return found;
  };

  const signOutTicket = () => {
    setFanProfile((prev) => ({
      ...prev,
      isAuthenticatedTicket: false,
      ticketId: undefined,
      transactionId: undefined,
      holderName: undefined,
      tier: undefined,
    }));
    setShowTicketAuth(true);
    setShowLanding(false);
  };

  const addToCart = (item: MenuItem, stall: FoodStall) => {
    setCart((prev) => {
      // Ensure single-stall cart for realistic stadium counter pickup, or replace stall
      const existingFromOtherStall = prev.length > 0 && prev[0].stallId !== stall.id;
      const baseCart = existingFromOtherStall ? [] : prev;

      const existingIndex = baseCart.findIndex((c) => c.item.id === item.id);
      if (existingIndex > -1) {
        const updated = [...baseCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        };
        return updated;
      }
      return [...baseCart, { item, stallId: stall.id, stallName: stall.name, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) =>
      prev
        .map((c) => (c.item.id === itemId ? { ...c, quantity: c.quantity - 1 } : c))
        .filter((c) => c.quantity > 0)
    );
  };

  const clearCart = () => setCart([]);

  const placeSimulatedOrder = (
    fulfillmentType: 'Counter Pickup' | 'Seat Delivery (Simulated)'
  ): SimulatedOrder | null => {
    if (cart.length === 0) return null;
    const stallId = cart[0].stallId;
    const stall = foodStalls.find((s) => s.id === stallId);
    const loc = locations.find((l) => l.id === stall?.locationId);
    const pred = loc ? queuePredictions[loc.id] : undefined;

    const totalINR = cart.reduce((sum, c) => sum + c.item.priceINR * c.quantity, 0);
    const maxPrep = Math.max(...cart.map((c) => c.item.prepTimeMinutes), 2);
    const estimatedReadyMinutes = maxPrep + (pred ? Math.min(6, pred.estimatedWaitMinutes) : 3);

    const newOrder: SimulatedOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: `FWY-${Math.floor(1000 + Math.random() * 9000)}`,
      stallId,
      stallName: cart[0].stallName,
      pickupLocationName: stall?.pickupInstructions || cart[0].stallName,
      items: cart.map((c) => ({ item: c.item, quantity: c.quantity })),
      totalINR,
      fulfillmentType,
      seatDestination:
        fulfillmentType === 'Seat Delivery (Simulated)'
          ? `${fanProfile.section} · ${fanProfile.row} · ${fanProfile.seat}`
          : undefined,
      status: 'Confirmed',
      estimatedReadyMinutes,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setOrders((prev) => [newOrder, ...prev]);
    // Also increment pending orders at that location
    if (loc) {
      setLocations((prev) =>
        prev.map((l) =>
          l.id === loc.id ? { ...l, pendingOrders: (l.pendingOrders || 0) + 1 } : l
        )
      );
    }
    setCart([]);
    return newOrder;
  };

  const advanceOrderStatus = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const nextStatus: SimulatedOrder['status'] =
          o.status === 'Confirmed'
            ? 'Preparing'
            : o.status === 'Preparing'
            ? 'Ready for Pickup'
            : 'Ready for Pickup';
        return { ...o, status: nextStatus };
      })
    );
  };

  const recordSearchTerm = (term: string) => {
    const clean = term.trim();
    if (!clean || clean.length < 2) return;
    setSearchQueriesLog((prev) => {
      const idx = prev.findIndex((q) => q.term.toLowerCase() === clean.toLowerCase());
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], count: copy[idx].count + 1 };
        return copy;
      }
      return [{ term: clean, count: 1 }, ...prev.slice(0, 7)];
    });
  };

  const navigateToMapLocation = (locationId: string, showRoute: boolean = false) => {
    setSelectedMapLocationId(locationId);
    if (showRoute) {
      setMapRouteDestinationId(locationId);
    } else {
      setMapRouteDestinationId(null);
    }
    setRoleState('fan');
    setFanTab('map');
    setShowLanding(false);
  };

  const askConciergeQuestion = (question: string) => {
    setConciergeInitialPrompt(question);
    setRoleState('fan');
    setFanTab('concierge');
    setShowLanding(false);
  };

  return (
    <StadiumContext.Provider
      value={{
        showLanding,
        setShowLanding,
        showTicketAuth,
        setShowTicketAuth,
        verifiedTickets,
        authenticateByTicketOrTxn,
        signOutTicket,
        role,
        setRole,
        language,
        setLanguage,
        fanTab,
        setFanTab,
        operatorTab,
        setOperatorTab,
        selectedMapLocationId,
        setSelectedMapLocationId,
        mapRouteDestinationId,
        setMapRouteDestinationId,
        conciergeInitialPrompt,
        setConciergeInitialPrompt,
        venueConfig,
        updateVenueConfig,
        events,
        activeEvent,
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
        submitFanReport,
        updateFanReportStatus,
        announcements,
        addAnnouncement,
        fanProfile,
        updateFanProfile,
        showSetupModal,
        setShowSetupModal,
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        orders,
        placeSimulatedOrder,
        advanceOrderStatus,
        searchQueriesLog,
        recordSearchTerm,
        navigateToMapLocation,
        askConciergeQuestion,
      }}
    >
      {children}
    </StadiumContext.Provider>
  );
};

export const useStadium = () => {
  const context = useContext(StadiumContext);
  if (!context) {
    throw new Error('useStadium must be used within a StadiumProvider');
  }
  return context;
};
