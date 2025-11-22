import React, { useState } from "react";
import {
  Home,
  Folder,
  Star,
  Clock,
  Download,
  FileText,
  Image,
  Music,
  Video,
  Archive,
  Code,
  HardDrive,
  Server,
  Cloud,
  Trash2,
  Plus,
  ChevronDown,
  ChevronRight,
  Search,
} from "lucide-react";

interface FileOpsSidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  favorites: string[];
  recents: string[];
  onToggleFavorite: (path: string) => void;
  className?: string;
}

interface LocationItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  size?: string;
  color?: string;
  count?: number;
}

export function FileOpsSidebar({
  currentPath,
  onNavigate,
  favorites,
  recents,
  onToggleFavorite,
  className = "",
}: FileOpsSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    locations: true,
    categories: true,
    volumes: true,
    favorites: true,
    recents: true,
  });
  const [sectionOrder, setSectionOrder] = useState([
    "locations",
    "categories",
    "volumes",
    "favorites",
    "recents",
  ]);
  const [draggedSection, setDraggedSection] = useState<string | null>(null);

  const locations: LocationItem[] = [
    { name: "Home", path: "/", icon: <Home className="w-4 h-4" /> },
    {
      name: "Desktop",
      path: "/Users/zai/Desktop",
      icon: <Folder className="w-4 h-4 text-blue-500" />,
    },
    {
      name: "Plex",
      path: "/Users/zai/Desktop/plex",
      icon: <FileText className="w-4 h-4 text-blue-500" />,
    },
    {
      name: "Downloads",
      path: "/Users/zai/Downloads",
      icon: <Download className="w-4 h-4 text-green-500" />,
    },
    {
      name: "Pictures",
      path: "/Users/zai/Pictures",
      icon: <Image className="w-4 h-4 text-pink-500" />,
    },
    {
      name: "Music",
      path: "/Users/zai/Music",
      icon: <Music className="w-4 h-4 text-purple-500" />,
    },
    {
      name: "Movies",
      path: "/Users/zai/Movies",
      icon: <Video className="w-4 h-4 text-red-500" />,
    },
  ];

  const categories: LocationItem[] = [
    {
      name: "Images",
      path: "/search?type=image",
      icon: <Image className="w-4 h-4 text-pink-500" />,
      count: 247,
    },
    {
      name: "Documents",
      path: "/search?type=document",
      icon: <FileText className="w-4 h-4 text-blue-500" />,
      count: 89,
    },
    {
      name: "Audio",
      path: "/search?type=audio",
      icon: <Music className="w-4 h-4 text-purple-500" />,
      count: 156,
    },
    {
      name: "Video",
      path: "/search?type=video",
      icon: <Video className="w-4 h-4 text-red-500" />,
      count: 23,
    },
    {
      name: "Archives",
      path: "/search?type=archive",
      icon: <Archive className="w-4 h-4 text-yellow-600" />,
      count: 12,
    },
    {
      name: "Code",
      path: "/search?type=code",
      icon: <Code className="w-4 h-4 text-orange-500" />,
      count: 342,
    },
  ];

  const volumes: LocationItem[] = [
    {
      name: "Macintosh HD",
      path: "/",
      icon: <HardDrive className="w-4 h-4 text-blue-500" />,
      size: "512 GB",
    },
    {
      name: "External Drive",
      path: "/Volumes/External",
      icon: <HardDrive className="w-4 h-4 text-green-500" />,
      size: "1 TB",
    },
    {
      name: "Network",
      path: "/Network",
      icon: <Server className="w-4 h-4 text-purple-500" />,
    },
    {
      name: "Cloud Storage",
      path: "/Cloud",
      icon: <Cloud className="w-4 h-4 text-orange-500" />,
      size: "2 TB",
    },
  ];

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const renderMenuItem = (item: LocationItem, isActive?: boolean) => (
    <button
      key={item.path}
      onClick={() => onNavigate(item.path)}
      className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors hover:bg-gray-100 group ${
        isActive
          ? "bg-blue-50 text-blue-700 border-r-2 border-blue-500"
          : "text-gray-700"
      }`}
    >
      {item.icon}
      <div className="flex-1 flex items-center justify-between">
        <span className="truncate">{item.name}</span>
        {item.size && (
          <span className="text-xs text-gray-400 ml-2">{item.size}</span>
        )}
        {item.count && (
          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
            {item.count}
          </span>
        )}
      </div>
    </button>
  );

  const handleDragStart = (e: React.DragEvent, section: string) => {
    setDraggedSection(section);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetSection: string) => {
    e.preventDefault();
    if (!draggedSection || draggedSection === targetSection) return;

    const newOrder = [...sectionOrder];
    const draggedIndex = newOrder.indexOf(draggedSection);
    const targetIndex = newOrder.indexOf(targetSection);

    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedSection);

    setSectionOrder(newOrder);
    setDraggedSection(null);
  };

  const renderSectionHeader = (
    title: string,
    section: keyof typeof expandedSections,
    showAddButton?: boolean
  ) => (
    <div
      className={`flex items-center justify-between px-2 mb-2 ${
        draggedSection === section ? "opacity-50" : ""
      }`}
      draggable
      onDragStart={(e) => handleDragStart(e, section)}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, section)}
    >
      <button
        className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wide hover:text-gray-700 cursor-grab active:cursor-grabbing"
        onClick={() => toggleSection(section)}
      >
        {expandedSections[section] ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
        <span>{title}</span>
      </button>
      {showAddButton && (
        <button className="h-6 w-6 p-0 rounded hover:bg-gray-200 flex items-center justify-center">
          <Plus className="w-3 h-3" />
        </button>
      )}
    </div>
  );

  const favoriteItems = favorites.map((path) => ({
    name: path.split("/").pop() || "Root",
    path,
    icon: <Star className="w-4 h-4 text-yellow-500" />,
  }));

  const recentItems = recents.slice(0, 8).map((path) => ({
    name: path.split("/").pop() || "Root",
    path,
    icon: <Clock className="w-4 h-4 text-gray-500" />,
  }));

  const filteredLocations = locations.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={`flex flex-col w-56 border-r border-gray-200 bg-gray-50 ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Search locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {sectionOrder.map((sectionKey) => {
          switch (sectionKey) {
            case "locations":
              return (
                <div key="locations">
                  {renderSectionHeader("Places", "locations", true)}
                  {expandedSections.locations && (
                    <div className="space-y-1">
                      {filteredLocations.map((item) =>
                        renderMenuItem(item, currentPath === item.path)
                      )}
                    </div>
                  )}
                </div>
              );
            case "categories":
              return (
                <div key="categories">
                  {renderSectionHeader("Categories", "categories")}
                  {expandedSections.categories && (
                    <div className="space-y-1">
                      {categories.map((item) =>
                        renderMenuItem(item, currentPath === item.path)
                      )}
                    </div>
                  )}
                </div>
              );
            case "volumes":
              return (
                <div key="volumes">
                  {renderSectionHeader("Devices", "volumes")}
                  {expandedSections.volumes && (
                    <div className="space-y-1">
                      {volumes.map((item) =>
                        renderMenuItem(item, currentPath === item.path)
                      )}
                    </div>
                  )}
                </div>
              );
            case "favorites":
              return favorites.length > 0 ? (
                <div key="favorites">
                  {renderSectionHeader("Favorites", "favorites")}
                  {expandedSections.favorites && (
                    <div className="space-y-1">
                      {favoriteItems.map((item) =>
                        renderMenuItem(item, currentPath === item.path)
                      )}
                    </div>
                  )}
                </div>
              ) : null;
            case "recents":
              return recents.length > 0 ? (
                <div key="recents">
                  {renderSectionHeader("Recent", "recents")}
                  {expandedSections.recents && (
                    <div className="space-y-1">
                      {recentItems.map((item) =>
                        renderMenuItem(item, currentPath === item.path)
                      )}
                    </div>
                  )}
                </div>
              ) : null;
            default:
              return null;
          }
        })}

        {/* Trash - Always at bottom */}
        <div className="pt-2 border-t border-gray-200">
          <button
            onClick={() => onNavigate("/Trash")}
            className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors hover:bg-gray-100 ${
              currentPath === "/Trash"
                ? "bg-red-50 text-red-700"
                : "text-gray-700"
            }`}
          >
            <Trash2 className="w-4 h-4 text-red-500" />
            <span>Trash</span>
          </button>
        </div>
      </div>
    </div>
  );
}
