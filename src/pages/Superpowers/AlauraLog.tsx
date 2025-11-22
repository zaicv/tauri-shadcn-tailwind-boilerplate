import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TheGlowOrb from "@/components/Orb/TheGlowOrb";
import GPTCarousel from "@/components/Orb/GPTCarousel";
import {
  Line,
  ResponsiveContainer,
  LineChart,
  AreaChart,
  Area,
} from "recharts";
import { CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { usePersona } from "@/context/PersonaContext";
import { useAuth } from "@/components/auth/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/supabase/supabaseClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  LogIn,
  User,
  Calendar,
  BarChart3,
  Apple,
  Droplets,
  Moon,
  Sun,
  Pill,
  Activity,
  MessageCircle,
  Blend,
  Fingerprint,
  Sparkles,
  Circle,
  Gem,
  CircleDashed,
  Brain,
  Square,
  Sparkle,
  Disc,
  House,
  UserRound,
  CalendarDays,
  Star,
  ArrowRight,
} from "lucide-react";

// Persona type definition
type Persona = {
  id: string;
  name: string;
  description: string;
  colors: string[];
  model: string;
  personality: string;
  expertise: string[];
  recentTopics: string[];
  avatar: string;
  status: string;
  energy: number;
  security: string;
};

// Health data type matching your Supabase table
type HealthData = {
  id?: string;
  user_id?: string;
  date: string;
  am_blood_pressure?: string;
  pm_blood_pressure?: string;
  weight?: number;
  water_intake: number;
  meals_eaten: number;
  hours_sleep: number;
  sleep_debt?: number;
  meds_taken: number;
  glow_process: number;
  gentle_movement: number;
  day_complete?: boolean;
  created_at?: string;
  updated_at?: string;
};

export default function HomePage() {
  // Use global authentication context
  const { user, session } = useAuth();

  // Add persona context
  const { switchPersona, currentPersona } = usePersona();

  // Use global theme context
  const { theme, setTheme, isDark } = useTheme();

  // Add selected persona state
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);

  const [log, setLog] = useState<HealthData>({
    date: new Date().toISOString().split("T")[0],
    am_blood_pressure: "",
    pm_blood_pressure: "",
    water_intake: 0,
    meals_eaten: 0,
    hours_sleep: 0,
    meds_taken: 0,
    glow_process: 0,
    gentle_movement: 0,
    day_complete: false,
  });

  const [healthHistory, setHealthHistory] = useState<HealthData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCarousel, setShowCarousel] = useState(false);

  // Add state for save confirmation and tabs
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [activeTab, setActiveTab] = useState("glow-score");
  const [dateRange, setDateRange] = useState(30); // days to look back

  // Add timeline state
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Add state for mobile detail view
  const [showDetailView, setShowDetailView] = useState(false);
  const [detailViewTab, setDetailViewTab] = useState("input");

  // Add state for sleep debt
  const [sleepDebt, setSleepDebt] = useState<number>(0);

  // Add state for main view tabs
  const [mainViewTab, setMainViewTab] = useState("timeline");

  // Add state for timeline view mode (daily/weekly)
  const [timelineViewMode, setTimelineViewMode] = useState<"daily" | "weekly">(
    "daily"
  );

  // Enhanced caching for backend optimization
  const [dataCache, setDataCache] = useState<Map<string, HealthData>>(
    new Map()
  );
  const [lastSaveTime, setLastSaveTime] = useState<number>(0);

  // Generate timeline dates with better performance
  const timelineDates = useMemo(() => {
    const dates = [];
    const range = timelineViewMode === "weekly" ? 70 : 31; // More days for weekly view
    for (let i = 0; i < range; i++) {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(range / 2) + i);
      dates.push(date);
    }
    return dates;
  }, [timelineViewMode]);

  // Get day of week color with enhanced visibility
  const getDayColor = (dayOfWeek: number) => {
    const colors: Record<number, string> = {
      1: "text-red-400", // Monday
      2: "text-blue-400", // Tuesday
      3: "text-orange-400", // Wednesday
      4: "text-green-400", // Thursday
      5: "text-purple-400", // Friday
      6: "text-yellow-400", // Saturday
      0: "text-pink-400", // Sunday
    };
    return colors[dayOfWeek] || "text-neutral-400";
  };

  // Check if a day is completed from Supabase data
  const isDayCompleted = useCallback(
    (date: Date) => {
      const dateString = date.toLocaleDateString("en-CA");
      const dayData = dataCache.get(dateString);
      return dayData?.day_complete || false;
    },
    [dataCache]
  );

  // Enhanced circle styling with better visual hierarchy
  const getCircleStyle = (date: Date, monthColor: string) => {
    const completed = isDayCompleted(date);
    const isSelected = date.toDateString() === selectedDate.toDateString();
    const isToday = date.toDateString() === new Date().toDateString();

    let baseClass =
      "w-16 h-16 rounded-full transition-all duration-300 relative";

    if (completed) {
      baseClass += ` ${monthColor} text-white shadow-lg`;
    } else {
      baseClass += ` border-2 bg-transparent text-neutral-400`;
    }

    if (isSelected) {
      baseClass +=
        " ring-2 ring-blue-400 ring-offset-2 ring-offset-neutral-950 scale-110";
    }

    if (isToday && !isSelected) {
      baseClass += " ring-1 ring-yellow-400";
    }

    return baseClass;
  };

  // Get border color based on month
  const getBorderColor = (monthColor: string) => {
    const borderMap: Record<string, string> = {
      "bg-orange-400": "border-orange-400",
      "bg-yellow-400": "border-yellow-400",
      "bg-green-400": "border-green-400",
      "bg-purple-300": "border-purple-300",
      "bg-purple-600": "border-purple-600",
    };
    return borderMap[monthColor] || "border-neutral-400";
  };

  // Enhanced partial fill with better animation
  const getPartialFill = (date: Date, monthColor: string) => {
    const completion = getCompletionPercentage(date);
    if (completion > 0 && completion < 100) {
      const radius = 28;
      const circumference = 2 * Math.PI * radius;
      const strokeDashoffset =
        circumference - (completion / 100) * circumference;

      return (
        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            className="text-neutral-700"
          />
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={monthColor.replace("bg-", "text-")}
            style={{
              transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </svg>
      );
    }
    return null;
  };

  // Get day name
  const getDayName = (dayOfWeek: number) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days[dayOfWeek];
  };

  // Enhanced weekly grouping with better spacing
  const groupDatesByWeek = (dates: Date[]) => {
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];

    dates.forEach((date, index) => {
      const dayOfWeek = date.getDay();

      if (dayOfWeek === 1 && currentWeek.length > 0) {
        // Start new week on Monday
        weeks.push([...currentWeek]);
        currentWeek = [];
      }

      currentWeek.push(date);

      if (index === dates.length - 1) {
        weeks.push(currentWeek);
      }
    });

    return weeks;
  };

  // Get month color with enhanced palette
  const getMonthColor = (date: Date) => {
    const month = date.getMonth();
    const monthColors = [
      "bg-blue-400", // January
      "bg-purple-400", // February
      "bg-green-400", // March
      "bg-yellow-400", // April
      "bg-orange-400", // May
      "bg-red-400", // June
      "bg-pink-400", // July
      "bg-orange-400", // August
      "bg-yellow-400", // September
      "bg-green-400", // October
      "bg-purple-300", // November
      "bg-purple-600", // December
    ];
    return monthColors[month] || "bg-neutral-400";
  };

  // Optimized health data loading with caching
  const loadHealthData = useCallback(
    async (date: Date) => {
      try {
        const dateString = date.toLocaleDateString("en-CA");

        // Check cache first
        if (dataCache.has(dateString)) {
          const cachedData = dataCache.get(dateString)!;
          setLog((prev) => ({ ...prev, ...cachedData, date: dateString }));
          return;
        }

        const { data, error } = await supabase
          .from("health")
          .select("*")
          .eq("user_id", user?.id)
          .eq("date", dateString)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          console.error("Error loading health data:", error);
          return;
        }

        const healthData = data || {
          date: dateString,
          am_blood_pressure: "",
          pm_blood_pressure: "",
          water_intake: 0,
          meals_eaten: 0,
          hours_sleep: 0,
          meds_taken: 0,
          glow_process: 0,
          gentle_movement: 0,
          day_complete: false,
        };

        // Cache the data
        setDataCache((prev) => new Map(prev.set(dateString, healthData)));

        setLog((prev) => ({ ...prev, ...healthData, date: dateString }));
      } catch (error) {
        console.error("Error loading health data:", error);
      }
    },
    [user?.id, dataCache]
  );

  // Enhanced completion percentage calculation
  const getCompletionPercentage = useCallback(
    (date: Date) => {
      const dateString = date.toLocaleDateString("en-CA");
      const dayData = dataCache.get(dateString);

      if (!dayData && date.toDateString() !== selectedDate.toDateString()) {
        return 0;
      }

      const data = dayData || log;
      let completed = 0;
      const total = 6;

      if (data.meals_eaten >= 5) completed++;
      if (data.water_intake >= 80) completed++;
      if (data.hours_sleep >= 10) completed++;
      if (data.meds_taken >= 4) completed++;
      if (data.glow_process >= 1) completed++;
      if (data.gentle_movement >= 1) completed++;

      return (completed / total) * 100;
    },
    [dataCache, log, selectedDate]
  );

  // Optimized save with debouncing and better error handling
  const saveHealthData = useCallback(async () => {
    if (!user) return;

    // Remove debouncing for now to fix save issues
    // if (Date.now() - lastSaveTime < 1000) return;

    setLoading(true);
    setLastSaveTime(Date.now());

    console.log(
      "Saving data for date:",
      selectedDate.toLocaleDateString("en-CA")
    );

    try {
      const dateString = selectedDate.toLocaleDateString("en-CA");
      const healthDataToSave = {
        user_id: user.id,
        date: dateString,
        am_blood_pressure: log.am_blood_pressure || "",
        pm_blood_pressure: log.pm_blood_pressure || "",
        water_intake: log.water_intake || 0,
        meals_eaten: log.meals_eaten || 0,
        hours_sleep: log.hours_sleep || 0,
        meds_taken: log.meds_taken || 0,
        glow_process: log.glow_process || 0,
        gentle_movement: log.gentle_movement || 0,
        day_complete: log.day_complete || false,
        updated_at: new Date().toISOString(),
      };

      // Try update first, then insert if no record exists
      const { data: existingRecord } = await supabase
        .from("health")
        .select("id")
        .eq("user_id", user.id)
        .eq("date", dateString)
        .maybeSingle();

      let result;
      if (existingRecord) {
        result = await supabase
          .from("health")
          .update(healthDataToSave)
          .eq("id", existingRecord.id);
      } else {
        result = await supabase.from("health").insert(healthDataToSave);
      }

      if (result.error) {
        console.error("Error saving health data:", result.error);
        alert("Error saving: " + result.error.message);
        setLoading(false);
        return;
      }

      // Update cache
      setDataCache((prev) => new Map(prev.set(dateString, healthDataToSave)));

      setShowSaveConfirmation(true);
      setTimeout(() => setShowSaveConfirmation(false), 2000);

      console.log("Save successful!");

      // Reload data
      await loadHealthData(selectedDate);
      await loadHealthHistory();
      await calculateSleepDebt();
    } catch (error) {
      console.error("Error saving health data:", error);
    } finally {
      setLoading(false);
    }
  }, [user, lastSaveTime, selectedDate, log]);

  // Calculate sleep debt from past 2 weeks
  const calculateSleepDebt = useCallback(async () => {
    try {
      if (!user) return;

      // Try RPC function first, fallback to manual calculation
      const { data, error } = await supabase.rpc("calculate_sleep_debt", {
        user_id_param: user.id,
        days_back: 14,
      });

      if (error) {
        // Fallback: manual calculation
        const { data: sleepData } = await supabase
          .from("health")
          .select("hours_sleep")
          .eq("user_id", user.id)
          .gte(
            "date",
            new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0]
          )
          .not("hours_sleep", "is", null);

        const totalSleep =
          sleepData?.reduce(
            (sum, record) => sum + (record.hours_sleep || 0),
            0
          ) || 0;
        const sleepNeeded = 8 * 14; // 8 hours × 14 days
        const debt = Math.max(0, sleepNeeded - totalSleep);
        setSleepDebt(debt);
      } else {
        setSleepDebt(data || 0);
      }
    } catch (error) {
      console.error("Error calculating sleep debt:", error);
      setSleepDebt(0);
    }
  }, [user]);

  // Optimized health history loading
  const loadHealthHistory = useCallback(async () => {
    try {
      if (!user) return;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);

      const { data, error } = await supabase
        .from("health")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", startDate.toISOString().split("T")[0])
        .order("date", { ascending: true });

      if (error) throw error;

      const historyData = data || [];
      setHealthHistory(historyData);

      // Update cache with history data
      setDataCache((prev) => {
        const newCache = new Map(prev);
        historyData.forEach((record) => {
          newCache.set(record.date, record);
        });
        return newCache;
      });
    } catch (error) {
      console.error("Error loading health history:", error);
    }
  }, [user, dateRange]);

  // Enhanced glow score calculation
  const calculateGlowScore = useCallback((healthData: HealthData) => {
    let score = 0;
    if (healthData.meals_eaten >= 5) score++;
    if (healthData.water_intake >= 80) score++;
    if (healthData.hours_sleep >= 10) score++;
    if (healthData.meds_taken >= 4) score++;
    if (healthData.glow_process >= 1) score++;
    if (healthData.gentle_movement >= 1) score++;
    return (score / 6) * 100;
  }, []);

  // Auto-complete day when all targets are met
  const checkAutoComplete = useCallback(
    (newLog: HealthData) => {
      const glowScore = calculateGlowScore(newLog);
      const shouldComplete = glowScore === 100;
      if (shouldComplete !== newLog.day_complete) {
        setLog((prev) => ({ ...prev, day_complete: shouldComplete }));
      }
    },
    [calculateGlowScore]
  );

  // Enhanced chart data generation with better performance
  const getChartData = useMemo(() => {
    const processData = (records: HealthData[]) => {
      return records.map((record) => ({
        day: new Date(record.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        date: record.date,
        score: calculateGlowScore(record),
        water: record.water_intake,
        meals: record.meals_eaten,
        sleep: record.hours_sleep,
        medicine: record.meds_taken,
        glow: record.glow_process,
        movement: record.gentle_movement,
      }));
    };

    return processData(healthHistory);
  }, [healthHistory, calculateGlowScore]);

  // Enhanced chart configuration with better colors and styling
  const getChartConfig = () => {
    const configs: Record<string, any> = {
      "glow-score": {
        title: "Glow Score",
        target: 100,
        unit: "%",
        dataKey: "score",
        color: "#10B981",
        gradient: "from-emerald-400 to-emerald-600",
      },
      water: {
        title: "Water Intake",
        target: 80,
        unit: "oz",
        dataKey: "water",
        color: "#3B82F6",
        gradient: "from-blue-400 to-blue-600",
      },
      meals: {
        title: "Meals Eaten",
        target: 5,
        unit: "meals",
        dataKey: "meals",
        color: "#F59E0B",
        gradient: "from-amber-400 to-amber-600",
      },
      sleep: {
        title: "Hours of Sleep",
        target: 10,
        unit: "hrs",
        dataKey: "sleep",
        color: "#8B5CF6",
        gradient: "from-violet-400 to-violet-600",
      },
      medicine: {
        title: "Medicine Taken",
        target: 4,
        unit: "meds",
        dataKey: "medicine",
        color: "#EC4899",
        gradient: "from-pink-400 to-pink-600",
      },
      glow: {
        title: "Glow Process",
        target: 1,
        unit: "time",
        dataKey: "glow",
        color: "#F59E0B",
        gradient: "from-yellow-400 to-yellow-600",
      },
      movement: {
        title: "Gentle Movement",
        target: 1,
        unit: "time",
        dataKey: "movement",
        color: "#10B981",
        gradient: "from-emerald-400 to-emerald-600",
      },
    };
    return configs[activeTab] || configs["glow-score"];
  };

  // Load data when component mounts or date changes
  useEffect(() => {
    if (user) {
      loadHealthData(selectedDate);
    }
  }, [selectedDate, user, loadHealthData]);

  useEffect(() => {
    if (user) {
      loadHealthHistory();
      calculateSleepDebt();
    }
  }, [dateRange, user, loadHealthHistory, calculateSleepDebt]);

  // Update log when date changes
  const handleDateChange = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const handleChange = useCallback(
    (field: string, value: any) => {
      setLog((prev) => {
        const newLog = { ...prev, [field]: value };
        checkAutoComplete(newLog);
        return newLog;
      });
    },
    [checkAutoComplete]
  );

  // Update the handler to work like DesktopApp
  const handlePersonaSelect = useCallback(
    (persona: Persona) => {
      console.log("Selected Persona:", persona);
      switchPersona(persona.id as any);
      setSelectedPersona(persona);
      setShowCarousel(false);
    },
    [switchPersona]
  );

  // Goals based on your health data
  const goals = useMemo(
    () => [
      { name: "5 Meals", current: log.meals_eaten, target: 5, unit: "meals" },
      {
        name: "80 oz Water",
        current: log.water_intake,
        target: 80,
        unit: "oz",
      },
      {
        name: "10 hrs Sleep",
        current: log.hours_sleep,
        target: 10,
        unit: "hrs",
      },
      { name: "4 Meds", current: log.meds_taken, target: 4, unit: "meds" },
      {
        name: "Glow Process",
        current: log.glow_process,
        target: 1,
        unit: "time",
      },
      {
        name: "Gentle Movement",
        current: log.gentle_movement,
        target: 1,
        unit: "time",
      },
    ],
    [log]
  );

  // Enhanced theme classes with better contrast and accessibility
  const themeClasses = {
    background: theme === "dark" ? "bg-neutral-950" : "bg-gray-50",
    text: theme === "dark" ? "text-white" : "text-gray-900",
    textSecondary: theme === "dark" ? "text-neutral-400" : "text-gray-600",
    textMuted: theme === "dark" ? "text-neutral-300" : "text-gray-500",
    card:
      theme === "dark"
        ? "bg-neutral-800/50 backdrop-blur-sm"
        : "bg-white/90 backdrop-blur-sm",
    cardBorder: theme === "dark" ? "border-neutral-700" : "border-gray-200",
    input:
      theme === "dark"
        ? "bg-neutral-800 border-neutral-700 text-white placeholder-neutral-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
    button:
      theme === "dark"
        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
        : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl",
    buttonSecondary:
      theme === "dark"
        ? "bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-700"
        : "bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-300",
    tabActive:
      theme === "dark"
        ? "bg-blue-500/20 text-blue-400 shadow-lg"
        : "bg-blue-100 text-blue-600 shadow-md",
    tabInactive:
      theme === "dark"
        ? "text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800/50"
        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
    bottomBar:
      theme === "dark"
        ? "bg-neutral-950/90 border-neutral-800/50 backdrop-blur-lg"
        : "bg-white/90 border-gray-200/50 backdrop-blur-lg",
    detailView: theme === "dark" ? "bg-neutral-950" : "bg-gray-50",
    detailHeader: theme === "dark" ? "border-neutral-800" : "border-gray-200",
    progressBg: theme === "dark" ? "bg-neutral-700" : "bg-gray-200",
    chartBg: theme === "dark" ? "bg-neutral-800/30" : "bg-gray-100/30",
    chartGrid: theme === "dark" ? "#374151" : "#E5E7EB",
    chartAxis: theme === "dark" ? "#9CA3AF" : "#6B7280",
    tooltip:
      theme === "dark"
        ? {
            backgroundColor: "#1F2937",
            border: "1px solid #374151",
            borderRadius: "8px",
          }
        : {
            backgroundColor: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
          },
  };

  // Toggle theme function
  const toggleTheme = useCallback(() => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("phoebe_theme", newTheme);
  }, [theme]);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("phoebe_theme") as
      | "light"
      | "dark"
      | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Enhanced dock items
  const dockItems = useMemo(
    () => [
      {
        title: "Chat",
        icon: <MessageCircle className="h-full w-full text-white" />,
        href: "/Chat",
      },
      {
        title: "GPTs",
        icon: <Blend className="h-full w-full text-white" />,
        href: "/gpts",
      },
      {
        title: "Login",
        icon: <Fingerprint className="h-full w-full text-white" />,
        href: "/authbox",
      },
      {
        title: "Superpowers",
        icon: <Sparkles className="h-full w-full text-white" />,
        href: "/superbrowse",
      },
      {
        title: "Luma",
        icon: <Circle className="h-full w-full text-white" />,
        href: "/luma",
      },
      {
        title: "Phoebe",
        icon: <Gem className="h-full w-full text-white" />,
        href: "/phoebe",
      },
      {
        title: "Theme",
        icon: <CircleDashed className="h-full w-full text-white" />,
        href: "#",
      },
      {
        title: "Memories",
        icon: <Brain className="h-full w-full text-white" />,
        href: "/memories",
      },
      {
        title: "Desktop App",
        icon: <Square className="h-full w-full text-white" />,
        href: "/desktopapp",
      },
      {
        title: "Splash",
        icon: <Sparkle className="h-full w-full text-white" />,
        href: "/splash",
      },
      {
        title: "MakeMKV",
        icon: <Disc className="h-full w-full text-white" />,
        href: "/makemkvpage",
      },
      {
        title: "Terminal",
        icon: <House className="h-full w-full text-white" />,
        href: "/terminal",
      },
      {
        title: "Profile",
        icon: <UserRound className="h-full w-full text-white" />,
        href: "/profile",
      },
    ],
    []
  );

  return (
    <div
      className={`h-screen overflow-hidden ${themeClasses.background} ${themeClasses.text} flex flex-col relative transition-all duration-300`}
    >
      {/* Enhanced Header */}
      <header className="flex-shrink-0 w-full flex justify-between items-center p-4 pt-8">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent"
        >
          Alaura
        </motion.h1>

        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <motion.button
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-all duration-300 ${
              theme === "dark"
                ? "bg-neutral-800 hover:bg-neutral-700 text-yellow-400"
                : "bg-gray-200 hover:bg-gray-300 text-orange-500"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <AnimatePresence mode="wait">
              {theme === "dark" ? (
                <motion.div
                  key="moon"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon className="w-4 h-4" />
                </motion.div>
              ) : (
                <motion.div
                  key="sun"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun className="w-4 h-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {user ? (
            <Avatar className="h-8 w-8 border-2 border-blue-500/50 shadow-lg">
              <AvatarImage
                src={user.user_metadata?.avatar_url || ""}
                alt={user.user_metadata?.name || "User"}
              />
              <AvatarFallback className="bg-blue-600 text-white text-xs font-semibold">
                {user.user_metadata?.name?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          ) : (
            <Button
              onClick={() => (window.location.href = "/authbox")}
              variant="outline"
              size="sm"
              className={`border-blue-500/50 text-blue-400 text-xs px-3 py-1 rounded-lg hover:bg-blue-500/10 transition-all duration-200 ${themeClasses.buttonSecondary}`}
            >
              <LogIn className="w-3 h-3 mr-1" />
              Login
            </Button>
          )}
        </div>
      </header>

      {/* Main Content Area - Takes remaining space */}
      <div className="flex-1 overflow-hidden flex flex-col px-4">
        {mainViewTab === "timeline" && (
          <div className="flex-1 flex flex-col">
            {/* Timeline View Mode Toggle */}
            <div className="flex justify-center mb-4 flex-shrink-0">
              <div
                className={`${themeClasses.card} rounded-xl p-1 border ${themeClasses.cardBorder}`}
              >
                <button
                  onClick={() => setTimelineViewMode("daily")}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                    timelineViewMode === "daily"
                      ? "bg-blue-500 text-white shadow-md"
                      : `${themeClasses.textSecondary} hover:${themeClasses.text}`
                  }`}
                >
                  <Calendar className="w-3 h-3 mr-1 inline" />
                  Daily
                </button>
                <button
                  onClick={() => setTimelineViewMode("weekly")}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                    timelineViewMode === "weekly"
                      ? "bg-blue-500 text-white shadow-md"
                      : `${themeClasses.textSecondary} hover:${themeClasses.text}`
                  }`}
                >
                  <CalendarDays className="w-3 h-3 mr-1 inline" />
                  Weekly
                </button>
              </div>
            </div>

            {/* Enhanced Timeline - Scrollable content */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              <div className="space-y-6 pb-4">
                {groupDatesByWeek(timelineDates).map((week, weekIndex) => (
                  <motion.div
                    key={weekIndex}
                    className="space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: weekIndex * 0.1 }}
                  >
                    {/* Week header */}
                    <div className="flex items-center justify-center space-x-3">
                      {week.map((date, dayIndex) => {
                        const dayOfWeek = date.getDay();
                        const dayColor = getDayColor(dayOfWeek);
                        const dayName = getDayName(dayOfWeek);

                        return (
                          <div key={dayIndex} className="w-12 text-center">
                            <div
                              className={`text-xs font-bold ${dayColor} tracking-wide`}
                            >
                              {dayName}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Week dates - Smaller circles for iOS */}
                    <div className="flex items-center justify-center space-x-3">
                      {week.map((date, dayIndex) => {
                        const isSelected =
                          date.toDateString() === selectedDate.toDateString();
                        const isToday =
                          date.toDateString() === new Date().toDateString();
                        const monthColor = getMonthColor(date);
                        const completed = isDayCompleted(date);
                        const borderColor = getBorderColor(monthColor);

                        let baseClass =
                          "w-12 h-12 rounded-full transition-all duration-300 relative flex items-center justify-center font-bold text-sm shadow-md";

                        if (completed) {
                          baseClass += ` ${monthColor} text-white`;
                        } else {
                          baseClass += ` border-2 bg-transparent text-neutral-400`;
                        }

                        if (isSelected) {
                          baseClass +=
                            " ring-2 ring-blue-400 ring-offset-1 ring-offset-neutral-950 scale-110";
                        }

                        if (isToday && !isSelected) {
                          baseClass += " ring-1 ring-yellow-400";
                        }

                        return (
                          <motion.button
                            key={dayIndex}
                            onClick={() => {
                              setSelectedDate(date);
                              setShowDetailView(true);
                            }}
                            className={`${baseClass} ${borderColor}`}
                            whileHover={{ scale: isSelected ? 1.1 : 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {date.getDate()}
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {mainViewTab === "charts" && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-shrink-0 text-center mb-4">
              <motion.h2
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-xl font-bold ${themeClasses.text} mb-3`}
              >
                Health Trends
              </motion.h2>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(Number(e.target.value))}
                className={`${themeClasses.input} rounded-xl px-3 py-2 text-sm focus:outline-none transition-all duration-200 shadow-lg`}
              >
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
                <option value={30}>Last 30 days</option>
                <option value={60}>Last 60 days</option>
              </select>
            </div>

            {/* Dashboard Section */}
            <div className="flex-shrink-0 mb-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Glow Score Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`${themeClasses.card} rounded-xl p-4 border ${themeClasses.cardBorder} text-center`}
                >
                  <h3 className={`text-sm font-bold ${themeClasses.text} mb-2`}>
                    🌟 Glow Score
                  </h3>
                  <div className="text-2xl font-bold text-yellow-400 mb-1">
                    {Math.round(calculateGlowScore(log))}%
                  </div>
                  <div className={`text-xs ${themeClasses.textSecondary}`}>
                    Today
                  </div>
                </motion.div>

                {/* Sleep Debt Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className={`${themeClasses.card} rounded-xl p-4 border ${themeClasses.cardBorder} text-center`}
                >
                  <h3 className={`text-sm font-bold ${themeClasses.text} mb-2`}>
                    😴 Sleep Debt
                  </h3>
                  <div
                    className={`text-2xl font-bold ${
                      sleepDebt > 0 ? "text-red-400" : "text-green-400"
                    } mb-1`}
                  >
                    {sleepDebt > 0 ? `+${sleepDebt.toFixed(1)}` : "0"}h
                  </div>
                  <div className={`text-xs ${themeClasses.textSecondary}`}>
                    Past 2 weeks
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Charts - Scrollable */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              <div className="space-y-4 pb-4">
                {[
                  {
                    id: "glow-score",
                    label: "Glow Score",
                    icon: "🌟",
                  },
                  {
                    id: "water",
                    label: "Water Intake",
                    icon: "💧",
                  },
                  {
                    id: "meals",
                    label: "Meals Eaten",
                    icon: "🍎",
                  },
                  {
                    id: "sleep",
                    label: "Sleep Hours",
                    icon: "🌙",
                  },
                  {
                    id: "medicine",
                    label: "Medicine Taken",
                    icon: "💊",
                  },
                  {
                    id: "glow",
                    label: "Glow Process",
                    icon: "⭐",
                  },
                  {
                    id: "movement",
                    label: "Gentle Movement",
                    icon: "➡️",
                  },
                ].map((chart, index) => {
                  const config: { dataKey: string; color: string } = {
                    "glow-score": { dataKey: "score", color: "#10B981" },
                    water: { dataKey: "water", color: "#3B82F6" },
                    meals: { dataKey: "meals", color: "#F59E0B" },
                    sleep: { dataKey: "sleep", color: "#8B5CF6" },
                    medicine: { dataKey: "medicine", color: "#EC4899" },
                    glow: { dataKey: "glow", color: "#F59E0B" },
                    movement: { dataKey: "movement", color: "#10B981" },
                  }[chart.id] || { dataKey: "score", color: "#10B981" };

                  return (
                    <motion.div
                      key={chart.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`${themeClasses.card} rounded-xl p-4 border ${themeClasses.cardBorder} shadow-lg transition-all duration-300`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3
                          className={`text-base font-bold ${themeClasses.text} flex items-center gap-2`}
                        >
                          <span className="text-lg">{chart.icon}</span>
                          {chart.label}
                        </h3>
                        <button
                          onClick={() => setActiveTab(chart.id)}
                          className="text-blue-400 text-xs hover:text-blue-300 font-medium px-2 py-1 rounded-lg hover:bg-blue-400/10 transition-all duration-200"
                        >
                          Details
                        </button>
                      </div>

                      {/* Compact Chart */}
                      <div className="h-32 w-full">
                        {getChartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={getChartData}>
                              <defs>
                                <linearGradient
                                  id={`gradient-${chart.id}`}
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="5%"
                                    stopColor={config.color}
                                    stopOpacity={0.3}
                                  />
                                  <stop
                                    offset="95%"
                                    stopColor={config.color}
                                    stopOpacity={0.1}
                                  />
                                </linearGradient>
                              </defs>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke={themeClasses.chartGrid}
                                strokeOpacity={0.3}
                              />
                              <XAxis
                                dataKey="day"
                                stroke={themeClasses.chartAxis}
                                fontSize={10}
                                axisLine={false}
                                tickLine={false}
                              />
                              <YAxis
                                stroke={themeClasses.chartAxis}
                                fontSize={10}
                                axisLine={false}
                                tickLine={false}
                              />
                              <Tooltip
                                contentStyle={{
                                  ...themeClasses.tooltip,
                                  fontSize: "12px",
                                  padding: "8px",
                                }}
                              />
                              <Area
                                type="monotone"
                                dataKey={config.dataKey}
                                stroke={config.color}
                                fill={`url(#gradient-${chart.id})`}
                                strokeWidth={2}
                                dot={{
                                  fill: config.color,
                                  strokeWidth: 1,
                                  r: 3,
                                  stroke: "#fff",
                                }}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div
                            className={`flex items-center justify-center h-full ${themeClasses.textSecondary} ${themeClasses.chartBg} rounded-lg border border-dashed ${themeClasses.cardBorder}`}
                          >
                            <div className="text-center">
                              <div className="text-xl mb-1">{chart.icon}</div>
                              <div className="text-xs">No data yet</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Tab Bar - Fixed at bottom */}
      <div
        className={`flex-shrink-0 ${themeClasses.bottomBar} backdrop-blur-xl border-t`}
      >
        <div className="flex items-center justify-center px-8 py-3 safe-bottom">
          <motion.button
            onClick={() => setMainViewTab("timeline")}
            className={`p-3 rounded-2xl transition-all duration-300 ${
              mainViewTab === "timeline"
                ? `${themeClasses.tabActive} scale-110 shadow-xl`
                : `${themeClasses.tabInactive} hover:scale-105`
            }`}
            whileHover={{ scale: mainViewTab === "timeline" ? 1.1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Calendar className="w-5 h-5" />
          </motion.button>

          <div className="w-8"></div>

          <motion.button
            onClick={() => setMainViewTab("charts")}
            className={`p-3 rounded-2xl transition-all duration-300 ${
              mainViewTab === "charts"
                ? `${themeClasses.tabActive} scale-110 shadow-xl`
                : `${themeClasses.tabInactive} hover:scale-105`
            }`}
            whileHover={{ scale: mainViewTab === "charts" ? 1.1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <BarChart3 className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Mobile Detail View - Full screen overlay */}
      <AnimatePresence>
        {showDetailView && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`fixed inset-0 ${themeClasses.detailView} z-50 flex flex-col mt-20`}
          >
            {/* Detail View Header */}
            <div
              className={`flex-shrink-0 flex items-center justify-between p-4 pt-8 border-b ${themeClasses.detailHeader}`}
            >
              <div className="flex-1">
                <h2 className={`text-lg font-bold ${themeClasses.text}`}>
                  <span className={getDayColor(selectedDate.getDay())}>
                    {selectedDate.toLocaleDateString("en-US", {
                      weekday: "long",
                    })}
                  </span>
                  <span className={themeClasses.text}>, </span>
                  {selectedDate.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                  })}
                </h2>
                <p
                  className={`text-sm ${themeClasses.textSecondary} font-medium`}
                >
                  {selectedDate.toDateString() === new Date().toDateString()
                    ? "Today"
                    : selectedDate.toDateString() ===
                      new Date(Date.now() - 86400000).toDateString()
                    ? "Yesterday"
                    : ""}
                </p>
              </div>
              <Button
                onClick={() => setShowDetailView(false)}
                variant="ghost"
                size="sm"
                className={`${themeClasses.textSecondary} hover:${themeClasses.text} rounded-full w-8 h-8 p-0`}
              >
                ✕
              </Button>
            </div>

            {/* Tab Navigation */}
            <div
              className={`flex-shrink-0 flex border-b ${themeClasses.detailHeader}`}
            >
              {[
                { id: "input", label: "Progress", icon: "📊" },
                { id: "charts", label: "Trends", icon: "📈" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setDetailViewTab(tab.id)}
                  className={`flex-1 py-3 text-center text-sm font-bold transition-all duration-200 ${
                    detailViewTab === tab.id
                      ? "text-blue-400 border-b-2 border-blue-400 bg-blue-400/5"
                      : `${themeClasses.textSecondary} hover:${themeClasses.textMuted}`
                  }`}
                >
                  <div className="text-lg mb-1">{tab.icon}</div>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content - Scrollable */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {detailViewTab === "input" && (
                <div className="p-4 space-y-4 pb-8">
                  {/* Glow Score Display */}
                  <div
                    className={`${themeClasses.card} rounded-xl p-4 border ${themeClasses.cardBorder} text-center`}
                  >
                    <h3
                      className={`text-lg font-bold ${themeClasses.text} mb-2`}
                    >
                      🌟 Glow Score
                    </h3>
                    <div className="text-3xl font-bold text-yellow-400 mb-1">
                      {Math.round(calculateGlowScore(log))}%
                    </div>
                    <div className={`text-sm ${themeClasses.textSecondary}`}>
                      {calculateGlowScore(log) === 100
                        ? "Perfect Day! ✨"
                        : "Keep going! 💪"}
                    </div>
                  </div>

                  {/* Day Completion Toggle */}
                  <div
                    className={`flex items-center justify-between p-4 ${themeClasses.card} rounded-xl border ${themeClasses.cardBorder}`}
                  >
                    <div>
                      <h3
                        className={`text-base font-bold ${themeClasses.text}`}
                      >
                        Day Complete?
                      </h3>
                      <p className={`text-xs ${themeClasses.textSecondary}`}>
                        {log.day_complete
                          ? "Auto-completed!"
                          : "Mark as completed"}
                      </p>
                    </div>
                    <motion.button
                      onClick={() =>
                        handleChange("day_complete", !log.day_complete)
                      }
                      className={`w-12 h-12 rounded-full border-2 transition-all duration-300 text-lg font-bold ${
                        log.day_complete
                          ? "bg-green-500 border-green-500 text-white shadow-lg"
                          : `border-neutral-600 ${themeClasses.textSecondary} hover:border-green-500`
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {log.day_complete ? "✓" : "○"}
                    </motion.button>
                  </div>

                  {/* Progress Items - Compact */}
                  <div className="space-y-3">
                    {/* Meals */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          log.meals_eaten >= 5
                            ? "bg-green-500 border-green-500 text-white"
                            : `border-neutral-600 ${themeClasses.textSecondary}`
                        }`}
                      >
                        {log.meals_eaten >= 5 ? (
                          "✓"
                        ) : (
                          <Apple className="w-5 h-5" />
                        )}
                      </div>
                      <div
                        className={`flex-1 ${themeClasses.card} rounded-xl p-3 border ${themeClasses.cardBorder}`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span
                            className={`text-sm ${themeClasses.textSecondary} font-bold`}
                          >
                            5 Meals
                          </span>
                          <span
                            className={`text-lg font-bold ${themeClasses.text}`}
                          >
                            {log.meals_eaten}/5
                          </span>
                        </div>
                        <div className="flex gap-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <button
                              key={i}
                              onClick={() => handleChange("meals_eaten", i + 1)}
                              className={`w-6 h-6 rounded-full border-2 transition-all ${
                                i < log.meals_eaten
                                  ? "bg-green-500 border-green-500"
                                  : "border-neutral-600"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Water */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          log.water_intake >= 80
                            ? "bg-blue-500 border-blue-500 text-white"
                            : `border-neutral-600 ${themeClasses.textSecondary}`
                        }`}
                      >
                        {log.water_intake >= 80 ? (
                          "✓"
                        ) : (
                          <Droplets className="w-5 h-5" />
                        )}
                      </div>
                      <div
                        className={`flex-1 ${themeClasses.card} rounded-xl p-3 border ${themeClasses.cardBorder}`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span
                            className={`text-sm ${themeClasses.textSecondary} font-bold`}
                          >
                            Water (80 oz)
                          </span>
                          <span
                            className={`text-lg font-bold ${themeClasses.text}`}
                          >
                            {log.water_intake}/80
                          </span>
                        </div>
                        <div className="flex gap-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <button
                              key={i}
                              onClick={() =>
                                handleChange("water_intake", (i + 1) * 16)
                              }
                              className={`w-6 h-6 rounded-full border-2 transition-all ${
                                log.water_intake >= (i + 1) * 16
                                  ? "bg-blue-500 border-blue-500"
                                  : "border-neutral-600"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Sleep */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          log.hours_sleep >= 10
                            ? "bg-purple-500 border-purple-500 text-white"
                            : `border-neutral-600 ${themeClasses.textSecondary}`
                        }`}
                      >
                        {log.hours_sleep >= 10 ? (
                          "✓"
                        ) : (
                          <Moon className="w-5 h-5" />
                        )}
                      </div>
                      <div
                        className={`flex-1 ${themeClasses.card} rounded-xl p-3 border ${themeClasses.cardBorder}`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span
                            className={`text-sm ${themeClasses.textSecondary} font-bold`}
                          >
                            10 Hours Sleep
                          </span>
                          <span
                            className={`text-lg font-bold ${themeClasses.text}`}
                          >
                            {log.hours_sleep}/10
                          </span>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {Array.from({ length: 12 }, (_, i) => (
                            <button
                              key={i}
                              onClick={() => handleChange("hours_sleep", i + 1)}
                              className={`w-5 h-5 rounded-full border-2 transition-all ${
                                i < log.hours_sleep
                                  ? "bg-purple-500 border-purple-500"
                                  : "border-neutral-600"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Medicine */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          log.meds_taken >= 4
                            ? "bg-pink-500 border-pink-500 text-white"
                            : `border-neutral-600 ${themeClasses.textSecondary}`
                        }`}
                      >
                        {log.meds_taken >= 4 ? (
                          "✓"
                        ) : (
                          <Pill className="w-5 h-5" />
                        )}
                      </div>
                      <div
                        className={`flex-1 ${themeClasses.card} rounded-xl p-3 border ${themeClasses.cardBorder}`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span
                            className={`text-sm ${themeClasses.textSecondary} font-bold`}
                          >
                            4 Medicines
                          </span>
                          <span
                            className={`text-lg font-bold ${themeClasses.text}`}
                          >
                            {log.meds_taken}/4
                          </span>
                        </div>
                        <div className="flex gap-1">
                          {Array.from({ length: 4 }, (_, i) => (
                            <button
                              key={i}
                              onClick={() => handleChange("meds_taken", i + 1)}
                              className={`w-6 h-6 rounded-full border-2 transition-all ${
                                i < log.meds_taken
                                  ? "bg-pink-500 border-pink-500"
                                  : "border-neutral-600"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Glow Process */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          log.glow_process >= 1
                            ? "bg-yellow-500 border-yellow-500 text-white"
                            : `border-neutral-600 ${themeClasses.textSecondary}`
                        }`}
                      >
                        {log.glow_process >= 1 ? (
                          "✓"
                        ) : (
                          <Star className="w-5 h-5" />
                        )}
                      </div>
                      <div
                        className={`flex-1 ${themeClasses.card} rounded-xl p-3 border ${themeClasses.cardBorder}`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span
                            className={`text-sm ${themeClasses.textSecondary} font-bold`}
                          >
                            Glow Process
                          </span>
                          <span
                            className={`text-lg font-bold ${themeClasses.text}`}
                          >
                            {log.glow_process}/1
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            handleChange(
                              "glow_process",
                              log.glow_process >= 1 ? 0 : 1
                            )
                          }
                          className={`w-full py-2 rounded-lg border-2 transition-all ${
                            log.glow_process >= 1
                              ? "bg-yellow-500 border-yellow-500 text-white"
                              : "border-neutral-600 text-neutral-400 hover:border-yellow-500"
                          }`}
                        >
                          {log.glow_process >= 1
                            ? "Completed"
                            : "Mark Complete"}
                        </button>
                      </div>
                    </div>

                    {/* Gentle Movement */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          log.gentle_movement >= 1
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : `border-neutral-600 ${themeClasses.textSecondary}`
                        }`}
                      >
                        {log.gentle_movement >= 1 ? (
                          "✓"
                        ) : (
                          <ArrowRight className="w-5 h-5" />
                        )}
                      </div>
                      <div
                        className={`flex-1 ${themeClasses.card} rounded-xl p-3 border ${themeClasses.cardBorder}`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span
                            className={`text-sm ${themeClasses.textSecondary} font-bold`}
                          >
                            Gentle Movement
                          </span>
                          <span
                            className={`text-lg font-bold ${themeClasses.text}`}
                          >
                            {log.gentle_movement}/1
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            handleChange(
                              "gentle_movement",
                              log.gentle_movement >= 1 ? 0 : 1
                            )
                          }
                          className={`w-full py-2 rounded-lg border-2 transition-all ${
                            log.gentle_movement >= 1
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "border-neutral-600 text-neutral-400 hover:border-emerald-500"
                          }`}
                        >
                          {log.gentle_movement >= 1
                            ? "Completed"
                            : "Mark Complete"}
                        </button>
                      </div>
                    </div>

                    {/* Blood Pressure - Optional */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          log.am_blood_pressure && log.pm_blood_pressure
                            ? "bg-red-500 border-red-500 text-white"
                            : `border-neutral-600 ${themeClasses.textSecondary}`
                        }`}
                      >
                        {log.am_blood_pressure && log.pm_blood_pressure ? (
                          "✓"
                        ) : (
                          <Activity className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-2">
                          <span
                            className={`text-sm ${themeClasses.textSecondary} font-bold`}
                          >
                            Blood Pressure (Optional)
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="AM BP"
                            value={log.am_blood_pressure || ""}
                            onChange={(e) =>
                              handleChange("am_blood_pressure", e.target.value)
                            }
                            className={`p-3 text-sm rounded-xl ${themeClasses.input} focus:outline-none`}
                          />
                          <input
                            type="text"
                            placeholder="PM BP"
                            value={log.pm_blood_pressure || ""}
                            onChange={(e) =>
                              handleChange("pm_blood_pressure", e.target.value)
                            }
                            className={`p-3 text-sm rounded-xl ${themeClasses.input} focus:outline-none`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <Button
                    onClick={saveHealthData}
                    disabled={loading}
                    className={`w-full py-4 ${themeClasses.button} disabled:opacity-50 rounded-xl font-bold`}
                  >
                    {loading ? "Saving..." : "Save Health Data"}
                  </Button>
                </div>
              )}

              {detailViewTab === "charts" && (
                <div className="p-4 space-y-4 pb-8">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-lg font-bold ${themeClasses.text}`}>
                      Trends
                    </h3>
                    <select
                      value={dateRange}
                      onChange={(e) => setDateRange(Number(e.target.value))}
                      className={`${themeClasses.input} rounded-lg px-3 py-2 text-sm focus:outline-none`}
                    >
                      <option value={7}>7 days</option>
                      <option value={14}>14 days</option>
                      <option value={30}>30 days</option>
                    </select>
                  </div>

                  {/* Chart tabs */}
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {[
                      { id: "glow-score", label: "Glow", icon: "🌟" },
                      { id: "water", label: "Water", icon: "💧" },
                      { id: "meals", label: "Meals", icon: "🍎" },
                      { id: "sleep", label: "Sleep", icon: "🌙" },
                      { id: "medicine", label: "Medicine", icon: "💊" },
                      { id: "glow", label: "Glow", icon: "⭐" },
                      { id: "movement", label: "Movement", icon: "➡️" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-3 py-2 rounded-xl text-sm font-bold whitespace-nowrap flex items-center gap-1 ${
                          activeTab === tab.id
                            ? "bg-blue-600 text-white"
                            : `${themeClasses.card} ${themeClasses.textSecondary}`
                        }`}
                      >
                        <span>{tab.icon}</span>
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Chart */}
                  <div
                    className={`${themeClasses.card} rounded-xl p-4 border ${themeClasses.cardBorder}`}
                  >
                    <div className="h-48">
                      {getChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={getChartData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke={themeClasses.chartGrid}
                              strokeOpacity={0.3}
                            />
                            <XAxis
                              dataKey="day"
                              stroke={themeClasses.chartAxis}
                              fontSize={10}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              stroke={themeClasses.chartAxis}
                              fontSize={10}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip
                              contentStyle={{
                                ...themeClasses.tooltip,
                                fontSize: "12px",
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey={getChartConfig().dataKey}
                              stroke={getChartConfig().color}
                              strokeWidth={3}
                              dot={{ fill: getChartConfig().color, r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-center">
                          <div>
                            <div className="text-2xl mb-2">📊</div>
                            <div className="text-sm">No data yet</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Confirmation */}
      <AnimatePresence>
        {showSaveConfirmation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ duration: 0.3 }}
            className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-green-500 text-white px-6 py-3 rounded-xl shadow-xl flex items-center space-x-3">
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="font-medium text-sm">Saved successfully!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Carousel Overlay */}
      <AnimatePresence>
        {showCarousel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-lg z-50 flex items-center justify-center p-4"
            onClick={() => setShowCarousel(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 shadow-2xl max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Select AI Companion
                </h2>
                <p className="text-white/70">Choose your persona</p>
              </div>
              <GPTCarousel theme="dark" onSelect={handlePersonaSelect} />
              <button
                onClick={() => setShowCarousel(false)}
                className="mt-6 px-6 py-2 bg-white/20 border border-white/30 rounded-xl text-white hover:bg-white/30 transition-all w-full"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
