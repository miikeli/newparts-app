import axios from "axios";
import { Router, type Request } from "express";
import { findCatalogProductById } from "../data/products";
import {
  validateShippingAddress,
  type ShippingAddress,
} from "../models/shippingAddress";
import platformAPIClient from "../services/platformAPIClient";
import {
  loadProfileView,
  toShippingSnapshot,
  type ProfileCollection,
} from "../services/userProfiles";
import { createOrderNumber } from "../utils/orders";
import "../types/session";

type CartMetadataItem = {
  productId: string;
  quantity: number;
};

type NormalizedPaymentItems = {
  metadataType: "cart" | "legacy_product";
  items: CartMetadataItem[];
  shippingAddressId?: string;
};

type OrderItem = CartMetadataItem & {
  name: string;
  brand: string;
  sku: string;
  mpn: string;
  image: string;
  unitPrice: number;
  unitPriceUnits: number;
  lineTotal: number;
  lineTotalUnits: number;
};

type PaymentValidationError = {
  statusCode: number;
  error: string;
  message: string;
  logMessage: string;
};

type PlatformPayment = {
  amount?: number | string;
  memo?: string;
  metadata?: unknown;
  identifier?: string;
  status?: {
    developer_approved?: boolean;
    developer_completed?: boolean;
    cancelled?: boolean;
    user_cancelled?: boolean;
  };
  transaction?: null | {
    txid?: string;
    verified?: boolean;
    _link?: string;
  };
  user_uid?: string;
};

type OrderDocument = {
  orderNumber?: string;
  pi_payment_id: string;
  user?: string;
  user_uid?: string;
  items?: OrderItem[];
  total?: number;
  total_units?: number;
  status?: string;
  txid?: string | null;
  paid?: boolean;
  cancelled?: boolean;
  completed_at?: Date;
};

const piAmountPrecision = 7;
const piAmountUnit = 10000000;
const maxLineItems = 50;
const maxQuantityPerProduct = 99;
const maxSafeInteger = 9007199254740991;
const orderNumberRetryLimit = 3;

const isRecord = (value: unknown): value is { [key: string]: unknown } =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const validationError = (
  statusCode: number,
  error: string,
  message: string,
  logMessage: string,
): PaymentValidationError => ({
  statusCode,
  error,
  message,
  logMessage,
});

const isPaymentValidationError = (
  err: unknown,
): err is PaymentValidationError =>
  isRecord(err) &&
  typeof err.statusCode === "number" &&
  typeof err.error === "string" &&
  typeof err.message === "string" &&
  typeof err.logMessage === "string";

const isSafeInteger = (value: number) =>
  isFinite(value) &&
  Math.floor(value) === value &&
  Math.abs(value) <= maxSafeInteger;

const isDuplicateKeyError = (err: unknown) =>
  isRecord(err) && err.code === 11000;

const readSafeString = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const toPiAmountUnits = (amount: unknown, fieldName: string) => {
  const amountText =
    typeof amount === "number"
      ? amount.toFixed(piAmountPrecision)
      : typeof amount === "string"
        ? amount.trim()
        : "";

  if (!/^\d+(\.\d{1,7})?$/.test(amountText)) {
    throw validationError(
      400,
      "invalid_amount",
      `${fieldName} is invalid`,
      `${fieldName} has an invalid decimal format`,
    );
  }

  const parts = amountText.split(".");
  const whole = Number(parts[0]);
  const fraction = ((parts[1] || "") + "0000000").slice(
    0,
    piAmountPrecision,
  );
  const fractionalUnits = Number(fraction);

  if (!isSafeInteger(whole) || !isSafeInteger(fractionalUnits)) {
    throw validationError(
      400,
      "invalid_amount",
      `${fieldName} is invalid`,
      `${fieldName} exceeds safe integer precision`,
    );
  }

  const units = whole * piAmountUnit + fractionalUnits;

  if (!isSafeInteger(units) || units <= 0) {
    throw validationError(
      400,
      "invalid_amount",
      `${fieldName} is invalid`,
      `${fieldName} converted to invalid integer units`,
    );
  }

  return units;
};

const fromPiAmountUnits = (amountUnits: number) =>
  Number((amountUnits / piAmountUnit).toFixed(piAmountPrecision));

const parsePaymentMetadata = (metadata: unknown) => {
  if (typeof metadata !== "string") {
    return metadata;
  }

  try {
    return JSON.parse(metadata);
  } catch {
    throw validationError(
      400,
      "invalid_metadata",
      "Payment metadata is not valid JSON",
      "Payment metadata string could not be parsed",
    );
  }
};

const readPositiveIntegerQuantity = (quantity: unknown) => {
  if (
    typeof quantity !== "number" ||
    !isSafeInteger(quantity) ||
    quantity <= 0 ||
    quantity > maxQuantityPerProduct
  ) {
    throw validationError(
      400,
      "invalid_quantity",
      `Cart item quantity must be between 1 and ${maxQuantityPerProduct}`,
      "Cart metadata contains an invalid quantity or exceeds quantity limit",
    );
  }

  return quantity;
};

const normalizePaymentItems = (metadata: unknown): NormalizedPaymentItems => {
  const parsedMetadata = parsePaymentMetadata(metadata);

  if (!isRecord(parsedMetadata)) {
    throw validationError(
      400,
      "invalid_metadata",
      "Payment metadata must be an object",
      "Payment metadata is not an object",
    );
  }

  if (
    parsedMetadata.type === "cart" &&
    Array.isArray(parsedMetadata.items)
  ) {
    if (parsedMetadata.items.length > maxLineItems) {
      throw validationError(
        400,
        "too_many_items",
        `Cart metadata can contain up to ${maxLineItems} line items`,
        "Cart metadata exceeds max line item limit",
      );
    }

    const items: CartMetadataItem[] = [];

    parsedMetadata.items.forEach((rawItem) => {
      if (!isRecord(rawItem) || typeof rawItem.productId !== "string") {
        throw validationError(
          400,
          "invalid_metadata",
          "Cart metadata contains an invalid item",
          "Cart metadata item is malformed",
        );
      }

      const productId = rawItem.productId.trim();
      const quantity = readPositiveIntegerQuantity(rawItem.quantity);

      if (!productId) {
        throw validationError(
          400,
          "invalid_product",
          "Cart item productId is required",
          "Cart metadata contains an empty productId",
        );
      }

      let existingItem: CartMetadataItem | undefined;

      items.forEach((item) => {
        if (item.productId === productId) {
          existingItem = item;
        }
      });

      if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.quantity = readPositiveIntegerQuantity(
          existingItem.quantity,
        );
      } else {
        items.push({ productId, quantity });
      }
    });

    if (items.length === 0) {
      throw validationError(
        400,
        "empty_cart",
        "Cart payment metadata must contain at least one item",
        "Cart metadata contains no items",
      );
    }

    return {
      metadataType: "cart",
      items,
      shippingAddressId: readSafeString(parsedMetadata.shippingAddressId) ?? undefined,
    };
  }

  if (typeof parsedMetadata.productId === "string") {
    const productId = parsedMetadata.productId.trim();

    if (!productId) {
      throw validationError(
        400,
        "invalid_product",
        "Payment metadata productId is required",
        "Legacy metadata contains an empty productId",
      );
    }

    return {
      metadataType: "legacy_product",
      items: [{ productId, quantity: 1 }],
    };
  }

  throw validationError(
    400,
    "invalid_metadata",
    "Unsupported payment metadata format",
    "Payment metadata format is unsupported",
  );
};

const buildOrderItems = (metadata: unknown) => {
  const normalized = normalizePaymentItems(metadata);
  const orderItems: OrderItem[] = [];
  let totalUnits = 0;

  normalized.items.forEach((item) => {
    const product = findCatalogProductById(item.productId);

    if (!product) {
      throw validationError(
        400,
        "unknown_product",
        "Cart contains an unknown product",
        `Unknown productId in payment metadata: ${item.productId}`,
      );
    }

    if (item.quantity > product.stock) {
      throw validationError(
        400,
        "invalid_quantity",
        "Cart quantity exceeds available stock",
        `Requested quantity exceeds stock for productId: ${item.productId}`,
      );
    }

    const unitPriceUnits = toPiAmountUnits(product.price, "Catalog price");
    const lineTotalUnits = unitPriceUnits * item.quantity;

    orderItems.push({
      productId: item.productId,
      name: product.name,
      brand: product.brand,
      sku: product.sku,
      mpn: product.mpn,
      image: product.image,
      quantity: item.quantity,
      unitPrice: product.price,
      unitPriceUnits,
      lineTotal: fromPiAmountUnits(lineTotalUnits),
      lineTotalUnits,
    });
    totalUnits += lineTotalUnits;

    if (!isSafeInteger(totalUnits)) {
      throw validationError(
        400,
        "invalid_amount",
        "Cart total is too large",
        "Cart total exceeds safe integer precision",
      );
    }
  });

  return {
    metadataType: normalized.metadataType,
    items: orderItems,
    total: fromPiAmountUnits(totalUnits),
    totalUnits,
    shippingAddressId: normalized.shippingAddressId,
  };
};

const readPaymentAmount = (payment: PlatformPayment) => {
  return toPiAmountUnits(payment.amount, "Payment amount");
};

const readPaymentUserUid = (payment: PlatformPayment) => {
  const paymentUserUid = readSafeString(payment.user_uid);

  if (!paymentUserUid) {
    throw validationError(
      400,
      "missing_payment_user",
      "Payment user is missing",
      "Pi payment response did not include user_uid",
    );
  }

  return paymentUserUid;
};

const getAuthenticatedUserUid = async (req: Request) => {
  const sessionUserUid = readSafeString(req.session.currentUser?.uid);

  if (sessionUserUid) {
    return sessionUserUid;
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw validationError(
      401,
      "unauthorized",
      "Missing Pi access token",
      "No session user and no Bearer token were provided",
    );
  }

  const accessToken = authHeader.substring(7).trim();

  if (!accessToken) {
    throw validationError(
      401,
      "unauthorized",
      "Missing Pi access token",
      "Bearer token was empty",
    );
  }

  try {
    const me = await platformAPIClient.get("/v2/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const bearerUserUid = readSafeString(me.data?.uid);

    if (!bearerUserUid) {
      throw new Error("Pi /v2/me response did not include uid");
    }

    return bearerUserUid;
  } catch {
    throw validationError(
      401,
      "invalid_token",
      "Invalid Pi access token",
      "Pi access token verification failed",
    );
  }
};

const assertPaymentBelongsToUser = (
  payment: PlatformPayment,
  authenticatedUserUid: string,
) => {
  const paymentUserUid = readPaymentUserUid(payment);

  if (paymentUserUid !== authenticatedUserUid) {
    throw validationError(
      403,
      "user_mismatch",
      "Payment does not belong to the authenticated user",
      "Authenticated user does not match Pi payment user",
    );
  }
};

const readOrderUserUid = (order: OrderDocument) =>
  readSafeString(order.user_uid) || readSafeString(order.user);

const assertOrderBelongsToUser = (
  order: OrderDocument,
  authenticatedUserUid: string,
) => {
  const orderUserUid = readOrderUserUid(order);

  if (!orderUserUid || orderUserUid !== authenticatedUserUid) {
    throw validationError(
      403,
      "order_user_mismatch",
      "Order does not belong to the authenticated user",
      "Authenticated user does not match local order user",
    );
  }
};

const assertCompletedPaymentState = (
  payment: PlatformPayment,
  expectedTxid: string,
) => {
  if (payment.status?.developer_completed === false) {
    throw validationError(
      502,
      "payment_not_completed",
      "Pi payment was not completed",
      "Pi payment status is not developer_completed after complete call",
    );
  }

  const paymentTxid = readSafeString(payment.transaction?.txid);

  if (paymentTxid && paymentTxid !== expectedTxid) {
    throw validationError(
      409,
      "txid_mismatch",
      "Pi payment was completed with a different txid",
      "Pi payment transaction txid does not match request txid",
    );
  }
};

const isPlatformPaymentCompleted = (
  payment: PlatformPayment,
  expectedTxid?: string,
) => {
  if (payment.status?.developer_completed !== true) {
    return false;
  }

  const paymentTxid = readSafeString(payment.transaction?.txid);

  return !expectedTxid || !paymentTxid || paymentTxid === expectedTxid;
};

const isPlatformPaymentCancelled = (payment: PlatformPayment) =>
  payment.status?.cancelled === true || payment.status?.user_cancelled === true;

const approvePaymentIfNeeded = async (
  paymentId: string,
  payment: PlatformPayment,
) => {
  if (!payment.status?.developer_approved) {
    await platformAPIClient.post(`/v2/payments/${paymentId}/approve`);
  }
};

const getSafePiErrorCode = (responseData: unknown) => {
  if (!isRecord(responseData)) {
    return undefined;
  }

  const code =
    responseData.error_code || responseData.error || responseData.code;

  if (typeof code === "string" || typeof code === "number") {
    return code;
  }

  return undefined;
};

const logPaymentError = (
  message: string,
  err: unknown,
  context: { paymentId?: string } = {},
) => {
  if (axios.isAxiosError(err)) {
    console.error(message, {
      paymentId: context.paymentId,
      status: err.response?.status,
      piErrorCode: getSafePiErrorCode(err.response?.data),
      code: err.code,
    });
    return;
  }

  if (isPaymentValidationError(err)) {
    console.error(message, err.logMessage);
    return;
  }

  console.error(message, err instanceof Error ? err.message : "Unknown error");
};

const handleValidationError = (
  res: { status: (statusCode: number) => { json: (body: unknown) => unknown } },
  err: PaymentValidationError,
  logMessage: string,
  paymentId?: string,
) => {
  logPaymentError(logMessage, err, { paymentId });

  return res.status(err.statusCode).json({
    error: err.error,
    message: err.message,
  });
};

const readRequiredPaymentId = (value: unknown) => {
  const paymentId = readSafeString(value);

  if (!paymentId) {
    throw validationError(
      400,
      "invalid_request",
      "paymentId is required",
      "Request did not include a valid paymentId",
    );
  }

  return paymentId;
};

const readRequiredTxid = (value: unknown) => {
  const txid = readSafeString(value);

  if (!txid) {
    throw validationError(
      400,
      "invalid_request",
      "txid is required",
      "Request did not include a valid txid",
    );
  }

  return txid;
};

const getPlatformPayment = async (paymentId: string) => {
  const response = await platformAPIClient.get(`/v2/payments/${paymentId}`);

  return response.data as PlatformPayment;
};

const readShippingAddressSnapshot = async (
  profileCollection: ProfileCollection,
  userUid: string,
  required: boolean,
  requestedAddressId?: string,
) => {
  if (!required) {
    return null;
  }

  const profile = await loadProfileView(profileCollection, userUid);
  const selectedAddress = requestedAddressId
    ? profile.addresses.find((address) => address.id === requestedAddressId)
    : profile.addresses.find(
        (address) => address.id === profile.defaultShippingAddressId,
      );

  if (!selectedAddress) {
    throw validationError(
      400,
      requestedAddressId
        ? "invalid_shipping_address"
        : "shipping_address_required",
      requestedAddressId
        ? "Selected shipping address is not available"
        : "Prije plaćanja unesite adresu dostave.",
      requestedAddressId
        ? "Cart metadata referenced an address that does not belong to the authenticated user"
        : "Cart checkout attempted without a valid default shipping address",
    );
  }

  const validation = validateShippingAddress(selectedAddress);

  if (!validation.ok) {
    throw validationError(
      400,
      "shipping_address_required",
      "Prije plaćanja unesite adresu dostave.",
      "Cart checkout attempted with an invalid shipping address",
    );
  }

  return toShippingSnapshot(validation.value);
};

const writeOrderOnApproval = async (
  orderCollection: {
    updateOne: (
      filter: unknown,
      update: unknown,
      options: unknown,
    ) => Promise<unknown>;
    findOne: (query: unknown) => Promise<unknown>;
  },
  paymentId: string,
  orderDocument: {
    product_id: string | null;
    user: string;
    user_uid: string;
    items: OrderItem[];
    subtotal: number;
    subtotal_units: number;
    total: number;
    total_units: number;
    payment_amount: number;
    payment_amount_units: number;
    currency: string;
    payment_memo: string | null;
    payment_metadata_type: string;
    shippingAddress: ShippingAddress | null;
    shippingAddressId?: string;
  },
) => {
  for (let attempt = 0; attempt < orderNumberRetryLimit; attempt += 1) {
    try {
      await orderCollection.updateOne(
        { pi_payment_id: paymentId },
        {
          $setOnInsert: {
            orderNumber: createOrderNumber(),
            pi_payment_id: paymentId,
            status: "pending",
            txid: null,
            paid: false,
            cancelled: false,
            created_at: new Date(),
            ...orderDocument,
          },
        },
        { upsert: true },
      );

      return;
    } catch (err) {
      if (!isDuplicateKeyError(err)) {
        throw err;
      }

      const existingPaymentOrder = await orderCollection.findOne({
        pi_payment_id: paymentId,
      });

      if (existingPaymentOrder) {
        return;
      }
    }
  }

  throw validationError(
    409,
    "order_number_conflict",
    "Could not create a unique order number",
    "Order number generation hit retry limit",
  );
};

export default function mountPaymentsEndpoints(router: Router) {
  // handle the incomplete payment
  router.post("/incomplete", async (req, res) => {
    let paymentId: string | undefined;

    try {
      const authenticatedUserUid = await getAuthenticatedUserUid(req);
      const payment = req.body.payment as PlatformPayment | undefined;
      paymentId = readRequiredPaymentId(payment?.identifier);
      const txid = readRequiredTxid(payment?.transaction?.txid);
      const txURL = readSafeString(payment?.transaction?._link);

      if (!txURL) {
        throw validationError(
          400,
          "invalid_request",
          "Payment transaction link is required",
          "Incomplete payment payload did not include transaction link",
        );
      }

      const app = req.app;
      const orderCollection = app.locals.orderCollection;
      const order = (await orderCollection.findOne({
        pi_payment_id: paymentId,
      })) as OrderDocument | null;

      if (!order) {
        return res.status(404).json({
          error: "not_found",
          message: "Order not found",
        });
      }

      assertOrderBelongsToUser(order, authenticatedUserUid);

      const platformPayment = await getPlatformPayment(paymentId);
      assertPaymentBelongsToUser(platformPayment, authenticatedUserUid);

      // This endpoint is frontend-callable from Pi's incomplete-payment recovery path.
      // It is therefore authenticated like complete/cancel and only mutates an order
      // after local order ownership, Pi payment ownership, and Horizon memo checks pass.
      const horizonResponse = await axios.create({ timeout: 20000 }).get(txURL);
      const paymentIdOnBlock = horizonResponse.data.memo;

      if (paymentIdOnBlock !== order.pi_payment_id) {
        return res.status(400).json({
          error: "mismatch",
          message: "Payment id doesn't match",
        });
      }

      await platformAPIClient.post(`/v2/payments/${paymentId}/complete`, {
        txid,
      });

      const refreshedPayment = await getPlatformPayment(paymentId);
      assertPaymentBelongsToUser(refreshedPayment, authenticatedUserUid);
      assertCompletedPaymentState(refreshedPayment, txid);

      await orderCollection.updateOne(
        { pi_payment_id: paymentId },
        {
          $set: {
            txid,
            paid: true,
            status: "paid",
            completed_at: new Date(),
          },
        },
      );

      return res
        .status(200)
        .json({ message: `Handled the incomplete payment ${paymentId}` });
    } catch (err) {
      if (isPaymentValidationError(err)) {
        return handleValidationError(
          res,
          err,
          "Incomplete payment validation failed:",
          paymentId,
        );
      }

      logPaymentError("Error handling incomplete payment:", err, { paymentId });

      return res.status(500).json({
        error: "internal_error",
        message: "Failed to handle incomplete payment",
      });
    }
  });

  // approve the current payment
  router.post("/approve", async (req, res) => {
    let paymentId: string | undefined;

    try {
      const authenticatedUserUid = await getAuthenticatedUserUid(req);
      const app = req.app;
      paymentId = readRequiredPaymentId(req.body.paymentId);
      const payment = await getPlatformPayment(paymentId);
      const orderCollection = app.locals.orderCollection;
      const profileCollection = app.locals.userProfileCollection;

      if (!profileCollection) {
        return res.status(503).json({
          error: "service_unavailable",
          message: "Profile database not ready",
        });
      }

      assertPaymentBelongsToUser(payment, authenticatedUserUid);

      if (payment.status?.cancelled || payment.status?.user_cancelled) {
        throw validationError(
          400,
          "payment_cancelled",
          "Payment is already cancelled",
          "Approval attempted for a cancelled Pi payment",
        );
      }

      const order = buildOrderItems(payment.metadata);
      const paymentAmount = readPaymentAmount(payment);

      if (order.totalUnits !== paymentAmount) {
        console.warn("Payment amount mismatch", {
          paymentId,
          expectedTotalUnits: order.totalUnits,
          paymentAmountUnits: paymentAmount,
        });

        return res.status(400).json({
          error: "amount_mismatch",
          message: "Payment amount does not match cart total",
        });
      }

      const existingOrder = (await orderCollection.findOne({
        pi_payment_id: paymentId,
      })) as OrderDocument | null;

      if (existingOrder?.cancelled) {
        throw validationError(
          409,
          "order_cancelled",
          "Order for this payment is already cancelled",
          "Approval attempted for a locally cancelled order",
        );
      }

      if (existingOrder) {
        assertOrderBelongsToUser(existingOrder, authenticatedUserUid);
      }

      const shippingAddress = await readShippingAddressSnapshot(
        profileCollection,
        authenticatedUserUid,
        order.metadataType === "cart",
        order.shippingAddressId,
      );

      try {
        await writeOrderOnApproval(
          orderCollection,
          paymentId,
          {
            product_id:
              order.metadataType === "legacy_product"
                ? order.items[0].productId
                : null,
            user: authenticatedUserUid,
            user_uid: authenticatedUserUid,
            items: order.items,
            subtotal: order.total,
            subtotal_units: order.totalUnits,
            total: order.total,
            total_units: order.totalUnits,
            payment_amount: fromPiAmountUnits(paymentAmount),
            payment_amount_units: paymentAmount,
            currency: "Test-Pi",
            payment_memo: payment.memo ?? null,
            payment_metadata_type: order.metadataType,
            shippingAddress,
            ...(order.shippingAddressId
              ? { shippingAddressId: order.shippingAddressId }
              : {}),
          },
        );
      } catch (err) {
        if (!isDuplicateKeyError(err)) {
          throw err;
        }

        const racedOrder = (await orderCollection.findOne({
          pi_payment_id: paymentId,
        })) as OrderDocument | null;

        if (!racedOrder) {
          throw err;
        }

        assertOrderBelongsToUser(racedOrder, authenticatedUserUid);
      }

      await approvePaymentIfNeeded(paymentId, payment);

      return res.status(200).json({
        message: `Approved the payment ${paymentId}`,
      });
    } catch (err) {
      if (isPaymentValidationError(err)) {
        return handleValidationError(
          res,
          err,
          "Payment approval validation failed:",
          paymentId,
        );
      }

      logPaymentError("Error approving payment:", err, { paymentId });

      return res.status(500).json({
        error: "internal_error",
        message: "Failed to approve payment",
      });
    }
  });

  // complete the current payment
  router.post("/complete", async (req, res) => {
    let paymentId: string | undefined;

    try {
      const authenticatedUserUid = await getAuthenticatedUserUid(req);
      const app = req.app;
      paymentId = readRequiredPaymentId(req.body.paymentId);
      const txid = readRequiredTxid(req.body.txid);
      const orderCollection = app.locals.orderCollection;

      const order = (await orderCollection.findOne({
        pi_payment_id: paymentId,
      })) as OrderDocument | null;

      if (!order) {
        return res.status(404).json({
          error: "not_found",
          message: "Order not found",
        });
      }

      assertOrderBelongsToUser(order, authenticatedUserUid);

      const payment = await getPlatformPayment(paymentId);
      assertPaymentBelongsToUser(payment, authenticatedUserUid);

      if (order.cancelled || order.status === "cancelled") {
        if (!isPlatformPaymentCompleted(payment, txid)) {
          throw validationError(
            409,
            "order_cancelled",
            "Cancelled order cannot be completed without confirmed Pi completion",
            "Completion attempted for a locally cancelled order without confirmed Pi completion",
          );
        }

        await orderCollection.updateOne(
          { pi_payment_id: paymentId },
          {
            $set: {
              txid,
              paid: true,
              cancelled: false,
              status: "paid",
              completed_at: order.completed_at ?? new Date(),
            },
          },
        );

        return res.status(200).json({
          message: `Completed the payment ${paymentId}`,
        });
      }

      if (payment.status?.cancelled || payment.status?.user_cancelled) {
        throw validationError(
          400,
          "payment_cancelled",
          "Payment is cancelled",
          "Completion attempted for a cancelled Pi payment",
        );
      }

      if (order.paid && order.txid === txid) {
        return res.status(200).json({
          message: `Completed the payment ${paymentId}`,
        });
      }

      if (order.paid && order.txid !== txid) {
        return res.status(409).json({
          error: "txid_mismatch",
          message: "Order was already completed with a different txid",
        });
      }

      await platformAPIClient.post(`/v2/payments/${paymentId}/complete`, {
        txid,
      });

      const refreshedPayment = await getPlatformPayment(paymentId);
      assertPaymentBelongsToUser(refreshedPayment, authenticatedUserUid);
      assertCompletedPaymentState(refreshedPayment, txid);

      await orderCollection.updateOne(
        { pi_payment_id: paymentId },
        {
          $set: {
            txid: txid,
            paid: true,
            cancelled: false,
            status: "paid",
            completed_at: new Date(),
          },
        },
      );

      return res.status(200).json({
        message: `Completed the payment ${paymentId}`,
      });
    } catch (err) {
      if (isPaymentValidationError(err)) {
        return handleValidationError(
          res,
          err,
          "Payment completion validation failed:",
          paymentId,
        );
      }

      logPaymentError("Error completing payment:", err, { paymentId });

      return res.status(500).json({
        error: "internal_error",
        message: "Failed to complete payment",
      });
    }
  });

  // handle the cancelled payment
  router.post("/cancelled_payment", async (req, res) => {
    let paymentId: string | undefined;

    try {
      const authenticatedUserUid = await getAuthenticatedUserUid(req);
      const app = req.app;
      paymentId = readRequiredPaymentId(req.body.paymentId);
      const orderCollection = app.locals.orderCollection;

      const order = (await orderCollection.findOne({
        pi_payment_id: paymentId,
      })) as OrderDocument | null;

      if (!order) {
        return res.status(404).json({
          error: "not_found",
          message: "Order not found",
        });
      }

      assertOrderBelongsToUser(order, authenticatedUserUid);

      const payment = await getPlatformPayment(paymentId);
      assertPaymentBelongsToUser(payment, authenticatedUserUid);

      if (isPlatformPaymentCompleted(payment)) {
        const paymentTxid = readSafeString(payment.transaction?.txid);

        await orderCollection.updateOne(
          { pi_payment_id: paymentId },
          {
            $set: {
              txid: paymentTxid ?? order.txid ?? null,
              paid: true,
              cancelled: false,
              status: "paid",
              completed_at: order.completed_at ?? new Date(),
            },
          },
        );

        return res.status(200).json({
          message: `Payment ${paymentId} is already completed`,
        });
      }

      if (!isPlatformPaymentCancelled(payment)) {
        throw validationError(
          409,
          "payment_state_unclear",
          "Payment cancellation is not confirmed",
          "Cancellation callback did not match a confirmed cancelled Pi payment state",
        );
      }

      await orderCollection.updateOne(
        { pi_payment_id: paymentId },
        { $set: { paid: false, cancelled: true, status: "cancelled" } },
      );

      return res.status(200).json({
        message: `Cancelled the payment ${paymentId}`,
      });
    } catch (err) {
      if (isPaymentValidationError(err)) {
        return handleValidationError(
          res,
          err,
          "Payment cancellation validation failed:",
          paymentId,
        );
      }

      logPaymentError("Error cancelling payment:", err, { paymentId });

      return res.status(500).json({
        error: "internal_error",
        message: "Failed to cancel payment",
      });
    }
  });
}
