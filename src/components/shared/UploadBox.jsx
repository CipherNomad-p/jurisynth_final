import React from 'react';
import { FaCheck, FaTimes, FaUpload } from 'react-icons/fa';

function UploadBox({
  selectedFiles = [],
  onFileChange,
  onSubmit,
  onCancel,
  isUploading = false,
  accept = '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png',
  buttonLabel = 'Upload Documents',
  multiple = false // ✅ IMPORTANT (changed default to false)
}) {
  return (
    <div className="upload-box">
      <div className="upload-box-header">
        <label className="upload-trigger-btn">
          <FaUpload /> {buttonLabel}
          <input
            type="file"
            multiple={multiple}
            style={{ display: 'none' }}
            onChange={onFileChange}
            accept={accept}
          />
        </label>
        <span className="upload-box-hint">
          {multiple ? 'Append files to this case' : 'Select one evidence file'}
        </span>
      </div>

      {selectedFiles.length > 0 && (
        <div className="upload-confirmation-ui">
          <div className="file-preview-list">
            {selectedFiles.map((file) => (
              <p key={file.name} className="file-preview" title={file.name}>
                {file.name}
              </p>
            ))}
          </div>
          <div className="confirmation-actions">
            <button className="confirm-btn" onClick={onSubmit} disabled={isUploading}>
              <FaCheck /> {isUploading ? 'Uploading...' : 'Confirm'}
            </button>
            <button className="cancel-btn" onClick={onCancel}>
              <FaTimes /> Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadBox;