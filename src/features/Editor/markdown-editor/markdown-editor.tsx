import {
  selectOpenFileContent,
  // selectOpenFileId,
} from "@/API/editor-api/editor-api.selectors";
import { useAppSelectorWithParams } from "@/hooks/hooks";
import { useEffect, useRef } from "react";
import {
  MDXEditor,
  MDXEditorMethods,
  headingsPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
} from "@mdxeditor/editor";
//import "@mdxeditor/editor/style.css";

type MarkdownEditorProps = {
  editorIdx: number;
};

function MarkdownEditor(props: MarkdownEditorProps) {
  const editorRef = useRef<MDXEditorMethods>(null);

  const activeFileContent = useAppSelectorWithParams(selectOpenFileContent, {
    editorIdx: props.editorIdx,
  });

  // const currentFileId = useAppSelectorWithParams(selectOpenFileId, {
  //   editorIdx: props.editorIdx,
  // });

  // Force update when content changes
  useEffect(() => {
    if (editorRef.current && activeFileContent !== null) {
      editorRef.current.setMarkdown(
        activeFileContent ? activeFileContent : "no data"
      );
    }
  }, [activeFileContent]);

  return (
    <div className="flex-1 overflow-hidden">
      <MDXEditor
        ref={editorRef}
        //key={currentFileId}
        markdown={activeFileContent ? activeFileContent : "no data"}
        //   onChange={handleAutoSaving}
        //   onBlur={handleBlur}
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          markdownShortcutPlugin(),
        ]}
        contentEditableClassName="prose-container
            outline-none
            px-8 py-5
            [&_h1]:text-4xl [&_h1]:font-bold [&_h1]:mb-6 [&_h1]:text-gray-900 [&_h1]:dark:text-white [&_h1]:border-b [&_h1]:border-gray-200 [&_h1]:dark:border-gray-700 [&_h1]:pb-2
            [&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-4 [&_h2]:text-gray-800 [&_h2]:dark:text-gray-100
            [&_h3]:text-2xl [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-3 [&_h3]:text-gray-800 [&_h3]:dark:text-gray-100
            [&_h4]:text-xl [&_h4]:font-medium [&_h4]:mt-4 [&_h4]:mb-2 [&_h4]:text-gray-700 [&_h4]:dark:text-gray-200
            [&_h5]:text-lg [&_h5]:font-medium [&_h5]:mt-4 [&_h5]:mb-2 [&_h5]:text-gray-700 [&_h5]:dark:text-gray-200
            [&_h6]:text-base [&_h6]:font-medium [&_h6]:mt-3 [&_h6]:mb-2 [&_h6]:text-gray-600 [&_h6]:dark:text-gray-300
            
            [&_p]:text-gray-700 [&_p]:dark:text-gray-300 [&_p]:leading-relaxed [&_p]:mb-4 [&_p]:text-base
            
            [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline [&_a]:decoration-2 [&_a]:underline-offset-2 [&_a:hover]:text-blue-800 [&_a:hover]:dark:text-blue-300 [&_a]:transition-colors
            
            [&_strong]:font-semibold [&_strong]:text-gray-900 [&_strong]:dark:text-gray-100
            [&_em]:italic [&_em]:text-gray-600 [&_em]:dark:text-gray-400
            
            [&_ul]:list-disc [&_ul]:list-outside [&_ul]:ml-6 [&_ul]:mb-4 [&_ul]:space-y-1
            [&_ol]:list-decimal [&_ol]:list-outside [&_ol]:ml-6 [&_ol]:mb-4 [&_ol]:space-y-1
            [&_li]:text-gray-700 [&_li]:dark:text-gray-300 [&_li]:leading-relaxed
            [&_li_ul]:mt-2 [&_li_ol]:mt-2
            
            [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:dark:border-blue-400 [&_blockquote]:pl-4 [&_blockquote]:py-2 [&_blockquote]:my-6 [&_blockquote]:bg-gray-50 [&_blockquote]:dark:bg-gray-800 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_blockquote]:dark:text-gray-400
            
            [&_code]:bg-gray-100 [&_code]:dark:bg-gray-800 [&_code]:text-gray-800 [&_code]:dark:text-gray-200 [&_code]:px-2 [&_code]:py-1 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono
            
            [&_pre]:bg-gray-900 [&_pre]:dark:bg-gray-950 [&_pre]:text-gray-100 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:mb-4 [&_pre]:border [&_pre]:border-gray-200 [&_pre]:dark:border-gray-700
            [&_pre_code]:bg-transparent [&_pre_code]:text-inherit [&_pre_code]:p-0 [&_pre_code]:rounded-none
            
            [&_table]:w-full [&_table]:border-collapse [&_table]:mb-6 [&_table]:border [&_table]:border-gray-200 [&_table]:dark:border-gray-700 [&_table]:rounded-lg [&_table]:overflow-hidden
            [&_th]:bg-gray-100 [&_th]:dark:bg-gray-800 [&_th]:text-gray-900 [&_th]:dark:text-gray-100 [&_th]:font-semibold [&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:border-b [&_th]:border-gray-200 [&_th]:dark:border-gray-700
            [&_td]:text-gray-700 [&_td]:dark:text-gray-300 [&_td]:px-4 [&_td]:py-3 [&_td]:border-b [&_td]:border-gray-200 [&_td]:dark:border-gray-700
            [&_tr:last-child_td]:border-b-0
            [&_tr:hover]:bg-gray-50 [&_tr:hover]:dark:bg-gray-800
            
            [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-gray-300 [&_hr]:dark:border-gray-600 [&_hr]:my-8
            
            [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:shadow-md [&_img]:my-4"
      />
    </div>
  );
}

export default MarkdownEditor;
