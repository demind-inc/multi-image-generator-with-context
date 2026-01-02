import React, { useMemo, useState, useRef } from "react";
import { ReferenceSet, ReferenceImage } from "../../types";

interface SavedImagesPanelProps {
  referenceLibrary: ReferenceSet[];
  isLoading?: boolean;
  sortDirection: "newest" | "oldest";
  onSortChange: (value: "newest" | "oldest") => void;
  onSelectReferenceSet: (sets: ReferenceSet[]) => void;
  onSaveNewSet: (images: ReferenceImage[], label?: string) => Promise<void>;
}

const SavedImagesPanel: React.FC<SavedImagesPanelProps> = ({
  referenceLibrary,
  isLoading,
  sortDirection,
  onSortChange,
  onSelectReferenceSet,
  onSaveNewSet,
}) => {
  const [isAddingNewSet, setIsAddingNewSet] = useState(false);
  const [newSetImages, setNewSetImages] = useState<ReferenceImage[]>([]);
  const [newSetLabel, setNewSetLabel] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sortedSets = useMemo(() => {
    return [...referenceLibrary].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortDirection === "newest" ? bTime - aTime : aTime - bTime;
    });
  }, [referenceLibrary, sortDirection]);

  const handleUploadClick = () => {
    if (!isAddingNewSet) {
      setIsAddingNewSet(true);
      setNewSetImages([]);
      setNewSetLabel("");
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewSetImages((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substr(2, 9),
            data: reader.result as string,
            mimeType: file.type,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeNewSetImage = (id: string) => {
    setNewSetImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleSaveNewSet = async () => {
    if (newSetImages.length === 0) {
      alert("Please upload at least one image.");
      return;
    }
    setIsSaving(true);
    try {
      await onSaveNewSet(newSetImages, newSetLabel.trim() || undefined);
      setIsAddingNewSet(false);
      setNewSetImages([]);
      setNewSetLabel("");
    } catch (error) {
      console.error("Failed to save new set:", error);
      alert("Could not save images. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelNewSet = () => {
    setIsAddingNewSet(false);
    setNewSetImages([]);
    setNewSetLabel("");
  };

  return (
    <section className="card">
      <div className="card__header">
        <h3 className="card__title">Saved images</h3>
        <div className="card__actions">
          <div className="library-filter">
            <label htmlFor="library-sort" className="library-filter__label">
              Sort
            </label>
            <select
              id="library-sort"
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
        <p className="sidebar__empty">Loading saved images...</p>
      ) : (
        <>
          <div className="library-sets-list custom-scrollbar">
            {isAddingNewSet && (
              <div className="library-set-item library-set-item--new">
                <div className="library-set-header">
                  <input
                    type="text"
                    className="library-set-title-input"
                    placeholder="Set name (optional)"
                    value={newSetLabel}
                    onChange={(e) => setNewSetLabel(e.target.value)}
                  />
                  <div className="library-set-actions">
                    <button
                      onClick={handleSaveNewSet}
                      disabled={isSaving || newSetImages.length === 0}
                      className="library-set-action-btn library-set-action-btn--save"
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={handleCancelNewSet}
                      disabled={isSaving}
                      className="library-set-action-btn library-set-action-btn--cancel"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                <div className="library-set-images">
                  {newSetImages.map((img) => (
                    <div
                      key={img.id}
                      className="library-set-image-thumb library-set-image-thumb--new"
                    >
                      <img src={img.data} alt="New reference" />
                      <button
                        onClick={() => removeNewSetImage(img.id)}
                        className="library-set-image-remove"
                        aria-label="Remove image"
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
                  <button
                    onClick={handleUploadClick}
                    className="library-set-image-upload-placeholder"
                  >
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
                    <span>Add images</span>
                  </button>
                </div>
              </div>
            )}
            {sortedSets.length === 0 && !isAddingNewSet ? (
              <p className="sidebar__empty">No saved reference images.</p>
            ) : (
              sortedSets.map((set) => (
                <div key={set.setId} className="library-set-item">
                  <div className="library-set-header">
                    <h4 className="library-set-title">
                      {set.label ||
                        `Reference set (${new Date(
                          set.createdAt || Date.now()
                        ).toLocaleDateString()})`}
                    </h4>
                    {set.createdAt && (
                      <span className="library-set-date">
                        {new Date(set.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="library-set-images">
                    {set.images.map((img) => (
                      <button
                        key={img.id}
                        className="library-set-image-thumb"
                        onClick={() => onSelectReferenceSet([set])}
                        title={set.label || "Reference set"}
                      >
                        <img src={img.url} alt={set.label || "Reference"} />
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="library-sets-actions">
            <input
              type="file"
              ref={fileInputRef}
              multiple
              className="hidden-input"
              accept="image/*"
              onChange={handleFileUpload}
            />
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
              {isAddingNewSet ? "Add more images" : "Upload new set"}
            </button>
          </div>
        </>
      )}
    </section>
  );
};

export default SavedImagesPanel;
