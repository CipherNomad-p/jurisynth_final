import React, { useState } from 'react';
import { FaClock, FaEye, FaFileAlt, FaTrash } from 'react-icons/fa';

const priorityOrder = { high: 1, medium: 2, low: 3 };

function DocumentList({
  documents = [],
  emptyText,
  onPriorityChange,
  canEditPriority = false,
  onDelete
}) {
  const [activeDocKey, setActiveDocKey] = useState(null);

  const sortedDocuments = [...documents].sort((a, b) => {
    const byPriority =
      priorityOrder[a.priority || 'low'] -
      priorityOrder[b.priority || 'low'];

    if (byPriority !== 0) return byPriority;

    return new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0);
  });

  if (!sortedDocuments.length) {
    return <p className="case-activity-empty">{emptyText}</p>;
  }

  return (
    <div className="uploaded-docs-list compact-docs">
      {sortedDocuments.map((doc, idx) => (
        (() => {
          const docKey = `${doc.fileUrl || doc.path || doc.fileName || idx}-${idx}`;
          const isActive = activeDocKey === docKey;
          const docName = doc.name || doc.fileName || doc.filename || "Document";

          return (
            <div
              key={docKey}
              className="doc-list-item compact-item"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                padding: "10px 12px",
                border: "1px solid #334155",
                borderRadius: "10px",
                background: "#1e293b",
                width: "100%",
                boxSizing: "border-box",
                position: "relative"
              }}
            >
              <button
                type="button"
                onClick={() => setActiveDocKey(isActive ? null : docKey)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  color: "inherit",
                  textAlign: "left",
                  cursor: "pointer",
                  padding: 0
                }}
              >
                <FaFileAlt style={{ opacity: 0.8, flexShrink: 0 }} />
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: "500",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    minWidth: 0,
                    flex: 1
                  }}
                  title={docName}
                >
                  {docName}
                </span>
              </button>

              {isActive && (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      flexWrap: "wrap",
                      fontSize: "11px",
                      opacity: 0.8
                    }}
                  >
                    <span style={{ whiteSpace: "nowrap" }}>
                      <FaClock />{" "}
                      {doc.uploadedAt
                        ? new Date(doc.uploadedAt).toLocaleString()
                        : "Recently"}
                    </span>
                    <span style={{ whiteSpace: "nowrap" }}>
                      {doc.uploadedByName || "Lawyer"}
                    </span>
                    <span className={`priority-pill priority-${doc.priority || 'low'}`}>
                      {doc.priority || 'low'}
                    </span>
                    {canEditPriority && (
                      <select
                        value={doc.priority || "low"}
                        onChange={(e) => onPriorityChange?.(doc, e.target.value)}
                        style={{
                          padding: "4px 6px",
                          fontSize: "12px",
                          borderRadius: "6px",
                          background: "#0f172a",
                          color: "white",
                          border: "1px solid #334155"
                        }}
                      >
                        <option value="high">high</option>
                        <option value="medium">medium</option>
                        <option value="low">low</option>
                      </select>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      gap: "8px",
                      flexWrap: "wrap"
                    }}
                  >
                    <a
                      href={`http://localhost:5000/${(doc.fileUrl || doc.path || '')
                        .replace(/^\/+/, "")
                        .replace(/\\/g, "/")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "4px 10px",
                        fontSize: "12px",
                        borderRadius: "6px",
                        background: "#2563eb",
                        color: "white",
                        textDecoration: "none",
                        whiteSpace: "nowrap"
                      }}
                    >
                      <FaEye /> View
                    </a>

                    {onDelete && (
                      <button
                        onClick={() => onDelete(doc)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "4px 10px",
                          fontSize: "12px",
                          borderRadius: "6px",
                          background: "#dc2626",
                          color: "white",
                          border: "none",
                          cursor: "pointer",
                          whiteSpace: "nowrap"
                        }}
                        type="button"
                      >
                        <FaTrash /> Delete
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })()
      ))}
    </div>
  );
}

export default DocumentList;
