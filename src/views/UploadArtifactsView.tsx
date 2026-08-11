import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate, useParams } from 'react-router-dom';
import { useSessionStore } from '../store/useSessionStore';
import { UploadCloud } from 'lucide-react';
import api from '../services/api';

export const UploadArtifactsView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setCurrentStep } = useSessionStore();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleDecompose = async () => {
    setUploading(true);
    try {
      // Stub: in reality, loop over files and upload, then trigger decompose
      await api.post(`/sessions/${id}/decompose`);
      setCurrentStep(3);
      navigate(`/session/${id}/decomposition`);
    } catch (error) {
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded shadow-sm border border-light-border p-8 mt-10">
      <h2 className="font-main-heading mb-6">Upload Requirement Artifacts</h2>
      
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-orange-border bg-input-bg' : 'border-light-border hover:border-orange-border'}`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="w-12 h-12 mx-auto text-text-secondary mb-4" />
        <p className="font-instruction-text">
          {isDragActive ? "Drop files here..." : "Drag & drop files here, or click to select"}
        </p>
        <p className="text-sm text-text-placeholder mt-2">Supports .pdf, .docx, .json, .sql</p>
      </div>

      {files.length > 0 && (
        <div className="mt-8">
          <h3 className="font-dropdown-label mb-4">Queued Files</h3>
          <ul className="space-y-2">
            {files.map((file, i) => (
              <li key={i} className="flex justify-between p-3 border border-light-border rounded">
                <span className="font-chat-input">{file.name}</span>
                <span className="text-text-placeholder text-sm">{(file.size / 1024).toFixed(1)} KB</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 text-right">
        <button 
          onClick={handleDecompose} 
          disabled={files.length === 0 || uploading} 
          className="btn-orange disabled:opacity-50"
        >
          {uploading ? 'Processing...' : 'Start Decomposition'}
        </button>
      </div>
    </div>
  );
};
