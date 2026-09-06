import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { axiosClient } from "../../lib/axiosClient";
import { getPiAuthConfig } from "../../lib/piAuth";
import type { AdminBrand, AdminBrandsResponse } from "../../types/admin";

const AdminBrandsPage = () => {
  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const queryParams = useMemo(
    () => ({
      page,
      pageSize: 10,
      search,
      status,
      sortBy: "name",
    }),
    [page, search, status],
  );

  const loadBrands = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await axiosClient.get<AdminBrandsResponse>(
        "/admin/brands",
        {
          ...getPiAuthConfig(),
          params: queryParams,
        },
      );

      setBrands(response.data.brands);
      setTotal(response.data.total);
      setTotalPages(response.data.totalPages);
    } catch {
      setError("Nije moguće učitati brendove.");
    } finally {
      setIsLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  const toggleActive = async (brand: AdminBrand) => {
    setError("");

    try {
      await axiosClient.patch(
        `/admin/brands/${brand.id}/toggle-active`,
        {},
        getPiAuthConfig(),
      );
      await loadBrands();
    } catch {
      setError("Status brenda nije promijenjen.");
    }
  };

  const deleteBrand = async (brand: AdminBrand) => {
    if (!window.confirm(`Obrisati brend "${brand.name}"?`)) {
      return;
    }

    setError("");

    try {
      await axiosClient.delete(`/admin/brands/${brand.id}`, getPiAuthConfig());
      await loadBrands();
    } catch (err) {
      const responseData =
        typeof err === "object" && err !== null && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data
          : undefined;

      setError(responseData?.message ?? "Brend nije obrisan.");
    }
  };

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <p>Brands</p>
          <h1>Brendovi</h1>
        </div>
        <Link className="admin-primary-link" to="/admin/brands/new">
          New brand
        </Link>
      </div>

      <div className="admin-filter-bar admin-filter-bar-compact">
        <label>
          Search
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Name or slug"
          />
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
        <button
          onClick={() => {
            setSearch("");
            setStatus("");
            setPage(1);
          }}
        >
          Reset
        </button>
      </div>

      {error && <p className="admin-message error">{error}</p>}

      <div className="admin-table-card">
        <div className="admin-table-meta">
          <span>{total} brendova</span>
          {isLoading && <strong>Učitavanje...</strong>}
        </div>
        <div className="admin-table-wrap">
          <table className="admin-products-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Product count</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((brand) => (
                <tr key={brand.id}>
                  <td>{brand.name}</td>
                  <td>{brand.slug}</td>
                  <td>{brand.productCount}</td>
                  <td>
                    <span className={brand.active ? "status-active" : "status-inactive"}>
                      {brand.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <Link to={`/admin/brands/${brand.id}`}>Edit</Link>
                      <button onClick={() => toggleActive(brand)}>
                        {brand.active ? "Disable" : "Enable"}
                      </button>
                      <button onClick={() => deleteBrand(brand)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && brands.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="admin-empty-state">
                      <strong>Nema brendova</strong>
                      <p>Promijeni filtere ili dodaj novi brend.</p>
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

export default AdminBrandsPage;
