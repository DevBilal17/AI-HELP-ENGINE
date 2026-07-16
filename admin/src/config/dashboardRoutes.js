import { lazy } from "react";
const Chroma = lazy(()=> import("../pages/Chroma.jsx"))
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
  {
    path:"chroma-db",
    component : Chroma,
    label : "Data"
  }
];
