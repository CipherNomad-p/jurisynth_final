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
      const res = await fetch("http://localhost:5000/api/cases", {
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

  return (
    <DashboardLayout userName={userName} userInitials={userInitials}>

      <div className="dashboard-section">

        {/* HEADER */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px"
        }}>
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

        {/* CARD */}
        <div className="case-card">

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>

              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <th style={{ padding: "12px" }}>Case Name</th>
                  <th style={{ padding: "12px" }}>Case ID</th>
                  <th style={{ padding: "12px" }}>Status</th>
                  <th style={{ padding: "12px" }}>Created</th>
                  <th style={{ padding: "12px" }}>Priority</th>
                  <th style={{ padding: "12px" }}>Documents</th>
                  <th style={{ padding: "12px" }}>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredCases.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "20px", color: "var(--text-secondary)" }}>
                      No cases found
                    </td>
                  </tr>
                ) : (
                  filteredCases.map((c) => {

                    let p = (c.priority || "low").toLowerCase();

                    let color = "#9ca3af";
                    if (p === "high") color = "#ef4444";
                    else if (p === "medium") color = "#f59e0b";
                    else if (p === "low") color = "#10b981";

                    return (
                      <tr key={c._id} style={{ borderBottom: "1px solid var(--border-color)" }}>

                        <td style={{ padding: "12px", fontWeight: "500" }}>
                          {c.title || "Untitled Case"}
                        </td>

                        <td style={{ padding: "12px", color: "var(--text-secondary)" }}>
                          {c.caseNumber || "N/A"}
                        </td>

                        <td style={{ padding: "12px" }}>
                          <span className="case-status processing">
                            {c.status || "Processing"}
                          </span>
                        </td>

                        <td style={{ padding: "12px", color: "var(--text-secondary)" }}>
                          {c.createdAt
                            ? new Date(c.createdAt).toLocaleDateString()
                            : "N/A"}
                        </td>

                        <td style={{ padding: "12px", fontWeight: "600", color }}>
                          {p}
                        </td>

                        <td style={{ padding: "12px" }}>
                          {c.documents?.length > 0 ? (
                            c.documents.map((doc, index) => (
                              <div key={index} style={{ marginBottom: "8px" }}>
                                📁 {doc.fileName || doc.filename || "File"}
                                <br />
                                <a
                                  href={`http://localhost:5000/${(doc.filePath || doc.path)?.replace(/\\/g, '/')}`}
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
                            ))
                          ) : (
                            <span style={{ color: "var(--text-secondary)" }}>
                              No Docs
                            </span>
                          )}
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