import { createClient } from '@supabase/supabase-js';
import { API_CONFIG } from '../config';

export class PlayoffService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      API_CONFIG.supabaseUrl,
      API_CONFIG.supabaseAnonKey
    );
  }

  async submitPicks(teams: string[], champion: string) {
    const { data: user } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: playoffUser } = await this.supabase
      .from('playoff_users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    const { data, error } = await this.supabase
      .from('playoff_picks')
      .upsert({
        user_id: playoffUser.id,
        teams: teams,
        champion: champion,
        submission_time: new Date().toISOString()
      });

    if (error) throw error;
    return data;
  }

  async getUserPicks() {
    const { data: user } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await this.supabase
      .from('playoff_picks')
      .select(`
        *,
        playoff_users (
          wallet_address
        )
      `)
      .eq('playoff_users.auth_id', user.id)
      .single();

    if (error) throw error;
    return data;
  }

  async getLeaderboard() {
    const { data, error } = await this.supabase
      .from('playoff_leaderboard')
      .select(`
        *,
        playoff_users (
          wallet_address
        )
      `)
      .order('rank', { ascending: true })
      .limit(100);

    if (error) throw error;
    return data;
  }
}