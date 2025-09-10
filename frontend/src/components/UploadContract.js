import React, { useState } from "react";
import { uploadContract } from "../api";

function UploadContract() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    if (!file) return alert("Please select a file");

    setUploading(true);
    setMessage("");
    try {
      const res = await uploadContract(file);
      setMessage(`Uploaded. Contract ID: ${res.data.contract_id}`);
    } catch (err) {
      setMessage("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h2>Upload Contract</h2>
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? "Uploading..." : "Upload"}
      </button>
      <p>{message}</p>
    </div>
  );
}

export default UploadContract;
