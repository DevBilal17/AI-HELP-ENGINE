import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";

const ProtectedLayout = () => {
  return (
    <div className="h-screen flex overflow-hidden overflow-x-hidden">
      {/* ================= SIDEBAR ================= */}
      <div className="h-full overflow-y-auto overflow-x-hidden">
        <Sidebar />
      </div>

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex-1 flex flex-col h-full">
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#0B0F19] border-l border-gray-800 h-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ProtectedLayout;
