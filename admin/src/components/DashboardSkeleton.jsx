import React from "react";

const DashboardSkeleton = () => {
  return (
    <div className="min-h-screen flex bg-[#0f172a]">
      {/* Sidebar Skeleton */}
      <div className="w-64 bg-[#111827] p-4 hidden md:block">
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="h-10 rounded-md animate-pulse bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700"
            ></div>
          ))}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 p-4 space-y-4">
        {/* Header Skeleton */}
        <div className="h-12 w-full rounded-md animate-pulse bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700"></div>

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-lg animate-pulse bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700"
            ></div>
          ))}
        </div>

        {/* Table/List Skeleton */}
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-12 rounded-md animate-pulse bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700"
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
