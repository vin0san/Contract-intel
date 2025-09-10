import React, { useEffect, useState } from "react";
import { getContractDetails, downloadContract } from "../api";

function ContractDetails({ contractId }) {
  const [details, setDetails] = useState(null);

  useEffect(() => {
    fetchDetails();
  }, [contractId]);

  const fetchDetails = async () => {
    const res = await getContractDetails(contractId);
    setDetails(res.data);
  };

  const handleDownload = async () => {
    const res = await downloadContract(contractId);
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", details.filename);
    document.body.appendChild(link);
    link.click();
  };

  if (!details) return <p>Loading...</p>;

  return (
    <div>
      <h2>Contract Details</h2>
      <p><b>Filename:</b> {details.filename}</p>
      <p><b>Status:</b> {details.status}</p>

      <h3>Parsed Data</h3>
      <pre>{JSON.stringify(details.parsed_data, null, 2)}</pre>

      <button onClick={handleDownload}>Download PDF</button>
    </div>
  );
}

export default ContractDetails;
