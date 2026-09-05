import { useMemo, useState } from "react";

import Header from "../components/Header";
import ProductCard from "../components/ProductCard";
import SignIn from "../components/SignIn";

import { useAuth } from "../hooks/useAuth";
import {
  IRRA_TOKEN_CANONICAL,
  usePayments,
} from "../hooks/usePayments";
import { axiosClient } from "../lib/axiosClient.ts";

type Product = {
  id: string;
  name: string;
  brand: string;
  description: string;
  category: string;
  price: number;
  pictureURL: string;
};

const products: Product[] = [
  {
    id: "brake_pads_1",
    name: "Prednje kočione pločice",
    brand: "Brembo",
    description: "Set prednjih pločica za VW Golf 7, Audi A3 i Seat Leon.",
    category: "Kočnice",
    price: 0.1,
    pictureURL:
      "https://placehold.co/700x520/F4F6F8/111827?text=Brake+Pads",
  },
  {
    id: "oil_filter_1",
    name: "Filter ulja",
    brand: "MANN-FILTER",
    description: "Kvalitetni filter ulja za veliki broj benzinskih i dizel motora.",
    category: "Filteri",
    price: 0.08,
    pictureURL:
      "https://placehold.co/700x520/F4F6F8/111827?text=Oil+Filter",
  },
  {
    id: "air_filter_1",
    name: "Filter vazduha",
    brand: "Bosch",
    description: "Filter motora sa visokim stepenom filtracije i dugim vijekom trajanja.",
    category: "Filteri",
    price: 0.09,
    pictureURL:
      "https://placehold.co/700x520/F4F6F8/111827?text=Air+Filter",
  },
  {
    id: "spark_plugs_1",
    name: "Set svjećica",
    brand: "NGK",
    description: "Set od 4 svjećice za stabilno paljenje i optimalan rad motora.",
    category: "Motor",
    price: 0.12,
    pictureURL:
      "https://placehold.co/700x520/F4F6F8/111827?text=Spark+Plugs",
  },
  {
    id: "shock_absorber_1",
    name: "Prednji amortizer",
    brand: "Sachs",
    description: "Gasni amortizer za stabilnost, kontrolu i udobnu vožnju.",
    category: "Ovjes",
    price: 0.18,
    pictureURL:
      "https://placehold.co/700x520/F4F6F8/111827?text=Shock+Absorber",
  },
  {
    id: "battery_1",
    name: "Akumulator 74Ah",
    brand: "Varta",
    description: "12V akumulator za pouzdano pokretanje vozila u svim vremenskim uslovima.",
    category: "Elektrika",
    price: 0.25,
    pictureURL:
      "https://placehold.co/700x520/F4F6F8/111827?text=Battery",
  },
];

const categories = [
  "Kočnice",
  "Paljenje",
  "Motor",
  "Ovjes",
  "Upravljanje",
  "Gorivo",
  "Hlađenje",
  "Elektrika",
  "Klima",
];

const categoryTiles = [
  { name: "Kočione pločice", icon: "🧱" },
  { name: "Diskovi", icon: "⚙️" },
  { name: "Filteri", icon: "🧰" },
  { name: "Amortizeri", icon: "🔩" },
  { name: "Akumulatori", icon: "🔋" },
  { name: "Svjećice", icon: "⚡" },
];

const brands = [
  "BOSCH",
  "BREMBO",
  "MANN-FILTER",
  "VARTA",
  "LIQUI MOLY",
  "DENSO",
  "NGK",
  "SACHS",
];

const Shop = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeBrand, setActiveBrand] = useState<string | null>(null);

  const {
    user,
    isAuthenticated,
    showSignIn,
    signIn,
    signOut,
    closeSignIn,
    requireAuth,
    isLoading: isAuthLoading,
  } = useAuth();

  const { orderProduct, isLoading } = usePayments({
    isAuthenticated,
    onRequireAuth: requireAuth,
  });

  const onSendTestNotification = () => {
    const notification = {
      title: "Newparts",
      body: "Test notification from Newparts",
      user_uid: user?.uid,
      subroute: "/shop",
    };

    axiosClient.post("/notifications/send", {
      notifications: [notification],
    });
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

      return matchesSearch && matchesCategory && matchesBrand;
    });
  }, [activeBrand, activeCategory, searchTerm]);

  const hasActiveFilters =
    searchTerm.trim().length > 0 || activeCategory !== null || activeBrand !== null;

  const resetFilters = () => {
    setSearchTerm("");
    setActiveCategory(null);
    setActiveBrand(null);
  };

  return (
    <div className="newparts-page">
      <Header
        user={user}
        onSignIn={signIn}
        onSignOut={signOut}
        onSendTestNotification={onSendTestNotification}
        isLoading={isAuthLoading}
      />

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
              <select defaultValue="">
                <option value="" disabled>
                  Godina
                </option>
                <option>2026</option>
                <option>2025</option>
                <option>2024</option>
              </select>

              <select defaultValue="">
                <option value="" disabled>
                  Marka
                </option>
                <option>Volkswagen</option>
                <option>Audi</option>
                <option>BMW</option>
              </select>

              <select defaultValue="">
                <option value="" disabled>
                  Model
                </option>
                <option>Golf</option>
                <option>A3</option>
                <option>320d</option>
              </select>

              <select defaultValue="">
                <option value="" disabled>
                  Podmodel
                </option>
                <option>Standard</option>
                <option>Sport</option>
              </select>

              <button className="vehicle-go">GO</button>
            </div>
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
                  pictureURL={product.pictureURL}
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
                    Probaj drugi naziv, kategoriju ili brend, ili resetuj filtere.
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

      {showSignIn && (
        <SignIn
          onSignIn={signIn}
          onModalClose={closeSignIn}
          disabled={isAuthLoading}
        />
      )}
    </div>
  );
};

export default Shop;
