"use client";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ThemeProvider } from "./theme-provider";
import { UnauthenticatedView } from "@/features/auth/components/unauthenticated-view";
import { AuthLoadingView } from "@/features/auth/components/auth-loading-view";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

function AuthGate({ children }: { children: React.ReactNode }) {
    const { isLoaded, isSignedIn } = useAuth();

    if (!isLoaded) {
        return <AuthLoadingView />;
    }

    if (!isSignedIn) {
        return <UnauthenticatedView />;
    }

    return <>{children}</>;
}

export const Providers = ({ children }: { children: React.ReactNode }) => {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 30 * 1000, // 30 seconds
                        refetchOnWindowFocus: false,
                    },
                },
            })
    );

    return (
        <ClerkProvider>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange
                >
                    <AuthGate>{children}</AuthGate>
                </ThemeProvider>
            </QueryClientProvider>
        </ClerkProvider>
    );
};