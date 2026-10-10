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
      biz_channels: {
        Row: {
          business_id: string;
          created_at: string;
          id: string;
          name: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          id?: string;
          name: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          id?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "biz_channels_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      biz_expense_categories: {
        Row: {
          business_id: string;
          color: string;
          created_at: string;
          icon: string;
          id: string;
          name: string;
        };
        Insert: {
          business_id: string;
          color?: string;
          created_at?: string;
          icon?: string;
          id?: string;
          name: string;
        };
        Update: {
          business_id?: string;
          color?: string;
          created_at?: string;
          icon?: string;
          id?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "biz_expense_categories_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      biz_expenses: {
        Row: {
          amount: number;
          business_id: string;
          category_id: string | null;
          created_at: string;
          created_by: string | null;
          description: string;
          id: string;
          occurred_on: string;
          paid_with: string;
          spent_by: string;
        };
        Insert: {
          amount: number;
          business_id: string;
          category_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          description: string;
          id?: string;
          occurred_on?: string;
          paid_with?: string;
          spent_by: string;
        };
        Update: {
          amount?: number;
          business_id?: string;
          category_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string;
          id?: string;
          occurred_on?: string;
          paid_with?: string;
          spent_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: "biz_expenses_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "biz_expenses_category_id_business_id_fkey";
            columns: ["category_id", "business_id"];
            isOneToOne: false;
            referencedRelation: "biz_expense_categories";
            referencedColumns: ["id", "business_id"];
          },
          {
            foreignKeyName: "biz_expenses_spent_by_business_id_fkey";
            columns: ["spent_by", "business_id"];
            isOneToOne: false;
            referencedRelation: "business_members";
            referencedColumns: ["id", "business_id"];
          },
        ];
      };
      biz_items: {
        Row: {
          active: boolean;
          business_id: string;
          created_at: string;
          icon: string;
          id: string;
          name: string;
          price: number | null;
        };
        Insert: {
          active?: boolean;
          business_id: string;
          created_at?: string;
          icon?: string;
          id?: string;
          name: string;
          price?: number | null;
        };
        Update: {
          active?: boolean;
          business_id?: string;
          created_at?: string;
          icon?: string;
          id?: string;
          name?: string;
          price?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "biz_items_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      biz_reimbursements: {
        Row: {
          amount: number;
          business_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          member_id: string;
          occurred_on: string;
        };
        Insert: {
          amount: number;
          business_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          member_id: string;
          occurred_on?: string;
        };
        Update: {
          amount?: number;
          business_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          member_id?: string;
          occurred_on?: string;
        };
        Relationships: [
          {
            foreignKeyName: "biz_reimbursements_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "biz_reimbursements_member_id_business_id_fkey";
            columns: ["member_id", "business_id"];
            isOneToOne: false;
            referencedRelation: "business_members";
            referencedColumns: ["id", "business_id"];
          },
        ];
      };
      biz_sales: {
        Row: {
          amount: number;
          business_id: string;
          channel_id: string | null;
          created_at: string;
          created_by: string | null;
          customer: string | null;
          fees: number;
          id: string;
          item_id: string | null;
          note: string | null;
          occurred_on: string;
          quantity: number;
        };
        Insert: {
          amount: number;
          business_id: string;
          channel_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          customer?: string | null;
          fees?: number;
          id?: string;
          item_id?: string | null;
          note?: string | null;
          occurred_on?: string;
          quantity?: number;
        };
        Update: {
          amount?: number;
          business_id?: string;
          channel_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          customer?: string | null;
          fees?: number;
          id?: string;
          item_id?: string | null;
          note?: string | null;
          occurred_on?: string;
          quantity?: number;
        };
        Relationships: [
          {
            foreignKeyName: "biz_sales_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "biz_sales_channel_id_business_id_fkey";
            columns: ["channel_id", "business_id"];
            isOneToOne: false;
            referencedRelation: "biz_channels";
            referencedColumns: ["id", "business_id"];
          },
          {
            foreignKeyName: "biz_sales_item_id_business_id_fkey";
            columns: ["item_id", "business_id"];
            isOneToOne: false;
            referencedRelation: "biz_items";
            referencedColumns: ["id", "business_id"];
          },
        ];
      };
      business_members: {
        Row: {
          business_id: string;
          color: string;
          created_at: string;
          display_name: string;
          id: string;
          role: string;
          user_id: string | null;
        };
        Insert: {
          business_id: string;
          color?: string;
          created_at?: string;
          display_name: string;
          id?: string;
          role?: string;
          user_id?: string | null;
        };
        Update: {
          business_id?: string;
          color?: string;
          created_at?: string;
          display_name?: string;
          id?: string;
          role?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "business_members_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      businesses: {
        Row: {
          created_at: string;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
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
export type BusinessMember = Tables["business_members"]["Row"];
export type BizItem = Tables["biz_items"]["Row"];
export type BizChannel = Tables["biz_channels"]["Row"];
export type BizExpenseCategory = Tables["biz_expense_categories"]["Row"];
export type Category = Tables["categories"]["Row"];
export type Transaction = Tables["transactions"]["Row"];
export type SavingsGoal = Tables["savings_goals"]["Row"];
export type SavingsMovement = Tables["savings_movements"]["Row"];
