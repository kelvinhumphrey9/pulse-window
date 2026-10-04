import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  CircleCheck,
  CircleHelp,
  CloudSun,
  Dumbbell,
  Flame,
  Footprints,
  Gauge,
  HeartPulse,
  Info,
  Layers3,
  LocateFixed,
  MapPin,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Route,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Timer,
  TrendingUp,
  Waves,
  Wind,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/AuthProvider";
import UserMenu from "@/components/UserMenu";
import { Link } from "react-router-dom";

const navItems = [
  { id: "home", label: "Today", icon: Activity },
  { id: "train", label: "Train", icon: Dumbbell },
  { id: "insights", label: "Insights", icon: BarChart3 },
  { id: "blueprint", label: "Blueprint", icon: Layers3 },
] as const;

type NavId = (typeof navItems)[number]["id"];
type WorkoutMode = "lift" | "run";
type GuestStep = "welcome" | "recommendation" | "active" | "summary" | "save-routine" | "smart-timing" | "calendar" | "notifications" | "account";
type PermissionStatus = "unknown" | "granted" | "denied";
type PermissionPrompt = "location" | null;

type PermissionState = {
  location: PermissionStatus;
  calendar: PermissionStatus;
  notifications: PermissionStatus;
};

type SavedRoutine = {
  id: string;
  mode: WorkoutMode;
  name: string;
  detail: string;
  createdAt: string;
};

type RoutePoint = {
  latitude: number;
  longitude: number;
};

const ROUTINES_STORAGE_KEY = "pulsewindow-routines";

const readSavedRoutines = (): SavedRoutine[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(ROUTINES_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const recommendation = {
  mode: "run" as WorkoutMode,
  reason: "Clear skies and 42 open minutes.",
  detail: "A light jog is the easiest win right now.",
};

const distanceBetweenPositions = (from: GeolocationPosition, to: GeolocationPosition) => {
  const earthRadius = 6371000;
  const latitudeDelta = (to.coords.latitude - from.coords.latitude) * Math.PI / 180;
  const longitudeDelta = (to.coords.longitude - from.coords.longitude) * Math.PI / 180;
  const latitudeOne = from.coords.latitude * Math.PI / 180;
  const latitudeTwo = to.coords.latitude * Math.PI / 180;
  const value = Math.sin(latitudeDelta / 2) ** 2 + Math.sin(longitudeDelta / 2) ** 2 * Math.cos(latitudeOne) * Math.cos(latitudeTwo);
  return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
};

const formatPace = (elapsedSeconds: number, miles: number) => {
  if (elapsedSeconds < 1 || miles < 0.01) return "—";
  const paceSeconds = Math.round(elapsedSeconds / miles);
  const minutes = Math.floor(paceSeconds / 60);
  const seconds = (paceSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const latitudeToTileY = (latitude: number, zoom: number) => {
  const radians = latitude * Math.PI / 180;
  return (1 - Math.log(Math.tan(radians) + 1 / Math.cos(radians)) / Math.PI) / 2 * 2 ** zoom;
};

const longitudeToTileX = (longitude: number, zoom: number) => (longitude + 180) / 360 * 2 ** zoom;

const mapPointPixels = (point: RoutePoint, zoom: number, originX: number, originY: number) => ({
  x: longitudeToTileX(point.longitude, zoom) * 256 - originX,
  y: latitudeToTileY(point.latitude, zoom) * 256 - originY,
});

const RouteMap = ({ points, active }: { points: RoutePoint[]; active?: boolean }) => {
  const zoom = 16;
  const center = points[points.length - 1] || points[0];
  const centerX = center ? longitudeToTileX(center.longitude, zoom) * 256 : 0;
  const centerY = center ? latitudeToTileY(center.latitude, zoom) * 256 : 0;
  const originX = centerX - 160;
  const originY = centerY - 85;
  const tileCenterX = center ? Math.floor(longitudeToTileX(center.longitude, zoom)) : 0;
  const tileCenterY = center ? Math.floor(latitudeToTileY(center.latitude, zoom)) : 0;
  const tileCount = 2 ** zoom;
  const tiles = points.length > 0 ? Array.from({ length: 9 }, (_, index) => {
    const offsetX = (index % 3) - 1;
    const offsetY = Math.floor(index / 3) - 1;
    const tileX = tileCenterX + offsetX;
    const tileY = tileCenterY + offsetY;
    const wrappedX = ((tileX % tileCount) + tileCount) % tileCount;
    return { tileX: wrappedX, tileY, left: tileX * 256 - originX, top: tileY * 256 - originY };
  }) : [];
  const positions = points.map((point) => mapPointPixels(point, zoom, originX, originY));
  const path = positions.map((position, index) => `${index === 0 ? "M" : "L"}${position.x} ${position.y}`).join(" ");
  const startPoint = positions[0];
  const finishPoint = positions[positions.length - 1];
  return <div className="route-map-card"><div className="route-map-header"><div><span className="eyebrow">OPENSTREETMAP ROUTE</span><strong>{active ? "Live route" : "Your jog route"}</strong></div><span className="route-map-status"><span className={active ? "live-dot" : "finished-dot"} />{active ? "Tracking" : "Finished"}</span></div><div className="real-route-map-canvas">{points.length > 0 ? <><div className="osm-map-tiles">{tiles.map((tile) => <img key={`${tile.tileX}-${tile.tileY}`} className="osm-map-tile" src={`https://tile.openstreetmap.org/${zoom}/${tile.tileX}/${tile.tileY}.png`} alt="" style={{ left: tile.left, top: tile.top }} />)}</div><svg className="route-map-overlay" viewBox="0 0 320 170" role="img" aria-label={active ? "Live GPS route with start and current position" : "GPS route with start and finish markers"}><path d={path} className="route-path" />{startPoint && <><circle cx={startPoint.x} cy={startPoint.y} r="7" className="route-marker start-marker" /><text x={startPoint.x + 10} y={startPoint.y - 10} className="route-marker-label">START</text></>}{finishPoint && <><circle cx={finishPoint.x} cy={finishPoint.y} r="7" className={`route-marker ${active ? "current-marker" : "finish-marker"}`} /><text x={finishPoint.x + 10} y={finishPoint.y - 10} className="route-marker-label">{active ? "CURRENT" : "FINISH"}</text></>}</svg></> : <div className="route-map-empty"><MapPin size={21} /><span>{active ? "Waiting for your first GPS point" : "No GPS route was recorded"}<small>{active ? "Keep moving and your start point will appear here." : "Turn on location next time to see start and finish."}</small></span></div>}</div><div className="route-map-legend"><span><i className="legend-start" /> Start</span><span><i className={active ? "legend-current" : "legend-finish"} /> {active ? "Current" : "Finish"}</span></div></div>;
};

const signals = [
  { label: "Weather", value: "62° / Clear", detail: "Great for a run", icon: CloudSun, tone: "sky" },
  { label: "Calendar", value: "Open until 8:15", detail: "90 min window", icon: CalendarDays, tone: "lime" },
  { label: "Gym floor", value: "Quiet · 28%", detail: "Low crowd estimate", icon: Waves, tone: "coral" },
  { label: "Recovery", value: "84 / 100", detail: "Ready to train", icon: HeartPulse, tone: "violet" },
];

const sessions = [
  { day: "MON", date: "12", type: "Strength", title: "Upper body power", detail: "42 min · 6,240 lb", mode: "lift" as WorkoutMode, color: "lime" },
  { day: "WED", date: "14", type: "Run", title: "Tempo intervals", detail: "4.2 mi · 8:52 /mi", mode: "run" as WorkoutMode, color: "coral" },
  { day: "SAT", date: "17", type: "Hybrid", title: "Long aerobic base", detail: "7.6 mi · 320 ft gain", mode: "run" as WorkoutMode, color: "sky" },
];

const docSections = {
  prd: [
    { eyebrow: "01 · Product north star", title: "Make consistency feel inevitable.", body: "PulseWindow removes the daily guesswork from hybrid training. Instead of asking users to find time, the product finds the moment where their schedule, environment, and body are most likely to say yes." },
    { eyebrow: "02 · Smart Alert user stories", title: "Context-aware, never noisy.", body: "As a hybrid athlete, I want one clear recommendation for today so I can act without comparing five calendars and weather apps. As a busy professional, I want to snooze or reschedule without losing my plan. As a runner, I want poor outdoor conditions to trigger an indoor alternative." },
    { eyebrow: "03 · Tracking user stories", title: "One log for every kind of strong.", body: "As a lifter, I want set, rep, load, rest, and RPE captured with minimal taps. As a runner, I want GPS pace, distance, elevation, and splits tracked live. As a hybrid athlete, I want both to roll into one weekly training load." },
  ],
  architecture: [
    { eyebrow: "01 · Decision engine", title: "Score every viable workout window.", body: "A scheduling worker expands calendar gaps into candidate windows, enriches them with weather, crowd, and recovery signals, then scores each window against the user's workout intent and preferences. Only the top actionable window is promoted." },
    { eyebrow: "02 · Alert algorithm", title: "The right time, in six passes.", body: "Find availability → filter by session duration → classify workout context → score weather and crowd → adjust for energy and sleep → send one notification with Start, Snooze, and Reschedule actions. Re-score after a user response or meaningful context change." },
    { eyebrow: "03 · Integrations", title: "A calm layer over noisy inputs.", body: "The Jog tracker uses the phone Geolocation API for live distance and pace, with Mapbox or Google Maps for route context. CalendarKit / Google Calendar, WeatherKit / OpenWeather, HealthKit / Health Connect, and a gym capacity provider complete the Smart Timing signal layer." },
  ],
  frictionless: [
    { eyebrow: "01 · Guest-mode path", title: "Two taps to the right workout.", body: "Open the app → tap Start a quick workout → tap Start Jog or Start Lift. A context recommendation chooses the easiest win, while an alternate mode remains one tap away. There is no account wall, goal form, routine picker, or permission gate before the user sees the active workout." },
    { eyebrow: "02 · Contextual permissions", title: "Ask only when the value is clear.", body: "Location is asked at Jog start with a timer-only fallback. Calendar and notifications wait until after a completed workout and a user chooses to build a habit. Every permission prompt explains the immediate benefit in plain language and keeps the user moving when declined." },
    { eyebrow: "03 · Progressive disclosure", title: "A calm first screen wins.", body: "Jog shows distance, pace, elapsed time, pause, and finish. Lift shows the session timer, first movement, weight, reps, and Log set. Maps, splits, exercise history, rest timers, RPE, notes, and settings stay behind one More details action." },
    { eyebrow: "04 · Conversion after value", title: "You showed up.", body: "The post-workout summary celebrates completion before asking for anything. Save my workout leads to a simple routine prompt, then Smart Timing setup. Account creation is optional and appears only after a workout or routine is saved." },
    { eyebrow: "05 · Denial fallback", title: "Nothing blocks the workout.", body: "A denied location request becomes Timer mode with manual distance and pace entry. Calendar denial keeps Smart Timing local-only. Notification denial keeps the plan available in-app. No denial creates an error state, blank screen, or sign-up requirement." },
  ],
};

const Index = () => {
  const { session, profile } = useAuth();
  const displayName = session?.user?.user_metadata?.display_name || profile?.display_name || session?.user?.email?.split("@")[0] || "Athlete";
  const displayInitials = displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const [activeTab, setActiveTab] = useState<NavId>("home");
  const [alertStatus, setAlertStatus] = useState("Ready when you are");
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);
  const [selectedMode, setSelectedMode] = useState<WorkoutMode>("lift");
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [docTab, setDocTab] = useState<keyof typeof docSections>("prd");
  const [showReasoning, setShowReasoning] = useState(false);
  const [showInsightsMenu, setShowInsightsMenu] = useState(false);
  const [showAddSessionPanel, setShowAddSessionPanel] = useState(false);
  const geoWatchRef = useRef<number | null>(null);
  const lastPositionRef = useRef<GeolocationPosition | null>(null);
  const [runDistanceMeters, setRunDistanceMeters] = useState(0);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [gpsError, setGpsError] = useState("");
  const [routines, setRoutines] = useState<SavedRoutine[]>(readSavedRoutines);

  const [isFirstRun, setIsFirstRun] = useState(true);
  const [guestMode, setGuestMode] = useState(false);
  const [guestStep, setGuestStep] = useState<GuestStep>("welcome");
  const [recommendedMode, setRecommendedMode] = useState<WorkoutMode>(recommendation.mode);
  const [permissionPrompt, setPermissionPrompt] = useState<PermissionPrompt>(null);
  const [permissionState, setPermissionState] = useState<PermissionState>({ location: "unknown", calendar: "unknown", notifications: "unknown" });
  const [guestDetailsOpen, setGuestDetailsOpen] = useState(false);
  const [guestSetCount, setGuestSetCount] = useState(0);
  const [guestSetSaved, setGuestSetSaved] = useState(false);
  const [weightValue, setWeightValue] = useState("20");
  const [repsValue, setRepsValue] = useState("8");
  const [manualDistance, setManualDistance] = useState("1.2");
  const [manualPace, setManualPace] = useState("10:00");
  const [routineSaved, setRoutineSaved] = useState(false);
  const [smartTimingSetup, setSmartTimingSetup] = useState(false);

  useEffect(() => {
    if (!session?.user) return;
    setIsFirstRun(false);
    setGuestMode(false);
  }, [session]);

  useEffect(() => {
    if (!workoutStarted || isPaused) return;
    const interval = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [workoutStarted, isPaused]);

  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem(ROUTINES_STORAGE_KEY, JSON.stringify(routines));
  }, [routines]);

  useEffect(() => () => {
    if (geoWatchRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.clearWatch(geoWatchRef.current);
    }
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden || geoWatchRef.current === null || !navigator.geolocation) return;
      navigator.geolocation.clearWatch(geoWatchRef.current);
      geoWatchRef.current = null;
      setIsPaused(true);
      setAlertStatus("Tracking paused while the app is not visible");
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const formatTimer = (seconds: number) => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
    const remainder = (seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${remainder}`;
  };

  const exitGuestFlow = (message = "Ready when you are") => {
    clearLocationWatch();
    setGuestMode(false);
    setIsFirstRun(false);
    setGuestStep("welcome");
    setPermissionPrompt(null);
    setWorkoutStarted(false);
    setIsPaused(false);
    setActiveTab("home");
    setAlertStatus(message);
  };

  const openQuickWorkout = () => {
    setGuestMode(true);
    setIsFirstRun(false);
    setGuestStep("recommendation");
    setRecommendedMode(recommendation.mode);
    setSelectedMode(recommendation.mode);
    setGuestDetailsOpen(false);
  };

  const beginGuestWorkout = (mode: WorkoutMode) => {
    setSelectedMode(mode);
    setGuestMode(true);
    setGuestStep("active");
    setGuestDetailsOpen(false);
    setGuestSetSaved(false);
    setElapsed(0);
    setRunDistanceMeters(0);
    setRoutePoints([]);
    setGpsError("");
    lastPositionRef.current = null;
    setIsPaused(false);
    setPermissionPrompt(mode === "run" ? "location" : null);
    setWorkoutStarted(mode === "lift");
  };

  const resolveLocation = (status: Exclude<PermissionStatus, "unknown">) => {
    setPermissionState((value) => ({ ...value, location: status }));
    setPermissionPrompt(null);
    setWorkoutStarted(true);
    setIsPaused(false);
    setAlertStatus(status === "granted" ? "Route tracking is on" : "Timer mode is ready");
  };

  const requestLocationAccess = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGpsError("Location is not available here.");
      resolveLocation("denied");
      return;
    }

    setPermissionState((value) => ({ ...value, location: "unknown" }));
    geoWatchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setPermissionState((value) => ({ ...value, location: "granted" }));
        setGpsError("");
        if (lastPositionRef.current) setRunDistanceMeters((value) => value + distanceBetweenPositions(lastPositionRef.current!, position));
        setRoutePoints((value) => [...value, { latitude: position.coords.latitude, longitude: position.coords.longitude }]);
        lastPositionRef.current = position;
      },
      () => {
        setGpsError("Location was unavailable, so we switched to timer mode.");
        resolveLocation("denied");
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
    setPermissionPrompt(null);
    setWorkoutStarted(true);
    setIsPaused(false);
    setAlertStatus("Waiting for route updates");
  };

  const clearLocationWatch = () => {
    if (geoWatchRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.clearWatch(geoWatchRef.current);
      geoWatchRef.current = null;
    }
  };

  const finishGuestWorkout = () => {
    clearLocationWatch();
    setWorkoutStarted(false);
    setIsPaused(false);
    setPermissionPrompt(null);
    setGuestStep("summary");
  };

  const saveGuestWorkout = () => {
    setGuestStep("save-routine");
    setAlertStatus("Workout saved locally");
  };

  const moveToSmartTiming = () => {
    setGuestStep("smart-timing");
    setAlertStatus("Nice work. One small next step.");
  };

  const saveGuestRoutine = () => {
    const distanceMiles = runDistanceMeters > 0 ? (runDistanceMeters / 1609.344).toFixed(2) : manualDistance;
    const routine: SavedRoutine = {
      id: `${Date.now()}`,
      mode: selectedMode,
      name: selectedMode === "run" ? "Quick jog" : "First movement",
      detail: selectedMode === "run" ? `${distanceMiles} mi · ${formatTimer(elapsed)}` : `${Math.max(guestSetCount, 1)} set · ${weightValue} kg × ${repsValue}`,
      createdAt: new Date().toISOString(),
    };
    setRoutines((value) => [routine, ...value].slice(0, 12));
    setRoutineSaved(true);
    moveToSmartTiming();
  };

  const startSmartTimingSetup = () => {
    setSmartTimingSetup(true);
    setGuestStep("calendar");
  };

  const resolveCalendar = (status: Exclude<PermissionStatus, "unknown">) => {
    setPermissionState((value) => ({ ...value, calendar: status }));
    setGuestStep("notifications");
  };

  const resolveNotifications = (status: Exclude<PermissionStatus, "unknown">) => {
    setPermissionState((value) => ({ ...value, notifications: status }));
    setGuestStep("account");
    setSmartTimingSetup(status === "granted" || permissionState.calendar === "granted");
  };

  const startWorkout = (mode: WorkoutMode = selectedMode) => {
    setGuestMode(false);
    setIsFirstRun(false);
    setSelectedMode(mode);
    setWorkoutStarted(true);
    setElapsed(0);
    setIsPaused(false);
    setActiveTab("train");
    setAlertStatus("Session in progress");
  };

  const finishRegularWorkout = () => {
    setWorkoutStarted(false);
    setAlertStatus("Session logged · nice work");
  };

  const renderLogo = () => <div className="brand-mark" aria-label="PulseWindow logo"><span /><span /><span /></div>;

  const renderHeader = () => (
    <header className="app-header">
      <div className="brand-lockup">
        {renderLogo()}
        <div><p className="brand-name">PulseWindow</p><p className="brand-context">HYBRID TRAINING OS</p></div>
      </div>
      <div className="header-actions">
        <button className="icon-button notification-button" aria-label="Notifications" onClick={() => { setHasUnreadNotifications(false); setAlertStatus("You're all caught up"); }}><Bell size={18} strokeWidth={1.8} />{hasUnreadNotifications && <span className="notification-dot" />}</button>
        <UserMenu />
      </div>
    </header>
  );

  const renderGuestHeader = () => (
    <header className="guest-header"><div className="brand-lockup">{renderLogo()}<div><p className="brand-name">PulseWindow</p><p className="brand-context">GUEST MODE</p></div></div><span className="guest-safe-label"><ShieldCheck size={14} /> No sign-up needed</span></header>
  );

  const renderPermissionCard = (type: "calendar" | "notifications") => {
    const isCalendar = type === "calendar";
    return <div className="guest-focus-page"><div className="guest-step-indicator"><span>AFTER YOUR WORKOUT</span><span>{isCalendar ? "1 of 2" : "2 of 2"}</span></div><div className="permission-hero-icon">{isCalendar ? <CalendarDays size={29} /> : <Bell size={29} />}</div><p className="eyebrow">{isCalendar ? "SMART TIMING · CALENDAR" : "SMART TIMING · NOTIFICATIONS"}</p><h1>{isCalendar ? "Find your next easy window?" : "Want a nudge when the timing is right?"}</h1><p className="guest-lead">{isCalendar ? "Connect your calendar and PulseWindow will look for open workout time. We’ll never add events without asking." : "PulseWindow can let you know when your schedule, weather, and energy line up. You’ll stay in control."}</p><div className="privacy-note"><ShieldCheck size={15} /><span>{isCalendar ? "We only read availability. We never add events without asking." : "You choose when PulseWindow can reach you."}</span></div><div className="guest-action-stack"><Button className="lime-button guest-primary-button" onClick={() => isCalendar ? resolveCalendar("granted") : resolveNotifications("granted")}>{isCalendar ? "Find my windows" : "Turn on smart nudges"}<ArrowRight size={15} /></Button><button className="guest-secondary-button" onClick={() => isCalendar ? resolveCalendar("denied") : resolveNotifications("denied")}>{isCalendar ? "Not now" : "Maybe later"}</button></div></div>;
  };

  const renderGuestWelcome = () => <div className="guest-focus-page welcome-page"><div className="welcome-orbit"><div className="welcome-orbit-core"><Zap size={32} fill="currentColor" /></div><span /><span /><span /></div><p className="eyebrow">A SMALLER WAY TO START</p><h1>Move first.<br /><span>Figure it out later.</span></h1><p className="guest-lead">No setup. No sign-up. Just one quick workout that fits the moment you’re in.</p><Button className="lime-button guest-primary-button" onClick={openQuickWorkout}>Start a quick workout <ArrowRight size={16} /></Button><Link className="account-link" to="/auth/sign-in">I already have an account</Link><div className="guest-proof"><div><Timer size={16} /><span>Under 3 min<br />to get moving</span></div><div><ShieldCheck size={16} /><span>Your workout<br />stays on this device</span></div></div></div>;

  const renderGuestRecommendation = () => {
    const alternateMode: WorkoutMode = recommendedMode === "run" ? "lift" : "run";
    const modeLabel = recommendedMode === "run" ? "Jog" : "Lift";
    const alternateLabel = alternateMode === "run" ? "Jog" : "Lift";
    return <div className="guest-focus-page recommendation-page"><div className="guest-step-indicator"><span>QUICK START · 1 TAP LEFT</span><span>02 / 02</span></div><div className={`recommendation-icon ${recommendedMode === "run" ? "run" : "lift"}`}>{recommendedMode === "run" ? <Footprints size={32} /> : <Dumbbell size={32} />}</div><p className="eyebrow">LET’S MAKE THIS EASY</p><h1>Best fit right now:<br /><span>{modeLabel}</span></h1><p className="guest-lead">{recommendation.reason} {recommendation.detail}</p><div className="context-row"><span><CloudSun size={15} /> 62° clear</span><span><CalendarDays size={15} /> 42 min open</span></div><Button className="lime-button guest-primary-button" onClick={() => beginGuestWorkout(recommendedMode)}>Start {modeLabel} <Play size={15} fill="currentColor" /></Button><button className="alternate-choice" onClick={() => beginGuestWorkout(alternateMode)}>Start {alternateLabel} instead <ArrowRight size={14} /></button><p className="tap-hint"><span className="tap-dot" /> One tap. No setup.</p></div>;
  };

  const renderGuestActiveWorkout = () => {
    const isRun = selectedMode === "run";
    const distanceMiles = runDistanceMeters > 0 ? (runDistanceMeters / 1609.344).toFixed(2) : permissionState.location === "denied" ? manualDistance : "0.00";
    const pace = permissionState.location === "denied" ? manualPace : formatPace(elapsed, Number(distanceMiles));
    const status = permissionState.location === "granted" ? "Tracking route" : permissionState.location === "denied" ? gpsError || "Timer mode · add distance later" : "Ready to track route";
    return <div className={`guest-workout-page ${isRun ? "run-mode" : "lift-mode"}`}><div className="guest-workout-top"><button className="guest-close-button" aria-label="Exit workout" onClick={() => exitGuestFlow("Workout paused for later")}><X size={19} /></button><div className="guest-workout-mode"><span className="live-dot" /> {isRun ? "QUICK JOG" : "QUICK LIFT"}</div><button className="guest-menu-button" aria-label="Workout options"><MoreHorizontal size={19} /></button></div><div className="guest-workout-heading"><p className="eyebrow">{isRun ? "KEEP IT SIMPLE" : "FIRST MOVEMENT"}</p><h1>{isRun ? "Easy jog" : "First movement"}</h1><div className="guest-status-line">{isRun ? <LocateFixed size={14} /> : <Dumbbell size={14} />}<span>{isRun ? status : guestSetSaved ? "Set saved." : "Ready when you are"}</span></div></div>{isRun ? <><div className="jog-primary-metric"><span className="metric-label">DISTANCE</span><strong>{distanceMiles}</strong><span className="metric-unit">MI</span></div><div className="jog-supporting-metrics"><div><span>PACE</span><strong>{pace}</strong><small>/MI</small></div><div><span>TIME</span><strong>{formatTimer(elapsed)}</strong></div></div><div className="guest-workout-actions"><button className="secondary-workout-button" onClick={() => setIsPaused((value) => !value)}>{isPaused ? <Play size={17} fill="currentColor" /> : <Pause size={17} fill="currentColor" />} {isPaused ? "Resume" : "Pause"}</button><button className="secondary-workout-button" onClick={() => setGuestDetailsOpen((value) => !value)}><SlidersHorizontal size={17} /> {guestDetailsOpen ? "Hide details" : "More details"}</button></div>{guestDetailsOpen && <div className="guest-details-drawer"><RouteMap points={routePoints} active />{permissionState.location === "denied" && <div className="manual-run-inputs"><label><span>DISTANCE <small>MI</small></span><Input inputMode="decimal" value={manualDistance} onChange={(event) => setManualDistance(event.target.value)} aria-label="Distance in miles" /></label><label><span>PACE <small>/MI</small></span><Input value={manualPace} onChange={(event) => setManualPace(event.target.value)} aria-label="Pace per mile" /></label></div>}<div className="detail-grid"><span><b>Elevation</b>0 ft</span><span><b>GPS accuracy</b>{permissionState.location === "granted" ? "High" : "Unavailable"}</span><span><b>Splits</b>Off</span><span><b>Audio cues</b>Off</span></div></div>}<Button className="finish-workout-button" onClick={finishGuestWorkout}>Finish jog <Check size={17} /></Button></> : <><div className="lift-timer"><span>SESSION TIME</span><strong>{formatTimer(elapsed)}</strong></div><div className="lift-input-row"><label><span>WEIGHT <small>KG</small></span><Input inputMode="decimal" value={weightValue} onChange={(event) => setWeightValue(event.target.value)} aria-label="Weight in kilograms" /></label><label><span>REPS</span><Input inputMode="numeric" value={repsValue} onChange={(event) => setRepsValue(event.target.value)} aria-label="Repetitions" /></label></div><div className="lift-set-feedback"><span>{guestSetCount === 0 ? "Log one set and call it a win." : `${guestSetCount} ${guestSetCount === 1 ? "set" : "sets"} logged`}</span>{guestSetSaved && <strong><CircleCheck size={15} /> Set saved.</strong>}</div><div className="guest-workout-actions"><Button className="log-set-button" onClick={() => { setGuestSetCount((value) => value + 1); setGuestSetSaved(true); }}><Save size={17} /> Log set</Button><button className="secondary-workout-button" onClick={() => setGuestDetailsOpen((value) => !value)}><SlidersHorizontal size={17} /> {guestDetailsOpen ? "Hide details" : "More details"}</button></div>{guestDetailsOpen && <div className="guest-details-drawer"><div className="detail-grid full"><span><b>Exercise picker</b>Choose later</span><span><b>Previous history</b>Hidden</span><span><b>Rest timer</b>Off</span><span><b>RPE & notes</b>Optional</span></div></div>}<Button className="finish-workout-button" onClick={finishGuestWorkout}>Finish workout <Check size={17} /></Button></>}</div>;
  };

  const renderGuestSummary = () => <div className="guest-focus-page summary-page"><div className="summary-check"><Check size={25} /></div><p className="eyebrow">SESSION COMPLETE</p><h1>You showed up.</h1><p className="guest-lead">That counts. Here’s what you logged.</p>{selectedMode === "run" && <RouteMap points={routePoints} />}<div className="summary-metrics"><div><span>TIME</span><strong>{elapsed > 0 ? formatTimer(elapsed) : "12 min"}</strong></div><div><span>{selectedMode === "run" ? "DISTANCE" : "SETS"}</span><strong>{selectedMode === "run" ? `${runDistanceMeters > 0 ? (runDistanceMeters / 1609.344).toFixed(2) : manualDistance} mi` : `${Math.max(guestSetCount, 1)}`}</strong></div></div><Button className="lime-button guest-primary-button" onClick={saveGuestWorkout}>Save my workout <Save size={15} /></Button><button className="guest-secondary-button" onClick={() => exitGuestFlow("Workout saved locally · nice work")}>Done for now</button><button className="habit-link" onClick={moveToSmartTiming}>Make this a habit <ArrowRight size={14} /></button></div>;

  const renderGuestSaveRoutine = () => <div className="guest-focus-page conversion-page"><div className="conversion-icon"><Save size={27} /></div><p className="eyebrow">ONE TAP FASTER NEXT TIME</p><h1>Keep this one for next time?</h1><p className="guest-lead">Save it as a simple routine so your next workout starts even faster.</p><div className="routine-preview"><div className={`routine-preview-icon ${selectedMode}`}><>{selectedMode === "run" ? <Footprints size={18} /> : <Dumbbell size={18} />}</></div><div><strong>{selectedMode === "run" ? "Quick jog" : "First movement"}</strong><span>{selectedMode === "run" ? "Easy pace · 12 min" : `${Math.max(guestSetCount, 1)} set · simple start`}</span></div><Check size={16} /></div><div className="guest-action-stack"><Button className="lime-button guest-primary-button" onClick={saveGuestRoutine}>Save routine <ArrowRight size={15} /></Button><button className="guest-secondary-button" onClick={moveToSmartTiming}>Not now</button></div></div>;

  const renderGuestSmartTiming = () => <div className="guest-focus-page conversion-page"><div className="smart-timing-art"><div><Zap size={23} fill="currentColor" /></div><span /><span /><span /></div><p className="eyebrow">THE NEXT EASY WIN</p><h1>Want help finding the next good moment?</h1><p className="guest-lead">PulseWindow can watch for a clear, open window that fits your training.</p><div className="smart-timing-benefits"><span><CalendarDays size={15} /> Open time</span><span><CloudSun size={15} /> Good weather</span><span><HeartPulse size={15} /> Your energy</span></div><div className="guest-action-stack"><Button className="lime-button guest-primary-button" onClick={startSmartTimingSetup}>Set up smart timing <ArrowRight size={15} /></Button><button className="guest-secondary-button" onClick={() => setGuestStep("account")}>Maybe later</button></div></div>;

  const renderGuestAccount = () => <div className="guest-focus-page conversion-page account-page"><div className="account-art"><ShieldCheck size={29} /></div><p className="eyebrow">OPTIONAL, ALWAYS</p><h1>Keep your progress across devices?</h1><p className="guest-lead">Create an account later to back up workouts and keep your routines with you.</p><div className="account-status-list"><span><Check size={14} /> {routineSaved ? "Routine saved on this device" : "Your workout is safe on this device"}</span><span><Check size={14} /> Smart Timing stays {smartTimingSetup ? "ready" : "available"}</span></div><div className="guest-action-stack"><Link className="lime-button guest-primary-button" to="/auth/sign-up">Create account <ArrowRight size={15} /></Link><button className="guest-secondary-button" onClick={() => exitGuestFlow("Guest mode stays available whenever you need it")}>Keep using guest mode</button></div></div>;

  const renderGuestFlow = () => {
    let content = guestStep === "welcome" ? renderGuestWelcome() : guestStep === "recommendation" ? renderGuestRecommendation() : guestStep === "active" ? renderGuestActiveWorkout() : guestStep === "summary" ? renderGuestSummary() : guestStep === "save-routine" ? renderGuestSaveRoutine() : guestStep === "smart-timing" ? renderGuestSmartTiming() : guestStep === "calendar" ? renderPermissionCard("calendar") : guestStep === "notifications" ? renderPermissionCard("notifications") : renderGuestAccount();
    return <main className="guest-shell"><div className="guest-content">{renderGuestHeader()}{content}</div>{permissionPrompt === "location" && <div className="permission-overlay"><div className="permission-card"><button className="permission-close" aria-label="Use timer instead" onClick={() => resolveLocation("denied")}><X size={17} /></button><div className="permission-icon"><LocateFixed size={24} /></div><p className="eyebrow">QUICK JOG · ONE PERMISSION</p><h2>Want your route tracked?</h2><p>Allow location to see distance, pace, and your route while you jog. You can still start a simple timer without it.</p><div className="permission-actions"><Button className="lime-button guest-primary-button" onClick={requestLocationAccess}>Turn on route tracking <ArrowRight size={15} /></Button><button className="permission-fallback-button" onClick={() => resolveLocation("denied")}>Just use a timer</button></div></div></div>}</main>;
  };

  const renderHome = () => <div className="page-stack animate-in"><section className="welcome-row"><div><p className="eyebrow">TUESDAY, OCTOBER 15 · 09:42 AM</p><h1>Good morning, {displayName}<span className="lime-dot">.</span></h1><p className="subcopy">Your body is ready. Let's find your window.</p></div><div className="streak-pill"><Flame size={15} fill="currentColor" /><span>3 day streak</span></div></section><section className="smart-card"><div className="smart-card-topline"><span className="status-tag"><span className="live-dot" /> SMART WINDOW</span><button className="more-button" onClick={() => setShowReasoning((value) => !value)} aria-label="Show recommendation details"><MoreHorizontal size={21} /></button></div><div className="smart-card-body"><div className="smart-copy"><p className="eyebrow light-eyebrow">NEXT BEST TIME TO TRAIN</p><h2>Today at <span>6:30 PM</span></h2><p className="smart-description">A low-crowd lift fits perfectly between your open calendar and peak energy window.</p><div className="score-line"><div className="score-ring"><span>92</span></div><div><strong>Excellent match</strong><p>Based on 4 signals</p></div></div></div><div className="orbit-visual" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit-core"><Zap size={26} fill="currentColor" /></div><span className="orbit-dot dot-one" /><span className="orbit-dot dot-two" /><span className="orbit-dot dot-three" /></div></div><div className="smart-actions"><Button className="lime-button" onClick={() => startWorkout("lift")}><Play size={15} fill="currentColor" /> Start session</Button><button className="text-action" onClick={() => setShowReasoning((value) => !value)}>{showReasoning ? "Hide details" : "See why"}<ArrowRight size={15} /></button></div>{showReasoning && <div className="reasoning-drawer"><div><CalendarDays size={15} /> Calendar clear</div><div><CloudSun size={15} /> Weather stable</div><div><Waves size={15} /> Gym at 28%</div><div><HeartPulse size={15} /> Recovery 84</div></div>}</section><section className="section-block"><div className="section-heading"><div><p className="eyebrow">THE SIGNALS BEHIND YOUR WINDOW</p><h3>Everything is lining up.</h3></div><button className="quiet-link" onClick={() => setActiveTab("insights")}>View insights <ArrowRight size={14} /></button></div><div className="signal-grid">{signals.map((signal) => { const Icon = signal.icon; return <Card key={signal.label} className={`signal-card ${signal.tone}`}><div className="signal-icon"><Icon size={17} /></div><p>{signal.label}</p><strong>{signal.value}</strong><span>{signal.detail}</span></Card>; })}</div></section><section className="section-block"><div className="section-heading"><div><p className="eyebrow">YOUR RHYTHM</p><h3>This week at a glance.</h3></div><button className="circle-button" aria-label="Add workout" onClick={() => setActiveTab("train")}><Plus size={18} /></button></div><Card className="rhythm-card"><div className="rhythm-meta"><div><strong>3</strong><span>sessions planned</span></div><div><strong>74%</strong><span>weekly consistency</span></div><div className="rhythm-legend"><span className="legend-dot lime" /> Strength <span className="legend-dot coral" /> Run</div></div><div className="week-bars">{[{ day: "M", height: 58, type: "lime", done: true }, { day: "T", height: 34, type: "coral", done: true }, { day: "W", height: 78, type: "lime", done: false }, { day: "T", height: 46, type: "coral", done: false }, { day: "F", height: 24, type: "muted", done: false }, { day: "S", height: 68, type: "sky", done: false }, { day: "S", height: 30, type: "muted", done: false }].map((bar, index) => <div className="day-bar" key={`${bar.day}-${index}`}><div className={`bar-track ${bar.done ? "done" : ""}`}><div className={`bar-fill ${bar.type}`} style={{ height: `${bar.height}%` }} /></div><span>{bar.day}</span></div>)}</div></Card></section><section className="section-block two-column-mobile"><div className="section-heading"><div><p className="eyebrow">UP NEXT</p><h3>Keep the momentum.</h3></div><button className="quiet-link" onClick={() => setActiveTab("train")}>Open plan <ArrowRight size={14} /></button></div><div className="session-list">{sessions.map((session) => <button key={session.title} className="session-card" onClick={() => startWorkout(session.mode)}><div className={`date-block ${session.color}`}><span>{session.day}</span><strong>{session.date}</strong></div><div className="session-content"><div className="session-type"><span className={`session-dot ${session.color}`} />{session.type}</div><strong>{session.title}</strong><span>{session.detail}</span></div><ArrowRight className="session-arrow" size={18} /></button>)}</div></section></div>;

  const renderSavedRoutines = () => <section className="section-block saved-routines-section"><div className="section-heading"><div><p className="eyebrow">YOUR ROUTINES</p><h3>Start from something familiar.</h3></div><span className="routine-count">{routines.length} saved</span></div>{routines.length === 0 ? <Card className="empty-routines"><Save size={18} /><div><strong>Your saved routines will live here.</strong><span>Finish a quick workout and save it for your next one-tap start.</span></div></Card> : <div className="saved-routine-list">{routines.map((routine) => <button className="saved-routine-row" key={routine.id} onClick={() => startWorkout(routine.mode)}><div className={`saved-routine-icon ${routine.mode}`}>{routine.mode === "run" ? <Footprints size={17} /> : <Dumbbell size={17} />}</div><div><strong>{routine.name}</strong><span>{routine.detail}</span></div><Play size={16} /></button>)}</div>}</section>;

  const renderTrain = () => <div className="page-stack animate-in train-page"><section className="page-title-row"><div><p className="eyebrow">HYBRID ROUTINE TRACKER</p><h1>Train with intent<span className="lime-dot">.</span></h1><p className="subcopy">One place for every rep, mile, and win.</p></div><button className="circle-button train-add-button" aria-label="Add session" aria-expanded={showAddSessionPanel} aria-controls="add-session-panel" onClick={() => setShowAddSessionPanel((value) => !value)}><Plus size={19} /></button></section>{showAddSessionPanel && <div className="add-session-panel" id="add-session-panel" role="dialog" aria-label="Add a training session"><div className="add-session-panel-copy"><p className="eyebrow">ADD TO TRAIN</p><strong>Choose what you want to add.</strong><span>Pick a session, then start when you are ready.</span></div><div className="add-session-options"><button className="add-session-option lift" onClick={() => { setSelectedMode("lift"); setShowAddSessionPanel(false); setAlertStatus("Lift session ready to start"); }}><span className="add-session-option-icon"><Dumbbell size={17} /></span><span><strong>Lift</strong><small>Strength session</small></span><ArrowRight size={15} /></button><button className="add-session-option run" onClick={() => { setSelectedMode("run"); setShowAddSessionPanel(false); setAlertStatus("Run session ready to start"); }}><span className="add-session-option-icon"><Footprints size={17} /></span><span><strong>Run</strong><small>Outdoor or timer run</small></span><ArrowRight size={15} /></button></div><button className="add-session-cancel" onClick={() => setShowAddSessionPanel(false)}>Cancel</button></div>}<div className="mode-switcher"><button className={selectedMode === "lift" ? "active" : ""} onClick={() => setSelectedMode("lift")}><Dumbbell size={17} /> Lift</button><button className={selectedMode === "run" ? "active run" : ""} onClick={() => setSelectedMode("run")}><Footprints size={17} /> Run</button></div>{workoutStarted ? <Card className="active-workout-card"><div className="active-head"><div><span className={`status-tag ${selectedMode === "run" ? "coral-tag" : ""}`}><span className="live-dot" /> LIVE SESSION</span><h2>{selectedMode === "lift" ? "Upper body power" : "Tempo intervals"}</h2></div><button className="icon-button" onClick={() => setWorkoutStarted(false)}><X size={18} /></button></div><div className="timer-display"><span>{formatTimer(elapsed)}</span><small>SESSION TIME</small></div>{selectedMode === "lift" ? <div className="set-list"><div className="set-list-head"><span>EXERCISE</span><span>KG × REPS</span><span>DONE</span></div>{[{ name: "Barbell bench press", value: "65 × 8" }, { name: "Single-arm row", value: "24 × 10" }, { name: "Landmine press", value: "18 × 10" }].map((set) => <div className="set-row" key={set.name}><div><strong>{set.name}</strong><span>Set 1 of 3</span></div><b>{set.value}</b><button className="set-check"><Check size={15} /></button></div>)}</div> : <div className="run-stat-grid"><div><Route size={17} /><strong>0.00</strong><span>MILES</span></div><div><Gauge size={17} /><strong>—</strong><span>AVG PACE</span></div><div><TrendingUp size={17} /><strong>0</strong><span>ELEVATION</span></div></div>}<Button className="lime-button full-button" onClick={finishRegularWorkout}><Check size={16} /> Finish session</Button></Card> : <Card className={`start-workout-card ${selectedMode === "run" ? "run-card" : ""}`}><div className="start-visual"><div className="start-icon">{selectedMode === "lift" ? <Dumbbell size={30} /> : <Footprints size={30} />}</div><span className="mini-orbit" /></div><div><p className="eyebrow">{selectedMode === "lift" ? "STRENGTH SESSION" : "OUTDOOR RUN"}</p><h2>{selectedMode === "lift" ? "Upper body power" : "Tempo intervals"}</h2><p>{selectedMode === "lift" ? "5 movements · 42 min · progressive load" : "4.2 mi target · rolling pace · riverside route"}</p></div><Button className="lime-button" onClick={() => startWorkout()}><Play size={15} fill="currentColor" /> Start now</Button></Card>}<section className="section-block"><div className="section-heading"><div><p className="eyebrow">RECENT SESSIONS</p><h3>Your work, logged.</h3></div><button className="quiet-link">See all <ArrowRight size={14} /></button></div><div className="history-list"><button className="history-row"><div className="history-icon lift"><Dumbbell size={17} /></div><div><strong>Lower body strength</strong><span>Yesterday · 48 min</span></div><b>7,840 lb</b><ChevronDown size={16} /></button><button className="history-row"><div className="history-icon run"><Footprints size={17} /></div><div><strong>Easy morning run</strong><span>Sunday · 3.8 mi</span></div><b>9:14 /mi</b><ChevronDown size={16} /></button><button className="history-row"><div className="history-icon hybrid"><Activity size={17} /></div><div><strong>Full body + 1 mi</strong><span>Friday · 56 min</span></div><b>82 load</b><ChevronDown size={16} /></button></div></section>{renderSavedRoutines()}</div>;

  const renderInsights = () => <div key="insights" className="page-stack animate-in insights-page"><section className={`page-title-row ${showInsightsMenu ? "has-insights-menu" : ""}`}><div><p className="eyebrow">SIGNALS & TRENDS</p><h1>Know your edge<span className="lime-dot">.</span></h1><p className="subcopy">Your last 30 days, without the noise.</p></div><div className={`insights-actions ${showInsightsMenu ? "is-open" : ""}`}><button className="circle-button" aria-label="Insights options" aria-expanded={showInsightsMenu} onClick={() => setShowInsightsMenu((value) => !value)}><MoreHorizontal size={18} /></button>{showInsightsMenu && <div className="insights-menu"><strong>INSIGHTS OPTIONS</strong><span>Signals refresh automatically from your logged sessions.</span><button onClick={() => { setAlertStatus("Insights are up to date"); setShowInsightsMenu(false); }}>Refresh insights</button></div>}</div></section><Card className="recovery-card"><div><p className="eyebrow light-eyebrow">CURRENT READINESS</p><h2>84<span>/100</span></h2><p>Above your 30-day average by <strong>+9</strong>.</p></div><div className="readiness-ring"><div><strong>84</strong><span>READY</span></div></div></Card><section className="section-block"><div className="section-heading"><div><p className="eyebrow">TRAINING LOAD</p><h3>Steady is strong.</h3></div><span className="period-pill">LAST 30 DAYS <ChevronDown size={14} /></span></div><Card className="chart-card"><div className="chart-head"><div><strong>642</strong><span>total load</span></div><div className="positive-stat"><TrendingUp size={14} /> 18% vs prior</div></div><div className="area-chart"><div className="chart-grid"><span /><span /><span /><span /></div><svg viewBox="0 0 500 150" preserveAspectRatio="none" aria-label="Training load trend"><path d="M0 126 C35 122, 42 96, 72 105 S112 118, 140 76 S182 98, 210 88 S258 104, 282 45 S322 88, 350 66 S388 78, 412 36 S457 55, 500 18" fill="none" stroke="#b8f34a" strokeWidth="4" strokeLinecap="round" /><path d="M0 126 C35 122, 42 96, 72 105 S112 118, 140 76 S182 98, 210 88 S258 104, 282 45 S322 88, 350 66 S388 78, 412 36 S457 55, 500 18 L500 150 L0 150Z" fill="#b8f34a" opacity=".08" /></svg></div><div className="chart-labels"><span>SEP 16</span><span>SEP 23</span><span>SEP 30</span><span>OCT 7</span><span>OCT 15</span></div></Card></section><section className="section-block"><div className="section-heading"><div><p className="eyebrow">PERSONALIZED NOTES</p><h3>Your coach, in context.</h3></div></div><div className="insight-list"><div className="insight-item lime-border"><div className="insight-icon"><Sparkles size={17} /></div><div><strong>Your best lift window is 5:45–7:00 PM.</strong><span>You complete 22% more volume when your last meal is 2+ hours before training.</span></div><ArrowRight size={16} /></div><div className="insight-item coral-border"><div className="insight-icon"><Wind size={17} /></div><div><strong>Thursday is your run day.</strong><span>Your pace is strongest when humidity stays under 65% and your sleep score is above 75.</span></div><ArrowRight size={16} /></div></div></section></div>;

  const renderBlueprint = () => {
    const blueprintTitle = docTab === "frictionless" ? "Start before you’re ready." : docTab === "prd" ? "A smarter reason to show up." : "Small inputs. One clear decision.";
    const blueprintBody = docTab === "frictionless" ? "The first workout is the product tour. PulseWindow earns permission after it earns trust, then turns one completed session into a repeatable habit." : docTab === "prd" ? "The MVP turns scattered life context into one confident training recommendation, then makes logging the session feel effortless." : "A composable decision engine sits between external signals and a calm, mobile-first workout experience.";
    return <div className="page-stack animate-in blueprint-page"><section className="page-title-row"><div><p className="eyebrow">PRODUCT PLAN · V1.1</p><h1>The PulseWindow blueprint<span className="lime-dot">.</span></h1><p className="subcopy">A product and architecture brief for context-aware training.</p></div><div className="document-badge"><ShieldCheck size={18} /><span>READY<br />TO BUILD</span></div></section><div className="doc-toggle"><button className={docTab === "prd" ? "active" : ""} onClick={() => setDocTab("prd")}>Product requirements</button><button className={docTab === "architecture" ? "active" : ""} onClick={() => setDocTab("architecture")}>Technical architecture</button><button className={docTab === "frictionless" ? "active" : ""} onClick={() => setDocTab("frictionless")}>First 3 minutes</button></div><Card className="doc-hero"><span className="doc-number">{docTab === "prd" ? "01" : docTab === "architecture" ? "02" : "03"}</span><div><p className="eyebrow">{docTab === "frictionless" ? "FRICTIONLESS UX SNAPSHOT" : docTab === "prd" ? "PRD SNAPSHOT" : "SYSTEM SNAPSHOT"}</p><h2>{blueprintTitle}</h2><p>{blueprintBody}</p></div></Card><div className="doc-grid">{docSections[docTab].map((section) => <article className="doc-section" key={section.title}><p className="eyebrow">{section.eyebrow}</p><h3>{section.title}</h3><p>{section.body}</p></article>)}</div><section className="schema-card"><div className="section-heading"><div><p className="eyebrow">DATA MODEL / DATABASE SCHEMA</p><h3>One athlete graph.</h3></div><Info size={17} /></div><div className="schema-grid"><div><span>ATHLETES</span><strong>profiles · goals · preferences</strong></div><div><span>SESSIONS</span><strong>planned · started · completed</strong></div><div><span>STRENGTH SETS</span><strong>exercise · load · reps · RPE</strong></div><div><span>RUN METRICS</span><strong>GPS · pace · elevation · splits</strong></div><div><span>CONTEXT SIGNALS</span><strong>weather · crowd · sleep · calendar</strong></div><div><span>WINDOW SCORES</span><strong>score · reasons · response</strong></div></div></section><div className="integration-strip"><div><CloudSun size={17} /><span>WeatherKit</span></div><div><CalendarDays size={17} /><span>Calendar APIs</span></div><div><MapPin size={17} /><span>Mapbox / GPS</span></div><div><HeartPulse size={17} /><span>HealthKit</span></div></div></div>;
  };

  if (isFirstRun || guestMode) return renderGuestFlow();

  const activeContent = activeTab === "home" ? renderHome() : activeTab === "train" ? renderTrain() : activeTab === "insights" ? renderInsights() : renderBlueprint();
  return <main className="app-shell"><aside className="desktop-rail"><div className="rail-brand">{renderLogo()}<span>PW</span></div><nav>{navItems.map((item) => { const Icon = item.icon; return <button key={item.id} className={activeTab === item.id ? "active" : ""} onClick={() => setActiveTab(item.id)}><Icon size={19} /><span>{item.label}</span></button>; })}</nav><div className="rail-bottom"><button><CircleHelp size={18} /> Help center</button><div className="rail-profile"><span>{displayInitials}</span><div><strong>{displayName}</strong><small>{session?.user?.email || "Guest mode"}</small></div><MoreHorizontal size={16} /></div></div></aside><div className="app-main"><div className="content-wrap">{renderHeader()}<div className="mobile-tab-label"><span>{navItems.find((item) => item.id === activeTab)?.label}</span><UserMenu /></div>{activeContent}</div><nav className="mobile-nav">{navItems.map((item) => { const Icon = item.icon; return <button key={item.id} className={activeTab === item.id ? "active" : ""} onClick={() => setActiveTab(item.id)}><Icon size={19} /><span>{item.label}</span></button>; })}</nav></div>{alertStatus !== "Ready when you are" && <button className="toast-status" onClick={() => setAlertStatus("Ready when you are")}><Check size={15} /> {alertStatus}</button>}</main>;
};

export default Index;
