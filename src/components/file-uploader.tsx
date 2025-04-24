import { convertFileToUrl } from "@/lib/utils";
import { Upload, X } from "lucide-react";
import Image from "next/image";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

type ImageUploaderProps = {
    file: string | File | undefined;
    onChange: (file: File | undefined) => void;
    caption?: string;
    imageHeight?: number;
    imageWidth?: number;
    className?: string;
    isEditMode?: boolean;
}

export const SingleImageUploader = ({
    file,
    onChange,
    caption,
    imageHeight = 50,
    imageWidth = 200,
    isEditMode = false,
}: ImageUploaderProps) => {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        // Only take the first file
        const newFile = acceptedFiles[0];
        if (newFile) {
            onChange(newFile);
        }
    }, [onChange]);

    const removeFile = () => {
        onChange(undefined);
    };

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.svg']
        },
        maxFiles: 1,
        multiple: false,
        disabled: !!file
    });

    return (
        <div className="flex flex-col">
            {!file && (
                <div {...getRootProps()} className="file-upload">
                    <input {...getInputProps()} />
                    <Upload />
                    <div className="file-upload_label">
                        <p className="text-[14px] leading-[18px] font-normal">
                            <span className="text-green-500">Click to upload </span>
                            or drag and drop
                        </p>
                        <p className="text-[12px] leading-[16px] font-normal">
                            {caption || "SVG, PNG, JPG or GIF"}
                        </p>
                    </div>
                </div>
            )}

            {file && (
                <div className="relative inline-block w-max">
                    <TooltipProvider delayDuration={0}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    onClick={removeFile}
                                    className="absolute right-0 -top-1 h-max p-1 w-max bg-muted border border-red-500 object-cover rounded-full z-10"
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
                            width={imageWidth}
                            height={imageHeight}
                            alt="uploaded image"
                            className={`h-[${imageHeight}px] w-[${imageWidth}px] object-cover rounded-lg`}
                        />
                    ) : file instanceof File ? (
                        <Image
                            src={convertFileToUrl(file)}
                            width={imageWidth}
                            height={imageHeight}
                            alt="uploaded image"
                            className={`h-[${imageHeight}px] w-[${imageWidth}px] object-cover rounded-lg`}
                        />
                    ) : null}
                </div>
            )}
        </div>
    )
}