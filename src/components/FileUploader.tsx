"use client";

import React, { useState, useRef, useEffect } from "react";
import { Upload, X, FileText, Image as ImageIcon, Loader2, Eye, CheckCircle2 } from "lucide-react";
import { ReceiptModal } from "@/components/ReceiptModal";

interface FileUploaderProps {
    onUpload: (files: string[]) => void;
    existingFiles?: string[];
    multiple?: boolean;
    accept?: string;
    maxFiles?: number;
    label?: string;
}

interface FileMetadata {
    data: string;
    name?: string;
    sizeKb?: number;
    isPdf?: boolean;
}

export function FileUploader({
    onUpload,
    existingFiles,
    multiple = false,
    accept = "image/*,application/pdf",
    maxFiles = 5,
    label = "Upload Bill or Receipt"
}: FileUploaderProps) {
    const [files, setFiles] = useState<string[]>(existingFiles || []);
    const [fileMeta, setFileMeta] = useState<FileMetadata[]>(() => 
        (existingFiles || []).map(f => ({
            data: f,
            name: 'Attached receipt',
            sizeKb: Math.round((f.length * 3) / 4 / 1024),
            isPdf: f.startsWith('data:application/pdf')
        }))
    );
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [previewItem, setPreviewItem] = useState<{ title: string; data: string } | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Track previous existingFiles string representation to avoid unnecessary wipes
    const existingKey = (existingFiles || []).join("|");
    const prevExistingKeyRef = useRef(existingKey);

    useEffect(() => {
        if (existingFiles && prevExistingKeyRef.current !== existingKey) {
            prevExistingKeyRef.current = existingKey;
            setFiles(existingFiles);
            setFileMeta(existingFiles.map(f => ({
                data: f,
                name: 'Attached receipt',
                sizeKb: Math.round((f.length * 3) / 4 / 1024),
                isPdf: f.startsWith('data:application/pdf')
            })));
        }
    }, [existingKey, existingFiles]);

    // Compress images to max 1600px width/height and quality 0.82
    const compressImage = (file: File): Promise<{ base64: string; sizeKb: number }> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target?.result as string;
                img.onload = () => {
                    const maxDim = 1600;
                    let width = img.width;
                    let height = img.height;

                    if (width > maxDim || height > maxDim) {
                        if (width > height) {
                            height = Math.round((height * maxDim) / width);
                            width = maxDim;
                        } else {
                            width = Math.round((width * maxDim) / height);
                            height = maxDim;
                        }
                    }

                    const canvas = document.createElement("canvas");
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d");
                    if (!ctx) {
                        const raw = e.target?.result as string;
                        resolve({ base64: raw, sizeKb: Math.round(file.size / 1024) });
                        return;
                    }

                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = "high";
                    ctx.drawImage(img, 0, 0, width, height);

                    const compressed = canvas.toDataURL("image/jpeg", 0.82);
                    const sizeKb = Math.round((compressed.length * 3) / 4 / 1024);
                    resolve({ base64: compressed, sizeKb });
                };
                img.onerror = () => reject(new Error("Unable to read image"));
            };
            reader.onerror = (err) => reject(err);
        });
    };

    const processFiles = async (fileList: File[]) => {
        const remaining = maxFiles - files.length;
        const filesToProcess = multiple ? fileList.slice(0, remaining) : [fileList[0]];

        if (filesToProcess.length === 0) return;

        setIsProcessing(true);
        const newFiles: string[] = [];
        const newMeta: FileMetadata[] = [];

        try {
            for (const file of filesToProcess) {
                // Check if PDF exceeds 5MB
                if (file.type === "application/pdf") {
                    if (file.size > 5 * 1024 * 1024) {
                        alert(`PDF file "${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Please upload a file under 5MB.`);
                        continue;
                    }
                    const base64 = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.readAsDataURL(file);
                        reader.onload = () => resolve(reader.result as string);
                        reader.onerror = reject;
                    });
                    newFiles.push(base64);
                    newMeta.push({
                        data: base64,
                        name: file.name,
                        sizeKb: Math.round(file.size / 1024),
                        isPdf: true
                    });
                } else if (file.type.startsWith("image/")) {
                    const { base64, sizeKb } = await compressImage(file);
                    newFiles.push(base64);
                    newMeta.push({
                        data: base64,
                        name: file.name,
                        sizeKb,
                        isPdf: false
                    });
                } else {
                    alert(`Unsupported file type: ${file.name}. Please upload an image (JPG, PNG, WebP) or PDF.`);
                }
            }

            if (newFiles.length > 0) {
                const updatedFiles = multiple ? [...files, ...newFiles] : newFiles;
                const updatedMeta = multiple ? [...fileMeta, ...newMeta] : newMeta;
                setFiles(updatedFiles);
                setFileMeta(updatedMeta);
                onUpload(updatedFiles);
            }
        } catch (error: any) {
            console.error("Error processing receipt:", error);
            alert("Failed to process file: " + (error?.message || "Unknown error"));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (!selectedFiles || selectedFiles.length === 0) return;

        await processFiles(Array.from(selectedFiles));

        if (inputRef.current) {
            inputRef.current.value = "";
        }
    };

    const removeFile = (index: number) => {
        const updatedFiles = files.filter((_, i) => i !== index);
        const updatedMeta = fileMeta.filter((_, i) => i !== index);
        setFiles(updatedFiles);
        setFileMeta(updatedMeta);
        onUpload(updatedFiles);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFiles = Array.from(e.dataTransfer.files);
        await processFiles(droppedFiles);
    };

    return (
        <div className="space-y-4">
            {/* Upload Zone */}
            <div
                onClick={() => !isProcessing && inputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                    border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition-all relative overflow-hidden
                    ${isDragging
                        ? "border-orange-500 bg-orange-50/50 scale-[0.99]"
                        : "border-slate-200 hover:border-orange-400 hover:bg-orange-50/20 bg-white"
                    }
                    ${isProcessing ? "opacity-75 pointer-events-none" : ""}
                `}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleFileChange}
                    className="hidden"
                />

                {isProcessing ? (
                    <div className="py-4 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-10 h-10 text-orange-600 animate-spin" />
                        <p className="text-sm font-bold text-slate-700">Compressing & preparing receipt...</p>
                        <p className="text-xs text-slate-400">Optimizing resolution for fast submission</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-inner">
                            <Upload className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-extrabold text-slate-800">{label}</p>
                        <p className="text-xs font-semibold text-slate-400 mt-1">
                            {multiple
                                ? `Drag & drop or click to upload (up to ${maxFiles} files)`
                                : "Click to browse or drop bill / invoice (JPG, PNG, PDF)"}
                        </p>
                        <div className="flex items-center gap-2 mt-3 px-3 py-1 bg-slate-100/70 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            <span>Auto-compressed</span>
                            <span>•</span>
                            <span>Max 5MB PDF</span>
                        </div>
                    </div>
                )}
            </div>

            {/* File Previews */}
            {files.length > 0 && (
                <div className={`grid gap-3 ${multiple ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
                    {files.map((file, index) => {
                        const meta = fileMeta[index];
                        const isPdf = meta?.isPdf ?? file.startsWith("data:application/pdf");
                        const name = meta?.name || `Receipt_${index + 1}`;
                        const size = meta?.sizeKb ? `${meta.sizeKb} KB` : "Attached";

                        return (
                            <div
                                key={index}
                                className="relative flex items-center justify-between p-3.5 bg-white border border-slate-200/90 rounded-2xl shadow-sm hover:shadow-md transition-all group"
                            >
                                <div className="flex items-center gap-3.5 min-w-0">
                                    {/* Thumbnail / Icon */}
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100 flex items-center justify-center">
                                        {isPdf ? (
                                            <div className="w-full h-full bg-red-50 text-red-600 flex flex-col items-center justify-center">
                                                <FileText className="w-6 h-6" />
                                                <span className="text-[8px] font-black uppercase">PDF</span>
                                            </div>
                                        ) : (
                                            <img
                                                src={file}
                                                alt="Receipt preview"
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <h5 className="font-extrabold text-xs text-slate-800 truncate max-w-[200px] sm:max-w-[240px]">
                                                {name}
                                            </h5>
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mt-0.5">
                                            <span className="text-emerald-600 font-extrabold">{size}</span>
                                            <span>•</span>
                                            <span className="uppercase">{isPdf ? "PDF Document" : "Optimized Image"}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPreviewItem({ title: name, data: file });
                                        }}
                                        className="p-2 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all"
                                        title="Preview Receipt"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeFile(index);
                                        }}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                        title="Remove File"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* In-component Inspection Modal */}
            {previewItem && (
                <ReceiptModal
                    isOpen={!!previewItem}
                    onClose={() => setPreviewItem(null)}
                    title={previewItem.title}
                    billData={previewItem.data}
                />
            )}
        </div>
    );
}
