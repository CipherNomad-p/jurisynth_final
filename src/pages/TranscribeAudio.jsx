import React from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import AudioTranscriber from "../components/shared/AudioTranscriber";

function TranscribeAudio() {
  const userName = localStorage.getItem("loggedInUserName") || "User";
  const userInitials = userName.charAt(0).toUpperCase();

  return (
    <DashboardLayout userName={userName} userInitials={userInitials}>
      <div className="dashboard-section">
        <AudioTranscriber />
      </div>
    </DashboardLayout>
  );
}

export default TranscribeAudio;
