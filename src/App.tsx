import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/context/ThemeContext";
import { PersonaProvider } from "@/context/PersonaContext";
import { AuthProvider } from "@/components/auth/AuthContext";
import { WebSocketProvider } from "@/context/WebSocketContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { GlobalNavBar } from "@/components/Global/GlobalNavBar";

// Loading component
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-900">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-white text-lg">Loading...</p>
    </div>
  </div>
);

// Lazy load pages for better performance
const GlowDashboard = lazy(() => import("@/pages/Home/GlowDashboard").catch(() => ({
  default: () => <div className="p-8 text-white">Dashboard unavailable</div>
})));

const Chat = lazy(() => import("@/pages/Chat/Chat").catch(() => ({
  default: () => <div className="p-8 text-white">Chat unavailable</div>
})));

const Personas = lazy(() => import("@/pages/Personas/Personas").catch(() => ({
  default: () => <div className="p-8 text-white">Personas unavailable</div>
})));

const SuperpowersPage = lazy(() => import("@/pages/Superpowers/Superpowers").catch(() => ({
  default: () => <div className="p-8 text-white">Superpowers unavailable</div>
})));

const Memories = lazy(() => import("@/pages/Memory/Memories").catch(() => ({
  default: () => <div className="p-8 text-white">Memories unavailable</div>
})));

const KnowledgeBase = lazy(() => import("@/pages/KnowledgeBase/KnowledgeBase").catch(() => ({
  default: () => <div className="p-8 text-white">Knowledge Base unavailable</div>
})));

const LoginPage = lazy(() => import("@/pages/Authentification/LoginPage").catch(() => ({
  default: () => <div className="p-8 text-white">Login unavailable</div>
})));

function AppContent() {
  return (
    <div className="min-h-screen w-full bg-gray-900">
      <ErrorBoundary>
        <GlobalNavBar />
      </ErrorBoundary>
      
      {/* Main content area with padding for fixed navbar */}
      <main className="pt-16">
        <ErrorBoundary>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              {/* Home / Dashboard */}
              <Route path="/" element={<GlowDashboard />} />
              <Route path="/glow-dashboard" element={<GlowDashboard />} />
              
              {/* Chat Routes */}
              <Route path="/chat" element={<Chat />} />
              <Route path="/chat/:threadId" element={<Chat />} />
              
              {/* Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              
              {/* Personas Routes */}
              <Route path="/personas" element={<Personas />} />
              
              {/* Superpowers Routes */}
              <Route path="/superpowers" element={<SuperpowersPage />} />
              
              {/* Memories & Knowledge Base */}
              <Route path="/memories" element={<Memories />} />
              <Route path="/knowledge-base" element={<KnowledgeBase />} />
              
              {/* Catch all - redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      
      {/* Global Toast Notifications */}
      <Toaster position="bottom-right" richColors />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <ThemeProvider>
          <AuthProvider>
            <PersonaProvider>
              <WebSocketProvider>
                <SidebarProvider>
                  <AppContent />
                </SidebarProvider>
              </WebSocketProvider>
            </PersonaProvider>
          </AuthProvider>
        </ThemeProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
