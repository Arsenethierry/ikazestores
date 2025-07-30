"use client";

import { useEditor, EditorContent } from "@tiptap/react"
import { Placeholder } from "@tiptap/extension-placeholder"
import StarterKit from "@tiptap/starter-kit"
import { useFormContext } from "react-hook-form";
import { useEffect } from "react";
import { Toggle } from "@/components/ui/toggle"
import { Bold, Italic, List, ListOrdered, Strikethrough } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

const Tiptap = ({ val }: { val: string }) => {
    const { setValue } = useFormContext();

    const editor = useEditor({
        extensions: [
            Placeholder.configure({
                placeholder: "Add a longer description for your products",
                emptyNodeClass:
                    "first:before:text-gray-600 first:before:float-left first:before:content-[attr(data-placeholder)] first:before:pointer-events-none",
            }),
            StarterKit.configure({
                orderedList: {
                    HTMLAttributes: {
                        class: "list-decimal pl-4"
                    }
                },

                bulletList: {
                    HTMLAttributes: {
                        class: "list-disc pl-4",
                    },
                },
            })
        ],

        onUpdate: ({ editor }) => {
            const content = editor.getHTML();
            setValue("description", content, {
                shouldValidate: true,
                shouldDirty: true,
            })
        },
        editorProps: {
            attributes: {
                class:
                    "min-h-[120px] w-full rounded-md border-0 bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 prose prose-sm max-w-none",
            },
        },
        content: val,
    });

    useEffect(() => {
        if (editor && editor.isEmpty) {
            editor.commands.setContent(val)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [val]);

    if (!editor) {
        return null;
    }

    const ToolbarButton = ({
        onClick,
        isActive,
        children
    }: {
        onClick: () => void;
        isActive: boolean;
        children: React.ReactNode
    }) => (
        <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClick}
            className={cn(
                "h-8 w-8 p-0",
                isActive && "bg-muted"
            )}
        >
            {children}
        </Button>
    )

    return (
        <div className="border border-input rounded-md">
            <div className="border-b border-input p-2 flex items-center gap-1">
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive("bold")}
                >
                    <Bold className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive("italic")}
                >
                    <Italic className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    isActive={editor.isActive("strike")}
                >
                    <Strikethrough className="w-4 h-4" />
                </ToolbarButton>
                <div className="w-px h-6 bg-border mx-1" />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive("orderedList")}
                >
                    <ListOrdered className="w-4 h-4" />
                </ToolbarButton>

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive("bulletList")}
                >
                    <List className="w-4 h-4" />
                </ToolbarButton>

            </div>
            <EditorContent editor={editor} />
        </div>
    );
}

export default Tiptap;