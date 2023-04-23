"use client";

import { EditorContent } from "@tiptap/react";

const TipTap = ({ editor }) => {
  return (
    <div className="w-full">
      <EditorContent
        className="border-white border-2 rounded-xl m-12 p-12 mockup-code bg-neutral"
        editor={editor}
      />
    </div>
  );
};

export default TipTap;
