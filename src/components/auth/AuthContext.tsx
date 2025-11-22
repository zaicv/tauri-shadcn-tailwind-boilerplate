// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/supabase/supabaseClient";

type AuthContextType = {
  session: any | null;
  user: any | null;
  signInWithFingerprint: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    // Only try to connect to Supabase if it's properly configured
    if (!isSupabaseConfigured) {
      console.warn("Supabase is not configured. Auth features will be limited.");
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
    }).catch(err => {
      console.error("Failed to get Supabase session:", err);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signInWithFingerprint = async () => {
    // just redirect to /authbox
    window.location.href = "/authbox";
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ session, user, signInWithFingerprint, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
