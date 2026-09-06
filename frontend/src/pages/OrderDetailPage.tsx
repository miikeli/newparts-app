import { useEffect, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import type { StoreOutletContext } from "../components/StoreShell";
import { axiosClient } from "../lib/axiosClient";
import { getPiAuthConfig } from "../lib/piAuth";
import type { OrderDetail } from "../types/account";

type OrderResponse = {
  order: OrderDetail;
};

const formatPi = (amount?: number) => `${(amount ?? 0).toFixed(2)} Pi`;

const formatDate = (value?: string) => {
  if (!value) {
    return "Nije dostupno";
  }

  return new Intl.DateTimeFormat("sr-Latn-ME").format(new Date(value));
};

const OrderDetailPage = () => {
  const { orderNumber } = useParams();
  const { isAuthenticated, requireAuth } = useOutletContext<StoreOutletContext>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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
          setError("Nije moguće učitati porudžbinu.");
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

  if (!isAuthenticated) {
    return (
      <main className="account-page">
        <div className="shop-container">
          <div className="empty-state">
            <strong>Pi prijava je potrebna</strong>
            <p>Prijavi se da vidiš detalje porudžbine.</p>
            <button onClick={requireAuth}>Pi prijava</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="account-page">
      <div className="shop-container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/account">Moj nalog</Link>
          <span>/</span>
          <strong>{orderNumber}</strong>
        </nav>

        {isLoading && <div className="account-card">Učitavanje porudžbine...</div>}
        {error && <p className="cart-message error">{error}</p>}

        {order && (
          <section className="order-detail-card">
            <div className="order-detail-header">
              <div>
                <p>Order #{order.orderNumber}</p>
                <h1>{order.status}</h1>
              </div>
              <div>
                <span>Datum</span>
                <strong>{formatDate(order.created_at)}</strong>
              </div>
            </div>

            <div className="order-detail-items">
              {order.items.length === 0 ? (
                <div className="compact-empty">
                  <strong>Stari format porudžbine</strong>
                  <p>Detalji artikala nijesu dostupni za ovu porudžbinu.</p>
                </div>
              ) : (
                order.items.map((item, index) => (
                  <article className="order-detail-item" key={`${item.productId}-${index}`}>
                    {item.image && <img src={item.image} alt={item.name ?? "Proizvod"} />}
                    <div>
                      <strong>{item.name ?? "Proizvod"}</strong>
                      {item.brand && <span>{item.brand}</span>}
                      <small>SKU: {item.sku ?? "N/A"} | MPN: {item.mpn ?? "N/A"}</small>
                    </div>
                    <div>
                      <span>Količina</span>
                      <strong>{item.quantity ?? 0}</strong>
                    </div>
                    <div>
                      <span>Cijena</span>
                      <strong>{formatPi(item.unitPrice)}</strong>
                    </div>
                    <div>
                      <span>Ukupno</span>
                      <strong>{formatPi(item.lineTotal)}</strong>
                    </div>
                  </article>
                ))
              )}
            </div>

            <div className="order-detail-grid">
              <section>
                <h2>Adresa dostave</h2>
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
                  <p>Adresa nije dostupna za ovu porudžbinu.</p>
                )}
              </section>

              <section>
                <h2>Sažetak</h2>
                <div>
                  <span>Subtotal</span>
                  <strong>{formatPi(order.subtotal)}</strong>
                </div>
                <div>
                  <span>Total</span>
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
