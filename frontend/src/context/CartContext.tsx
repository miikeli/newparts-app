import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CatalogProduct } from "../services/catalog";

type CartLine = {
  productId: string;
  quantity: number;
  product: CatalogProduct;
};

export type CartItem = CartLine & {
  lineSubtotal: number;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (product: CatalogProduct, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

const clampQuantity = (quantity: number, max: number) =>
  Math.max(1, Math.min(max, Math.floor(quantity)));

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [lines, setLines] = useState<CartLine[]>([]);

  const addItem = useCallback((product: CatalogProduct, quantity = 1) => {
    if (!product || product.stock <= 0) {
      return;
    }

    setLines((currentLines) => {
      const existingLine = currentLines.find((line) => line.productId === product.id);
      const requestedQuantity = clampQuantity(quantity, product.stock);

      if (!existingLine) {
        return [
          ...currentLines,
          { productId: product.id, product, quantity: requestedQuantity },
        ];
      }

      return currentLines.map((line) =>
        line.productId === product.id
          ? {
              ...line,
              product,
              quantity: clampQuantity(line.quantity + requestedQuantity, product.stock),
            }
          : line
      );
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setLines((currentLines) =>
      currentLines.filter((line) => line.productId !== productId)
    );
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setLines((currentLines) =>
      currentLines.map((line) =>
        line.productId === productId
          ? { ...line, quantity: clampQuantity(quantity, line.product.stock) }
          : line
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setLines([]);
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const items = lines.map((line) => ({
      ...line,
      lineSubtotal: line.product.pricePi * line.quantity,
    }));

    return {
      items,
      itemCount: items.reduce((total, item) => total + item.quantity, 0),
      subtotal: items.reduce((total, item) => total + item.lineSubtotal, 0),
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    };
  }, [addItem, clearCart, lines, removeItem, updateQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }

  return context;
};
