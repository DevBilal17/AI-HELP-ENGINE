import { Suspense } from "react";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ProtectedLayout from "./layouts/ProtectedLayout.jsx";
import { dashboardRoutes } from "./config/dashboardRoutes.js";
import DashboardSkeleton from "./components/DashboardSkeleton.jsx";

const App = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<DashboardSkeleton />}>
        <Routes>
          <Route element={<ProtectedLayout />}>
            {dashboardRoutes.map((route, index) => {
              const Component = route.component;
              return (
                <Route
                  key={index}
                  path={`/${route.path}`}
                  element={<Component />}
                />
              );
            })}
          </Route>
        </Routes>
      </Suspense>

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
        style={{ marginTop: "4px" }}
      />
    </BrowserRouter>
  );
};

export default App;
