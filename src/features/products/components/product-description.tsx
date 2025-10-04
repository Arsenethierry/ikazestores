"use client";

import { useState, useEffect } from "react";
import DOMPurify from "isomorphic-dompurify";
import { Button } from "@/components/ui/button";

interface ProductDescriptionProps {
    description: string;
    className?: string;
    allowedTags?: string[];
    allowedAttributes?: string[];
    maxLength?: number;
    truncate?: boolean;
    expandable?: boolean;
}

export const ProductDescription: React.FC<ProductDescriptionProps> = ({
    description,
    className = "",
    allowedTags,
    allowedAttributes,
    maxLength,
    truncate = false,
    expandable = false,
}) => {
    console.log(description)
    const [isExpanded, setIsExpanded] = useState(!truncate);
    const [textContent, setTextContent] = useState("");

    useEffect(() => {
        if (typeof window !== "undefined" && description) {
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = description;
            setTextContent(tempDiv.textContent || "");
        }
    }, [description]);

    const sanitizeConfig = {
        USE_PROFILES: { html: true },
        ALLOWED_TAGS: allowedTags || [
            "p", "br", "strong", "em", "ul", "ol", "li", "blockquote",
            "h1", "h2", "h3", "h4", "h5", "h6", "a", "img", "code", "pre", "table", "thead", "tbody", "tr", "th", "td", "span", "div"
        ],
        ALLOWED_ATTR: allowedAttributes || ["href", "src", "alt", "title", "class", "style"],
        ALLOW_DATA_ATTR: true,
    };

    const effectiveTextLength = textContent.length;
    const shouldTruncate =
        truncate && !isExpanded && maxLength && effectiveTextLength > maxLength;

    let processedDescription = description;
    if (shouldTruncate) {
        const truncated = textContent.substring(0, maxLength);
        processedDescription = truncated + "...";
    }

    const sanitizedDescription = DOMPurify.sanitize(processedDescription, sanitizeConfig);

    const defaultStyles = `
  prose prose-sm sm:prose-base lg:prose-lg max-w-none
  break-words word-break-break-word
  prose-p:whitespace-normal prose-p:break-words
  prose-img:max-w-full prose-img:rounded-lg
  prose-table:max-w-full prose-table:overflow-x-auto
  prose-pre:bg-gray-800 prose-pre:text-white prose-pre:p-4 prose-pre:rounded-lg
  prose-pre:overflow-x-auto prose-pre:max-w-full
  prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
  prose-code:break-words
  [&>*]:whitespace-normal [&>*]:break-words
`;

    if (!description || description.trim() === "") return null;

    return (
        <div className="space-y-2 w-full">
            <div
                className={`${defaultStyles} ${className}`.trim()}
                dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
            />
            {truncate && expandable && maxLength && effectiveTextLength > maxLength && (
                <Button
                    onClick={() => setIsExpanded(!isExpanded)}
                    variant="ghost"
                    size="xs"
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                    {isExpanded ? "Show less" : "Show more"}
                </Button>
            )}
        </div>
    );
};