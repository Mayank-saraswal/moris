import { useCallback } from "react";

import { useEditorStore } from "../store/use-editor-store";

export const useEditor = (projectId: string) => {
    const store = useEditorStore();
    const tabState = useEditorStore((state)=>state.getTabState(projectId));

    const openFile= useCallback((
        fileId:string,
        options:{
            pinned?:boolean
        }
    )=>{
        store.openFile(projectId,fileId,options);
        
    },[store,projectId])

    const closeAllTabs = useCallback(()=>{
        store.closeAllTabs(projectId);
    },[store,projectId])

    const closeTab = useCallback((fileId:string)=>{
        store.closeTab(projectId,fileId);
    },[store,projectId])

    const setActiveTab = useCallback((fileId:string)=>{
        store.setActiveTab(projectId,fileId);
    },[store,projectId])

    return {
        openTabs:tabState.openTabs,
        activeTabId:tabState.activeTabId,
        previewTabId:tabState.previewTabId,
        tabState,
        openFile,
        closeAllTabs,
        closeTab,
        setActiveTab
    }

    
}