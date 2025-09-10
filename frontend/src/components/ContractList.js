import React, { useEffect, useState } from "react";
import { getContracts } from "../api";

function ContractList({ onSelect }) {
  const [contracts, setContracts] = useState([]);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    const res = await getContracts();
    setContracts(res.data);
  };

  return (
    <div>
      <h2>Contracts</h2>
      <ul>
        {contracts.map((c) => (
          <li key={c.contract_id}>
            <button onClick={() => onSelect(c.contract_id)}>
              {c.filename} - {c.status} ({c.progress}%)
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ContractList;
