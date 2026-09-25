import { RouterProvider } from "react-router-dom";
import { CartProvider } from "./context/CartContext.tsx";
import { I18nProvider } from "./i18n";
import router from "./Router.tsx";

function App() {
  return (
    <I18nProvider>
      <CartProvider>
        <RouterProvider router={router} />
      </CartProvider>
    </I18nProvider>
  );
}

export default App;
