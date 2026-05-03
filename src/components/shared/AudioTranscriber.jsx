import React, { useState } from 'react';
import { FaMicrophoneAlt, FaSpinner, FaUpload } from 'react-icons/fa';

const ASR_URL = 'https://api.jurisynth.in:8000/transcribe';

function AudioTranscriber() {
  const [audioFile, setAudioFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [translation, setTranslation] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!audioFile) {
      setError('Select an audio file first');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setTranscript('');
    setTranslation('');

    try {
      const formData = new FormData();
      formData.append('audio', audioFile);

      const response = await fetch(ASR_URL, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.detail || data?.message || 'Transcription failed');
      }

      setTranscript(data?.transcript || '');
      setTranslation(data?.translation || '');
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
      <p className="audio-transcriber-eyebrow" style={{ marginTop: '1rem' }}>Transcript</p>
      <textarea
        className="judgement-textarea audio-output"
        rows="8"
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder="Transcribed text will appear here..."
      />
      <p className="audio-transcriber-eyebrow" style={{ marginTop: '1rem' }}>English Translation</p>
      <textarea
        className="judgement-textarea audio-output"
        rows="8"
        value={translation}
        onChange={(e) => setTranslation(e.target.value)}
        placeholder="English translation will appear here..."
      />
    </div>
  );
}

export default AudioTranscriber;
