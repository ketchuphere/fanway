export type SportType = 'cricket' | 'football' | 'basketball' | 'tennis';
export type UserRole = 'fan' | 'operator' | 'admin';
export type Language = 'en' | 'hi' | 'or';

export type LocationCategory =
  | 'gate'
  | 'section'
  | 'food'
  | 'washroom'
  | 'first_aid'
  | 'exit'
  | 'parking'
  | 'water';

export type QueueStatus = 'Low' | 'Moderate' | 'Busy' | 'Closed';
export type DataSourceType = 'simulated' | 'manual_operator' | 'verified_config';

export interface VenueConfig {
  id: string;
  name: string;
  city: string;
  capacity: number;
  emergencyPhone: string;
  medicalDispatchNote: string;
  assemblyPoints: string[];
  weatherSummary: string;
  temperatureC: number;
  humidityPercent: number;
  isDemoVenue: boolean;
}

export interface SportEvent {
  id: string;
  sport: SportType;
  title: string;
  tournament: string;
  teamA: {
    name: string;
    shortName: string;
    score: string;
    detail: string;
  };
  teamB: {
    name: string;
    shortName: string;
    score: string;
    detail: string;
  };
  status: string;
  matchPhase: string;
  nextBreakInMinutes: number;
  breakLabel: string;
  startTime: string;
  keyTimings: { time: string; label: string; status: 'completed' | 'active' | 'upcoming' }[];
  keyStats: { label: string; teamAVal: string; teamBVal: string }[];
  dataSource: DataSourceType;
}

export interface VenueLocation {
  id: string;
  name: string;
  category: LocationCategory;
  level: string;
  zone: 'North' | 'South' | 'East' | 'West' | 'Center';
  x: number; // 0 to 1000 on schematic SVG
  y: number; // 0 to 700 on schematic SVG
  accessible: boolean;
  status: 'Open' | 'Busy' | 'Closed';
  description: string;
  connectedTo: string[]; // IDs of connected nodes for routing
  // Queue prediction inputs
  observedQueueLength: number; // people in line
  openCounters: number;
  avgServiceTimeSeconds: number; // per person
  pendingOrders?: number;
  lastUpdated: string;
  dataSource: DataSourceType;
  alternativeLocationId?: string;
}

export interface MenuItem {
  id: string;
  stallId: string;
  name: string;
  category: 'Snack' | 'Meal' | 'Beverage' | 'Dessert';
  priceINR: number;
  isVeg: boolean;
  dietaryLabels: string[]; // e.g., 'Vegetarian', 'Vegan', 'Gluten-Free', 'Jain Available'
  available: boolean;
  prepTimeMinutes: number;
  calories?: number;
  description: string;
}

export interface FoodStall {
  id: string;
  locationId: string; // links to VenueLocation
  name: string;
  cuisine: string;
  sectionLabel: string;
  rating: number;
  pickupInstructions: string;
  supportsSeatDelivery: boolean;
  isOpen: boolean;
  dataSource: DataSourceType;
  menu: MenuItem[];
}

export interface QueueObservationLog {
  id: string;
  locationId: string;
  locationName: string;
  observedQueueLength: number;
  estimatedWaitMinutes: number;
  openCounters: number;
  source: DataSourceType;
  timestamp: string;
}

export interface FanReport {
  id: string;
  category: 'Cleanliness' | 'Long Queue' | 'Safety & Medical' | 'Accessibility' | 'Lost & Found' | 'Facility Issue';
  locationId: string;
  locationName: string;
  description: string;
  seatInfo?: string;
  status: 'Submitted' | 'In Progress' | 'Resolved';
  priority: 'Normal' | 'High' | 'Urgent';
  timestamp: string;
  isStaffAssistanceRequest?: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  category: 'Safety' | 'Match' | 'Transport' | 'Concessions';
  priority: 'Normal' | 'Important' | 'Emergency';
  timestamp: string;
  source: 'Venue Operations' | 'Match Referee' | 'City Transit Authority';
}

export interface SimulatedOrder {
  id: string;
  orderNumber: string;
  stallId: string;
  stallName: string;
  pickupLocationName: string;
  items: { item: MenuItem; quantity: number }[];
  totalINR: number;
  fulfillmentType: 'Counter Pickup' | 'Seat Delivery (Simulated)';
  seatDestination?: string;
  status: 'Confirmed' | 'Preparing' | 'Ready for Pickup';
  estimatedReadyMinutes: number;
  createdAt: string;
}

export interface VerifiedTicketRecord {
  ticketId: string;
  transactionId: string;
  barcodePayload: string;
  holderName: string;
  tier: string;
  eventId: string;
  sportLabel: string;
  eventTitle: string;
  gate: string;
  section: string;
  sectionLocationId: string;
  row: string;
  seat: string;
  preferAccessibleRoutes: boolean;
  dietaryPreference: 'All' | 'Veg Only';
  includedServices: string[];
  recommendedConcourseServices: string[];
}

export interface FanProfile {
  isAuthenticatedTicket: boolean;
  ticketId?: string;
  transactionId?: string;
  holderName?: string;
  tier?: string;
  includedServices?: string[];
  recommendedConcourseServices?: string[];
  selectedEventId: string;
  currentLocationId: string;
  gate: string;
  section: string;
  row: string;
  seat: string;
  preferAccessibleRoutes: boolean;
  dietaryPreference: 'All' | 'Veg Only';
  hasCompletedOnboarding: boolean;
}

export interface QueuePredictionResult {
  locationId: string;
  estimatedWaitMinutes: number;
  minWaitMinutes: number;
  maxWaitMinutes: number;
  status: QueueStatus;
  confidenceLabel: string;
  methodLabel: string;
  dataSource: DataSourceType;
  lastUpdated: string;
  alternativeFacility?: {
    id: string;
    name: string;
    estimatedWaitMinutes: number;
    walkingMinutes: number;
  };
}

export interface RouteResult {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  pathIds: string[];
  pathNames: string[];
  distanceMeters: number;
  walkingMinutes: number;
  isAccessibleRoute: boolean;
  steps: string[];
}
