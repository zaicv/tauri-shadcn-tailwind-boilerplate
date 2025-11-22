import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Activity,
  Heart,
  Droplets,
  Scale,
  Moon,
  TrendingUp,
  Brain,
  Zap,
  Target,
  Clock,
  AlertCircle,
  CheckCircle,
  Play,
  Pause,
  RotateCcw,
  X,
  Cpu,
  Database,
  Network,
  Globe,
  Lock,
  Eye,
  Users,
  BookOpen,
  Lightbulb,
  Rocket,
  FileCode,
  Palette,
  Music,
  Camera,
  Video,
  Gamepad2,
  Home,
  Building,
  GraduationCap,
  Coffee,
  DollarSign,
  Briefcase,
  Calendar,
  Plus,
  FileIcon,
  HomeIcon,
  CircleDashed,
  Gem,
  Blend,
  Circle,
  Disc,
  Fingerprint,
  House,
  MessageCircle,
  Sparkle,
  Square,
  UserRound,
  ChevronRight,
  Search,
  Settings,
  Shield,
  
} from "lucide-react";

// Import the real orb components
import Scene from "@/components/Orb/Scene";

// Simulated health data
const healthData = {
  bloodPressure: [
    { date: "2024-01-01", systolic: 120, diastolic: 80, pulse: 72 },
    { date: "2024-01-02", systolic: 118, diastolic: 78, pulse: 70 },
    { date: "2024-01-03", systolic: 125, diastolic: 82, pulse: 75 },
    { date: "2024-01-04", systolic: 122, diastolic: 79, pulse: 73 },
    { date: "2024-01-05", systolic: 119, diastolic: 77, pulse: 71 },
    { date: "2024-01-06", systolic: 121, diastolic: 80, pulse: 74 },
    { date: "2024-01-07", systolic: 117, diastolic: 76, pulse: 69 },
  ],
  weight: [
    { date: "2024-01-01", weight: 175.2, bodyFat: 18.5, muscle: 32.1 },
    { date: "2024-01-02", weight: 174.8, bodyFat: 18.3, muscle: 32.3 },
    { date: "2024-01-03", weight: 174.5, bodyFat: 18.1, muscle: 32.5 },
    { date: "2024-01-04", weight: 174.2, bodyFat: 17.9, muscle: 32.7 },
    { date: "2024-01-05", weight: 173.9, bodyFat: 17.7, muscle: 32.9 },
    { date: "2024-01-06", weight: 173.6, bodyFat: 17.5, muscle: 33.1 },
    { date: "2024-01-07", weight: 173.3, bodyFat: 17.3, muscle: 33.3 },
  ],
  sleep: [
    {
      date: "2024-01-01",
      hours: 7.5,
      quality: 85,
      deep: 2.1,
      rem: 1.8,
      light: 3.6,
    },
    {
      date: "2024-01-02",
      hours: 8.2,
      quality: 92,
      deep: 2.3,
      rem: 2.0,
      light: 3.9,
    },
    {
      date: "2024-01-03",
      hours: 6.8,
      quality: 78,
      deep: 1.8,
      rem: 1.5,
      light: 3.5,
    },
    {
      date: "2024-01-04",
      hours: 7.9,
      quality: 88,
      deep: 2.2,
      rem: 1.9,
      light: 3.8,
    },
    {
      date: "2024-01-05",
      hours: 8.5,
      quality: 95,
      deep: 2.5,
      rem: 2.2,
      light: 3.8,
    },
    {
      date: "2024-01-06",
      hours: 7.2,
      quality: 82,
      deep: 2.0,
      rem: 1.7,
      light: 3.5,
    },
    {
      date: "2024-01-07",
      hours: 8.0,
      quality: 90,
      deep: 2.3,
      rem: 2.0,
      light: 3.7,
    },
  ],
  waterIntake: [
    { date: "2024-01-01", liters: 2.5, glasses: 10, goal: 3.0 },
    { date: "2024-01-02", liters: 2.8, glasses: 11, goal: 3.0 },
    { date: "2024-01-03", liters: 2.2, glasses: 9, goal: 3.0 },
    { date: "2024-01-04", liters: 3.1, glasses: 12, goal: 3.0 },
    { date: "2024-01-05", liters: 2.9, glasses: 11, goal: 3.0 },
    { date: "2024-01-06", liters: 2.7, glasses: 10, goal: 3.0 },
    { date: "2024-01-07", liters: 3.2, glasses: 13, goal: 3.0 },
  ],
  labs: [
    {
      test: "Cholesterol",
      value: 185,
      unit: "mg/dL",
      normal: "125-200",
      status: "normal",
    },
    {
      test: "HDL",
      value: 58,
      unit: "mg/dL",
      normal: "40-60",
      status: "normal",
    },
    {
      test: "LDL",
      value: 110,
      unit: "mg/dL",
      normal: "<100",
      status: "elevated",
    },
    {
      test: "Triglycerides",
      value: 95,
      unit: "mg/dL",
      normal: "<150",
      status: "normal",
    },
    { test: "A1C", value: 5.4, unit: "%", normal: "<5.7", status: "normal" },
    {
      test: "Vitamin D",
      value: 32,
      unit: "ng/mL",
      normal: "30-100",
      status: "normal",
    },
  ],
};

// Health superpowers data
const healthSuperpowers = [
  {
    id: "bloodPressure",
    name: "Cardiovascular Analysis",
    description: "Advanced heart health monitoring and pattern recognition",
    icon: "❤️",
    color: "#ef4444",
    prompts: [
      "Analyze blood pressure trends",
      "Detect cardiovascular patterns",
      "Generate heart health insights",
      "Predict potential issues",
      "Optimize heart rate variability",
      "Create wellness recommendations",
    ],
  },
  {
    id: "weight",
    name: "Body Composition AI",
    description: "Intelligent body analysis and fitness optimization",
    icon: "⚖️",
    color: "#8b5cf6",
    prompts: [
      "Analyze body composition trends",
      "Optimize muscle-to-fat ratio",
      "Generate fitness recommendations",
      "Predict weight loss trajectory",
      "Create personalized workout plans",
      "Monitor metabolic health",
    ],
  },
  {
    id: "sleep",
    name: "Sleep Intelligence",
    description: "Advanced sleep pattern analysis and optimization",
    icon: "��",
    color: "#6366f1",
    prompts: [
      "Analyze sleep quality patterns",
      "Optimize sleep cycle timing",
      "Generate recovery insights",
      "Predict sleep efficiency",
      "Create bedtime routines",
      "Monitor REM and deep sleep",
    ],
  },
  {
    id: "waterIntake",
    name: "Hydration Mastery",
    description: "Smart hydration tracking and optimization",
    icon: "��",
    color: "#06b6d4",
    prompts: [
      "Analyze hydration patterns",
      "Optimize water intake timing",
      "Generate hydration insights",
      "Predict dehydration risk",
      "Create drinking reminders",
      "Monitor electrolyte balance",
    ],
  },
  {
    id: "labs",
    name: "Lab Results AI",
    description: "Intelligent medical data interpretation",
    icon: "��",
    color: "#f59e0b",
    prompts: [
      "Interpret lab results",
      "Detect health trends",
      "Generate medical insights",
      "Predict health risks",
      "Create action plans",
      "Monitor biomarker changes",
    ],
  },
];

export default function Alaura() {
  const [isOrbActive, setIsOrbActive] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string>("overview");
  const [orbPulse, setOrbPulse] = useState(1);
  const [showInsights, setShowInsights] = useState(false);
  const [currentInsight, setCurrentInsight] = useState<string>("");
  const [chartAnimation, setChartAnimation] = useState(false);
  const [showSuperpowersDialog, setShowSuperpowersDialog] = useState(false);
  const [selectedSuperpower, setSelectedSuperpower] = useState<string | null>(
    null
  );
  const [agentStatus, setAgentStatus] = useState<string>("idle");
  const [agentLog, setAgentLog] = useState<string[]>([]);
  const [showAgentWindow, setShowAgentWindow] = useState(false);
  const [currentAgentType, setCurrentAgentType] = useState<string>("terminal");
  const [isOrbHolding, setIsOrbHolding] = useState(false);
  const [showCarousel, setShowCarousel] = useState(false);

  // Add new state for input commands
  const [inputCommand, setInputCommand] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);

  const orbRef = useRef<HTMLDivElement>(null);
  const orbHoldTimeout = useRef<NodeJS.Timeout | null>(null);

  // Simulate orb pulse based on health data
  useEffect(() => {
    const interval = setInterval(() => {
      const avgHeartRate =
        healthData.bloodPressure.reduce((sum, bp) => sum + bp.pulse, 0) /
        healthData.bloodPressure.length;
      const normalizedPulse = (avgHeartRate - 60) / (100 - 60);
      setOrbPulse(0.8 + normalizedPulse * 0.4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Orb hold handlers
  const handleOrbMouseDown = () => {
    orbHoldTimeout.current = setTimeout(() => {
      setShowCarousel(true);
      orbHoldTimeout.current = null;
    }, 600);
  };

  const handleOrbMouseUp = () => {
    if (orbHoldTimeout.current) {
      clearTimeout(orbHoldTimeout.current);
      orbHoldTimeout.current = null;
      startAnalysis(selectedMetric);
    }
  };

  const startAnalysis = async (metric: string) => {
    setIsAnalyzing(true);
    setSelectedMetric(metric);
    setCurrentAnalysis(`Analyzing ${metric} data...`);

    const steps = [
      "🔍 Gathering health data points...",
      "📊 Processing biometric metrics...",
      "📈 Generating visualizations...",
      "🧠 AI pattern recognition...",
      "💡 Generating health insights...",
      "✅ Analysis complete!",
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setCurrentAnalysis(steps[i]);
    }

    setIsAnalyzing(false);
    setChartAnimation(true);
    setTimeout(() => setChartAnimation(false), 2000);
  };

  const handleSuperpowerSelect = (superpowerId: string) => {
    setSelectedSuperpower(superpowerId);
    setShowSuperpowersDialog(false);
    setShowAgentWindow(true);
    setAgentStatus("working");
    setAgentLog([]);
    simulateAgentWork(superpowerId);
  };

  const simulateAgentWork = async (superpowerId: string) => {
    const steps = getAgentSteps(superpowerId);

    for (let i = 0; i < steps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setAgentLog((prev) => [...prev, steps[i]]);
    }

    setAgentStatus("completed");
    setTimeout(() => {
      setAgentStatus("idle");
    }, 3000);
  };

  const getAgentSteps = (superpowerId: string) => {
    const steps = {
      bloodPressure: [
        "🫀 Connecting to cardiovascular sensors...",
        "📡 Analyzing blood pressure patterns...",
        "🧠 AI processing heart rate variability...",
        "📊 Generating cardiovascular insights...",
        "💡 Detecting optimal health patterns...",
        "✅ Cardiovascular analysis complete!",
      ],
      weight: [
        "⚖️ Accessing body composition data...",
        "📊 Analyzing muscle-to-fat ratios...",
        "🧠 AI processing metabolic patterns...",
        "📈 Generating fitness recommendations...",
        "💡 Creating personalized workout plans...",
        "✅ Body composition analysis complete!",
      ],
      sleep: [
        "🌙 Connecting to sleep monitoring devices...",
        "📊 Analyzing sleep cycle patterns...",
        "🧠 AI processing REM and deep sleep data...",
        "📈 Generating sleep optimization insights...",
        "💡 Creating personalized bedtime routines...",
        "✅ Sleep analysis complete!",
      ],
      waterIntake: [
        "💧 Accessing hydration tracking data...",
        "📊 Analyzing water intake patterns...",
        "🧠 AI processing cellular hydration levels...",
        "📈 Generating hydration optimization...",
        "💡 Creating personalized drinking schedules...",
        "✅ Hydration analysis complete!",
      ],
      labs: [
        "🔬 Accessing medical laboratory data...",
        "📊 Analyzing biomarker patterns...",
        "🧠 AI processing health risk factors...",
        "📈 Generating medical insights...",
        "💡 Creating personalized health plans...",
        "✅ Lab analysis complete!",
      ],
    };

    return (
      steps[superpowerId as keyof typeof steps] || [
        "🤖 Processing your health data...",
        "⚙️ Executing analysis...",
        "✅ Health analysis complete!",
      ]
    );
  };

  const generateInsight = (metric: string) => {
    const insights = {
      bloodPressure:
        "Your blood pressure shows excellent consistency with a slight downward trend. The AI detected optimal cardiovascular health patterns with improved heart rate variability.",
      weight:
        "Weight loss trend is healthy and sustainable. Body composition analysis shows muscle gain while reducing body fat - excellent progress! Your metabolic rate has improved by 8%.",
      sleep:
        "Sleep quality has improved 12% this week. Deep sleep duration is optimal, contributing to better recovery and cognitive function. Your circadian rhythm is well-aligned.",
      waterIntake:
        "Hydration levels are consistently above 80% of daily goals. The AI recommends maintaining this pattern for optimal cellular function. Your kidney efficiency has improved.",
    };

    setCurrentInsight(
      insights[metric as keyof typeof insights] ||
        "Analysis complete with positive health trends detected. Your overall wellness score has improved significantly."
    );
    setShowInsights(true);
  };

  const renderBloodPressureChart = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
    >
      <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
        <Heart className="w-5 h-5 text-red-500" />
        Blood Pressure Trends
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={healthData.bloodPressure}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" stroke="#666" />
          <YAxis stroke="#666" />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          />
          <Line
            type="monotone"
            dataKey="systolic"
            stroke="#ef4444"
            strokeWidth={3}
            dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
            animationDuration={chartAnimation ? 2000 : 0}
          />
          <Line
            type="monotone"
            dataKey="diastolic"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
            animationDuration={chartAnimation ? 2000 : 0}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-500">
            {
              healthData.bloodPressure[healthData.bloodPressure.length - 1]
                .systolic
            }
          </div>
          <div className="text-sm text-gray-600">Systolic</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-500">
            {
              healthData.bloodPressure[healthData.bloodPressure.length - 1]
                .diastolic
            }
          </div>
          <div className="text-sm text-gray-600">Diastolic</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-500">
            {
              healthData.bloodPressure[healthData.bloodPressure.length - 1]
                .pulse
            }
          </div>
          <div className="text-sm text-gray-600">Pulse</div>
        </div>
      </div>
    </motion.div>
  );

  const renderWeightChart = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
    >
      <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
        <Scale className="w-5 h-5 text-purple-500" />
        Body Composition Analysis
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={healthData.weight}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" stroke="#666" />
          <YAxis stroke="#666" />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          />
          <Area
            type="monotone"
            dataKey="weight"
            stroke="#8b5cf6"
            fill="#8b5cf6"
            fillOpacity={0.3}
            strokeWidth={3}
            animationDuration={chartAnimation ? 2000 : 0}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-500">
            {healthData.weight[healthData.weight.length - 1].weight} lbs
          </div>
          <div className="text-sm text-gray-600">Current Weight</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-500">
            {healthData.weight[healthData.weight.length - 1].bodyFat}%
          </div>
          <div className="text-sm text-gray-600">Body Fat</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-500">
            {healthData.weight[healthData.weight.length - 1].muscle} lbs
          </div>
          <div className="text-sm text-gray-600">Muscle Mass</div>
        </div>
      </div>
    </motion.div>
  );

  const renderSleepChart = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
    >
      <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
        <Moon className="w-5 h-5 text-indigo-500" />
        Sleep Quality Analysis
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={healthData.sleep}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" stroke="#666" />
          <YAxis stroke="#666" />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          />
          <Bar
            dataKey="hours"
            fill="#6366f1"
            radius={[4, 4, 0, 0]}
            animationDuration={chartAnimation ? 2000 : 0}
          />
        </BarChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-4 gap-4 mt-4">
        <div className="text-center">
          <div className="text-lg font-bold text-indigo-500">
            {healthData.sleep[healthData.sleep.length - 1].hours}h
          </div>
          <div className="text-xs text-gray-600">Total Sleep</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-green-500">
            {healthData.sleep[healthData.sleep.length - 1].quality}%
          </div>
          <div className="text-xs text-gray-600">Quality</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-blue-500">
            {healthData.sleep[healthData.sleep.length - 1].deep}h
          </div>
          <div className="text-xs text-gray-600">Deep</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-purple-500">
            {healthData.sleep[healthData.sleep.length - 1].rem}h
          </div>
          <div className="text-xs text-gray-600">REM</div>
        </div>
      </div>
    </motion.div>
  );

  const renderWaterIntakeChart = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
    >
      <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
        <Droplets className="w-5 h-5 text-cyan-500" />
        Hydration Tracking
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={healthData.waterIntake}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" stroke="#666" />
          <YAxis stroke="#666" />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          />
          <Bar
            dataKey="liters"
            fill="#06b6d4"
            radius={[4, 4, 0, 0]}
            animationDuration={chartAnimation ? 2000 : 0}
          />
        </BarChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-cyan-500">
            {healthData.waterIntake[healthData.waterIntake.length - 1].liters}L
          </div>
          <div className="text-sm text-gray-600">Today's Intake</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-500">
            {Math.round(
              (healthData.waterIntake[healthData.waterIntake.length - 1]
                .liters /
                healthData.waterIntake[healthData.waterIntake.length - 1]
                  .goal) *
                100
            )}
            %
          </div>
          <div className="text-sm text-gray-600">Goal Met</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-500">
            {healthData.waterIntake[healthData.waterIntake.length - 1].glasses}
          </div>
          <div className="text-sm text-gray-600">Glasses</div>
        </div>
      </div>
    </motion.div>
  );

  const renderLabsOverview = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
    >
      <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
        <Activity className="w-5 h-5 text-orange-500" />
        Lab Results Overview
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {healthData.labs.map((lab, index) => (
          <motion.div
            key={lab.test}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-xl border-2 ${
              lab.status === "normal"
                ? "border-green-200 bg-green-50"
                : "border-yellow-200 bg-yellow-50"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-800">{lab.test}</span>
              {lab.status === "normal" ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              )}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {lab.value} {lab.unit}
            </div>
            <div className="text-sm text-gray-600">Normal: {lab.normal}</div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  const renderOverview = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 border border-blue-200"
      >
        <h3 className="text-xl font-semibold mb-4 text-gray-800">
          Health Score
        </h3>
        <div className="text-center">
          <div className="text-6xl font-bold text-blue-600 mb-2">87</div>
          <div className="text-lg text-blue-700">Excellent</div>
          <div className="text-sm text-blue-600 mt-2">+3 points this week</div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 border border-green-200"
      >
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Trends</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Weight Loss</span>
            <div className="flex items-center gap-1 text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span className="font-semibold">-1.9 lbs</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Sleep Quality</span>
            <div className="flex items-center gap-1 text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span className="font-semibold">+12%</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Hydration</span>
            <div className="flex items-center gap-1 text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-semibold">+8%</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );

  // Add command processing function
  const processCommand = async (command: string) => {
    if (!command.trim()) return;

    setIsProcessingCommand(true);
    setCommandHistory((prev) => [...prev, `> ${command}`]);

    // Simulate AI processing the command
    const lowerCommand = command.toLowerCase();

    // Detect what the user wants to see
    if (lowerCommand.includes("sleep") || lowerCommand.includes("past week")) {
      setSelectedMetric("sleep");
      await startAnalysis("sleep");
      setCurrentInsight(
        "Showing your sleep data for the past week. I can see your sleep quality has improved by 12% with optimal REM and deep sleep patterns."
      );
    } else if (
      lowerCommand.includes("water") ||
      lowerCommand.includes("hydration") ||
      lowerCommand.includes("yesterday")
    ) {
      setSelectedMetric("waterIntake");
      await startAnalysis("waterIntake");
      setCurrentInsight(
        "Your hydration yesterday was excellent! You consumed 3.2L of water, exceeding your daily goal by 7%. This contributes to optimal cellular function."
      );
    } else if (
      lowerCommand.includes("blood pressure") ||
      lowerCommand.includes("heart") ||
      lowerCommand.includes("cardiovascular")
    ) {
      setSelectedMetric("bloodPressure");
      await startAnalysis("bloodPressure");
      setCurrentInsight(
        "Your cardiovascular health is outstanding! Blood pressure shows excellent consistency with a slight downward trend. Heart rate variability is optimal."
      );
    } else if (
      lowerCommand.includes("weight") ||
      lowerCommand.includes("body") ||
      lowerCommand.includes("composition")
    ) {
      setSelectedMetric("weight");
      await startAnalysis("weight");
      setCurrentInsight(
        "Great progress on body composition! You've lost 1.9 lbs while gaining muscle mass. Your metabolic rate has improved by 8%."
      );
    } else if (
      lowerCommand.includes("labs") ||
      lowerCommand.includes("medical")
    ) {
      setSelectedMetric("labs");
      await startAnalysis("labs");
      setCurrentInsight(
        "Your lab results are excellent! All biomarkers are within optimal ranges. Your LDL is slightly elevated but trending downward with lifestyle changes."
      );
    } else {
      setCurrentInsight(
        "I understand you're asking about your health data. I can help you analyze sleep, hydration, blood pressure, weight, or lab results. What would you like to see?"
      );
    }

    setShowInsights(true);
    setIsProcessingCommand(false);
  };

  // Update the contextual visual windows
  const renderContextualVisual = (superpowerId: string) => {
    switch (superpowerId) {
      case "bloodPressure":
        return (
          <div className="h-full bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-4">
            {/* Cardiovascular Analysis Interface */}
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">❤️</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Cardiovascular AI
                </h3>
                <p className="text-sm text-gray-600">
                  Real-time heart health monitoring
                </p>
              </div>
            </div>

            {/* Heart Rate Monitor */}
            <div className="bg-white/60 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Live Heart Rate
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-lg font-bold text-red-600">72 BPM</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-red-500 h-2 rounded-full"
                  animate={{ width: ["60%", "80%", "60%"] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            </div>

            {/* Blood Pressure Chart Creation */}
            <div className="bg-white/60 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">
                  Generating BP Chart...
                </span>
              </div>
              <div className="h-32 bg-gradient-to-r from-red-100 to-blue-100 rounded-lg p-2 relative overflow-hidden">
                {/* Animated chart creation */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-red-200 to-blue-200"
                  initial={{ x: "-100%" }}
                  animate={{ x: "0%" }}
                  transition={{ duration: 3, ease: "easeOut" }}
                />
                <motion.div
                  className="absolute bottom-2 left-2 w-2 h-20 bg-red-500 rounded-full"
                  initial={{ height: 0 }}
                  animate={{ height: "5rem" }}
                  transition={{ delay: 0.5, duration: 1 }}
                />
                <motion.div
                  className="absolute bottom-2 left-6 w-2 h-16 bg-blue-500 rounded-full"
                  initial={{ height: 0 }}
                  animate={{ height: "4rem" }}
                  transition={{ delay: 1, duration: 1 }}
                />
              </div>
            </div>
          </div>
        );

      case "sleep":
        return (
          <div className="h-full bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4">
            {/* Sleep Analysis Interface */}
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">🌙</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Sleep Intelligence
                </h3>
                <p className="text-sm text-gray-600">
                  Advanced sleep pattern analysis
                </p>
              </div>
            </div>

            {/* Sleep Cycle Visualization */}
            <div className="bg-white/60 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">
                  Sleep Cycle
                </span>
                <span className="text-xs text-gray-500">8.2 hours</span>
              </div>
              <div className="flex gap-1 h-8">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((hour) => (
                  <motion.div
                    key={hour}
                    className="flex-1 bg-gradient-to-t from-indigo-200 to-purple-300 rounded"
                    initial={{ height: 0 }}
                    animate={{ height: "2rem" }}
                    transition={{ delay: hour * 0.2, duration: 0.5 }}
                  />
                ))}
              </div>
            </div>

            {/* Chart Creation Animation */}
            <div className="bg-white/60 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-4 h-4 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">
                  Creating Sleep Chart...
                </span>
              </div>
              <div className="h-32 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg p-2 relative">
                {/* Animated bar chart creation */}
                {[7.5, 8.2, 6.8, 7.9, 8.5, 7.2, 8.0].map((hours, index) => (
                  <motion.div
                    key={index}
                    className="absolute bottom-2 bg-indigo-400 rounded-t-sm"
                    style={{
                      left: `${index * 14 + 2}%`,
                      width: "10%",
                      height: 0,
                    }}
                    initial={{ height: 0 }}
                    animate={{ height: `${(hours / 8.5) * 100}%` }}
                    transition={{ delay: index * 0.3, duration: 0.8 }}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      case "weight":
        return (
          <div className="h-full bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4">
            {/* Body Composition Interface */}
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">⚖️</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Body Composition AI
                </h3>
                <p className="text-sm text-gray-600">
                  Muscle-to-fat ratio optimization
                </p>
              </div>
            </div>

            {/* Body Composition Chart */}
            <div className="bg-white/60 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">
                  Body Composition
                </span>
                <span className="text-xs text-gray-500">173.3 lbs</span>
              </div>
              <div className="flex gap-2 h-20">
                <motion.div
                  className="flex-1 bg-purple-400 rounded"
                  initial={{ height: 0 }}
                  animate={{ height: "5rem" }}
                  transition={{ delay: 0.5, duration: 1 }}
                />
                <motion.div
                  className="flex-1 bg-green-400 rounded"
                  initial={{ height: 0 }}
                  animate={{ height: "4rem" }}
                  transition={{ delay: 1, duration: 1 }}
                />
                <motion.div
                  className="flex-1 bg-blue-400 rounded"
                  initial={{ height: 0 }}
                  animate={{ height: "4.5rem" }}
                  transition={{ delay: 1.5, duration: 1 }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-600 mt-2">
                <span>Muscle</span>
                <span>Fat</span>
                <span>Bone</span>
              </div>
            </div>

            {/* Progress Chart Creation */}
            <div className="bg-white/60 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-4 h-4 bg-pink-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">
                  Generating Progress Chart...
                </span>
              </div>
              <div className="h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg p-2 relative">
                {/* Animated line chart */}
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <motion.path
                    d="M 10 80 L 25 75 L 40 70 L 55 65 L 70 60 L 85 55 L 100 50"
                    stroke="#8b5cf6"
                    strokeWidth="3"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, ease: "easeOut" }}
                  />
                </svg>
              </div>
            </div>
          </div>
        );

      case "waterIntake":
        return (
          <div className="h-full bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-4">
            {/* Hydration Interface */}
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">💧</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Hydration Mastery
                </h3>
                <p className="text-sm text-gray-600">
                  Smart water intake optimization
                </p>
              </div>
            </div>

            {/* Water Level Visualization */}
            <div className="bg-white/60 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">
                  Today's Hydration
                </span>
                <span className="text-xs text-gray-500">3.2L / 3.0L Goal</span>
              </div>
              <div className="h-24 bg-gradient-to-b from-blue-100 to-cyan-100 rounded-lg relative overflow-hidden">
                <motion.div
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-400 to-blue-400"
                  initial={{ height: 0 }}
                  animate={{ height: "100%" }}
                  transition={{ duration: 2, ease: "easeOut" }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">106%</span>
                </div>
              </div>
            </div>

            {/* Hydration Chart Creation */}
            <div className="bg-white/60 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-4 h-4 bg-cyan-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">
                  Creating Hydration Chart...
                </span>
              </div>
              <div className="h-32 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-lg p-2 relative">
                {/* Animated bar chart */}
                {[2.5, 2.8, 2.2, 3.1, 2.9, 2.7, 3.2].map((liters, index) => (
                  <motion.div
                    key={index}
                    className="absolute bottom-2 bg-cyan-400 rounded-t-sm"
                    style={{
                      left: `${index * 14 + 2}%`,
                      width: "10%",
                      height: 0,
                    }}
                    initial={{ height: 0 }}
                    animate={{ height: `${(liters / 3.2) * 100}%` }}
                    transition={{ delay: index * 0.2, duration: 0.6 }}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      case "labs":
        return (
          <div className="h-full bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-4">
            {/* Lab Results Interface */}
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">🔬</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Lab Results AI
                </h3>
                <p className="text-sm text-gray-600">
                  Medical data interpretation
                </p>
              </div>
            </div>

            {/* Lab Results Dashboard */}
            <div className="bg-white/60 rounded-xl p-4 mb-4">
              <div className="grid grid-cols-2 gap-3">
                {healthData.labs.slice(0, 4).map((lab, index) => (
                  <motion.div
                    key={lab.test}
                    className={`p-2 rounded-lg border-2 ${
                      lab.status === "normal"
                        ? "border-green-200 bg-green-50"
                        : "border-yellow-200 bg-yellow-50"
                    }`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="text-xs font-medium text-gray-700">
                      {lab.test}
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {lab.value}
                    </div>
                    <div className="text-xs text-gray-500">{lab.unit}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Analysis Progress */}
            <div className="bg-white/60 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-4 h-4 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">
                  Analyzing Lab Results...
                </span>
              </div>
              <div className="space-y-2">
                <motion.div
                  className="h-2 bg-gray-200 rounded-full overflow-hidden"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2 }}
                >
                  <div className="h-full bg-orange-400 rounded-full" />
                </motion.div>
                <motion.div
                  className="h-2 bg-gray-200 rounded-full overflow-hidden"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.5, duration: 2 }}
                >
                  <div className="h-full bg-yellow-400 rounded-full" />
                </motion.div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="h-full bg-black rounded-2xl p-4 font-mono text-sm overflow-y-auto">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-700">
              <div className="flex gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <span className="text-gray-400">Health AI Terminal</span>
            </div>
            <div className="text-gray-400">
              <p>🤖 Health AI ready for analysis...</p>
              <p className="text-xs mt-2">
                Select a health superpower to begin.
              </p>
            </div>
          </div>
        );
    }
  };

  // Update the superpower dialog to use contextual visuals
  const renderSuperpowerDialog = () => (
    <AnimatePresence>
      {selectedSuperpower && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedSuperpower(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const power = healthSuperpowers.find(
                (p) => p.id === selectedSuperpower
              );
              if (!power) return null;

              return (
                <>
                  <div
                    className="p-6 border-b border-gray-200"
                    style={{ backgroundColor: power.color + "10" }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">{power.icon}</div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">
                            {power.name}
                          </h2>
                          <p className="text-gray-600">{power.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs font-mono px-2 py-1 bg-gray-100 rounded">
                          Status: {agentStatus}
                        </div>
                        <button
                          onClick={() => setSelectedSuperpower(null)}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <X className="w-5 h-5 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex h-[60vh]">
                    {/* Left Sidebar - Quick Prompts */}
                    <div className="w-1/3 p-6 border-r border-gray-200 overflow-y-auto bg-gray-50">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Quick Analyses
                      </h3>
                      <div className="space-y-2">
                        {power.prompts.map((prompt, index) => (
                          <motion.button
                            key={index}
                            className="w-full text-left p-3 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all duration-200 text-sm"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleSuperpowerSelect(power.id)}
                            disabled={agentStatus === "working"}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: power.color }}
                              />
                              {prompt}
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Right Main Area - Contextual Visual */}
                    <div className="flex-1 p-6">
                      {renderContextualVisual(selectedSuperpower)}
                    </div>
                  </div>
                </>
              );
            })()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Add InputBox component at the bottom
  const renderInputBox = () => (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-2xl px-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={inputCommand}
            onChange={(e) => setInputCommand(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                processCommand(inputCommand);
                setInputCommand("");
              }
            }}
            placeholder="Ask Alaura about your health... (e.g., 'Show me my sleep from the past week')"
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button
            onClick={() => {
              processCommand(inputCommand);
              setInputCommand("");
            }}
            disabled={!inputCommand.trim() || isProcessingCommand}
            className="px-6 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
          >
            {isProcessingCommand ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                />
                Processing...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                Ask
              </>
            )}
          </button>
        </div>

        {/* Command History */}
        {commandHistory.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500 mb-2">Recent Commands:</div>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {commandHistory.slice(-3).map((cmd, index) => (
                <div key={index} className="text-xs text-gray-600 font-mono">
                  {cmd}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* System Status HUD - Matching DesktopApp style */}
      <div className="fixed top-0 left-0 right-0 z-50 p-4 border-b border-[#ddd] bg-white/80 backdrop-blur-md">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: "#6366f1" }}
              />
              <span className="text-sm font-mono text-[#333]">
                Alaura Health AI Online
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <Cpu className="w-3 h-3 text-[#333]" />
                <span className="text-[#666]">23%</span>
              </div>
              <div className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-[#333]" />
                <span className="text-[#666]">67%</span>
              </div>
              <div className="flex items-center gap-1">
                <Network className="w-3 h-3 text-[#333]" />
                <span className="text-[#666]">89%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#333]" />
            <span className="text-sm text-[#333]">SECURE</span>
            <span className="text-xs text-[#666]">UPTIME: 47h 23m</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="text-center pt-20 pb-12">
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl font-bold text-gray-800 mb-4"
        >
          Alaura Health Intelligence
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl text-gray-600 max-w-3xl mx-auto"
        >
          Your personal AI health companion analyzing and visualizing your
          wellness data in real-time
        </motion.p>
      </div>

      {/* Central Intelligence Orb - Using real Scene component */}
      <div className="flex justify-center mb-12">
        <motion.div
          ref={orbRef}
          className="relative cursor-pointer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onMouseDown={handleOrbMouseDown}
          onMouseUp={handleOrbMouseUp}
          onMouseLeave={handleOrbMouseUp}
        >
          <motion.div
            className={`z-0 cursor-pointer bg-[#f9f9f9] border border-[#ddd] rounded-full shadow-sm transition-all duration-200 ${
              isOrbHolding ? "scale-110 shadow-lg" : ""
            }`}
            style={{ width: 220, height: 220 }}
          >
            <motion.div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "9999px",
                overflow: "hidden",
              }}
            >
              <Scene />
            </motion.div>
          </motion.div>

          <motion.div
            className="absolute inset-0 rounded-full border-2 border-[#bbb]"
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          <motion.div
            className="absolute inset-0 rounded-full border border-[#bbb]"
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />

          {isOrbHolding && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-blue-400"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.2, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          )}

          {/* Analysis Status */}
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-gray-200"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Zap className="w-5 h-5 text-indigo-500" />
                </motion.div>
                <span className="text-sm font-medium text-gray-700">
                  {currentAnalysis}
                </span>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Metric Selection - Moved to top like DesktopApp */}
      <div className="flex justify-center mb-8">
        <div className="flex gap-2 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-lg border border-gray-200">
          {[
            { key: "overview", label: "Overview", icon: Target },
            { key: "bloodPressure", label: "Heart", icon: Heart },
            { key: "weight", label: "Body", icon: Scale },
            { key: "sleep", label: "Sleep", icon: Moon },
            { key: "waterIntake", label: "Hydration", icon: Droplets },
            { key: "labs", label: "Labs", icon: Activity },
          ].map((metric) => (
            <motion.button
              key={metric.key}
              onClick={() => startAnalysis(metric.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                selectedMetric === metric.key
                  ? "bg-indigo-500 text-white shadow-lg"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <metric.icon className="w-4 h-4" />
              {metric.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 pb-20">
        {selectedMetric === "overview" && renderOverview()}
        {selectedMetric === "bloodPressure" && renderBloodPressureChart()}
        {selectedMetric === "weight" && renderWeightChart()}
        {selectedMetric === "sleep" && renderSleepChart()}
        {selectedMetric === "waterIntake" && renderWaterIntakeChart()}
        {selectedMetric === "labs" && renderLabsOverview()}
      </div>

      {/* Superpowers Dialog */}
      <AnimatePresence>
        {showSuperpowersDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSuperpowersDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <Zap className="w-6 h-6 text-indigo-500" />
                      Health AI Superpowers
                    </h2>
                    <p className="text-gray-600 mt-1">
                      Choose an AI-powered health analysis to perform
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSuperpowersDialog(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {healthSuperpowers.map((power) => (
                    <motion.div
                      key={power.id}
                      className="group p-4 border border-gray-200 rounded-2xl hover:border-gray-300 hover:shadow-md transition-all duration-300 cursor-pointer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSuperpowerSelect(power.id)}
                    >
                      <div className="text-3xl mb-3">{power.icon}</div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {power.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {power.description}
                      </p>
                      <div className="text-xs text-gray-500">
                        {power.prompts.length} available analyses
                      </div>
                      <div
                        className="w-full h-1 rounded-full mt-3 opacity-50"
                        style={{ backgroundColor: power.color }}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Individual Superpower Dialog - Contextual Visual Windows */}
      {renderSuperpowerDialog()}

      {/* Voice-Activated Agent Window */}
      <AnimatePresence>
        {showAgentWindow && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed bottom-8 right-8 z-50 w-96 h-64 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          >
            {/* Window Header */}
            <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  Health AI -{" "}
                  {selectedSuperpower
                    ? healthSuperpowers.find((p) => p.id === selectedSuperpower)
                        ?.name
                    : "Processing"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    agentStatus === "working"
                      ? "bg-yellow-400 animate-pulse"
                      : agentStatus === "completed"
                      ? "bg-green-400"
                      : "bg-gray-400"
                  }`}
                ></div>
                <button
                  onClick={() => setShowAgentWindow(false)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Window Content - Different types based on superpower */}
            <div className="flex-1 p-4">
              {currentAgentType === "terminal" && (
                <div className="h-full bg-black rounded-lg p-3 font-mono text-sm overflow-y-auto">
                  <div className="space-y-1">
                    {agentLog.map((log, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="text-green-400"
                      >
                        <span className="text-gray-500 text-xs mr-2">
                          [{new Date().toLocaleTimeString()}]
                        </span>
                        {log}
                      </motion.div>
                    ))}
                    {agentStatus === "working" && (
                      <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="text-yellow-400"
                      >
                        <span className="text-gray-500 text-xs mr-2">
                          [{new Date().toLocaleTimeString()}]
                        </span>
                        ⚡ Processing...
                      </motion.div>
                    )}
                  </div>
                </div>
              )}

              {currentAgentType === "health" && (
                <div className="h-full bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-3">
                  {/* Health analysis interface */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="text-2xl">🏥</div>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        Health Analysis Engine
                      </h3>
                      <p className="text-xs text-gray-600">
                        Status: {agentStatus}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    {agentLog.map((log, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-2 bg-white/50 rounded p-2"
                      >
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        {log}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Insights Panel */}
      <AnimatePresence>
        {showInsights && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed bottom-8 left-8 right-8 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 p-6 z-50"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Brain className="w-6 h-6 text-indigo-500" />
                AI Health Insights
              </h3>
              <button
                onClick={() => setShowInsights(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <RotateCcw className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-gray-700 leading-relaxed">{currentInsight}</p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => generateInsight(selectedMetric)}
                className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
              >
                Generate New Insight
              </button>
              <button
                onClick={() => setShowInsights(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button for Superpowers */}
      <motion.button
        onClick={() => setShowSuperpowersDialog(true)}
        className="fixed bottom-8 left-8 z-40 w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full shadow-2xl border-2 border-white hover:shadow-3xl transition-all duration-300"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Zap className="w-8 h-8 text-white mx-auto" />
      </motion.button>

      {/* Add the InputBox at the bottom */}
      {renderInputBox()}
    </div>
  );
}
