// components/JournalPage.js
"use client";
import { useState, useEffect, useCallback } from "react";

// Props: currentUser, saveJournalAPI, getJournalEntriesAPI, updateJournalEntryAPI, deleteJournalEntryAPI, getJournalEntryByIdAPI
export default function JournalPage({
  currentUser,
  saveJournalAPI,
  getJournalEntriesAPI,
  updateJournalEntryAPI,
  deleteJournalEntryAPI,
  getJournalEntryByIdAPI,
}) {
  const [entries, setEntries] = useState([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null); // Stores full entry object or null
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const moodColor = (mood) =>
    ({
      happy: "green",
      sad: "blue",
      anxious: "yellow",
      calm: "indigo",
      stressed: "red",
    }[mood?.toLowerCase()] || "purple");
  const formatDateForDisplay = (dateString) =>
    new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const fetchEntries = useCallback(async () => {
    if (!currentUser || !getJournalEntriesAPI) return;
    setIsLoading(true);
    try {
      const fetchedEntries = await getJournalEntriesAPI();
      setEntries(fetchedEntries);
    } catch (error) {
      console.error("Failed to fetch journal entries:", error);
      alert("Error fetching entries: " + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, getJournalEntriesAPI]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleNewEntryClick = () => {
    setEditingEntry(null);
    setTitle("");
    setContent("");
    setIsFormVisible(true);
  };

  const handleUsePrompt = (promptText) => {
    handleNewEntryClick(); // Opens form and clears fields
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
    setIsLoading(true);
    const entryData = {
      title: title.trim() || "Untitled Entry",
      content: content.trim(),
    };

    try {
      if (editingEntry && editingEntry._id) {
        await updateJournalEntryAPI(editingEntry._id, entryData);
        alert("Journal entry updated!");
      } else {
        await saveJournalAPI(entryData.title, entryData.content);
        alert("Journal entry saved!");
      }
      handleCancel(); // Close form
      fetchEntries(); // Refresh list
    } catch (error) {
      console.error("Error saving journal entry:", error);
      alert("Error saving entry: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = async (entryId) => {
    if (!getJournalEntryByIdAPI) return;
    setIsLoading(true);
    try {
      const entryToEdit = await getJournalEntryByIdAPI(entryId);
      setEditingEntry(entryToEdit);
      setTitle(entryToEdit.title);
      setContent(entryToEdit.content);
      setIsFormVisible(true);
      // Scroll to form
      const formEl = document.getElementById("journalForm");
      formEl?.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (error) {
      console.error("Error fetching entry for edit:", error);
      alert("Error fetching entry: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = async (entryId) => {
    if (window.confirm("Are you sure you want to delete this journal entry?")) {
      setIsLoading(true);
      try {
        await deleteJournalEntryAPI(entryId);
        alert("Journal entry deleted.");
        fetchEntries(); // Refresh list
      } catch (error) {
        console.error("Error deleting journal entry:", error);
        alert("Error deleting entry: " + error.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const journalPrompts = [
    { text: "What made you smile today?", color: "blue" },
    { text: "What challenge did you overcome?", color: "green" },
    { text: "What are you grateful for?", color: "purple" },
    { text: "How did you take care of yourself today?", color: "yellow" },
  ];

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <i className="fas fa-book text-4xl mb-4"></i>
        <p>Please login to access your journal.</p>
      </div>
    );
  }

  return (
    <div id="journal" className="page active">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
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
              className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all"
            >
              <i className="fas fa-plus mr-2"></i>New Entry
            </button>
          </div>
        </div>

        {/* Prompts */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Daily Prompts
          </h4>
          <div className="grid md:grid-cols-2 gap-4">
            {journalPrompts.map((prompt) => (
              <div
                key={prompt.text}
                onClick={() => handleUsePrompt(prompt.text)}
                className={`p-4 bg-${prompt.color}-50 rounded-lg cursor-pointer hover:bg-${prompt.color}-100 transition-colors`}
              >
                <p className={`text-${prompt.color}-800 font-medium`}>
                  {prompt.text.includes("smile")
                    ? "💙"
                    : prompt.text.includes("challenge")
                    ? "🌱"
                    : prompt.text.includes("grateful")
                    ? "🙏"
                    : "✨"}{" "}
                  {prompt.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        {isFormVisible && (
          <div
            id="journalForm"
            className="bg-white rounded-2xl shadow-lg p-6 mb-8"
          >
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              {editingEntry ? "Edit Journal Entry" : "New Journal Entry"}
            </h4>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="journalTitleInput"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Title (optional)
                </label>
                <input
                  type="text"
                  id="journalTitleInput"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label
                  htmlFor="journalContentInput"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Your thoughts
                </label>
                <textarea
                  id="journalContentInput"
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
                  disabled={isLoading}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isLoading ? (
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
                  className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Entries */}
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
          <div className="space-y-6" id="journalEntriesList">
            {entries.map((entry) => (
              <div
                key={entry._id}
                className={`border-l-4 border-${moodColor(
                  entry.associatedMood
                )}-500 pl-6 py-4`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900">{entry.title}</h5>
                  <span className="text-sm text-gray-500">
                    {formatDateForDisplay(entry.entryDate)}
                  </span>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {entry.content.substring(0, 200)}
                  {entry.content.length > 200 && "..."}
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <button
                    onClick={() => handleEditClick(entry._id)}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    <i className="fas fa-edit mr-1"></i>Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(entry._id)}
                    className="text-red-500 hover:text-red-700 text-sm"
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
