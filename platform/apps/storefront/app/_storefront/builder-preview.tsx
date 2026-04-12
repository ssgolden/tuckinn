type BuilderPreviewProps = {
  basketCount: number;
  onStartBuilding: () => void;
};

const previewLayers = [
  { label: "Bread", value: "Soft roll or wrap" },
  { label: "Fillings", value: "Fresh deli layers" },
  { label: "Finish", value: "Salad, sauce, extras" }
];

export function BuilderPreview({ basketCount, onStartBuilding }: BuilderPreviewProps) {
  return (
    <aside className="builder-preview" aria-label="Sandwich builder preview">
      <div className="builder-preview-topline">
        <span>Sandwich Studio</span>
        <strong>{basketCount ? `${basketCount} in basket` : "Ready to build"}</strong>
      </div>
      <div className="builder-preview-card">
        <p className="section-kicker">Guided builder</p>
        <h2>Your lunch, layer by layer</h2>
        <div className="builder-preview-layers">
          {previewLayers.map(layer => (
            <div className="builder-preview-layer" key={layer.label}>
              <span>{layer.label}</span>
              <strong>{layer.value}</strong>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="primary-action builder-preview-action"
          aria-label="Open the Sandwich Studio builder"
          onClick={onStartBuilding}
        >
          Start Building
        </button>
      </div>
    </aside>
  );
}
