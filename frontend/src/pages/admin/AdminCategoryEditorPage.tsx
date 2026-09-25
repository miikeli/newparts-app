import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { axiosClient } from "../../lib/axiosClient";
import { getPiAuthConfig } from "../../lib/piAuth";
import type {
  AdminCategoriesResponse,
  AdminCategory,
  AdminCategoryResponse,
} from "../../types/admin";

type CategoryForm = {
  id?: string;
  name: string;
  nameMe: string;
  nameEn: string;
  slug: string;
  parentId: string;
  active: boolean;
  sortOrder: string;
  description: string;
  image: string;
};

const emptyCategoryForm: CategoryForm = {
  name: "",
  nameMe: "",
  nameEn: "",
  slug: "",
  parentId: "",
  active: true,
  sortOrder: "0",
  description: "",
  image: "",
};

const categoryToForm = (category: AdminCategory): CategoryForm => ({
  id: category.id,
  name: category.name,
  nameMe: category.nameMe ?? category.name,
  nameEn: category.nameEn ?? category.name,
  slug: category.slug,
  parentId: category.parentId ?? "",
  active: category.active,
  sortOrder: String(category.sortOrder),
  description: category.description,
  image: category.image,
});

const buildCategoryLabel = (
  category: AdminCategory,
  categoriesById: { [id: string]: AdminCategory },
) => {
  const names = [category.name];
  let parentId = category.parentId;

  for (let depth = 0; depth < 20 && parentId; depth += 1) {
    const parent = categoriesById[parentId];

    if (!parent) {
      break;
    }

    names.unshift(parent.name);
    parentId = parent.parentId;
  }

  return names.join(" > ");
};

const AdminCategoryEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNewCategory = !id;
  const [form, setForm] = useState<CategoryForm>(emptyCategoryForm);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const categoriesById = useMemo(() => {
    const result: { [id: string]: AdminCategory } = {};

    categories.forEach((category) => {
      result[category.id] = category;
    });

    return result;
  }, [categories]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [categoriesResponse, categoryResponse] = await Promise.all([
          axiosClient.get<AdminCategoriesResponse>("/admin/categories", {
            ...getPiAuthConfig(),
            params: { pageSize: 100, sortBy: "sortOrder" },
          }),
          isNewCategory || !id
            ? Promise.resolve(null)
            : axiosClient.get<AdminCategoryResponse>(
                `/admin/categories/${id}`,
                getPiAuthConfig(),
              ),
        ]);

        if (!isMounted) {
          return;
        }

        setCategories(categoriesResponse.data.categories);

        if (categoryResponse) {
          setForm(categoryToForm(categoryResponse.data.category));
        } else {
          setForm(emptyCategoryForm);
        }
      } catch {
        if (isMounted) {
          setError("Nije moguće učitati kategoriju.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [id, isNewCategory]);

  const updateField = <K extends keyof CategoryForm>(
    field: K,
    value: CategoryForm[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const saveCategory = async () => {
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        id: form.id,
        name: form.nameEn || form.nameMe || form.name,
        nameMe: form.nameMe,
        nameEn: form.nameEn,
        slug: form.slug,
        parentId: form.parentId || null,
        active: form.active,
        sortOrder: Number(form.sortOrder),
        description: form.description,
        image: form.image,
      };
      const response = isNewCategory
        ? await axiosClient.post<AdminCategoryResponse>(
            "/admin/categories",
            payload,
            getPiAuthConfig(),
          )
        : await axiosClient.put<AdminCategoryResponse>(
            `/admin/categories/${id}`,
            payload,
            getPiAuthConfig(),
          );

      setForm(categoryToForm(response.data.category));
      setSuccess("Kategorija je sačuvana.");

      if (isNewCategory) {
        navigate(`/admin/categories/${response.data.category.id}`, {
          replace: true,
        });
      }
    } catch (err) {
      const responseData =
        typeof err === "object" && err !== null && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data
          : undefined;

      setError(responseData?.message ?? "Kategorija nije sačuvana.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <p>Categories</p>
          <h1>{isNewCategory ? "Nova kategorija" : "Uredi kategoriju"}</h1>
        </div>
        <Link className="admin-secondary-link" to="/admin/categories">
          Nazad na listu
        </Link>
      </div>

      {error && <p className="admin-message error">{error}</p>}
      {success && <p className="admin-message success">{success}</p>}

      <div className="admin-editor">
        {isLoading ? (
          <div className="admin-editor-panel">Učitavanje kategorije...</div>
        ) : (
          <>
            <div className="admin-editor-panel admin-form-grid">
              <label>
                Category Name — Montenegrin
                <input
                  value={form.nameMe}
                  onChange={(event) => updateField("nameMe", event.target.value)}
                />
              </label>
              <label>
                Category Name — English
                <input
                  value={form.nameEn}
                  onChange={(event) => updateField("nameEn", event.target.value)}
                />
              </label>
              <label>
                Slug
                <input
                  value={form.slug}
                  onChange={(event) => updateField("slug", event.target.value)}
                  placeholder="auto-generated from name if empty"
                />
              </label>
              <label>
                Parent category
                <select
                  value={form.parentId}
                  onChange={(event) =>
                    updateField("parentId", event.target.value)
                  }
                >
                  <option value="">Top level</option>
                  {categories
                    .filter((category) => category.id !== id)
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {buildCategoryLabel(category, categoriesById)}
                        {!category.active ? " (Inactive)" : ""}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Sort order
                <input
                  type="number"
                  step="1"
                  value={form.sortOrder}
                  onChange={(event) =>
                    updateField("sortOrder", event.target.value)
                  }
                />
              </label>
              <label className="admin-toggle-row">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) =>
                    updateField("active", event.target.checked)
                  }
                />
                Active
              </label>
              <label>
                Image URL
                <input
                  value={form.image}
                  onChange={(event) => updateField("image", event.target.value)}
                  placeholder="https://..."
                />
              </label>
              <label className="admin-full-width">
                Description
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                />
              </label>
            </div>
            <div className="admin-editor-actions">
              <button onClick={saveCategory} disabled={isSaving}>
                {isSaving ? "Čuvanje..." : "Sačuvaj kategoriju"}
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default AdminCategoryEditorPage;
