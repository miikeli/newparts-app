import { useEffect, useRef, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import type { StoreOutletContext } from "../components/StoreShell";
import { useI18n, type Language } from "../i18n";
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

type AdminMeResponse = {
  admin: {
    uid: string;
    username?: string;
  };
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

const dateLocaleByLanguage: Record<Language, string> = {
  me: "sr-Latn-ME",
  en: "en",
};

const formatDate = (value: string | undefined, language: Language, fallback: string) => {
  if (!value) {
    return fallback;
  }

  return new Intl.DateTimeFormat(dateLocaleByLanguage[language]).format(new Date(value));
};

const formatStatus = (status: string, t: ReturnType<typeof useI18n>["t"]) => {
  switch (status) {
    case "pending":
      return t("status.pending");
    case "paid":
      return t("status.paid");
    case "processing":
      return t("status.processing");
    case "shipped":
      return t("status.shipped");
    case "delivered":
      return t("status.delivered");
    case "cancelled":
      return t("status.cancelled");
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

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
  const { language, t } = useI18n();
  const tRef = useRef(t);
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
  const [isAdmin, setIsAdmin] = useState(false);
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
    document.title = t("account.titleTag");
  }, [t]);

  useEffect(() => {
    tRef.current = t;
  }, [t]);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsAdmin(false);
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

        try {
          await axiosClient.get<AdminMeResponse>("/admin/me", getPiAuthConfig());

          if (isMounted) {
            setIsAdmin(true);
          }
        } catch {
          if (isMounted) {
            setIsAdmin(false);
          }
        }
      } catch {
        if (isMounted) {
          setError(tRef.current("account.loadingError"));
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
          ? t("account.addressUpdated")
          : t("account.addressAdded"),
      );
      closeAddressForm();
    } catch (err) {
      const responseData = (err as { response?: { data?: { errors?: { [field: string]: string }; message?: string } } })
        .response?.data;

      setFieldErrors(responseData?.errors ?? {});
      setError(responseData?.message ?? t("account.addressSaveError"));
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
      setMessage(t("account.addressDeleted"));
      if (editingAddressId === addressId) {
        closeAddressForm();
      }
    } catch (err) {
      const responseData = (err as { response?: { data?: { message?: string } } })
        .response?.data;
      setError(responseData?.message ?? t("account.addressDeleteError"));
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
      setMessage(t("account.defaultUpdated"));
    } catch (err) {
      const responseData = (err as { response?: { data?: { message?: string } } })
        .response?.data;
      setError(responseData?.message ?? t("account.defaultUpdateError"));
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="account-page">
        <div className="shop-container">
          <div className="empty-state">
            <strong>{t("account.signInRequiredTitle")}</strong>
            <p>{t("account.signInRequiredText")}</p>
            <button onClick={requireAuth}>{t("header.signIn")}</button>
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
            <p>{t("account.kicker")}</p>
            <h1>{t("account.heading")}</h1>
          </div>
          <Link className="back-link" to="/">
            {t("common.backToShop")}
          </Link>
        </div>

        <div className="account-tabs">
          <button
            className={activeTab === "profile" ? "active" : ""}
            onClick={() => setActiveTab("profile")}
          >
            {t("account.profileTab")}
          </button>
          <button
            className={activeTab === "shipping" ? "active" : ""}
            onClick={() => setActiveTab("shipping")}
          >
            {t("account.shippingTab")}
          </button>
          <button
            className={activeTab === "orders" ? "active" : ""}
            onClick={() => setActiveTab("orders")}
          >
            {t("account.ordersTab")}
          </button>
        </div>

        {isLoading ? (
          <div className="account-card">{t("account.loading")}</div>
        ) : (
          <>
            {error && <p className="cart-message error">{error}</p>}
            {message && <p className="account-success-message">{message}</p>}

            {activeTab === "profile" && (
              <section className="account-card">
                <h2>{t("account.profileTab")}</h2>
                <dl className="profile-list">
                  <div>
                    <dt>{t("account.piUid")}</dt>
                    <dd>{profile?.pi_uid ?? t("common.unavailable")}</dd>
                  </div>
                  <div>
                    <dt>{t("account.username")}</dt>
                    <dd>{profile?.username ? `@${profile.username}` : t("common.unavailable")}</dd>
                  </div>
                  <div>
                    <dt>{t("account.defaultAddress")}</dt>
                    <dd>
                      {defaultAddress
                        ? addressSummary(defaultAddress)
                        : t("account.noDefaultAddress")}
                      <button
                        className="text-action"
                        onClick={() => setActiveTab("shipping")}
                      >
                        {t("cart.manageAddresses")}
                      </button>
                    </dd>
                  </div>
                </dl>
                {isAdmin && (
                  <div className="account-admin-action">
                    <div>
                      <strong>{t("account.adminAccess")}</strong>
                      <span>{t("account.adminDescription")}</span>
                    </div>
                    <Link to="/admin">{t("account.adminPanel")}</Link>
                  </div>
                )}
              </section>
            )}

            {activeTab === "shipping" && (
              <section className="account-card">
                <div className="section-header">
                  <h2>{t("account.shippingTab")}</h2>
                  <button className="account-primary-button" onClick={openNewAddressForm}>
                    {t("account.addNewAddress")}
                  </button>
                </div>

                {isFormOpen && (
                  <div className="address-editor">
                    <h3>
                      {editingAddressId
                        ? t("account.editAddress")
                        : t("account.newAddress")}
                    </h3>
                    <div className="address-form">
                      {[
                        ["label", t("account.label")],
                        ["fullName", t("account.fullName")],
                        ["phone", t("account.phone")],
                        ["address1", t("account.address1")],
                        ["address2", t("account.address2")],
                        ["city", t("account.city")],
                        ["postalCode", t("account.postalCode")],
                        ["country", t("account.country")],
                        ["countryCode", t("account.countryCode")],
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
                        {isSaving ? t("common.saving") : t("common.save")}
                      </button>
                      <button className="secondary-button" onClick={closeAddressForm}>
                        {t("common.cancel")}
                      </button>
                    </div>
                  </div>
                )}

                {addresses.length === 0 ? (
                  <div className="compact-empty">
                    <strong>{t("account.noAddresses")}</strong>
                    <p>{t("account.noAddressesHint")}</p>
                  </div>
                ) : (
                  <div className="address-card-grid">
                    {addresses.map((address) => {
                      const isDefault = address.id === defaultShippingAddressId;

                      return (
                        <article className="address-card" key={address.id}>
                          <div>
                            <strong>{address.label || t("cart.addressFallback")}</strong>
                            {isDefault && <span>{t("common.default")}</span>}
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
                              {t("common.edit")}
                            </button>
                            <button onClick={() => deleteAddress(address.id)}>
                              {t("common.delete")}
                            </button>
                            {!isDefault && (
                              <button onClick={() => setDefaultAddress(address.id)}>
                                {t("account.setDefault")}
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
                <h2>{t("account.ordersTab")}</h2>
                {orders.length === 0 ? (
                  <div className="compact-empty">
                    <strong>{t("account.noOrders")}</strong>
                    <p>{t("account.noOrdersHint")}</p>
                  </div>
                ) : (
                  <div className="orders-table-wrap">
                    <table className="orders-table">
                      <thead>
                        <tr>
                          <th>{t("account.orderNumber")}</th>
                          <th>{t("common.date")}</th>
                          <th>{t("common.status")}</th>
                          <th>{t("common.items")}</th>
                          <th>{t("common.total")}</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.orderNumber}>
                            <td data-label={t("account.orderNumber")}>{order.orderNumber}</td>
                            <td data-label={t("common.date")}>
                              {formatDate(order.created_at, language, t("common.unavailable"))}
                            </td>
                            <td data-label={t("common.status")}>
                              {formatStatus(order.status, t)}
                            </td>
                            <td data-label={t("common.items")}>{order.itemCount}</td>
                            <td data-label={t("common.total")}>{formatPi(order.total)}</td>
                            <td>
                              {order.canViewDetail === false ? (
                                <span>{t("account.legacyOrder")}</span>
                              ) : (
                                <Link to={`/account/orders/${order.orderNumber}`}>
                                  {t("common.details")}
                                </Link>
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
