import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, FunctionDeclaration, Type } from '@google/genai';
import { predictQueueForLocation, calculateVenueRoute } from './src/utils/queuePrediction.ts';
import {
  VenueLocation,
  FoodStall,
  SportEvent,
  Announcement,
  VenueConfig,
  FanProfile,
} from './src/types/stadium.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '5mb' }));

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Tool Declarations for StadiumIQ Concierge
const conciergeTools: FunctionDeclaration[] = [
  {
    name: 'search_venue_locations',
    description:
      'Search stadium locations (gates, seating sections, washrooms, food counters, first-aid stations, emergency exits, parking/pickup zones, water stations) by category, keyword, or accessibility.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        category: {
          type: Type.STRING,
          description:
            'Optional category filter: "gate", "section", "food", "washroom", "first_aid", "exit", "parking", "water", or "all".',
        },
        query: {
          type: Type.STRING,
          description: 'Optional keyword search (e.g., "Gate C", "North", "accessible", "water").',
        },
        accessibleOnly: {
          type: Type.BOOLEAN,
          description: 'If true, only return step-free wheelchair accessible locations.',
        },
      },
    },
  },
  {
    name: 'get_facility_details',
    description:
      'Get full details, queue status, open counters, and data source for a specific venue location by ID or name.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        locationIdentifier: {
          type: Type.STRING,
          description: 'Location ID (e.g. "wash-n1", "gate-c") or partial name (e.g. "Counter B").',
        },
      },
      required: ['locationIdentifier'],
    },
  },
  {
    name: 'get_food_options',
    description:
      'Search food and beverage stalls and menu items with prices, dietary tags (Vegetarian, Vegan, Jain, Non-Veg), estimated queue wait time, and walking time from the fan’s current location.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        vegetarianOnly: {
          type: Type.BOOLEAN,
          description: 'Set to true if the fan asks for vegetarian or veg food.',
        },
        maxPriceINR: {
          type: Type.NUMBER,
          description: 'Optional maximum price in INR.',
        },
        category: {
          type: Type.STRING,
          description: 'Optional menu category: "Snack", "Meal", "Beverage", "Dessert".',
        },
      },
    },
  },
  {
    name: 'get_queue_estimates',
    description:
      'Get current estimated waiting times, confidence levels, data sources (simulated vs manual operator), and faster nearby alternatives across stadium facilities.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        category: {
          type: Type.STRING,
          description: 'Optional category to filter queues: "food", "washroom", "gate", or "all".',
        },
      },
    },
  },
  {
    name: 'calculate_route',
    description:
      'Calculate walking directions, distance in meters, estimated walking time in minutes, and step-by-step instructions between two stadium locations.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        fromLocation: {
          type: Type.STRING,
          description:
            'Starting location ID or name (leave empty or pass "current" to use the fan’s current selected section/location).',
        },
        toLocation: {
          type: Type.STRING,
          description: 'Destination location ID or name (e.g., "Gate C", "wash-n1", "park-p1").',
        },
        accessibleRoute: {
          type: Type.BOOLEAN,
          description: 'True if the user needs a step-free accessible route.',
        },
      },
      required: ['toLocation'],
    },
  },
  {
    name: 'get_match_information',
    description:
      'Get current match score, teams, match phase, time until next break/interval, and key schedule timings.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'get_official_announcements',
    description:
      'Get official venue announcements, safety notices, emergency contacts, and assembly points.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'submit_fan_feedback',
    description:
      'Draft or prepare a fan facility report (e.g., cleanliness issue, long queue, lost & found) so the fan can confirm or submit it in the UI.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        category: {
          type: Type.STRING,
          description:
            'One of: "Cleanliness", "Long Queue", "Safety & Medical", "Accessibility", "Lost & Found", "Facility Issue".',
        },
        locationName: {
          type: Type.STRING,
          description: 'Name of the stadium location where the issue occurred.',
        },
        description: {
          type: Type.STRING,
          description: 'Brief description of the issue.',
        },
      },
      required: ['category', 'locationName', 'description'],
    },
  },
  {
    name: 'request_staff_assistance',
    description:
      'Prepare a staff or steward assistance request (e.g., wheelchair escort, accessibility help, seating help). Requires user confirmation for any emergency/consequential dispatch.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        locationName: {
          type: Type.STRING,
          description: 'Location or seat section where assistance is needed.',
        },
        reason: {
          type: Type.STRING,
          description: 'Description of assistance needed.',
        },
      },
      required: ['locationName', 'reason'],
    },
  },
];

interface ConciergeContextPayload {
  venueConfig: VenueConfig;
  activeEvent: SportEvent;
  locations: VenueLocation[];
  foodStalls: FoodStall[];
  announcements: Announcement[];
  fanProfile: FanProfile;
  language: 'en' | 'hi' | 'or';
}

function findLocationByFuzzy(
  identifier: string,
  locations: VenueLocation[],
  fallbackId: string
): VenueLocation {
  if (!identifier || identifier.toLowerCase() === 'current' || identifier.toLowerCase() === 'my seat') {
    return locations.find((l) => l.id === fallbackId) || locations[0];
  }
  const lower = identifier.toLowerCase().trim();
  const exact = locations.find(
    (l) => l.id.toLowerCase() === lower || l.name.toLowerCase() === lower
  );
  if (exact) return exact;

  const partial = locations.find(
    (l) =>
      l.name.toLowerCase().includes(lower) ||
      l.id.toLowerCase().includes(lower) ||
      l.description.toLowerCase().includes(lower)
  );
  return partial || locations.find((l) => l.id === fallbackId) || locations[0];
}

function executeConciergeTool(
  name: string,
  args: Record<string, any>,
  ctx: ConciergeContextPayload
): { result: any; clientAction?: any } {
  const { locations, foodStalls, activeEvent, announcements, venueConfig, fanProfile } = ctx;
  const userOrigin =
    locations.find((l) => l.id === fanProfile.currentLocationId) || locations[0];

  switch (name) {
    case 'search_venue_locations': {
      const cat = args.category && args.category !== 'all' ? args.category.toLowerCase() : null;
      const q = args.query ? String(args.query).toLowerCase() : null;
      const accessibleOnly = Boolean(args.accessibleOnly);

      const matches = locations
        .filter((loc) => {
          if (cat && loc.category !== cat) return false;
          if (accessibleOnly && !loc.accessible) return false;
          if (
            q &&
            !loc.name.toLowerCase().includes(q) &&
            !loc.zone.toLowerCase().includes(q) &&
            !loc.description.toLowerCase().includes(q) &&
            !loc.category.toLowerCase().includes(q)
          ) {
            return false;
          }
          return true;
        })
        .map((loc) => {
          const pred = predictQueueForLocation(
            loc,
            locations,
            activeEvent,
            fanProfile.currentLocationId
          );
          const route = calculateVenueRoute(
            userOrigin.id,
            loc.id,
            locations,
            fanProfile.preferAccessibleRoutes
          );
          return {
            id: loc.id,
            name: loc.name,
            category: loc.category,
            zone: loc.zone,
            level: loc.level,
            accessible: loc.accessible,
            status: loc.status,
            estimatedWaitMinutes: pred.estimatedWaitMinutes,
            waitRange: `${pred.minWaitMinutes}–${pred.maxWaitMinutes} mins`,
            queueStatus: pred.status,
            walkingMinutesFromFan: route?.walkingMinutes ?? 2,
            distanceMetersFromFan: route?.distanceMeters ?? 110,
            lastUpdated: loc.lastUpdated,
            dataSource: loc.dataSource,
            description: loc.description,
          };
        })
        .sort((a, b) => a.walkingMinutesFromFan + a.estimatedWaitMinutes - (b.walkingMinutesFromFan + b.estimatedWaitMinutes));

      return {
        result: {
          fanCurrentLocation: userOrigin.name,
          count: matches.length,
          locations: matches,
        },
      };
    }

    case 'get_facility_details': {
      const target = findLocationByFuzzy(
        String(args.locationIdentifier || ''),
        locations,
        fanProfile.currentLocationId
      );
      const pred = predictQueueForLocation(
        target,
        locations,
        activeEvent,
        fanProfile.currentLocationId
      );
      const route = calculateVenueRoute(
        userOrigin.id,
        target.id,
        locations,
        fanProfile.preferAccessibleRoutes
      );
      return {
        result: {
          facility: target,
          queuePrediction: pred,
          routeFromFan: route,
        },
      };
    }

    case 'get_food_options': {
      const vegOnly = Boolean(args.vegetarianOnly);
      const maxPrice = args.maxPriceINR ? Number(args.maxPriceINR) : null;
      const catFilter = args.category ? String(args.category).toLowerCase() : null;

      const stallResults = foodStalls.map((stall) => {
        const loc = locations.find((l) => l.id === stall.locationId);
        const pred = loc
          ? predictQueueForLocation(loc, locations, activeEvent, fanProfile.currentLocationId)
          : null;
        const route = loc
          ? calculateVenueRoute(
              userOrigin.id,
              loc.id,
              locations,
              fanProfile.preferAccessibleRoutes
            )
          : null;

        const filteredMenu = stall.menu.filter((item) => {
          if (vegOnly && !item.isVeg) return false;
          if (maxPrice && item.priceINR > maxPrice) return false;
          if (catFilter && item.category.toLowerCase() !== catFilter) return false;
          return true;
        });

        return {
          stallId: stall.id,
          stallName: stall.name,
          locationId: stall.locationId,
          sectionLabel: stall.sectionLabel,
          isOpen: stall.isOpen && loc?.status !== 'Closed',
          estimatedQueueWaitMinutes: pred?.estimatedWaitMinutes ?? 4,
          waitRange: pred ? `${pred.minWaitMinutes}–${pred.maxWaitMinutes} mins` : '3–5 mins',
          walkingMinutesFromFan: route?.walkingMinutes ?? 2,
          totalTurnaroundMinutes: (pred?.estimatedWaitMinutes ?? 4) + (route?.walkingMinutes ?? 2),
          dataSource: stall.dataSource,
          lastUpdated: loc?.lastUpdated || 'Just now',
          matchingMenuItems: filteredMenu.map((m) => ({
            name: m.name,
            priceINR: `₹${m.priceINR}`,
            isVeg: m.isVeg,
            dietaryLabels: m.dietaryLabels,
            available: m.available,
            prepTimeMinutes: m.prepTimeMinutes,
          })),
        };
      });

      return {
        result: {
          fanCurrentLocation: userOrigin.name,
          stalls: stallResults.filter((s) => s.matchingMenuItems.length > 0),
        },
      };
    }

    case 'get_queue_estimates': {
      const cat = args.category && args.category !== 'all' ? String(args.category).toLowerCase() : null;
      const filtered = locations.filter((l) => !cat || l.category === cat);
      const estimates = filtered.map((loc) => {
        const pred = predictQueueForLocation(
          loc,
          locations,
          activeEvent,
          fanProfile.currentLocationId
        );
        const route = calculateVenueRoute(
          userOrigin.id,
          loc.id,
          locations,
          fanProfile.preferAccessibleRoutes
        );
        return {
          id: loc.id,
          name: loc.name,
          category: loc.category,
          status: pred.status,
          estimatedWaitMinutes: pred.estimatedWaitMinutes,
          waitRange: `${pred.minWaitMinutes}–${pred.maxWaitMinutes} mins`,
          walkingMinutesFromFan: route?.walkingMinutes ?? 2,
          confidence: pred.confidenceLabel,
          dataSource: pred.dataSource,
          lastUpdated: pred.lastUpdated,
          fasterAlternative: pred.alternativeFacility || null,
        };
      });

      return {
        result: {
          fanCurrentLocation: userOrigin.name,
          estimates,
        },
      };
    }

    case 'calculate_route': {
      const fromLoc = args.fromLocation
        ? findLocationByFuzzy(String(args.fromLocation), locations, fanProfile.currentLocationId)
        : userOrigin;
      const toLoc = findLocationByFuzzy(
        String(args.toLocation || ''),
        locations,
        fanProfile.currentLocationId
      );
      const accessible =
        args.accessibleRoute !== undefined
          ? Boolean(args.accessibleRoute)
          : fanProfile.preferAccessibleRoutes;

      const route = calculateVenueRoute(fromLoc.id, toLoc.id, locations, accessible);
      return {
        result: {
          route,
          destinationDetails: {
            id: toLoc.id,
            name: toLoc.name,
            accessible: toLoc.accessible,
            status: toLoc.status,
          },
        },
        clientAction: {
          type: 'HIGHLIGHT_ROUTE',
          toLocationId: toLoc.id,
          toLocationName: toLoc.name,
        },
      };
    }

    case 'get_match_information': {
      return {
        result: {
          venue: venueConfig.name,
          event: activeEvent,
          weather: `${venueConfig.weatherSummary}, ${venueConfig.temperatureC}°C (Humidity ${venueConfig.humidityPercent}%)`,
        },
      };
    }

    case 'get_official_announcements': {
      return {
        result: {
          emergencyPhone: venueConfig.emergencyPhone,
          medicalDispatchNote: venueConfig.medicalDispatchNote,
          assemblyPoints: venueConfig.assemblyPoints,
          announcements,
        },
      };
    }

    case 'submit_fan_feedback': {
      return {
        result: {
          status: 'Prepared for confirmation',
          message:
            'Feedback report has been logged into the application state and is visible to Venue Operators.',
          details: {
            category: args.category,
            locationName: args.locationName,
            description: args.description,
          },
        },
        clientAction: {
          type: 'SUBMIT_REPORT',
          payload: {
            category: args.category || 'Facility Issue',
            locationName: args.locationName || userOrigin.name,
            description: args.description || 'Reported via AI Concierge',
          },
        },
      };
    }

    case 'request_staff_assistance': {
      return {
        result: {
          status: 'Staff Assistance Request Ready',
          officialEmergencyContact: venueConfig.emergencyPhone,
          note: 'Steward assistance request logged. For medical emergencies, please also contact the nearest steward or call the official emergency number directly.',
          details: {
            locationName: args.locationName,
            reason: args.reason,
          },
        },
        clientAction: {
          type: 'REQUEST_ASSISTANCE',
          payload: {
            category: 'Accessibility',
            locationName: args.locationName || userOrigin.name,
            description: `Staff Assistance Request: ${args.reason}`,
            isStaffAssistanceRequest: true,
          },
        },
      };
    }

    default:
      return { result: { error: `Unknown tool ${name}` } };
  }
}

app.post('/api/concierge/chat', async (req, res) => {
  try {
    const { message, history = [], context } = req.body as {
      message: string;
      history: { role: 'user' | 'model'; text: string }[];
      context: ConciergeContextPayload;
    };

    if (!message || !context) {
      res.status(400).json({ error: 'Missing message or venue context payload.' });
      return;
    }

    const ai = getGeminiClient();
    const userLoc =
      context.locations.find((l) => l.id === context.fanProfile.currentLocationId) ||
      context.locations[0];

    const languageInstruction =
      context.language === 'hi'
        ? 'Respond primarily in Hindi (हिन्दी), keeping key facility codes (e.g. Gate A, Section N1, Counter B) clear. Never invent emergency translations—always include the verified emergency phone number 112 / +91-674-255-0199.'
        : context.language === 'or'
        ? 'Respond primarily in Odia (ଓଡ଼ିଆ), keeping key facility codes (e.g. Gate A, Section N1, Counter B) clear. If any safety term lacks a verified translation, state it clearly in English alongside Odia.'
        : 'Respond in clear, helpful, concise English.';

    const systemInstruction = `You are FanWay Concierge, the intelligent match-day assistant for ${context.venueConfig.name} (${context.venueConfig.city}).
Current Active Event: ${context.activeEvent.title} (${context.activeEvent.sport.toUpperCase()}) — Status: ${context.activeEvent.status}, ${context.activeEvent.matchPhase}. Next break in ${context.activeEvent.nextBreakInMinutes} minutes (${context.activeEvent.breakLabel}).
Fan's Verified Ticket & Seat: Ticket ID ${context.fanProfile.ticketId || 'Demo Pass'} (Transaction ${context.fanProfile.transactionId || 'N/A'}), Holder: ${context.fanProfile.holderName || 'Spectator'}, Tier: ${context.fanProfile.tier || 'Standard'}, ${context.fanProfile.gate}, ${context.fanProfile.section}, ${context.fanProfile.row}, ${context.fanProfile.seat} (Current Map Node: ${userLoc.name}, Accessible Route Preference: ${context.fanProfile.preferAccessibleRoutes ? 'Yes' : 'No'}).
Unlocked Ticket Services: ${(context.fanProfile.includedServices || []).join('; ')}.

STRICT RELIABILITY & GROUNDING RULES:
1. ALWAYS use the provided tools to look up venue locations, washrooms, food stalls, menu prices, queue estimates, walking routes, match info, or official announcements.
2. NEVER invent facilities, opening hours, menu items, prices, queue times, or emergency instructions that are not in the tool data.
3. Explicitly mention the data source and last-updated timestamp when giving operational estimates (e.g., "Simulated heuristic estimate, updated 1 min ago" or "Operator verified, updated 1 min ago").
4. When a fan asks what they can do in a short time window (e.g., "I have 10 minutes before play resumes"), compare total round-trip walking time + estimated queue wait time so they don't miss the match!
5. Never override official emergency instructions. Always remind fans that for life-threatening emergencies they should contact the nearest steward or call ${context.venueConfig.emergencyPhone}.
6. ${languageInstruction}`;

    const contents: any[] = [];
    for (const h of history.slice(-6)) {
      contents.push({
        role: h.role,
        parts: [{ text: h.text }],
      });
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const executedTools: { name: string; args: any; summary: string }[] = [];
    const clientActions: any[] = [];

    let response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: conciergeTools }],
        temperature: 0.2,
      },
    });

    // Handle up to 3 rounds of tool calls
    let loops = 0;
    while (response.functionCalls && response.functionCalls.length > 0 && loops < 3) {
      loops++;
      const modelTurnContent = response.candidates?.[0]?.content;
      if (modelTurnContent) {
        contents.push(modelTurnContent);
      }

      const functionResponseParts: any[] = [];
      for (const call of response.functionCalls) {
        const toolName = call.name || 'unknown_tool';
        const toolArgs = (call.args as Record<string, any>) || {};
        const { result, clientAction } = executeConciergeTool(toolName, toolArgs, context);

        executedTools.push({
          name: toolName,
          args: toolArgs,
          summary: `Executed ${toolName}`,
        });
        if (clientAction) {
          clientActions.push(clientAction);
        }

        functionResponseParts.push({
          functionResponse: {
            name: toolName,
            id: call.id,
            response: result,
          },
        });
      }

      contents.push({
        role: 'user',
        parts: functionResponseParts,
      });

      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: conciergeTools }],
          temperature: 0.2,
        },
      });
    }

    const replyText =
      response.text ||
      'I retrieved the latest venue data for your request. Please check the highlighted details above.';

    res.json({
      reply: replyText,
      executedTools,
      clientActions,
      sourceTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  } catch (err: any) {
    console.error('Gemini Concierge Error:', err);
    res.status(500).json({
      error: err?.message || 'Failed to communicate with FanWay AI Concierge.',
    });
  }
});

async function startServer() {
  const PORT = 3000;
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FanWay Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
