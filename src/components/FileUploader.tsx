import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import { Upload, FileText, X, AlertTriangle, CheckCircle } from "lucide-react";

interface FileUploaderProps {
  onClose: () => void;
}

export function FileUploader({ onClose }: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const createContract = useMutation(api.contracts.create);
  const analyzeContract = useAction(api.contracts.analyzeContract);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      // Create contract record
      const contractId = await createContract({
        fileName: file.name,
        fileSize: file.size,
      });

      // Read file content
      const text = await readFileContent(file);

      // Start analysis
      await analyzeContract({
        contractId,
        text,
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload and analyze the contract. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        resolve(text);
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-zinc-800">
          <h2 className="text-lg md:text-xl font-bold text-white">Upload Contract</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6">
          {success ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Upload Successful!</h3>
              <p className="text-zinc-500 text-sm mt-1">Your contract is being analyzed...</p>
            </motion.div>
          ) : (
            <>
              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`relative border-2 border-dashed rounded-xl p-8 md:p-12 text-center cursor-pointer transition-all duration-200 ${
                  isDragActive
                    ? "border-amber-500 bg-amber-500/10"
                    : file
                    ? "border-green-500/50 bg-green-500/5"
                    : "border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/30"
                }`}
              >
                <input {...getInputProps()} />

                {file ? (
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-xl bg-green-500/20 flex items-center justify-center mb-4">
                      <FileText className="w-7 h-7 text-green-400" />
                    </div>
                    <p className="text-white font-medium truncate max-w-full">{file.name}</p>
                    <p className="text-zinc-500 text-sm mt-1">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="mt-3 text-sm text-amber-500 hover:text-amber-400 transition-colors"
                    >
                      Choose different file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                      isDragActive ? "bg-amber-500/20" : "bg-zinc-800"
                    }`}>
                      <Upload className={`w-7 h-7 ${isDragActive ? "text-amber-500" : "text-zinc-500"}`} />
                    </div>
                    <p className="text-white font-medium">
                      {isDragActive ? "Drop your file here" : "Drag & drop your contract"}
                    </p>
                    <p className="text-zinc-500 text-sm mt-1">
                      or click to browse
                    </p>
                    <p className="text-zinc-600 text-xs mt-4">
                      Supports PDF, TXT, DOC, DOCX (max 10MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mt-4"
                >
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!file || isUploading}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full"
                      />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Analyze Contract
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
