import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import {
  findProductById,
  type VehicleSelection,
} from "../data/products";
import { useI18n } from "../i18n";

const tabs = [
  "description",
  "specification",
  "fitment",
  "shipping",
  "warranty",
  "returns",
] as const;

type ProductTab = (typeof tabs)[number];

type ProductDetailLocationState = {
  activeVehicle?: VehicleSelection | null;
};

const getVehicleLabel = (vehicle: VehicleSelection) =>
  `${vehicle.make} ${vehicle.model} ${vehicle.year} ${vehicle.submodel}`;

const getStockStatus = (stock: number, t: ReturnType<typeof useI18n>["t"]) => {
  if (stock <= 0) {
    return {
      label: t("product.outOfStock"),
      className: "out-stock",
    };
  }

  if (stock <= 10) {
    return {
      label: t("product.lowStock", { stock }),
      className: "low-stock",
    };
  }

  return {
    label: t("product.inStock", { stock }),
    className: "in-stock",
  };
};

const ProductDetailPage = () => {
  const { t } = useI18n();
  const { id } = useParams();
  const location = useLocation();
  const product = id ? findProductById(id) : undefined;
  const activeVehicle = (location.state as ProductDetailLocationState | null)
    ?.activeVehicle;
  const { addItem } = useCart();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<ProductTab>("description");
  const [addedMessage, setAddedMessage] = useState("");

  const stockStatus = useMemo(
    () => getStockStatus(product?.stock ?? 0, t),
    [product, t]
  );

  useEffect(() => {
    document.title = product
      ? `${product.name} | NewParts`
      : t("app.storeTitle");
  }, [product, t]);

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
            <strong>{t("product.notFound")}</strong>
            <p>{t("product.notFoundHint")}</p>
            <Link to="/">{t("common.backToShop")}</Link>
          </div>
        </div>
      </main>
    );
  }

  const addToCart = () => {
    addItem(product.id, quantity);
    setAddedMessage(t("product.addedToCart"));
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
          <Link to="/">{t("product.home")}</Link>
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
                  aria-label={`${t("product.showImage")} ${index + 1}`}
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
                <span className="vehicle-specific-badge">
                  {t("product.vehicleSpecific")}
                </span>
              )}
            </div>

            <h1>{product.name}</h1>

            <div className="rating-row">
              <strong>4.8 / 5</strong>
              <span>{t("product.ratingPlaceholder")}</span>
              <span>{t("product.noReviews")}</span>
            </div>

            <div className="product-identifiers">
              <span>SKU: {product.sku}</span>
              <span>MPN: {product.mpn}</span>
            </div>

            <p className="product-detail-description">{product.description}</p>

            <div className="vehicle-fitment-notice">
              <strong>{t("product.checkFitment")}</strong>
              {activeVehicle ? (
                <p>
                  {t("product.activeVehicle")}: {getVehicleLabel(activeVehicle)}.{" "}
                  {activeVehicleFits
                    ? t("product.compatible")
                    : t("product.checkFitmentTable")}
                </p>
              ) : (
                <p>
                  {t("product.selectVehicleHint")}
                </p>
              )}
            </div>

            <div className="purchase-panel">
              <div>
                <div className="price-label">{t("common.price")}</div>
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
              <span>{t("common.quantity")}</span>
              <div className="quantity-stepper">
                <button
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1 || product.stock <= 0}
                  aria-label={t("product.quantityDecrease")}
                >
                  -
                </button>
                <strong>{quantity}</strong>
                <button
                  onClick={increaseQuantity}
                  disabled={quantity >= product.stock || product.stock <= 0}
                  aria-label={t("product.quantityIncrease")}
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
              {t("product.addToCart")}
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
                {t(
                  tab === "description"
                    ? "product.tabDescription"
                    : tab === "specification"
                      ? "product.tabSpecification"
                      : tab === "fitment"
                        ? "product.tabFitment"
                        : tab === "shipping"
                          ? "product.tabShipping"
                          : tab === "warranty"
                            ? "product.tabWarranty"
                            : "product.tabReturns",
                )}
              </button>
            ))}
          </div>

          <div className="tab-panel">
            {activeTab === "description" && (
              <div className="description-panel">
                <p>{product.description}</p>
                <p>{t("product.demoNotice")}</p>
              </div>
            )}

            {activeTab === "specification" && (
              <dl className="spec-list">
                {product.specifications.map((spec) => (
                  <div key={spec.label}>
                    <dt>{spec.label}</dt>
                    <dd>{spec.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {activeTab === "fitment" &&
              (product.fitments.length === 0 ? (
                <div className="empty-state compact-empty">
                  <strong>{t("product.noFitment")}</strong>
                  <p>{t("product.noFitmentHint")}</p>
                </div>
              ) : (
                <div className="fitment-table-wrap">
                  <table className="fitment-table">
                    <thead>
                      <tr>
                        <th>{t("product.fitmentYear")}</th>
                        <th>{t("product.fitmentMake")}</th>
                        <th>{t("product.fitmentModel")}</th>
                        <th>{t("product.fitmentSubmodel")}</th>
                        <th>{t("product.fitmentNotes")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.fitments.map((fitment) => (
                        <tr
                          key={`${fitment.year}-${fitment.make}-${fitment.model}-${fitment.submodel}`}
                        >
                          <td data-label={t("product.fitmentYear")}>{fitment.year}</td>
                          <td data-label={t("product.fitmentMake")}>{fitment.make}</td>
                          <td data-label={t("product.fitmentModel")}>{fitment.model}</td>
                          <td data-label={t("product.fitmentSubmodel")}>{fitment.submodel}</td>
                          <td data-label={t("product.fitmentNotes")}>{fitment.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

            {activeTab === "shipping" && <p>{product.shippingInfo}</p>}
            {activeTab === "warranty" && <p>{product.warranty}</p>}
            {activeTab === "returns" && <p>{product.returnPolicy}</p>}
          </div>
        </section>
      </div>
    </main>
  );
};

export default ProductDetailPage;
