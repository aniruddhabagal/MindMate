// components/JournalPage.js
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { formatDate as formatDateUtil, getMoodColor } from "../lib/formatters"; // Assuming formatters.js is in lib

// Props: currentUser, apiClient (object with all API functions), journalDataVersion
export default function JournalPage({
  currentUser,
  apiClient,
  journalDataVersion,
}) {
  const [entries, setEntries] = useState([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null); // Stores full entry object for editing
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true); // For fetching entries
  const [isSaving, setIsSaving] = useState(false); // For save/update operation
  const contentInputRef = useRef(null);

  const journalPromptsList = [
    { text: "What made you smile today?", icon: "💙" },
    { text: "What challenge did you overcome?", icon: "🌱" },
    { text: "What are you grateful for?", icon: "🙏" },
    { text: "How did you take care of yourself today?", icon: "✨" },
  ];

  const fetchEntries = useCallback(async () => {
    if (!currentUser || !apiClient?.getJournalEntriesAPI) return;
    setIsLoading(true);
    try {
      const fetchedEntries = await apiClient.getJournalEntriesAPI();
      setEntries(fetchedEntries);
    } catch (error) {
      console.error("Failed to fetch journal entries:", error);
      // Consider setting an error state to display to the user
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, apiClient]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries, journalDataVersion]); // journalDataVersion from parent triggers refetch

  useEffect(() => {
    if (isFormVisible && contentInputRef.current) {
      contentInputRef.current.focus();
    }
  }, [isFormVisible]);

  const handleNewEntryClick = () => {
    setEditingEntry(null);
    setTitle("");
    setContent("");
    setIsFormVisible(true);
    // Scroll to form if needed, after it becomes visible
    setTimeout(() => {
      const formEl = document.getElementById("journalEntryFormElement"); // Add this ID to your form div
      formEl?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  };

  const handleUsePrompt = (promptText) => {
    handleNewEntryClick();
    setContent(`${promptText}\n\n`);
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    setEditingEntry(null);
    setTitle("");
    setContent("");
  };

  const handleSave = async () => {
    if (!content.trim()) {
      alert("Please write something in your journal entry.");
      return;
    }
    if (!apiClient) return;
    setIsSaving(true);
    const entryData = {
      title: title.trim() || "Untitled Entry",
      content: content.trim(),
    };

    try {
      if (editingEntry && editingEntry._id) {
        await apiClient.updateJournalEntryAPI(editingEntry._id, entryData);
        alert("Journal entry updated!");
      } else {
        await apiClient.saveJournalAPI(entryData.title, entryData.content);
        alert("Journal entry saved!");
      }
      handleCancel();
      fetchEntries(); // Refresh list
    } catch (error) {
      console.error("Error saving journal entry:", error);
      alert("Error saving entry: " + (error.data?.message || error.message));
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = async (entryId) => {
    if (!apiClient?.getJournalEntryByIdAPI) return;
    setIsLoading(true); // Use general loading or specific edit-loading state
    try {
      const entryToEdit = await apiClient.getJournalEntryByIdAPI(entryId);
      setEditingEntry(entryToEdit);
      setTitle(entryToEdit.title);
      setContent(entryToEdit.content);
      setIsFormVisible(true);
      setTimeout(() => {
        const formEl = document.getElementById("journalEntryFormElement");
        formEl?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 0);
    } catch (error) {
      console.error("Error fetching entry for edit:", error);
      alert("Error fetching entry: " + (error.data?.message || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = async (entryId) => {
    if (!apiClient?.deleteJournalEntryAPI) return;
    if (window.confirm("Are you sure you want to delete this journal entry?")) {
      setIsSaving(true); // Indicate an operation is in progress
      try {
        await apiClient.deleteJournalEntryAPI(entryId);
        alert("Journal entry deleted.");
        fetchEntries();
      } catch (error) {
        console.error("Error deleting journal entry:", error);
        alert(
          "Error deleting entry: " + (error.data?.message || error.message)
        );
      } finally {
        setIsSaving(false);
      }
    }
  };

  if (!currentUser && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 py-10">
        <i className="fas fa-book text-4xl mb-4 text-purple-400"></i>
        <p>Please login to access your journal.</p>
      </div>
    );
  }

  return (
    <div id="journal" className="page active">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Your Journal</h3>
              <p className="text-gray-600">
                Express your thoughts and feelings
              </p>
            </div>
            <button
              onClick={handleNewEntryClick}
              disabled={isLoading || isSaving}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-70"
            >
              <i className="fas fa-plus mr-2"></i>New Entry
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Daily Prompts
          </h4>
          <div className="grid md:grid-cols-2 gap-4">
            {journalPromptsList.map((prompt) => (
              <div
                key={prompt.text}
                onClick={() => handleUsePrompt(prompt.text)}
                className={`p-4 bg-${getMoodColor(
                  prompt.icon
                )}-50 rounded-lg cursor-pointer hover:bg-${getMoodColor(
                  prompt.icon
                )}-100 transition-colors`}
              >
                <p
                  className={`text-${getMoodColor(
                    prompt.icon
                  )}-800 font-medium`}
                >
                  {prompt.icon} {prompt.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {isFormVisible && (
          <div
            id="journalEntryFormElement"
            className="bg-white rounded-2xl shadow-lg p-6 mb-8"
          >
            {" "}
            {/* Added ID here */}
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              {editingEntry ? "Edit Journal Entry" : "New Journal Entry"}
            </h4>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="journalTitleInputForm"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Title (optional)
                </label>
                <input
                  type="text"
                  id="journalTitleInputForm"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label
                  htmlFor="journalContentInputForm"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Your thoughts
                </label>
                <textarea
                  id="journalContentInputForm"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows="8"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Write about your day, thoughts, feelings..."
                ></textarea>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>Saving...
                    </>
                  ) : editingEntry ? (
                    "Update Entry"
                  ) : (
                    "Save Entry"
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-70"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-6">
            Recent Entries
          </h4>
          {isLoading && entries.length === 0 && (
            <p className="text-center text-gray-500">Loading entries...</p>
          )}
          {!isLoading && entries.length === 0 && (
            <p className="text-center text-gray-500">
              No journal entries yet. Create one!
            </p>
          )}
          <div className="space-y-6">
            {entries.map((entry) => (
              <div
                key={entry._id}
                className={`border-l-4 border-${getMoodColor(
                  entry.associatedMood
                )}-500 pl-6 py-4`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900">{entry.title}</h5>
                  <span className="text-sm text-gray-500">
                    {formatDateUtil(entry.entryDate)}
                  </span>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {entry.content.substring(0, 200)}
                  {entry.content.length > 200 && "..."}
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <button
                    onClick={() => handleEditClick(entry._id)}
                    disabled={isSaving || isLoading}
                    className="text-gray-500 hover:text-gray-700 text-sm disabled:opacity-50"
                  >
                    <i className="fas fa-edit mr-1"></i>Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(entry._id)}
                    disabled={isSaving || isLoading}
                    className="text-red-500 hover:text-red-700 text-sm disabled:opacity-50"
                  >
                    <i className="fas fa-trash mr-1"></i>Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
