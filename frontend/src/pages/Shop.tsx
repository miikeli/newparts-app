import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";

import ProductCard from "../components/ProductCard";

import {
  IRRA_TOKEN_CANONICAL,
  usePayments,
} from "../hooks/usePayments";
import type { StoreOutletContext } from "../components/StoreShell";
import {
  brands,
  categories,
  getLocalizedCategoryName,
  getLocalizedProductCategory,
  getLocalizedProductDescription,
  getLocalizedProductName,
  products,
  vehicleOptions,
  type Product,
  type VehicleSelection,
} from "../data/products";
import { useI18n } from "../i18n";

const uniqueValues = (values: string[]) => Array.from(new Set(values));

const getVehicleLabel = (vehicle: VehicleSelection) =>
  `${vehicle.make} ${vehicle.model} ${vehicle.year} ${vehicle.submodel}`;

const fitsVehicle = (product: Product, vehicle: VehicleSelection) =>
  product.fitments.some(
    (fitment) =>
      fitment.year === vehicle.year &&
      fitment.make === vehicle.make &&
      fitment.model === vehicle.model &&
      fitment.submodel === vehicle.submodel
  );

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

  const { orderProduct, isLoading } = usePayments({
    isAuthenticated,
    onRequireAuth: requireAuth,
  });

  useEffect(() => {
    document.title = t("app.storeTitle");
  }, [t]);

  const categoryTiles = useMemo(
    () => [
      { name: t("shop.categoryBrakePads"), icon: "🧱" },
      { name: t("shop.categoryRotors"), icon: "⚙️" },
      { name: t("shop.categoryFilters"), icon: "🧰" },
      { name: t("shop.categoryShocks"), icon: "🔩" },
      { name: t("shop.categoryBatteries"), icon: "🔋" },
      { name: t("shop.categorySparkPlugs"), icon: "⚡" },
    ],
    [t],
  );

  const availableYears = useMemo(
    () => uniqueValues(vehicleOptions.map((vehicle) => vehicle.year)),
    []
  );

  const availableMakes = useMemo(
    () =>
      uniqueValues(
        vehicleOptions
          .filter((vehicle) => vehicle.year === selectedYear)
          .map((vehicle) => vehicle.make)
      ),
    [selectedYear]
  );

  const availableModels = useMemo(
    () =>
      uniqueValues(
        vehicleOptions
          .filter(
            (vehicle) =>
              vehicle.year === selectedYear && vehicle.make === selectedMake
          )
          .map((vehicle) => vehicle.model)
      ),
    [selectedMake, selectedYear]
  );

  const availableSubmodels = useMemo(
    () =>
      uniqueValues(
        vehicleOptions
          .filter(
            (vehicle) =>
              vehicle.year === selectedYear &&
              vehicle.make === selectedMake &&
              vehicle.model === selectedModel
          )
          .map((vehicle) => vehicle.submodel)
      ),
    [selectedMake, selectedModel, selectedYear]
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

  const visibleProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const normalizedBrand = activeBrand?.toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        getLocalizedProductName(product, language).toLowerCase().includes(normalizedSearch) ||
        product.brand.toLowerCase().includes(normalizedSearch) ||
        getLocalizedProductDescription(product, language).toLowerCase().includes(normalizedSearch) ||
        getLocalizedProductCategory(product, language).toLowerCase().includes(normalizedSearch);

      const matchesCategory =
        activeCategory === null || product.categoryId === activeCategory;

      const matchesBrand =
        normalizedBrand === undefined ||
        product.brand.toLowerCase() === normalizedBrand;

      const matchesVehicle =
        activeVehicle === null || fitsVehicle(product, activeVehicle);

      return matchesSearch && matchesCategory && matchesBrand && matchesVehicle;
    });
  }, [activeBrand, activeCategory, activeVehicle, language, searchTerm]);

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
                <div className="category-tile" key={item.name}>
                  <div className="category-icon">{item.icon}</div>
                  <span>{item.name}</span>
                </div>
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
                  className={`brand-card ${activeBrand === brand ? "active" : ""}`}
                  key={brand}
                  onClick={() => setActiveBrand(brand)}
                  aria-pressed={activeBrand === brand}
                >
                  {brand}
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

            <div className="products-grid">
              {visibleProducts.map((product) => {
                const localizedName = getLocalizedProductName(product, language);

                return (
                  <ProductCard
                    key={product.id}
                    name={localizedName}
                    brand={product.brand}
                    category={getLocalizedProductCategory(product, language)}
                    description={getLocalizedProductDescription(product, language)}
                    price={product.price}
                    pictureURL={product.images[0]}
                    onOpenDetail={() =>
                      navigate(`/product/${product.id}`, {
                        state: { activeVehicle },
                      })
                    }
                    onClickBuyWithPi={() =>
                      orderProduct(
                        `Order ${localizedName}`,
                        product.price,
                        {
                          productId: product.id,
                        }
                      )
                    }
                    onClickBuyWithIrra={() =>
                      orderProduct(
                        `Order ${localizedName}`,
                        product.price,
                        {
                          productId: product.id,
                        },
                        IRRA_TOKEN_CANONICAL
                      )
                    }
                    disabled={isLoading}
                  />
                );
              })}

              {visibleProducts.length === 0 && (
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
