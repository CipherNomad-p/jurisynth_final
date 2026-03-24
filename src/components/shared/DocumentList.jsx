import React from 'react';
import { FaClock, FaEye, FaFileAlt, FaTrash } from 'react-icons/fa';

const priorityOrder = { high: 1, medium: 2, low: 3 };

function DocumentList({
  documents = [],
  emptyText,
  onPriorityChange,
  canEditPriority = false,
  onDelete
}) {

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
        <div
          key={`${doc.fileUrl || doc.path || doc.fileName || idx}-${idx}`}
          className="doc-list-item compact-item"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
            padding: "12px",
            border: "1px solid #334155",
            borderRadius: "10px",
            marginBottom: "8px",
            background: "#1e293b",
            width: "100%",
            boxSizing: "border-box"
          }}
        >

          {/* FILE NAME */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FaFileAlt style={{ opacity: 0.7 }} />
            <span style={{ fontSize: "13px", fontWeight: "500" }}>
              {doc.name || doc.fileName || doc.filename}
            </span>
          </div>

          {/* PRIORITY BADGE */}
          <div style={{ textAlign: "right" }}>
            <span className={`priority-pill priority-${doc.priority || 'low'}`}>
              {doc.priority || 'low'}
            </span>
          </div>

          {/* DATE */}
          <div style={{ fontSize: "11px", opacity: 0.7 }}>
            <FaClock />{" "}
            {doc.uploadedAt
              ? new Date(doc.uploadedAt).toLocaleString()
              : "Recently"}
          </div>

          {/* PRIORITY DROPDOWN */}
          <div style={{ textAlign: "right" }}>
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

          {/* ROLE */}
          <div style={{ fontSize: "11px", opacity: 0.7 }}>
            {doc.uploadedByName || "Lawyer"}
          </div>

          {/* ACTIONS */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
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
                textDecoration: "none"
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
                  cursor: "pointer"
                }}
              >
                <FaTrash /> Delete
              </button>
            )}
          </div>

        </div>
      ))}
    </div>
  );
}

export default DocumentList;