import React, { useState } from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { FaPlus } from "react-icons/fa";
import { useLanguage } from "../context/LanguageContext";

function CreateCasePage() {

  const language = useLanguage();
  const t = language?.t || ((key) => key);

  const [title, setTitle] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("low");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const userName = localStorage.getItem("loggedInUserName") || "User";
  const userInitials = userName.charAt(0).toUpperCase();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch("https://api.jurisynth.in/api/cases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          caseNumber,
          description,
          priority
        })
      });

      const data = await res.json();

      if (res.ok) {
        navigate(`/case/${data._id}`);
      } else {
        alert(data.message || t("Error creating case"));
      }

    } catch (error) {
      console.log(error);
      alert(t("Error creating case"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      userName={userName}
      userInitials={userInitials}
    >
      <div className="dashboard-section" style={{ maxWidth: "700px", margin: "0 auto" }}>

        <div className="dashboard-header">
          <h1>
            <FaPlus style={{ marginRight: "10px" }} /> {t("Create New Case")}
          </h1>
        </div>

        <div className="case-card" style={{ padding: "2rem" }}>
          <form onSubmit={handleSubmit}>

            <div className="form-group">
              <label>{t("Case Title")}</label>
              <input
                type="text"
                placeholder={t("e.g. Smith v. State")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="standard-input"
              />
            </div>

            <div className="form-group">
              <label>{t("Case Number")}</label>
              <input
                type="text"
                placeholder={t("e.g. 2025-CV-0104")}
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
                required
                className="standard-input"
              />
            </div>

            <div className="form-group">
              <label>{t("Description")}</label>
              <textarea
                placeholder={t("Brief summary or notes...")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="standard-input"
                rows="4"
              />
            </div>

            <div className="form-group">
              <label>{t("Priority")}</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="standard-input"
              >
                <option value="high">{t("High")}</option>
                <option value="medium">{t("Medium")}</option>
                <option value="low">{t("Low")}</option>
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/dashboard')}
              >
                {t("Cancel")}
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? t("Creating...") : t("Create Case")}
              </button>
            </div>

          </form>
        </div>

      </div>
    </DashboardLayout>
  );
}

export default CreateCasePage;