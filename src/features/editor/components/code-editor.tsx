import { useEffect, useMemo, useRef } from "react";
import { EditorView  , keymap} from "@codemirror/view";
import {basicSetup} from "codemirror"
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import { customTheme } from "../extensions/theme";
import { getLanguageExtension } from "../extensions/language-extension";
import {  indentWithTab } from "@codemirror/commands";
import { minimap } from "../extensions/minimap";
import {indentationMarkers} from "@replit/codemirror-indentation-markers"
import {customSetup} from "../extensions/custom-setup"
import { suggestions } from "../extensions/suggestion";
interface Props{
    fileName:string;
    initialValue?:string;
    onChange:(Value:string)=>void;
}
export const CodeEditor = ({fileName,initialValue,onChange}:Props) => {


    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);

    const languageExtension = useMemo(() => {
        return getLanguageExtension(fileName);
    }, [fileName]);
    useEffect(() => {
        if (!editorRef.current) return;
        const view = new EditorView({
            parent: editorRef.current,
            doc: initialValue || "",
            extensions: [
                oneDark,
                customTheme,
                customSetup,
                languageExtension,
                keymap.of([indentWithTab]),
                minimap(),
                indentationMarkers(),
                suggestions(fileName),
                EditorView.updateListener.of((update)=>{
                    if(update.docChanged){
                        onChange(update.state.doc.toString());
                    }
                })
            ],
        });
        viewRef.current = view;
        return () => {
            view.destroy();
        };
        
    } ,[languageExtension]);
    return (
        <div ref={editorRef} className="size-full pl-4 bg-background" />
    );
};