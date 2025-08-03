import { createClient, SupabaseClient } from "@supabase/supabase-js";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export class ApiClient {
  private static instance: ApiClient;
  private supabase: SupabaseClient;

  constructor(config: SupabaseConfig) {
    this.supabase = createClient(config.url, config.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
    });
  }

  static getInstance(config?: SupabaseConfig): ApiClient {
    if (!ApiClient.instance) {
      if (!config) {
        throw new Error("Supabase config is required for first initialization");
      }
      ApiClient.instance = new ApiClient(config);
    }
    return ApiClient.instance;
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from("_health")
        .select("*")
        .limit(1);
      return !error;
    } catch {
      return false;
    }
  }
}
