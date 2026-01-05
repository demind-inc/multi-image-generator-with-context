import React from "react";
import { PromptPreset } from "../../types";
import styles from "./DatasetModal.module.scss";

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

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={styles['dataset-modal__backdrop']}
      role="dialog"
      aria-modal="true"
      aria-label="Prompt library"
      onClick={handleBackdropClick}
    >
      <div className={styles['dataset-modal']}>
        <div className={styles['dataset-modal__header']}>
          <div>
            <p className={styles['dataset-modal__eyebrow']}>Prompt presets</p>
            <h3 className={styles['dataset-modal__title']}>Reuse saved prompts</h3>
            <p className={styles['dataset-modal__subtitle']}>
              Drop in a stored prompt set instead of retyping your scenes.
            </p>
          </div>
          <button className={styles['dataset-modal__close']} onClick={onClose}>
            ×
          </button>
        </div>

        {isLoading ? (
          <div className={styles['dataset-modal__empty']}>
            <div className={styles['dataset-modal__spinner']} />
            <p className="text text--helper" style={{ margin: 0 }}>
              Loading saved prompts...
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className={styles['dataset-modal__empty']}>
            <div className={styles['dataset-modal__empty-icon']}>📝</div>
            <p>No saved prompts yet</p>
            <p className="text text--helper" style={{ margin: 0 }}>
              Save your current prompt list for quick reuse.
            </p>
          </div>
        ) : (
          <div className={`${styles['dataset-modal__list']} custom-scrollbar`}>
            {items.map((item) => (
              <button
                key={item.id}
                className={styles['dataset-prompt']}
                onClick={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <div className={styles['dataset-prompt__meta']}>
                  <div className={styles['dataset-prompt__title']}>{item.title}</div>
                  {item.createdAt && (
                    <div className={styles['dataset-prompt__date']}>
                      {new Date(item.createdAt).toLocaleString()}
                    </div>
                  )}
                </div>
                <p className={styles['dataset-prompt__preview']}>
                  {item.content.length > 220
                    ? `${item.content.slice(0, 220)}…`
                    : item.content}
                </p>
                <div className={styles['dataset-prompt__cta']}>Use this prompt</div>
              </button>
            ))}
          </div>
        )}

        <div className={styles['dataset-modal__footer']}>
          <button
            className="primary-button primary-button--ghost"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptLibraryModal;
