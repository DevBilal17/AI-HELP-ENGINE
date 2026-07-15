import React from "react";
import { useNavigate } from "react-router-dom";
import { Upload } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="h-full flex items-center justify-center bg-[#0B0F19]">
      <div className="flex flex-col items-center gap-8 text-center px-4">
        {/* Heading */}
        <h1 className="text-white text-4xl font-semibold">
          <span className="inline-block animate-wave origin-[70%_70%]">👋</span>{" "}
          Welcome back to{" "}
          <span className="text-indigo-500">Virtual HelpDesk</span>
        </h1>

        {/* Upload Document Button */}
        <button
          onClick={() => navigate("/upload-document")}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer"
        >
          <Upload size={18} />
          Upload Document
        </button>
      </div>

      {/* Wave animation keyframes */}
      <style>{`
        @keyframes wave {
          0% { transform: rotate(0deg); }
          10% { transform: rotate(14deg); }
          20% { transform: rotate(-8deg); }
          30% { transform: rotate(14deg); }
          40% { transform: rotate(-4deg); }
          50% { transform: rotate(10deg); }
          60% { transform: rotate(0deg); }
          100% { transform: rotate(0deg); }
        }
        .animate-wave {
          animation: wave 2.5s infinite;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
