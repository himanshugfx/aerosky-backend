"use client";

import React, { useState, useEffect } from "react";
import { X, Download, ExternalLink, ZoomIn, ZoomOut, RotateCcw, FileText, Image as ImageIcon } from "lucide-react";

interface ReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    billData: string;
    amount?: number;
    date?: string;
    category?: string;
    status?: string;
}

export function ReceiptModal({
    isOpen,
    onClose,
    title,
    billData,
    amount,
    date,
    category,
    status
}: ReceiptModalProps) {
    const [zoom, setZoom] = useState(1);
    const [blobUrl, setBlobUrl] = useState<string | null>(null);

    const isPdf = billData?.startsWith("data:application/pdf") || billData?.includes(".pdf");
    const isImage = billData?.startsWith("data:image") || (!isPdf && billData);

    useEffect(() => {
        if (!isOpen || !billData) {
            setBlobUrl(null);
            setZoom(1);
            return;
        }

        try {
            if (billData.startsWith("data:")) {
                const parts = billData.split(",");
                const byteString = atob(parts[1]);
                const mimeString = parts[0].split(":")[1].split(";")[0];
                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++) {
                    ia[i] = byteString.charCodeAt(i);
                }
                const blob = new Blob([ab], { type: mimeString });
                const url = URL.createObjectURL(blob);
                setBlobUrl(url);

                return () => {
                    URL.revokeObjectURL(url);
                };
            } else {
                setBlobUrl(billData);
            }
        } catch (e) {
            console.error("Error creating blob URL for receipt:", e);
            setBlobUrl(billData);
        }
    }, [isOpen, billData]);

    if (!isOpen) return null;

    const handleDownload = () => {
        if (!billData) return;
        try {
            const link = document.createElement("a");
            const ext = isPdf ? "pdf" : "jpg";
            const safeName = (title || "Receipt").replace(/[^a-z0-9]/gi, "_").toLowerCase();
            link.download = `${safeName}_receipt.${ext}`;
            link.href = blobUrl || billData;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            console.error("Download error:", e);
        }
    };

    const handleOpenNewTab = () => {
        if (blobUrl) {
            window.open(blobUrl, "_blank", "noopener,noreferrer");
        } else if (billData) {
            window.open(billData, "_blank");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
            <div 
                className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                            {isPdf ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                        </div>
                        <div>
                            <h3 className="font-extrabold text-slate-900 text-base line-clamp-1">{title || "Receipt Inspection"}</h3>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] font-semibold text-slate-400">
                                {category && <span className="uppercase tracking-wider text-orange-600 font-bold">{category}</span>}
                                {amount !== undefined && (
                                    <>
                                        <span>•</span>
                                        <span className="text-slate-700 font-bold">₹{amount.toLocaleString('en-IN')}</span>
                                    </>
                                )}
                                {date && (
                                    <>
                                        <span>•</span>
                                        <span>{new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    </>
                                )}
                                {status && (
                                    <>
                                        <span>•</span>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-bold uppercase">{status}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {isImage && (
                            <div className="hidden sm:flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm mr-2">
                                <button
                                    onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                                    title="Zoom Out"
                                >
                                    <ZoomOut className="w-4 h-4" />
                                </button>
                                <span className="text-[10px] font-bold text-slate-600 px-1">{Math.round(zoom * 100)}%</span>
                                <button
                                    onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                                    title="Zoom In"
                                >
                                    <ZoomIn className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setZoom(1)}
                                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                                    title="Reset Zoom"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        <button
                            onClick={handleDownload}
                            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all border border-slate-200 shadow-sm flex items-center gap-1.5 text-xs font-bold"
                            title="Download Receipt"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden md:inline">Download</span>
                        </button>

                        <button
                            onClick={handleOpenNewTab}
                            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all border border-slate-200 shadow-sm flex items-center gap-1.5 text-xs font-bold"
                            title="Open in New Tab"
                        >
                            <ExternalLink className="w-4 h-4" />
                            <span className="hidden md:inline">Full View</span>
                        </button>

                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                            title="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content / Viewer Area */}
                <div className="flex-1 overflow-auto bg-slate-900/5 p-4 sm:p-8 flex items-center justify-center min-h-[400px]">
                    {isPdf ? (
                        <div className="w-full h-[65vh] flex flex-col bg-white rounded-2xl shadow-inner overflow-hidden border border-slate-200">
                            {blobUrl ? (
                                <iframe 
                                    src={blobUrl} 
                                    className="w-full h-full"
                                    title="Receipt PDF"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                                    <FileText className="w-12 h-12 animate-pulse" />
                                    <p className="text-sm font-semibold">Loading document...</p>
                                </div>
                            )}
                        </div>
                    ) : isImage ? (
                        <div className="overflow-auto max-h-[65vh] flex items-center justify-center w-full">
                            <img
                                src={blobUrl || billData}
                                alt={title || "Receipt"}
                                style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.15s ease' }}
                                className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-lg border border-slate-200/80 bg-white select-none"
                            />
                        </div>
                    ) : (
                        <div className="text-center p-8 text-slate-400">
                            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p className="font-bold text-sm">No valid preview format available</p>
                            <button
                                onClick={handleDownload}
                                className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold"
                            >
                                Download Attached File
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-between items-center text-xs font-semibold text-slate-400 shrink-0">
                    <span>AeroSky Financial Compliance Engine • Encrypted Evidence</span>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
