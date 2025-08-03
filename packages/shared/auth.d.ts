import { SupabaseClient } from '@supabase/supabase-js';
export interface AuthConfig {
    url: string;
    anonKey: string;
    storage?: any;
}
export interface AuthUser {
    id: string;
    email: string;
    emailConfirmed: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface AuthSession {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
}
export interface AuthResponse<T = any> {
    data?: T;
    error?: string;
    message?: string;
}
export declare class SupabaseAuth {
    private static instance;
    private supabase;
    constructor(config: AuthConfig);
    static getInstance(config?: AuthConfig): SupabaseAuth;
    get client(): SupabaseClient;
    signUp(email: string, password: string): Promise<AuthResponse<AuthSession>>;
    signIn(email: string, password: string): Promise<AuthResponse<AuthSession>>;
    signOut(): Promise<AuthResponse<null>>;
    getCurrentUser(): Promise<AuthResponse<AuthUser>>;
    getCurrentSession(): Promise<AuthResponse<AuthSession>>;
    resetPassword(email: string, redirectTo?: string): Promise<AuthResponse<null>>;
    updatePassword(newPassword: string): Promise<AuthResponse<AuthUser>>;
    onAuthStateChange(callback: (session: AuthSession | null) => void): {
        data: {
            subscription: import("@supabase/supabase-js").Subscription;
        };
    };
    refreshSession(): Promise<AuthResponse<AuthSession>>;
    private transformUser;
    private transformSession;
}
export declare const createAuth: (config: AuthConfig) => SupabaseAuth;
export declare const getAuth: (config?: AuthConfig) => SupabaseAuth;
export type { User, Session, AuthError } from '@supabase/supabase-js';
//# sourceMappingURL=auth.d.ts.map