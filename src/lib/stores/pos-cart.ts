import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartLine = {
  item_id: string;
  name: string;
  mode: "retail" | "resto";
  buy_price: number;
  sell_price: number;
  quantity: number;
  stock: number;
};

type CartState = {
  lines: Record<string, CartLine>;
  addItem: (item: Omit<CartLine, "quantity">) => void;
  increment: (id: string) => void;
  decrement: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
};

export const usePosCart = create<CartState>()(
  persist(
    (set) => ({
      lines: {},
      addItem: (item) =>
        set((state) => {
          const existing = state.lines[item.item_id];
          const nextQty = (existing?.quantity ?? 0) + 1;
          if (item.stock > 0 && nextQty > item.stock) return state; // stock guard
          return {
            lines: {
              ...state.lines,
              [item.item_id]: {
                ...item,
                quantity: nextQty,
              },
            },
          };
        }),
      increment: (id) =>
        set((state) => {
          const line = state.lines[id];
          if (!line) return state;
          if (line.stock > 0 && line.quantity >= line.stock) return state;
          return { lines: { ...state.lines, [id]: { ...line, quantity: line.quantity + 1 } } };
        }),
      decrement: (id) =>
        set((state) => {
          const line = state.lines[id];
          if (!line) return state;
          const qty = line.quantity - 1;
          if (qty <= 0) {
            const next = { ...state.lines };
            delete next[id];
            return { lines: next };
          }
          return { lines: { ...state.lines, [id]: { ...line, quantity: qty } } };
        }),
      remove: (id) =>
        set((state) => {
          const next = { ...state.lines };
          delete next[id];
          return { lines: next };
        }),
      clear: () => set({ lines: {} }),
    }),
    { name: "expensio-pos-cart" },
  ),
);

export function selectLines(state: CartState): CartLine[] {
  return Object.values(state.lines);
}

export function cartTotals(lines: CartLine[]) {
  return lines.reduce(
    (acc, line) => {
      acc.count += line.quantity;
      acc.revenue += line.sell_price * line.quantity;
      acc.cost += line.buy_price * line.quantity;
      return acc;
    },
    { count: 0, revenue: 0, cost: 0 },
  );
}
