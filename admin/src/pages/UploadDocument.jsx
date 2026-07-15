import { useState } from "react";
import { toast } from "react-toastify";
import { UploadCloud, FileText, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const UploadDocument = () => {
  const navigate = useNavigate();

  const [uploadFileLoading, setUploadFileLoading] = useState(false);
  const [uploadFileError, setUploadFileError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewProgress, setPreviewProgress] = useState(0);

  const allowedTypes = [
    // PDF
    "application/pdf",

    // Word
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

    // Excel
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

    // TXT
    "text/plain",

    // CSV
    "text/csv",
    "application/csv",
    "application/vnd.ms-excel", // sometimes csv comes with this mimetype
  ];

  // ================= HANDLE FILE PICK =================
  const handleFileSelect = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (!allowedTypes.includes(file.type)) {
      toast.error("Only pdf, doc, docx, xls, xlsx, txt, csv files are allowed");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Maximum file size is 10MB");
      return;
    }

    setSelectedFile(file);

    // fake preview animation
    let progress = 0;

    const interval = setInterval(() => {
      progress += 10;
      setPreviewProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 80);
  };

  // ================= UPLOAD FILE =================
  const handleUploadFile = async () => {}; // Needs to be completed

  return (
    <div className="p-3">
      {/* ================= HEADING ================= */}
      <div className="flex flex-col gap-2 mb-14 px-3">
        <h1 className="text-3xl font-semibold text-gray-200">
          Upload a new File
        </h1>
        <p className="text-xs text-gray-400">
          You can upload and add PDF, DOC, DOCX, XLS, XLSX, TXT, CSV files and
          the file size should not exceed 10MB.
        </p>
      </div>

      {/* ================= FORM CARD ================= */}
      <div className="bg-[#0B0F19] rounded-lg border border-gray-700 p-6 flex flex-col gap-6 mx-3 mb-10">
        {/* ================= FILE UPLOAD SECTION ================= */}
        <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 flex flex-col gap-5">
          <p className="text-sm text-gray-400">
            Upload PDF, DOC, DOCX, XLS, XLSX, TXT, CSV files only. Maximum size:
            10MB
          </p>

          <div className="flex items-center gap-5">
            {/* preview box */}
            <div className="relative w-28 h-28 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
              {/* progress fill */}
              <div
                className="absolute left-0 top-0 h-full bg-indigo-200 transition-all duration-300"
                style={{
                  width: `${previewProgress}%`,
                }}
              />

              <FileText className="z-10 text-indigo-600" size={36} />
            </div>

            {/* choose file button */}
            <label className="cursor-pointer px-5 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2">
              <UploadCloud size={18} />
              Choose File
              <input type="file" hidden onChange={handleFileSelect} />
            </label>

            {selectedFile && (
              <span className="text-sm text-gray-400">{selectedFile.name}</span>
            )}
          </div>
        </div>

        {/* ================= upload file button ================= */}
        <div className="">
          <button
            onClick={handleUploadFile}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-60"
          >
            Upload File
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadDocument;
