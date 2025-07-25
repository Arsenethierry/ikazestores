import { convertFileToUrl } from "@/lib/utils";
import { Upload, X } from "lucide-react";
import Image from "next/image";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

type ImageUploaderProps = {
    files: any[];
    onChange: (files: File[]) => void;
    caption?: string;
    maxFiles?: number;
    initialValues?: any | null;
    isEditMode?: boolean;
}
export const MultiImageUploader = ({
    files = [],
    isEditMode = false,
    onChange,
    caption,
    maxFiles = 5,
}: ImageUploaderProps) => {

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const currentFiles = files || [];
        const newFiles = [...currentFiles, ...acceptedFiles].slice(0, maxFiles);
        onChange(newFiles);
    }, [files, maxFiles, onChange]);

    const removeFiles = (index: number) => {
        const newFiles = files?.filter((_, i) => i !== index);
        onChange(newFiles || []);
    };

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.svg']
        },
        maxFiles: maxFiles - (files?.length || 0),
        disabled: files?.length >= maxFiles
    });

    return (
        <div className="w-full space-y-4">
            {(!files || files.length < maxFiles) && (
                <div {...getRootProps()} className="file-upload">
                    <input {...getInputProps()} />
                    <Upload />
                    <div className="file-upload_label">
                        <p className="text-[14px] leading-[18px] font-normal">
                            <span className="text-green-500">Click to upload </span>
                            or drag and drop
                        </p>
                        <p className="text-[12px] leading-[16px] font-normal">
                            {caption || "SVG, PNG, JPG or GIF (max. 2000x500px)"}
                        </p>
                        <p className="text-[12px] leading-[16px] text-gray-500">
                            {files?.length || 0} of {maxFiles} files uploaded
                        </p>
                    </div>
                </div>
            )}

            <div className="flex flex-wrap gap-4">
                {files && files.map((file, index) => {

                    return (
                        <div key={index} className="relative">
                            <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            type="button"
                                            onClick={() => removeFiles(index)}
                                            className="absolute right-0 -top-1 h-max p-1 w-max bg-muted border border-red-500 object-cover rounded-full"
                                        >
                                            <X className="h-4 w-4 text-red-500" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent className="dark px-2 py-1 text-xs" showArrow={true}>
                                        Remove image
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            {isEditMode && !(file instanceof File) ? (
                                <Image
                                    src={file}
                                    width={200}
                                    height={100}
                                    alt={`banner ${index + 1}`}
                                    className="h-[50px] w-[200px] object-cover rounded-lg"
                                />
                            ) : (
                                <Image
                                    src={convertFileToUrl(file)}
                                    width={200}
                                    height={100}
                                    alt={`banner ${index + 1}`}
                                    className="h-[50px] w-[200px] object-cover rounded-lg"
                                />
                            )}
                        </div>
                    )
                })}
            </div>

        </div>
    )
};