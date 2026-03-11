import { create } from "zustand";

interface ProductsState {
  selectedProductId: number | null;
  setSelectedProductId: (id: number | null) => void;
}

export const useProductsStore = create<ProductsState>()((set) => ({
  selectedProductId: null,
  setSelectedProductId: (id) => set({ selectedProductId: id }),
}));
