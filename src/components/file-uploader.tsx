import { convertFileToUrl } from "@/lib/utils";
import { Upload } from "lucide-react";
import Image from "next/image";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

type FileUploaderProps = {
    files: File[] | undefined;
    onChange: (files: File[]) => void;
    caption?: string;
};

export const FileUploader = ({ files, onChange, caption }: FileUploaderProps) => {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        onChange(acceptedFiles);
    }, []);

    const { getRootProps, getInputProps } = useDropzone({ onDrop });

    return (
        <div {...getRootProps()} className="file-upload">
            <input {...getInputProps()} />
            {files && files?.length > 0 ? (
                <Image
                    src={convertFileToUrl(files[0])}
                    width={1000}
                    height={1000}
                    alt="uploaded image"
                    className="max-h-[400px] overflow-hidden object-cover"
                />
            ) : (
                <>
                    <Upload />
                    <div className="file-upload_label">
                        <p className="text-[14px] leading-[18px] font-normal">
                            <span className="text-green-500">Click to upload </span>
                            or drag and drop
                        </p>
                        <p className="text-[12px] leading-[16px] font-normal">
                            {caption ? caption : "SVG, PNG, JPG or GIF (max. 800x400px)"}
                        </p>
                    </div>
                </>
            )
            }
        </div >
    )
}