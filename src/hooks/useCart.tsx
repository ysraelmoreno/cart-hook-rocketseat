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
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const stock = await api.get<Stock>(`/stock/${productId}`);
      const response = await api.get<Product>(`/products/${productId}`);

      const findProduct = cart.find((product) => product.id === productId);

      if (findProduct) {
        if (findProduct.amount >= stock.data.amount) {
          throw new Error("Quantidade solicitada fora de estoque");
        }

        findProduct.amount += 1;
        setCart([...cart]);

        localStorage.setItem("@RocketShoes:cart", JSON.stringify([...cart]));
        return;
      }

      const product = {
        ...response.data,
        amount: 1,
      };

      localStorage.setItem(
        "@RocketShoes:cart",
        JSON.stringify([...cart, product])
      );

      setCart([...cart, product]);
    } catch (err: any) {
      const regexp = /404/gm;

      if (regexp.test(err.message)) {
        toast.error("Erro na adição do produto");
        return;
      }

      toast.error(`${err.message}`);
    }
  };

  const removeProduct = async (productId: number) => {
    try {
      const productToRemove = cart.find((product) => product.id === productId);

      if (!productToRemove) {
        throw new Error("Erro na remoção do produto");
      }

      const newCart = cart.filter((product) => product.id !== productId);

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      setCart(newCart);
    } catch (err: any) {
      const regexp = /404/gm;

      if (regexp.test(err.message)) {
        toast.error("Erro na remoção do produto");
        return;
      }
      toast.error(`${err.message}`);
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
        throw new Error("Erro na alteração de quantidade do produto");
      }

      if (amount >= stock.data.amount || amount <= 0) {
        throw new Error("Quantidade solicitada fora de estoque");
      }

      findProduct.amount = amount;
      localStorage.setItem("@RocketShoes:cart", JSON.stringify([...cart]));

      setCart([...cart]);
    } catch (err: any) {
      const regexp = /404/gm;

      if (regexp.test(err.message)) {
        toast.error("Erro na alteração de quantidade do produto");
        return;
      }
      toast.error(`${err.message}`);
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
