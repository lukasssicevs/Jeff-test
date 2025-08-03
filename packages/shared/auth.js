import { createClient } from '@supabase/supabase-js';
export class SupabaseAuth {
    constructor(config) {
        this.supabase = createClient(config.url, config.anonKey, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: false, // Disable for mobile
                storage: config.storage, // Use platform-specific storage
            },
        });
    }
    static getInstance(config) {
        if (!SupabaseAuth.instance) {
            if (!config) {
                throw new Error('Auth config is required for first initialization');
            }
            SupabaseAuth.instance = new SupabaseAuth(config);
        }
        return SupabaseAuth.instance;
    }
    // Get the underlying Supabase client for advanced operations
    get client() {
        return this.supabase;
    }
    // Sign up with email and password
    async signUp(email, password) {
        try {
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
            });
            if (error) {
                return { error: error.message };
            }
            if (!data.user || !data.session) {
                return {
                    error: 'Account created but verification required',
                    message: 'Please check your email to verify your account'
                };
            }
            const authSession = this.transformSession(data.user, data.session);
            return {
                data: authSession,
                message: 'Account created successfully'
            };
        }
        catch (error) {
            return {
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }
    // Sign in with email and password
    async signIn(email, password) {
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) {
                return { error: error.message };
            }
            if (!data.user || !data.session) {
                return { error: 'Invalid credentials' };
            }
            const authSession = this.transformSession(data.user, data.session);
            return {
                data: authSession,
                message: 'Signed in successfully'
            };
        }
        catch (error) {
            return {
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }
    // Sign out
    async signOut() {
        try {
            const { error } = await this.supabase.auth.signOut();
            if (error) {
                return { error: error.message };
            }
            return { data: null, message: 'Signed out successfully' };
        }
        catch (error) {
            return {
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }
    // Get current user
    async getCurrentUser() {
        try {
            const { data: { user }, error } = await this.supabase.auth.getUser();
            if (error) {
                return { error: error.message };
            }
            if (!user) {
                return { error: 'No authenticated user' };
            }
            const authUser = this.transformUser(user);
            return { data: authUser };
        }
        catch (error) {
            return {
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }
    // Get current session
    async getCurrentSession() {
        try {
            const { data: { session }, error } = await this.supabase.auth.getSession();
            if (error) {
                return { error: error.message };
            }
            if (!session || !session.user) {
                return { error: 'No active session' };
            }
            const authSession = this.transformSession(session.user, session);
            return { data: authSession };
        }
        catch (error) {
            return {
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }
    // Reset password
    async resetPassword(email, redirectTo) {
        try {
            const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo,
            });
            if (error) {
                return { error: error.message };
            }
            return {
                data: null,
                message: 'Password reset email sent'
            };
        }
        catch (error) {
            return {
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }
    // Update password (user must be authenticated)
    async updatePassword(newPassword) {
        try {
            const { data, error } = await this.supabase.auth.updateUser({
                password: newPassword,
            });
            if (error) {
                return { error: error.message };
            }
            if (!data.user) {
                return { error: 'Failed to update password' };
            }
            const authUser = this.transformUser(data.user);
            return {
                data: authUser,
                message: 'Password updated successfully'
            };
        }
        catch (error) {
            return {
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }
    // Listen to auth state changes
    onAuthStateChange(callback) {
        return this.supabase.auth.onAuthStateChange((event, session) => {
            if (session && session.user) {
                const authSession = this.transformSession(session.user, session);
                callback(authSession);
            }
            else {
                callback(null);
            }
        });
    }
    // Refresh the current session
    async refreshSession() {
        try {
            const { data, error } = await this.supabase.auth.refreshSession();
            if (error) {
                return { error: error.message };
            }
            if (!data.session || !data.user) {
                return { error: 'Failed to refresh session' };
            }
            const authSession = this.transformSession(data.user, data.session);
            return { data: authSession };
        }
        catch (error) {
            return {
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }
    // Helper method to transform Supabase User to AuthUser
    transformUser(user) {
        return {
            id: user.id,
            email: user.email,
            emailConfirmed: user.email_confirmed_at !== null,
            createdAt: user.created_at,
            updatedAt: user.updated_at || user.created_at,
        };
    }
    // Helper method to transform Supabase Session to AuthSession
    transformSession(user, session) {
        return {
            user: this.transformUser(user),
            accessToken: session.access_token,
            refreshToken: session.refresh_token,
            expiresAt: session.expires_at || 0,
        };
    }
}
// Convenience functions for easy usage
export const createAuth = (config) => new SupabaseAuth(config);
export const getAuth = (config) => SupabaseAuth.getInstance(config);
