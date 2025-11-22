"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Play, XIcon, ExternalLink, Video } from "lucide-react";

import { cn } from "@/lib/utils";

type AnimationStyle =
  | "from-bottom"
  | "from-center"
  | "from-top"
  | "from-left"
  | "from-right"
  | "fade"
  | "top-in-bottom-out"
  | "left-in-right-out";

interface HeroVideoProps {
  animationStyle?: AnimationStyle;
  videoSrc: string;
  thumbnailSrc: string;
  thumbnailAlt?: string;
  className?: string;
}

const animationVariants = {
  "from-bottom": {
    initial: { y: "100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "100%", opacity: 0 },
  },
  "from-center": {
    initial: { scale: 0.5, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.5, opacity: 0 },
  },
  "from-top": {
    initial: { y: "-100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "-100%", opacity: 0 },
  },
  "from-left": {
    initial: { x: "-100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "-100%", opacity: 0 },
  },
  "from-right": {
    initial: { x: "100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "100%", opacity: 0 },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  "top-in-bottom-out": {
    initial: { y: "-100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "100%", opacity: 0 },
  },
  "left-in-right-out": {
    initial: { x: "-100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "100%", opacity: 0 },
  },
};

export default function HeroVideoDialog({
  animationStyle = "from-center",
  videoSrc,
  thumbnailSrc,
  thumbnailAlt = "Video thumbnail",
  className,
}: HeroVideoProps) {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [playMode, setPlayMode] = useState<"preview" | "direct" | "plex">(
    "preview"
  );
  const selectedAnimation = animationVariants[animationStyle];

  const handleDirectPlay = () => {
    setPlayMode("direct");
  };

  const handleOpenInPlex = () => {
    // Open in Plex web interface
    window.open(videoSrc, "_blank");
    // Close the dialog since we're opening externally
    setIsVideoOpen(false);
    resetToPreview();
  };

  const resetToPreview = () => {
    setPlayMode("preview");
  };

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        aria-label="Play video"
        className="group relative cursor-pointer border-0 bg-transparent p-0"
        onClick={() => setIsVideoOpen(true)}
      >
        <img
          src={thumbnailSrc}
          alt={thumbnailAlt}
          width={1920}
          height={1080}
          className="w-full rounded-md border shadow-lg transition-all duration-200 ease-out group-hover:brightness-[0.8]"
        />
        <div className="absolute inset-0 flex scale-[0.9] items-center justify-center rounded-2xl transition-all duration-200 ease-out group-hover:scale-100">
          <div className="flex size-28 items-center justify-center rounded-full bg-primary/10 backdrop-blur-md">
            <div
              className={`relative flex size-20 scale-100 items-center justify-center rounded-full bg-gradient-to-b from-primary/30 to-primary shadow-md transition-all duration-200 ease-out group-hover:scale-[1.2]`}
            >
              <Play
                className="size-8 scale-100 fill-white text-white transition-transform duration-200 ease-out group-hover:scale-105"
                style={{
                  filter:
                    "drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06))",
                }}
              />
            </div>
          </div>
        </div>
      </button>

      <AnimatePresence>
        {isVideoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setIsVideoOpen(false);
                resetToPreview();
              }
            }}
            onClick={() => setIsVideoOpen(false)}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md"
          >
            <motion.div
              {...selectedAnimation}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative mx-4 aspect-video w-full max-w-4xl md:mx-0"
            >
              <motion.button
                className="absolute -top-16 right-0 rounded-full bg-neutral-900/50 p-2 text-xl text-white ring-1 backdrop-blur-md dark:bg-neutral-100/50 dark:text-black hover:bg-neutral-800/50 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsVideoOpen(false);
                  resetToPreview();
                }}
              >
                <XIcon className="size-5" />
              </motion.button>

              <div className="relative isolate z-[1] size-full overflow-hidden rounded-2xl border-2 border-white">
                {playMode === "preview" && (
                  <div className="bg-gradient-to-br from-blue-600 via-purple-700 to-indigo-800 h-full flex flex-col items-center justify-center text-white p-8 text-center">
                    <div className="mb-6">
                      <Video className="w-16 h-16 mx-auto mb-4 text-blue-200" />
                      <h3 className="text-3xl font-bold mb-2">Ready to Play</h3>
                      <p className="text-blue-100 text-lg">
                        Choose how you'd like to watch
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                      {/* Try direct stream first */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDirectPlay();
                        }}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <Play className="w-5 h-5 inline mr-2" />
                        Play Directly
                      </button>

                      {/* Fallback to Plex web */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenInPlex();
                        }}
                        className="flex-1 bg-gradient-to-r from-white to-gray-100 text-blue-600 px-6 py-4 rounded-xl font-semibold hover:from-gray-100 hover:to-gray-200 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <ExternalLink className="w-5 h-5 inline mr-2" />
                        Open in Plex
                      </button>
                    </div>

                    <p className="text-sm text-blue-200 mt-6 opacity-80">
                      Direct play may not work with all videos due to browser
                      restrictions
                    </p>
                  </div>
                )}

                {playMode === "direct" && (
                  <div className="h-full relative">
                    {/* Try native HTML5 video first */}
                    <video
                      src={videoSrc}
                      controls
                      autoPlay
                      className="size-full rounded-2xl"
                      onError={() => {
                        console.error("Native video failed, trying iframe");
                        // Fallback to iframe
                        setPlayMode("iframe");
                      }}
                    >
                      Your browser does not support the video tag.
                    </video>

                    {/* Back button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        resetToPreview();
                      }}
                      className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm hover:bg-black/70 transition-colors"
                    >
                      ← Back to Options
                    </button>
                  </div>
                )}

                {playMode === "iframe" && (
                  <div className="h-full relative">
                    <iframe
                      src={videoSrc}
                      title="Video Player"
                      className="size-full rounded-2xl"
                      allowFullScreen
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        resetToPreview();
                      }}
                      className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm hover:bg-black/70 transition-colors"
                    >
                      ← Back to Options
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
