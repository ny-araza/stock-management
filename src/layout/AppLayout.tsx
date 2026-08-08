import { useEffect, useRef, useState } from "react";
import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const contentRef = useRef<HTMLDivElement>(null);
  const [frozenWidth, setFrozenWidth] = useState<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // on fige la largeur actuelle juste avant que le margin ne commence à bouger
    if (contentRef.current) {
      setFrozenWidth(contentRef.current.getBoundingClientRect().width);
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    // 320ms = un peu plus que duration-300 pour être sûr que la transition CSS est finie
    timeoutRef.current = setTimeout(() => setFrozenWidth(null), 320);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isExpanded, isHovered, isMobileOpen]);

  return (
    <div className="min-h-screen xl:flex">
      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
        } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <AppHeader />
        <div
          ref={contentRef}
          className="mx-auto md:p-6"
          style={
            frozenWidth ? { width: frozenWidth, overflow: "hidden" } : undefined
          }
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;
