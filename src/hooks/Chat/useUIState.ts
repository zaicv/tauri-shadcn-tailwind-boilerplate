// =======================================================
// 🎭 LIGHTING & SET DESIGN BOARD - UI Visibility States
// =======================================================
// The lighting designer controls when different parts of the stage
// are visible, hidden, or highlighted for the audience

import { useState } from "react";

export const useUIState = () => {
  // -----------------------------
  // 🎭 Stage Lighting Controls
  // -----------------------------
  // Theme is now managed globally via ThemeContext - use useTheme() hook instead
  const [orbColors, setOrbColors] = useState(["#fffacd", "#ffd700"]);

  // -----------------------------
  // 🎭 Set Piece Visibility
  // -----------------------------
  const [showSettings, setShowSettings] = useState(false);
  const [showCarousel, setShowCarousel] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarOffset, setSidebarOffset] = useState(0);
  const [chatVisible, setChatVisible] = useState(false);
  const [orbActivated, setOrbActivated] = useState(false);
  const [showOrb, setShowOrb] = useState(true);
  const [memoryTreeVisible, setMemoryTreeVisible] = useState(false);
  const [superpowersModalVisible, setSuperpowersModalVisible] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [showTokenUsage, setShowTokenUsage] = useState(false);
  const [deepMemory, setDeepMemory] = useState(false);
  const [notionConnected, setNotionConnected] = useState(false);

  // -----------------------------
  // 🎭 Interactive Elements
  // -----------------------------
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // -----------------------------
  // 🎭 Convenience Functions
  // -----------------------------
  const toggleCarousel = () => setShowCarousel((prev) => !prev);
  const toggleMemoryTree = () => setMemoryTreeVisible((prev) => !prev);
  const toggleSuperpowersModal = () => {
    console.log(
      "🔥 toggleSuperpowersModal called! Current state:",
      superpowersModalVisible
    );
    setSuperpowersModalVisible((prev) => {
      console.log("🔥 Setting superpowersModalVisible from", prev, "to", !prev);
      return !prev;
    });
  };
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const toggleSettings = () => setShowSettings((prev) => !prev);
  const toggleToolbar = () => setShowToolbar((prev) => !prev);
  // toggleTheme is now managed by ThemeContext - use const { setTheme } = useTheme() instead
  const toggleOrbVisibility = () => setShowOrb((prev) => !prev);

  // -----------------------------
  // 🎭 Return Lighting Board
  // -----------------------------
  return {
    // Colors (theme managed globally via ThemeContext)
    orbColors,
    setOrbColors,

    // Visibility States
    showSettings,
    setShowSettings,
    showCarousel,
    setShowCarousel,
    sidebarOpen,
    setSidebarOpen,
    sidebarOffset,
    setSidebarOffset,
    chatVisible,
    setChatVisible,
    orbActivated,
    setOrbActivated,
    showOrb,
    setShowOrb,
    memoryTreeVisible,
    setMemoryTreeVisible,
    superpowersModalVisible,
    setSuperpowersModalVisible,
    showToolbar,
    setShowToolbar,
    showTokenUsage,
    setShowTokenUsage,

    // Interactive States
    dropdownOpen,
    setDropdownOpen,

    // Convenience Toggles
    toggleCarousel,
    toggleMemoryTree,
    toggleSuperpowersModal,
    toggleSidebar,
    toggleSettings,
    toggleToolbar,
    toggleOrbVisibility,
    deepMemory,
    setDeepMemory,
    notionConnected,
    setNotionConnected,
  };
};
