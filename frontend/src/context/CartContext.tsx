import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { findProductById } from "../data/products";

type CartLine = {
  productId: string;
  quantity: number;
};

export type CartItem = CartLine & {
  product: NonNullable<ReturnType<typeof findProductById>>;
  lineSubtotal: number;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (productId: string, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

const clampQuantity = (quantity: number, max: number) =>
  Math.max(1, Math.min(max, Math.floor(quantity)));

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [lines, setLines] = useState<CartLine[]>([]);

  const addItem = useCallback((productId: string, quantity = 1) => {
    const product = findProductById(productId);
    if (!product || product.stock <= 0) {
      return;
    }

    setLines((currentLines) => {
      const existingLine = currentLines.find((line) => line.productId === productId);
      const requestedQuantity = clampQuantity(quantity, product.stock);

      if (!existingLine) {
        return [...currentLines, { productId, quantity: requestedQuantity }];
      }

      return currentLines.map((line) =>
        line.productId === productId
          ? {
              ...line,
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
    const product = findProductById(productId);
    if (!product) {
      return;
    }

    setLines((currentLines) =>
      currentLines.map((line) =>
        line.productId === productId
          ? { ...line, quantity: clampQuantity(quantity, product.stock) }
          : line
      )
    );
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const items = lines.flatMap((line) => {
      const product = findProductById(line.productId);
      if (!product) {
        return [];
      }

      return [
        {
          ...line,
          product,
          lineSubtotal: product.price * line.quantity,
        },
      ];
    });

    return {
      items,
      itemCount: items.reduce((total, item) => total + item.quantity, 0),
      subtotal: items.reduce((total, item) => total + item.lineSubtotal, 0),
      addItem,
      removeItem,
      updateQuantity,
    };
  }, [addItem, lines, removeItem, updateQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }

  return context;
};
