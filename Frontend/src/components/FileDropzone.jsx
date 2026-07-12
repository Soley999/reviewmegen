import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB

function FileDropzone({ onFileSelected, file }) {
  const [error, setError] = useState("");

  const onDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      setError("");

      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors.some(e => e.code === "file-too-large")) {
          setError("File is too large. Maximum size is 200MB.");
        } else if (rejection.errors.some(e => e.code === "file-invalid-type")) {
          setError("Invalid file type. Please upload PDF, DOCX, or TXT files only.");
        } else {
          setError("File upload failed. Please try again.");
        }
        return;
      }

      if (acceptedFiles.length) {
        const selectedFile = acceptedFiles[0];

        if (selectedFile.size === 0) {
          setError("The selected file is empty. Please choose a file with content.");
          return;
        }

        if (selectedFile.size > MAX_FILE_SIZE) {
          setError("File is too large. Maximum size is 200MB.");
          return;
        }

        onFileSelected(selectedFile);
      }
    },
    [onFileSelected]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
        ".docx"
      ],
      "text/plain": [".txt"]
    },
    multiple: false,
    maxSize: MAX_FILE_SIZE
  });

  return (
    <div>
      <div
        className={`dropzone ${isDragActive ? "dropzone-active" : ""} ${isDragReject ? "dropzone-reject" : ""}`}
        {...getRootProps()}
      >
        <input {...getInputProps()} />
        {file ? (
          <div>
            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📄</div>
            <strong>{file.name}</strong>
            <div style={{ color: "var(--muted)", marginTop: "4px" }}>
              {file.size < 1024 * 1024
                ? `${Math.round(file.size / 1024)} KB`
                : `${(file.size / (1024 * 1024)).toFixed(2)} MB`}
            </div>
            <div className="dropzone-hint" style={{ marginTop: "12px" }}>Click to replace the file</div>
          </div>
        ) : (
          <div>
            <div className="dropzone-icon" aria-hidden="true">📁</div>
            <div className="dropzone-title">
              {isDragActive
                ? isDragReject
                  ? "Invalid file type"
                  : "Drop your file here"
                : "Drag and drop your file"}
            </div>
            <div className="dropzone-subtitle">or click to browse</div>
            <div className="dropzone-badges">
              <span className="file-badge">PDF</span>
              <span className="file-badge">DOCX</span>
              <span className="file-badge">TXT</span>
            </div>
            <div className="dropzone-hint">Up to 200 MB per file</div>
          </div>
        )}
      </div>
      {error && (
        <div className="notice" style={{ marginTop: "12px", backgroundColor: "#fee", borderColor: "#fcc" }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}

export default FileDropzone;
