import { lazy } from "react";

const Dashboard = lazy(() => import("../pages/Dashboard.jsx"));
const UploadDocument = lazy(() => import("../pages/UploadDocument.jsx"));

export const dashboardRoutes = [
  {
    path: "",
    component: Dashboard,
    label: "Dashboard",
  },
  {
    path: "upload-document",
    component: UploadDocument,
    label: "Upload Document",
  },
];
