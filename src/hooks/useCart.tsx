import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    // const storagedCart = Buscar dados do localStorage

    // if (storagedCart) {
    //   return JSON.parse(storagedCart);
    // }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const stock = await api.get<Stock>(`/stock/${productId}`);
      const response = await api.get<Product>(`/products/${productId}`);

      const findProduct = cart.find((product) => product.id === productId);

      if (findProduct) {
        if (findProduct.amount >= stock.data.amount) {
          toast.error("Produto sem estoque");
          return;
        }

        findProduct.amount += 1;
        setCart([...cart]);
        return;
      }

      const product = {
        ...response.data,
        amount: 1,
      };

      setCart([...cart, product]);
    } catch {
      toast.error("Produto não encontrado");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      setCart(cart.filter((product) => product.id !== productId));
    } catch {
      toast.error("Produto não encontrado ou não pode ser removido");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const stock = await api.get<Stock>(`/stock/${productId}`);
      const findProduct = cart.find((product) => product.id === productId);

      if (!findProduct) {
        toast.error("Produto não encontrado");
        return;
      }

      const newAmount = findProduct.amount + amount;

      if (newAmount >= stock.data.amount) {
        toast.error("Produto sem estoque");
        return;
      }

      findProduct.amount = newAmount;

      setCart([...cart]);
    } catch {
      toast.error("Não foi possível atualizar o produto");
    }
  };

  useEffect(() => {
    console.log(cart);
  }, [cart]);

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
