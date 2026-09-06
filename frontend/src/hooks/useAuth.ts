import { useCallback, useState } from "react";
import { axiosClient } from "../lib/axiosClient";
import { getPiAuthConfig } from "../lib/piAuth";
import type { AuthResult, PaymentDTO, User } from "../types/pi";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const onIncompletePaymentFound = useCallback(async (payment: PaymentDTO) => {
    try {
      await axiosClient.post(
        "/payments/incomplete",
        { payment },
        getPiAuthConfig()
      );
    } catch {
      console.error("Error handling incomplete payment");
    }
  }, []);

  const signInUser = useCallback(async (authResult: AuthResult) => {
    try {
      await axiosClient.post("/user/signin", { authResult });

      sessionStorage.setItem("pi_access_token", authResult.accessToken);

      setUser(authResult.user);
      setShowSignIn(false);
    } catch {
      console.error("Error signing in");
    }
  }, []);

  const signIn = useCallback(async () => {
    setIsLoading(true);
    try {
      const scopes = ["username", "payments", "roles", "in_app_notifications"];
      const authResult = await window.Pi.authenticate(scopes, onIncompletePaymentFound);
      await signInUser(authResult);
    } catch {
      console.error("Error authenticating");
    } finally {
      setIsLoading(false);
    }
  }, [onIncompletePaymentFound, signInUser]);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await axiosClient.get("/user/signout");

      sessionStorage.removeItem("pi_access_token");

      setUser(null);
    } catch {
      console.error("Error signing out");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const closeSignIn = useCallback(() => {
    setShowSignIn(false);
  }, []);

  return {
    user,
    isAuthenticated: Boolean(user),
    showSignIn,
    signIn,
    signOut,
    closeSignIn,
    requireAuth: () => setShowSignIn(true),
    isLoading,
  };
};
