import { createContext, useContext, useState } from 'react';

export interface CarritoItem {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  talla: string;
  image?: any;
}

interface CarritoContextType {
  items: CarritoItem[];
  addItem: (item: CarritoItem) => void;
  updateItem: (id: string, changes: Partial<CarritoItem>) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  clearCart: () => void;
}

export const CarritoContext = createContext<CarritoContextType>({
  items: [],
  addItem: () => {},
  updateItem: () => {},
  removeItem: () => {},
  clear: () => {},
  clearCart: () => {},
});

export function CarritoProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CarritoItem[]>([]);
  const addItem = (item: CarritoItem) => setItems((prev) => [...prev, item]);
  const updateItem = (id: string, changes: Partial<CarritoItem>) =>
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...changes } : item)));
  const removeItem = (id: string) => setItems((prev) => prev.filter((item) => item.id !== id));
  const clear = () => setItems([]);
  const clearCart = () => {
    setItems([]);
    console.log('🛒 Carrito limpiado');
  };
  return (
    <CarritoContext.Provider value={{ items, addItem, updateItem, removeItem, clear, clearCart }}>
      {children}
    </CarritoContext.Provider>
  );
}

export function useCarrito() {
  return useContext(CarritoContext);
}
