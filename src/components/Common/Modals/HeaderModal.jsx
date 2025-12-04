import { useState, useEffect } from "react";

const SelectHeaderModal = ({ isOpen, onClose, onSelect }) => {
  const [headers, setHeaders] = useState([]);

  useEffect(() => {
    const storedHeaders = JSON.parse(localStorage.getItem("headers")) || [];
    setHeaders(storedHeaders);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-lg font-semibold mb-4">Select a Header</h2>
        {headers.length === 0 ? (
          <p>No headers found.</p>
        ) : (
          headers.map((header) => (
            <div key={header.id} className="mb-2 border p-2 rounded">
              <p className="font-medium">{header.title}</p>
              <button onClick={() => onSelect(header)} className="bg-green-500 text-white px-3 py-1 rounded mt-2">
                Select
              </button>
            </div>
          ))
        )}
        <button onClick={onClose} className="mt-4 bg-red-500 text-white px-4 py-2 rounded">Close</button>
      </div>
    </div>
  );
};

export default SelectHeaderModal;
