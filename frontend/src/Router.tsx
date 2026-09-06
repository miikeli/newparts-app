import { createBrowserRouter } from "react-router-dom";
import AdminShell from "./components/AdminShell.tsx";
import StoreShell from "./components/StoreShell.tsx";
import AccountPage from "./pages/AccountPage.tsx";
import CartPage from "./pages/CartPage.tsx";
import Shop from "./pages/Shop";
import AdminBrandsPage from "./pages/admin/AdminBrandsPage.tsx";
import AdminBrandEditorPage from "./pages/admin/AdminBrandEditorPage.tsx";
import AdminCategoriesPage from "./pages/admin/AdminCategoriesPage.tsx";
import AdminCategoryEditorPage from "./pages/admin/AdminCategoryEditorPage.tsx";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage.tsx";
import AdminProductEditorPage from "./pages/admin/AdminProductEditorPage.tsx";
import AdminProductsPage from "./pages/admin/AdminProductsPage.tsx";
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
  {
    path: "/admin",
    element: <AdminShell />,
    children: [
      {
        index: true,
        element: <AdminDashboardPage />,
      },
      {
        path: "products",
        element: <AdminProductsPage />,
      },
      {
        path: "products/new",
        element: <AdminProductEditorPage />,
      },
      {
        path: "products/:id",
        element: <AdminProductEditorPage />,
      },
      {
        path: "categories",
        element: <AdminCategoriesPage />,
      },
      {
        path: "categories/new",
        element: <AdminCategoryEditorPage />,
      },
      {
        path: "categories/:id",
        element: <AdminCategoryEditorPage />,
      },
      {
        path: "brands",
        element: <AdminBrandsPage />,
      },
      {
        path: "brands/new",
        element: <AdminBrandEditorPage />,
      },
      {
        path: "brands/:id",
        element: <AdminBrandEditorPage />,
      },
    ],
  },
]);

export default router;
