import React from "react";
import { AppMode, ReferenceImage } from "../../types";
import "./Sidebar.scss";

interface SidebarProps {
  mode: AppMode;
  references: ReferenceImage[];
  fileInputRef: React.RefObject<HTMLInputElement>;
  onUploadClick: () => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveReference: (id: string) => void;
  onSaveReferences: () => void;
  isSavingReferences: boolean;
  onOpenReferenceLibrary: () => void;
  topic: string;
  onTopicChange: (value: string) => void;
  onGenerateStoryboard: () => void;
  isCreatingStoryboard: boolean;
  manualPrompts: string;
  onManualPromptsChange: (value: string) => void;
  onSavePrompt: () => void;
  isSavingPrompt: boolean;
  onOpenPromptLibrary: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  mode,
  references,
  fileInputRef,
  onUploadClick,
  onFileChange,
  onRemoveReference,
  onSaveReferences,
  isSavingReferences,
  onOpenReferenceLibrary,
  topic,
  onTopicChange,
  onGenerateStoryboard,
  isCreatingStoryboard,
  manualPrompts,
  onManualPromptsChange,
  onSavePrompt,
  isSavingPrompt,
  onOpenPromptLibrary,
}) => {
  return (
    <div className="sidebar custom-scrollbar">
      <section className="card">
        <div className="card__header">
          <h3 className="card__title">References</h3>
          <div className="card__actions">
            <button
              onClick={onOpenReferenceLibrary}
              className="card__action card__action--ghost"
            >
              Dataset
            </button>
            <button onClick={onUploadClick} className="card__action">
              Upload
            </button>
          </div>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          multiple
          className="hidden-input"
          accept="image/*"
          onChange={onFileChange}
        />
        <div className="reference-actions">
          <button
            onClick={onSaveReferences}
            disabled={isSavingReferences || references.length === 0}
            className="chip-button"
            title="Save current references for reuse"
          >
            {isSavingReferences ? "Saving..." : "Save to dataset"}
          </button>
        </div>
        {references.length === 0 ? (
          <div onClick={onUploadClick} className="references__placeholder">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            <div>Add Character Images</div>
          </div>
        ) : (
          <div className="references__grid">
            {references.map((ref) => (
              <div key={ref.id} className="reference-thumb">
                <img src={ref.data} alt="Reference" />
                <button
                  onClick={() => onRemoveReference(ref.id)}
                  className="reference-thumb__remove"
                  aria-label="Remove reference"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card sidebar__panel">
        {mode === "slideshow" ? (
          <>
            <h3 className="card__title">Slideshow Story</h3>
            <div className="sidebar__panel-content">
              <div>
                <label className="field-label">Overall Topic</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => onTopicChange(e.target.value)}
                  placeholder="e.g. Benefits of Yoga"
                  className="text-input"
                />
              </div>
              <button
                onClick={onGenerateStoryboard}
                disabled={isCreatingStoryboard || !topic.trim()}
                className="storyboard-button"
              >
                {isCreatingStoryboard ? "Creating Script..." : "Generate Storyboard"}
              </button>
              <div className="sidebar__helper">
                <p className="helper-text">
                  This will automatically create a title slide, informative
                  slides, and a CTA slide.
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            <h3 className="card__title">Manual Scenarios</h3>
            <div className="prompt-actions">
              <button
                onClick={onOpenPromptLibrary}
                className="chip-button chip-button--ghost"
              >
                Use saved prompt
              </button>
              <button
                onClick={onSavePrompt}
                disabled={isSavingPrompt || !manualPrompts.trim()}
                className="chip-button"
              >
                {isSavingPrompt ? "Saving..." : "Save prompt"}
              </button>
            </div>
            <textarea
              value={manualPrompts}
              onChange={(e) => onManualPromptsChange(e.target.value)}
              placeholder="One scene prompt per line..."
              className="textarea-input"
            />
            <p className="helper-text">Describe actions, emotions, and props.</p>
          </>
        )}
      </section>
    </div>
  );
};

export default Sidebar;
