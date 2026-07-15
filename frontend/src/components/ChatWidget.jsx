import React, { useState, useEffect, useRef } from "react";
import { Sparkles, X } from "lucide-react";
const defaultProps = {
  title: "IT Help Desk",
  subtitle: "Online",

  width: 380,
  height: 500,

  bottom: 24,
  right: 24,

  primaryColor: "#4F46E5",
  secondaryColor: "#7C3AED",
  dangerColor: "#F43F5E",
  userBubbleColor: "#4F46E5",
  botBubbleColor: "#FFFFFF",

  userTextColor: "#FFFFFF",
  botTextColor: "#1F2937",

  borderRadius: 24,
  subtitleColor: "#E0E7FF",
  zIndex: 999999,

  logo: "🏫",
  onlineColor: "#22C55E",
  placeholder: "Ask a question...",
  backendUrl: "http://localhost:8000",
  welcomeText: "Welcome to IT department help desk. How may I help you?",
};
const ChatWidget = ({
  backendUrl = defaultProps.backendUrl,
  welcomeText = defaultProps.welcomeText,
  title = defaultProps.title,
  subtitle = defaultProps.subtitle,

  width = defaultProps.width,
  height = defaultProps.height,

  bottom = defaultProps.bottom,
  right = defaultProps.right,

  primaryColor = defaultProps.primaryColor,
  secondaryColor = defaultProps.secondaryColor,
  dangerColor = defaultProps.dangerColor,
  userBubbleColor = defaultProps.userBubbleColor,
  botBubbleColor = defaultProps.botBubbleColor,
  onlineColor = defaultProps.onlineColor,
  subtitleColor = defaultProps.subtitleColor,
  userTextColor = defaultProps.userTextColor,
  botTextColor = defaultProps.botTextColor,

  borderRadius = defaultProps.borderRadius,

  zIndex = defaultProps.zIndex,

  logo = defaultProps.logo,

  placeholder = defaultProps.placeholder,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // --- Text to Speech (TTS) ---
  const speak = (text) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // --- Speech to Text (STT) Setup ---
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.lang = "en-US";
      rec.interimResults = false;

      rec.onstart = () => {
        setIsListening(true);
        stopSpeaking();
      };

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };

      rec.onerror = (e) => {
        console.error("Speech recognition error", e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert(
        "Speech recognition is not supported in this browser. Try Chrome or Edge!",
      );
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // --- Toggle Chat Window ---
  const handleToggle = () => {
    if (!isOpen) {
      setIsOpen(true);
      if (messages.length === 0) {
        setMessages([{ sender: "bot", text: welcomeText }]);
        setTimeout(() => speak(welcomeText), 500);
      }
    } else {
      setIsOpen(false);
      stopSpeaking();
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // --- Send Message ---
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setInput("");
    setIsLoading(true);
    stopSpeaking();

    try {
      const response = await fetch(`${backendUrl}/api/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: userMessage }),
      });

      if (response.ok) {
        const data = await response.json();
        const botResponse =
          data.response ||
          data?.data?.answer ||
          "Sorry, I couldn't understand that.";
        setMessages((prev) => [...prev, { sender: "bot", text: botResponse }]);
        speak(botResponse);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: "Error connecting to backend server." },
        ]);
      }
    } catch (error) {
      console.error("API Connection Error:", error);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Server is offline. Please try again later." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed font-sans"
      style={{
        bottom,
        right,
        zIndex,
      }}
    >
      {/* TRIGGER BUTTON (Pulsing when speaking) */}
      <button
        onClick={handleToggle}
        className={`text-white rounded-full p-4 shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 relative hover:brightness-90 cursor-pointer

hover:-translate-y-1
`}
        style={{
    backgroundColor: isOpen ? dangerColor : primaryColor,
    boxShadow:
        "0 12px 35px rgba(79,70,229,.45)",
}}
      >
        {isSpeaking && !isOpen && (
          <span
            className="absolute -inset-1 rounded-full  animate-ping opacity-40"
            style={{
              backgroundColor: primaryColor,
            }}
          ></span>
        )}
        {isOpen ? (
          <X size={26} strokeWidth={2.5} />
        ) : (
          <Sparkles
  size={26}
  strokeWidth={2.5}
  className={`${!isOpen ? "" : ""}`}
/>
        )}
      </button>

      {/* POPUP CHAT WINDOW */}
      {isOpen && (
        <div
          className="absolute bottom-18 right-0 bg-white shadow-2xl border border-gray-100 flex flex-col overflow-hidden transition-all duration-300 ease-out"
          style={{
            width,
            height,
            borderRadius,
          }}
        >
          {/* Header */}
          <div
            className=" p-4 text-white flex justify-between items-center shadow-md"
            style={{
              background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
            }}
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center font-bold text-lg border border-white/20">
                  {logo}
                </div>
                <span
                  className="absolute bottom-0 right-0 w-3 h-3  border-2 border-white rounded-full"
                  style={{
                    backgroundColor: onlineColor,
                  }}
                ></span>
              </div>
              <div>
                <h3 className="font-bold text-base tracking-wide">{title}</h3>
                <p
                  className="text-xs  flex items-center gap-1"
                  style={{
                    color: subtitleColor,
                  }}
                >
                  {subtitle}
                  {isSpeaking && (
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse">
                      🔊
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              {isSpeaking ? (
                <button
                  onClick={stopSpeaking}
                  className="p-2 hover:bg-white/10 rounded-full transition"
                  title="Stop speaking"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-rose-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                    />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={() =>
                    speak(messages[messages.length - 1]?.text || welcomeText)
                  }
                  className="p-2 hover:bg-white/10 rounded-full transition text-indigo-200 hover:text-white"
                  title="Speak last response"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm transition-all duration-200 ${
                    msg.sender === "user"
                      ? "rounded-tr-none font-medium"
                      : "border border-slate-100 rounded-tl-none"
                  }`}
                  style={
                    msg.sender === "user"
                      ? {
                          backgroundColor: userBubbleColor,
                          color: userTextColor,
                        }
                      : {
                          backgroundColor: botBubbleColor,
                          color: botTextColor,
                        }
                  }
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm text-sm text-gray-400 flex space-x-1.5 items-center">
                  <span
                    className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></span>
                  <span
                    className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></span>
                  <span
                    className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Panel with Voice Microphone */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-slate-100 bg-white flex items-center space-x-2"
          >
            <div className="relative flex-1 flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "Listening..." : placeholder}
                className={`w-full border rounded-full pl-4 pr-11 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition ${
                  isListening
                    ? "border-rose-400 bg-rose-50/20 placeholder-rose-400"
                    : "border-slate-200"
                }`}
                disabled={isLoading}
              />

              {/* Voice Mic Button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`absolute right-2 p-1.5 rounded-full transition-all duration-200 ${
                  isListening
                    ? "bg-rose-500 text-white animate-pulse"
                    : "text-slate-400 hover:text-indigo-600 hover:bg-slate-50"
                }`}
                title={isListening ? "Stop listening" : "Speak to write"}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </button>
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className=" text-white rounded-full p-2.5 disabled:opacity-40 transition shadow-md active:scale-95"
              style={{
                backgroundColor: primaryColor,
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 transform rotate-90"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
