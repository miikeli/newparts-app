import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import type { StoreOutletContext } from "../components/StoreShell";
import { axiosClient } from "../lib/axiosClient";
import { getPiAuthConfig } from "../lib/piAuth";
import type { OrderSummary, ShippingAddress, UserProfile } from "../types/account";

type AccountTab = "profile" | "shipping" | "orders";

type ProfileResponse = {
  profile: UserProfile;
};

type OrdersResponse = {
  orders: OrderSummary[];
};

const emptyAddress: ShippingAddress = {
  fullName: "",
  phone: "",
  address1: "",
  address2: "",
  city: "",
  postalCode: "",
  country: "Montenegro",
  countryCode: "ME",
};

const formatPi = (amount: number) => `${amount.toFixed(2)} Pi`;

const formatDate = (value?: string) => {
  if (!value) {
    return "Nije dostupno";
  }

  return new Intl.DateTimeFormat("sr-Latn-ME").format(new Date(value));
};

const normalizeStatus = (status: string) =>
  status.charAt(0).toUpperCase() + status.slice(1);

const AccountPage = () => {
  const { isAuthenticated, requireAuth } = useOutletContext<StoreOutletContext>();
  const [activeTab, setActiveTab] = useState<AccountTab>("profile");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [address, setAddress] = useState<ShippingAddress>(emptyAddress);
  const [fieldErrors, setFieldErrors] = useState<{ [field: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let isMounted = true;

    const loadAccount = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [profileResponse, ordersResponse] = await Promise.all([
          axiosClient.get<ProfileResponse>("/user/profile", getPiAuthConfig()),
          axiosClient.get<OrdersResponse>("/orders", getPiAuthConfig()),
        ]);

        if (!isMounted) {
          return;
        }

        setProfile(profileResponse.data.profile);
        setAddress(profileResponse.data.profile.shippingAddress ?? emptyAddress);
        setOrders(ordersResponse.data.orders);
      } catch {
        if (isMounted) {
          setError("Nije moguće učitati podatke profila.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadAccount();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const saveAddress = async () => {
    setIsSaving(true);
    setMessage("");
    setError("");
    setFieldErrors({});

    try {
      const response = await axiosClient.put<ProfileResponse>(
        "/user/profile",
        { shippingAddress: address },
        getPiAuthConfig()
      );

      setProfile(response.data.profile);
      setAddress(response.data.profile.shippingAddress ?? emptyAddress);
      setMessage("Adresa dostave je sačuvana.");
    } catch (err) {
      const responseData = (err as { response?: { data?: { errors?: { [field: string]: string }; message?: string } } })
        .response?.data;

      setFieldErrors(responseData?.errors ?? {});
      setError(responseData?.message ?? "Nije moguće sačuvati adresu.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="account-page">
        <div className="shop-container">
          <div className="empty-state">
            <strong>Pi prijava je potrebna</strong>
            <p>Prijavi se da vidiš profil, adresu dostave i porudžbine.</p>
            <button onClick={requireAuth}>Pi prijava</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="account-page">
      <div className="shop-container">
        <div className="account-header">
          <div>
            <p>Moj nalog</p>
            <h1>Profil i porudžbine</h1>
          </div>
          <Link className="back-link" to="/">
            Nazad na shop
          </Link>
        </div>

        <div className="account-tabs">
          <button
            className={activeTab === "profile" ? "active" : ""}
            onClick={() => setActiveTab("profile")}
          >
            Moj profil
          </button>
          <button
            className={activeTab === "shipping" ? "active" : ""}
            onClick={() => setActiveTab("shipping")}
          >
            Adresa dostave
          </button>
          <button
            className={activeTab === "orders" ? "active" : ""}
            onClick={() => setActiveTab("orders")}
          >
            Moje porudžbine
          </button>
        </div>

        {isLoading ? (
          <div className="account-card">Učitavanje naloga...</div>
        ) : (
          <>
            {error && <p className="cart-message error">{error}</p>}
            {message && <p className="account-success-message">{message}</p>}

            {activeTab === "profile" && (
              <section className="account-card">
                <h2>Moj profil</h2>
                <dl className="profile-list">
                  <div>
                    <dt>Pi UID</dt>
                    <dd>{profile?.pi_uid ?? "Nije dostupno"}</dd>
                  </div>
                  <div>
                    <dt>Korisničko ime</dt>
                    <dd>{profile?.username ? `@${profile.username}` : "Nije dostupno"}</dd>
                  </div>
                  <div>
                    <dt>Status adrese</dt>
                    <dd>{profile?.shippingAddress ? "Sačuvana" : "Nije unesena"}</dd>
                  </div>
                </dl>
              </section>
            )}

            {activeTab === "shipping" && (
              <section className="account-card">
                <h2>Adresa dostave</h2>
                <div className="address-form">
                  {[
                    ["fullName", "Ime i prezime"],
                    ["phone", "Telefon"],
                    ["address1", "Adresa"],
                    ["address2", "Adresa 2 / stan / sprat"],
                    ["city", "Grad"],
                    ["postalCode", "Poštanski broj"],
                    ["country", "Država"],
                    ["countryCode", "Kod države"],
                  ].map(([field, label]) => (
                    <label key={field}>
                      <span>{label}</span>
                      <input
                        value={address[field as keyof ShippingAddress]}
                        onChange={(event) =>
                          setAddress((current) => ({
                            ...current,
                            [field]: event.target.value,
                          }))
                        }
                      />
                      {fieldErrors[field] && <small>{fieldErrors[field]}</small>}
                    </label>
                  ))}
                </div>

                <button className="account-primary-button" onClick={saveAddress} disabled={isSaving}>
                  {isSaving ? "Čuvanje..." : "Sačuvaj adresu"}
                </button>
              </section>
            )}

            {activeTab === "orders" && (
              <section className="account-card">
                <h2>Moje porudžbine</h2>
                {orders.length === 0 ? (
                  <div className="compact-empty">
                    <strong>Nema porudžbina</strong>
                    <p>Porudžbine će se prikazati nakon prve kupovine.</p>
                  </div>
                ) : (
                  <div className="orders-table-wrap">
                    <table className="orders-table">
                      <thead>
                        <tr>
                          <th>Order #</th>
                          <th>Datum</th>
                          <th>Status</th>
                          <th>Artikli</th>
                          <th>Ukupno</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.orderNumber}>
                            <td data-label="Order #">{order.orderNumber}</td>
                            <td data-label="Datum">{formatDate(order.created_at)}</td>
                            <td data-label="Status">{normalizeStatus(order.status)}</td>
                            <td data-label="Artikli">{order.itemCount}</td>
                            <td data-label="Ukupno">{formatPi(order.total)}</td>
                            <td>
                              {order.canViewDetail === false ? (
                                <span>Legacy order</span>
                              ) : (
                                <Link to={`/account/orders/${order.orderNumber}`}>Detalji</Link>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
};

export default AccountPage;
