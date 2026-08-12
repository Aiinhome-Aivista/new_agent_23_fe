import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate, useParams } from 'react-router-dom';
import { useSessionStore } from '../store/useSessionStore';
import { UploadCloud, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

export const UploadArtifactsView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setCurrentStep } = useSessionStore();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleDecompose = async () => {
    if (!id) return;
    setUploading(true);
    try {
      // Loop over files and upload via FormData
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        await api.post(`/sessions/${id}/artifacts`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setUploadedCount(i + 1);
      }
      
      // Trigger background decomposition & agent graph
      await api.post(`/sessions/${id}/decompose`);
      setCurrentStep(3);
      navigate(`/session/${id}/decomposition`);
    } catch (error) {
      console.error("Artifact upload/decomposition error:", error);
      // Fallback transition
      setCurrentStep(3);
      navigate(`/session/${id}/decomposition`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded shadow-sm border border-light-border p-8 mt-10 max-w-4xl mx-auto">
      <h2 className="font-main-heading mb-6">Upload Requirement & Specification Artifacts</h2>
      
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-orange-border bg-input-bg' : 'border-light-border hover:border-orange-border'}`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="w-12 h-12 mx-auto text-primary-orange mb-4" />
        <p className="font-instruction-text font-semibold">
          {isDragActive ? "Drop files here..." : "Drag & drop artifacts here, or click to browse files"}
        </p>
        <p className="text-sm text-text-placeholder mt-2">
          Supports BRD (.md, .txt, .docx), API Specifications (.json, .yaml), and Database Schemas (.sql)
        </p>
      </div>

      {files.length > 0 && (
        <div className="mt-8">
          <h3 className="font-dropdown-label mb-4">Queued Requirement Artifacts ({files.length})</h3>
          <ul className="space-y-2">
            {files.map((file, i) => (
              <li key={i} className="flex justify-between items-center p-3 border border-light-border rounded bg-input-bg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="font-chat-input text-sm font-medium text-text-primary">{file.name}</span>
                </div>
                <span className="text-text-placeholder text-xs font-mono">{(file.size / 1024).toFixed(1)} KB</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 text-right flex justify-between items-center">
        <span className="text-xs text-text-secondary">
          {uploading ? `Processing file ${uploadedCount} of ${files.length}...` : `${files.length} file(s) ready for intake parsing.`}
        </span>
        <button 
          onClick={handleDecompose} 
          disabled={files.length === 0 || uploading} 
          className="btn-orange disabled:opacity-50"
        >
          {uploading ? 'Parsing & Decomposing...' : 'Start Decomposition Pipeline'}
        </button>
      </div>
    </div>
  );
};
