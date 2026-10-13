import type {
  VenueLocation,
  SportEvent,
  QueuePredictionResult,
  QueueStatus,
  RouteResult,
} from '../types/stadium.ts';

/**
 * Transparent, configurable queue estimation engine.
 * Explicitly calculates wait time from:
 * - Observed queue length (people in line)
 * - Number of open counters
 * - Average service time per person (seconds)
 * - Pending digital orders (for food stalls)
 * - Event break proximity multiplier (when a break is < 10 mins away, concourse surge factor applies)
 *
 * NOTE: This is a transparent statistical heuristic model (not a black-box trained neural network)
 * and is designed so a trained ML regression model can drop-in replace `predictQueueForLocation`.
 */
export function predictQueueForLocation(
  location: VenueLocation,
  allLocations: VenueLocation[],
  activeEvent?: SportEvent,
  userCurrentLocationId?: string
): QueuePredictionResult {
  if (location.status === 'Closed' || location.openCounters <= 0) {
    return {
      locationId: location.id,
      estimatedWaitMinutes: 0,
      minWaitMinutes: 0,
      maxWaitMinutes: 0,
      status: 'Closed',
      confidenceLabel: 'Verified Status · Facility Closed',
      methodLabel: 'Direct Operational Status',
      dataSource: location.dataSource,
      lastUpdated: location.lastUpdated,
    };
  }

  // Base throughput calculation: (queueLength / openCounters) * avgServiceTimeSeconds
  const effectiveCounters = Math.max(1, location.openCounters);
  const baseQueueSeconds =
    (location.observedQueueLength / effectiveCounters) * location.avgServiceTimeSeconds;

  // Pending food order backlog contribution (each pending order adds ~20s shared across counters)
  const pendingBacklogSeconds = location.pendingOrders
    ? (location.pendingOrders * 22) / effectiveCounters
    : 0;

  // Event phase surge factor: if match break is imminent (<= 8 mins), queue arrival rate rises by 18%
  const isBreakImminent = activeEvent && activeEvent.nextBreakInMinutes <= 8;
  const phaseMultiplier =
    isBreakImminent && (location.category === 'food' || location.category === 'washroom')
      ? 1.18
      : 1.0;

  const rawMinutes = ((baseQueueSeconds + pendingBacklogSeconds) * phaseMultiplier) / 60;
  const estimatedWaitMinutes = Math.max(1, Math.round(rawMinutes));

  const minWaitMinutes = Math.max(1, Math.floor(estimatedWaitMinutes * 0.8));
  const maxWaitMinutes = Math.max(minWaitMinutes + 1, Math.ceil(estimatedWaitMinutes * 1.25));

  let status: QueueStatus = 'Low';
  if (estimatedWaitMinutes >= 10 || location.status === 'Busy') {
    status = 'Busy';
  } else if (estimatedWaitMinutes >= 5) {
    status = 'Moderate';
  }

  // Determine confidence based on data source
  const confidenceLabel =
    location.dataSource === 'manual_operator'
      ? 'High Confidence (Operator Verified)'
      : location.dataSource === 'verified_config'
      ? 'Verified Static Facility'
      : 'Moderate Confidence (Simulated Heuristic)';

  const methodLabel = isBreakImminent
    ? 'Heuristic Formula (Queue/Counters + Pre-Break Surge Factor)'
    : 'Heuristic Formula (Observed Queue ÷ Open Counters × Service Rate)';

  // Find faster nearby alternative of same category if Moderate or Busy
  let alternativeFacility: QueuePredictionResult['alternativeFacility'] = undefined;
  if (status === 'Busy' || status === 'Moderate') {
    const candidates = allLocations.filter(
      (loc) =>
        loc.id !== location.id &&
        loc.category === location.category &&
        loc.status !== 'Closed' &&
        loc.openCounters > 0
    );

    let bestCandidate: { loc: VenueLocation; wait: number; walk: number } | null = null;
    const originLoc =
      allLocations.find((l) => l.id === (userCurrentLocationId || location.id)) || location;

    for (const cand of candidates) {
      const candSeconds =
        (cand.observedQueueLength / Math.max(1, cand.openCounters)) * cand.avgServiceTimeSeconds;
      const candWait = Math.max(1, Math.round(candSeconds / 60));
      if (candWait < estimatedWaitMinutes) {
        const dist = Math.hypot(cand.x - originLoc.x, cand.y - originLoc.y);
        const walkMins = Math.max(1, Math.round(dist / 120));
        if (
          !bestCandidate ||
          candWait + walkMins < bestCandidate.wait + bestCandidate.walk
        ) {
          bestCandidate = { loc: cand, wait: candWait, walk: walkMins };
        }
      }
    }

    if (bestCandidate) {
      alternativeFacility = {
        id: bestCandidate.loc.id,
        name: bestCandidate.loc.name,
        estimatedWaitMinutes: bestCandidate.wait,
        walkingMinutes: bestCandidate.walk,
      };
    }
  }

  return {
    locationId: location.id,
    estimatedWaitMinutes,
    minWaitMinutes,
    maxWaitMinutes,
    status,
    confidenceLabel,
    methodLabel,
    dataSource: location.dataSource,
    lastUpdated: location.lastUpdated,
    alternativeFacility,
  };
}

/**
 * Breadth-first / Dijkstra shortest path route calculator across the venue graph.
 * Supports step-free accessible routing when `preferAccessible` is true.
 */
export function calculateVenueRoute(
  fromId: string,
  toId: string,
  locations: VenueLocation[],
  preferAccessible: boolean = false
): RouteResult | null {
  const fromLoc = locations.find((l) => l.id === fromId);
  const toLoc = locations.find((l) => l.id === toId);
  if (!fromLoc || !toLoc) return null;

  if (fromId === toId) {
    return {
      fromId,
      fromName: fromLoc.name,
      toId,
      toName: toLoc.name,
      pathIds: [fromId],
      pathNames: [fromLoc.name],
      distanceMeters: 0,
      walkingMinutes: 0,
      isAccessibleRoute: fromLoc.accessible,
      steps: [`You are already at ${fromLoc.name}.`],
    };
  }

  const locMap = new Map<string, VenueLocation>(locations.map((l) => [l.id, l]));

  // Dijkstra's algorithm on venue graph coordinates
  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const unvisited = new Set<string>();

  for (const loc of locations) {
    distances.set(loc.id, Infinity);
    previous.set(loc.id, null);
    unvisited.add(loc.id);
  }
  distances.set(fromId, 0);

  while (unvisited.size > 0) {
    let currentId: string | null = null;
    let smallestDist = Infinity;
    for (const id of unvisited) {
      const d = distances.get(id) ?? Infinity;
      if (d < smallestDist) {
        smallestDist = d;
        currentId = id;
      }
    }

    if (!currentId || currentId === toId || smallestDist === Infinity) break;
    unvisited.delete(currentId);

    const currentLoc = locMap.get(currentId)!;
    for (const neighborId of currentLoc.connectedTo) {
      if (!unvisited.has(neighborId)) continue;
      const neighborLoc = locMap.get(neighborId);
      if (!neighborLoc) continue;

      // Penalize non-accessible intermediate nodes heavily if accessible route requested
      const accessibilityPenalty =
        preferAccessible && !neighborLoc.accessible && neighborId !== toId ? 5000 : 0;

      const pixelDist = Math.hypot(neighborLoc.x - currentLoc.x, neighborLoc.y - currentLoc.y);
      const alt = smallestDist + pixelDist + accessibilityPenalty;

      if (alt < (distances.get(neighborId) ?? Infinity)) {
        distances.set(neighborId, alt);
        previous.set(neighborId, currentId);
      }
    }
  }

  // Reconstruct path
  const pathIds: string[] = [];
  let curr: string | null = toId;
  while (curr) {
    pathIds.unshift(curr);
    curr = previous.get(curr) ?? null;
  }

  if (pathIds[0] !== fromId) {
    // Fallback direct line if disconnected
    pathIds.splice(0, pathIds.length, fromId, toId);
  }

  const pathLocs = pathIds.map((id) => locMap.get(id)!).filter(Boolean);
  let totalPixels = 0;
  for (let i = 0; i < pathLocs.length - 1; i++) {
    totalPixels += Math.hypot(
      pathLocs[i + 1].x - pathLocs[i].x,
      pathLocs[i + 1].y - pathLocs[i].y
    );
  }

  // 1 pixel ≈ 0.55 meters in our stadium schematic
  const distanceMeters = Math.max(15, Math.round(totalPixels * 0.55));
  // Average stadium concourse walking speed ~70m/min (or 55m/min for step-free accessible route)
  const speedMetersPerMin = preferAccessible ? 55 : 70;
  const walkingMinutes = Math.max(1, Math.round(distanceMeters / speedMetersPerMin));

  const isAccessibleRoute = pathLocs.every((l) => l.accessible);

  const steps: string[] = [];
  steps.push(
    `Start at ${fromLoc.name} (${fromLoc.zone} Zone · ${fromLoc.level}).`
  );
  for (let i = 1; i < pathLocs.length - 1; i++) {
    const node = pathLocs[i];
    steps.push(
      `Follow the ${node.zone} Concourse walkway past ${node.name}${
        preferAccessible && node.accessible ? ' (Step-free ramp/elevator corridor)' : ''
      }.`
    );
  }
  steps.push(
    `Arrive at ${toLoc.name} (${toLoc.zone} Zone · Approx. ${distanceMeters}m, ~${walkingMinutes} min walk).`
  );

  return {
    fromId,
    fromName: fromLoc.name,
    toId,
    toName: toLoc.name,
    pathIds,
    pathNames: pathLocs.map((l) => l.name),
    distanceMeters,
    walkingMinutes,
    isAccessibleRoute,
    steps,
  };
}
