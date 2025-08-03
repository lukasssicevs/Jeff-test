import { createBrowserClient } from "@supabase/ssr";
import { ApiClient } from "@repo/shared";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Initialize the shared API client
export const apiClient = ApiClient.getInstance({
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
});
