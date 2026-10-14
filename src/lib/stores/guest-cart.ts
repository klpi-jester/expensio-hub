import { create } from "zustand";
import { persist } from "zustand/middleware";

export type GuestCartLine = {
  item_id: string;
  name: string;
  price: number;
  quantity: number;
};

type GuestCartState = {
  lines: Record<string, GuestCartLine>;
  add: (item: { item_id: string; name: string; price: number }) => void;
  inc: (id: string) => void;
  dec: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
};

export const useGuestCart = create<GuestCartState>()(
  persist(
    (set) => ({
      lines: {},
      add: (item) =>
        set((state) => {
          const existing = state.lines[item.item_id];
          return {
            lines: {
              ...state.lines,
              [item.item_id]: {
                item_id: item.item_id,
                name: item.name,
                price: item.price,
                quantity: (existing?.quantity ?? 0) + 1,
              },
            },
          };
        }),
      inc: (id) =>
        set((state) => {
          const line = state.lines[id];
          if (!line) return state;
          return { lines: { ...state.lines, [id]: { ...line, quantity: line.quantity + 1 } } };
        }),
      dec: (id) =>
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
    { name: "expensio-guest-cart" },
  ),
);

export function guestTotals(lines: GuestCartLine[]) {
  return lines.reduce(
    (acc, l) => {
      acc.count += l.quantity;
      acc.total += l.price * l.quantity;
      return acc;
    },
    { count: 0, total: 0 },
  );
}
