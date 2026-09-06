import { useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import {
  findProductById,
  type VehicleSelection,
} from "../data/products";

const tabs = [
  "Description",
  "Specification",
  "Fitment",
  "Shipping info",
  "Warranty",
  "Return Policy",
] as const;

type ProductTab = (typeof tabs)[number];

type ProductDetailLocationState = {
  activeVehicle?: VehicleSelection | null;
};

const getVehicleLabel = (vehicle: VehicleSelection) =>
  `${vehicle.make} ${vehicle.model} ${vehicle.year} ${vehicle.submodel}`;

const getStockStatus = (stock: number) => {
  if (stock <= 0) {
    return {
      label: "Out of stock",
      className: "out-stock",
    };
  }

  if (stock <= 10) {
    return {
      label: `Low stock (${stock} left)`,
      className: "low-stock",
    };
  }

  return {
    label: `In stock (${stock})`,
    className: "in-stock",
  };
};

const ProductDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const product = id ? findProductById(id) : undefined;
  const activeVehicle = (location.state as ProductDetailLocationState | null)
    ?.activeVehicle;
  const { addItem } = useCart();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<ProductTab>("Description");
  const [addedMessage, setAddedMessage] = useState("");

  const stockStatus = useMemo(
    () => getStockStatus(product?.stock ?? 0),
    [product]
  );

  const activeVehicleFits = useMemo(() => {
    if (!product || !activeVehicle) {
      return false;
    }

    return product.fitments.some(
      (fitment) =>
        fitment.year === activeVehicle.year &&
        fitment.make === activeVehicle.make &&
        fitment.model === activeVehicle.model &&
        fitment.submodel === activeVehicle.submodel
    );
  }, [activeVehicle, product]);

  if (!product) {
    return (
      <main className="detail-page">
        <div className="shop-container">
          <div className="empty-state">
            <strong>Proizvod nije pronađen</strong>
            <p>Provjeri link ili se vrati na shop.</p>
            <Link to="/">Nazad na shop</Link>
          </div>
        </div>
      </main>
    );
  }

  const addToCart = () => {
    addItem(product.id, quantity);
    setAddedMessage("Dodano u korpu");
  };

  const decreaseQuantity = () => {
    setQuantity((currentQuantity) => Math.max(1, currentQuantity - 1));
  };

  const increaseQuantity = () => {
    setQuantity((currentQuantity) =>
      Math.min(product.stock, currentQuantity + 1)
    );
  };

  return (
    <main className="detail-page">
      <div className="shop-container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/">{product.category}</Link>
          <span>/</span>
          <strong>{product.name}</strong>
        </nav>

        <section className="product-detail-grid">
          <div className="product-gallery">
            <div className="product-thumbnails">
              {product.images.map((image, index) => (
                <button
                  key={image}
                  className={selectedImageIndex === index ? "active is-selected" : ""}
                  onClick={() => setSelectedImageIndex(index)}
                  aria-label={`Prikaži sliku ${index + 1}`}
                >
                  <img src={image} alt="" />
                </button>
              ))}
            </div>

            <div className="product-main-image">
              <img src={product.images[selectedImageIndex]} alt={product.name} />
            </div>
          </div>

          <aside className="product-detail-panel">
            <div className="product-meta-row">
              <div className="product-brand">{product.brand}</div>
              {product.fitments.length > 0 && (
                <span className="vehicle-specific-badge">Vehicle Specific</span>
              )}
            </div>

            <h1>{product.name}</h1>

            <div className="rating-row">
              <strong>4.8 / 5</strong>
              <span>Rating placeholder</span>
              <span>No reviews yet</span>
            </div>

            <div className="product-identifiers">
              <span>SKU: {product.sku}</span>
              <span>MPN: {product.mpn}</span>
            </div>

            <p className="product-detail-description">{product.description}</p>

            <div className="vehicle-fitment-notice">
              <strong>Provjeri da li dio odgovara tvom vozilu</strong>
              {activeVehicle ? (
                <p>
                  Aktivno vozilo: {getVehicleLabel(activeVehicle)}.{" "}
                  {activeVehicleFits
                    ? "Ovaj proizvod je označen kao kompatibilan."
                    : "Provjeri fitment tabelu prije narudžbe."}
                </p>
              ) : (
                <p>
                  Izaberi vozilo u shopu za bržu provjeru kompatibilnosti.
                </p>
              )}
            </div>

            <div className="purchase-panel">
              <div>
                <div className="price-label">Cijena</div>
                <div className="detail-price">
                  <strong>{product.price}</strong>
                  <span>Test-Pi</span>
                </div>
              </div>

              <div className="stock-row">
                <span className={stockStatus.className}>
                  {stockStatus.label}
                </span>
              </div>
            </div>

            <div className="quantity-row">
              <span>Količina</span>
              <div className="quantity-stepper">
                <button
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1 || product.stock <= 0}
                  aria-label="Smanji količinu"
                >
                  -
                </button>
                <strong>{quantity}</strong>
                <button
                  onClick={increaseQuantity}
                  disabled={quantity >= product.stock || product.stock <= 0}
                  aria-label="Povećaj količinu"
                >
                  +
                </button>
              </div>
            </div>

            <button
              className="add-to-cart"
              onClick={addToCart}
              disabled={product.stock <= 0}
            >
              Add to cart
            </button>

            {addedMessage && <p className="cart-feedback">{addedMessage}</p>}
          </aside>
        </section>

        <section className="product-tabs">
          <div className="tab-list">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={activeTab === tab ? "active" : ""}
                onClick={() => setActiveTab(tab)}
                aria-pressed={activeTab === tab}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="tab-panel">
            {activeTab === "Description" && (
              <div className="description-panel">
                <p>{product.description}</p>
                <p>
                  Demo katalog koristi lokalne podatke za ovu fazu. Prije
                  narudžbe provjeri fitment tabelu i osnovne specifikacije.
                </p>
              </div>
            )}

            {activeTab === "Specification" && (
              <dl className="spec-list">
                {product.specifications.map((spec) => (
                  <div key={spec.label}>
                    <dt>{spec.label}</dt>
                    <dd>{spec.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {activeTab === "Fitment" &&
              (product.fitments.length === 0 ? (
                <div className="empty-state compact-empty">
                  <strong>Nema fitment podataka</strong>
                  <p>Kompatibilnost će biti dodana u narednoj fazi kataloga.</p>
                </div>
              ) : (
                <div className="fitment-table-wrap">
                  <table className="fitment-table">
                    <thead>
                      <tr>
                        <th>Year</th>
                        <th>Make</th>
                        <th>Model</th>
                        <th>Submodel</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.fitments.map((fitment) => (
                        <tr
                          key={`${fitment.year}-${fitment.make}-${fitment.model}-${fitment.submodel}`}
                        >
                          <td data-label="Year">{fitment.year}</td>
                          <td data-label="Make">{fitment.make}</td>
                          <td data-label="Model">{fitment.model}</td>
                          <td data-label="Submodel">{fitment.submodel}</td>
                          <td data-label="Notes">{fitment.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

            {activeTab === "Shipping info" && <p>{product.shippingInfo}</p>}
            {activeTab === "Warranty" && <p>{product.warranty}</p>}
            {activeTab === "Return Policy" && <p>{product.returnPolicy}</p>}
          </div>
        </section>
      </div>
    </main>
  );
};

export default ProductDetailPage;
