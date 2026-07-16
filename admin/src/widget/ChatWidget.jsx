import { useEffect } from "react";

const ITHelpDeskWidget = () => {
  useEffect(() => {
    // 1. Set global config object on window
    window.ITHelpDeskConfig = {
      backendUrl: import.meta.env.VITE_API_URL || "http://localhost:8000",
      title: "IT Help Desk",
      subtitle: "Online",
      primaryColor: "#4F46E5",
      secondaryColor: "#7C3AED",
      width: 500,
      height: 400,
    };

    // Location origin taake paths break na hon
    const baseUrl = window.location.origin;

    // 2. Load custom Widget CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `${baseUrl}/widget/it-helpdesk-widget.css`;
    document.head.appendChild(link);

    // 3. Load custom Widget JS Script
    const script = document.createElement("script");
    script.src = `${baseUrl}/widget/it-helpdesk-widget.js`;
    script.async = true;

    //  Run JS script ONLY after CSS has successfully loaded
    link.onload = () => {
      document.body.appendChild(script);
    };

    // 4. Clean up when component unmounts
    return () => {
      // Check if elements exist before removing to avoid crash
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      
      delete window.ITHelpDeskConfig;

      const existingWidget = document.getElementById("it-helpdesk-widget"); 
      if (existingWidget) {
        existingWidget.remove();
      }
    };
  }, []);

  return null; 
};

export default ITHelpDeskWidget;