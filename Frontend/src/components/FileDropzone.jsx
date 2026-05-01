import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

function FileDropzone({ onFileSelected, file }) {
  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles.length) {
        onFileSelected(acceptedFiles[0]);
      }
    },
    [onFileSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
        ".docx"
      ],
      "text/plain": [".txt"]
    },
    multiple: false
  });

  return (
    <div
      className={`dropzone ${isDragActive ? "dropzone-active" : ""}`}
      {...getRootProps()}
    >
      <input {...getInputProps()} />
      {file ? (
        <div>
          <strong>{file.name}</strong>
          <div>{Math.round(file.size / 1024)} KB</div>
          <div className="dropzone-hint">Click to replace the file.</div>
        </div>
      ) : (
        <div>
          <div className="dropzone-icon" aria-hidden="true">FILE</div>
          <div className="dropzone-title">
            {isDragActive ? "Drop your file here" : "Drag and drop your file"}
          </div>
          <div className="dropzone-subtitle">or click to browse</div>
          <div className="dropzone-badges">
            <span className="file-badge">PDF</span>
            <span className="file-badge">DOCX</span>
            <span className="file-badge">TXT</span>
          </div>
          <div className="dropzone-hint">Up to 12 MB per file.</div>
        </div>
      )}
    </div>
  );
}

export default FileDropzone;
