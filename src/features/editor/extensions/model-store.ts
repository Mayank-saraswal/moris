/**
 * Module-level model store for CodeMirror extensions.
 * React context syncs into this store so non-React code can read current model preferences.
 */

import { DEFAULT_SUGGESTION_MODEL, DEFAULT_QUICK_EDIT_MODEL } from "@/lib/models";

let _suggestionModel = DEFAULT_SUGGESTION_MODEL;
let _quickEditModel = DEFAULT_QUICK_EDIT_MODEL;

export const modelStore = {
    get suggestionModel() {
        return _suggestionModel;
    },
    set suggestionModel(value: string) {
        _suggestionModel = value;
    },
    get quickEditModel() {
        return _quickEditModel;
    },
    set quickEditModel(value: string) {
        _quickEditModel = value;
    },
};
