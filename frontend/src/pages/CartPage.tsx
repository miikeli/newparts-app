import { useEffect, useRef, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import type { StoreOutletContext } from "../components/StoreShell";
import { useCart } from "../context/CartContext";
import {
  getLocalizedProductImages,
  getLocalizedProductName,
} from "../services/catalog";
import { usePayments } from "../hooks/usePayments";
import { useI18n } from "../i18n";
import { axiosClient } from "../lib/axiosClient";
import { getPiAuthConfig } from "../lib/piAuth";
import type { UserShippingAddress } from "../types/account";

const formatPi = (amount: number) => `${amount.toFixed(2)} Test-Pi`;

type CompletedOrderSummary = {
  paymentId: string;
  txid: string;
  itemCount: number;
  total: number;
  items: {
    productId: string;
    name: string;
    quantity: number;
    lineSubtotal: number;
  }[];
};

type AddressesResponse = {
  addresses: UserShippingAddress[];
  defaultShippingAddressId?: string;
};

const CartPage = () => {
  const { language, t } = useI18n();
  const tRef = useRef(t);
  const {
    items,
    itemCount,
    subtotal,
    removeItem,
    updateQuantity,
    clearCart,
  } = useCart();
  const { isAuthenticated, requireAuth } = useOutletContext<StoreOutletContext>();
  const { orderCart, isLoading } = usePayments({
    isAuthenticated,
    onRequireAuth: requireAuth,
  });
  const [checkoutError, setCheckoutError] = useState("");
  const [needsAddress, setNeedsAddress] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [addresses, setAddresses] = useState<UserShippingAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [completedOrder, setCompletedOrder] =
    useState<CompletedOrderSummary | null>(null);

  useEffect(() => {
    document.title = t("cart.titleTag");
  }, [t]);

  useEffect(() => {
    tRef.current = t;
  }, [t]);

  useEffect(() => {
    if (!isAuthenticated) {
      setAddresses([]);
      setSelectedAddressId("");
      return;
    }

    let isMounted = true;

    const loadAddresses = async () => {
      setIsLoadingAddresses(true);

      try {
        const response = await axiosClient.get<AddressesResponse>(
          "/user/addresses",
          getPiAuthConfig()
        );

        if (!isMounted) {
          return;
        }

        setAddresses(response.data.addresses);
        setSelectedAddressId(
          response.data.defaultShippingAddressId ??
            response.data.addresses[0]?.id ??
            ""
        );
      } catch {
        if (isMounted) {
          setCheckoutError(tRef.current("cart.loadAddressesError"));
        }
      } finally {
        if (isMounted) {
          setIsLoadingAddresses(false);
        }
      }
    };

    loadAddresses();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const handleCheckout = async () => {
    setCheckoutError("");
    setNeedsAddress(false);
    setCompletedOrder(null);

    if (!isAuthenticated) {
      setCheckoutError(t("cart.authRequired"));
      requireAuth();
      return;
    }

    if (items.length === 0) {
      return;
    }

    if (!selectedAddressId) {
      setNeedsAddress(true);
      setCheckoutError(t("cart.addressRequired"));
      return;
    }

    const paymentItems = items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));
    const orderSnapshot: Omit<CompletedOrderSummary, "paymentId" | "txid"> = {
      itemCount,
      total: subtotal,
      items: items.map((item) => ({
        productId: item.productId,
        name: getLocalizedProductName(item.product, language),
        quantity: item.quantity,
        lineSubtotal: item.lineSubtotal,
      })),
    };

    orderCart(
      Number(subtotal.toFixed(7)),
      itemCount,
      paymentItems,
      selectedAddressId,
      {
        onCompleted: (paymentId, txid) => {
          setCompletedOrder({
            paymentId,
            txid,
            ...orderSnapshot,
          });
          clearCart();
        },
        onCancelled: () => {
          setCheckoutError(t("cart.cancelled"));
        },
        onError: (message) => {
          setCheckoutError(message);
        },
      },
    );
  };

  return (
    <main className="cart-page">
      <div className="shop-container">
        <div className="cart-header">
          <div>
            <h1>{t("cart.title")}</h1>
            <p>
              {itemCount} {t("cart.itemsCount")}
            </p>
          </div>

          <Link className="back-link" to="/">
            {t("common.continueShopping")}
          </Link>
        </div>

        {completedOrder ? (
          <section className="cart-success">
            <strong>{t("cart.paidTitle")}</strong>
            <p>
              {t("cart.paidText", {
                count: completedOrder.itemCount,
                total: formatPi(completedOrder.total),
              })}
            </p>
            <dl>
              <div>
                <dt>Payment ID</dt>
                <dd>{completedOrder.paymentId}</dd>
              </div>
              <div>
                <dt>TXID</dt>
                <dd>{completedOrder.txid}</dd>
              </div>
            </dl>
            <div className="order-summary-list">
              {completedOrder.items.map((item) => (
                <div key={item.productId}>
                  <span>
                    {item.name} x {item.quantity}
                  </span>
                  <strong>{formatPi(item.lineSubtotal)}</strong>
                </div>
              ))}
            </div>
            <Link className="back-link" to="/">
              {t("common.backToShop")}
            </Link>
          </section>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <strong>{t("cart.empty")}</strong>
            <p>{t("cart.emptyHint")}</p>
            <Link to="/">{t("common.backToShop")}</Link>
            <button className="cart-checkout-button" disabled>
              {t("cart.payWithPi")}
            </button>
          </div>
        ) : (
          <section className="cart-layout">
            <div className="cart-items">
              {items.map((item) => (
                <article className="cart-item" key={item.productId}>
                  <Link
                    className="cart-item-image"
                    to={`/product/${item.productId}`}
                  >
                    <img
                      src={getLocalizedProductImages(item.product)[0]}
                      alt={getLocalizedProductName(item.product, language)}
                    />
                  </Link>

                  <div className="cart-item-info">
                    <Link to={`/product/${item.productId}`}>
                      {getLocalizedProductName(item.product, language)}
                    </Link>
                    <span>{item.product.brand}</span>
                    <small>SKU: {item.product.sku}</small>
                  </div>

                  <div className="cart-quantity">
                    <label htmlFor={`cart-quantity-${item.productId}`}>
                      {t("common.quantity")}
                    </label>
                    <input
                      id={`cart-quantity-${item.productId}`}
                      type="number"
                      min={1}
                      max={item.product.stock}
                      value={item.quantity}
                      onChange={(event) =>
                        updateQuantity(item.productId, Number(event.target.value) || 1)
                      }
                    />
                  </div>

                  <div className="cart-price">{formatPi(item.product.pricePi)}</div>
                  <div className="cart-line-total">
                    {formatPi(item.lineSubtotal)}
                  </div>

                  <button
                    className="cart-remove"
                    onClick={() => removeItem(item.productId)}
                  >
                    {t("common.remove")}
                  </button>
                </article>
              ))}
            </div>

            <aside className="cart-summary">
              <h2>{t("cart.summary")}</h2>
              <div>
                <span>{t("common.subtotal")}</span>
                <strong>{formatPi(subtotal)}</strong>
              </div>
              <div>
                <span>{t("cart.shipping")}</span>
                <strong>{t("cart.shippingLater")}</strong>
              </div>
              <div className="cart-total">
                <span>{t("common.total")}</span>
                <strong>{formatPi(subtotal)}</strong>
              </div>

              {!isAuthenticated && (
                <p className="cart-auth-notice">
                  {t("cart.piAuthNotice")}
                </p>
              )}

              {isAuthenticated && (
                <section className="cart-address-section">
                  <div>
                    <h3>{t("cart.shippingAddress")}</h3>
                    <Link to="/account">{t("cart.manageAddresses")}</Link>
                  </div>

                  {isLoadingAddresses ? (
                    <p>{t("cart.loadingAddresses")}</p>
                  ) : addresses.length === 0 ? (
                    <div className="cart-address-empty">
                      <strong>{t("cart.addressRequired")}</strong>
                      <Link to="/account">{t("cart.addAddress")}</Link>
                    </div>
                  ) : (
                    <div className="cart-address-options">
                      {addresses.map((address) => (
                        <label
                          className={
                            selectedAddressId === address.id ? "active" : ""
                          }
                          key={address.id}
                        >
                          <input
                            type="radio"
                            name="shippingAddress"
                            checked={selectedAddressId === address.id}
                            onChange={() => setSelectedAddressId(address.id)}
                          />
                          <span>
                            <strong>
                              {address.label || t("cart.addressFallback")}
                            </strong>
                            {address.fullName}
                            <small>
                              {address.address1}, {address.city}{" "}
                              {address.postalCode}
                            </small>
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {checkoutError && (
                <p className="cart-message error">{checkoutError}</p>
              )}

              {needsAddress && (
                <Link className="cart-address-link" to="/account">
                  {t("cart.enterAddress")}
                </Link>
              )}

              <button
                className="cart-checkout-button"
                onClick={handleCheckout}
                disabled={
                  items.length === 0 ||
                  isLoading ||
                  isLoadingAddresses ||
                  (isAuthenticated && addresses.length === 0)
                }
              >
                {isLoading || isLoadingAddresses
                  ? t("cart.checking")
                  : t("cart.payWithPi")}
              </button>
            </aside>
          </section>
        )}
      </div>
    </main>
  );
};

export default CartPage;
