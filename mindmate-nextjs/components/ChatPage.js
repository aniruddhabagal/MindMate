// components/ChatPage.js
"use client";
import { useState, useEffect, useRef } from "react";

// Props: currentUser (object), callChatAPI (function from apiClient)
export default function ChatPage({ currentUser, callChatAPI }) {
  const [messages, setMessages] = useState([]); // To store { sender: 'user'/'bot', text: '...' }
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatMessagesEndRef = useRef(null);

  const scrollToBottom = () => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Load initial bot message if messages are empty and user is logged in
  useEffect(() => {
    if (currentUser && messages.length === 0) {
      setMessages([
        {
          sender: "bot",
          text: "Hello! I'm MindMate. How are you feeling today? 😊",
        },
      ]);
    }
    if (!currentUser && messages.length > 0) {
      setMessages([]); // Clear messages if user logs out
    }
  }, [currentUser, messages.length]); // Rerun if currentUser changes or messages array is reset

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentUser) return;
    if (currentUser.credits < 1) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "You've run out of chat credits!" },
      ]);
      return;
    }

    const newUserMessage = { sender: "user", text: inputValue };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      // Send last few messages for context, excluding the current user message just added to UI
      const historyForAPI = messages.slice(-10);
      const response = await callChatAPI(newUserMessage.text, historyForAPI); // callChatAPI from props

      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: "bot", text: response.reply },
      ]);
      // Parent component (app/page.js) should ideally get user update to refresh credits globally
      // For now, this component doesn't directly update global credit count after successful send
    } catch (error) {
      console.error("Chat API error:", error);
      let errorMessage =
        "Sorry, I'm having trouble connecting. Please try again.";
      if (error.status === 403 || error.status === 402) {
        errorMessage = error.data?.message || "You don't have enough credits.";
      }
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: "bot", text: errorMessage },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickResponse = (text) => {
    setInputValue(text);
    // Optionally, you could call handleSendMessage directly after a small delay
    // or let the user press send. For now, just sets input.
  };

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <i className="fas fa-comments text-4xl mb-4"></i>
        <p>Please login to start chatting with MindMate.</p>
      </div>
    );
  }

  return (
    <div id="chat" className="page active">
      {" "}
      {/* 'active' class not needed if this is the only content */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg h-[calc(100vh-12rem)] flex flex-col">
          {/* Chat Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                <i className="fas fa-robot text-white"></i>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  MindMate Assistant
                </h3>
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>{" "}
                  Online
                </p>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div
            id="chatMessages"
            className="flex-1 p-6 overflow-y-auto space-y-4"
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 mb-4 ${
                  msg.sender === "user" ? "justify-end" : ""
                }`}
              >
                {msg.sender === "bot" && (
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-robot text-white text-xs"></i>
                  </div>
                )}
                <div
                  className={`${
                    msg.sender === "user"
                      ? "chat-bubble-user text-white"
                      : "chat-bubble-bot"
                  } p-3 px-4 max-w-md`}
                >
                  <p
                    className={`text-sm ${
                      msg.sender === "user" ? "" : "text-gray-800"
                    }`}
                  >
                    {msg.text}
                  </p>
                </div>
                {msg.sender === "user" && (
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-user text-gray-600 text-xs"></i>
                  </div>
                )}
              </div>
            ))}
            <div ref={chatMessagesEndRef} /> {/* For scrolling to bottom */}
          </div>

          {/* Typing Indicator */}
          {isTyping && (
            <div id="typingIndicator" className="px-6 pb-2">
              {" "}
              {/* Adjusted padding */}
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-robot text-white text-sm"></i>
                </div>
                <div className="chat-bubble-bot typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            </div>
          )}

          {/* Chat Input */}
          <div className="p-6 border-t border-gray-200">
            <div className="flex gap-4">
              <input
                type="text"
                id="chatInput"
                placeholder="Share what's on your mind..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                disabled={isTyping}
              />
              <button
                id="sendBtn"
                onClick={handleSendMessage}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all"
                disabled={isTyping || !inputValue.trim()}
              >
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
            <div className="flex gap-2 mt-4 flex-wrap">
              {["I feel stressed", "I need to talk", "Help me relax"].map(
                (text) => (
                  <button
                    key={text}
                    onClick={() => handleQuickResponse(text)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                  >
                    {text}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
