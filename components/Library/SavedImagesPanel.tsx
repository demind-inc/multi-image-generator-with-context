import React from "react";
import { ReferenceSet } from "../../types";

interface SavedImagesPanelProps {
  referenceLibrary: ReferenceSet[];
  isLoading?: boolean;
  sortedImages: Array<
    ReferenceSet["images"][number] & { setLabel?: string | null; setId?: string }
  >;
  sortDirection: "newest" | "oldest";
  onSortChange: (value: "newest" | "oldest") => void;
  onSelectReferenceSet: (sets: ReferenceSet[]) => void;
}

const SavedImagesPanel: React.FC<SavedImagesPanelProps> = ({
  referenceLibrary,
  isLoading,
  sortedImages,
  sortDirection,
  onSortChange,
  onSelectReferenceSet,
}) => {
  return (
    <section className="card">
      <div className="card__header">
        <h3 className="card__title">Saved images</h3>
        <div className="library-filter">
          <label htmlFor="library-sort" className="library-filter__label">
            Sort
          </label>
          <select
            id="library-sort"
            className="library-filter__select"
            value={sortDirection}
            onChange={(e) => onSortChange(e.target.value as "newest" | "oldest")}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </div>
      {isLoading ? (
        <p className="sidebar__empty">Loading saved images...</p>
      ) : sortedImages.length === 0 ? (
        <p className="sidebar__empty">No saved reference images.</p>
      ) : (
        <div className="library-image-grid custom-scrollbar">
          {sortedImages.map((img) => {
            const parentSet =
              referenceLibrary.find((set) => set.setId === img.setId) ||
              referenceLibrary.find((set) => set.images.some((i) => i.id === img.id));
            return (
              <button
                key={img.id}
                className="library-image-thumb"
                onClick={() => (parentSet ? onSelectReferenceSet([parentSet]) : null)}
                title={img.setLabel || "Reference set"}
              >
                <img src={img.url} alt={img.setLabel || "Reference"} />
                <span className="library-image-label">
                  {img.setLabel || "Reference set"}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default SavedImagesPanel;
