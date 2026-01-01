import React from "react";
import { PromptPreset } from "../../types";
import "./DatasetModal.scss";

interface PromptLibraryModalProps {
  isOpen: boolean;
  items: PromptPreset[];
  isLoading?: boolean;
  onClose: () => void;
  onSelect: (item: PromptPreset) => void;
}

const PromptLibraryModal: React.FC<PromptLibraryModalProps> = ({
  isOpen,
  items,
  isLoading,
  onClose,
  onSelect,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="dataset-modal__backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Prompt library"
    >
      <div className="dataset-modal">
        <div className="dataset-modal__header">
          <div>
            <p className="dataset-modal__eyebrow">Prompt presets</p>
            <h3 className="dataset-modal__title">Reuse saved prompts</h3>
            <p className="dataset-modal__subtitle">
              Drop in a stored prompt set instead of retyping your scenes.
            </p>
          </div>
          <button className="dataset-modal__close" onClick={onClose}>
            ×
          </button>
        </div>

        {isLoading ? (
          <div className="dataset-modal__empty">
            <div className="dataset-modal__spinner" />
            <p className="helper-text" style={{ margin: 0 }}>
              Loading saved prompts...
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="dataset-modal__empty">
            <div className="dataset-modal__empty-icon">📝</div>
            <p>No saved prompts yet</p>
            <p className="helper-text" style={{ margin: 0 }}>
              Save your current prompt list for quick reuse.
            </p>
          </div>
        ) : (
          <div className="dataset-modal__list custom-scrollbar">
            {items.map((item) => (
              <button
                key={item.id}
                className="dataset-prompt"
                onClick={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <div className="dataset-prompt__meta">
                  <div className="dataset-prompt__title">{item.title}</div>
                  {item.createdAt && (
                    <div className="dataset-prompt__date">
                      {new Date(item.createdAt).toLocaleString()}
                    </div>
                  )}
                </div>
                <p className="dataset-prompt__preview">
                  {item.content.length > 220
                    ? `${item.content.slice(0, 220)}…`
                    : item.content}
                </p>
                <div className="dataset-prompt__cta">Use this prompt</div>
              </button>
            ))}
          </div>
        )}

        <div className="dataset-modal__footer">
          <button className="primary-button primary-button--ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptLibraryModal;
