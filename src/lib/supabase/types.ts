/**
 * Types Supabase — Restaurant Central
 *
 * Placeholder minimal pour createClient<Database>.
 * Pour des types complets générés depuis le schéma :
 *   npx supabase gen types typescript --project-id "<PROJECT_REF>" > src/lib/supabase/types.generated.ts
 * puis remplacer ce fichier ou réexporter depuis types.generated.ts.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, string>
  }
}
