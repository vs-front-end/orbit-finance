import { userSchema, type AuthProvider, type User } from '@/domain';

import { supabase } from '../supabase';

export type AuthService = {
  getUser: () => Promise<User | null>;
  signIn: (provider: AuthProvider) => Promise<User>;
  signOut: () => Promise<void>;
};

export const authService: AuthService = {
  async getUser() {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    if (!session) return null;

    const { user } = session;
    const metadata = user.user_metadata ?? {};

    const parsed = userSchema.safeParse({
      id: user.id,
      name: metadata.name ?? metadata.full_name ?? user.email ?? 'Usuário',
      email: user.email ?? '',
      provider: 'github',
    });
    return parsed.success ? parsed.data : null;
  },

  async signIn(provider) {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;

    return new Promise<User>(() => {});
  },

  async signOut() {
    await supabase.auth.signOut();
  },
};
