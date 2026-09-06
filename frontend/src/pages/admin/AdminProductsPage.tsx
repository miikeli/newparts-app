import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { axiosClient } from "../../lib/axiosClient";
import { getPiAuthConfig } from "../../lib/piAuth";
import type { AdminProduct, AdminProductsResponse } from "../../types/admin";

const formatPi = (amount: number) => `${amount.toFixed(2)} Pi`;

const getStockStatus = (stock: number) => {
  if (stock <= 0) {
    return "Out";
  }

  if (stock <= 10) {
    return "Low";
  }

  return "In stock";
};

const AdminProductsPage = () => {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [stockStatus, setStockStatus] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "pricePi" | "stock">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const queryParams = useMemo(
    () => ({
      page,
      pageSize: 10,
      search,
      category,
      brand,
      stockStatus,
      status,
      sortBy,
      sortDir,
    }),
    [brand, category, page, search, sortBy, sortDir, status, stockStatus],
  );

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await axiosClient.get<AdminProductsResponse>(
        "/admin/products",
        {
          ...getPiAuthConfig(),
          params: queryParams,
        },
      );

      setProducts(response.data.products);
      setCategories(response.data.categories);
      setBrands(response.data.brands);
      setTotal(response.data.total);
      setTotalPages(response.data.totalPages);
    } catch {
      setError("Nije moguće učitati proizvode.");
    } finally {
      setIsLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const resetFilters = () => {
    setSearch("");
    setCategory("");
    setBrand("");
    setStockStatus("");
    setStatus("");
    setSortBy("name");
    setSortDir("asc");
    setPage(1);
  };

  const toggleActive = async (product: AdminProduct) => {
    setError("");

    try {
      await axiosClient.patch(
        `/admin/products/${product.id}/toggle-active`,
        {},
        getPiAuthConfig(),
      );
      await loadProducts();
    } catch {
      setError("Status proizvoda nije promijenjen.");
    }
  };

  const deleteProduct = async (product: AdminProduct) => {
    if (!window.confirm(`Obrisati proizvod "${product.name}"?`)) {
      return;
    }

    setError("");

    try {
      await axiosClient.delete(
        `/admin/products/${product.id}`,
        getPiAuthConfig(),
      );
      await loadProducts();
    } catch {
      setError("Proizvod nije obrisan.");
    }
  };

  const updateSort = (field: "name" | "pricePi" | "stock") => {
    if (sortBy === field) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortBy(field);
    setSortDir("asc");
  };

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <p>Products</p>
          <h1>Katalog proizvoda</h1>
        </div>
        <Link className="admin-primary-link" to="/admin/products/new">
          New product
        </Link>
      </div>

      <div className="admin-filter-bar">
        <label>
          Search
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="SKU, name, brand, MPN"
          />
        </label>
        <label>
          Category
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label>
          Brand
          <select
            value={brand}
            onChange={(event) => {
              setBrand(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All brands</option>
            {brands.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label>
          Stock
          <select
            value={stockStatus}
            onChange={(event) => {
              setStockStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All stock</option>
            <option value="in">In stock</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </select>
        </label>
        <label>
          Status
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <button onClick={resetFilters}>Reset</button>
      </div>

      {error && <p className="admin-message error">{error}</p>}

      <div className="admin-table-card">
        <div className="admin-table-meta">
          <span>{total} proizvoda</span>
          {isLoading && <strong>Učitavanje...</strong>}
        </div>
        <div className="admin-table-wrap">
          <table className="admin-products-table">
            <thead>
              <tr>
                <th>
                  <input type="checkbox" aria-label="Select all products" />
                </th>
                <th>Thumbnail</th>
                <th>SKU</th>
                <th>
                  <button onClick={() => updateSort("name")}>Name</button>
                </th>
                <th>Category</th>
                <th>Brand</th>
                <th>
                  <button onClick={() => updateSort("pricePi")}>Price</button>
                </th>
                <th>
                  <button onClick={() => updateSort("stock")}>Stock</button>
                </th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <input aria-label={`Select ${product.name}`} type="checkbox" />
                  </td>
                  <td>
                    <div className="admin-product-thumb">
                      {product.images[0] ? (
                        <img src={product.images[0]} alt={product.name} />
                      ) : (
                        <span>NP</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <strong>{product.sku}</strong>
                    <small>{product.mpn}</small>
                  </td>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>{product.brand}</td>
                  <td>{formatPi(product.pricePi)}</td>
                  <td>
                    <strong>{product.stock}</strong>
                    <small>{getStockStatus(product.stock)}</small>
                  </td>
                  <td>
                    <span className={product.active ? "status-active" : "status-inactive"}>
                      {product.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <Link to={`/admin/products/${product.id}`}>Edit</Link>
                      <button onClick={() => toggleActive(product)}>
                        {product.active ? "Disable" : "Enable"}
                      </button>
                      <button onClick={() => deleteProduct(product)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && products.length === 0 && (
                <tr>
                  <td colSpan={10}>
                    <div className="admin-empty-state">
                      <strong>Nema proizvoda</strong>
                      <p>Promijeni filtere ili dodaj novi proizvod.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="admin-pagination">
          <button
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1}
          >
            Previous
          </button>
          <span>
            Page {page} / {totalPages}
          </span>
          <button
            onClick={() =>
              setPage((current) => Math.min(totalPages, current + 1))
            }
            disabled={page >= totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
};

export default AdminProductsPage;
