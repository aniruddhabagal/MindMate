// components/ChatPage.js
"use client";
import { useState, useEffect, useRef } from "react";

// Props: currentUser, callChatAPI, onChatCreditDeduction (to update parent's currentUser), updateUserCredits
export default function ChatPage({
  currentUser,
  callChatAPI,
  onChatCreditDeduction,
  updateUserCredits,
}) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false); // API loading state
  const chatMessagesEndRef = useRef(null);

  const scrollToBottom = () => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (currentUser && messages.length === 0) {
      setMessages([
        {
          sender: "bot",
          text: "Hello! I'm MindMate. How are you feeling today? 😊",
        },
      ]);
    } else if (!currentUser) {
      setMessages([]); // Clear chat if user logs out
    }
  }, [currentUser]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentUser) return;

    if (currentUser.credits < 1) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "You've run out of chat credits! Please look for ways to earn more.",
        },
      ]);
      return;
    }

    const newUserMessage = { sender: "user", text: inputValue };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    const currentInput = inputValue; // Store before clearing
    setInputValue("");
    setIsTyping(true);

    try {
      const historyForAPI = [...messages, newUserMessage].slice(-11, -1); // Send up to 10 previous turns
      const response = await callChatAPI(currentInput, historyForAPI);

      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: "bot", text: response.reply },
      ]);
      onChatCreditDeduction(); // Notify parent to decrement credits in its state
    } catch (error) {
      console.error("Chat API error:", error);
      let errorMessage =
        "Sorry, I'm having trouble connecting. Please try again.";
      if (error.status === 403 || error.status === 402) {
        // Insufficient credits from backend
        errorMessage = error.data?.message || "You don't have enough credits.";
        if (error.data?.credits !== undefined && updateUserCredits) {
          updateUserCredits(error.data.credits); // Sync credits with server state
        }
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
    if (!currentUser) {
      // Parent component (app/page.js) should ideally handle opening login modal
      alert("Please login to use quick responses.");
      return;
    }
    setInputValue(text);
    // Consider calling handleSendMessage() or just letting user press send
  };

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] text-gray-500">
        <i className="fas fa-comments text-4xl mb-4 text-purple-400"></i>
        <p>Please login to start chatting with MindMate.</p>
      </div>
    );
  }

  return (
    <div id="chat" className="page active">
      {" "}
      {/* 'active' class not needed if this is the only content */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg h-[calc(100vh-16rem)] sm:h-[calc(100vh-14rem)] md:h-[calc(100vh-12rem)] flex flex-col">
          {/* Chat Header */}
          <div className="p-4 sm:p-6 border-b border-gray-200">
            {" "}
            {/* Responsive padding */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                <i className="fas fa-robot text-white text-lg sm:text-xl"></i>{" "}
                {/* Responsive icon size */}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-base sm:text-lg">
                  MindMate Assistant
                </h3>
                <p className="text-xs sm:text-sm text-green-600 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>{" "}
                  Online
                </p>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div
            id="chatMessages"
            className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3 sm:space-y-4"
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-2 sm:gap-3 ${
                  msg.sender === "user" ? "justify-end" : ""
                }`}
              >
                {msg.sender === "bot" && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-robot text-white text-xs sm:text-sm"></i>
                  </div>
                )}
                <div
                  className={`${
                    msg.sender === "user"
                      ? "chat-bubble-user text-white"
                      : "chat-bubble-bot"
                  } p-2.5 px-3.5 sm:p-3 sm:px-4 max-w-[80%] sm:max-w-md`}
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
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-user text-gray-600 text-2xs sm:text-xs"></i>{" "}
                    {/* Adjusted icon size for user */}
                  </div>
                )}
              </div>
            ))}
            <div ref={chatMessagesEndRef} />
          </div>

          {/* Typing Indicator */}
          {isTyping && (
            <div className="px-4 sm:px-6 pb-1 sm:pb-2">
              <div className="flex gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-robot text-white text-xs sm:text-sm"></i>
                </div>
                <div className="chat-bubble-bot typing-indicator !py-3 !px-3.5 sm:!py-3.5 sm:!px-4">
                  {" "}
                  {/* Adjusted padding for typing indicator */}
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            </div>
          )}

          {/* Chat Input */}
          <div className="p-4 sm:p-6 border-t border-gray-200">
            <div className="flex gap-2 sm:gap-4">
              <input
                type="text"
                placeholder="Share what's on your mind..."
                className="flex-1 px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && !isTyping && handleSendMessage()
                }
                disabled={isTyping}
              />
              <button
                onClick={handleSendMessage}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-60"
                disabled={isTyping || !inputValue.trim()}
              >
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
            <div className="flex gap-2 mt-3 sm:mt-4 flex-wrap">
              {["I feel stressed", "I need to talk", "Help me relax"].map(
                (text) => (
                  <button
                    key={text}
                    onClick={() => handleQuickResponse(text)}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-100 text-gray-700 rounded-full text-xs sm:text-sm hover:bg-gray-200 transition-colors"
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
