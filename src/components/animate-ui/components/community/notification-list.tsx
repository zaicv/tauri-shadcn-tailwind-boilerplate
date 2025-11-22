'use client';

import * as React from 'react';
import { RotateCcw, ArrowUpRight } from 'lucide-react';
import { motion, type Transition } from 'motion/react';

export interface NotificationItem {
  id: string | number;
  title: string;
  subtitle: string;
  time: string;
  count?: number;
  onClick?: () => void;
}

interface NotificationListProps {
  notifications?: NotificationItem[];
  onViewAll?: () => void;
  className?: string;
}

const transition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 26,
};

const getCardVariants = (i: number) => ({
  collapsed: {
    marginTop: i === 0 ? 0 : -44,
    scaleX: 1 - i * 0.05,
  },
  expanded: {
    marginTop: i === 0 ? 0 : 4,
    scaleX: 1,
  },
});

const textSwitchTransition: Transition = {
  duration: 0.22,
  ease: 'easeInOut',
};

const notificationTextVariants = {
  collapsed: { opacity: 1, y: 0, pointerEvents: 'auto' },
  expanded: { opacity: 0, y: -16, pointerEvents: 'none' },
};

const viewAllTextVariants = {
  collapsed: { opacity: 0, y: 16, pointerEvents: 'none' },
  expanded: { opacity: 1, y: 0, pointerEvents: 'auto' },
};

function NotificationList({ notifications = [], onViewAll, className }: NotificationListProps) {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <motion.div
      className={`bg-neutral-200 dark:bg-neutral-900 p-2.5 rounded-3xl w-64 space-y-2.5 shadow-md ${className || ''}`}
      initial="collapsed"
      whileHover="expanded"
    >
      <div>
        {notifications.slice(0, 3).map((notification, i) => (
          <motion.div
            key={notification.id}
            className="bg-neutral-100 dark:bg-neutral-800 rounded-xl px-3 py-2 shadow-sm hover:shadow-lg transition-shadow duration-200 relative cursor-pointer overflow-hidden"
            variants={getCardVariants(i)}
            transition={transition}
            style={{
              zIndex: notifications.length - i,
            }}
            onClick={notification.onClick}
          >
            <div className="flex justify-between items-start gap-2 mb-1">
              <h1 className="text-xs font-medium leading-tight flex-1 min-w-0 truncate text-neutral-900 dark:text-neutral-100">
                {notification.title}
              </h1>
              {notification.count && (
                <div className="flex items-center text-[10px] gap-0.5 font-medium text-neutral-500 dark:text-neutral-300 flex-shrink-0">
                  <RotateCcw className="size-2.5" />
                  <span>{notification.count}</span>
                </div>
              )}
            </div>
            <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium leading-tight line-clamp-2">
              <span className="whitespace-nowrap">{notification.time}</span>
              <span className="mx-1">•</span>
              <span className="truncate">{notification.subtitle}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <div className="size-4 rounded-full bg-neutral-400 text-white text-[10px] flex items-center justify-center font-medium flex-shrink-0">
          {notifications.length}
        </div>
        <span className="grid min-w-0 flex-1">
          <motion.span
            className="text-xs font-medium text-neutral-600 dark:text-neutral-300 row-start-1 col-start-1 truncate"
            variants={notificationTextVariants}
            transition={textSwitchTransition}
          >
            Notifications
          </motion.span>
          <motion.span
            className="text-xs font-medium text-neutral-600 dark:text-neutral-300 flex items-center gap-1 cursor-pointer select-none row-start-1 col-start-1 truncate"
            variants={viewAllTextVariants}
            transition={textSwitchTransition}
            onClick={onViewAll}
          >
            View all <ArrowUpRight className="size-3 flex-shrink-0" />
          </motion.span>
        </span>
      </div>
    </motion.div>
  );
}

export { NotificationList };
