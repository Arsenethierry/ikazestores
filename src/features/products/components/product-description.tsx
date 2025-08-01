"use client";

import { useState } from "react";
import DOMPurify from "isomorphic-dompurify";

interface ProductDescriptionProps {
    description: string;
    className?: string;
    allowedTags?: string[];
    allowedAttributes?: string[];
}

export const ProductDescription: React.FC<ProductDescriptionProps & {
    showWordCount?: boolean;
    maxLength?: number;
    truncate?: boolean;
    expandable?: boolean;
}> = ({
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

        let processedDescription = description;

        if (truncate && !isExpanded && maxLength) {
            const textContent = description.replace(/<[^>]*>/g, '');
            if (textContent.length > maxLength) {
                processedDescription = textContent.substring(0, maxLength) + '...';
            }
        }

        const sanitizedDescription = DOMPurify.sanitize(processedDescription, sanitizeConfig);

        const defaultStyles = `
    prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none
    prose-headings:font-semibold prose-headings:text-gray-900
    prose-p:text-gray-700 prose-p:leading-relaxed
    prose-strong:text-gray-900 prose-strong:font-semibold
    prose-em:text-gray-700 prose-em:italic
    prose-ul:list-disc prose-ol:list-decimal
    prose-li:text-gray-700 prose-li:leading-relaxed
    prose-blockquote:border-l-4 prose-blockquote:border-gray-300 
    prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600
    prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
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
                <div
                    className={`${defaultStyles} ${className}`.trim()}
                    dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                />

                {truncate && expandable && maxLength && description.replace(/<[^>]*>/g, '').length > maxLength && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-sm text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                    >
                        {isExpanded ? 'Show less' : 'Show more'}
                    </button>
                )}
            </div>
        )
    }