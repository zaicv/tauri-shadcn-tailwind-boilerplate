import React, { useState, useEffect } from "react";
import {
  Activity,
  Apple,
  Droplets,
  Moon,
  Pill,
  Calendar,
  BarChart3,
  Plus,
  Minus,
  Save,
  TrendingUp,
  CheckCircle,
  Circle,
  Loader,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/components/auth/AuthContext";
import { supabase } from "@/supabase/supabaseClient";

interface HealthData {
  id?: string;
  user_id?: string;
  date: string;
  water_intake: number;
  meals_eaten: number;
  hours_sleep: number;
  meds_taken: number;
  created_at?: string;
  updated_at?: string;
}

const Alaura = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [healthData, setHealthData] = useState<HealthData>({
    date: new Date().toISOString().split("T")[0],
    water_intake: 0,
    meals_eaten: 0,
    hours_sleep: 0,
    meds_taken: 0,
  });
  const [healthHistory, setHealthHistory] = useState<HealthData[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Health goals configuration
  const healthGoals = [
    {
      key: "water_intake" as keyof HealthData,
      label: "Water",
      icon: Droplets,
      target: 64,
      unit: "oz",
      color: "blue",
      increment: 8,
    },
    {
      key: "meals_eaten" as keyof HealthData,
      label: "Meals",
      icon: Apple,
      target: 6,
      unit: "meals",
      color: "green",
      increment: 1,
    },
    {
      key: "hours_sleep" as keyof HealthData,
      label: "Sleep",
      icon: Moon,
      target: 8,
      unit: "hours",
      color: "purple",
      increment: 0.5,
    },
    {
      key: "meds_taken" as keyof HealthData,
      label: "Meds",
      icon: Pill,
      target: 4,
      unit: "meds",
      color: "orange",
      increment: 1,
    },
  ];

  // Generate timeline dates (last 14 days)
  const timelineDates = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - i));
    return date;
  });

  // Load health data for selected date
  const loadHealthData = async (date: Date) => {
    if (!user) return;

    setLoading(true);
    try {
      const dateString = date.toLocaleDateString("en-CA");
      const { data, error } = await supabase
        .from("health")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", dateString)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading health data:", error);
        return;
      }

      if (data) {
        setHealthData({ ...data, date: dateString });
      } else {
        setHealthData({
          date: dateString,
          water_intake: 0,
          meals_eaten: 0,
          hours_sleep: 0,
          meds_taken: 0,
        });
      }
    } catch (error) {
      console.error("Error loading health data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load health history
  const loadHealthHistory = async () => {
    if (!user) return;

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 14);

      const { data, error } = await supabase
        .from("health")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", startDate.toISOString().split("T")[0])
        .order("date", { ascending: true });

      if (error) throw error;
      setHealthHistory(data || []);
    } catch (error) {
      console.error("Error loading health history:", error);
    }
  };

  // Save health data
  const saveHealthData = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const dataToSave = {
        ...healthData,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      const { data: existingRecord } = await supabase
        .from("health")
        .select("id")
        .eq("user_id", user.id)
        .eq("date", healthData.date)
        .single();

      let result;
      if (existingRecord) {
        result = await supabase
          .from("health")
          .update(dataToSave)
          .eq("id", existingRecord.id);
      } else {
        result = await supabase.from("health").insert(dataToSave);
      }

      if (result.error) throw result.error;

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      await loadHealthHistory();
    } catch (error) {
      console.error("Error saving health data:", error);
    } finally {
      setSaving(false);
    }
  };

  // Update health data value
  const updateValue = (key: keyof HealthData, delta: number) => {
    setHealthData((prev) => ({
      ...prev,
      [key]: Math.max(0, (prev[key] as number) + delta),
    }));
  };

  // Calculate completion percentage
  const getCompletionPercentage = (data: HealthData) => {
    let completed = 0;
    healthGoals.forEach((goal) => {
      if ((data[goal.key] as number) >= goal.target) completed++;
    });
    return (completed / healthGoals.length) * 100;
  };

  // Calculate glow score for history
  const getGlowScore = (data: HealthData) => {
    return Math.round(getCompletionPercentage(data));
  };

  // Get color classes
  const getColorClasses = (color: string) => {
    const colors = {
      blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      green: "bg-green-500/20 text-green-400 border-green-500/30",
      purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      orange: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  useEffect(() => {
    loadHealthData(selectedDate);
  }, [selectedDate, user]);

  useEffect(() => {
    loadHealthHistory();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-12 w-12 mx-auto mb-4 text-blue-400" />
          <h2 className="text-xl font-semibold mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-400">
            Please sign in to access Alaura Health
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Alaura Health
            </h1>
            <p className="text-gray-400 mt-1">Your daily wellness companion</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold">
              {getCompletionPercentage(healthData).toFixed(0)}% Complete
            </div>
            <div className="text-sm text-gray-400">
              {selectedDate.toLocaleDateString()}
            </div>
          </div>
        </div>

        <Tabs defaultValue="today" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-gray-900/50">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          {/* Today Tab */}
          <TabsContent value="today" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="h-8 w-8 animate-spin text-blue-400" />
              </div>
            ) : (
              <>
                {/* Health Goals Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {healthGoals.map((goal) => {
                    const current = healthData[goal.key] as number;
                    const progress = (current / goal.target) * 100;
                    const isComplete = current >= goal.target;

                    return (
                      <Card
                        key={goal.key}
                        className="bg-gray-900/50 border-gray-800"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div
                                className={`p-2 rounded-lg ${getColorClasses(
                                  goal.color
                                )}`}
                              >
                                <goal.icon className="h-5 w-5" />
                              </div>
                              <div>
                                <h3 className="font-semibold">{goal.label}</h3>
                                <p className="text-sm text-gray-400">
                                  Target: {goal.target} {goal.unit}
                                </p>
                              </div>
                            </div>
                            {isComplete && (
                              <CheckCircle className="h-6 w-6 text-green-400" />
                            )}
                          </div>

                          <div className="space-y-4">
                            {/* Progress Bar */}
                            <div className="w-full bg-gray-800 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  isComplete
                                    ? "bg-green-500"
                                    : `bg-${goal.color}-500`
                                }`}
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>

                            {/* Current Value */}
                            <div className="text-center">
                              <span className="text-2xl font-bold">
                                {current}
                              </span>
                              <span className="text-gray-400 ml-1">
                                / {goal.target} {goal.unit}
                              </span>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center justify-center space-x-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateValue(goal.key, -goal.increment)
                                }
                                disabled={current === 0}
                                className="bg-gray-800 border-gray-700 hover:bg-gray-700"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateValue(goal.key, goal.increment)
                                }
                                className="bg-gray-800 border-gray-700 hover:bg-gray-700"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Save Button */}
                <div className="flex justify-center">
                  <Button
                    onClick={saveHealthData}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg"
                  >
                    {saving ? (
                      <Loader className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      <Save className="h-5 w-5 mr-2" />
                    )}
                    {saving ? "Saving..." : "Save Progress"}
                  </Button>
                </div>

                {/* Success Message */}
                {saveSuccess && (
                  <div className="text-center text-green-400 font-medium">
                    ✓ Progress saved successfully!
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-6">
            <div className="grid grid-cols-7 gap-2">
              {timelineDates.map((date) => {
                const dateString = date.toLocaleDateString("en-CA");
                const dayData = healthHistory.find(
                  (h) => h.date === dateString
                );
                const completion = dayData
                  ? getCompletionPercentage(dayData)
                  : 0;
                const isSelected =
                  date.toDateString() === selectedDate.toDateString();
                const isToday =
                  date.toDateString() === new Date().toDateString();

                return (
                  <button
                    key={dateString}
                    onClick={() => setSelectedDate(date)}
                    className={`aspect-square rounded-lg border-2 transition-all duration-200 ${
                      isSelected
                        ? "border-blue-500 bg-blue-500/20"
                        : "border-gray-700 hover:border-gray-600"
                    }`}
                  >
                    <div className="p-2 text-center">
                      <div className="text-xs text-gray-400 mb-1">
                        {date.toLocaleDateString("en-US", { weekday: "short" })}
                      </div>
                      <div
                        className={`text-sm font-semibold ${
                          isToday ? "text-blue-400" : ""
                        }`}
                      >
                        {date.getDate()}
                      </div>
                      <div className="mt-1">
                        {completion > 0 ? (
                          <div
                            className={`h-1 rounded-full ${
                              completion === 100
                                ? "bg-green-500"
                                : "bg-blue-500"
                            }`}
                            style={{ width: `${completion}%` }}
                          />
                        ) : (
                          <div className="h-1 bg-gray-800 rounded-full" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-blue-400" />
                  Weekly Overview
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {healthGoals.map((goal) => {
                    const average =
                      healthHistory.length > 0
                        ? healthHistory.reduce(
                            (sum, day) => sum + (day[goal.key] as number),
                            0
                          ) / healthHistory.length
                        : 0;

                    return (
                      <div key={goal.key} className="text-center">
                        <div
                          className={`p-3 rounded-lg ${getColorClasses(
                            goal.color
                          )} mb-2`}
                        >
                          <goal.icon className="h-6 w-6 mx-auto" />
                        </div>
                        <div className="text-sm text-gray-400">
                          {goal.label}
                        </div>
                        <div className="text-lg font-semibold">
                          {average.toFixed(1)} {goal.unit}
                        </div>
                        <div className="text-xs text-gray-500">avg/day</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Alaura;
