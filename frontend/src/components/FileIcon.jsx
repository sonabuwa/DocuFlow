import { FileText, FileSpreadsheet, FileArchive, FileImage, FileCode, File } from "lucide-react";

export const FileIcon = ({ mimeType = "", filename = "", size = 24 }) => {
  const ext = filename.split(".").pop()?.toLowerCase() || "";

  if (mimeType.includes("pdf") || ext === "pdf")
    return <FileText size={size} className="text-red-400" />;
  if (mimeType.includes("image") || ["jpg","jpeg","png","gif","webp","svg"].includes(ext))
    return <FileImage size={size} className="text-blue-400" />;
  if (mimeType.includes("spreadsheet") || ["xlsx","xls","csv"].includes(ext))
    return <FileSpreadsheet size={size} className="text-emerald-400" />;
  if (mimeType.includes("word") || ["docx","doc"].includes(ext))
    return <FileText size={size} className="text-indigo-400" />;
  if (mimeType.includes("zip") || ["zip","rar","tar","gz"].includes(ext))
    return <FileArchive size={size} className="text-yellow-400" />;
  if (mimeType.includes("presentation") || ["pptx","ppt"].includes(ext))
    return <FileText size={size} className="text-orange-400" />;
  if (["js","jsx","ts","tsx","html","css","json","py","java"].includes(ext))
    return <FileCode size={size} className="text-cyan-400" />;

  return <File size={size} className="text-slate-400" />;
};
