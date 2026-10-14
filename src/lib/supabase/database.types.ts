export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          store_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          store_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          store_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "categories_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
      guest_order_items: {
        Row: {
          created_at: string;
          guest_order_id: string;
          id: string;
          item_id: string | null;
          price_at_order: number;
          quantity: number;
          subtotal: number | null;
        };
        Insert: {
          created_at?: string;
          guest_order_id: string;
          id?: string;
          item_id?: string | null;
          price_at_order: number;
          quantity: number;
          subtotal?: never;
        };
        Update: {
          created_at?: string;
          guest_order_id?: string;
          id?: string;
          item_id?: string | null;
          price_at_order?: number;
          quantity?: number;
          subtotal?: never;
        };
        Relationships: [
          {
            foreignKeyName: "guest_order_items_guest_order_id_fkey";
            columns: ["guest_order_id"];
            isOneToOne: false;
            referencedRelation: "guest_orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "guest_order_items_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "items";
            referencedColumns: ["id"];
          },
        ];
      };
      guest_orders: {
        Row: {
          created_at: string;
          guest_email: string | null;
          guest_mobile: string | null;
          guest_name: string;
          id: string;
          reference_code: string;
          status: string;
          store_id: string | null;
          total_amount: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          guest_email?: string | null;
          guest_mobile?: string | null;
          guest_name: string;
          id?: string;
          reference_code: string;
          status?: string;
          store_id?: string | null;
          total_amount: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          guest_email?: string | null;
          guest_mobile?: string | null;
          guest_name?: string;
          id?: string;
          reference_code?: string;
          status?: string;
          store_id?: string | null;
          total_amount?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "guest_orders_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
      items: {
        Row: {
          buy_price: number;
          category_id: string | null;
          created_at: string;
          description: string | null;
          id: string;
          image_url: string | null;
          is_active: boolean;
          mode: string;
          name: string;
          sell_price: number;
          sku: string | null;
          stock_quantity: number;
          store_id: string | null;
          updated_at: string;
        };
        Insert: {
          buy_price?: number;
          category_id?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          mode: string;
          name: string;
          sell_price?: number;
          sku?: string | null;
          stock_quantity?: number;
          store_id?: string | null;
          updated_at?: string;
        };
        Update: {
          buy_price?: number;
          category_id?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          mode?: string;
          name?: string;
          sell_price?: number;
          sku?: string | null;
          stock_quantity?: number;
          store_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "items_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "items_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
      sale_items: {
        Row: {
          buy_price_at_sale: number;
          category_id: string | null;
          created_at: string;
          id: string;
          item_id: string | null;
          quantity: number;
          sale_id: string;
          sell_price_at_sale: number;
          subtotal: number | null;
        };
        Insert: {
          buy_price_at_sale: number;
          category_id?: string | null;
          created_at?: string;
          id?: string;
          item_id?: string | null;
          quantity: number;
          sale_id: string;
          sell_price_at_sale: number;
          subtotal?: never;
        };
        Update: {
          buy_price_at_sale?: number;
          category_id?: string | null;
          created_at?: string;
          id?: string;
          item_id?: string | null;
          quantity?: number;
          sale_id?: string;
          sell_price_at_sale?: number;
          subtotal?: never;
        };
        Relationships: [
          {
            foreignKeyName: "sale_items_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sale_items_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey";
            columns: ["sale_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
        ];
      };
      sales: {
        Row: {
          created_at: string;
          id: string;
          store_id: string | null;
          total_cost: number;
          total_profit: number | null;
          total_revenue: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          store_id?: string | null;
          total_cost?: number;
          total_profit?: never;
          total_revenue: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          store_id?: string | null;
          total_cost?: number;
          total_profit?: never;
          total_revenue?: number;
        };
        Relationships: [
          {
            foreignKeyName: "sales_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
      stores: {
        Row: {
          cover_url: string | null;
          created_at: string;
          description: string | null;
          id: string;
          logo_url: string | null;
          name: string;
          owner_id: string;
          slug: string;
        };
        Insert: {
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          logo_url?: string | null;
          name: string;
          owner_id: string;
          slug: string;
        };
        Update: {
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          logo_url?: string | null;
          name?: string;
          owner_id?: string;
          slug?: string;
        };
        Relationships: [];
      };
      settings: {
        Row: {
          currency_code: string;
          currency_symbol: string;
          id: number;
          store_name: string;
          updated_at: string;
        };
        Insert: {
          currency_code?: string;
          currency_symbol?: string;
          id?: number;
          store_name?: string;
          updated_at?: string;
        };
        Update: {
          currency_code?: string;
          currency_symbol?: string;
          id?: number;
          store_name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database["public"];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never;

// Convenience aliases for application code
export type Setting = Database["public"]["Tables"]["settings"]["Row"];
export type Store = Database["public"]["Tables"]["stores"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Item = Database["public"]["Tables"]["items"]["Row"];
export type Sale = Database["public"]["Tables"]["sales"]["Row"];
export type SaleItem = Database["public"]["Tables"]["sale_items"]["Row"];
export type GuestOrder = Database["public"]["Tables"]["guest_orders"]["Row"];
export type GuestOrderItem =
  Database["public"]["Tables"]["guest_order_items"]["Row"];

export type ItemMode = "retail" | "resto";
export type GuestOrderStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled";
