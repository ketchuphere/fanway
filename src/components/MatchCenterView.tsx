import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Trophy,
  Clock,
  CloudSun,
  Megaphone,
  Calendar,
  Utensils,
  MapPin,
  CheckCircle2,
  Flame,
  Zap,
} from 'lucide-react';
import { useStadium } from '../context/StadiumContext';

interface DeliveryCommentary {
  id: string;
  over: string; // e.g. "18.3"
  overNum: number;
  ballInOver: number;
  runs: number;
  isWicket: boolean;
  wicketDetail?: string;
  isBoundary: boolean;
  boundaryType?: 'four' | 'six';
  distanceMeters?: number;
  bowler: string;
  batsman: string;
  shotType?: string;
  speedKph?: number;
  headline: string;
  commentary: string;
  timestamp: string;
}

const INITIAL_DELIVERIES: DeliveryCommentary[] = [
  {
    id: 'ball-18-2',
    over: '18.2',
    overNum: 18,
    ballInOver: 2,
    runs: 4,
    isWicket: false,
    isBoundary: true,
    boundaryType: 'four',
    bowler: 'M. Pathirana',
    batsman: 'Suryakumar Yadav',
    shotType: 'Late Cut / Backward Point',
    speedKph: 146.4,
    headline: 'FOUR! Sliced with razor precision behind point!',
    commentary:
      'Pathirana angles it across off at 146 km/h. SKY opens the face of the bat at the very last microsecond, gliding it right between backward point and short third. The Wankhede turf is lightning fast tonight!',
    timestamp: 'Just now',
  },
  {
    id: 'ball-18-1',
    over: '18.1',
    overNum: 18,
    ballInOver: 1,
    runs: 1,
    isWicket: false,
    isBoundary: false,
    bowler: 'M. Pathirana',
    batsman: 'Tilak Varma',
    shotType: 'Slingy Yorker / Mid-Off',
    speedKph: 148.8,
    headline: '1 RUN. Searing yorker jammed to mid-off',
    commentary:
      'Slingy toe-crusher right on middle stump! Tilak does remarkably well to get bat down in time and squirts it away to mid-off for a hurried single to get Suryakumar on strike.',
    timestamp: '1m ago',
  },
  {
    id: 'ball-17-6',
    over: '17.6',
    overNum: 17,
    ballInOver: 6,
    runs: 1,
    isWicket: false,
    isBoundary: false,
    bowler: 'D. Chahar',
    batsman: 'Tilak Varma',
    shotType: 'Drive to Long-Off',
    speedKph: 132.5,
    headline: '1 RUN. Tilak pushes down the ground, retaining strike',
    commentary:
      'Length on the stumps, driven straight down the ground to long-off. 15 runs come off the 17th over, shifting complete momentum back to Mumbai Indians!',
    timestamp: '2m ago',
  },
  {
    id: 'ball-17-5',
    over: '17.5',
    overNum: 17,
    ballInOver: 5,
    runs: 2,
    isWicket: false,
    isBoundary: false,
    bowler: 'D. Chahar',
    batsman: 'Tilak Varma',
    shotType: 'Flick to Deep Mid-Wicket',
    speedKph: 128.0,
    headline: '2 RUNS. Energetic sprinting between wickets',
    commentary:
      'Fuller onto the pads, whipped away into the vast gap between deep mid-wicket and wide long-on. Tilak calls early for the second and beats Jadeja’s throw comfortably.',
    timestamp: '2m ago',
  },
  {
    id: 'ball-17-4',
    over: '17.4',
    overNum: 17,
    ballInOver: 4,
    runs: 1,
    isWicket: false,
    isBoundary: false,
    bowler: 'D. Chahar',
    batsman: 'Suryakumar Yadav',
    shotType: 'Cover Jam',
    speedKph: 135.2,
    headline: '1 RUN. Yorker dug out to extra cover',
    commentary:
      'Attempted yorker outside off, squeezed down towards cover. Good composure from Chahar to deny the boundary this time.',
    timestamp: '3m ago',
  },
  {
    id: 'ball-17-3',
    over: '17.3',
    overNum: 17,
    ballInOver: 3,
    runs: 6,
    isWicket: false,
    isBoundary: true,
    boundaryType: 'six',
    distanceMeters: 94,
    bowler: 'D. Chahar',
    batsman: 'Suryakumar Yadav',
    shotType: 'Lofted Inside-Out / Extra Cover',
    speedKph: 130.6,
    headline: 'SIX! 94m Inside-Out Masterclass over Extra Cover!',
    commentary:
      'OH MY WORD! Pure swagger from Suryakumar! Clears his front leg, creates room, and lofts a full delivery inside-out high over deep extra cover. Sails into the lower tier of Garware Stand!',
    timestamp: '3m ago',
  },
  {
    id: 'ball-17-2',
    over: '17.2',
    overNum: 17,
    ballInOver: 2,
    runs: 4,
    isWicket: false,
    isBoundary: true,
    boundaryType: 'four',
    bowler: 'D. Chahar',
    batsman: 'Suryakumar Yadav',
    shotType: 'Ramp over Fine Leg',
    speedKph: 134.1,
    headline: 'FOUR! Audacious scoop over Dhoni’s head!',
    commentary:
      'Slower ball on a length, SKY pre-meditates the ramp, gets underneath the bounce and flips it gracefully over MS Dhoni for four! Wankhede is on its feet chanting “SURYA! SURYA!”',
    timestamp: '4m ago',
  },
  {
    id: 'ball-17-1',
    over: '17.1',
    overNum: 17,
    ballInOver: 1,
    runs: 1,
    isWicket: false,
    isBoundary: false,
    bowler: 'D. Chahar',
    batsman: 'Tilak Varma',
    shotType: 'Nudge to Long-On',
    speedKph: 131.0,
    headline: '1 RUN. Controlled nudge to get Surya back on strike',
    commentary:
      'Chahar starts the 18th over from the Tata End. Good length on middle, eased gently to long-on to turn over the strike.',
    timestamp: '4m ago',
  },
];

// Scripted future death-overs deliveries for realistic live simulation
const UPCOMING_DELIVERIES: Omit<DeliveryCommentary, 'id' | 'timestamp'>[] = [
  {
    over: '18.3',
    overNum: 18,
    ballInOver: 3,
    runs: 6,
    isWicket: false,
    isBoundary: true,
    boundaryType: 'six',
    distanceMeters: 102,
    bowler: 'M. Pathirana',
    batsman: 'Suryakumar Yadav',
    shotType: 'Supla Shot / Deep Fine Leg',
    speedKph: 147.1,
    headline: 'SIX! 102 METERS! High into the Sachin Tendulkar Stand!',
    commentary:
      'ABSOLUTELY COLOSSAL! Pathirana bowls a 147 km/h yorker attempt on the pads, SKY crouches and scoops it 102 meters all the way into the second tier! The Marine Drive sea breeze cannot stop this missile!',
  },
  {
    over: '18.4',
    overNum: 18,
    ballInOver: 4,
    runs: 0,
    isWicket: false,
    isBoundary: false,
    bowler: 'M. Pathirana',
    batsman: 'Suryakumar Yadav',
    shotType: 'Block / Back to Bowler',
    speedKph: 149.8,
    headline: 'DOT BALL. Blistering 150 km/h yorker dug out',
    commentary:
      'Fierce comeback from the young slinger! Uncorks a 149.8 km/h searing yorker right at the base of off stump. SKY jams his bat down and can only dig it back down the pitch. High-intensity cricket!',
  },
  {
    over: '18.5',
    overNum: 18,
    ballInOver: 5,
    runs: 4,
    isWicket: false,
    isBoundary: true,
    boundaryType: 'four',
    bowler: 'M. Pathirana',
    batsman: 'Suryakumar Yadav',
    shotType: 'Square Drive / Point',
    speedKph: 138.5,
    headline: 'FOUR! Slower off-cutter smashed through deep point!',
    commentary:
      'Pathirana attempts the slower off-cutter, but SKY reads the seam out of the hand. Backs away and slaps it with venom past backward point. The fielder at deep cover had no chance!',
  },
  {
    over: '18.6',
    overNum: 18,
    ballInOver: 6,
    runs: 1,
    isWicket: false,
    isBoundary: false,
    bowler: 'M. Pathirana',
    batsman: 'Suryakumar Yadav',
    shotType: 'Pull to Deep Square Leg',
    speedKph: 145.0,
    headline: '1 RUN. End of Over 18 (16 runs scored) · MI 213/4',
    commentary:
      'Banged in short, SKY controls the swivel pull to deep square leg and scampers across for one to retain strike for the final 20th over! Wankhede decibel meter hits 109 dB!',
  },
  {
    over: '19.1',
    overNum: 19,
    ballInOver: 1,
    runs: 6,
    isWicket: false,
    isBoundary: true,
    boundaryType: 'six',
    distanceMeters: 98,
    bowler: 'M. Theekshana',
    batsman: 'Suryakumar Yadav',
    shotType: 'Lofted Sweep / Mid-Wicket',
    speedKph: 104.2,
    headline: 'SIX! Swept high into the night sky over Mid-Wicket!',
    commentary:
      'Theekshana called to bowl the final over! Surya goes down on one knee immediately and deposits the off-break 98 meters into the roaring Sunil Gavaskar Stand! Surya moves to 85* off 38!',
  },
  {
    over: '19.2',
    overNum: 19,
    ballInOver: 2,
    runs: 1,
    isWicket: false,
    isBoundary: false,
    bowler: 'M. Theekshana',
    batsman: 'Suryakumar Yadav',
    shotType: 'Flat Push to Long-Off',
    speedKph: 101.0,
    headline: '1 RUN. Carrom ball pushed down to long-off',
    commentary:
      'Clever carrom ball drifting away outside off, SKY reaches out and knocks it down to long-off to bring Tilak Varma on strike.',
  },
  {
    over: '19.3',
    overNum: 19,
    ballInOver: 3,
    runs: 6,
    isWicket: false,
    isBoundary: true,
    boundaryType: 'six',
    distanceMeters: 92,
    bowler: 'M. Theekshana',
    batsman: 'Tilak Varma',
    shotType: 'Down the Ground / Sight Screen',
    speedKph: 106.5,
    headline: 'SIX! Tilak Varma hammers it straight back over the bowler!',
    commentary:
      'MASSIVE STRIKE! Right in the slot, Tilak clears his front leg and swings cleanly through the line. The ball crashes flush into the electronic sight screen! MI crossing 225 in style!',
  },
  {
    over: '19.4',
    overNum: 19,
    ballInOver: 4,
    runs: 0,
    isWicket: true,
    wicketDetail: 'c Jadeja b Theekshana 31 (14b)',
    isBoundary: false,
    bowler: 'M. Theekshana',
    batsman: 'Tilak Varma',
    shotType: 'Sliced Drive / Long-Off',
    speedKph: 103.8,
    headline: 'WICKET! Caught by Jadeja at long-off! Tilak departs for 31!',
    commentary:
      'OUT! Tilak goes for another maximum over long-off, but gets it high off the toe-end. Ravindra Jadeja tracks it calmly across the boundary and takes a textbook catch! Standing ovation from the dugout.',
  },
  {
    over: '19.5',
    overNum: 19,
    ballInOver: 5,
    runs: 4,
    isWicket: false,
    isBoundary: true,
    boundaryType: 'four',
    bowler: 'M. Theekshana',
    batsman: 'Tim David',
    shotType: 'Brutal Pull / Mid-Wicket',
    speedKph: 105.0,
    headline: 'FOUR! Tim David off the mark with brute power!',
    commentary:
      'Shorter and wider, Tim David rocks back instantly and bludgeons a flat pull shot between deep square leg and wide mid-wicket. One bounce into the LED boundary boards!',
  },
  {
    over: '19.6',
    overNum: 19,
    ballInOver: 6,
    runs: 2,
    isWicket: false,
    isBoundary: false,
    bowler: 'M. Theekshana',
    batsman: 'Tim David',
    shotType: 'Scrambled Two / Wide Long-On',
    speedKph: 102.5,
    headline: '2 RUNS! Final ball scrambled! MI finish on 232/5 in 20 Overs!',
    commentary:
      'Full and straight, David drills it down to long-on. They turn aggressively for the second, Dhoni collects the throw at the stumps and takes the bails off, but David’s dive gets home safely! Innings concluded to a thunderous Wankhede standing ovation!',
  },
];

export const MatchCenterView: React.FC = () => {
  const {
    activeEvent,
    venueConfig,
    announcements,
    setFanTab,
    updateEvent,
  } = useStadium();

  // Commentary deliveries state
  const [deliveries, setDeliveries] = useState<DeliveryCommentary[]>(INITIAL_DELIVERIES);
  const [upcomingIndex, setUpcomingIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [filter, setFilter] = useState<'all' | 'boundaries' | 'wickets'>('all');
  const [crowdDecibels, setCrowdDecibels] = useState<number>(106);

  // Batters and bowler dynamic tracking
  const [scoreState, setScoreState] = useState({
    runs: 198,
    wickets: 4,
    overs: '18.2',
    currentRunRate: '10.80',
    striker: { name: 'Suryakumar Yadav', runs: 68, balls: 34, fours: 6, sixes: 4 },
    nonStriker: { name: 'Tilak Varma', runs: 24, balls: 12, fours: 2, sixes: 1 },
    bowler: { name: 'M. Pathirana', overs: '3.2', maidens: 0, runs: 32, wickets: 2, econ: '9.60' },
  });

  const latestDelivery = deliveries[0];

  // Sound synthesizer for boundary / wicket cues
  const playSoundCue = (type: 'boundary' | 'wicket' | 'normal') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'boundary') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);
        osc.start();
        osc.stop(ctx.currentTime + 0.28);
      } else if (type === 'wicket') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.16, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else {
        osc.frequency.setValueAtTime(659.25, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      }
    } catch {
      // Audio autoplay policy fallback
    }
  };

  // Deliver next ball in live simulation
  const deliverNextBall = () => {
    if (upcomingIndex >= UPCOMING_DELIVERIES.length) {
      // Reset loop for continuous live engagement
      setUpcomingIndex(0);
      setDeliveries(INITIAL_DELIVERIES);
      setScoreState({
        runs: 198,
        wickets: 4,
        overs: '18.2',
        currentRunRate: '10.80',
        striker: { name: 'Suryakumar Yadav', runs: 68, balls: 34, fours: 6, sixes: 4 },
        nonStriker: { name: 'Tilak Varma', runs: 24, balls: 12, fours: 2, sixes: 1 },
        bowler: { name: 'M. Pathirana', overs: '3.2', maidens: 0, runs: 32, wickets: 2, econ: '9.60' },
      });
      return;
    }

    const nextScript = UPCOMING_DELIVERIES[upcomingIndex];
    setUpcomingIndex((prev) => prev + 1);

    const newDelivery: DeliveryCommentary = {
      ...nextScript,
      id: `ball-${nextScript.over}-${Date.now()}`,
      timestamp: 'Just now',
    };

    // Calculate score progression
    const newTotalRuns = scoreState.runs + newDelivery.runs;
    const newWickets = scoreState.wickets + (newDelivery.isWicket ? 1 : 0);
    const newOvers = newDelivery.over;

    // Decibels surge during boundary or wicket
    const newDecibels = newDelivery.isBoundary || newDelivery.isWicket ? 112 : Math.floor(102 + Math.random() * 5);
    setCrowdDecibels(newDecibels);

    // Audio cue
    if (newDelivery.isBoundary) playSoundCue('boundary');
    else if (newDelivery.isWicket) playSoundCue('wicket');
    else playSoundCue('normal');

    // Update batters & bowlers state
    setScoreState((prev) => {
      const isStrikerSurya = prev.striker.name === 'Suryakumar Yadav';
      let nextStriker = { ...prev.striker };
      let nextNonStriker = { ...prev.nonStriker };

      if (newDelivery.batsman === nextStriker.name) {
        nextStriker.runs += newDelivery.runs;
        nextStriker.balls += 1;
        if (newDelivery.boundaryType === 'four') nextStriker.fours += 1;
        if (newDelivery.boundaryType === 'six') nextStriker.sixes += 1;
      } else {
        nextNonStriker.runs += newDelivery.runs;
        nextNonStriker.balls += 1;
        if (newDelivery.boundaryType === 'four') nextNonStriker.fours += 1;
        if (newDelivery.boundaryType === 'six') nextNonStriker.sixes += 1;
      }

      // If wicket of Tilak, replace with Tim David
      if (newDelivery.isWicket && newDelivery.batsman === 'Tilak Varma') {
        if (nextStriker.name === 'Tilak Varma') {
          nextStriker = { name: 'Tim David', runs: 0, balls: 0, fours: 0, sixes: 0 };
        } else {
          nextNonStriker = { name: 'Tim David', runs: 0, balls: 0, fours: 0, sixes: 0 };
        }
      }

      // Strike rotation on odd runs
      if (newDelivery.runs % 2 !== 0 && !newDelivery.isWicket) {
        const temp = nextStriker;
        nextStriker = nextNonStriker;
        nextNonStriker = temp;
      }

      // Parse overs for bowler
      const parts = newOvers.split('.');
      const overNumInt = parseInt(parts[0], 10);
      const ballNumInt = parseInt(parts[1], 10);
      const totalBalls = overNumInt * 6 + ballNumInt;
      const crr = totalBalls > 0 ? ((newTotalRuns / totalBalls) * 6).toFixed(2) : '10.80';

      return {
        ...prev,
        runs: newTotalRuns,
        wickets: newWickets,
        overs: newOvers,
        currentRunRate: crr,
        striker: nextStriker,
        nonStriker: nextNonStriker,
        bowler: {
          ...prev.bowler,
          name: newDelivery.bowler,
          runs: prev.bowler.runs + newDelivery.runs,
          wickets: prev.bowler.wickets + (newDelivery.isWicket ? 1 : 0),
          overs: newDelivery.over,
        },
      };
    });

    setDeliveries((prev) => [newDelivery, ...prev]);

    // Sync score to activeEvent in global context
    if (activeEvent?.id) {
      updateEvent(activeEvent.id, {
        teamA: {
          ...activeEvent.teamA,
          score: `${newTotalRuns}/${newWickets}`,
          detail: `${newOvers} Overs (RR: ${((newTotalRuns / 19) * 6).toFixed(2)}) · Suryakumar Yadav ${scoreState.striker.runs}*, Tilak Varma ${scoreState.nonStriker.runs}`,
        },
        status: `1st Innings · Live (Over ${newOvers})`,
      });
    }
  };

  // Real-time ticking effect: advances ball every 6 seconds when playing
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      deliverNextBall();
    }, 6000);
    return () => clearInterval(timer);
  }, [isPlaying, upcomingIndex, scoreState]);

  // Filtered commentary deliveries
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((d) => {
      if (filter === 'boundaries') return d.isBoundary;
      if (filter === 'wickets') return d.isWicket;
      return true;
    });
  }, [deliveries, filter]);

  // Recent over pills (last 6-8 deliveries)
  const recentBalls = useMemo(() => {
    return deliveries.slice(0, 8).reverse();
  }, [deliveries]);

  return (
    <div className="space-y-6">
      {/* 1. REAL-TIME MATCH SCORE & COMMENTARY TICKER STRIP */}
      <div className="bg-[#111827] border-2 border-[#84CC16]/40 rounded-2xl p-4 sm:p-5 shadow-lg shadow-[#84CC16]/5 relative overflow-hidden">
        {/* Glowing live gradient bar at the top edge */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#84CC16] via-[#38BDF8] to-[#84CC16] animate-pulse" />

        {/* Real-time Ticker Score Strip */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Main Score Pill */}
          <div className="md:col-span-4 bg-[#0B1120] border border-[#1E293B] rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-medium text-[#94A3B8] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#004BA0] shrink-0" />
                <span className="text-white font-bold">Mumbai Indians</span>
                <span className="text-[#84CC16] font-mono-tabular">({scoreState.overs} ov)</span>
              </div>
              <div className="text-3xl font-bold font-mono-tabular text-white tracking-tight mt-0.5">
                {scoreState.runs}
                <span className="text-[#84CC16]">/{scoreState.wickets}</span>
              </div>
            </div>
            <div className="text-right text-xs">
              <div className="text-[#94A3B8] text-[11px]">Run Rate</div>
              <div className="text-base font-bold font-mono-tabular text-[#84CC16]">{scoreState.currentRunRate}</div>
              <div className="text-[10px] text-[#64748B]">Proj: {Math.round(parseFloat(scoreState.currentRunRate) * 20)}</div>
            </div>
          </div>

          {/* Current Over Deliveries Carousel */}
          <div className="md:col-span-8 flex flex-col justify-center space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#94A3B8] text-[11px] font-medium">
                Recent Deliveries (Over {scoreState.overs.split('.')[0]}):
              </span>
              <span className="text-[11px] text-[#84CC16] font-mono-tabular">
                Latest: {latestDelivery.over} ({latestDelivery.runs} {latestDelivery.isWicket ? 'Wicket' : 'runs'})
              </span>
            </div>

            {/* Ball-by-ball pill sequence */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {recentBalls.map((b) => {
                const isSix = b.boundaryType === 'six';
                const isFour = b.boundaryType === 'four';
                const isWicket = b.isWicket;

                return (
                  <div
                    key={b.id}
                    className={`min-w-[34px] h-[34px] rounded-lg flex flex-col items-center justify-center font-mono-tabular text-xs font-bold border transition-all shrink-0 ${
                      isSix
                        ? 'bg-[#84CC16] text-[#0B1120] border-[#84CC16] shadow-sm'
                        : isFour
                        ? 'bg-[#84CC16]/20 text-[#84CC16] border-[#84CC16]/60'
                        : isWicket
                        ? 'bg-[#EF4444] text-white border-[#EF4444] animate-pulse'
                        : b.runs === 0
                        ? 'bg-[#0B1120] text-[#64748B] border-[#1E293B]'
                        : 'bg-[#1E293B] text-white border-[#334155]'
                    }`}
                    title={`${b.over} - ${b.headline}`}
                  >
                    <span>{isWicket ? 'W' : b.runs}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Headline Commentary Marquee Banner */}
        <div className="mt-3.5 bg-[#0B1120] border border-[#1E293B] rounded-xl p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#84CC16]/15 border border-[#84CC16]/40 flex items-center justify-center text-[#84CC16] shrink-0 font-mono-tabular font-bold text-xs">
              {latestDelivery.over}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block truncate">
                {latestDelivery.headline}
              </span>
              <span className="text-[11px] text-[#94A3B8] block truncate">
                {latestDelivery.commentary}
              </span>
            </div>
          </div>
          <div className="shrink-0 hidden sm:flex items-center gap-1.5 text-[11px] text-[#84CC16] font-mono-tabular bg-[#84CC16]/10 px-2 py-1 rounded-md">
            <span>{latestDelivery.speedKph || 144} km/h</span>
          </div>
        </div>
      </div>

      {/* 3. Batsmen on Crease & Current Bowler Spell Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 bg-[#111827] border border-[#1E293B] rounded-2xl p-6">
          <div className="flex items-center justify-between pb-3.5 border-b border-[#1E293B]">
            <h2 className="text-sm font-bold text-white font-display flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#84CC16]" />
              <span>Current Batters & Bowler Spell</span>
            </h2>
            <span className="text-xs text-[#94A3B8] font-mono-tabular">
              Partnership: 48* (22 balls)
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Batter 1: Striker */}
            <div className="bg-[#0B1120] border border-[#84CC16]/30 rounded-xl p-4 relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#84CC16] flex items-center gap-1">
                  <span>{scoreState.striker.name}</span>
                  <span className="text-[10px] px-1 rounded bg-[#84CC16] text-[#0B1120] font-bold">ON STRIKE</span>
                </span>
                <span className="text-xs font-mono-tabular text-[#94A3B8]">
                  SR: {scoreState.striker.balls > 0 ? ((scoreState.striker.runs / scoreState.striker.balls) * 100).toFixed(1) : 0}
                </span>
              </div>
              <div className="text-2xl font-bold font-mono-tabular text-white mt-1">
                {scoreState.striker.runs}
                <span className="text-xs text-[#94A3B8] font-normal"> ({scoreState.striker.balls}b)</span>
              </div>
              <div className="text-[11px] text-[#94A3B8] mt-1 flex items-center gap-3 font-mono-tabular">
                <span>4s: {scoreState.striker.fours}</span>
                <span>6s: {scoreState.striker.sixes}</span>
                <span className="text-[#84CC16]">50+ Milestone</span>
              </div>
            </div>

            {/* Batter 2: Non-Striker */}
            <div className="bg-[#0B1120] border border-[#1E293B] rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">
                  {scoreState.nonStriker.name}
                </span>
                <span className="text-xs font-mono-tabular text-[#94A3B8]">
                  SR: {scoreState.nonStriker.balls > 0 ? ((scoreState.nonStriker.runs / scoreState.nonStriker.balls) * 100).toFixed(1) : 0}
                </span>
              </div>
              <div className="text-2xl font-bold font-mono-tabular text-white mt-1">
                {scoreState.nonStriker.runs}
                <span className="text-xs text-[#94A3B8] font-normal"> ({scoreState.nonStriker.balls}b)</span>
              </div>
              <div className="text-[11px] text-[#94A3B8] mt-1 flex items-center gap-3 font-mono-tabular">
                <span>4s: {scoreState.nonStriker.fours}</span>
                <span>6s: {scoreState.nonStriker.sixes}</span>
              </div>
            </div>
          </div>

          {/* Bowler Spell Row */}
          <div className="mt-4 p-3 bg-[#0B1120] border border-[#1E293B] rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold">{scoreState.bowler.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1E293B] text-[#CBD5E1]">Bowling</span>
            </div>
            <div className="flex items-center gap-4 font-mono-tabular text-[#CBD5E1]">
              <span>Overs: <strong className="text-white">{scoreState.bowler.overs}</strong></span>
              <span>Wickets: <strong className="text-[#EF4444]">{scoreState.bowler.wickets}</strong></span>
              <span>Runs: <strong className="text-white">{scoreState.bowler.runs}</strong></span>
              <span>Econ: <strong className="text-[#84CC16]">{scoreState.bowler.econ}</strong></span>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Concourse Break Planner & Quick Actions */}
        <div className="lg:col-span-4 bg-[#111827] border border-[#1E293B] rounded-2xl p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-[#84CC16] font-semibold">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>Interval & Break Planner</span>
              </span>
              <span className="font-mono-tabular">In {activeEvent.nextBreakInMinutes} mins</span>
            </div>

            <div className="bg-[#0B1120] border border-[#1E293B] rounded-xl p-4 space-y-2">
              <div className="text-xs text-[#94A3B8]">Upcoming Break</div>
              <div className="text-base font-bold text-white font-display">
                {activeEvent.breakLabel}
              </div>
              <p className="text-xs text-[#CBD5E1] leading-relaxed">
                Concourse queues surge right as the innings break sounds. Heading out 3 minutes early or choosing Counter B saves ~8 minutes.
              </p>
            </div>

            <div className="bg-[#0B1120] border border-[#1E293B] rounded-xl p-4 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                <CloudSun className="w-4 h-4 text-[#84CC16]" />
                <span>Arena Weather Conditions</span>
              </div>
              <div className="text-sm font-semibold text-white font-mono-tabular">
                {venueConfig.temperatureC}°C · Humidity {venueConfig.humidityPercent}%
              </div>
              <div className="text-xs text-[#94A3B8]">{venueConfig.weatherSummary}</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFanTab('food')}
                className="py-2 px-3 bg-[#0B1120] hover:bg-[#1E293B] text-white border border-[#1E293B] rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Utensils className="w-3.5 h-3.5 text-[#84CC16]" />
                <span>Pre-Order Food</span>
              </button>
              <button
                onClick={() => setFanTab('map')}
                className="py-2 px-3 bg-[#0B1120] hover:bg-[#1E293B] text-white border border-[#1E293B] rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Concourse Map</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BALL-BY-BALL COMMENTARY STREAM WITH FILTERS */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1E293B]">
          <div>
            <h2 className="text-base font-bold text-white font-display flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#84CC16]" />
              <span>Real-Time Ball-by-Ball Commentary Feed</span>
            </h2>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Live play-by-play commentary with shot trajectory, bowler speeds, and boundary telemetry.
            </p>
          </div>

          {/* Commentary Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[#0B1120] border border-[#1E293B] rounded-xl">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                filter === 'all'
                  ? 'bg-[#84CC16] text-[#0B1120] font-bold'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              All Deliveries ({deliveries.length})
            </button>
            <button
              onClick={() => setFilter('boundaries')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                filter === 'boundaries'
                  ? 'bg-[#84CC16] text-[#0B1120] font-bold'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              Boundaries ({deliveries.filter((d) => d.isBoundary).length})
            </button>
            <button
              onClick={() => setFilter('wickets')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                filter === 'wickets'
                  ? 'bg-[#EF4444] text-white font-bold'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              Wickets ({deliveries.filter((d) => d.isWicket).length})
            </button>
          </div>
        </div>

        {/* Deliveries Timeline List */}
        <div className="divide-y divide-[#1E293B] mt-2 max-h-[580px] overflow-y-auto pr-1">
          {filteredDeliveries.map((delivery) => {
            const isSix = delivery.boundaryType === 'six';
            const isFour = delivery.boundaryType === 'four';
            const isWicket = delivery.isWicket;

            return (
              <div
                key={delivery.id}
                className="py-4 hover:bg-[#0B1120]/40 transition-colors rounded-xl px-2.5 space-y-1.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {/* Over Ball Badge */}
                    <span className="font-mono-tabular font-bold text-xs px-2.5 py-1 rounded-lg bg-[#0B1120] border border-[#1E293B] text-white">
                      {delivery.over}
                    </span>

                    {/* Result Badge */}
                    {isSix && (
                      <span className="px-2.5 py-0.5 rounded-md bg-[#84CC16] text-[#0B1120] text-xs font-bold font-mono-tabular">
                        SIX ({delivery.distanceMeters || 96}m)
                      </span>
                    )}
                    {isFour && (
                      <span className="px-2.5 py-0.5 rounded-md bg-[#84CC16]/20 text-[#84CC16] border border-[#84CC16]/40 text-xs font-bold font-mono-tabular">
                        FOUR
                      </span>
                    )}
                    {isWicket && (
                      <span className="px-2.5 py-0.5 rounded-md bg-[#EF4444] text-white text-xs font-bold uppercase tracking-wider animate-pulse">
                        WICKET
                      </span>
                    )}
                    {!isSix && !isFour && !isWicket && (
                      <span className="px-2 py-0.5 rounded-md bg-[#1E293B] text-[#CBD5E1] text-xs font-medium font-mono-tabular">
                        {delivery.runs} {delivery.runs === 1 ? 'Run' : delivery.runs === 0 ? 'Dot' : 'Runs'}
                      </span>
                    )}

                    <span className="text-xs font-semibold text-white">
                      {delivery.bowler} to {delivery.batsman}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                    {delivery.speedKph && (
                      <span className="font-mono-tabular text-[11px] text-[#64748B]">
                        {delivery.speedKph} km/h
                      </span>
                    )}
                    {delivery.shotType && (
                      <span className="hidden md:inline px-2 py-0.5 rounded bg-[#0B1120] border border-[#1E293B] text-[10px] text-[#CBD5E1]">
                        {delivery.shotType}
                      </span>
                    )}
                    <span className="text-[11px]">{delivery.timestamp}</span>
                  </div>
                </div>

                {/* Headline Text */}
                <div className="text-sm font-semibold text-white">
                  {delivery.headline}
                </div>

                {/* Commentary Narrative */}
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  {delivery.commentary}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Match Statistics Comparison Table */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6">
        <h2 className="text-sm font-bold text-white font-display mb-3">
          Key Match Telemetry (Simulated Demo Fixture)
        </h2>
        <div className="divide-y divide-[#1E293B]">
          {activeEvent.keyStats.map((st, idx) => (
            <div
              key={idx}
              className="py-2.5 grid grid-cols-3 items-center text-xs"
            >
              <span className="font-mono-tabular font-semibold text-white">
                {st.teamAVal}
              </span>
              <span className="text-center text-[#94A3B8]">{st.label}</span>
              <span className="text-right font-mono-tabular font-semibold text-white">
                {st.teamBVal}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Match-Day Schedule Timings (6 Cols) + Venue Announcements (6 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-[#111827] border border-[#1E293B] rounded-2xl p-6">
          <div className="flex items-center gap-2 pb-4 border-b border-[#1E293B]">
            <Calendar className="w-4 h-4 text-[#84CC16]" />
            <h2 className="text-base font-bold text-white font-display">
              Match-Day Schedule & Key Timings
            </h2>
          </div>

          <div className="divide-y divide-[#1E293B] mt-2">
            {activeEvent.keyTimings.map((item, idx) => (
              <div
                key={idx}
                className="py-3 flex items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono-tabular font-bold text-white w-14">
                    {item.time}
                  </span>
                  <span
                    className={
                      item.status === 'active'
                        ? 'text-[#84CC16] font-semibold'
                        : item.status === 'completed'
                        ? 'text-[#64748B] line-through'
                        : 'text-[#F8FAFC]'
                    }
                  >
                    {item.label}
                  </span>
                </div>
                <span className="text-[11px] text-[#94A3B8] capitalize flex items-center gap-1">
                  {item.status === 'completed' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#64748B]" />
                  )}
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-6 bg-[#111827] border border-[#1E293B] rounded-2xl p-6">
          <div className="flex items-center gap-2 pb-4 border-b border-[#1E293B]">
            <Megaphone className="w-4 h-4 text-[#84CC16]" />
            <h2 className="text-base font-bold text-white font-display">
              Match-Day Operational Notices
            </h2>
          </div>
          <div className="divide-y divide-[#1E293B] mt-2">
            {announcements.map((ann) => (
              <div key={ann.id} className="py-3.5 space-y-1">
                <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                  <span className="text-[#84CC16] font-medium">{ann.category}</span>
                  <span>{ann.timestamp}</span>
                </div>
                <div className="text-sm font-semibold text-white">{ann.title}</div>
                <p className="text-xs text-[#CBD5E1]">{ann.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
