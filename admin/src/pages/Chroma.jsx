import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Trash2, FolderMinus, Database, Loader, CheckSquare, Square } from "lucide-react";
import ITHelpDeskWidget from "../widget/ChatWidget";

const Chroma = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Track selected document IDs
  const [selectedDocIds, setSelectedDocIds] = useState([]);

  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/chroma/db/collections`);
      if (!response.ok) throw new Error("Failed to fetch database collections.");
      const data = await response.json();
      setCollections(data.collections || []);
      setSelectedDocIds([]); // Reset selection on fresh fetch
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  // --- CHECKBOX SELECTION LOGIC ---
  const handleSelectRow = (docId) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const handleSelectAllInCollection = (collectionDocs, collectionName) => {
    const docIds = collectionDocs.map((doc) => doc.id);
    const allSelected = docIds.every((id) => selectedDocIds.includes(id));

    if (allSelected) {
      // Deselect all for this collection
      setSelectedDocIds((prev) => prev.filter((id) => !docIds.includes(id)));
    } else {
      // Select all for this collection
      setSelectedDocIds((prev) => [...new Set([...prev, ...docIds])]);
    }
  };

  // --- SINGLE DELETE ---
  const handleDeleteDocument = async (collectionName, documentId) => {
    if (!window.confirm("Are you sure you want to delete this document chunk?")) return;

    try {
      const response = await fetch(
        `${baseUrl}/chroma/db/collections/${collectionName}/documents/${documentId}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to delete the document.");

      toast.success("Document deleted successfully");
      
      // Update local state
      setCollections((prev) =>
        prev.map((col) => {
          if (col.name === collectionName) {
            return {
              ...col,
              documents: col.documents.filter((doc) => doc.id !== documentId),
            };
          }
          return col;
        })
      );
      setSelectedDocIds((prev) => prev.filter((id) => id !== documentId));
    } catch (err) {
      toast.error(err.message);
    }
  };

  // --- BULK DELETE ---
  const handleBulkDelete = async (collectionName, collectionDocs) => {
    // Filter selected IDs that belong to this collection specifically
    const collectionDocIds = collectionDocs.map((d) => d.id);
    const idsToDelete = selectedDocIds.filter((id) => collectionDocIds.includes(id));

    if (idsToDelete.length === 0) {
      toast.info("No documents selected in this collection");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete the ${idsToDelete.length} selected documents?`)) {
      return;
    }

    try {
      const response = await fetch(
        `${baseUrl}/chroma/db/collections/${collectionName}/documents/bulk-delete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ document_ids: idsToDelete }),
        }
      );

      if (!response.ok) throw new Error("Bulk deletion failed.");

      toast.success(`Successfully deleted ${idsToDelete.length} documents!`);

      // Update state locally
      setCollections((prev) =>
        prev.map((col) => {
          if (col.name === collectionName) {
            return {
              ...col,
              documents: col.documents.filter((doc) => !idsToDelete.includes(doc.id)),
            };
          }
          return col;
        })
      );

      // Clear deleted IDs from selection state
      setSelectedDocIds((prev) => prev.filter((id) => !idsToDelete.includes(id)));
    } catch (err) {
      toast.error(err.message);
    }
  };

  // --- COLLECTION DELETE ---
  const handleDeleteCollection = async (collectionName) => {
    if (!window.confirm(`CRITICAL:\nAre you sure you want to delete "${collectionName}"?`)) return;

    try {
      const response = await fetch(
        `${baseUrl}/chroma/db/collections/${collectionName}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to delete collection.");

      toast.success(`Collection ${collectionName} deleted successfully`);
      setCollections((prev) => prev.filter((col) => col.name !== collectionName));
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="p-6 text-gray-200 bg-[#0B0F19] min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-10 px-3">
        <Database className="text-indigo-500" size={32} />
        <div>
          <h1 className="text-3xl font-semibold text-gray-100">ChromaDB Admin Panel</h1>
          <p className="text-xs text-gray-400 mt-1">
            Manage your vector database collections and view embedded document chunks.
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader className="animate-spin text-indigo-500" size={40} />
          <p className="text-sm text-gray-400">Loading database store...</p>
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-950/30 border border-red-800 rounded-lg p-6 mx-3 mb-6">
          <p className="text-sm text-red-400">Error connecting to database: {error}</p>
          <button onClick={fetchCollections} className="mt-4 px-4 py-2 bg-red-900/50 text-xs transition">
            Retry Connection
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="flex flex-col gap-8 mx-3">
          {collections.length === 0 ? (
            <div className="text-center border border-dashed border-gray-700 rounded-lg py-16">
              <p className="text-gray-500 text-sm">No active collections found.</p>
            </div>
          ) : (
            collections.map((col) => {
              // Calculate selection checks for "Select All"
              const colDocIds = col.documents.map((d) => d.id);
              const selectedInThisCol = selectedDocIds.filter((id) => colDocIds.includes(id));
              const isAllSelected = colDocIds.length > 0 && colDocIds.every((id) => selectedDocIds.includes(id));

              return (
                <div key={col.name} className="bg-[#111827] rounded-lg border border-gray-800 overflow-hidden">
                  
                  {/* Collection Action Bar */}
                  <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-400 text-sm">📦</span>
                      <h3 className="text-lg font-semibold text-gray-200">Collection: {col.name}</h3>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {/* Bulk Delete Button - only enabled when items inside this collection are selected */}
                      {selectedInThisCol.length > 0 && (
                        <button
                          onClick={() => handleBulkDelete(col.name, col.documents)}
                          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition"
                        >
                          <Trash2 size={14} />
                          Delete Selected ({selectedInThisCol.length})
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteCollection(col.name)}
                        className="flex items-center gap-2 bg-red-950/40 hover:bg-red-900/60 border border-red-900 text-red-200 px-4 py-2 rounded-lg text-xs font-semibold transition"
                      >
                        <FolderMinus size={14} />
                        Delete Collection
                      </button>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    {col.documents.length === 0 ? (
                      <div className="p-6 text-center text-gray-500 text-xs">This collection is empty.</div>
                    ) : (
                      <table className="min-w-full divide-y divide-gray-800">
                        <thead className="bg-[#1F2937]/30 text-left text-xs text-gray-400 font-medium uppercase tracking-wider">
                          <tr>
                            {/* Checkbox Header */}
                            <th className="px-6 py-3 w-12 text-center">
                              <button
                                type="button"
                                onClick={() => handleSelectAllInCollection(col.documents, col.name)}
                                className="text-gray-400 hover:text-indigo-400 transition"
                              >
                                {isAllSelected ? (
                                  <CheckSquare size={18} className="text-indigo-500" />
                                ) : (
                                  <Square size={18} />
                                )}
                              </button>
                            </th>
                            <th className="px-6 py-3">ID</th>
                            <th className="px-6 py-3">Document (Chunk Content)</th>
                            <th className="px-6 py-3 font-mono">Metadata</th>
                            <th className="px-6 py-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800 text-sm text-gray-300">
                          {col.documents.map((doc) => {
                            const isSelected = selectedDocIds.includes(doc.id);
                            return (
                              <tr
                                key={doc.id}
                                className={`transition ${
                                  isSelected ? "bg-indigo-950/20" : "hover:bg-gray-800/20"
                                }`}
                              >
                                {/* Checkbox Cell */}
                                <td className="px-6 py-4 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleSelectRow(doc.id)}
                                    className="text-gray-400 hover:text-indigo-400 transition"
                                  >
                                    {isSelected ? (
                                      <CheckSquare size={18} className="text-indigo-500" />
                                    ) : (
                                      <Square size={18} />
                                    )}
                                  </button>
                                </td>

                                <td className="px-6 py-4 font-mono text-xs text-indigo-400 break-all max-w-[150px]">
                                  {doc.id}
                                </td>
                                <td className="px-6 py-4 max-w-xs md:max-w-md">
                                  <p className="line-clamp-2 text-gray-300 text-xs" title={doc.document}>
                                    {doc.document}
                                  </p>
                                </td>
                                <td className="px-6 py-4 font-mono text-[10px] text-gray-400 max-w-xs truncate">
                                  {JSON.stringify(doc.metadata)}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <button
                                    onClick={() => handleDeleteDocument(col.name, doc.id)}
                                    className="text-red-400 hover:text-red-300 transition-colors p-2 inline-flex items-center gap-1"
                                  >
                                    <Trash2 size={16} />
                                    <span className="text-xs font-medium">Delete</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}



      <ITHelpDeskWidget />
    </div>
  );
};

export default Chroma;