import { useMemo, useState } from "react";
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
  products,
  vehicleOptions,
  type Product,
  type VehicleSelection,
} from "../data/products";

const categoryTiles = [
  { name: "Kočione pločice", icon: "🧱" },
  { name: "Diskovi", icon: "⚙️" },
  { name: "Filteri", icon: "🧰" },
  { name: "Amortizeri", icon: "🔩" },
  { name: "Akumulatori", icon: "🔋" },
  { name: "Svjećice", icon: "⚡" },
];

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
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.brand.toLowerCase().includes(normalizedSearch) ||
        product.description.toLowerCase().includes(normalizedSearch) ||
        product.category.toLowerCase().includes(normalizedSearch);

      const matchesCategory =
        activeCategory === null || product.category === activeCategory;

      const matchesBrand =
        normalizedBrand === undefined ||
        product.brand.toLowerCase() === normalizedBrand;

      const matchesVehicle =
        activeVehicle === null || fitsVehicle(product, activeVehicle);

      return matchesSearch && matchesCategory && matchesBrand && matchesVehicle;
    });
  }, [activeBrand, activeCategory, activeVehicle, searchTerm]);

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
              placeholder="Pretraži dijelove, OEM broj, brend..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </section>

        <section className="vehicle-section">
          <div className="shop-container">
            <div className="vehicle-topline">
              <strong>IZABERI VOZILO</strong>
              <span>Pronađi po VIN-u</span>
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
                  Godina
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
                  Marka
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
                  Model
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
                  Podmodel
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
                GO
              </button>
            </div>

            {activeVehicle && (
              <div className="active-vehicle">
                <span>{getVehicleLabel(activeVehicle)}</span>
                <button onClick={clearVehicleFilter}>Ukloni vozilo</button>
              </div>
            )}
          </div>
        </section>

        <section className="category-strip">
          <div className="shop-container">
            <div className="category-list">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`category-tab ${
                    activeCategory === category ? "active" : ""
                  }`}
                  onClick={() => setActiveCategory(category)}
                  aria-pressed={activeCategory === category}
                >
                  {category}
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
                <h2>Shop by Brand</h2>
                <p>Popularni proizvođači auto djelova.</p>
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
                <h2>Izdvojeni proizvodi</h2>
                <p>{visibleProducts.length} proizvoda</p>
              </div>

              {hasActiveFilters && (
                <button className="reset-filters" onClick={resetFilters}>
                  Resetuj filtere
                </button>
              )}
            </div>

            <div className="products-grid">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  name={product.name}
                  brand={product.brand}
                  category={product.category}
                  description={product.description}
                  price={product.price}
                  pictureURL={product.images[0]}
                  onOpenDetail={() =>
                    navigate(`/product/${product.id}`, {
                      state: { activeVehicle },
                    })
                  }
                  onClickBuyWithPi={() =>
                    orderProduct(
                      `Order ${product.name}`,
                      product.price,
                      {
                        productId: product.id,
                      }
                    )
                  }
                  onClickBuyWithIrra={() =>
                    orderProduct(
                      `Order ${product.name}`,
                      product.price,
                      {
                        productId: product.id,
                      },
                      IRRA_TOKEN_CANONICAL
                    )
                  }
                  disabled={isLoading}
                />
              ))}

              {visibleProducts.length === 0 && (
                <div className="empty-state">
                  <strong>Nema pronađenih proizvoda</strong>
                  <p>
                    {activeVehicle
                      ? `Nema kompatibilnih proizvoda za ${getVehicleLabel(activeVehicle)} uz trenutno aktivne filtere.`
                      : "Probaj drugi naziv, kategoriju ili brend, ili resetuj filtere."}
                  </p>
                  <button onClick={resetFilters}>Resetuj filtere</button>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="why-section">
          <div className="shop-container">
            <div className="why-card">
              <h2>Zašto Newparts?</h2>

              <div className="why-grid">
                <div>
                  <span>🚚</span>
                  <strong>Brza dostava</strong>
                  <p>Pouzdan servis i brza obrada narudžbi.</p>
                </div>

                <div>
                  <span>🔧</span>
                  <strong>Pravi dio za tvoje vozilo</strong>
                  <p>Pretraga po vozilu, modelu i kategoriji.</p>
                </div>

                <div>
                  <span>💬</span>
                  <strong>Podrška</strong>
                  <p>Pomoć pri izboru odgovarajućeg dijela.</p>
                </div>

                <div>
                  <span>π</span>
                  <strong>Pi plaćanje</strong>
                  <p>Direktno plaćanje kroz Pi ekosistem.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
    </main>
  );
};

export default Shop;
