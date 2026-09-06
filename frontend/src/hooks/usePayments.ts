import axios, { type AxiosRequestConfig } from "axios";
import { useCallback, useRef, useState } from "react";
import { axiosClient } from "../lib/axiosClient";
import type { PaymentDTO } from "../types/pi";

type ProductPaymentMetadata = {
  productId: string;
};

export type CartPaymentMetadata = {
  type: "cart";
  items: {
    productId: string;
    quantity: number;
  }[];
};

type PaymentMetadata = ProductPaymentMetadata | CartPaymentMetadata;

type PaymentCallbacks = {
  onCompleted?: (paymentId: string, txid: string) => void;
  onCancelled?: (paymentId: string) => void;
  onError?: (message: string) => void;
};

type UsePaymentsArgs = {
  isAuthenticated: boolean;
  onRequireAuth: () => void;
};

export const IRRA_TOKEN_CANONICAL =
  "IRRA:GAAKMEW7GM5364YRRXFVVMF52R4YEEHB7LUNYTX3OONXUJKPKZXB6OK3";

const getPaymentErrorMessage = (err: unknown, fallback: string) => {
  if (axios.isAxiosError(err)) {
    const responseData = err.response?.data as { message?: string } | undefined;
    return responseData?.message ?? fallback;
  }

  if (err instanceof Error) {
    return err.message;
  }

  return fallback;
};

const getPiAuthConfig = (): AxiosRequestConfig | undefined => {
  const accessToken = sessionStorage.getItem("pi_access_token");

  if (!accessToken) {
    return undefined;
  }

  return {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };
};

export const usePayments = ({ isAuthenticated, onRequireAuth }: UsePaymentsArgs) => {
  const [isLoading, setIsLoading] = useState(false);
  const callbacksRef = useRef<PaymentCallbacks>({});

  const onReadyForServerApproval = useCallback(async (paymentId: string) => {
    try {
      await axiosClient.post(
        "/payments/approve",
        { paymentId },
        getPiAuthConfig()
      );
    } catch (err) {
      const message = getPaymentErrorMessage(err, "Payment approval failed");
      console.error("Error approving payment:", message);
      callbacksRef.current.onError?.(message);
      setIsLoading(false);
      throw err;
    }
  }, []);

  const onReadyForServerCompletion = useCallback(async (paymentId: string, txid: string) => {
    try {
      await axiosClient.post(
        "/payments/complete",
        { paymentId, txid },
        getPiAuthConfig()
      );
      callbacksRef.current.onCompleted?.(paymentId, txid);
    } catch (err) {
      const message = getPaymentErrorMessage(err, "Payment completion failed");
      console.error("Error completing payment:", message);
      callbacksRef.current.onError?.(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const onCancel = useCallback(async (paymentId: string) => {
    try {
      await axiosClient.post(
        "/payments/cancelled_payment",
        { paymentId },
        getPiAuthConfig()
      );
    } catch (err) {
      const message = getPaymentErrorMessage(err, "Payment cancellation failed");
      console.error("Error cancelling payment:", message);
      callbacksRef.current.onError?.(message);
    } finally {
      callbacksRef.current.onCancelled?.(paymentId);
      setIsLoading(false);
    }
  }, []);

  const onError = useCallback((error: Error, payment?: PaymentDTO) => {
    console.error("Payment error:", error.message, payment?.identifier);
    callbacksRef.current.onError?.(error.message || "Payment failed");
    setIsLoading(false);
  }, []);

  const orderProduct = useCallback(
    async (
      memo: string,
      amount: number,
      metadata: PaymentMetadata,
      tokenCanonical?: string,
      callbacks: PaymentCallbacks = {}
    ) => {
      if (!isAuthenticated) {
        onRequireAuth();
        return;
      }

      setIsLoading(true);
      callbacksRef.current = callbacks;
      try {
        await window.Pi.createPayment(
          {
            amount,
            memo,
            metadata,
            ...(tokenCanonical ? { tokenCanonical } : {}),
          },
          {
            onReadyForServerApproval,
            onReadyForServerCompletion,
            onCancel,
            onError,
          }
        );
      } catch (err) {
        const message = getPaymentErrorMessage(err, "Payment creation failed");
        console.error("Error creating payment:", message);
        callbacksRef.current.onError?.(message);
        setIsLoading(false);
      }
    },
    [isAuthenticated, onRequireAuth, onReadyForServerApproval, onReadyForServerCompletion, onCancel, onError]
  );

  const orderCart = useCallback(
    async (
      amount: number,
      itemCount: number,
      items: CartPaymentMetadata["items"],
      callbacks: PaymentCallbacks = {}
    ) =>
      orderProduct(
        `Newparts order - ${itemCount} items`,
        amount,
        {
          type: "cart",
          items,
        },
        undefined,
        callbacks
      ),
    [orderProduct]
  );

  return {
    orderProduct,
    orderCart,
    isLoading,
  };
};
