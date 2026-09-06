import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { axiosClient } from "../../lib/axiosClient";
import { getPiAuthConfig } from "../../lib/piAuth";
import type { AdminBrand, AdminBrandResponse } from "../../types/admin";

type BrandForm = {
  id?: string;
  name: string;
  slug: string;
  active: boolean;
  description: string;
  logo: string;
};

const emptyBrandForm: BrandForm = {
  name: "",
  slug: "",
  active: true,
  description: "",
  logo: "",
};

const brandToForm = (brand: AdminBrand): BrandForm => ({
  id: brand.id,
  name: brand.name,
  slug: brand.slug,
  active: brand.active,
  description: brand.description,
  logo: brand.logo,
});

const AdminBrandEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNewBrand = !id;
  const [form, setForm] = useState<BrandForm>(emptyBrandForm);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (isNewBrand || !id) {
      setForm(emptyBrandForm);
      return;
    }

    let isMounted = true;

    const loadBrand = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await axiosClient.get<AdminBrandResponse>(
          `/admin/brands/${id}`,
          getPiAuthConfig(),
        );

        if (isMounted) {
          setForm(brandToForm(response.data.brand));
        }
      } catch {
        if (isMounted) {
          setError("Nije moguće učitati brend.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadBrand();

    return () => {
      isMounted = false;
    };
  }, [id, isNewBrand]);

  const updateField = <K extends keyof BrandForm>(
    field: K,
    value: BrandForm[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const saveBrand = async () => {
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        id: form.id,
        name: form.name,
        slug: form.slug,
        active: form.active,
        description: form.description,
        logo: form.logo,
      };
      const response = isNewBrand
        ? await axiosClient.post<AdminBrandResponse>(
            "/admin/brands",
            payload,
            getPiAuthConfig(),
          )
        : await axiosClient.put<AdminBrandResponse>(
            `/admin/brands/${id}`,
            payload,
            getPiAuthConfig(),
          );

      setForm(brandToForm(response.data.brand));
      setSuccess("Brend je sačuvan.");

      if (isNewBrand) {
        navigate(`/admin/brands/${response.data.brand.id}`, {
          replace: true,
        });
      }
    } catch (err) {
      const responseData =
        typeof err === "object" && err !== null && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data
          : undefined;

      setError(responseData?.message ?? "Brend nije sačuvan.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <p>Brands</p>
          <h1>{isNewBrand ? "Novi brend" : "Uredi brend"}</h1>
        </div>
        <Link className="admin-secondary-link" to="/admin/brands">
          Nazad na listu
        </Link>
      </div>

      {error && <p className="admin-message error">{error}</p>}
      {success && <p className="admin-message success">{success}</p>}

      <div className="admin-editor">
        {isLoading ? (
          <div className="admin-editor-panel">Učitavanje brenda...</div>
        ) : (
          <>
            <div className="admin-editor-panel admin-form-grid">
              <label>
                Name
                <input
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
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
                Logo URL
                <input
                  value={form.logo}
                  onChange={(event) => updateField("logo", event.target.value)}
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
              <button onClick={saveBrand} disabled={isSaving}>
                {isSaving ? "Čuvanje..." : "Sačuvaj brend"}
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default AdminBrandEditorPage;
