function LoadingOverlay({ progress }) {
  return (
    <div className="loading-overlay">
      <div style={{ textAlign: "center" }}>
        <div className="spinner" />
        <div style={{ marginTop: 12, fontWeight: 600 }}>Generating reviewer...</div>
        <div className="progress-bar">
          <span style={{ width: `${progress || 0}%` }} />
        </div>
      </div>
    </div>
  );
}

export default LoadingOverlay;
