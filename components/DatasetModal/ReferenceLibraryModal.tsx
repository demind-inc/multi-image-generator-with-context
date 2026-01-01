import React, { useEffect, useMemo, useState } from "react";
import { ReferenceLibraryItem } from "../../types";
import "./DatasetModal.scss";

interface ReferenceLibraryModalProps {
  isOpen: boolean;
  items: ReferenceLibraryItem[];
  isLoading?: boolean;
  onClose: () => void;
  onSelect: (items: ReferenceLibraryItem[]) => void;
}

const ReferenceLibraryModal: React.FC<ReferenceLibraryModalProps> = ({
  isOpen,
  items,
  isLoading,
  onClose,
  onSelect,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isOpen) {
      setSelectedIds(new Set());
    }
  }, [isOpen]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(item.id)),
    [items, selectedIds]
  );

  const handleApply = () => {
    if (!selectedItems.length) return;
    onSelect(selectedItems);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="dataset-modal__backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Reference library"
    >
      <div className="dataset-modal">
        <div className="dataset-modal__header">
          <div>
            <p className="dataset-modal__eyebrow">Reference library</p>
            <h3 className="dataset-modal__title">Pick saved images</h3>
            <p className="dataset-modal__subtitle">
              Reuse your stored character shots to keep scenes consistent.
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
              Loading your references...
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="dataset-modal__empty">
            <div className="dataset-modal__empty-icon">📁</div>
            <p>No saved references yet</p>
            <p className="helper-text" style={{ margin: 0 }}>
              Save your current uploads to quickly reuse them later.
            </p>
          </div>
        ) : (
          <div className="dataset-modal__grid custom-scrollbar">
            {items.map((item) => {
              const isSelected = selectedIds.has(item.id);
              return (
                <button
                  key={item.id}
                  className={`dataset-card ${isSelected ? "is-selected" : ""}`}
                  onClick={() => toggleSelection(item.id)}
                >
                  <div className="dataset-card__thumb">
                    <img
                      src={item.data}
                      alt={item.label || "Reference"}
                      onError={(e) => {
                        console.error("Failed to load image:", item.id, item.data?.substring(0, 50));
                        // Fallback to a placeholder if image fails to load
                        e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3EImage%3C/text%3E%3C/svg%3E";
                      }}
                    />
                    <span className="dataset-card__check">
                      {isSelected ? "✓" : "+"}
                    </span>
                  </div>
                  <div className="dataset-card__meta">
                    <div className="dataset-card__title">
                      {item.label || "Untitled reference"}
                    </div>
                    {item.createdAt && (
                      <div className="dataset-card__date">
                        {new Date(item.createdAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="dataset-modal__footer">
          <button
            className="primary-button"
            onClick={handleApply}
            disabled={!selectedItems.length}
          >
            Use {selectedItems.length || ""} selected
          </button>
          <button className="primary-button primary-button--ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReferenceLibraryModal;
