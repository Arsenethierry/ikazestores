"use client";

import { useState } from "react";
import DOMPurify from "isomorphic-dompurify";

interface ProductDescriptionProps {
    description: string;
    className?: string;
    allowedTags?: string[];
    allowedAttributes?: string[];
    showWordCount?: boolean;
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
    expandable = false
}) => {
    const [isExpanded, setIsExpanded] = useState(!truncate);

    const sanitizeConfig = {
        USE_PROFILES: { html: true },
        ALLOWED_TAGS: allowedTags || [
            'p', 'br', 'strong', 'em', 'u', 's', 'sub', 'sup',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li',
            'blockquote', 'code', 'pre',
            'a', 'img',
            'table', 'thead', 'tbody', 'tr', 'th', 'td',
            'div', 'span'
        ],
        ALLOWED_ATTR: allowedAttributes || [
            'href', 'src', 'alt', 'title', 'class', 'id',
            'target', 'rel', 'width', 'height',
            'style', 'data-*'
        ],
        ALLOW_DATA_ATTR: true
    };

    const getTextContent = (html: string): string => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        return tempDiv.textContent || tempDiv.innerText || '';
    };

    const textContent = getTextContent(description);
    const shouldTruncate = truncate && !isExpanded && maxLength && textContent.length > maxLength;

    let processedDescription = description;

    if (shouldTruncate) {
        const truncatedText = textContent.substring(0, maxLength);
        
        processedDescription = truncatedText + '...';
    }

    const sanitizedDescription = DOMPurify.sanitize(processedDescription, sanitizeConfig);

    const defaultStyles = `
        prose prose-sm max-w-none
        prose-headings:font-semibold prose-headings:text-gray-900
        prose-p:text-gray-700 prose-p:leading-relaxed prose-p:my-2
        prose-strong:text-gray-900 prose-strong:font-semibold
        prose-em:text-gray-700 prose-em:italic
        prose-ul:list-disc prose-ul:my-2 prose-ol:list-decimal prose-ol:my-2
        prose-li:text-gray-700 prose-li:leading-relaxed prose-li:my-1
        prose-blockquote:border-l-4 prose-blockquote:border-gray-300 
        prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600
        prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
        prose-pre:bg-gray-800 prose-pre:text-white prose-pre:p-4 prose-pre:rounded-lg
        prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-800
        prose-img:rounded-lg prose-img:shadow-sm
        prose-table:border-collapse prose-th:border prose-th:border-gray-300 
        prose-th:bg-gray-50 prose-th:p-2 prose-td:border prose-td:border-gray-300 prose-td:p-2
    `;

    if (!description || description.trim() === '') {
        return null;
    }

    return (
        <div className="space-y-2">
            {shouldTruncate ? (
                <div className={`text-gray-700 leading-relaxed ${className}`.trim()}>
                    {processedDescription}
                </div>
            ) : (
                <div
                    className={`${defaultStyles} ${className}`.trim()}
                    dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                />
            )}

            {truncate && expandable && maxLength && textContent.length > maxLength && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-sm text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded inline-block"
                >
                    {isExpanded ? 'Show less' : 'Show more'}
                </button>
            )}
        </div>
    );
};