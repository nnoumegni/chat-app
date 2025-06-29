import React, { useRef, useState, ChangeEvent, DragEvent, useEffect } from 'react';

interface FileUploadProps {
    accept?: string;
    multiple?: boolean;
    maxFileSize?: number;
    onUpload: (files: File[]) => void;
    onError?: (error: string) => void;
}

interface FileWithPreview extends File {
    preview?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
    accept = 'image/png,image/jpeg,image/svg+xml,image/webp,image/gif',
    multiple = true,
    maxFileSize = 5 * 1024 * 1024,
    onUpload,
    onError
}) => {
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);

    // Create preview URLs for files
    useEffect(() => {
        // Clean up preview URLs when component unmounts
        return () => {
            selectedFiles.forEach(file => {
                if (file.preview) {
                    URL.revokeObjectURL(file.preview);
                }
            });
        };
    }, []);

    const createFilePreview = (file: File): FileWithPreview => {
        const fileWithPreview = file as FileWithPreview;
        if (file.type.startsWith('image/')) {
            fileWithPreview.preview = URL.createObjectURL(file);
        }
        return fileWithPreview;
    };

    const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            validateAndProcessFiles(Array.from(files));
        }
    };

    const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setDragOver(true);
    };

    const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setDragOver(false);
    };

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setDragOver(false);

        const files = event.dataTransfer.files;
        if (files) {
            validateAndProcessFiles(Array.from(files));
        }
    };

    const validateAndProcessFiles = (files: File[]) => {
        const validFiles = files.filter(file => {
            if (file.size > maxFileSize) {
                onError?.(`File ${file.name} is too large. Maximum size is ${maxFileSize / 1024 / 1024}MB`);
                return false;
            }

            if (accept !== '*/*') {
                const acceptedTypes = accept.split(',').map(type => type.trim());
                const fileType = file.type || '';
                const isValidType = acceptedTypes.some(type => {
                    if (type.endsWith('/*')) {
                        return fileType.startsWith(type.replace('/*', ''));
                    }
                    return type === fileType;
                });

                if (!isValidType) {
                    onError?.(`File ${file.name} is not an accepted file type`);
                    return false;
                }
            }

            return true;
        });

        if (validFiles.length > 0) {
            const filesWithPreviews = validFiles.map(createFilePreview);
            setSelectedFiles(prev => [...prev, ...filesWithPreviews]);
            onUpload(validFiles);
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => {
            const file = prev[index];
            if (file.preview) {
                URL.revokeObjectURL(file.preview);
            }
            return prev.filter((_, i) => i !== index);
        });
    };

    return (
        <div className="w-full">
            <div
                className={`bg-gray-50 text-center px-4 rounded max-w-md flex flex-col items-center justify-center cursor-pointer border-2 ${
                    dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
                } border-dashed mx-auto relative`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {selectedFiles.length === 0 ? (
                    <>
                        <div className="py-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 mb-4 fill-slate-600 inline-block" viewBox="0 0 32 32">
                                <path d="M23.75 11.044a7.99 7.99 0 0 0-15.5-.009A8 8 0 0 0 9 27h3a1 1 0 0 0 0-2H9a6 6 0 0 1-.035-12 1.038 1.038 0 0 0 1.1-.854 5.991 5.991 0 0 1 11.862 0A1.08 1.08 0 0 0 23 13a6 6 0 0 1 0 12h-3a1 1 0 0 0 0 2h3a8 8 0 0 0 .75-15.956z" />
                                <path d="M20.293 19.707a1 1 0 0 0 1.414-1.414l-5-5a1 1 0 0 0-1.414 0l-5 5a1 1 0 0 0 1.414 1.414L15 16.414V29a1 1 0 0 0 2 0V16.414z" />
                            </svg>
                            <h4 className="text-base font-semibold text-slate-600">Drag and drop files here</h4>
                        </div>

                        <hr className="w-full border-gray-300 my-2" />

                        <div className="py-6">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                multiple={multiple}
                                accept={accept}
                                onChange={handleFileSelect}
                                id="uploadFile1"
                            />
                            <label
                                htmlFor="uploadFile1"
                                className="block px-6 py-2.5 rounded text-slate-600 text-sm tracking-wider font-semibold border-none outline-none cursor-pointer bg-gray-200 hover:bg-gray-100"
                            >
                                Browse Files
                            </label>
                            <p className="text-xs text-slate-500 mt-4">PNG, JPG SVG, WEBP, and GIF are Allowed.</p>
                        </div>
                    </>
                ) : (
                    <div className="w-full py-4">
                        <div className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide">
                            <label
                                htmlFor="uploadFile1"
                                className="flex-none w-20 h-20 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white cursor-pointer hover:border-blue-400 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </label>
                            {selectedFiles.map((file, index) => (
                                <div key={index} className="relative flex-none w-20 h-20 group">
                                    {file.preview ? (
                                        <img
                                            src={file.preview}
                                            alt={file.name}
                                            className="w-20 h-20 object-cover rounded-lg"
                                        />
                                    ) : (
                                        <div className="w-20 h-20 flex items-center justify-center bg-gray-100 rounded-lg">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                    )}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeFile(index);
                                        }}
                                        className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                multiple={multiple}
                                accept={accept}
                                onChange={handleFileSelect}
                                id="uploadFile1"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}; 