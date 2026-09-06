import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import type { StoreOutletContext } from "../components/StoreShell";
import { useCart } from "../context/CartContext";
import { usePayments } from "../hooks/usePayments";
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
          setCheckoutError("Nije moguće učitati adrese dostave.");
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
      setCheckoutError("Prijavi se kroz Pi Browser prije plaćanja korpe.");
      requireAuth();
      return;
    }

    if (items.length === 0) {
      return;
    }

    if (!selectedAddressId) {
      setNeedsAddress(true);
      setCheckoutError("Prije plaćanja dodajte adresu dostave.");
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
        name: item.product.name,
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
          setCheckoutError("Plaćanje je otkazano. Korpa je ostala nepromijenjena.");
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
            <h1>Korpa</h1>
            <p>{itemCount} artikala</p>
          </div>

          <Link className="back-link" to="/">
            Nastavi kupovinu
          </Link>
        </div>

        {completedOrder ? (
          <section className="cart-success">
            <strong>Narudžba je plaćena</strong>
            <p>
              Plaćanje je završeno za {completedOrder.itemCount} artikala u
              iznosu {formatPi(completedOrder.total)}.
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
              Nazad na shop
            </Link>
          </section>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <strong>Korpa je prazna</strong>
            <p>Dodaj proizvod iz shopa da pripremiš narudžbu.</p>
            <Link to="/">Nazad na shop</Link>
            <button className="cart-checkout-button" disabled>
              Plati sa Pi
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
                    <img src={item.product.images[0]} alt={item.product.name} />
                  </Link>

                  <div className="cart-item-info">
                    <Link to={`/product/${item.productId}`}>
                      {item.product.name}
                    </Link>
                    <span>{item.product.brand}</span>
                    <small>SKU: {item.product.sku}</small>
                  </div>

                  <div className="cart-quantity">
                    <label htmlFor={`cart-quantity-${item.productId}`}>
                      Količina
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

                  <div className="cart-price">{formatPi(item.product.price)}</div>
                  <div className="cart-line-total">
                    {formatPi(item.lineSubtotal)}
                  </div>

                  <button
                    className="cart-remove"
                    onClick={() => removeItem(item.productId)}
                  >
                    Ukloni
                  </button>
                </article>
              ))}
            </div>

            <aside className="cart-summary">
              <h2>Sažetak</h2>
              <div>
                <span>Subtotal</span>
                <strong>{formatPi(subtotal)}</strong>
              </div>
              <div>
                <span>Dostava</span>
                <strong>Obračun kasnije</strong>
              </div>
              <div className="cart-total">
                <span>Ukupno</span>
                <strong>{formatPi(subtotal)}</strong>
              </div>

              {!isAuthenticated && (
                <p className="cart-auth-notice">
                  Pi prijava je potrebna prije plaćanja.
                </p>
              )}

              {isAuthenticated && (
                <section className="cart-address-section">
                  <div>
                    <h3>Adresa dostave</h3>
                    <Link to="/account">Upravljaj adresama</Link>
                  </div>

                  {isLoadingAddresses ? (
                    <p>Učitavanje adresa...</p>
                  ) : addresses.length === 0 ? (
                    <div className="cart-address-empty">
                      <strong>Prije plaćanja dodajte adresu dostave.</strong>
                      <Link to="/account">Dodaj adresu</Link>
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
                              {address.label || "Adresa dostave"}
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
                  Unesi adresu dostave
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
                  ? "Provjera podataka..."
                  : "Plati sa Pi"}
              </button>
            </aside>
          </section>
        )}
      </div>
    </main>
  );
};

export default CartPage;
