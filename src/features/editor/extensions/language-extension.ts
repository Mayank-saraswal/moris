import { Extension } from "@codemirror/state";

import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { php } from "@codemirror/lang-php";
import { rust } from "@codemirror/lang-rust";
import { sql } from "@codemirror/lang-sql";
import { xml } from "@codemirror/lang-xml";
import { sass } from "@codemirror/lang-sass";
import { less } from "@codemirror/lang-less";
import { go } from "@codemirror/lang-go";
import { vue } from "@codemirror/lang-vue";
import { angular } from "@codemirror/lang-angular";
import { yaml } from "@codemirror/lang-yaml";
import { liquid } from "@codemirror/lang-liquid";

export const getLanguageExtension = (fileName: string): Extension => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    switch (ext) {
        case "js":
        case "mjs":
        case "cjs":
            return javascript();
        case "ts":
        case "mts":
        case "cts":
            return javascript({ typescript: true });
        case "jsx":
            return javascript({ jsx: true });
        case "tsx":
            return javascript({ typescript: true, jsx: true });
        case "html":
            return html();
        case "css":
            return css();
        case "json":
            return json();
        case "md":
            return markdown();
        case "py":
            return python();
        case "cpp":
        case "c":
        case "h":
        case "hpp":
            return cpp();
        case "java":
            return java();
        case "php":
            return php();
        case "rs":
            return rust();
        case "sql":
            return sql();
        case "xml":
        case "svg":
            return xml();
        case "scss":
        case "sass":
            return sass();
        case "less":
            return less();
        case "go":
            return go();
        case "vue":
            return vue();
        case "yaml":
        case "yml":
            return yaml();
        case "liquid":
            return liquid();
        case "ng":
            return angular();
        default:
            return [];
    }
}