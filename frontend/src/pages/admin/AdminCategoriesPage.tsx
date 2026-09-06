import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { axiosClient } from "../../lib/axiosClient";
import { getPiAuthConfig } from "../../lib/piAuth";
import type { AdminCategoriesResponse, AdminCategory } from "../../types/admin";

const AdminCategoriesPage = () => {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
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
      sortBy: "sortOrder",
    }),
    [page, search, status],
  );

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await axiosClient.get<AdminCategoriesResponse>(
        "/admin/categories",
        {
          ...getPiAuthConfig(),
          params: queryParams,
        },
      );

      setCategories(response.data.categories);
      setTotal(response.data.total);
      setTotalPages(response.data.totalPages);
    } catch {
      setError("Nije moguće učitati kategorije.");
    } finally {
      setIsLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const toggleActive = async (category: AdminCategory) => {
    setError("");

    try {
      await axiosClient.patch(
        `/admin/categories/${category.id}/toggle-active`,
        {},
        getPiAuthConfig(),
      );
      await loadCategories();
    } catch {
      setError("Status kategorije nije promijenjen.");
    }
  };

  const deleteCategory = async (category: AdminCategory) => {
    if (!window.confirm(`Obrisati kategoriju "${category.name}"?`)) {
      return;
    }

    setError("");

    try {
      await axiosClient.delete(
        `/admin/categories/${category.id}`,
        getPiAuthConfig(),
      );
      await loadCategories();
    } catch (err) {
      const responseData =
        typeof err === "object" && err !== null && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data
          : undefined;

      setError(responseData?.message ?? "Kategorija nije obrisana.");
    }
  };

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <p>Categories</p>
          <h1>Kategorije</h1>
        </div>
        <Link className="admin-primary-link" to="/admin/categories/new">
          New category
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
          <span>{total} kategorija</span>
          {isLoading && <strong>Učitavanje...</strong>}
        </div>
        <div className="admin-table-wrap">
          <table className="admin-products-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Parent</th>
                <th>Slug</th>
                <th>Product count</th>
                <th>Status</th>
                <th>Sort order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>{category.name}</td>
                  <td>{category.parentName || "Top level"}</td>
                  <td>{category.slug}</td>
                  <td>{category.productCount}</td>
                  <td>
                    <span className={category.active ? "status-active" : "status-inactive"}>
                      {category.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>{category.sortOrder}</td>
                  <td>
                    <div className="admin-row-actions">
                      <Link to={`/admin/categories/${category.id}`}>Edit</Link>
                      <button onClick={() => toggleActive(category)}>
                        {category.active ? "Disable" : "Enable"}
                      </button>
                      <button onClick={() => deleteCategory(category)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && categories.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="admin-empty-state">
                      <strong>Nema kategorija</strong>
                      <p>Promijeni filtere ili dodaj novu kategoriju.</p>
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

export default AdminCategoriesPage;
