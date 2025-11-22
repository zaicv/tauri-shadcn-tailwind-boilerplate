import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/supabase/supabaseClient";
import {
  CheckCircle,
  Circle,
  Edit3,
  Trash2,
  Plus,
  Sun,
  Moon,
  RefreshCw,
} from "lucide-react";

// Types
type SupabaseTodo = {
  id: string;
  user_id: string;
  title: string;
  goal_group: string | null;
  priority: number;
  status: "pending" | "completed" | "in_progress";
  created_at: string;
  updated_at: string;
};

type TodoItem = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  priority: "low" | "medium" | "high";
};

type Category = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  todos: TodoItem[];
};

export default function TodoMobile({ persona }: { persona: any }) {
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

  // Convert Supabase todo -> frontend
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

  // Fetch user & todos
  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setCurrentUser(user);
      await loadTodos(user.id);
    };
    init();
  }, []);

  const loadTodos = async (userId: string) => {
    setLoading(true);
    const { data: todos, error } = await supabase
      .from("todos")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && todos) {
      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          todos: todos
            .filter((t) => t.goal_group === cat.name)
            .map(convertSupabaseTodo),
        }))
      );
    }
    setLoading(false);
  };

  const addTodo = async (categoryId: string, text: string) => {
    if (!text.trim() || !currentUser) return;
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return;

    const { data, error } = await supabase
      .from("todos")
      .insert({
        title: text.trim(),
        goal_group: category.name,
        user_id: currentUser.id,
        priority: 2,
        status: "pending",
      })
      .select()
      .single();
    if (data) {
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === categoryId
            ? { ...cat, todos: [convertSupabaseTodo(data), ...cat.todos] }
            : cat
        )
      );
    }
  };

  const toggleTodo = async (categoryId: string, todoId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    const todo = category?.todos.find((t) => t.id === todoId);
    if (!todo || !currentUser) return;

    const newStatus = todo.completed ? "pending" : "completed";
    await supabase
      .from("todos")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", todoId)
      .eq("user_id", currentUser.id);
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
  };

  const deleteTodo = async (categoryId: string, todoId: string) => {
    if (!currentUser) return;
    await supabase
      .from("todos")
      .delete()
      .eq("id", todoId)
      .eq("user_id", currentUser.id);
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? { ...cat, todos: cat.todos.filter((t) => t.id !== todoId) }
          : cat
      )
    );
  };

  const startEditing = (todo: TodoItem) => {
    setEditingTodo(todo.id);
    setEditingText(todo.text);
  };
  const editTodo = async (
    categoryId: string,
    todoId: string,
    newText: string
  ) => {
    if (!newText.trim() || !currentUser) return;
    await supabase
      .from("todos")
      .update({ title: newText.trim(), updated_at: new Date().toISOString() })
      .eq("id", todoId)
      .eq("user_id", currentUser.id);
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              todos: cat.todos.map((t) =>
                t.id === todoId ? { ...t, text: newText.trim() } : t
              ),
            }
          : cat
      )
    );
    setEditingTodo(null);
    setEditingText("");
  };

  // Theme
  const themeClasses = {
    background: isDarkMode ? "bg-[#2d2929]" : "bg-gray-50",
    text: isDarkMode ? "text-white" : "text-gray-900",
    card: isDarkMode
      ? "bg-white/5 backdrop-blur-xl border-white/10"
      : "bg-white/90 shadow-md",
    input: isDarkMode
      ? "bg-white/10 border-white/20 text-white"
      : "bg-white/70 border-gray-300 text-gray-900",
    button: isDarkMode
      ? "bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white"
      : "bg-gray-200 hover:bg-gray-300 text-gray-900",
    todoItem: isDarkMode
      ? "bg-white/5 hover:bg-white/10"
      : "bg-gray-50/50 hover:bg-gray-100/70",
    completedText: isDarkMode ? "text-gray-400" : "text-gray-500",
    iconColor: isDarkMode ? "text-[#3a3a3a]" : "text-gray-600",
  };

  if (loading)
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${themeClasses.background} ${themeClasses.text}`}
      >
        <RefreshCw
          className={`w-8 h-8 animate-spin ${themeClasses.iconColor}`}
        />
      </div>
    );

  if (!currentUser)
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${themeClasses.background} ${themeClasses.text}`}
      >
        <p>Please log in to access your todos</p>
      </div>
    );

  return (
    <div
      className={`min-h-screen p-4 ${themeClasses.background} ${themeClasses.text} space-y-4`}
    >
      {/* Theme Toggle */}
      <div className="flex justify-end mb-2">
        <Button
          size="sm"
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`${themeClasses.button} rounded-full p-2`}
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Categories */}
      {categories.map((category) => (
        <Card
          key={category.id}
          className={`${themeClasses.card} rounded-xl shadow-md`}
        >
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg bg-gray-200 dark:bg-[#3a3a3a]">
                {category.emoji}
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">
                  {category.name}
                </CardTitle>
                <Badge>{category.todos.length} tasks</Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-2">
            {/* Todos */}
            {category.todos.map((todo) => (
              <div
                key={todo.id}
                className={`flex items-center justify-between p-2 rounded-lg ${themeClasses.todoItem}`}
              >
                <button onClick={() => toggleTodo(category.id, todo.id)}>
                  {todo.completed ? (
                    <CheckCircle className="text-green-500 w-5 h-5" />
                  ) : (
                    <Circle className="text-gray-400 w-5 h-5" />
                  )}
                </button>

                {editingTodo === todo.id ? (
                  <div className="flex-1 flex gap-2 ml-2">
                    <Input
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          editTodo(category.id, todo.id, editingText);
                        if (e.key === "Escape") setEditingTodo(null);
                      }}
                      className={`${themeClasses.input} flex-1 text-sm h-8`}
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={() =>
                        editTodo(category.id, todo.id, editingText)
                      }
                    >
                      Save
                    </Button>
                  </div>
                ) : (
                  <span
                    className={`flex-1 ml-2 text-sm ${
                      todo.completed ? themeClasses.completedText : ""
                    }`}
                  >
                    {todo.text}
                  </span>
                )}

                <div className="flex gap-2 ml-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEditing(todo)}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteTodo(category.id, todo.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Add Todo */}
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Add task..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addTodo(category.id, e.currentTarget.value);
                    e.currentTarget.value = "";
                  }
                }}
                className={`${themeClasses.input} flex-1 h-10 text-sm`}
              />
              <Button
                onClick={(e) => {
                  const input = e.currentTarget
                    .previousElementSibling as HTMLInputElement;
                  addTodo(category.id, input.value);
                  input.value = "";
                }}
                className={`${themeClasses.button} p-2 rounded-lg`}
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
