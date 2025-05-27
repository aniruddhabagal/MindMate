// components/ChatPage.js
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { formatDate, moodEmojis } from "../lib/formatters"; // Assuming formatters.js

// Props: currentUser, apiClient, onChatCreditDeduction, updateUserCredits
export default function ChatPage({
  currentUser,
  apiClient,
  onChatCreditDeduction,
  updateUserCredits,
}) {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [currentMessages, setCurrentMessages] = useState([]); // For the active session
  const [inputValue, setInputValue] = useState("");

  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false); // For Gemini response when sending message
  const [isCreatingSession, setIsCreatingSession] = useState(false); // For new session creation

  const chatMessagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () =>
    chatMessagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  useEffect(scrollToBottom, [currentMessages]);

  // Fetch user's chat sessions
  const fetchSessions = useCallback(async () => {
    if (!currentUser || !apiClient?.getChatSessionsAPI) {
      setSessions([]);
      return;
    }
    setIsLoadingSessions(true);
    try {
      const fetchedSessions = await apiClient.getChatSessionsAPI();
      setSessions(fetchedSessions || []);
      // If no active session but sessions exist, and not currently loading messages for another, select the first one.
      if (
        !activeSessionId &&
        fetchedSessions &&
        fetchedSessions.length > 0 &&
        !isLoadingMessages
      ) {
        setActiveSessionId(fetchedSessions[0]._id);
      } else if (fetchedSessions.length === 0) {
        setActiveSessionId(null); // No sessions, no active session
        setCurrentMessages([
          {
            sender: "bot",
            text: "Start a new chat or select an existing one from the panel!",
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
      setSessions([]); // Clear sessions on error
      // Display error to user?
    } finally {
      setIsLoadingSessions(false);
    }
  }, [currentUser, apiClient, activeSessionId, isLoadingMessages]); // Added activeSessionId & isLoadingMessages to dep array for initial load logic

  useEffect(() => {
    if (currentUser) {
      // Only fetch sessions if a user is logged in
      fetchSessions();
    } else {
      // User logged out
      setSessions([]);
      setActiveSessionId(null);
      setCurrentMessages([]);
    }
  }, [currentUser, fetchSessions]); // Rerun if currentUser changes

  // Fetch messages for the active session
  const fetchMessagesForSession = useCallback(
    async (sessionId) => {
      if (!sessionId || !currentUser || !apiClient?.getChatSessionMessagesAPI) {
        setCurrentMessages(
          activeSessionId
            ? []
            : [{ sender: "bot", text: "Select or start a chat." }]
        );
        return;
      }
      setIsLoadingMessages(true);
      try {
        const sessionData = await apiClient.getChatSessionMessagesAPI(
          sessionId
        );
        setCurrentMessages(sessionData.messages || []);
      } catch (error) {
        console.error(
          `Error fetching messages for session ${sessionId}:`,
          error
        );
        setCurrentMessages([
          {
            sender: "bot",
            text: `Error loading messages: ${
              error.data?.message || error.message
            }`,
          },
        ]);
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [currentUser, apiClient, activeSessionId]
  ); // Added activeSessionId

  useEffect(() => {
    if (activeSessionId) {
      fetchMessagesForSession(activeSessionId);
    } else if (
      currentUser &&
      sessions.length === 0 &&
      !isLoadingSessions &&
      !isCreatingSession
    ) {
      // This handles the case where user is logged in, no sessions are loaded yet, and not creating one
      setCurrentMessages([
        { sender: "bot", text: "Start a new chat to begin!" },
      ]);
    } else if (!currentUser) {
      setCurrentMessages([]);
    }
  }, [
    activeSessionId,
    fetchMessagesForSession,
    currentUser,
    sessions,
    isLoadingSessions,
    isCreatingSession,
  ]);

  const handleStartNewChat = async () => {
    if (!currentUser || !apiClient?.startNewChatSessionAPI || isCreatingSession)
      return;

    if (currentUser.credits < 1) {
      setCurrentMessages([
        { sender: "bot", text: "You need credits to start a new chat." },
      ]);
      return;
    }
    setIsCreatingSession(true);
    try {
      const newSessionData = await apiClient.startNewChatSessionAPI(""); // Start with an empty first message from user

      // Add to top of sessions list and make it active
      const newSessionEntry = {
        _id: newSessionData.sessionId,
        title: newSessionData.sessionTitle,
        preview:
          newSessionData.messages.slice(-1)[0]?.text.substring(0, 50) ||
          "Chat started",
        lastActivity: new Date(),
      };
      setSessions((prev) => [
        newSessionEntry,
        ...prev.filter((s) => s._id !== newSessionData.sessionId),
      ]);

      setActiveSessionId(newSessionData.sessionId); // This will trigger useEffect to fetch messages
      setCurrentMessages(newSessionData.messages); // Set messages immediately

      if (updateUserCredits && newSessionData.currentCredits !== undefined) {
        updateUserCredits(newSessionData.currentCredits);
      }
      inputRef.current?.focus();
    } catch (error) {
      console.error("Error starting new chat:", error);
      setCurrentMessages([
        {
          sender: "bot",
          text: `Error starting chat: ${error.data?.message || error.message}`,
        },
      ]);
      if (error.data?.credits !== undefined && updateUserCredits) {
        updateUserCredits(error.data.credits);
      }
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleSendMessage = async () => {
    if (
      !inputValue.trim() ||
      !activeSessionId ||
      !currentUser ||
      !apiClient?.sendMessageToSessionAPI ||
      isSendingMessage
    )
      return;

    // Optimistic UI update for user's message
    const newUserMessage = {
      sender: "user",
      text: inputValue.trim(),
      timestamp: new Date().toISOString(),
    };
    setCurrentMessages((prev) => [...prev, newUserMessage]);

    const messageToSend = inputValue.trim();
    setInputValue("");
    setIsSendingMessage(true);

    try {
      const response = await apiClient.sendMessageToSessionAPI(
        activeSessionId,
        messageToSend
      );
      setCurrentMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: response.reply,
          timestamp: new Date().toISOString(),
        },
      ]);
      if (onChatCreditDeduction) onChatCreditDeduction();

      setSessions((prevSessions) =>
        prevSessions
          .map((s) =>
            s._id === activeSessionId
              ? {
                  ...s,
                  preview: response.reply.substring(0, 50) + "...",
                  lastActivity: new Date(),
                }
              : s
          )
          .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity))
      );
      inputRef.current?.focus();
    } catch (error) {
      console.error("Error sending message:", error);
      setCurrentMessages((prev) => [...prev.slice(0, -1)]); // Remove optimistic user message on error
      setCurrentMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: `Error: ${error.data?.message || error.message}`,
        },
      ]);
      if (error.data?.credits !== undefined && updateUserCredits) {
        updateUserCredits(error.data.credits);
      }
    } finally {
      setIsSendingMessage(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 py-10">
        <i className="fas fa-comments text-4xl mb-4 text-purple-400"></i>
        <p>Please login to start chatting with MindMate.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-grow h-[calc(100vh-var(--header-height,100px))]">
      {" "}
      {/* Adjust var(--header-height) based on your actual header height */}
      {/* Sessions Sidebar */}
      <div
        className={`w-full md:w-1/3 lg:w-1/4 bg-slate-100 border-r border-gray-200 p-3 flex flex-col transition-all duration-300 ease-in-out md:translate-x-0 ${
          sessions.length > 0 || activeSessionId ? "md:block" : "md:block"
        }`}
      >
        {" "}
        {/* Simpler: always block on md+ for now */}
        <button
          onClick={handleStartNewChat}
          disabled={isSendingMessage || isCreatingSession || isLoadingSessions}
          className="w-full mb-3 bg-purple-600 text-white py-2.5 px-4 rounded-lg hover:bg-purple-700 transition disabled:opacity-60 text-sm font-medium flex items-center justify-center"
        >
          <i className="fas fa-plus mr-2"></i>New Chat
        </button>
        {isLoadingSessions && (
          <p className="text-xs text-gray-500 text-center py-2">
            Loading sessions...
          </p>
        )}
        {!isLoadingSessions && sessions.length === 0 && (
          <p className="text-xs text-gray-500 text-center py-2">
            No chat sessions yet.
          </p>
        )}
        <ul className="space-y-1 overflow-y-auto flex-grow">
          {sessions.map((session) => (
            <li key={session._id}>
              <button
                onClick={() => {
                  if (!isSendingMessage) setActiveSessionId(session._id);
                }}
                disabled={isSendingMessage}
                className={`w-full text-left p-2.5 rounded-md hover:bg-slate-200 text-sm transition-colors ${
                  activeSessionId === session._id
                    ? "bg-purple-100 text-purple-800 font-semibold shadow-sm"
                    : "text-gray-700"
                }`}
              >
                <p className="font-medium truncate">
                  {session.title ||
                    `Chat ${formatDate(session.createdAt, true)}`}
                </p>
                <p
                  className={`text-xs truncate ${
                    activeSessionId === session._id
                      ? "text-purple-600"
                      : "text-gray-500"
                  }`}
                >
                  {session.preview || "No messages yet"}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </div>
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        <div className="p-4 sm:p-5 border-b border-gray-200 flex items-center">
          {/* Mobile hamburger can be here if sessions list is collapsible on mobile */}
          <h3 className="font-semibold text-gray-800 text-base sm:text-lg truncate flex-1">
            {activeSessionId
              ? sessions.find((s) => s._id === activeSessionId)?.title ||
                "Loading chat..."
              : "Select or Start a Chat"}
          </h3>
        </div>

        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3 sm:space-y-4">
          {isLoadingMessages && (
            <p className="text-center text-gray-500">Loading messages...</p>
          )}
          {!isLoadingMessages &&
            currentMessages.length === 0 &&
            activeSessionId && (
              <p className="text-center text-gray-500">
                No messages in this session yet. Send one!
              </p>
            )}
          {!isLoadingMessages &&
            currentMessages.length === 0 &&
            !activeSessionId &&
            !isLoadingSessions && (
              <div className="text-center text-gray-500 flex flex-col items-center justify-center h-full">
                <i className="far fa-comments text-5xl text-gray-300 mb-3"></i>
                <p>Select a chat from the left or start a new one.</p>
              </div>
            )}
          {currentMessages.map((msg, index) => (
            <div
              key={msg._id || index}
              className={`flex gap-2 sm:gap-3 ${
                msg.sender === "user" ? "justify-end" : ""
              }`}
            >
              {msg.sender !== "user" && (
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 shadow">
                  <i className="fas fa-robot text-white text-xs sm:text-sm"></i>
                </div>
              )}
              <div
                className={`${
                  msg.sender === "user"
                    ? "chat-bubble-user text-white"
                    : "chat-bubble-bot"
                } p-2.5 px-3.5 sm:p-3 sm:px-4 max-w-[80%] sm:max-w-md shadow-sm`}
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
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-slate-300 rounded-full flex items-center justify-center flex-shrink-0 shadow">
                  <i className="fas fa-user text-slate-600 text-2xs sm:text-xs"></i>
                </div>
              )}
            </div>
          ))}
          <div ref={chatMessagesEndRef} />
        </div>

        {isSendingMessage && activeSessionId && (
          <div className="px-4 sm:px-6 pb-1 sm:pb-2">
            <div className="flex gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fas fa-robot text-white text-xs sm:text-sm"></i>
              </div>
              <div className="chat-bubble-bot typing-indicator !py-3 !px-3.5 sm:!py-3.5 sm:!px-4">
                <div className="typing-dot"></div>{" "}
                <div className="typing-dot"></div>{" "}
                <div className="typing-dot"></div>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 sm:p-6 border-t border-gray-200">
          <div className="flex gap-2 sm:gap-4">
            <input
              ref={inputRef}
              type="text"
              placeholder={
                activeSessionId
                  ? "Type your message..."
                  : "Select a chat to reply"
              }
              className="flex-1 px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base disabled:bg-gray-100"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) =>
                e.key === "Enter" &&
                !isSendingMessage &&
                activeSessionId &&
                handleSendMessage()
              }
              disabled={
                isSendingMessage || !activeSessionId || isLoadingMessages
              }
            />
            <button
              onClick={handleSendMessage}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-60"
              disabled={
                isSendingMessage ||
                !activeSessionId ||
                !inputValue.trim() ||
                isLoadingMessages
              }
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
          {/* Quick Responses can be re-added here if desired, ensure they are disabled if no active session */}
        </div>
      </div>
    </div>
  );
}
