// components/JournalPage.js
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { formatDate as formatDateUtil, getMoodColor } from "../lib/formatters";
import Loader from "./Loader"; // Ensure you have this component
import toast from "react-hot-toast";
import ConfirmationModal from "./ConfirmationModal";

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
  const [isLoading, setIsLoading] = useState(true); // For fetching entries list
  const [isSaving, setIsSaving] = useState(false); // For save/update/delete operations

  const contentInputRef = useRef(null);
  const journalFormRef = useRef(null); // Ref for the form element for scrolling

  // State for confirmation modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [modalConfig, setModalConfig] = useState({
    title: "Confirm Action",
    message: "Are you sure?",
    confirmText: "Confirm",
    confirmButtonClass:
      "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500",
  });

  const journalPromptsList = [
    { text: "What made you smile today?", icon: "💙", color: "blue" },
    { text: "What challenge did you overcome?", icon: "🌱", color: "green" },
    { text: "What are you grateful for?", icon: "🙏", color: "purple" },
    {
      text: "How did you take care of yourself today?",
      icon: "✨",
      color: "yellow",
    },
  ];

  const fetchEntries = useCallback(async () => {
    if (!currentUser || !apiClient?.getJournalEntriesAPI) {
      setEntries([]); // Clear entries if no user or apiClient
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const fetchedEntries = await apiClient.getJournalEntriesAPI();
      setEntries(fetchedEntries || []);
    } catch (error) {
      console.error("Failed to fetch journal entries:", error);
      toast.error(
        `Error fetching entries: ${error.data?.message || error.message}`
      );
      setEntries([]); // Clear entries on error too
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, apiClient]);

  useEffect(() => {
    // This effect runs when currentUser changes or journalDataVersion (from parent) changes
    if (currentUser) {
      fetchEntries();
    } else {
      setEntries([]); // Clear entries if user logs out
      setIsLoading(false);
      setIsFormVisible(false); // Hide form if user logs out
      setEditingEntry(null);
    }
  }, [currentUser, journalDataVersion, fetchEntries]);

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
    setTimeout(() => {
      // Ensure form is rendered before scrolling
      journalFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 0);
  };

  const handleUsePrompt = (promptText) => {
    handleNewEntryClick(); // This sets form visible and clears fields
    setContent(`${promptText}\n\n`); // Sets content and focuses via useEffect on isFormVisible
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    setEditingEntry(null);
    setTitle("");
    setContent("");
  };

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error("Please write something in your journal entry.");
      return;
    }
    if (!apiClient || isSaving) return;

    setIsSaving(true);
    const toastId = toast.loading(
      editingEntry ? "Updating entry..." : "Saving entry..."
    );

    const entryData = {
      title: title.trim() || "Untitled Entry",
      content: content.trim(),
      // associatedMood: "calm" // Example: you could add a mood selector to the journal form
    };

    try {
      if (editingEntry && editingEntry._id) {
        await apiClient.updateJournalEntryAPI(editingEntry._id, entryData);
        toast.success("Journal entry updated!");
      } else {
        await apiClient.saveJournalAPI(
          entryData.title,
          entryData.content /*, entryDate, associatedMood */
        );
        toast.success("Journal entry saved!");
      }
      handleCancel(); // Close form, clear fields
      fetchEntries(); // Refresh list
      toast.dismiss(toastId);
    } catch (error) {
      console.error("Error saving journal entry:", error);
      toast.dismiss(toastId);
      toast.error(
        `Error saving entry: ${error.data?.message || error.message}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = async (entryId) => {
    if (!apiClient?.getJournalEntryByIdAPI || isSaving) return;
    const toastId = toast.loading("Fetching entry for editing...");
    // setIsLoading(true); // Using isSaving for button disabling, isLoading for list
    try {
      const entryToEdit = await apiClient.getJournalEntryByIdAPI(entryId);
      setEditingEntry(entryToEdit);
      setTitle(entryToEdit.title);
      setContent(entryToEdit.content);
      setIsFormVisible(true);
      toast.dismiss(toastId);
      setTimeout(() => {
        journalFormRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 0);
    } catch (error) {
      console.error("Error fetching entry for edit:", error);
      toast.dismiss(toastId);
      toast.error(
        `Error fetching entry: ${error.data?.message || error.message}`
      );
    } finally {
      // setIsLoading(false);
    }
  };

  const openDeleteConfirmModal = (entryId, entryTitle) => {
    setModalConfig({
      title: "Confirm Deletion",
      message: `Are you sure you want to delete the journal entry titled "${
        entryTitle || "this entry"
      }"? This action cannot be undone.`,
      confirmText: "Delete",
      confirmButtonClass: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
    });
    // Pass a function that captures entryId to onConfirm
    setConfirmAction(() => () => performDelete(entryId));
    setIsConfirmModalOpen(true);
  };

  const performDelete = async (entryId) => {
    if (!apiClient?.deleteJournalEntryAPI || isSaving) return; // isSaving also blocks confirm button

    // isSaving is already true if called from confirmAction via handleDeleteClick's path
    // If called directly, ensure isSaving is set
    setIsSaving(true);
    const toastId = toast.loading("Deleting entry...");
    try {
      await apiClient.deleteJournalEntryAPI(entryId);
      toast.success("Journal entry deleted.");
      fetchEntries(); // Refresh list
    } catch (error) {
      console.error("Error deleting journal entry:", error);
      toast.error(
        `Error deleting entry: ${error.data?.message || error.message}`
      );
    } finally {
      setIsSaving(false);
      setIsConfirmModalOpen(false); // Close modal regardless of outcome
      toast.dismiss(toastId);
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
      {" "}
      {/* `active` class is handled by parent if this is one of many pages */}
      <div className="max-w-4xl mx-auto">
        {/* Journal Header */}
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
              disabled={isLoading || isSaving} // Disable if list is loading or an entry is being saved
              className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-70"
            >
              <i className="fas fa-plus mr-2"></i>New Entry
            </button>
          </div>
        </div>

        {/* Journal Prompts */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Daily Prompts
          </h4>
          <div className="grid md:grid-cols-2 gap-4">
            {journalPromptsList.map((prompt) => (
              <div
                key={prompt.text}
                onClick={() => handleUsePrompt(prompt.text)}
                role="button" // Accessibility
                tabIndex={0} // Accessibility
                onKeyDown={(e) =>
                  e.key === "Enter" && handleUsePrompt(prompt.text)
                }
                className={`p-4 bg-${prompt.color}-50 rounded-lg cursor-pointer hover:bg-${prompt.color}-100 transition-colors focus:outline-none focus:ring-2 focus:ring-${prompt.color}-400`}
              >
                <p className={`text-${prompt.color}-800 font-medium`}>
                  {prompt.icon} {prompt.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Journal Entry Form */}
        {isFormVisible && (
          <div
            ref={journalFormRef}
            id="journalEntryFormElement"
            className="bg-white rounded-2xl shadow-lg p-6 mb-8"
          >
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
                  disabled={isSaving}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
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
                  ref={contentInputRef}
                  id="journalContentInputForm"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows="8"
                  disabled={isSaving}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                  placeholder="Write about your day, thoughts, feelings..."
                ></textarea>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center min-w-[120px]"
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

        {/* Recent Journal Entries */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-6">
            Recent Entries
          </h4>
          {isLoading && (
            <Loader show={true} text="Loading entries..." fullPage={false} />
          )}
          {!isLoading && entries.length === 0 && (
            <p className="text-center text-gray-500">
              No journal entries yet. Create one!
            </p>
          )}
          {!isLoading && entries.length > 0 && (
            <div className="space-y-6">
              {entries.map((entry) => (
                <div
                  key={entry._id}
                  className={`border-l-4 border-${getMoodColor(
                    entry.associatedMood
                  )}-500 pl-6 py-4 transition-shadow hover:shadow-md rounded-r-lg`}
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
                      disabled={isSaving || isLoading} // Disable if list is loading or another save is in progress
                      className="text-gray-500 hover:text-purple-600 text-sm disabled:opacity-50 transition-colors"
                      aria-label={`Edit journal entry titled ${entry.title}`}
                    >
                      <i className="fas fa-edit mr-1"></i>Edit
                    </button>
                    <button
                      onClick={() =>
                        openDeleteConfirmModal(entry._id, entry.title)
                      }
                      disabled={isSaving || isLoading}
                      className="text-red-500 hover:text-red-700 text-sm disabled:opacity-50 transition-colors"
                      aria-label={`Delete journal entry titled ${entry.title}`}
                    >
                      <i className="fas fa-trash mr-1"></i>Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          if (!isSaving) setIsConfirmModalOpen(false);
        }} // Prevent closing if action is processing
        onConfirm={confirmAction} // This will be the performDelete(entryId) function
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        confirmButtonClass={modalConfig.confirmButtonClass}
        isProcessing={isSaving} // Disable buttons in modal while deleting
      />
    </div>
  );
}
