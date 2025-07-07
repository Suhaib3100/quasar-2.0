import { sql } from '@neondatabase/serverless';
import { Pool } from 'pg';

// Create a pool using the DATABASE_URL from environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Export the sql template literal for use in queries
export { sql };

// Export a function to get a client from the pool
export async function getClient() {
  return await pool.connect();
}

// Export a function to run a query
export async function query(text: string, params?: any[]) {
  const client = await getClient();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

// Export types for database entities
export interface ModAction {
  id: number;
  type: string;
  user_id: string;
  moderator_id: string;
  guild_id: string;
  reason: string;
  duration?: number;
  is_active: boolean;
  expires_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface WarningSettings {
  id: number;
  guild_id: string;
  max_warnings: number;
  auto_timeout: boolean;
  timeout_duration: number;
  auto_kick: boolean;
  auto_ban: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface User {
  user_id: string;
  username: string;
  discriminator: string;
  avatar: string;
  joined_at: Date;
  status: string;
  roles: string[];
} 