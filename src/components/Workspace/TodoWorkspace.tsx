import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle,
  Circle,
  Edit3,
  Trash2,
  Plus,
  MoreVertical,
  Check,
  Sun,
  Moon,
  RefreshCw,
  Lock,
  ListTodo,
  Target,
  Database,
  PieChart,
} from "lucide-react";
import { supabase } from "@/supabase/supabaseClient";

// Supabase types matching your table structure
type SupabaseTodo = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  goal_group: string | null;
  priority: number;
  status: "pending" | "in_progress" | "completed";
  deadline: string | null;
  created_at: string;
  updated_at: string;
};

// Frontend Todo type (adapted from your original)
type TodoItem = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  priority: "low" | "medium" | "high";
};

// Category type matching your image layout
type Category = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  todos: TodoItem[];
};

export default function TodoWorkspace({ persona }: { persona: any }) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([
    {
      id: "1",
      name: "Gain 10 lbs",
      emoji: "🥩",
      color: "from-red-500 to-orange-500",
      todos: [],
    },
    {
      id: "2",
      name: "Adapt My Diet",
      emoji: "🍽",
      color: "from-green-500 to-emerald-500",
      todos: [],
    },
    {
      id: "3",
      name: "Physical Reconditioning",
      emoji: "🏃‍♂️",
      color: "from-blue-500 to-cyan-500",
      todos: [],
    },
    {
      id: "4",
      name: "The Glow",
      emoji: "✨",
      color: "from-purple-500 to-pink-500",
      todos: [],
    },
    {
      id: "5",
      name: "Ava",
      emoji: "👧",
      color: "from-yellow-500 to-amber-500",
      todos: [],
    },
    {
      id: "6",
      name: "Marissa",
      emoji: "💕",
      color: "from-pink-500 to-rose-500",
      todos: [],
    },
    {
      id: "7",
      name: "Family",
      emoji: "🏡",
      color: "from-indigo-500 to-blue-500",
      todos: [],
    },
    {
      id: "8",
      name: "House",
      emoji: "🧼",
      color: "from-gray-500 to-slate-500",
      todos: [],
    },
    {
      id: "9",
      name: "College / Career",
      emoji: "🎓",
      color: "from-violet-500 to-purple-500",
      todos: [],
    },
    {
      id: "10",
      name: "The Glow / Mortal Brand",
      emoji: "🌟",
      color: "from-amber-500 to-yellow-500",
      todos: [],
    },
    {
      id: "11",
      name: "Coffee Truck / Content",
      emoji: "☕",
      color: "from-orange-500 to-red-500",
      todos: [],
    },
    {
      id: "12",
      name: "Money + Admin",
      emoji: "💸",
      color: "from-emerald-500 to-green-500",
      todos: [],
    },
  ]);

  const [editingTodo, setEditingTodo] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  // Helper function to convert Supabase todo to frontend todo
  const convertSupabaseTodo = (supabaseTodo: SupabaseTodo): TodoItem => ({
    id: supabaseTodo.id,
    text: supabaseTodo.title,
    completed: supabaseTodo.status === "completed",
    createdAt: new Date(supabaseTodo.created_at),
    priority:
      supabaseTodo.priority === 1
        ? "high"
        : supabaseTodo.priority === 3
        ? "low"
        : "medium",
  });

  // Helper function to convert frontend priority to Supabase priority
  const convertToSupabasePriority = (
    priority: "low" | "medium" | "high"
  ): number => {
    return priority === "high" ? 1 : priority === "low" ? 3 : 2;
  };

  // Get current user and load todos
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          console.error("No authenticated user found");
          setLoading(false);
          return;
        }

        setCurrentUser(user);
        await loadTodos(user.id);
      } catch (error) {
        console.error("Error initializing app:", error);
        setLoading(false);
      }
    };

    initializeApp();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
        await loadTodos(session.user.id);
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadTodos = async (userId: string) => {
    try {
      setLoading(true);

      const { data: todos, error } = await supabase
        .from("todos")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading todos:", error);
        return;
      }

      // Group todos by goal_group and update categories
      if (todos) {
        setCategories((prevCategories) =>
          prevCategories.map((category) => {
            const categoryTodos = todos
              .filter((todo: SupabaseTodo) => todo.goal_group === category.name)
              .map(convertSupabaseTodo);

            return {
              ...category,
              todos: categoryTodos,
            };
          })
        );
      }
    } catch (error) {
      console.error("Error loading todos:", error);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (categoryId: string, text: string) => {
    if (!text.trim() || !currentUser) return;

    const category = categories.find((cat) => cat.id === categoryId);
    if (!category) return;

    try {
      const { data, error } = await supabase
        .from("todos")
        .insert({
          title: text.trim(),
          goal_group: category.name,
          user_id: currentUser.id,
          priority: 2, // Default to medium
          status: "pending",
        })
        .select()
        .single();

      if (error) {
        console.error("Error adding todo:", error);
        return;
      }

      if (data) {
        const newTodo = convertSupabaseTodo(data);

        setCategories((prev) =>
          prev.map((cat) =>
            cat.id === categoryId
              ? { ...cat, todos: [newTodo, ...cat.todos] }
              : cat
          )
        );
      }
    } catch (error) {
      console.error("Error adding todo:", error);
    }
  };

  const toggleTodo = async (categoryId: string, todoId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    const todo = category?.todos.find((t) => t.id === todoId);

    if (!todo || !currentUser) return;

    try {
      const newStatus = todo.completed ? "pending" : "completed";

      const { error } = await supabase
        .from("todos")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", todoId)
        .eq("user_id", currentUser.id);

      if (error) {
        console.error("Error toggling todo:", error);
        return;
      }

      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === categoryId
            ? {
                ...cat,
                todos: cat.todos.map((t) =>
                  t.id === todoId ? { ...t, completed: !t.completed } : t
                ),
              }
            : cat
        )
      );
    } catch (error) {
      console.error("Error toggling todo:", error);
    }
  };

  const deleteTodo = async (categoryId: string, todoId: string) => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from("todos")
        .delete()
        .eq("id", todoId)
        .eq("user_id", currentUser.id);

      if (error) {
        console.error("Error deleting todo:", error);
        return;
      }

      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === categoryId
            ? { ...cat, todos: cat.todos.filter((todo) => todo.id !== todoId) }
            : cat
        )
      );
    } catch (error) {
      console.error("Error deleting todo:", error);
    }
  };

  const editTodo = async (
    categoryId: string,
    todoId: string,
    newText: string
  ) => {
    if (!newText.trim() || !currentUser) return;

    try {
      const { error } = await supabase
        .from("todos")
        .update({
          title: newText.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", todoId)
        .eq("user_id", currentUser.id);

      if (error) {
        console.error("Error editing todo:", error);
        return;
      }

      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === categoryId
            ? {
                ...cat,
                todos: cat.todos.map((todo) =>
                  todo.id === todoId ? { ...todo, text: newText.trim() } : todo
                ),
              }
            : cat
        )
      );

      setEditingTodo(null);
      setEditingText("");
    } catch (error) {
      console.error("Error editing todo:", error);
    }
  };

  const startEditing = (todo: TodoItem) => {
    setEditingTodo(todo.id);
    setEditingText(todo.text);
  };

  // Theme classes
  const themeClasses = {
    background: isDarkMode ? "bg-[#2d2929]" : "bg-gray-50",
    text: isDarkMode ? "text-white" : "text-gray-900",
    card: isDarkMode
      ? "bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10"
      : "bg-white/90 backdrop-blur-xl border-gray-200/50 hover:bg-white shadow-sm hover:shadow-md",
    cardTitle: isDarkMode ? "text-white" : "text-gray-900",
    badge: isDarkMode
      ? "bg-[#3a3a3a] text-white border-0"
      : "bg-gray-100 text-gray-700 border-0",
    input: isDarkMode
      ? "bg-white/10 border-white/20 text-white placeholder-gray-400"
      : "bg-white/70 border-gray-300 text-gray-900 placeholder-gray-500",
    button: isDarkMode
      ? "bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white"
      : "bg-gray-200 hover:bg-gray-300 text-gray-900",
    todoItem: isDarkMode
      ? "bg-white/5 hover:bg-white/10"
      : "bg-gray-50/50 hover:bg-gray-100/70",
    todoText: isDarkMode ? "text-white" : "text-gray-900",
    completedText: isDarkMode ? "text-gray-400" : "text-gray-500",
    tabsList: isDarkMode
      ? "bg-white/10 backdrop-blur-xl border-white/20"
      : "bg-white/70 backdrop-blur-xl border-gray-200/50 shadow-sm",
    tabsTrigger: isDarkMode
      ? "data-[state=active]:bg-[#3a3a3a] data-[state=active]:text-white text-gray-300"
      : "data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-600",
    dropdown: isDarkMode
      ? "bg-[#3a3a3a] backdrop-blur-xl border-white/20"
      : "bg-white backdrop-blur-xl border-gray-200 shadow-lg",
    dropdownItem: isDarkMode
      ? "text-white hover:bg-white/20"
      : "text-gray-900 hover:bg-gray-100",
    overviewCard: isDarkMode
      ? "bg-white/5 backdrop-blur-xl border-white/10"
      : "bg-white/90 backdrop-blur-xl border-gray-200/50 shadow-lg",
    iconColor: isDarkMode ? "text-[#3a3a3a]" : "text-gray-600",
    emojiContainer: isDarkMode
      ? "bg-[#3a3a3a] border border-white/10"
      : "bg-gray-100 border border-gray-200",
    themeToggle: isDarkMode
      ? "bg-white/10 hover:bg-white/20 text-white border border-white/20"
      : "bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 shadow-sm",
  };

  // Loading state
  if (loading) {
    return (
      <div
        className={`min-h-screen ${themeClasses.background} ${themeClasses.text} p-8 transition-colors duration-300 flex items-center justify-center`}
      >
        <div className="text-center">
          <RefreshCw
            className={`w-8 h-8 mx-auto mb-4 ${themeClasses.iconColor} animate-spin`}
          />
          <p className={themeClasses.completedText}>Loading your todos...</p>
        </div>
      </div>
    );
  }

  // No user state
  if (!currentUser) {
    return (
      <div
        className={`min-h-screen ${themeClasses.background} ${themeClasses.text} p-8 transition-colors duration-300 flex items-center justify-center`}
      >
        <div className="text-center">
          <Lock
            className={`w-16 h-16 mx-auto mb-4 ${themeClasses.iconColor}`}
          />
          <p className={themeClasses.completedText}>
            Please log in to access your todos
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${themeClasses.background} ${themeClasses.text} p-8 transition-colors duration-300`}
    >
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`${themeClasses.themeToggle} rounded-full p-2 transition-all duration-300`}
          size="sm"
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Apple TV Style Navigation Tabs */}
      <div className="mb-8">
        <Tabs defaultValue="todos" className="w-full">
          <TabsList
            className={`grid w-full max-w-md mx-auto grid-cols-2 ${themeClasses.tabsList} rounded-full p-1 transition-colors duration-300`}
          >
            <TabsTrigger
              value="todos"
              className={`${themeClasses.tabsTrigger} rounded-full transition-all duration-300 flex items-center gap-2`}
            >
              <ListTodo className="w-4 h-4" />
              Todo Workspace
            </TabsTrigger>
            <TabsTrigger
              value="overview"
              className={`${themeClasses.tabsTrigger} rounded-full transition-all duration-300 flex items-center gap-2`}
            >
              <Target className="w-4 h-4" />
              Overview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="todos" className="mt-8">
            {/* Todo Grid Layout - 3 columns, 4 rows matching your image */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category, index) => (
                <div
                  key={category.id}
                  className="opacity-0 animate-fade-in"
                  style={{
                    animationDelay: `${index * 0.1}s`,
                    animationFillMode: "forwards",
                  }}
                >
                  <Card
                    className={`${themeClasses.card} transition-all duration-300 group`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full ${themeClasses.emojiContainer} flex items-center justify-center shadow-lg transition-colors duration-300`}
                          >
                            <span className="text-lg select-none">
                              {category.emoji}
                            </span>
                          </div>
                          <div>
                            <CardTitle
                              className={`text-sm font-semibold ${themeClasses.cardTitle} transition-colors duration-300`}
                            >
                              {category.name}
                            </CardTitle>
                            <Badge
                              variant="secondary"
                              className={`text-xs ${themeClasses.badge} transition-colors duration-300`}
                            >
                              {category.todos.length} tasks
                            </Badge>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-20"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            className={`${themeClasses.dropdown} transition-colors duration-300`}
                          >
                            <DropdownMenuItem
                              className={`${themeClasses.dropdownItem} transition-colors duration-200 flex items-center gap-2`}
                            >
                              <Edit3 className="w-4 h-4" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-400 hover:bg-red-500/20 transition-colors duration-200 flex items-center gap-2">
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {/* Todo List */}
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {category.todos.map((todo) => (
                          <div
                            key={todo.id}
                            className={`flex items-center gap-2 p-2 ${themeClasses.todoItem} rounded-lg transition-all duration-200 group/todo`}
                          >
                            <button
                              onClick={() => toggleTodo(category.id, todo.id)}
                              className="flex-shrink-0 transition-colors duration-200"
                            >
                              {todo.completed ? (
                                <CheckCircle
                                  className={`w-4 h-4 text-green-500 transition-colors duration-200`}
                                />
                              ) : (
                                <Circle className="w-4 h-4 text-gray-400 hover:text-gray-300 transition-colors duration-200" />
                              )}
                            </button>

                            {editingTodo === todo.id ? (
                              <div className="flex-1 flex gap-2">
                                <Input
                                  value={editingText}
                                  onChange={(e) =>
                                    setEditingText(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      editTodo(
                                        category.id,
                                        todo.id,
                                        editingText
                                      );
                                    } else if (e.key === "Escape") {
                                      setEditingTodo(null);
                                      setEditingText("");
                                    }
                                  }}
                                  className={`flex-1 h-6 text-xs ${themeClasses.input} transition-colors duration-200`}
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    editTodo(category.id, todo.id, editingText)
                                  }
                                  className={`h-6 px-2 text-xs ${themeClasses.button} transition-colors duration-200`}
                                >
                                  <Check className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <span
                                className={`flex-1 text-xs ${
                                  todo.completed
                                    ? `line-through ${themeClasses.completedText}`
                                    : themeClasses.todoText
                                } transition-colors duration-200`}
                              >
                                {todo.text}
                              </span>
                            )}

                            <div className="flex gap-1 opacity-0 group-hover/todo:opacity-100 transition-opacity duration-200">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEditing(todo)}
                                className="h-6 w-6 p-0 hover:bg-opacity-20 transition-colors duration-200"
                              >
                                <Edit3 className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteTodo(category.id, todo.id)}
                                className="h-6 w-6 p-0 hover:bg-red-500/20 text-red-400 transition-colors duration-200"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add Todo Input */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add task..."
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              addTodo(category.id, e.currentTarget.value);
                              e.currentTarget.value = "";
                            }
                          }}
                          className={`flex-1 h-8 text-xs ${themeClasses.input} transition-colors duration-200`}
                        />
                        <Button
                          size="sm"
                          onClick={(e) => {
                            const input = e.currentTarget
                              .previousElementSibling as HTMLInputElement;
                            addTodo(category.id, input.value);
                            input.value = "";
                          }}
                          className={`h-8 w-8 p-0 ${themeClasses.button} transition-colors duration-200`}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="overview" className="mt-8">
            {/* Overview Tab Content */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="text-center group">
                <Database
                  className={`w-10 h-10 mx-auto mb-2 ${themeClasses.iconColor} transition-all duration-300 group-hover:scale-110`}
                />
                <div
                  className={`text-2xl font-bold ${themeClasses.iconColor} transition-colors duration-300`}
                >
                  {categories.reduce(
                    (total, cat) => total + cat.todos.length,
                    0
                  )}
                </div>
                <div
                  className={`${themeClasses.completedText} transition-colors duration-300`}
                >
                  Total Tasks
                </div>
              </div>
              <div className="text-center group">
                <CheckCircle
                  className={`w-10 h-10 mx-auto mb-2 ${themeClasses.iconColor} transition-all duration-300 group-hover:scale-110`}
                />
                <div
                  className={`text-2xl font-bold ${themeClasses.iconColor} transition-colors duration-300`}
                >
                  {categories.reduce(
                    (total, cat) =>
                      total + cat.todos.filter((todo) => todo.completed).length,
                    0
                  )}
                </div>
                <div
                  className={`${themeClasses.completedText} transition-colors duration-300`}
                >
                  Completed
                </div>
              </div>
              <div className="text-center group">
                <PieChart
                  className={`w-10 h-10 mx-auto mb-2 ${themeClasses.iconColor} transition-all duration-300 group-hover:scale-110`}
                />
                <div
                  className={`text-2xl font-bold ${themeClasses.iconColor} transition-colors duration-300`}
                >
                  {categories.length}
                </div>
                <div
                  className={`${themeClasses.completedText} transition-colors duration-300`}
                >
                  Categories
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}
