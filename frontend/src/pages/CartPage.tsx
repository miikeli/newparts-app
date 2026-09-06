import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

const formatPi = (amount: number) => `${amount.toFixed(2)} Test-Pi`;

const CartPage = () => {
  const { items, itemCount, subtotal, removeItem, updateQuantity } = useCart();

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

        {items.length === 0 ? (
          <div className="empty-state">
            <strong>Korpa je prazna</strong>
            <p>Dodaj proizvod iz shopa da pripremiš narudžbu.</p>
            <Link to="/">Nazad na shop</Link>
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

              <button>Checkout coming next</button>
            </aside>
          </section>
        )}
      </div>
    </main>
  );
};

export default CartPage;
