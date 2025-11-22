import { FileModal } from '@/components/Files/FileModal'
import GlowOrb from '@/components/GlowOrb/GlowOrb'
import GPTCarousel from '@/components/Orb/GPTCarousel'
import { AppleHelloEnglishEffect } from '@/components/shadcn.io/apple-hello-effect'
import { GlassDock, GlassFilter, type DockIcon } from '@/components/ui/liquid-glass'
import { usePersona } from '@/context/PersonaContext'
import { useTheme } from '@/context/ThemeContext'
import { FullChatApp } from '@/pages/Chat/FullChatApp'
import KnowledgeBase from '@/pages/KnowledgeBase/KnowledgeBase'
import Memories from '@/pages/Memory/Memories'
import Personas from '@/pages/Personas/Personas'
import GlowCloud from '@/pages/Superpowers/GlowCloud'
import { AnimatePresence, motion } from 'framer-motion'
import { Battery, Bell, FileText, Folder, Image, Mic, Moon, Music, Power, RefreshCw, Search, Settings, Sun, Volume2, Wifi } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type BootPhase = 'logo' | 'hello' | 'main'

const dockAppsConfig = [
  { id: 'chat', name: 'Chat', icon: '/GlOS/AppIcons/phoebe.png' },
  { id: 'personas', name: 'Personas', icon: '/GlOS/AppIcons/personas.png' },
  { id: 'memories', name: 'Memories', icon: '/GlOS/AppIcons/memories.png' },
  { id: 'knowledge-base', name: 'Knowledge Base', icon: '/GlOS/AppIcons/knowledgebase.png' },
  { id: 'glow-cloud', name: 'Glow Cloud', icon: '/GlOS/AppIcons/glowcloud.png' },
]

interface DesktopItem {
  id: string
  name: string
  type: 'folder' | 'file'
  icon: 'folder' | 'document' | 'image' | 'music'
  position: { x: number; y: number }
}

const desktopItems: DesktopItem[] = [
  { id: '1', name: 'Projects', type: 'folder', icon: 'folder', position: { x: 32, y: 48 } },
  { id: '2', name: 'Documents', type: 'folder', icon: 'folder', position: { x: 32, y: 168 } },
  { id: '3', name: 'Notes.txt', type: 'file', icon: 'document', position: { x: 32, y: 288 } },
  { id: '4', name: 'Photos', type: 'folder', icon: 'folder', position: { x: 160, y: 48 } },
  { id: '5', name: 'Design Work', type: 'folder', icon: 'folder', position: { x: 160, y: 168 } },
]

interface WindowState {
  id: string
  title: string
  icon: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  isMinimized: boolean
  zIndex: number
  contentType: 'chat' | 'personas' | 'memories' | 'knowledge-base' | 'glow-cloud' | 'default'
}

const GlowOS = () => {
  const [phase, setPhase] = useState<BootPhase>('logo')
  const [helloAnimationComplete, setHelloAnimationComplete] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [appleMenuOpen, setAppleMenuOpen] = useState(false)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [controlCenterOpen, setControlCenterOpen] = useState(false)
  const [spotlightOpen, setSpotlightOpen] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; itemId?: string } | null>(null)
  const [windows, setWindows] = useState<WindowState[]>([])
  const [maxZIndex, setMaxZIndex] = useState(100)
  const [finderOpen, setFinderOpen] = useState(false)
  const [finderInitialPath, setFinderInitialPath] = useState('/')
  const [siriActive, setSiriActive] = useState(false)
  const [showCarousel, setShowCarousel] = useState(false)
  const { isDark, setTheme } = useTheme()
  const { getCurrentPersona } = usePersona()
  
  // Get persona colors - will update when persona changes
  const currentPersona = getCurrentPersona()
  const personaColors = currentPersona?.colors || ['#3b82f6', '#8b5cf6']
  const primaryColor = personaColors[0] || '#3b82f6'
  const secondaryColor = personaColors[1] || personaColors[0] || '#8b5cf6'

  // Theme-based colors
  const bgColor = isDark ? 'bg-black' : 'bg-gray-50'
  const textColor = isDark ? 'text-white' : 'text-gray-900'
  const bgGradient = isDark 
    ? 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)'
    : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 50%, #f8f9fa 100%)'

  // Log persona changes for debugging
  useEffect(() => {
    console.log('🎨 GlowOS Persona Colors:', { 
      name: currentPersona?.name,
      primaryColor, 
      secondaryColor 
    })
  }, [currentPersona, primaryColor, secondaryColor])

  useEffect(() => {
    if (phase === 'logo') {
      const timer = setTimeout(() => setPhase('hello'), 2000)
      return () => clearTimeout(timer)
    }
  }, [phase])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleClickOutside = () => {
      setAppleMenuOpen(false)
      setActiveMenu(null)
      setControlCenterOpen(false)
      setContextMenu(null)
    }
    if (appleMenuOpen || activeMenu || controlCenterOpen || contextMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [appleMenuOpen, activeMenu, controlCenterOpen, contextMenu])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.code === 'Space') {
        e.preventDefault()
        setSpotlightOpen(true)
      }
      if (e.code === 'Escape') setSpotlightOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleHelloComplete = () => setHelloAnimationComplete(true)
  const handleHelloClick = () => { if (helloAnimationComplete) setPhase('main') }

  const handleAppClick = (appId: string) => {
    const app = dockAppsConfig.find(a => a.id === appId)
    const newWindow: WindowState = {
      id: appId + '-' + Date.now(),
      title: app?.name || 'App',
      icon: app?.icon || '',
      position: { x: 100 + windows.length * 30, y: 100 + windows.length * 30 },
      size: { width: 900, height: 700 },
      isMinimized: false,
      zIndex: maxZIndex + 1,
      contentType: appId as any,
    }
    setWindows([...windows, newWindow])
    setMaxZIndex(maxZIndex + 1)
  }

  // Create dock icons for liquid glass dock
  const dockIcons: DockIcon[] = dockAppsConfig.map(app => ({
    src: app.icon,
    alt: app.name,
    onClick: () => handleAppClick(app.id)
  }))

  const handleDesktopItemClick = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (e.detail === 2) {
      const item = desktopItems.find(i => i.id === itemId)
      if (item?.type === 'folder') {
        setFinderInitialPath('/')
        setFinderOpen(true)
      } else if (item?.type === 'file') {
        const newWindow: WindowState = {
          id: itemId + '-window-' + Date.now(),
          title: item.name,
          icon: '',
          position: { x: 200, y: 150 },
          size: { width: 700, height: 500 },
          isMinimized: false,
          zIndex: maxZIndex + 1,
          contentType: 'default',
        }
        setWindows([...windows, newWindow])
        setMaxZIndex(maxZIndex + 1)
      }
    } else {
      setSelectedItems([itemId])
    }
  }

  const handleDesktopClick = () => {
    setSelectedItems([])
    setContextMenu(null)
  }

  const handleContextMenu = (e: React.MouseEvent, itemId?: string) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, itemId })
  }

  const closeWindow = (windowId: string) => setWindows(windows.filter(w => w.id !== windowId))
  const minimizeWindow = (windowId: string) => setWindows(windows.map(w => w.id === windowId ? { ...w, isMinimized: true } : w))
  const bringToFront = (windowId: string) => {
    setWindows(windows.map(w => w.id === windowId ? { ...w, zIndex: maxZIndex + 1 } : w))
    setMaxZIndex(maxZIndex + 1)
  }

  const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <div className={`min-h-screen ${bgColor} ${textColor} relative overflow-hidden transition-colors duration-500 rounded-2xl`}>
      <AnimatePresence mode="wait">
        {phase === 'logo' && (
          <motion.div
            key="logo"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.6 }}
            className={`absolute inset-0 flex items-center justify-center ${bgColor}`}
          >
            <motion.img
              src="/glow-logo.png"
              alt="Glow Logo"
              className="w-32 h-32"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            />
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="w-40 h-40 rounded-full bg-white blur-3xl" />
            </motion.div>
          </motion.div>
        )}

        {phase === 'hello' && (
          <motion.div
            key="hello"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className={`absolute inset-0 flex items-center justify-center ${bgColor} cursor-pointer`}
            onClick={handleHelloClick}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center gap-8"
            >
              <AppleHelloEnglishEffect
                speed={1}
                onAnimationComplete={handleHelloComplete}
                className="h-24 text-white"
              />
              {helloAnimationComplete && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="text-slate-400 text-sm font-light animate-pulse"
                >
                  Click to continue
                </motion.p>
              )}
            </motion.div>
          </motion.div>
        )}

        {phase === 'main' && (
          <motion.div
            key="main"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
            onClick={handleDesktopClick}
            onContextMenu={(e) => handleContextMenu(e)}
          >
            {/* Optimized Gradient Background - Persona Colors & Theme Responsive */}
            <motion.div 
              className="absolute inset-0 transition-all duration-1000"
              animate={{ 
                background: isDark ? [
                  `radial-gradient(circle at 20% 30%, ${primaryColor}30 0%, transparent 50%), radial-gradient(circle at 80% 70%, ${secondaryColor}30 0%, transparent 50%), ${bgGradient}`,
                  `radial-gradient(circle at 25% 35%, ${primaryColor}35 0%, transparent 50%), radial-gradient(circle at 75% 65%, ${secondaryColor}35 0%, transparent 50%), ${bgGradient}`,
                  `radial-gradient(circle at 20% 30%, ${primaryColor}30 0%, transparent 50%), radial-gradient(circle at 80% 70%, ${secondaryColor}30 0%, transparent 50%), ${bgGradient}`
                ] : [
                  `radial-gradient(circle at 20% 30%, ${primaryColor}20 0%, transparent 50%), radial-gradient(circle at 80% 70%, ${secondaryColor}20 0%, transparent 50%), ${bgGradient}`,
                  `radial-gradient(circle at 25% 35%, ${primaryColor}25 0%, transparent 50%), radial-gradient(circle at 75% 65%, ${secondaryColor}25 0%, transparent 50%), ${bgGradient}`,
                  `radial-gradient(circle at 20% 30%, ${primaryColor}20 0%, transparent 50%), radial-gradient(circle at 80% 70%, ${secondaryColor}20 0%, transparent 50%), ${bgGradient}`
                ]
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="absolute inset-0 opacity-[0.02]" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
              }} />
              {/* Animated gradient orbs with persona colors - More visible */}
              <motion.div 
                className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-3xl"
                style={{ 
                  background: `radial-gradient(circle, ${primaryColor}40 0%, ${primaryColor}20 40%, transparent 70%)`
                }}
                animate={{ 
                  opacity: [0.3, 0.5, 0.3],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div 
                className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] rounded-full blur-3xl"
                style={{ 
                  background: `radial-gradient(circle, ${secondaryColor}40 0%, ${secondaryColor}20 40%, transparent 70%)`
                }}
                animate={{ 
                  opacity: [0.3, 0.5, 0.3],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              />
              <motion.div 
                className="absolute top-1/2 right-1/3 w-[400px] h-[400px] rounded-full blur-3xl"
                style={{ 
                  background: `radial-gradient(circle, ${primaryColor}35 0%, ${primaryColor}18 40%, transparent 70%)`
                }}
                animate={{ 
                  opacity: [0.25, 0.4, 0.25],
                  scale: [1, 1.15, 1]
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              />
            </motion.div>

            <MenuBar 
              currentTime={currentTime}
              formatTime={formatTime}
              formatDate={formatDate}
              appleMenuOpen={appleMenuOpen}
              setAppleMenuOpen={setAppleMenuOpen}
              activeMenu={activeMenu}
              setActiveMenu={setActiveMenu}
              controlCenterOpen={controlCenterOpen}
              setControlCenterOpen={setControlCenterOpen}
              setSpotlightOpen={setSpotlightOpen}
              siriActive={siriActive}
              setSiriActive={setSiriActive}
              personaColors={personaColors}
              isDark={isDark}
            />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="absolute inset-0 pt-8 pb-24 px-8 pointer-events-none"
            >
              {desktopItems.map((item, index) => (
                <div key={item.id} className="pointer-events-auto">
                  <DesktopIcon
                    item={item}
                    isSelected={selectedItems.includes(item.id)}
                    onClick={(e: React.MouseEvent) => handleDesktopItemClick(item.id, e)}
                    onContextMenu={(e: React.MouseEvent) => handleContextMenu(e, item.id)}
                    index={index}
                  />
                </div>
              ))}
            </motion.div>

            {/* Glow Orb in Center - Performance Optimized and Above Desktop Items */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, delay: 0.3 }}
              className="fixed ml-[600px] mt-[300px] z-[60]"
            >
              <div className="transform-gpu">
                <GlowOrb
                  setInput={() => {}}
                  onToggleCarousel={() => setShowCarousel(true)}
                  size="large"
                  className="drop-shadow-2xl"
                />
              </div>
            </motion.div>

            {windows.filter(w => !w.isMinimized).map(window => (
              <Window
                key={window.id}
                window={window}
                onClose={() => closeWindow(window.id)}
                onMinimize={() => minimizeWindow(window.id)}
                onFocus={() => bringToFront(window.id)}
              />
            ))}

            {contextMenu && (
              <ContextMenu
                position={{ x: contextMenu.x, y: contextMenu.y }}
                itemId={contextMenu.itemId}
                onClose={() => setContextMenu(null)}
              />
            )}

            <AnimatePresence>
              {spotlightOpen && <SpotlightSearch onClose={() => setSpotlightOpen(false)} />}
            </AnimatePresence>

            <AnimatePresence>
              {controlCenterOpen && (
                <ControlCenter 
                  onClose={() => setControlCenterOpen(false)} 
                  isDark={isDark}
                  setTheme={setTheme}
                />
              )}
            </AnimatePresence>

            {finderOpen && (
              <FileModal
                isOpen={finderOpen}
                onClose={() => setFinderOpen(false)}
                onSelect={(path) => {
                  console.log('Selected path:', path)
                  setFinderOpen(false)
                }}
                mode="directory"
                title="Finder"
                initialPath={finderInitialPath}
              />
            )}

            {/* GPT Carousel */}
            <AnimatePresence>
              {showCarousel && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[400]"
                    onClick={() => setShowCarousel(false)}
                  />
                  <div className="fixed inset-0 z-[500] flex items-center justify-center pointer-events-none">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="relative w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-visible shadow-2xl pointer-events-auto"
                    >
                      <GPTCarousel
                        theme={isDark ? "dark" : "light"}
                        onSelect={(persona) => {
                          setShowCarousel(false)
                          console.log("Persona selected:", persona)
                          // Persona context will automatically update the colors
                        }}
                      />
                    </motion.div>
                  </div>
                </>
              )}
            </AnimatePresence>

            {/* Glass Filter for liquid glass effects */}
            <GlassFilter />

            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50"
            >
              <GlassDock icons={dockIcons} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const MenuBar = ({ currentTime, formatTime, formatDate, appleMenuOpen, setAppleMenuOpen, activeMenu, setActiveMenu, controlCenterOpen, setControlCenterOpen, setSpotlightOpen, siriActive, setSiriActive, personaColors, isDark }: any) => {
  const menuItems = ['File', 'Edit', 'View', 'Window', 'Help']
  const primaryColor = personaColors?.[0] || '#3b82f6'
  const secondaryColor = personaColors?.[1] || personaColors?.[0] || '#8b5cf6'
  
  const menuBg = isDark ? 'bg-black/30' : 'bg-white/70'
  const menuBorder = isDark ? 'border-white/10' : 'border-gray-200/50'
  const menuText = isDark ? 'text-white/90' : 'text-gray-800'
  const menuTextSecondary = isDark ? 'text-white/70' : 'text-gray-600'
  const menuHover = isDark ? 'hover:bg-white/10' : 'hover:bg-gray-200/50'
  
  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className={`absolute top-10 left-0 right-0 h-7 backdrop-blur-xl ${menuBg} border-b ${menuBorder} z-[200] transition-colors duration-300`}
    >
      <div className="h-full px-3 flex items-center justify-between text-xs font-medium">
        <div className="flex items-center gap-5">
          <div 
            className={`cursor-pointer ${menuHover} px-2 py-1 rounded relative`}
            onClick={(e) => {
              e.stopPropagation()
              setAppleMenuOpen(!appleMenuOpen)
              setActiveMenu(null)
            }}
          >
            <img src="/glow-logo.png" alt="Glow" className="w-4 h-4 opacity-90" />
            {appleMenuOpen && <AppleMenu isDark={isDark} />}
          </div>
          <span className={`${menuText} font-semibold`}>GlowOS</span>
          {menuItems.map(item => (
            <div
              key={item}
              className={`${menuTextSecondary} hover:${menuText} ${menuHover} cursor-pointer transition-colors px-2 py-1 rounded relative`}
              onClick={(e) => {
                e.stopPropagation()
                setActiveMenu(activeMenu === item ? null : item)
                setAppleMenuOpen(false)
              }}
            >
              {item}
              {activeMenu === item && <DropdownMenu items={getMenuItems(item)} isDark={isDark} />}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div 
            className={`${menuHover} p-1 rounded-full cursor-pointer transition-all relative group`}
            onClick={(e) => {
              e.stopPropagation()
              setSiriActive(!siriActive)
            }}
          >
            <div 
              className={`absolute inset-0 rounded-full transition-all duration-300 ${
                siriActive ? 'animate-pulse' : ''
              }`}
              style={siriActive ? {
                background: `linear-gradient(to right, ${primaryColor}80, ${secondaryColor}80, ${primaryColor}80)`
              } : { background: 'transparent' }}
            />
            <Mic className={`w-4 h-4 relative z-10 transition-colors duration-300 ${
              siriActive 
                ? isDark ? 'text-white' : 'text-gray-900'
                : `${menuTextSecondary} group-hover:${menuText}`
            }`} />
          </div>
          <Battery className={`w-4 h-4 ${menuTextSecondary} hover:${menuText} cursor-pointer transition-colors`} />
          <Wifi className={`w-4 h-4 ${menuTextSecondary} hover:${menuText} cursor-pointer transition-colors`} />
          <Volume2 className={`w-4 h-4 ${menuTextSecondary} hover:${menuText} cursor-pointer transition-colors`} />
          <Search 
            className={`w-4 h-4 ${menuTextSecondary} hover:${menuText} cursor-pointer transition-colors`}
            onClick={(e) => {
              e.stopPropagation()
              setSpotlightOpen(true)
            }}
          />
          <div 
            className={`${menuHover} p-1 rounded cursor-pointer relative`}
            onClick={(e) => {
              e.stopPropagation()
              setControlCenterOpen(!controlCenterOpen)
            }}
          >
            <Settings className={`w-4 h-4 ${menuTextSecondary} hover:${menuText} transition-colors`} />
          </div>
          <div className={`${menuTextSecondary} text-xs flex items-center gap-2 ${menuHover} px-2 py-1 rounded cursor-pointer transition-colors`}>
            <span>{formatDate(currentTime)}</span>
            <span>{formatTime(currentTime)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

const AppleMenu = ({ isDark }: { isDark: boolean }) => {
  const items = [
    { label: 'About GlowOS', icon: null },
    { divider: true },
    { label: 'System Preferences...', icon: <Settings className="w-3 h-3" /> },
    { divider: true },
    { label: 'Sleep', icon: <Moon className="w-3 h-3" /> },
    { label: 'Restart...', icon: <RefreshCw className="w-3 h-3" /> },
    { label: 'Shut Down...', icon: <Power className="w-3 h-3" /> },
  ]

  const menuBg = isDark ? 'bg-black/80' : 'bg-white/95'
  const menuBorder = isDark ? 'border-white/20' : 'border-gray-200'
  const menuText = isDark ? 'text-white/90' : 'text-gray-800'
  const menuHover = isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
  const dividerColor = isDark ? 'bg-white/10' : 'bg-gray-200'

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`absolute top-full left-0 mt-1 w-56 backdrop-blur-xl ${menuBg} border ${menuBorder} rounded-lg shadow-2xl overflow-hidden transition-colors duration-300`}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, i) => (
        item.divider ? (
          <div key={i} className={`h-px ${dividerColor} my-1`} />
        ) : (
          <div key={i} className={`px-4 py-2 ${menuHover} cursor-pointer flex items-center gap-3 ${menuText} text-xs transition-colors`}>
            {item.icon}
            <span>{item.label}</span>
          </div>
        )
      ))}
    </motion.div>
  )
}

const DropdownMenu = ({ items, isDark }: { items: string[]; isDark: boolean }) => {
  const menuBg = isDark ? 'bg-black/80' : 'bg-white/95'
  const menuBorder = isDark ? 'border-white/20' : 'border-gray-200'
  const menuText = isDark ? 'text-white/90' : 'text-gray-800'
  const menuHover = isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`absolute top-full left-0 mt-1 w-48 backdrop-blur-xl ${menuBg} border ${menuBorder} rounded-lg shadow-2xl overflow-hidden transition-colors duration-300`}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, i) => (
        <div key={i} className={`px-4 py-2 ${menuHover} cursor-pointer ${menuText} text-xs transition-colors`}>
          {item}
        </div>
      ))}
    </motion.div>
  )
}

const getMenuItems = (menu: string): string[] => {
  const menus: Record<string, string[]> = {
    File: ['New Window', 'New Tab', 'Open...', 'Close Window'],
    Edit: ['Undo', 'Redo', 'Cut', 'Copy', 'Paste', 'Select All'],
    View: ['Show Toolbar', 'Show Sidebar', 'Enter Full Screen'],
    Window: ['Minimize', 'Zoom', 'Bring All to Front'],
    Help: ['GlowOS Help', 'Send Feedback', 'About GlowOS'],
  }
  return menus[menu] || []
}

const DesktopIcon = ({ item, isSelected, onClick, onContextMenu, index }: any) => {
  const getIcon = () => {
    switch (item.icon) {
      case 'folder': return <Folder className="w-12 h-12 text-blue-400" />
      case 'document': return <FileText className="w-12 h-12 text-white/80" />
      case 'image': return <Image className="w-12 h-12 text-green-400" />
      case 'music': return <Music className="w-12 h-12 text-pink-400" />
      default: return <Folder className="w-12 h-12 text-blue-400" />
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="absolute cursor-pointer group"
      style={{ left: item.position.x, top: item.position.y }}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <div className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${isSelected ? 'bg-blue-500/30' : 'hover:bg-white/5'}`}>
        <div className="relative">
          {getIcon()}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 rounded" />
        </div>
        <span className="text-xs text-white/90 text-center max-w-[80px] truncate px-2 py-1 rounded bg-black/30 backdrop-blur-sm">
          {item.name}
        </span>
      </div>
    </motion.div>
  )
}

const Window = ({ window, onClose, onMinimize, onFocus }: any) => {
  const [position, setPosition] = useState(window.position)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.window-controls')) return
    setIsDragging(true)
    setDragOffset({ x: e.clientX - position.x, y: e.clientY - position.y })
    onFocus()
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({ x: e.clientX - dragOffset.x, y: Math.max(28, e.clientY - dragOffset.y) })
      }
    }
    const handleMouseUp = () => setIsDragging(false)

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset])

  const renderContent = () => {
    const contentClass = "h-full w-full overflow-auto"
    
    switch (window.contentType) {
      case 'chat':
        return <div className={contentClass}><FullChatApp /></div>
      case 'personas':
        return <div className={contentClass}><Personas /></div>
      case 'memories':
        return <div className={contentClass}><Memories /></div>
      case 'knowledge-base':
        return <div className={contentClass}><KnowledgeBase /></div>
      case 'glow-cloud':
        return <div className={contentClass}><GlowCloud /></div>
      default:
        return (
          <div className="text-center py-12">
            <h3 className="text-2xl font-light text-white/80 mb-2">{window.title}</h3>
            <p className="text-white/50">Content not available</p>
          </div>
        )
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute rounded-xl overflow-hidden shadow-2xl backdrop-blur-xl bg-slate-900/95 border border-white/10"
      style={{ left: position.x, top: position.y, width: window.size.width, height: window.size.height, zIndex: window.zIndex }}
      onMouseDown={onFocus}
    >
      <div className="h-10 backdrop-blur-xl bg-white/5 border-b border-white/10 flex items-center justify-between px-4 cursor-move" onMouseDown={handleMouseDown}>
        <div className="flex items-center gap-2 window-controls">
          <button onClick={onClose} className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors" />
          <button onClick={onMinimize} className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors" />
          <button className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors" />
        </div>
        <div className="flex items-center gap-2">
          {window.icon && <img src={window.icon} className="w-4 h-4" alt="" />}
          <span className="text-xs text-white/90 font-medium">{window.title}</span>
        </div>
        <div className="w-20" />
      </div>
      <div className="h-[calc(100%-2.5rem)] overflow-hidden">
        {renderContent()}
      </div>
    </motion.div>
  )
}

const ContextMenu = ({ position, itemId, onClose }: any) => {
  const items = itemId ? ['Open', 'Get Info', 'Rename', 'Duplicate', 'Delete'] : ['New Folder', 'Get Info', 'Change Desktop Background']

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed backdrop-blur-xl bg-black/80 border border-white/20 rounded-lg shadow-2xl overflow-hidden z-[300]"
      style={{ left: position.x, top: position.y }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, i) => (
        <div key={i} className="px-4 py-2 hover:bg-white/10 cursor-pointer text-white/90 text-xs whitespace-nowrap" onClick={() => { console.log(`Action: ${item}`); onClose() }}>
          {item}
        </div>
      ))}
    </motion.div>
  )
}

const SpotlightSearch = ({ onClose }: any) => {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[500] flex items-start justify-center pt-32"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="w-full max-w-2xl backdrop-blur-xl bg-black/80 border border-white/20 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 p-4">
          <Search className="w-5 h-5 text-white/50" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Spotlight Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-white text-lg placeholder:text-white/40"
          />
        </div>
        {query && (
          <div className="border-t border-white/10 p-2">
            <div className="px-4 py-3 hover:bg-white/10 rounded cursor-pointer">
              <div className="text-white/90 text-sm">No results found</div>
              <div className="text-white/50 text-xs mt-1">Try a different search term</div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

const ControlCenter = ({ onClose: _onClose, isDark, setTheme }: any) => {
  const [wifiEnabled, setWifiEnabled] = useState(true)
  const [bluetoothEnabled, setBluetoothEnabled] = useState(true)
  const [brightness, setBrightness] = useState(75)
  const [volume, setVolume] = useState(50)

  const handleThemeToggle = () => {
    const newTheme = isDark ? 'light' : 'dark'
    setTheme(newTheme)
  }

  const ccBg = isDark ? 'bg-black/80' : 'bg-white/95'
  const ccBorder = isDark ? 'border-white/20' : 'border-gray-200'
  const ccTextSecondary = isDark ? 'text-white/70' : 'text-gray-600'

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`fixed top-8 right-3 w-80 backdrop-blur-xl ${ccBg} border ${ccBorder} rounded-2xl shadow-2xl overflow-hidden z-[250] transition-colors duration-300`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-4 space-y-4">
        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-3">
          <ToggleCard
            icon={<Wifi className="w-5 h-5" />}
            label="Wi-Fi"
            sublabel="Home Network"
            enabled={wifiEnabled}
            onClick={() => setWifiEnabled(!wifiEnabled)}
            isDark={isDark}
          />
          <ToggleCard
            icon={<Bell className="w-5 h-5" />}
            label="Bluetooth"
            sublabel="On"
            enabled={bluetoothEnabled}
            onClick={() => setBluetoothEnabled(!bluetoothEnabled)}
            isDark={isDark}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ToggleCard
            icon={isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            label={isDark ? "Dark Mode" : "Light Mode"}
            sublabel={isDark ? "On" : "Off"}
            enabled={isDark}
            onClick={handleThemeToggle}
            isDark={isDark}
          />
          <ToggleCard
            icon={<Power className="w-5 h-5" />}
            label="Do Not Disturb"
            sublabel="Off"
            enabled={false}
            onClick={() => {}}
            isDark={isDark}
          />
        </div>

        {/* Brightness Slider */}
        <div className="space-y-2">
          <div className={`flex items-center justify-between text-xs ${ccTextSecondary}`}>
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4" />
              <span>Brightness</span>
            </div>
            <span>{brightness}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={brightness}
            onChange={(e) => setBrightness(Number(e.target.value))}
            className={`w-full h-2 ${isDark ? 'bg-white/10' : 'bg-gray-300'} rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
              [&::-webkit-slider-thumb]:rounded-full ${isDark ? '[&::-webkit-slider-thumb]:bg-white' : '[&::-webkit-slider-thumb]:bg-blue-500'} [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:shadow-lg ${isDark ? 'hover:[&::-webkit-slider-thumb]:bg-white/90' : 'hover:[&::-webkit-slider-thumb]:bg-blue-600'}`}
          />
        </div>

        {/* Volume Slider */}
        <div className="space-y-2">
          <div className={`flex items-center justify-between text-xs ${ccTextSecondary}`}>
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              <span>Volume</span>
            </div>
            <span>{volume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className={`w-full h-2 ${isDark ? 'bg-white/10' : 'bg-gray-300'} rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
              [&::-webkit-slider-thumb]:rounded-full ${isDark ? '[&::-webkit-slider-thumb]:bg-white' : '[&::-webkit-slider-thumb]:bg-blue-500'} [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:shadow-lg ${isDark ? 'hover:[&::-webkit-slider-thumb]:bg-white/90' : 'hover:[&::-webkit-slider-thumb]:bg-blue-600'}`}
          />
        </div>
      </div>
    </motion.div>
  )
}

const ToggleCard = ({ icon, label, sublabel, enabled, onClick, isDark }: any) => {
  const cardBg = isDark
    ? (enabled ? 'bg-blue-500/30 border-blue-400/30' : 'bg-white/5 border-white/10 hover:bg-white/10')
    : (enabled ? 'bg-blue-500/20 border-blue-400/50' : 'bg-gray-100 border-gray-200 hover:bg-gray-200')
  
  const iconColor = isDark
    ? (enabled ? 'text-blue-300' : 'text-white/70')
    : (enabled ? 'text-blue-600' : 'text-gray-600')
  
  const labelColor = isDark ? 'text-white/90' : 'text-gray-800'
  const sublabelColor = isDark ? 'text-white/50' : 'text-gray-500'

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl cursor-pointer transition-all border ${cardBg}`}
    >
      <div className={`mb-2 ${iconColor}`}>
        {icon}
      </div>
      <div className="text-xs">
        <div className={`${labelColor} font-medium`}>{label}</div>
        <div className={`${sublabelColor} text-[10px] mt-0.5`}>{sublabel}</div>
      </div>
    </div>
  )
}

export default GlowOS