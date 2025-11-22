import { useEffect, useState } from 'react';

export const useSidebarOffset = (sidebarOpen: boolean, sidebarRef: React.RefObject<HTMLDivElement | null>) => {
  const [sidebarOffset, setSidebarOffset] = useState(0);

  useEffect(() => {
    // Sidebar offset update
    const updateSidebarOffset = () => {
      setSidebarOffset(
        sidebarOpen && sidebarRef.current ? sidebarRef.current.offsetWidth : 0
      );
    };
    updateSidebarOffset();
    window.addEventListener("resize", updateSidebarOffset);
    return () => window.removeEventListener("resize", updateSidebarOffset);
  }, [sidebarOpen]);

  return sidebarOffset;
};