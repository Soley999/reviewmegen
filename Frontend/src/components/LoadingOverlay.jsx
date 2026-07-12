import { useState, useEffect } from "react";

const PHASES = [
  { threshold: 0, message: "Uploading file..." },
  { threshold: 15, message: "Extracting content..." },
  { threshold: 35, message: "Analyzing document..." },
  { threshold: 55, message: "Generating reviewer..." },
  { threshold: 70, message: "Creating quizzes..." },
  { threshold: 85, message: "Preparing final exam..." },
  { threshold: 95, message: "Almost done!" }
];

function LoadingOverlay({ progress = 0 }) {
  const [simulatedProgress, setSimulatedProgress] = useState(0);

  useEffect(() => {
    if (progress >= 100) {
      setSimulatedProgress(100);
      return;
    }

    // When actual progress is reported, jump to it
    if (progress > simulatedProgress) {
      setSimulatedProgress(progress);
      return;
    }

    // Otherwise simulate slow progress to keep the UI alive
    const interval = setInterval(() => {
      setSimulatedProgress((prev) => {
        if (prev >= 92) return prev;
        return prev + 0.4;
      });
    }, 250);
    return () => clearInterval(interval);
  }, [progress, simulatedProgress]);

  const displayProgress = Math.min(Math.max(simulatedProgress, progress), 100);

  const currentPhase = PHASES.reduce(
    (msg, phase) => (displayProgress >= phase.threshold ? phase.message : msg),
    PHASES[0].message
  );

  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="spinner" />
        <div className="loading-text">{currentPhase}</div>
        <div className="loading-subtext">
          Please wait while we process your document and create your study materials.
        </div>
        <div className="progress-bar">
          <span style={{ width: `${displayProgress}%` }} />
        </div>
        <div className="progress-percentage">{Math.round(displayProgress)}%</div>
      </div>
    </div>
  );
}

export default LoadingOverlay;
