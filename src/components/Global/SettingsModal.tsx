import { useTheme } from "@/context/ThemeContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { theme, setTheme, isDark } = useTheme();
  
  console.log("⚙️ SettingsModal - Current theme:", theme, "| isDark:", isDark);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-800",
          "shadow-xl"
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-zinc-900 dark:text-zinc-100">
            Settings
          </DialogTitle>
          <DialogDescription className="text-zinc-600 dark:text-zinc-400">
            Manage your application preferences
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label
              htmlFor="theme"
              className="text-zinc-900 dark:text-zinc-100 font-medium"
            >
              Theme
            </Label>
            <Select
              value={theme}
              onValueChange={(value) => {
                console.log("🔄 Theme select changed to:", value);
                setTheme(value as "light" | "dark" | "system");
              }}
            >
              <SelectTrigger
                id="theme"
                className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700"
              >
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                <SelectItem
                  value="light"
                  className="text-zinc-900 dark:text-zinc-100 focus:bg-zinc-100 dark:focus:bg-zinc-700"
                >
                  Light
                </SelectItem>
                <SelectItem
                  value="dark"
                  className="text-zinc-900 dark:text-zinc-100 focus:bg-zinc-100 dark:focus:bg-zinc-700"
                >
                  Dark
                </SelectItem>
                <SelectItem
                  value="system"
                  className="text-zinc-900 dark:text-zinc-100 focus:bg-zinc-100 dark:focus:bg-zinc-700"
                >
                  System
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Current: {theme} | Dark mode: {isDark ? "✓" : "✗"}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

