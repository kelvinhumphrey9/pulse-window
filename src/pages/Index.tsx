import { useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  CloudSun,
  Dumbbell,
  Flame,
  Footprints,
  Gauge,
  HeartPulse,
  Info,
  Layers3,
  MapPin,
  Menu,
  MoreHorizontal,
  Play,
  Plus,
  Route,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Waves,
  Wind,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const navItems = [
  { id: "home", label: "Today", icon: Activity },
  { id: "train", label: "Train", icon: Dumbbell },
  { id: "insights", label: "Insights", icon: BarChart3 },
  { id: "blueprint", label: "Blueprint", icon: Layers3 },
] as const;

type NavId = (typeof navItems)[number]["id"];
type WorkoutMode = "lift" | "run";

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
    {
      eyebrow: "01 · Product north star",
      title: "Make consistency feel inevitable.",
      body: "PulseWindow removes the daily guesswork from hybrid training. Instead of asking users to find time, the product finds the moment where their schedule, environment, and body are most likely to say yes.",
    },
    {
      eyebrow: "02 · Smart Alert user stories",
      title: "Context-aware, never noisy.",
      body: "As a hybrid athlete, I want one clear recommendation for today so I can act without comparing five calendars and weather apps. As a busy professional, I want to snooze or reschedule without losing my plan. As a runner, I want poor outdoor conditions to trigger an indoor alternative.",
    },
    {
      eyebrow: "03 · Tracking user stories",
      title: "One log for every kind of strong.",
      body: "As a lifter, I want set, rep, load, rest, and RPE captured with minimal taps. As a runner, I want GPS pace, distance, elevation, and splits tracked live. As a hybrid athlete, I want both to roll into one weekly training load.",
    },
  ],
  architecture: [
    {
      eyebrow: "01 · Decision engine",
      title: "Score every viable workout window.",
      body: "A scheduling worker expands calendar gaps into candidate windows, enriches them with weather, crowd, and recovery signals, then scores each window against the user's workout intent and preferences. Only the top actionable window is promoted.",
    },
    {
      eyebrow: "02 · Alert algorithm",
      title: "The right time, in six passes.",
      body: "Find availability → filter by session duration → classify workout context → score weather and crowd → adjust for energy and sleep → send one notification with Start, Snooze, and Reschedule actions. Re-score after a user response or meaningful context change.",
    },
    {
      eyebrow: "03 · Integrations",
      title: "A calm layer over noisy inputs.",
      body: "CalendarKit / Google Calendar for availability, WeatherKit / OpenWeather for conditions, Google Maps or Mapbox for route context, HealthKit / Health Connect for sleep and energy, and a gym capacity provider or privacy-safe user estimates for crowding.",
    },
  ],
};

const Index = () => {
  const [activeTab, setActiveTab] = useState<NavId>("home");
  const [alertStatus, setAlertStatus] = useState("Ready when you are");
  const [selectedMode, setSelectedMode] = useState<WorkoutMode>("lift");
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [docTab, setDocTab] = useState<"prd" | "architecture">("prd");
  const [showReasoning, setShowReasoning] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (!workoutStarted) return;
    const interval = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [workoutStarted]);

  const formatTimer = (seconds: number) => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
    const remainder = (seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${remainder}`;
  };

  const startWorkout = (mode: WorkoutMode = selectedMode) => {
    setSelectedMode(mode);
    setWorkoutStarted(true);
    setElapsed(0);
    setActiveTab("train");
    setAlertStatus("Session in progress");
  };

  const renderHeader = () => (
    <header className="app-header">
      <div className="brand-lockup">
        <div className="brand-mark" aria-label="PulseWindow logo"><span /><span /><span /></div>
        <div>
          <p className="brand-name">PulseWindow</p>
          <p className="brand-context">HYBRID TRAINING OS</p>
        </div>
      </div>
      <div className="header-actions">
        <button className="icon-button notification-button" aria-label="Notifications" onClick={() => setAlertStatus("You're all caught up")}>
          <Bell size={18} strokeWidth={1.8} />
          <span className="notification-dot" />
        </button>
        <button className="profile-button" aria-label="Open profile" onClick={() => setShowMenu((value) => !value)}>
          <span>AL</span>
        </button>
        {showMenu && (
          <div className="profile-menu">
            <p className="menu-kicker">ATHLETE PROFILE</p>
            <strong>Alex Laurent</strong>
            <span>Hybrid athlete · 3 day streak</span>
            <button onClick={() => setShowMenu(false)}>Close menu <X size={14} /></button>
          </div>
        )}
      </div>
    </header>
  );

  const renderHome = () => (
    <div className="page-stack animate-in">
      <section className="welcome-row">
        <div>
          <p className="eyebrow">TUESDAY, OCTOBER 15 · 09:42 AM</p>
          <h1>Good morning, Alex<span className="lime-dot">.</span></h1>
          <p className="subcopy">Your body is ready. Let's find your window.</p>
        </div>
        <div className="streak-pill"><Flame size={15} fill="currentColor" /><span>3 day streak</span></div>
      </section>

      <section className="smart-card">
        <div className="smart-card-topline">
          <span className="status-tag"><span className="live-dot" /> SMART WINDOW</span>
          <button className="more-button" onClick={() => setShowReasoning((value) => !value)} aria-label="Show recommendation details"><MoreHorizontal size={21} /></button>
        </div>
        <div className="smart-card-body">
          <div className="smart-copy">
            <p className="eyebrow light-eyebrow">NEXT BEST TIME TO TRAIN</p>
            <h2>Today at <span>6:30 PM</span></h2>
            <p className="smart-description">A low-crowd lift fits perfectly between your open calendar and peak energy window.</p>
            <div className="score-line"><div className="score-ring"><span>92</span></div><div><strong>Excellent match</strong><p>Based on 4 signals</p></div></div>
          </div>
          <div className="orbit-visual" aria-hidden="true">
            <div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit-core"><Zap size={26} fill="currentColor" /></div>
            <span className="orbit-dot dot-one" /><span className="orbit-dot dot-two" /><span className="orbit-dot dot-three" />
          </div>
        </div>
        <div className="smart-actions">
          <Button className="lime-button" onClick={() => startWorkout("lift")}><Play size={15} fill="currentColor" /> Start session</Button>
          <button className="text-action" onClick={() => setShowReasoning((value) => !value)}>{showReasoning ? "Hide details" : "See why"}<ArrowRight size={15} /></button>
        </div>
        {showReasoning && <div className="reasoning-drawer"><div><CalendarDays size={15} /> Calendar clear</div><div><CloudSun size={15} /> Weather stable</div><div><Waves size={15} /> Gym at 28%</div><div><HeartPulse size={15} /> Recovery 84</div></div>}
      </section>

      <section className="section-block">
        <div className="section-heading"><div><p className="eyebrow">THE SIGNALS BEHIND YOUR WINDOW</p><h3>Everything is lining up.</h3></div><button className="quiet-link" onClick={() => setActiveTab("insights")}>View insights <ArrowRight size={14} /></button></div>
        <div className="signal-grid">
          {signals.map((signal) => { const Icon = signal.icon; return <Card key={signal.label} className={`signal-card ${signal.tone}`}><div className="signal-icon"><Icon size={17} /></div><p>{signal.label}</p><strong>{signal.value}</strong><span>{signal.detail}</span></Card>; })}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading"><div><p className="eyebrow">YOUR RHYTHM</p><h3>This week at a glance.</h3></div><button className="circle-button" aria-label="Add workout" onClick={() => setActiveTab("train")}><Plus size={18} /></button></div>
        <Card className="rhythm-card">
          <div className="rhythm-meta"><div><strong>3</strong><span>sessions planned</span></div><div><strong>74%</strong><span>weekly consistency</span></div><div className="rhythm-legend"><span className="legend-dot lime" /> Strength <span className="legend-dot coral" /> Run</div></div>
          <div className="week-bars">{[{day: "M", height: 58, type: "lime", done: true}, {day: "T", height: 34, type: "coral", done: true}, {day: "W", height: 78, type: "lime", done: false}, {day: "T", height: 46, type: "coral", done: false}, {day: "F", height: 24, type: "muted", done: false}, {day: "S", height: 68, type: "sky", done: false}, {day: "S", height: 30, type: "muted", done: false}].map((bar, index) => <div className="day-bar" key={`${bar.day}-${index}`}><div className={`bar-track ${bar.done ? "done" : ""}`}><div className={`bar-fill ${bar.type}`} style={{ height: `${bar.height}%` }} /></div><span>{bar.day}</span></div>)}</div>
        </Card>
      </section>

      <section className="section-block two-column-mobile">
        <div className="section-heading"><div><p className="eyebrow">UP NEXT</p><h3>Keep the momentum.</h3></div><button className="quiet-link" onClick={() => setActiveTab("train")}>Open plan <ArrowRight size={14} /></button></div>
        <div className="session-list">{sessions.map((session) => <button key={session.title} className="session-card" onClick={() => startWorkout(session.mode)}><div className={`date-block ${session.color}`}><span>{session.day}</span><strong>{session.date}</strong></div><div className="session-content"><div className="session-type"><span className={`session-dot ${session.color}`} />{session.type}</div><strong>{session.title}</strong><span>{session.detail}</span></div><ArrowRight className="session-arrow" size={18} /></button>)}</div>
      </section>
    </div>
  );

  const renderTrain = () => (
    <div className="page-stack animate-in">
      <section className="page-title-row"><div><p className="eyebrow">HYBRID ROUTINE TRACKER</p><h1>Train with intent<span className="lime-dot">.</span></h1><p className="subcopy">One place for every rep, mile, and win.</p></div><button className="circle-button" aria-label="Add session"><Plus size={19} /></button></section>
      <div className="mode-switcher"><button className={selectedMode === "lift" ? "active" : ""} onClick={() => setSelectedMode("lift")}><Dumbbell size={17} /> Lift</button><button className={selectedMode === "run" ? "active run" : ""} onClick={() => setSelectedMode("run")}><Footprints size={17} /> Run</button></div>
      {workoutStarted ? <Card className="active-workout-card"><div className="active-head"><div><span className={`status-tag ${selectedMode === "run" ? "coral-tag" : ""}`}><span className="live-dot" /> LIVE SESSION</span><h2>{selectedMode === "lift" ? "Upper body power" : "Tempo intervals"}</h2></div><button className="icon-button" onClick={() => setWorkoutStarted(false)}><X size={18} /></button></div><div className="timer-display"><span>{formatTimer(elapsed)}</span><small>SESSION TIME</small></div>{selectedMode === "lift" ? <div className="set-list"><div className="set-list-head"><span>EXERCISE</span><span>KG × REPS</span><span>DONE</span></div>{[{name: "Barbell bench press", value: "65 × 8"}, {name: "Single-arm row", value: "24 × 10"}, {name: "Landmine press", value: "18 × 10"}].map((set) => <div className="set-row" key={set.name}><div><strong>{set.name}</strong><span>Set 1 of 3</span></div><b>{set.value}</b><button className="set-check"><Check size={15} /></button></div>)}</div> : <div className="run-stat-grid"><div><Route size={17} /><strong>0.00</strong><span>MILES</span></div><div><Gauge size={17} /><strong>—</strong><span>AVG PACE</span></div><div><TrendingUp size={17} /><strong>0</strong><span>ELEVATION</span></div></div>}<Button className="lime-button full-button" onClick={() => { setWorkoutStarted(false); setAlertStatus("Session logged · nice work"); }}><Check size={16} /> Finish session</Button></Card> : <Card className={`start-workout-card ${selectedMode === "run" ? "run-card" : ""}`}><div className="start-visual"><div className="start-icon">{selectedMode === "lift" ? <Dumbbell size={30} /> : <Footprints size={30} />}</div><span className="mini-orbit" /></div><div><p className="eyebrow">{selectedMode === "lift" ? "STRENGTH SESSION" : "OUTDOOR RUN"}</p><h2>{selectedMode === "lift" ? "Upper body power" : "Tempo intervals"}</h2><p>{selectedMode === "lift" ? "5 movements · 42 min · progressive load" : "4.2 mi target · rolling pace · riverside route"}</p></div><Button className="lime-button" onClick={() => startWorkout()}><Play size={15} fill="currentColor" /> Start now</Button></Card>}
      <section className="section-block"><div className="section-heading"><div><p className="eyebrow">RECENT SESSIONS</p><h3>Your work, logged.</h3></div><button className="quiet-link">See all <ArrowRight size={14} /></button></div><div className="history-list"><button className="history-row"><div className="history-icon lift"><Dumbbell size={17} /></div><div><strong>Lower body strength</strong><span>Yesterday · 48 min</span></div><b>7,840 lb</b><ChevronDown size={16} /></button><button className="history-row"><div className="history-icon run"><Footprints size={17} /></div><div><strong>Easy morning run</strong><span>Sunday · 3.8 mi</span></div><b>9:14 /mi</b><ChevronDown size={16} /></button><button className="history-row"><div className="history-icon hybrid"><Activity size={17} /></div><div><strong>Full body + 1 mi</strong><span>Friday · 56 min</span></div><b>82 load</b><ChevronDown size={16} /></button></div></section>
    </div>
  );

  const renderInsights = () => (
    <div className="page-stack animate-in">
      <section className="page-title-row"><div><p className="eyebrow">SIGNALS & TRENDS</p><h1>Know your edge<span className="lime-dot">.</span></h1><p className="subcopy">Your last 30 days, without the noise.</p></div><button className="circle-button"><MoreHorizontal size={18} /></button></section>
      <Card className="recovery-card"><div><p className="eyebrow light-eyebrow">CURRENT READINESS</p><h2>84<span>/100</span></h2><p>Above your 30-day average by <strong>+9</strong>.</p></div><div className="readiness-ring"><div><strong>84</strong><span>READY</span></div></div></Card>
      <section className="section-block"><div className="section-heading"><div><p className="eyebrow">TRAINING LOAD</p><h3>Steady is strong.</h3></div><span className="period-pill">LAST 30 DAYS <ChevronDown size={14} /></span></div><Card className="chart-card"><div className="chart-head"><div><strong>642</strong><span>total load</span></div><div className="positive-stat"><TrendingUp size={14} /> 18% vs prior</div></div><div className="area-chart"><div className="chart-grid"><span /><span /><span /><span /></div><svg viewBox="0 0 500 150" preserveAspectRatio="none" aria-label="Training load trend"><path d="M0 126 C35 122, 42 96, 72 105 S112 118, 140 76 S182 98, 210 88 S258 104, 282 45 S322 88, 350 66 S388 78, 412 36 S457 55, 500 18" fill="none" stroke="#b8f34a" strokeWidth="4" strokeLinecap="round" /><path d="M0 126 C35 122, 42 96, 72 105 S112 118, 140 76 S182 98, 210 88 S258 104, 282 45 S322 88, 350 66 S388 78, 412 36 S457 55, 500 18 L500 150 L0 150Z" fill="#b8f34a" opacity=".08" /></svg></div><div className="chart-labels"><span>SEP 16</span><span>SEP 23</span><span>SEP 30</span><span>OCT 7</span><span>OCT 15</span></div></Card></section>
      <section className="section-block"><div className="section-heading"><div><p className="eyebrow">PERSONALIZED NOTES</p><h3>Your coach, in context.</h3></div></div><div className="insight-list"><div className="insight-item lime-border"><div className="insight-icon"><Sparkles size={17} /></div><div><strong>Your best lift window is 5:45–7:00 PM.</strong><span>You complete 22% more volume when your last meal is 2+ hours before training.</span></div><ArrowRight size={16} /></div><div className="insight-item coral-border"><div className="insight-icon"><Wind size={17} /></div><div><strong>Thursday is your run day.</strong><span>Your pace is strongest when humidity stays under 65% and your sleep score is above 75.</span></div><ArrowRight size={16} /></div></div></section>
    </div>
  );

  const renderBlueprint = () => (
    <div className="page-stack animate-in blueprint-page">
      <section className="page-title-row"><div><p className="eyebrow">PRODUCT PLAN · V1.0</p><h1>The PulseWindow blueprint<span className="lime-dot">.</span></h1><p className="subcopy">A product and architecture brief for context-aware training.</p></div><div className="document-badge"><ShieldCheck size={18} /><span>READY<br />TO BUILD</span></div></section>
      <div className="doc-toggle"><button className={docTab === "prd" ? "active" : ""} onClick={() => setDocTab("prd")}>Product requirements</button><button className={docTab === "architecture" ? "active" : ""} onClick={() => setDocTab("architecture")}>Technical architecture</button></div>
      <Card className="doc-hero"><span className="doc-number">{docTab === "prd" ? "01" : "02"}</span><div><p className="eyebrow">{docTab === "prd" ? "PRD SNAPSHOT" : "SYSTEM SNAPSHOT"}</p><h2>{docTab === "prd" ? "A smarter reason to show up." : "Small inputs. One clear decision."}</h2><p>{docTab === "prd" ? "The MVP turns scattered life context into one confident training recommendation, then makes logging the session feel effortless." : "A composable decision engine sits between external signals and a calm, mobile-first workout experience."}</p></div></Card>
      <div className="doc-grid">{docSections[docTab].map((section) => <article className="doc-section" key={section.title}><p className="eyebrow">{section.eyebrow}</p><h3>{section.title}</h3><p>{section.body}</p></article>)}</div>
      <section className="schema-card"><div className="section-heading"><div><p className="eyebrow">DATA MODEL / DATABASE SCHEMA</p><h3>One athlete graph.</h3></div><Info size={17} /></div><div className="schema-grid"><div><span>ATHLETES</span><strong>profiles · goals · preferences</strong></div><div><span>SESSIONS</span><strong>planned · started · completed</strong></div><div><span>STRENGTH SETS</span><strong>exercise · load · reps · RPE</strong></div><div><span>RUN METRICS</span><strong>GPS · pace · elevation · splits</strong></div><div><span>CONTEXT SIGNALS</span><strong>weather · crowd · sleep · calendar</strong></div><div><span>WINDOW SCORES</span><strong>score · reasons · response</strong></div></div></section>
      <div className="integration-strip"><div><CloudSun size={17} /><span>WeatherKit</span></div><div><CalendarDays size={17} /><span>Calendar APIs</span></div><div><MapPin size={17} /><span>Mapbox / GPS</span></div><div><HeartPulse size={17} /><span>HealthKit</span></div></div>
    </div>
  );

  const activeContent = activeTab === "home" ? renderHome() : activeTab === "train" ? renderTrain() : activeTab === "insights" ? renderInsights() : renderBlueprint();

  return (
    <main className="app-shell">
      <aside className="desktop-rail"><div className="rail-brand"><div className="brand-mark"><span /><span /><span /></div><span>PW</span></div><nav>{navItems.map((item) => { const Icon = item.icon; return <button key={item.id} className={activeTab === item.id ? "active" : ""} onClick={() => setActiveTab(item.id)}><Icon size={19} /><span>{item.label}</span></button>; })}</nav><div className="rail-bottom"><button><CircleHelp size={18} /> Help center</button><div className="rail-profile"><span>AL</span><div><strong>Alex Laurent</strong><small>Pro athlete</small></div><MoreHorizontal size={16} /></div></div></aside>
      <div className="app-main"><div className="content-wrap">{renderHeader()}<div className="mobile-tab-label"><span>{navItems.find((item) => item.id === activeTab)?.label}</span><button onClick={() => setShowMenu((value) => !value)}><Menu size={19} /></button></div>{activeContent}</div><nav className="mobile-nav">{navItems.map((item) => { const Icon = item.icon; return <button key={item.id} className={activeTab === item.id ? "active" : ""} onClick={() => setActiveTab(item.id)}><Icon size={19} /><span>{item.label}</span></button>; })}</nav></div>
      {alertStatus !== "Ready when you are" && <button className="toast-status" onClick={() => setAlertStatus("Ready when you are")}><Check size={15} /> {alertStatus}</button>}
    </main>
  );
};

export default Index;
