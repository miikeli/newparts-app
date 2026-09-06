import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import type { StoreOutletContext } from "../components/StoreShell";
import { axiosClient } from "../lib/axiosClient";
import { getPiAuthConfig } from "../lib/piAuth";
import type {
  OrderSummary,
  ShippingAddress,
  UserProfile,
  UserShippingAddress,
} from "../types/account";

type AccountTab = "profile" | "shipping" | "orders";

type AddressFormState = ShippingAddress & {
  label: string;
};

type ProfileResponse = {
  profile: UserProfile;
};

type OrdersResponse = {
  orders: OrderSummary[];
};

type AddressesResponse = {
  addresses: UserShippingAddress[];
  defaultShippingAddressId?: string;
};

const emptyAddress: AddressFormState = {
  label: "",
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

const toFormState = (address: UserShippingAddress): AddressFormState => ({
  label: address.label ?? "",
  fullName: address.fullName,
  phone: address.phone,
  address1: address.address1,
  address2: address.address2,
  city: address.city,
  postalCode: address.postalCode,
  country: address.country,
  countryCode: address.countryCode,
});

const addressSummary = (address?: ShippingAddress | null) => {
  if (!address) {
    return null;
  }

  return (
    <address className="address-summary">
      <strong>{address.fullName}</strong>
      <span>{address.address1}</span>
      {address.address2 && <span>{address.address2}</span>}
      <span>
        {address.city}, {address.postalCode}
      </span>
      <span>{address.country}</span>
    </address>
  );
};

const AccountPage = () => {
  const { isAuthenticated, requireAuth } = useOutletContext<StoreOutletContext>();
  const [activeTab, setActiveTab] = useState<AccountTab>("profile");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [addresses, setAddresses] = useState<UserShippingAddress[]>([]);
  const [defaultShippingAddressId, setDefaultShippingAddressId] = useState("");
  const [formAddress, setFormAddress] =
    useState<AddressFormState>(emptyAddress);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [field: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const defaultAddress =
    addresses.find((address) => address.id === defaultShippingAddressId) ??
    addresses[0];

  const syncAddresses = (response: AddressesResponse) => {
    setAddresses(response.addresses);
    setDefaultShippingAddressId(response.defaultShippingAddressId ?? "");
    setProfile((current) =>
      current
        ? {
            ...current,
            addresses: response.addresses,
            defaultShippingAddressId: response.defaultShippingAddressId,
            shippingAddress:
              response.addresses.find(
                (address) => address.id === response.defaultShippingAddressId,
              ) ?? response.addresses[0] ?? null,
          }
        : current,
    );
  };

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
        setAddresses(profileResponse.data.profile.addresses ?? []);
        setDefaultShippingAddressId(
          profileResponse.data.profile.defaultShippingAddressId ?? "",
        );
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

  const openNewAddressForm = () => {
    setEditingAddressId(null);
    setFormAddress(emptyAddress);
    setFieldErrors({});
    setMessage("");
    setError("");
    setIsFormOpen(true);
  };

  const openEditAddressForm = (address: UserShippingAddress) => {
    setEditingAddressId(address.id);
    setFormAddress(toFormState(address));
    setFieldErrors({});
    setMessage("");
    setError("");
    setIsFormOpen(true);
  };

  const closeAddressForm = () => {
    setIsFormOpen(false);
    setEditingAddressId(null);
    setFormAddress(emptyAddress);
    setFieldErrors({});
  };

  const saveAddress = async () => {
    setIsSaving(true);
    setMessage("");
    setError("");
    setFieldErrors({});

    try {
      const payload = {
        label: formAddress.label,
        fullName: formAddress.fullName,
        phone: formAddress.phone,
        address1: formAddress.address1,
        address2: formAddress.address2,
        city: formAddress.city,
        postalCode: formAddress.postalCode,
        country: formAddress.country,
        countryCode: formAddress.countryCode,
      };
      const response = editingAddressId
        ? await axiosClient.put<AddressesResponse>(
            `/user/addresses/${encodeURIComponent(editingAddressId)}`,
            payload,
            getPiAuthConfig(),
          )
        : await axiosClient.post<AddressesResponse>(
            "/user/addresses",
            payload,
            getPiAuthConfig(),
          );

      syncAddresses(response.data);
      setMessage(
        editingAddressId
          ? "Adresa dostave je ažurirana."
          : "Adresa dostave je dodata.",
      );
      closeAddressForm();
    } catch (err) {
      const responseData = (err as { response?: { data?: { errors?: { [field: string]: string }; message?: string } } })
        .response?.data;

      setFieldErrors(responseData?.errors ?? {});
      setError(responseData?.message ?? "Nije moguće sačuvati adresu.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAddress = async (addressId: string) => {
    setMessage("");
    setError("");

    try {
      const response = await axiosClient.delete<AddressesResponse>(
        `/user/addresses/${encodeURIComponent(addressId)}`,
        getPiAuthConfig(),
      );

      syncAddresses(response.data);
      setMessage("Adresa je obrisana.");
      if (editingAddressId === addressId) {
        closeAddressForm();
      }
    } catch (err) {
      const responseData = (err as { response?: { data?: { message?: string } } })
        .response?.data;
      setError(responseData?.message ?? "Nije moguće obrisati adresu.");
    }
  };

  const setDefaultAddress = async (addressId: string) => {
    setMessage("");
    setError("");

    try {
      const response = await axiosClient.put<AddressesResponse>(
        `/user/addresses/${encodeURIComponent(addressId)}/default`,
        {},
        getPiAuthConfig(),
      );

      syncAddresses(response.data);
      setMessage("Podrazumijevana adresa je ažurirana.");
    } catch (err) {
      const responseData = (err as { response?: { data?: { message?: string } } })
        .response?.data;
      setError(responseData?.message ?? "Nije moguće postaviti podrazumijevanu adresu.");
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="account-page">
        <div className="shop-container">
          <div className="empty-state">
            <strong>Pi prijava je potrebna</strong>
            <p>Prijavi se da vidiš profil, adrese dostave i porudžbine.</p>
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
            Adrese dostave
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
                    <dt>Podrazumijevana adresa dostave</dt>
                    <dd>
                      {defaultAddress
                        ? addressSummary(defaultAddress)
                        : "Nemate podrazumijevanu adresu dostave."}
                      <button
                        className="text-action"
                        onClick={() => setActiveTab("shipping")}
                      >
                        Upravljaj adresama
                      </button>
                    </dd>
                  </div>
                </dl>
              </section>
            )}

            {activeTab === "shipping" && (
              <section className="account-card">
                <div className="section-header">
                  <h2>Adrese dostave</h2>
                  <button className="account-primary-button" onClick={openNewAddressForm}>
                    + Dodaj novu adresu
                  </button>
                </div>

                {isFormOpen && (
                  <div className="address-editor">
                    <h3>{editingAddressId ? "Izmijeni adresu" : "Nova adresa"}</h3>
                    <div className="address-form">
                      {[
                        ["label", "Naziv adrese / Label"],
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
                            value={formAddress[field as keyof AddressFormState]}
                            onChange={(event) =>
                              setFormAddress((current) => ({
                                ...current,
                                [field]: event.target.value,
                              }))
                            }
                          />
                          {fieldErrors[field] && <small>{fieldErrors[field]}</small>}
                        </label>
                      ))}
                    </div>

                    <div className="address-form-actions">
                      <button
                        className="account-primary-button"
                        onClick={saveAddress}
                        disabled={isSaving}
                      >
                        {isSaving ? "Čuvanje..." : "Sačuvaj"}
                      </button>
                      <button className="secondary-button" onClick={closeAddressForm}>
                        Otkaži
                      </button>
                    </div>
                  </div>
                )}

                {addresses.length === 0 ? (
                  <div className="compact-empty">
                    <strong>Nemate sačuvane adrese.</strong>
                    <p>Dodajte adresu dostave prije plaćanja korpe.</p>
                  </div>
                ) : (
                  <div className="address-card-grid">
                    {addresses.map((address) => {
                      const isDefault = address.id === defaultShippingAddressId;

                      return (
                        <article className="address-card" key={address.id}>
                          <div>
                            <strong>{address.label || "Adresa dostave"}</strong>
                            {isDefault && <span>Podrazumijevana</span>}
                          </div>
                          <address>
                            <strong>{address.fullName}</strong>
                            <span>{address.phone}</span>
                            <span>{address.address1}</span>
                            {address.address2 && <span>{address.address2}</span>}
                            <span>
                              {address.city}, {address.postalCode}
                            </span>
                            <span>
                              {address.country} ({address.countryCode})
                            </span>
                          </address>
                          <div className="address-card-actions">
                            <button onClick={() => openEditAddressForm(address)}>
                              Izmijeni
                            </button>
                            <button onClick={() => deleteAddress(address.id)}>
                              Obriši
                            </button>
                            {!isDefault && (
                              <button onClick={() => setDefaultAddress(address.id)}>
                                Postavi kao podrazumijevanu
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
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
