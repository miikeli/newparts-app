import { RouterProvider } from "react-router-dom";
import { CartProvider } from "./context/CartContext.tsx";
import router from "./Router.tsx";

function App() {
  return (
    <CartProvider>
      <RouterProvider router={router} />
    </CartProvider>
  );
}

export default App;
