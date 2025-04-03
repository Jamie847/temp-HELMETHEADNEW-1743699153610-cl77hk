import { createClient } from '@supabase/supabase-js';
import { API_CONFIG } from '../config';

export class AuthService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      API_CONFIG.supabaseUrl,
      API_CONFIG.supabaseAnonKey
    );
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    // Create playoff user entry
    if (data?.user) {
      await this.supabase.from('playoff_users').insert({
        auth_id: data.user.id
      });
    }

    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  async getCurrentUser() {
    const { data: { user }, error } = await this.supabase.auth.getUser();
    if (error) throw error;
    return user;
  }

  async updateWalletAddress(walletAddress: string) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await this.supabase
      .from('playoff_users')
      .update({ wallet_address: walletAddress })
      .eq('auth_id', user.id);

    if (error) throw error;
  }
}