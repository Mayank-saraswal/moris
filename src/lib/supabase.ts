import { createClient } from "@supabase/supabase-js";

// Browser client — used for Supabase Realtime subscriptions only
// All DB queries go through Prisma, NOT the Supabase client
export function createSupabaseBrowserClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Missing Supabase environment variables");
    }

    return createClient(supabaseUrl, supabaseAnonKey, {
        realtime: {
            params: {
                eventsPerSecond: 10,
            },
        },
    });
}

// Singleton for browser usage
let browserClient: ReturnType<typeof createSupabaseBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
    if (!browserClient) {
        browserClient = createSupabaseBrowserClient();
    }
    return browserClient;
}
