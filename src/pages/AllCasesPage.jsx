import React, { useEffect, useState } from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import { useNavigate } from "react-router-dom";

function AllCasesPage() {
  const [cases, setCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [search, setSearch] = useState("");

  const navigate = useNavigate();

  const userName = localStorage.getItem("loggedInUserName") || "User";
  const userInitials = userName.charAt(0).toUpperCase();

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const res = await fetch("http://65.0.240.171:5000/api/cases", {
        method: "GET",
        credentials: "include"
      });

      const data = await res.json();

      if (Array.isArray(data)) {
        const priorityOrder = { high: 1, medium: 2, low: 3 };

        const sorted = [...data].sort((a, b) => {
          const pA = (a.priority || "low").toLowerCase();
          const pB = (b.priority || "low").toLowerCase();
          return priorityOrder[pA] - priorityOrder[pB];
        });

        setCases(sorted);
        setFilteredCases(sorted);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleSearch = (e) => {
    const keyword = e.target.value.toLowerCase();
    setSearch(keyword);

    const filtered = cases.filter((c) =>
      c.title?.toLowerCase().includes(keyword) ||
      c.caseNumber?.toLowerCase().includes(keyword)
    );

    setFilteredCases(filtered);
  };

  const renderFileList = (files, emptyLabel) => {
    if (!files?.length) {
      return <span style={{ color: "var(--text-secondary)" }}>{emptyLabel}</span>;
    }

    return files.map((file, index) => (
      <div
        key={index}
        style={{
          marginBottom: "8px",
          maxWidth: "220px"
        }}
      >
        <div
          title={file.fileName || file.filename || "File"}
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}
        >
          File: {file.fileName || file.filename || "File"}
        </div>
        <br />
        <a
          href={`http://65.0.240.171:5000/${(file.filePath || file.path)?.replace(/\\/g, "/")}`}
          target="_blank"
          rel="noreferrer"
          style={{
            color: "#3b82f6",
            fontSize: "12px"
          }}
        >
          View
        </a>
      </div>
    ));
  };

  const getProofFileNames = (caseItem) => {
    const proofMessages = (caseItem.timeline || [])
      .filter(
        (entry) =>
          ["proof_added", "evidence_uploaded"].includes(entry.type) &&
          typeof entry.message === "string"
      )
      .map((entry) => entry.message);

    return proofMessages
      .map((message) => {
        const match = message.match(/(?:Proof added|Evidence added|Uploaded):\s*(.+)$/i);
        return match ? match[1].trim() : null;
      })
      .filter(Boolean);
  };

  const getEvidenceFiles = (caseItem) => {
    const directEvidence = caseItem.evidence || [];
    if (directEvidence.length > 0) return directEvidence;

    const proofFileNames = new Set(getProofFileNames(caseItem));
    const matchedFiles = (caseItem.documents || []).filter((file) => {
      const fileName = file.fileName || file.filename || "";
      return Array.from(proofFileNames).some((proofName) =>
        proofName.toLowerCase() === fileName.toLowerCase() ||
        proofName.toLowerCase().includes(fileName.toLowerCase()) ||
        fileName.toLowerCase().includes(proofName.toLowerCase())
      );
    });

    if (matchedFiles.length > 0) return matchedFiles;

    const hasProofActivity = (caseItem.timeline || []).some((entry) =>
      ["proof_added", "evidence_uploaded"].includes(entry.type)
    );

    if (hasProofActivity && (caseItem.documents || []).length > 0) {
      const fallbackFile = caseItem.documents[caseItem.documents.length - 1];
      return fallbackFile ? [fallbackFile] : [];
    }

    // Final fallback: if the case has uploaded files but no normalized evidence bucket yet,
    // still expose the most recent file in Evidence so it can be viewed from All Cases.
    if ((caseItem.documents || []).length > 0) {
      const fallbackFile = caseItem.documents[caseItem.documents.length - 1];
      return fallbackFile ? [fallbackFile] : [];
    }

    return [];
  };

  const getDocumentFiles = (caseItem) => {
    const proofFileNames = new Set(getProofFileNames(caseItem));
    return (caseItem.documents || []).filter((file) => {
      const fileName = file.fileName || file.filename || "";
      return !Array.from(proofFileNames).some((proofName) =>
        proofName.toLowerCase() === fileName.toLowerCase()
      );
    });
  };

  return (
    <DashboardLayout userName={userName} userInitials={userInitials}>
      <div className="dashboard-section">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px"
          }}
        >
          <h2 style={{ fontWeight: "600" }}>All Cases</h2>

          <input
            type="text"
            placeholder="Search by name or ID..."
            value={search}
            onChange={handleSearch}
            style={{
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
              background: "var(--bg-secondary)",
              color: "var(--text-primary)",
              width: "260px"
            }}
          />
        </div>

        <div className="case-card">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <th style={{ padding: "12px", width: "13%" }}>Case Name</th>
                  <th style={{ padding: "12px", width: "9%" }}>Case ID</th>
                  <th style={{ padding: "12px", width: "9%" }}>Status</th>
                  <th style={{ padding: "12px", width: "10%" }}>Created</th>
                  <th style={{ padding: "12px", width: "8%" }}>Priority</th>
                  <th style={{ padding: "12px", width: "20%" }}>Documents</th>
                  <th style={{ padding: "12px", width: "20%" }}>Evidence</th>
                  <th style={{ padding: "12px", width: "11%" }}>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredCases.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      style={{ textAlign: "center", padding: "20px", color: "var(--text-secondary)" }}
                    >
                      No cases found
                    </td>
                  </tr>
                ) : (
                  filteredCases.map((c) => {
                    const p = (c.priority || "low").toLowerCase();

                    let color = "#9ca3af";
                    if (p === "high") color = "#ef4444";
                    else if (p === "medium") color = "#f59e0b";
                    else if (p === "low") color = "#10b981";

                    return (
                      <tr key={c._id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                        <td style={{ padding: "12px", fontWeight: "500", wordBreak: "break-word" }}>
                          {c.title || "Untitled Case"}
                        </td>

                        <td style={{ padding: "12px", color: "var(--text-secondary)", wordBreak: "break-word" }}>
                          {c.caseNumber || "N/A"}
                        </td>

                        <td style={{ padding: "12px" }}>
                          <span className="case-status processing">
                            {c.status || "Processing"}
                          </span>
                        </td>

                        <td style={{ padding: "12px", color: "var(--text-secondary)" }}>
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "N/A"}
                        </td>

                        <td style={{ padding: "12px", fontWeight: "600", color }}>
                          {p}
                        </td>

                        <td style={{ padding: "12px", verticalAlign: "top" }}>
                          {renderFileList(getDocumentFiles(c), "No Docs")}
                        </td>

                        <td style={{ padding: "12px", verticalAlign: "top" }}>
                          {renderFileList(getEvidenceFiles(c), "No Evidence")}
                        </td>

                        <td style={{ padding: "12px" }}>
                          <button
                            className="btn btn-primary btn-small"
                            onClick={() => navigate(`/case/${c._id}`)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default AllCasesPage;
