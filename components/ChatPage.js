// components/ChatPage.js
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { formatDate, moodEmojis } from "../lib/formatters"; // Assuming formatters.js
import Loader from "./Loader";

// Props: currentUser, apiClient, onChatCreditDeduction, updateUserCredits
export default function ChatPage({
  currentUser,
  apiClient,
  onChatCreditDeduction,
  updateUserCredits,
}) {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [currentMessages, setCurrentMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");

  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editableTitle, setEditableTitle] = useState("");
  const [isMobileSessionsVisible, setIsMobileSessionsVisible] = useState(false);

  const titleInputRef = useRef(null);
  const chatMessagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const toggleMobileSessions = () => {
    setIsMobileSessionsVisible((prev) => !prev);
  };

  const scrollToBottom = () =>
    chatMessagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  useEffect(scrollToBottom, [currentMessages]);

  // Fetch user's chat sessions
  const fetchSessions = useCallback(
    async (shouldSetActiveToFirst = false) => {
      if (!currentUser || !apiClient?.getChatSessionsAPI) {
        setSessions([]);
        setIsLoadingSessions(false); // Ensure loading is false
        return;
      }
      setIsLoadingSessions(true);
      try {
        const fetchedSessions = await apiClient.getChatSessionsAPI();
        const validSessions = fetchedSessions || [];
        setSessions(validSessions);

        if (
          shouldSetActiveToFirst &&
          validSessions.length > 0 &&
          !activeSessionId
        ) {
          // Only set active session if explicitly told to and no session is currently active
          // This prevents fetchSessions from resetting activeSessionId if it was already set by user action
          setActiveSessionId(validSessions[0]._id);
        } else if (validSessions.length === 0) {
          setActiveSessionId(null); // No sessions, clear active
        }
        // If activeSessionId exists but is not in the new list of sessions, clear it
        else if (
          activeSessionId &&
          !validSessions.find((s) => s._id === activeSessionId)
        ) {
          setActiveSessionId(null);
          setCurrentMessages([
            {
              sender: "bot",
              text: "Selected session no longer exists. Please choose another.",
            },
          ]);
        }
      } catch (error) {
        console.error("Error fetching chat sessions:", error);
        setSessions([]);
      } finally {
        setIsLoadingSessions(false);
      }
    },
    [currentUser, apiClient, activeSessionId]
  );

  useEffect(() => {
    if (currentUser) {
      fetchSessions(true); // On initial load/user change, try to set the first session as active
    } else {
      setSessions([]);
      setActiveSessionId(null);
      setCurrentMessages([]);
      setIsLoadingSessions(false);
    }
  }, [currentUser, fetchSessions]); // Rerun if currentUser changes

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select(); // Select current text
    }
  }, [isEditingTitle]);

  // Fetch messages for the active session
  const fetchMessagesForSession = useCallback(
    async (sessionId) => {
      if (!sessionId || !currentUser || !apiClient?.getChatSessionMessagesAPI) {
        setCurrentMessages(
          sessionId ? [] : [{ sender: "bot", text: "Select or start a chat." }]
        );
        setIsLoadingMessages(false); // Ensure loading state is reset
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
    [currentUser, apiClient]
  ); // Removed activeSessionId, it's passed as arg

  // Effect to load messages when activeSessionId changes
  useEffect(() => {
    if (activeSessionId) {
      fetchMessagesForSession(activeSessionId);
    } else if (
      currentUser &&
      sessions.length === 0 &&
      !isLoadingSessions &&
      !isCreatingSession
    ) {
      setCurrentMessages([
        { sender: "bot", text: "Start a new chat to begin!" },
      ]);
    } else if (!currentUser) {
      setCurrentMessages([]);
    }
    // No dependency on fetchMessagesForSession to prevent re-triggering from its own definition change
  }, [
    activeSessionId,
    currentUser,
    sessions,
    isLoadingSessions,
    isCreatingSession,
  ]);

  const handleEditTitleClick = () => {
    const currentSession = sessions.find((s) => s._id === activeSessionId);
    if (currentSession) {
      setEditableTitle(currentSession.title);
      setIsEditingTitle(true);
    }
  };

  const handleTitleChange = (e) => {
    setEditableTitle(e.target.value);
  };

  const handleSaveTitle = async () => {
    if (
      !activeSessionId ||
      !editableTitle.trim() ||
      !apiClient?.updateChatSessionTitleAPI
    )
      return;

    const originalTitle = sessions.find(
      (s) => s._id === activeSessionId
    )?.title;
    if (editableTitle.trim() === originalTitle) {
      setIsEditingTitle(false);
      return;
    }

    try {
      const updatedSession = await apiClient.updateChatSessionTitleAPI(
        activeSessionId,
        editableTitle.trim()
      );
      // Update local sessions state
      setSessions((prevSessions) =>
        prevSessions
          .map((s) =>
            s._id === activeSessionId
              ? { ...s, title: updatedSession.title, lastActivity: new Date() }
              : s
          )
          .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity))
      );
      setIsEditingTitle(false);
    } catch (error) {
      console.error("Error updating chat title:", error);
      alert(`Failed to update title: ${error.data?.message || error.message}`);
      setEditableTitle(originalTitle); // Revert on error
    }
  };

  const handleTitleInputKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveTitle();
    } else if (e.key === "Escape") {
      setIsEditingTitle(false);
      const currentSession = sessions.find((s) => s._id === activeSessionId);
      if (currentSession) setEditableTitle(currentSession.title); // Revert to original
    }
  };

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
      const newSessionData = await apiClient.startNewChatSessionAPI("");
      const newSessionEntry = {
        _id: newSessionData.sessionId,
        title: newSessionData.sessionTitle,
        preview:
          newSessionData.messages.slice(-1)[0]?.text.substring(0, 50) ||
          "Chat started",
        lastActivity: new Date(),
      };
      // Prepend to sessions and make active
      setSessions((prev) => [
        newSessionEntry,
        ...prev.filter((s) => s._id !== newSessionData.sessionId),
      ]);
      setActiveSessionId(newSessionData.sessionId); // This will trigger useEffect to load its messages
      setCurrentMessages(newSessionData.messages); // Optimistically set messages

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
                  preview:
                    response.reply.substring(0, 50) +
                    (response.reply.length > 50 ? "..." : ""),
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
  const handleSessionSelect = (sessionId) => {
    if (isSendingMessage || isLoadingMessages || isCreatingSession) return;
    if (activeSessionId !== sessionId) {
      setActiveSessionId(sessionId);
    }
    setIsMobileSessionsVisible(false); // Close on select
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        // Tailwind's 'md' breakpoint
        setIsMobileSessionsVisible(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!currentUser && !isLoadingSessions) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 py-10">
        <i className="fas fa-comments text-4xl mb-4 text-purple-400"></i>
        <p>Please login to start chatting with MindMate.</p>
      </div>
    );
  }

  const activeSession = activeSessionId
    ? sessions.find((s) => s._id === activeSessionId)
    : null;
  const currentChatTitle = isEditingTitle
    ? editableTitle
    : activeSession?.title ||
      (activeSessionId ? "Loading Chat..." : "Select or Start a Chat");

  return (
    <div className="flex flex-grow h-[calc(100vh-var(--header-height,80px)-2rem)] overflow-hidden">
      {" "}
      {/* Main flex container for sessions and chat area */}
      {/* Sessions Sidebar - Conditionally shown/hidden on mobile */}
      <div
        className={`
        absolute md:static top-0 left-0 h-full md:h-auto z-20 md:z-auto
        w-full sm:w-3/4 md:w-[280px] lg:w-[320px] 
        bg-slate-100 border-r border-gray-200 p-3 flex flex-col 
        transition-transform duration-300 ease-in-out shadow-lg md:shadow-sm
        ${isMobileSessionsVisible ? "translate-x-0" : "-translate-x-full"} 
        md:translate-x-0 
      `}
      >
        <div className="flex justify-between items-center mb-3 md:hidden">
          {" "}
          {/* Mobile only header for sessions list */}
          <h2 className="text-lg font-semibold text-gray-700">Your Chats</h2>
          <button
            onClick={toggleMobileSessions}
            className="p-1 text-gray-500 hover:text-gray-700"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>
        <button
          onClick={handleStartNewChat}
          disabled={isSendingMessage || isCreatingSession || isLoadingSessions}
          className="w-full mb-3 bg-purple-600 text-white py-2.5 px-4 rounded-lg hover:bg-purple-700 transition disabled:opacity-60 text-sm font-medium flex items-center justify-center shadow hover:shadow-md"
        >
          {isCreatingSession ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>Creating...
            </>
          ) : (
            <>
              <i className="fas fa-plus mr-2"></i>New Chat
            </>
          )}
        </button>
        <div className="flex-grow overflow-y-auto custom-scrollbar">
          {/* Sessions list container with custom scrollbar if needed */}
          {isLoadingSessions && (
            <Loader show={true} text="Loading chats..." fullPage={false} />
          )}
          {!isLoadingSessions && sessions.length === 0 && (
            <p>No chat sessions.</p>
          )}

          {!isLoadingSessions && sessions.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-2">
              No chat sessions yet. Start one!
            </p>
          )}
          <ul className="space-y-1">
            {sessions.map((session) => (
              <li key={session._id}>
                <button
                  onClick={() => handleSessionSelect(session._id)}
                  disabled={
                    isSendingMessage || isLoadingMessages || isCreatingSession
                  }
                  className={`w-full text-left p-2.5 rounded-md hover:bg-slate-200 text-sm transition-colors disabled:opacity-70 ${
                    activeSessionId === session._id
                      ? "bg-purple-100 text-purple-800 font-semibold shadow-sm"
                      : "text-gray-700 hover:text-gray-900"
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
      </div>
      {/* Mobile Overlay for Sessions List - shown when mobile sessions list is visible */}
      {isMobileSessionsVisible && (
        <div
          className="fixed inset-0 bg-black bg-opacity-25 z-10 md:hidden" // Lower opacity
          onClick={toggleMobileSessions}
        ></div>
      )}
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white shadow-inner h-full overflow-hidden">
        {" "}
        {/* Ensure h-full and overflow-hidden */}
        {/* Chat Header with Edit Title */}
        <div className="p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10 flex-shrink-0">
          {" "}
          {/* Prevent header from shrinking */}
          <div className="flex items-center flex-grow min-w-0">
            {" "}
            {/* Allow title to truncate */}
            {/* Mobile Hamburger for Sessions List */}
            <button
              onClick={toggleMobileSessions}
              className="mr-3 p-1 text-gray-500 hover:text-gray-700 md:hidden"
              aria-label="Toggle chat sessions list"
            >
              <i className="fas fa-bars text-xl"></i>
            </button>
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={editableTitle}
                onChange={handleTitleChange}
                onBlur={handleSaveTitle}
                onKeyDown={handleTitleInputKeyDown}
                className="font-semibold text-gray-800 text-base sm:text-lg truncate flex-1 bg-transparent border-b-2 border-purple-500 focus:outline-none px-1 py-0.5"
                aria-label="Edit chat title"
              />
            ) : (
              <h3
                className="font-semibold text-gray-800 text-base sm:text-lg truncate flex-1 cursor-pointer hover:text-purple-600"
                onClick={activeSessionId ? handleEditTitleClick : undefined}
                title={activeSessionId ? "Edit chat title" : ""}
              >
                {currentChatTitle}
              </h3>
            )}
          </div>
          {activeSessionId && !isEditingTitle && (
            <button
              onClick={handleEditTitleClick}
              className="ml-2 p-1 text-gray-500 hover:text-purple-600 flex-shrink-0"
              title="Edit title"
              aria-label="Edit chat title"
            >
              <i className="fas fa-pencil-alt"></i>
            </button>
          )}
          {isEditingTitle && (
            <button
              onClick={handleSaveTitle}
              className="ml-2 p-1 text-green-500 hover:text-green-700 flex-shrink-0"
              title="Save title"
              aria-label="Save chat title"
            >
              <i className="fas fa-check"></i>
            </button>
          )}
        </div>
        {/* Messages Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3 sm:space-y-4 bg-slate-50 custom-scrollbar">
          {" "}
          {/* Added custom-scrollbar class if you want to style it */}
          {isLoadingMessages && activeSessionId && (
            <p className="text-center text-gray-500 py-4">
              Loading messages...
            </p>
          )}
          {!activeSessionId &&
            !isLoadingMessages &&
            !isLoadingSessions &&
            !isCreatingSession && ( // More precise condition
              <div className="text-center text-gray-500 flex flex-col items-center justify-center h-full">
                <i className="far fa-comments text-5xl text-gray-300 mb-3"></i>
                <p>Select a chat from the left or start a new one.</p>
              </div>
            )}
          {!isLoadingMessages &&
            currentMessages.length === 0 &&
            activeSessionId && (
              <p className="text-center text-gray-500 py-4">
                No messages in this session yet. Send one!
              </p>
            )}
          {currentMessages.map((msg, index) => (
            <div
              key={msg._id || `msg-${index}-${msg.timestamp || Date.now()}`}
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
                    : "chat-bubble-bot text-gray-800"
                } p-2.5 px-3.5 sm:p-3 sm:px-4 max-w-[80%] sm:max-w-md shadow-sm break-words`}
              >
                {" "}
                {/* Added break-words */}
                <p className="text-sm">{msg.text}</p>
              </div>
              {msg.sender === "user" && (
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0 shadow">
                  <i className="fas fa-user text-slate-600 text-2xs sm:text-xs"></i>
                </div>
              )}
            </div>
          ))}
          <div ref={chatMessagesEndRef} />
        </div>
        {/* Typing Indicator (Bot is typing) */}
        {isSendingMessage &&
          activeSessionId && ( // Show only when actually waiting for bot reply
            <div className="px-4 sm:px-6 pb-1 sm:pb-2 bg-slate-50 flex-shrink-0">
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
        {/* Chat Input Area */}
        <div className="p-4 sm:p-6 border-t border-gray-200 bg-white flex-shrink-0">
          <div className="flex gap-2 sm:gap-4">
            <input
              ref={inputRef}
              type="text"
              placeholder={
                activeSessionId
                  ? "Type your message..."
                  : "Select or start a chat to reply"
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
                isSendingMessage ||
                !activeSessionId ||
                isLoadingMessages ||
                isCreatingSession
              }
              aria-label="Chat message input"
            />
            <button
              onClick={handleSendMessage}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-60 shadow hover:shadow-md"
              disabled={
                isSendingMessage ||
                !activeSessionId ||
                !inputValue.trim() ||
                isLoadingMessages ||
                isCreatingSession
              }
              aria-label="Send message"
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
          <div className="flex gap-2 mt-3 sm:mt-4 flex-wrap">
            {["I feel stressed", "I need to talk", "Help me relax"].map(
              (text) => (
                <button
                  key={text}
                  onClick={() => {
                    if (activeSessionId) setInputValue(text);
                  }}
                  disabled={
                    !activeSessionId ||
                    isSendingMessage ||
                    isLoadingMessages ||
                    isCreatingSession
                  }
                  className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-100 text-gray-700 rounded-full text-xs sm:text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {text}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
