import React from "react";
import ReactDOM from "react-dom/client";
import ChatWidget from "./components/ChatWidget";
import "./index.css";

// Auto initialize widget
(function () {
  const config = window.ITHelpDeskConfig || {};


  const containerId = config.containerId || "it-helpdesk-widget";

  let container = document.getElementById(containerId);


  if (!container) {
    container = document.createElement("div");
    container.id = containerId;
    document.body.appendChild(container);
  }

  const root = ReactDOM.createRoot(container);

  root.render(
    <React.StrictMode>
      <ChatWidget {...config} />
    </React.StrictMode>
  );
})();