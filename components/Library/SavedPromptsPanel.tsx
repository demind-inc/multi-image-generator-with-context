import React from "react";
import { PromptPreset } from "../../types";

interface SavedPromptsPanelProps {
  promptLibrary: PromptPreset[];
  isLoading?: boolean;
  sortedPrompts: PromptPreset[];
  sortDirection: "newest" | "oldest";
  onSortChange: (value: "newest" | "oldest") => void;
  onSelectPromptPreset: (preset: PromptPreset) => void;
  onSavePrompt: () => void;
}

const SavedPromptsPanel: React.FC<SavedPromptsPanelProps> = ({
  promptLibrary,
  isLoading,
  sortedPrompts,
  sortDirection,
  onSortChange,
  onSelectPromptPreset,
  onSavePrompt,
}) => {
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
          {sortedPrompts.length === 0 ? (
            <p className="sidebar__empty">No saved prompts.</p>
          ) : (
            <div className="library-prompt-list custom-scrollbar">
              {sortedPrompts.map((preset) => (
                <button
                  key={preset.id}
                  className="library-prompt-item"
                  onClick={() => onSelectPromptPreset(preset)}
                >
                  <div className="library-prompt-title">{preset.title}</div>
                  {preset.createdAt && (
                    <div className="library-prompt-meta">
                      {new Date(preset.createdAt).toLocaleDateString()}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
          <div className="library-sets-actions">
            <button
              onClick={onSavePrompt}
              className="primary-button primary-button--full"
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
              Upload new prompt
            </button>
          </div>
        </>
      )}
    </section>
  );
};

export default SavedPromptsPanel;
