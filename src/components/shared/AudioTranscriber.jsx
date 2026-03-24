import React, { useState } from 'react';
import { FaMicrophoneAlt, FaSpinner, FaUpload } from 'react-icons/fa';

function AudioTranscriber() {
  const [audioFile, setAudioFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!audioFile) {
      setError('Select an audio file first');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('audio', audioFile);

      const response = await fetch('http://localhost:5000/api/transcribe', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || 'Transcription failed');
      }

      setTranscript(data?.text || '');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Transcription failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="audio-transcriber-card">
      <div className="audio-transcriber-head">
        <div>
          <p className="audio-transcriber-eyebrow">Audio Workspace</p>
          <h3>Transcribe Audio</h3>
          <p className="audio-transcriber-subtitle">Upload legal recordings and capture a working transcript for review.</p>
        </div>
        <div className="audio-transcriber-icon">
          <FaMicrophoneAlt />
        </div>
      </div>
      {error && <div className="summary-error-banner">{error}</div>}
      <div className="audio-transcriber-actions">
        <label className="audio-upload-btn">
          <FaUpload /> {audioFile ? 'Replace Audio' : 'Choose Audio'}
          <input
            type="file"
            accept="audio/*"
            style={{ display: 'none' }}
            onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
          />
        </label>
        <button className="generate-ai-btn audio-submit-btn" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? <><FaSpinner className="spin-icon" /> Processing...</> : 'Submit Audio'}
        </button>
      </div>
      <div className="audio-file-strip">
        <span className="audio-file-label">Selected File</span>
        <strong>{audioFile?.name || 'No audio selected yet'}</strong>
      </div>
      <textarea
        className="judgement-textarea audio-output"
        rows="8"
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder="Transcribed text will appear here..."
      />
    </div>
  );
}

export default AudioTranscriber;
