import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Database,
  SidebarClose,
  SidebarOpen,
} from "lucide-react";
import { toast } from "react-toastify";
import { FaRobot } from "react-icons/fa";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Sidebar Navigation Tabs — paths now match actual app routes
  const navigationTabs = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/",
    },
    {
      name: "Data Management",
      icon: Database,
      path: "/upload-document",
    },
  ];

  // ================= ACTIVE TAB CHECKER =================
  const isTabActive = (tabPath) => {
    // Exact match for root/dashboard path
    if (tabPath === "/") {
      return location.pathname === "/";
    }

    // startsWith works fine for non-root paths (handles nested routes too)
    return location.pathname.startsWith(tabPath);
  };

  return (
    <aside
      className={`
        ${isSidebarCollapsed ? "w-[60px]" : "w-64"}
          min-h-screen bg-[#0f172a] border-r border-gray-800 flex flex-col
          transition-all duration-500 overflow-x-hidden
      `}
    >
      {/* APP LOGO AND APP NAME */}
      {/* ================= STICKY HEADER ================= */}
      {/* CHANGE: Added sticky positioning so logo section does not scroll */}
      <div
        onClick={() => navigate("/")}
        className={`sticky top-0 z-20 bg-[#0f172a] flex items-center gap-3 cursor-pointer select-none border-b-2 border-gray-800 ${
          isSidebarCollapsed ? "justify-center px-2 py-3" : "justify-start p-3"
        }`}
      >
        {/* APP LOGO */}
        <FaRobot
          size={40}
          className="bg-indigo-600 text-white rounded-lg p-2 hover:bg-indigo-600/50 hover:text-gray-200 transition duration-150"
        />
        {/* APP NAME */}
        {!isSidebarCollapsed ? (
          <div className="flex flex-col items-center">
            <h1 className="text-white text-lg font-semibold">
              Virtual <span className="text-indigo-500">HELPDESK</span>
            </h1>
            <p className="text-gray-300 text-[10px] text-center">
              ADMIN DASHBOARD
            </p>
          </div>
        ) : (
          ""
        )}
      </div>

      {/* Scrollable Section */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {/* Navigation Title */}
        {isSidebarCollapsed ? (
          <div className="flex items-center justify-between">
            <SidebarOpen
              size={22}
              className={`text-gray-400 ${isSidebarCollapsed ? "mb-2" : "mb-4"} ml-1.5 cursor-pointer hover:text-white transition`}
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <h2 className="text-xs text-gray-400 uppercase mb-4 tracking-wide">
              Navigation
            </h2>
            <SidebarClose
              size={22}
              className="text-gray-400 mb-4 cursor-pointer hover:text-white transition"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />
          </div>
        )}

        {isSidebarCollapsed ? (
          <div
            className={"mt-2 mb-4 border-t border-gray-700 transition-all mx-2"}
          />
        ) : (
          ""
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-col gap-2">
          {navigationTabs.map((tab, index) => {
            // CHANGE:
            // Use custom function for nested route active state
            const isActive = isTabActive(tab.path);

            return (
              <div
                key={index}
                onClick={() => navigate(tab.path)}
                className={`flex items-center gap-4 px-2 py-2 rounded-lg cursor-pointer transition-all
                  ${
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "text-gray-400 hover:bg-indigo-600/50 hover:text-white"
                  }
                `}
              >
                <tab.icon size={18} />
                <span
                  className={`${isSidebarCollapsed ? "hidden" : "block"} text-sm font-medium`}
                >
                  {tab.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
