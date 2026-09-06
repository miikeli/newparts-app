import { createBrowserRouter } from "react-router-dom";
import StoreShell from "./components/StoreShell.tsx";
import AccountPage from "./pages/AccountPage.tsx";
import CartPage from "./pages/CartPage.tsx";
import Shop from "./pages/Shop";
import EngagementTasksPage from "./pages/EngagementTasksPage.tsx";
import OrderDetailPage from "./pages/OrderDetailPage.tsx";
import ProductDetailPage from "./pages/ProductDetailPage.tsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <StoreShell />,
    children: [
      {
        index: true,
        element: <Shop />,
      },
      {
        path: "product/:id",
        element: <ProductDetailPage />,
      },
      {
        path: "cart",
        element: <CartPage />,
      },
      {
        path: "account",
        element: <AccountPage />,
      },
      {
        path: "account/orders/:orderNumber",
        element: <OrderDetailPage />,
      },
    ],
  },
  {
    path: "/engagement-tasks",
    element: <EngagementTasksPage />,
  },
]);

export default router;
