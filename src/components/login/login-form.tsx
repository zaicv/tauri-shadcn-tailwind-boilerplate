import { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, signUp } from "@/supabase/auth";
import { supabase } from "@/supabase/supabaseClient";
import { useNavigate } from "react-router-dom";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const authFn = mode === "login" ? signIn : signUp;
      const { session, user } = await authFn(email, password);

      console.log("[DEBUG] Auth result:", { session, user });

      const { data, error: getUserError } = await supabase.auth.getUser();
      if (getUserError || !data.user) {
        console.error(
          "[DEBUG] Error verifying session after login:",
          getUserError
        );
        setError("Login successful, but could not verify session.");
        return;
      }

      console.log("[DEBUG] Verified user:", data.user);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      console.error("[DEBUG] Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-6 text-white bg-[#1e1e1e] rounded-2xl px-6 py-8",
        className
      )}
      {...props}
    >
      <div className="text-center space-y-1">
        <Link to="/chat">
          <button
            type="button"
            className="text-sm font-medium text-gray-400 tracking-wide transition"
          >
            GlowGPT
          </button>
        </Link>
        <h1 className="text-2xl font-semibold text-white">
          {mode === "login" ? "Welcome back" : "Create an account"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} autoComplete="on" className="pt-4">
        <div className="grid gap-5">
          <div className="grid gap-1.5">
            <Label htmlFor="email" className="text-[13px] text-gray-300">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 bg-[#2a2a2a] border border-[#3a3a3a] text-white placeholder-gray-500 rounded-full px-4"
            />
          </div>
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-[13px] text-gray-300">
                Password
              </Label>
              {mode === "login" && (
                <a
                  href="#"
                  className="text-sm text-gray-400 underline-offset-4 hover:underline"
                >
                  Forgot?
                </a>
              )}
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 bg-[#2a2a2a] border border-[#3a3a3a] text-white placeholder-gray-500 rounded-full px-4"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-full bg-black text-white hover:bg-neutral-800 font-medium transition"
          >
            {loading
              ? mode === "login"
                ? "Logging in..."
                : "Signing up..."
              : mode === "login"
              ? "Log in"
              : "Sign up"}
          </Button>
        </div>

        <div className="text-center text-sm text-gray-400 mt-6">
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="underline underline-offset-4 text-white hover:text-gray-300"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="underline underline-offset-4 text-white hover:text-gray-300"
              >
                Log in
              </button>
            </>
          )}
        </div>

        <div className="relative mt-8 text-center text-sm text-gray-500">
          <span className="relative z-10 bg-[#1e1e1e] px-3">OR</span>
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#3a3a3a]" />
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 rounded-full bg-[#1e1e1e] text-white border border-[#3a3a3a] hover:bg-[#2a2a2a]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="mr-2 size-4 fill-white"
            >
              <path d="M16.365 1.43c..." />
            </svg>
            {mode === "login" ? "Continue" : "Sign up"} with Apple
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 rounded-full bg-[#1e1e1e] text-white border border-[#3a3a3a] hover:bg-[#2a2a2a]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="mr-2 size-4 fill-white"
            >
              <path d="M12.48 10.92v3.28..." />
            </svg>
            {mode === "login" ? "Continue" : "Sign up"} with Google
          </Button>
        </div>
      </form>

      <div className="mt-8 text-center text-[11px] text-gray-500  [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-white">
        By continuing, you agree to our <a href="#">Terms of Service</a> and{" "}
        <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
