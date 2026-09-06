import { useEffect, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { axiosClient } from "../lib/axiosClient";
import { getPiAuthConfig } from "../lib/piAuth";
import type { AdminUser } from "../types/admin";
import SignIn from "./SignIn";

type AdminMeResponse = {
  admin: AdminUser;
};

const adminNavItems = [
  { label: "Dashboard", to: "/admin", end: true },
  { label: "Products", to: "/admin/products" },
];

const placeholderItems = ["Categories", "Orders", "Customers", "Brands"];

const AdminShell = () => {
  const {
    user,
    signIn,
    signOut,
    showSignIn,
    closeSignIn,
    isLoading: isAuthLoading,
  } = useAuth();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [authState, setAuthState] = useState<"checking" | "allowed" | "denied" | "signin">(
    "checking",
  );

  useEffect(() => {
    let isMounted = true;

    const verifyAdmin = async () => {
      const authConfig = getPiAuthConfig();

      if (!user && !authConfig) {
        setAuthState("signin");
        return;
      }

      setAuthState("checking");

      try {
        const response = await axiosClient.get<AdminMeResponse>(
          "/admin/me",
          authConfig,
        );

        if (!isMounted) {
          return;
        }

        setAdminUser(response.data.admin);
        setAuthState("allowed");
      } catch (err) {
        if (!isMounted) {
          return;
        }

        if (
          typeof err === "object" &&
          err !== null &&
          "response" in err &&
          (err as { response?: { status?: number } }).response?.status === 403
        ) {
          setAuthState("denied");
        } else {
          setAuthState("signin");
        }
      }
    };

    verifyAdmin();

    return () => {
      isMounted = false;
    };
  }, [user]);

  if (authState === "checking") {
    return (
      <main className="admin-auth-screen">
        <section>
          <strong>Provjera admin pristupa...</strong>
          <p>Admin panel se učitava nakon potvrde autorizacije.</p>
        </section>
      </main>
    );
  }

  if (authState === "signin") {
    return (
      <main className="admin-auth-screen">
        <section>
          <strong>Admin prijava</strong>
          <p>Pi prijava je potrebna prije pristupa admin panelu.</p>
          <button onClick={signIn} disabled={isAuthLoading}>
            Pi prijava
          </button>
          <Link to="/">Nazad na shop</Link>
        </section>
        {showSignIn && (
          <SignIn
            onSignIn={signIn}
            onModalClose={closeSignIn}
            disabled={isAuthLoading}
          />
        )}
      </main>
    );
  }

  if (authState === "denied") {
    return (
      <main className="admin-auth-screen">
        <section>
          <strong>Pristup odbijen</strong>
          <p>Vaš Pi nalog nema admin dozvolu za NewParts administraciju.</p>
          <button onClick={signOut} disabled={isAuthLoading}>
            Odjava
          </button>
          <Link to="/">Nazad na shop</Link>
        </section>
      </main>
    );
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link to="/admin" className="admin-brand">
          <span>N</span>
          <strong>NewParts</strong>
        </Link>
        <nav>
          {adminNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {item.label}
            </NavLink>
          ))}
          {placeholderItems.map((item) => (
            <span key={item} className="admin-nav-placeholder">
              {item}
            </span>
          ))}
        </nav>
        <Link to="/" className="admin-shop-link">
          Otvori shop
        </Link>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span>NewParts Admin</span>
            <strong>Product management</strong>
          </div>
          <div>
            <span>{adminUser?.username ? `@${adminUser.username}` : adminUser?.uid}</span>
            <button onClick={signOut} disabled={isAuthLoading}>
              Odjava
            </button>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminShell;
