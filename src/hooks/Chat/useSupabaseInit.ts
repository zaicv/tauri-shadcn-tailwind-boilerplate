

import { useEffect } from 'react';
import { supabase } from '../../supabase/supabaseClient';

export const useSupabaseInit = () => {
useEffect(() => {
    // Test Supabase connection
    (async () => {
      try {
        const { data, error } = await supabase
          .from("chat_threads")
          .select("*")
          .limit(1);
        if (error) console.error("[DEBUG] Supabase connection error:", error);
        else console.log("[DEBUG] Supabase connection successful:", data);
      } catch (err) {
        console.error("[DEBUG] Supabase connection failed:", err);
      }
    })();
  }, []);
};