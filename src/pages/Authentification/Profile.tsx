import React, { useEffect, useState } from "react";
import { LogOut, PencilLine, Settings, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/supabase/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error) {
        setUser(data.user);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/authbox"); // Or redirect to home page
  };

  return (
    <motion.div
      className="min-h-screen bg-[#ededef] flex flex-col items-center px-4 pt-20"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-4">
          <Avatar className="h-28 w-28 border-4 border-primary shadow-md">
            <AvatarImage
              src={user?.user_metadata?.avatar_url || ""}
              alt="user avatar"
            />
            <AvatarFallback>
              {user?.user_metadata?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>

          <h1 className="text-2xl font-semibold text-center text-foreground">
            {user?.user_metadata?.name || "Your Name"}
          </h1>
          <p className="text-muted-foreground text-sm">{user?.email}</p>
        </div>

        <div className="mt-10 space-y-4">
          <Card>
            <CardContent className="p-4 space-y-2">
              {/* 🆕 Home button */}
              <Button
                variant="ghost"
                className="w-full justify-start text-base gap-3"
                onClick={() => navigate("/chat")}
              >
                <Home className="w-5 h-5" /> Go to Home
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-base gap-3"
                onClick={() => navigate("/editprofile")}
              >
                <PencilLine className="w-5 h-5" /> Edit Profile
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-base gap-3"
                onClick={() => navigate("/settings")}
              >
                <Settings className="w-5 h-5" /> Account Settings
              </Button>
              {user ? (
                <Button
                  variant="destructive"
                  className="w-full justify-start text-base gap-3"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5" /> Log Out
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  className="w-full justify-start text-base gap-3"
                  onClick={() => navigate("/authbox")}
                >
                  <LogOut className="w-5 h-5" /> Log In
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
