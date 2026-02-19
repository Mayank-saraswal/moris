import { WebContainer } from "@webcontainer/api";

// Singleton WebContainer instance
let webcontainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

export const getWebContainer = async (): Promise<WebContainer> => {
    if (webcontainerInstance) {
        return webcontainerInstance;
    }

    if (!bootPromise) {
        bootPromise = WebContainer.boot({ coep: "credentialless" });
    }

    const instance = await bootPromise;

    if (bootPromise === null) {
        instance.teardown();
        throw new Error("WebContainer boot cancelled");
    }

    webcontainerInstance = instance;
    return webcontainerInstance;
};

export const teardownWebContainer = () => {
    if (webcontainerInstance) {
        webcontainerInstance.teardown();
        webcontainerInstance = null;
    }
    bootPromise = null;
};
