import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";

import ProductCard from "../components/ProductCard";
import type { StoreOutletContext } from "../components/StoreShell";
import {
  IRRA_TOKEN_CANONICAL,
  usePayments,
} from "../hooks/usePayments";
import { useI18n } from "../i18n";
import {
  fetchProducts,
  getLocalizedCategoryName,
  getLocalizedProductCategory,
  getLocalizedProductDescription,
  getLocalizedProductName,
  type CatalogBrand,
  type CatalogCategory,
  type CatalogProduct,
  type CatalogProductFitment,
  type VehicleSelection,
} from "../services/catalog";

const uniqueValues = (values: string[]) => Array.from(new Set(values));

const categoryIcons: { [categoryId: string]: string } = {
  "brake-pads": "🧱",
  "brake-rotors": "⚙️",
  filters: "🧰",
  ignition: "⚡",
  suspension: "🔩",
  electrical: "🔋",
};

const getVehicleLabel = (vehicle: VehicleSelection) =>
  `${vehicle.make} ${vehicle.model} ${vehicle.year} ${vehicle.submodel}`;

const fitsVehicle = (product: CatalogProduct, vehicle: VehicleSelection) =>
  product.fitments.some(
    (fitment) =>
      fitment.year === vehicle.year &&
      fitment.make === vehicle.make &&
      fitment.model === vehicle.model &&
      fitment.submodel === vehicle.submodel,
  );

const collectVehicleOptions = (products: CatalogProduct[]) => {
  const byKey = new Map<string, CatalogProductFitment>();

  products.forEach((product) => {
    product.fitments.forEach((fitment) => {
      byKey.set(
        `${fitment.year}-${fitment.make}-${fitment.model}-${fitment.submodel}`,
        fitment,
      );
    });
  });

  return Array.from(byKey.values());
};

const Shop = () => {
  const { language, t } = useI18n();
  const navigate = useNavigate();
  const { isAuthenticated, requireAuth } = useOutletContext<StoreOutletContext>();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeBrand, setActiveBrand] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMake, setSelectedMake] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedSubmodel, setSelectedSubmodel] = useState("");
  const [activeVehicle, setActiveVehicle] = useState<VehicleSelection | null>(null);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [allProducts, setAllProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [brands, setBrands] = useState<CatalogBrand[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [catalogError, setCatalogError] = useState(false);

  const { orderProduct, isLoading } = usePayments({
    isAuthenticated,
    onRequireAuth: requireAuth,
  });

  useEffect(() => {
    document.title = t("app.storeTitle");
  }, [t]);

  useEffect(() => {
    let isMounted = true;

    const loadCatalogMetadata = async () => {
      try {
        const response = await fetchProducts({ limit: 100, sort: "name" });

        if (!isMounted) {
          return;
        }

        setAllProducts(response.products);
        setCategories(response.categories);
        setBrands(response.brands);
      } catch {
        if (isMounted) {
          setCatalogError(true);
        }
      }
    };

    loadCatalogMetadata();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      setIsLoadingProducts(true);
      setCatalogError(false);

      try {
        const response = await fetchProducts({
          q: searchTerm.trim() || undefined,
          categoryId: activeCategory ?? undefined,
          brandId: activeBrand ?? undefined,
          limit: 100,
          sort: "name",
        });

        if (!isMounted) {
          return;
        }

        setProducts(response.products);
        setCategories((currentCategories) =>
          currentCategories.length > 0 ? currentCategories : response.categories,
        );
        setBrands((currentBrands) =>
          currentBrands.length > 0 ? currentBrands : response.brands,
        );
      } catch {
        if (isMounted) {
          setProducts([]);
          setCatalogError(true);
        }
      } finally {
        if (isMounted) {
          setIsLoadingProducts(false);
        }
      }
    };

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [activeBrand, activeCategory, searchTerm]);

  const vehicleOptions = useMemo(
    () => collectVehicleOptions(allProducts.length > 0 ? allProducts : products),
    [allProducts, products],
  );

  const categoryTiles = useMemo(
    () =>
      categories.slice(0, 6).map((category) => ({
        id: category.id,
        name: getLocalizedCategoryName(category, language),
        icon: categoryIcons[category.id] ?? "🔧",
      })),
    [categories, language],
  );

  const availableYears = useMemo(
    () => uniqueValues(vehicleOptions.map((vehicle) => vehicle.year)),
    [vehicleOptions],
  );

  const availableMakes = useMemo(
    () =>
      uniqueValues(
        vehicleOptions
          .filter((vehicle) => vehicle.year === selectedYear)
          .map((vehicle) => vehicle.make),
      ),
    [selectedYear, vehicleOptions],
  );

  const availableModels = useMemo(
    () =>
      uniqueValues(
        vehicleOptions
          .filter(
            (vehicle) =>
              vehicle.year === selectedYear && vehicle.make === selectedMake,
          )
          .map((vehicle) => vehicle.model),
      ),
    [selectedMake, selectedYear, vehicleOptions],
  );

  const availableSubmodels = useMemo(
    () =>
      uniqueValues(
        vehicleOptions
          .filter(
            (vehicle) =>
              vehicle.year === selectedYear &&
              vehicle.make === selectedMake &&
              vehicle.model === selectedModel,
          )
          .map((vehicle) => vehicle.submodel),
      ),
    [selectedMake, selectedModel, selectedYear, vehicleOptions],
  );

  const canApplyVehicle =
    selectedYear !== "" &&
    selectedMake !== "" &&
    selectedModel !== "" &&
    selectedSubmodel !== "";

  const applyVehicleFilter = () => {
    if (!canApplyVehicle) {
      return;
    }

    setActiveVehicle({
      year: selectedYear,
      make: selectedMake,
      model: selectedModel,
      submodel: selectedSubmodel,
    });
  };

  const clearVehicleFilter = () => {
    setSelectedYear("");
    setSelectedMake("");
    setSelectedModel("");
    setSelectedSubmodel("");
    setActiveVehicle(null);
  };

  const visibleProducts = useMemo(
    () =>
      activeVehicle === null
        ? products
        : products.filter((product) => fitsVehicle(product, activeVehicle)),
    [activeVehicle, products],
  );

  const hasActiveFilters =
    searchTerm.trim().length > 0 ||
    activeCategory !== null ||
    activeBrand !== null ||
    activeVehicle !== null;

  const resetFilters = () => {
    setSearchTerm("");
    setActiveCategory(null);
    setActiveBrand(null);
    clearVehicleFilter();
  };

  return (
    <main>
      <section className="top-search-wrap">
        <div className="top-search">
          <span className="search-icon">⌕</span>
          <input
            type="search"
            placeholder={t("shop.searchPlaceholder")}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </section>

      <section className="vehicle-section">
        <div className="shop-container">
          <div className="vehicle-topline">
            <strong>{t("shop.vehicleTitle")}</strong>
            <span>{t("shop.findByVin")}</span>
          </div>

          <div className="vehicle-grid">
            <select
              value={selectedYear}
              onChange={(event) => {
                setSelectedYear(event.target.value);
                setSelectedMake("");
                setSelectedModel("");
                setSelectedSubmodel("");
              }}
            >
              <option value="" disabled>
                {t("shop.year")}
              </option>
              {availableYears.map((year) => (
                <option key={year}>{year}</option>
              ))}
            </select>

            <select
              value={selectedMake}
              onChange={(event) => {
                setSelectedMake(event.target.value);
                setSelectedModel("");
                setSelectedSubmodel("");
              }}
              disabled={selectedYear === ""}
            >
              <option value="" disabled>
                {t("shop.make")}
              </option>
              {availableMakes.map((make) => (
                <option key={make}>{make}</option>
              ))}
            </select>

            <select
              value={selectedModel}
              onChange={(event) => {
                setSelectedModel(event.target.value);
                setSelectedSubmodel("");
              }}
              disabled={selectedMake === ""}
            >
              <option value="" disabled>
                {t("shop.model")}
              </option>
              {availableModels.map((model) => (
                <option key={model}>{model}</option>
              ))}
            </select>

            <select
              value={selectedSubmodel}
              onChange={(event) => setSelectedSubmodel(event.target.value)}
              disabled={selectedModel === ""}
            >
              <option value="" disabled>
                {t("shop.submodel")}
              </option>
              {availableSubmodels.map((submodel) => (
                <option key={submodel}>{submodel}</option>
              ))}
            </select>

            <button
              className="vehicle-go"
              onClick={applyVehicleFilter}
              disabled={!canApplyVehicle}
            >
              {t("shop.go")}
            </button>
          </div>

          {activeVehicle && (
            <div className="active-vehicle">
              <span>{getVehicleLabel(activeVehicle)}</span>
              <button onClick={clearVehicleFilter}>{t("shop.removeVehicle")}</button>
            </div>
          )}
        </div>
      </section>

      <section className="category-strip">
        <div className="shop-container">
          <div className="category-list">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`category-tab ${
                  activeCategory === category.id ? "active" : ""
                }`}
                onClick={() => setActiveCategory(category.id)}
                aria-pressed={activeCategory === category.id}
              >
                {getLocalizedCategoryName(category, language)}
              </button>
            ))}
          </div>

          <div className="category-tiles">
            {categoryTiles.map((item) => (
              <button
                className={`category-tile ${
                  activeCategory === item.id ? "active" : ""
                }`}
                key={item.id}
                onClick={() => setActiveCategory(item.id)}
                aria-pressed={activeCategory === item.id}
              >
                <div className="category-icon">{item.icon}</div>
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="brands-section">
        <div className="shop-container">
          <div className="section-header">
            <div>
              <h2>{t("shop.shopByBrand")}</h2>
              <p>{t("shop.brandSubtitle")}</p>
            </div>
          </div>

          <div className="brand-row">
            {brands.map((brand) => (
              <button
                className={`brand-card ${activeBrand === brand.id ? "active" : ""}`}
                key={brand.id}
                onClick={() => setActiveBrand(brand.id)}
                aria-pressed={activeBrand === brand.id}
              >
                {brand.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="products-section">
        <div className="shop-container">
          <div className="section-header">
            <div>
              <h2>{t("shop.featuredProducts")}</h2>
              <p>
                {visibleProducts.length} {t("shop.productsCount")}
              </p>
            </div>

            {hasActiveFilters && (
              <button className="reset-filters" onClick={resetFilters}>
                {t("shop.resetFilters")}
              </button>
            )}
          </div>

          {catalogError && <p className="cart-message error">{t("shop.loadError")}</p>}

          <div className="products-grid">
            {isLoadingProducts && (
              <div className="empty-state">
                <strong>{t("common.loading")}</strong>
                <p>{t("cart.checking")}</p>
              </div>
            )}

            {!isLoadingProducts &&
              visibleProducts.map((product) => {
                const localizedName = getLocalizedProductName(product, language);

                return (
                  <ProductCard
                    key={product.id}
                    name={localizedName}
                    brand={product.brand}
                    category={getLocalizedProductCategory(product, language)}
                    description={getLocalizedProductDescription(product, language)}
                    price={product.pricePi}
                    pictureURL={product.images[0] ?? ""}
                    onOpenDetail={() =>
                      navigate(`/product/${product.id}`, {
                        state: { activeVehicle },
                      })
                    }
                    onClickBuyWithPi={() =>
                      orderProduct(
                        `Order ${localizedName}`,
                        product.pricePi,
                        {
                          productId: product.id,
                        },
                      )
                    }
                    onClickBuyWithIrra={() =>
                      orderProduct(
                        `Order ${localizedName}`,
                        product.pricePi,
                        {
                          productId: product.id,
                        },
                        IRRA_TOKEN_CANONICAL,
                      )
                    }
                    disabled={isLoading}
                  />
                );
              })}

            {!isLoadingProducts && visibleProducts.length === 0 && (
              <div className="empty-state">
                <strong>{t("shop.noProducts")}</strong>
                <p>
                  {activeVehicle
                    ? t("shop.noVehicleProducts", {
                        vehicle: getVehicleLabel(activeVehicle),
                      })
                    : t("shop.noProductsHint")}
                </p>
                <button onClick={resetFilters}>{t("shop.resetFilters")}</button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="why-section">
        <div className="shop-container">
          <div className="why-card">
            <h2>{t("shop.whyTitle")}</h2>

            <div className="why-grid">
              <div>
                <span>🚚</span>
                <strong>{t("shop.fastDelivery")}</strong>
                <p>{t("shop.fastDeliveryText")}</p>
              </div>

              <div>
                <span>🔧</span>
                <strong>{t("shop.vehicleFitTitle")}</strong>
                <p>{t("shop.vehicleFitText")}</p>
              </div>

              <div>
                <span>💬</span>
                <strong>{t("shop.supportTitle")}</strong>
                <p>{t("shop.supportText")}</p>
              </div>

              <div>
                <span>π</span>
                <strong>{t("shop.piPaymentTitle")}</strong>
                <p>{t("shop.piPaymentText")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Shop;
