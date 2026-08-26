import axios from "axios";
import { Router } from "express";
import platformAPIClient from "../services/platformAPIClient";
import "../types/session";

export default function mountPaymentsEndpoints(router: Router) {
  // handle the incomplete payment
  router.post("/incomplete", async (req, res) => {
    try {
      const payment = req.body.payment;
      const paymentId = payment.identifier;
      const txid = payment.transaction && payment.transaction.txid;
      const txURL = payment.transaction && payment.transaction._link;

      /*
        Implement your logic here
        e.g. verifying the payment, delivering the item to the user, etc...
      */

      const app = req.app;
      const orderCollection = app.locals.orderCollection;
      const order = await orderCollection.findOne({ pi_payment_id: paymentId });

      if (!order) {
        return res
          .status(400)
          .json({ error: "not_found", message: "Order not found" });
      }

      const horizonResponse = await axios.create({ timeout: 20000 }).get(txURL);
      const paymentIdOnBlock = horizonResponse.data.memo;

      if (paymentIdOnBlock !== order.pi_payment_id) {
        return res.status(400).json({
          error: "mismatch",
          message: "Payment id doesn't match",
        });
      }

      await orderCollection.updateOne(
        { pi_payment_id: paymentId },
        { $set: { txid, paid: true } },
      );

      await platformAPIClient.post(`/v2/payments/${paymentId}/complete`, {
        txid,
      });

      return res
        .status(200)
        .json({ message: `Handled the incomplete payment ${paymentId}` });
    } catch (err) {
      console.error("Error handling incomplete payment:", err);

      return res.status(500).json({
        error: "internal_error",
        message: "Failed to handle incomplete payment",
      });
    }
  });

  // approve the current payment
  router.post("/approve", async (req, res) => {
    try {
      let userUid = req.session.currentUser?.uid;

      // If the cross-site session cookie is not available,
      // authenticate directly using the Pi access token.
      if (!userUid) {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return res.status(401).json({
            error: "unauthorized",
            message: "Missing Pi access token",
          });
        }

        const accessToken = authHeader.substring(7);

        try {
          const me = await platformAPIClient.get("/v2/me", {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          userUid = me.data.uid;
        } catch (err) {
          console.error("Error verifying Pi access token:", err);

          return res.status(401).json({
            error: "invalid_token",
            message: "Invalid Pi access token",
          });
        }
      }

      const app = req.app;
      const paymentId = req.body.paymentId;

      const currentPayment = await platformAPIClient.get(
        `/v2/payments/${paymentId}`,
      );

      const orderCollection = app.locals.orderCollection;

      /*
        Implement your logic here
        e.g. creating an order record, reserve an item if the quantity is limited, etc...
      */

      await orderCollection.insertOne({
        pi_payment_id: paymentId,
        product_id: currentPayment.data.metadata.productId,
        user: userUid,
        txid: null,
        paid: false,
        cancelled: false,
        created_at: new Date(),
      });

      await platformAPIClient.post(`/v2/payments/${paymentId}/approve`);

      return res.status(200).json({
        message: `Approved the payment ${paymentId}`,
      });
    } catch (err) {
      console.error("Error approving payment:", err);

      return res.status(500).json({
        error: "internal_error",
        message: "Failed to approve payment",
      });
    }
  });

  // complete the current payment
  router.post("/complete", async (req, res) => {
    try {
      const app = req.app;
      const paymentId = req.body.paymentId;
      const txid = req.body.txid;
      const orderCollection = app.locals.orderCollection;

      /*
        Implement your logic here
        e.g. verify the transaction, deliver the item to the user, etc...
      */

      await orderCollection.updateOne(
        { pi_payment_id: paymentId },
        { $set: { txid: txid, paid: true } },
      );

      await platformAPIClient.post(`/v2/payments/${paymentId}/complete`, {
        txid,
      });

      return res.status(200).json({
        message: `Completed the payment ${paymentId}`,
      });
    } catch (err) {
      console.error("Error completing payment:", err);

      return res.status(500).json({
        error: "internal_error",
        message: "Failed to complete payment",
      });
    }
  });

  // handle the cancelled payment
  router.post("/cancelled_payment", async (req, res) => {
    try {
      const app = req.app;
      const paymentId = req.body.paymentId;
      const orderCollection = app.locals.orderCollection;

      /*
        Implement your logic here
        e.g. mark the order record to cancelled, etc...
      */

      await orderCollection.updateOne(
        { pi_payment_id: paymentId },
        { $set: { cancelled: true } },
      );

      return res.status(200).json({
        message: `Cancelled the payment ${paymentId}`,
      });
    } catch (err) {
      console.error("Error cancelling payment:", err);

      return res.status(500).json({
        error: "internal_error",
        message: "Failed to cancel payment",
      });
    }
  });
}