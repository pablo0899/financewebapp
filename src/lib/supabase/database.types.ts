// Tipos del esquema de Supabase. Generados con la herramienta de Supabase;
// después de cada migración, regenéralos con:
//   npx supabase gen types typescript --project-id jmxusutbfatprkuawvbm
// y conserva los alias del final.

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      accounts: {
        Row: {
          annual_rate: number | null;
          color: string;
          created_at: string;
          credit_limit: number | null;
          due_day: number | null;
          icon: string;
          id: string;
          kind: Database["public"]["Enums"]["account_kind"];
          name: string;
          opening_at: string;
          opening_balance: number;
          statement_day: number | null;
          user_id: string;
        };
        Insert: {
          annual_rate?: number | null;
          color?: string;
          created_at?: string;
          credit_limit?: number | null;
          due_day?: number | null;
          icon?: string;
          id?: string;
          kind: Database["public"]["Enums"]["account_kind"];
          name: string;
          opening_at?: string;
          opening_balance?: number;
          statement_day?: number | null;
          user_id?: string;
        };
        Update: {
          annual_rate?: number | null;
          color?: string;
          created_at?: string;
          credit_limit?: number | null;
          due_day?: number | null;
          icon?: string;
          id?: string;
          kind?: Database["public"]["Enums"]["account_kind"];
          name?: string;
          opening_at?: string;
          opening_balance?: number;
          statement_day?: number | null;
          user_id?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          color: string;
          created_at: string;
          icon: string;
          id: string;
          kind: Database["public"]["Enums"]["movement_kind"];
          monthly_budget: number | null;
          name: string;
          user_id: string;
        };
        Insert: {
          color?: string;
          created_at?: string;
          icon?: string;
          id?: string;
          kind: Database["public"]["Enums"]["movement_kind"];
          monthly_budget?: number | null;
          name: string;
          user_id?: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          icon?: string;
          id?: string;
          kind?: Database["public"]["Enums"]["movement_kind"];
          monthly_budget?: number | null;
          name?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      savings_goals: {
        Row: {
          color: string;
          created_at: string;
          icon: string;
          id: string;
          name: string;
          target: number | null;
          user_id: string;
        };
        Insert: {
          color?: string;
          created_at?: string;
          icon?: string;
          id?: string;
          name: string;
          target?: number | null;
          user_id?: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          icon?: string;
          id?: string;
          name?: string;
          target?: number | null;
          user_id?: string;
        };
        Relationships: [];
      };
      savings_movements: {
        Row: {
          amount: number;
          created_at: string;
          goal_id: string;
          id: string;
          note: string | null;
          occurred_on: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          goal_id: string;
          id?: string;
          note?: string | null;
          occurred_on?: string;
          user_id?: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          goal_id?: string;
          id?: string;
          note?: string | null;
          occurred_on?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "savings_movements_goal_id_fkey";
            columns: ["goal_id"];
            isOneToOne: false;
            referencedRelation: "savings_goals";
            referencedColumns: ["id"];
          },
        ];
      };
      transactions: {
        Row: {
          account_id: string | null;
          amount: number;
          category_id: string | null;
          created_at: string;
          id: string;
          kind: Database["public"]["Enums"]["movement_kind"];
          note: string | null;
          occurred_on: string;
          to_account_id: string | null;
          user_id: string;
        };
        Insert: {
          account_id?: string | null;
          amount: number;
          category_id?: string | null;
          created_at?: string;
          id?: string;
          kind: Database["public"]["Enums"]["movement_kind"];
          note?: string | null;
          occurred_on?: string;
          to_account_id?: string | null;
          user_id?: string;
        };
        Update: {
          account_id?: string | null;
          amount?: number;
          category_id?: string | null;
          created_at?: string;
          id?: string;
          kind?: Database["public"]["Enums"]["movement_kind"];
          note?: string | null;
          occurred_on?: string;
          to_account_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_to_account_id_fkey";
            columns: ["to_account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      account_kind: "debit" | "credit" | "yield";
      movement_kind: "income" | "expense" | "transfer" | "adjustment";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Alias usados en la app ------------------------------------------------------
type Tables = Database["public"]["Tables"];

export type MovementKind = Database["public"]["Enums"]["movement_kind"];
/** Las categorías solo son de ingreso o gasto (check en la BD). */
export type CategoryKind = Extract<MovementKind, "income" | "expense">;
export type AccountKind = Database["public"]["Enums"]["account_kind"];
export type Account = Tables["accounts"]["Row"];
export type Category = Tables["categories"]["Row"];
export type Transaction = Tables["transactions"]["Row"];
export type SavingsGoal = Tables["savings_goals"]["Row"];
export type SavingsMovement = Tables["savings_movements"]["Row"];
