import React, { useState } from "react";
import { PromptPreset } from "../../types";

interface SavedPromptsPanelProps {
  promptLibrary: PromptPreset[];
  isLoading?: boolean;
  sortedPrompts: PromptPreset[];
  sortDirection: "newest" | "oldest";
  onSortChange: (value: "newest" | "oldest") => void;
  onSelectPromptPreset: (preset: PromptPreset) => void;
  onSaveNewPrompt: (title: string, content: string) => Promise<void>;
  onUpdatePromptPreset: (
    presetId: string,
    title: string,
    content: string
  ) => Promise<void>;
}

const SavedPromptsPanel: React.FC<SavedPromptsPanelProps> = ({
  promptLibrary,
  isLoading,
  sortedPrompts,
  sortDirection,
  onSortChange,
  onSelectPromptPreset,
  onSaveNewPrompt,
  onUpdatePromptPreset,
}) => {
  const [isAddingNewPrompt, setIsAddingNewPrompt] = useState(false);
  const [newPromptTitle, setNewPromptTitle] = useState("");
  const [newPromptContent, setNewPromptContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [editingPromptTitle, setEditingPromptTitle] = useState("");
  const [editingPromptContent, setEditingPromptContent] = useState("");
  const [isUpdatingPrompt, setIsUpdatingPrompt] = useState(false);

  const handleSaveNewPrompt = async () => {
    if (!newPromptTitle.trim()) {
      alert("Please enter a title for the prompt.");
      return;
    }
    if (!newPromptContent.trim()) {
      alert("Please enter prompt content.");
      return;
    }
    setIsSaving(true);
    try {
      await onSaveNewPrompt(newPromptTitle.trim(), newPromptContent.trim());
      setIsAddingNewPrompt(false);
      setNewPromptTitle("");
      setNewPromptContent("");
    } catch (error) {
      console.error("Failed to save new prompt:", error);
      alert("Could not save prompt. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelNewPrompt = () => {
    setIsAddingNewPrompt(false);
    setNewPromptTitle("");
    setNewPromptContent("");
  };

  const startEditingPrompt = (preset: PromptPreset) => {
    setEditingPromptId(preset.id);
    setEditingPromptTitle(preset.title);
    setEditingPromptContent(preset.content);
  };

  const handleSaveEditedPrompt = async () => {
    if (!editingPromptId) return;
    if (!editingPromptTitle.trim()) {
      alert("Please enter a title for the prompt.");
      return;
    }
    if (!editingPromptContent.trim()) {
      alert("Please enter prompt content.");
      return;
    }
    setIsUpdatingPrompt(true);
    try {
      await onUpdatePromptPreset(
        editingPromptId,
        editingPromptTitle.trim(),
        editingPromptContent.trim()
      );
      setEditingPromptId(null);
      setEditingPromptTitle("");
      setEditingPromptContent("");
    } catch (error) {
      console.error("Failed to update prompt preset:", error);
      alert("Could not update prompt. Please try again.");
    } finally {
      setIsUpdatingPrompt(false);
    }
  };

  const handleCancelEditPrompt = () => {
    setEditingPromptId(null);
    setEditingPromptTitle("");
    setEditingPromptContent("");
  };

  const handleUploadClick = () => {
    if (!isAddingNewPrompt) {
      setIsAddingNewPrompt(true);
      setNewPromptTitle("");
      setNewPromptContent("");
    }
  };

  return (
    <section className="card">
      <div className="card__header">
        <h3 className="card__title">Saved prompts</h3>
        <div className="card__actions">
          <div className="library-filter">
            <label htmlFor="prompt-sort" className="library-filter__label">
              Sort
            </label>
            <select
              id="prompt-sort"
              className="library-filter__select"
              value={sortDirection}
              onChange={(e) =>
                onSortChange(e.target.value as "newest" | "oldest")
              }
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>
      </div>
      {isLoading ? (
        <p className="sidebar__empty">Loading prompts...</p>
      ) : (
        <>
          <div className="library-prompt-list custom-scrollbar">
            {isAddingNewPrompt && (
              <div className="library-prompt-item library-prompt-item--new">
                <div className="library-prompt-header">
                  <input
                    type="text"
                    className="library-prompt-title-input"
                    placeholder="Prompt title (required)"
                    value={newPromptTitle}
                    onChange={(e) => setNewPromptTitle(e.target.value)}
                    required
                  />
                  <div className="library-prompt-actions">
                    <button
                      onClick={handleSaveNewPrompt}
                      disabled={
                        isSaving ||
                        !newPromptTitle.trim() ||
                        !newPromptContent.trim()
                      }
                      className="library-prompt-action-btn library-prompt-action-btn--save"
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={handleCancelNewPrompt}
                      disabled={isSaving}
                      className="library-prompt-action-btn library-prompt-action-btn--cancel"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                <textarea
                  className="library-prompt-content-input"
                  placeholder="Enter prompt content (required)"
                  value={newPromptContent}
                  onChange={(e) => setNewPromptContent(e.target.value)}
                  rows={4}
                  required
                />
              </div>
            )}
            {sortedPrompts.length === 0 && !isAddingNewPrompt ? (
              <p className="sidebar__empty">No saved prompts.</p>
            ) : (
              sortedPrompts.map((preset) => {
                const isEditing = editingPromptId === preset.id;
                return isEditing ? (
                  <div
                    key={preset.id}
                    className="library-prompt-item library-prompt-item--editing"
                  >
                    <div className="library-prompt-header">
                      <input
                        type="text"
                        className="library-prompt-title-input"
                        placeholder="Prompt title (required)"
                        value={editingPromptTitle}
                        onChange={(e) => setEditingPromptTitle(e.target.value)}
                        disabled={isUpdatingPrompt}
                        required
                      />
                      <div className="library-prompt-actions">
                        <button
                          onClick={handleSaveEditedPrompt}
                          disabled={
                            isUpdatingPrompt ||
                            !editingPromptTitle.trim() ||
                            !editingPromptContent.trim()
                          }
                          className="library-prompt-action-btn library-prompt-action-btn--save"
                        >
                          {isUpdatingPrompt ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={handleCancelEditPrompt}
                          disabled={isUpdatingPrompt}
                          className="library-prompt-action-btn library-prompt-action-btn--cancel"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                    <textarea
                      className="library-prompt-content-input"
                      placeholder="Enter prompt content (required)"
                      value={editingPromptContent}
                      onChange={(e) => setEditingPromptContent(e.target.value)}
                      rows={4}
                      disabled={isUpdatingPrompt}
                      required
                    />
                  </div>
                ) : (
                  <button
                    key={preset.id}
                    className="library-prompt-item"
                    onClick={() => onSelectPromptPreset(preset)}
                  >
                    <div className="library-prompt-header">
                      <div className="library-prompt-title">
                        {preset.title}
                      </div>
                      <div className="library-prompt-meta">
                        {preset.createdAt && (
                          <span>
                            {new Date(preset.createdAt).toLocaleDateString()}
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditingPrompt(preset);
                          }}
                          className="library-prompt-action-btn"
                          disabled={isSaving || isUpdatingPrompt}
                          title="Edit prompt"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                    <div className="library-prompt-content">
                      {preset.content}
                    </div>
                  </button>
                );
              })
            )}
          </div>
          <div className="library-sets-actions">
            <button
              onClick={handleUploadClick}
              className="primary-button primary-button--full"
              disabled={isSaving}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              {isAddingNewPrompt ? "Add more prompts" : "Upload new prompt"}
            </button>
          </div>
        </>
      )}
    </section>
  );
};

export default SavedPromptsPanel;
