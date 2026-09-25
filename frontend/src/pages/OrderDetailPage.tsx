import { useEffect, useRef, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import type { StoreOutletContext } from "../components/StoreShell";
import { useI18n, type Language } from "../i18n";
import { axiosClient } from "../lib/axiosClient";
import { getPiAuthConfig } from "../lib/piAuth";
import type { OrderDetail } from "../types/account";

type OrderResponse = {
  order: OrderDetail;
};

const formatPi = (amount?: number) => `${(amount ?? 0).toFixed(2)} Pi`;

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

const OrderDetailPage = () => {
  const { language, t } = useI18n();
  const tRef = useRef(t);
  const { orderNumber } = useParams();
  const { isAuthenticated, requireAuth } = useOutletContext<StoreOutletContext>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    tRef.current = t;
  }, [t]);

  useEffect(() => {
    if (!isAuthenticated || !orderNumber) {
      return;
    }

    let isMounted = true;

    const loadOrder = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await axiosClient.get<OrderResponse>(
          `/orders/${encodeURIComponent(orderNumber)}`,
          getPiAuthConfig()
        );

        if (isMounted) {
          setOrder(response.data.order);
        }
      } catch {
        if (isMounted) {
          setError(tRef.current("order.loadError"));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadOrder();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, orderNumber]);

  useEffect(() => {
    document.title = orderNumber
      ? `${t("account.orderNumber")} ${orderNumber} | NewParts`
      : t("account.titleTag");
  }, [orderNumber, t]);

  if (!isAuthenticated) {
    return (
      <main className="account-page">
        <div className="shop-container">
          <div className="empty-state">
            <strong>{t("account.signInRequiredTitle")}</strong>
            <p>{t("order.signInRequired")}</p>
            <button onClick={requireAuth}>{t("header.signIn")}</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="account-page">
      <div className="shop-container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">{t("product.home")}</Link>
          <span>/</span>
          <Link to="/account">{t("order.myAccount")}</Link>
          <span>/</span>
          <strong>{orderNumber}</strong>
        </nav>

        {isLoading && <div className="account-card">{t("order.loading")}</div>}
        {error && <p className="cart-message error">{error}</p>}

        {order && (
          <section className="order-detail-card">
            <div className="order-detail-header">
              <div>
                <p>{t("account.orderNumber")}{order.orderNumber}</p>
                <h1>{formatStatus(order.status, t)}</h1>
              </div>
              <div>
                <span>{t("common.date")}</span>
                <strong>
                  {formatDate(order.created_at, language, t("common.unavailable"))}
                </strong>
              </div>
            </div>

            <div className="order-detail-items">
              {order.items.length === 0 ? (
                <div className="compact-empty">
                  <strong>{t("order.oldFormat")}</strong>
                  <p>{t("order.oldFormatHint")}</p>
                </div>
              ) : (
                order.items.map((item, index) => (
                  <article className="order-detail-item" key={`${item.productId}-${index}`}>
                    {item.image && (
                      <img src={item.image} alt={item.name ?? t("order.productFallback")} />
                    )}
                    <div>
                      <strong>{item.name ?? t("order.productFallback")}</strong>
                      {item.brand && <span>{item.brand}</span>}
                      <small>SKU: {item.sku ?? "N/A"} | MPN: {item.mpn ?? "N/A"}</small>
                    </div>
                    <div>
                      <span>{t("common.quantity")}</span>
                      <strong>{item.quantity ?? 0}</strong>
                    </div>
                    <div>
                      <span>{t("common.price")}</span>
                      <strong>{formatPi(item.unitPrice)}</strong>
                    </div>
                    <div>
                      <span>{t("common.total")}</span>
                      <strong>{formatPi(item.lineTotal)}</strong>
                    </div>
                  </article>
                ))
              )}
            </div>

            <div className="order-detail-grid">
              <section>
                <h2>{t("order.shippingAddress")}</h2>
                {order.shippingAddress ? (
                  <address>
                    <strong>{order.shippingAddress.fullName}</strong>
                    <span>{order.shippingAddress.phone}</span>
                    <span>{order.shippingAddress.address1}</span>
                    {order.shippingAddress.address2 && <span>{order.shippingAddress.address2}</span>}
                    <span>
                      {order.shippingAddress.postalCode} {order.shippingAddress.city}
                    </span>
                    <span>
                      {order.shippingAddress.country} ({order.shippingAddress.countryCode})
                    </span>
                  </address>
                ) : (
                  <p>{t("order.missingAddress")}</p>
                )}
              </section>

              <section>
                <h2>{t("order.summary")}</h2>
                <div>
                  <span>{t("common.subtotal")}</span>
                  <strong>{formatPi(order.subtotal)}</strong>
                </div>
                <div>
                  <span>{t("common.total")}</span>
                  <strong>{formatPi(order.total)}</strong>
                </div>
                {order.txid && (
                  <div>
                    <span>TXID</span>
                    <strong>{order.txid}</strong>
                  </div>
                )}
              </section>
            </div>
          </section>
        )}
      </div>
    </main>
  );
};

export default OrderDetailPage;
