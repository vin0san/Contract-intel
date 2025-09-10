import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [uploading, setUploading] = useState(false);

  const API_BASE =
  window.location.hostname === "localhost"
    ? "http://127.0.0.1:8000" // when running frontend locally
    : "http://backend:8000";   // when running via Docker


  // Fetch contracts (with auto-refresh every 3s)
  const fetchContracts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/contracts`);
      setContracts(res.data);
    } catch (err) {
      console.error("Error fetching contracts:", err);
    }
  };

  useEffect(() => {
    fetchContracts();
    const interval = setInterval(fetchContracts, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${API_BASE}/contracts/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert(`Uploaded. Contract ID: ${res.data.contract_id}`);
      setFile(null);
      fetchContracts();
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  const fetchDetails = async (contractId) => {
    try {
      const res = await axios.get(`${API_BASE}/contracts/${contractId}`);
      setSelectedContract(res.data);
    } catch (err) {
      console.error("Error fetching details:", err);
    }
  };

  return (
    <div className="app-container">
      <h1 className="app-title">Contract Intelligence</h1>

      {/* Top Section → Upload + Contracts */}
      <div className="top-section">
        {/* Upload Box */}
        <div className="upload-box">
          <h2>Upload Contract</h2>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files[0])}
            className="file-input"
            disabled={uploading}
          />
          <button
            onClick={handleUpload}
            className="upload-btn"
            disabled={!file || uploading}
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>

        {/* Contracts List */}
        <div className="contracts-list">
          <h2>Contracts</h2>
          <div className="contracts-items">
            {contracts.length === 0 ? (
              <p>No contracts found.</p>
            ) : (
              <ul>
                {contracts.map((c) => (
                  <li
                    key={c.contract_id}
                    className={`contract-item ${
                      selectedContract?.contract_id === c.contract_id
                        ? "selected"
                        : ""
                    }`}
                    onClick={() => fetchDetails(c.contract_id)}
                  >
                    <strong>{c.filename}</strong> - {c.status} ({c.progress}%)

                    {/* Progress Bar */}
                    <div className="progress-bar-bg">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${c.progress}%`,
                          backgroundColor:
                            c.status === "completed" ? "green" : "orange",
                        }}
                      ></div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section → Contract Details */}
      <div className="details-box">
        <h2>Contract Details</h2>
        {selectedContract ? (
          <div>
            <p>
              <strong>Filename:</strong> {selectedContract.filename}
            </p>
            <p>
              <strong>Status:</strong> {selectedContract.status}
            </p>

            <h3>Parsed Data</h3>
            <pre className="parsed-data">
              {JSON.stringify(selectedContract.parsed_data, null, 2)}
            </pre>

            {/* Highlight Missing Fields */}
            {selectedContract.parsed_data?.missing_fields?.length > 0 && (
              <div className="missing-fields">
                <h4>⚠ Missing Fields</h4>
                <ul>
                  {selectedContract.parsed_data.missing_fields.map(
                    (field, idx) => (
                      <li key={idx}>{field}</li>
                    )
                  )}
                </ul>
              </div>
            )}

            <a
              href={`${API_BASE}/contracts/${selectedContract.contract_id}/download`}
              className="download-link"
            >
              Download PDF
            </a>
          </div>
        ) : (
          <p>Select a contract to view details.</p>
        )}
      </div>
    </div>
  );
}

export default App;
