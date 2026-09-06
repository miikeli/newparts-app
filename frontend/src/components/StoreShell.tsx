import { Outlet } from "react-router-dom";
import Header from "./Header";
import SignIn from "./SignIn";
import { useAuth } from "../hooks/useAuth";
import { axiosClient } from "../lib/axiosClient.ts";
import { useCart } from "../context/CartContext";

export type StoreOutletContext = {
  isAuthenticated: boolean;
  requireAuth: () => void;
};

const StoreShell = () => {
  const {
    user,
    isAuthenticated,
    signIn,
    signOut,
    showSignIn,
    closeSignIn,
    requireAuth,
    isLoading: isAuthLoading,
  } = useAuth();
  const { itemCount } = useCart();

  const onSendTestNotification = () => {
    const notification = {
      title: "Newparts",
      body: "Test notification from Newparts",
      user_uid: user?.uid,
      subroute: "/shop",
    };

    axiosClient.post("/notifications/send", {
      notifications: [notification],
    });
  };

  return (
    <div className="newparts-page">
      <Header
        user={user}
        onSignIn={signIn}
        onSignOut={signOut}
        onSendTestNotification={onSendTestNotification}
        isLoading={isAuthLoading}
        cartItemCount={itemCount}
      />

      <Outlet context={{ isAuthenticated, requireAuth }} />

      {showSignIn && (
        <SignIn
          onSignIn={signIn}
          onModalClose={closeSignIn}
          disabled={isAuthLoading}
        />
      )}
    </div>
  );
};

export default StoreShell;
