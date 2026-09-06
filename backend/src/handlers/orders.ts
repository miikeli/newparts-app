import { Router } from "express";
import {
  getAuthenticatedUserUid,
  isAuthError,
  sendAuthError,
} from "../services/auth";

type OrderListDocument = {
  orderNumber?: string;
  pi_payment_id?: string;
  user?: string;
  user_uid?: string;
  items?: Array<{
    productId?: string;
    name?: string;
    brand?: string;
    sku?: string;
    mpn?: string;
    image?: string;
    quantity?: number;
    unitPrice?: number;
    lineTotal?: number;
  }>;
  subtotal?: number;
  total?: number;
  shippingAddress?: unknown;
  status?: string;
  txid?: string | null;
  paid?: boolean;
  cancelled?: boolean;
  created_at?: Date;
  completed_at?: Date;
};

const readOrderUserUid = (order: OrderListDocument) =>
  order.user_uid || order.user;

const getItemCount = (order: OrderListDocument) =>
  Array.isArray(order.items)
    ? order.items.reduce((total, item) => total + (item.quantity || 0), 0)
    : 0;

const readOrderStatus = (order: OrderListDocument) => {
  if (order.status) {
    return order.status;
  }

  if (order.cancelled) {
    return "cancelled";
  }

  if (order.paid) {
    return "paid";
  }

  return "pending";
};

const serializeOrderListItem = (order: OrderListDocument) => ({
  orderNumber: order.orderNumber || order.pi_payment_id || "Legacy order",
  created_at: order.created_at,
  status: readOrderStatus(order),
  itemCount: getItemCount(order),
  total: order.total ?? order.subtotal ?? 0,
  canViewDetail: Boolean(order.orderNumber),
});

const serializeOrderDetail = (order: OrderListDocument) => ({
  orderNumber: order.orderNumber || order.pi_payment_id || "Legacy order",
  created_at: order.created_at,
  completed_at: order.completed_at,
  status: readOrderStatus(order),
  items: Array.isArray(order.items) ? order.items : [],
  subtotal: order.subtotal ?? order.total ?? 0,
  total: order.total ?? order.subtotal ?? 0,
  shippingAddress: order.shippingAddress ?? null,
  paid: Boolean(order.paid),
  cancelled: Boolean(order.cancelled),
  txid: order.txid ?? null,
});

export default function mountOrderEndpoints(router: Router) {
  router.get("/", async (req, res) => {
    try {
      const authenticatedUserUid = await getAuthenticatedUserUid(req);
      const orderCollection = req.app.locals.orderCollection;

      if (!orderCollection) {
        return res.status(503).json({ error: "service_unavailable", message: "Database not ready" });
      }

      const orders = await orderCollection
        .find({
          $or: [
            { user_uid: authenticatedUserUid },
            { user: authenticatedUserUid },
          ],
        })
        .sort({ created_at: -1 })
        .toArray();

      return res.status(200).json({
        orders: orders.map(serializeOrderListItem),
      });
    } catch (err) {
      if (isAuthError(err)) {
        return sendAuthError(res, err);
      }

      console.error("Error loading orders");
      return res.status(500).json({ error: "internal_error", message: "Failed to load orders" });
    }
  });

  router.get("/:orderNumber", async (req, res) => {
    try {
      const authenticatedUserUid = await getAuthenticatedUserUid(req);
      const orderCollection = req.app.locals.orderCollection;
      const orderNumber =
        typeof req.params.orderNumber === "string"
          ? req.params.orderNumber.trim()
          : "";

      if (!orderCollection) {
        return res.status(503).json({ error: "service_unavailable", message: "Database not ready" });
      }

      if (!orderNumber) {
        return res.status(400).json({ error: "invalid_request", message: "Order number is required" });
      }

      const order = (await orderCollection.findOne({
        orderNumber,
      })) as OrderListDocument | null;

      if (!order) {
        return res.status(404).json({ error: "not_found", message: "Order not found" });
      }

      if (readOrderUserUid(order) !== authenticatedUserUid) {
        return res.status(403).json({ error: "forbidden", message: "Order does not belong to this user" });
      }

      return res.status(200).json({
        order: serializeOrderDetail(order),
      });
    } catch (err) {
      if (isAuthError(err)) {
        return sendAuthError(res, err);
      }

      console.error("Error loading order detail");
      return res.status(500).json({ error: "internal_error", message: "Failed to load order" });
    }
  });
}
