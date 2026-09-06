import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { axiosClient } from "../../lib/axiosClient";
import { getPiAuthConfig } from "../../lib/piAuth";
import type {
  AdminBrand,
  AdminBrandsResponse,
  AdminCategoriesResponse,
  AdminCategory,
  AdminProduct,
  AdminProductFitment,
  AdminProductResponse,
  AdminProductSpecification,
} from "../../types/admin";

type EditorTab = "info" | "images" | "inventory" | "specifications" | "fitment";

type ProductForm = {
  id?: string;
  name: string;
  sku: string;
  mpn: string;
  brandId: string;
  categoryId: string;
  pricePi: string;
  stock: string;
  active: boolean;
  description: string;
  images: string[];
  specifications: AdminProductSpecification[];
  fitments: AdminProductFitment[];
};

const emptyProductForm: ProductForm = {
  name: "",
  sku: "",
  mpn: "",
  brandId: "",
  categoryId: "",
  pricePi: "",
  stock: "0",
  active: true,
  description: "",
  images: [""],
  specifications: [{ key: "", value: "" }],
  fitments: [
    {
      year: "",
      make: "",
      model: "",
      submodel: "",
      notes: "",
    },
  ],
};

const tabs: { id: EditorTab; label: string }[] = [
  { id: "info", label: "INFO" },
  { id: "images", label: "IMAGES" },
  { id: "inventory", label: "INVENTORY" },
  { id: "specifications", label: "SPECIFICATIONS" },
  { id: "fitment", label: "FITMENT" },
];

const productToForm = (product: AdminProduct): ProductForm => ({
  id: product.id,
  name: product.name,
  sku: product.sku,
  mpn: product.mpn,
  brandId: product.brandId,
  categoryId: product.categoryId,
  pricePi: String(product.pricePi),
  stock: String(product.stock),
  active: product.active,
  description: product.description,
  images: product.images.length > 0 ? product.images : [""],
  specifications:
    product.specifications.length > 0
      ? product.specifications
      : [{ key: "", value: "" }],
  fitments:
    product.fitments.length > 0
      ? product.fitments
      : [{ year: "", make: "", model: "", submodel: "", notes: "" }],
});

const cleanFormPayload = (form: ProductForm) => ({
  id: form.id,
  name: form.name,
  sku: form.sku,
  mpn: form.mpn,
  brandId: form.brandId,
  categoryId: form.categoryId,
  pricePi: Number(form.pricePi),
  stock: Number(form.stock),
  active: form.active,
  description: form.description,
  images: form.images.map((image) => image.trim()).filter(Boolean),
  specifications: form.specifications
    .map((spec) => ({ key: spec.key.trim(), value: spec.value.trim() }))
    .filter((spec) => spec.key || spec.value),
  fitments: form.fitments
    .map((fitment) => ({
      year: fitment.year.trim(),
      make: fitment.make.trim(),
      model: fitment.model.trim(),
      submodel: fitment.submodel.trim(),
      notes: fitment.notes.trim(),
    }))
    .filter(
      (fitment) =>
        fitment.year ||
        fitment.make ||
        fitment.model ||
        fitment.submodel ||
        fitment.notes,
    ),
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

const AdminProductEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNewProduct = !id;
  const [activeTab, setActiveTab] = useState<EditorTab>("info");
  const [form, setForm] = useState<ProductForm>(emptyProductForm);
  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const pageTitle = useMemo(
    () => (isNewProduct ? "Novi proizvod" : "Uredi proizvod"),
    [isNewProduct],
  );

  const categoriesById = useMemo(() => {
    const result: { [id: string]: AdminCategory } = {};

    categories.forEach((category) => {
      result[category.id] = category;
    });

    return result;
  }, [categories]);

  useEffect(() => {
    let isMounted = true;

    const loadEditorData = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [brandsResponse, categoriesResponse, productResponse] =
          await Promise.all([
            axiosClient.get<AdminBrandsResponse>("/admin/brands", {
              ...getPiAuthConfig(),
              params: { pageSize: 100, sortBy: "name" },
            }),
            axiosClient.get<AdminCategoriesResponse>("/admin/categories", {
              ...getPiAuthConfig(),
              params: { pageSize: 100, sortBy: "sortOrder" },
            }),
            isNewProduct || !id
              ? Promise.resolve(null)
              : axiosClient.get<AdminProductResponse>(
                  `/admin/products/${id}`,
                  getPiAuthConfig(),
                ),
          ]);

        if (isMounted) {
          setBrands(brandsResponse.data.brands);
          setCategories(categoriesResponse.data.categories);
          setForm(
            productResponse
              ? productToForm(productResponse.data.product)
              : emptyProductForm,
          );
        }
      } catch {
        if (isMounted) {
          setError("Nije moguće učitati podatke editora.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadEditorData();

    return () => {
      isMounted = false;
    };
  }, [id, isNewProduct]);

  const updateField = <K extends keyof ProductForm>(
    field: K,
    value: ProductForm[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateImage = (index: number, value: string) => {
    setForm((current) => ({
      ...current,
      images: current.images.map((image, itemIndex) =>
        itemIndex === index ? value : image,
      ),
    }));
  };

  const setPrimaryImage = (index: number) => {
    setForm((current) => {
      const images = [...current.images];
      const [selected] = images.splice(index, 1);

      return { ...current, images: [selected, ...images] };
    });
  };

  const removeImage = (index: number) => {
    setForm((current) => ({
      ...current,
      images: current.images.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const updateSpec = (
    index: number,
    field: keyof AdminProductSpecification,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      specifications: current.specifications.map((spec, itemIndex) =>
        itemIndex === index ? { ...spec, [field]: value } : spec,
      ),
    }));
  };

  const updateFitment = (
    index: number,
    field: keyof AdminProductFitment,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      fitments: current.fitments.map((fitment, itemIndex) =>
        itemIndex === index ? { ...fitment, [field]: value } : fitment,
      ),
    }));
  };

  const saveProduct = async () => {
    setError("");
    setSuccess("");
    setIsSaving(true);

    try {
      const payload = cleanFormPayload(form);

      const response = isNewProduct
        ? await axiosClient.post<AdminProductResponse>(
            "/admin/products",
            payload,
            getPiAuthConfig(),
          )
        : await axiosClient.put<AdminProductResponse>(
            `/admin/products/${id}`,
            payload,
            getPiAuthConfig(),
          );

      setForm(productToForm(response.data.product));
      setSuccess("Proizvod je sačuvan.");

      if (isNewProduct) {
        navigate(`/admin/products/${response.data.product.id}`, {
          replace: true,
        });
      }
    } catch (err) {
      const responseData =
        typeof err === "object" && err !== null && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data
          : undefined;

      setError(responseData?.message ?? "Proizvod nije sačuvan.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <p>Products</p>
          <h1>{pageTitle}</h1>
        </div>
        <Link className="admin-secondary-link" to="/admin/products">
          Nazad na listu
        </Link>
      </div>

      {error && <p className="admin-message error">{error}</p>}
      {success && <p className="admin-message success">{success}</p>}

      <div className="admin-editor">
        <div className="admin-editor-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? "active" : ""}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="admin-editor-panel">Učitavanje proizvoda...</div>
        ) : (
          <>
            {activeTab === "info" && (
              <div className="admin-editor-panel admin-form-grid">
                <label>
                  Product name
                  <input
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                  />
                </label>
                <label>
                  SKU
                  <input
                    value={form.sku}
                    onChange={(event) => updateField("sku", event.target.value)}
                  />
                </label>
                <label>
                  Manufacturer Part #
                  <input
                    value={form.mpn}
                    onChange={(event) => updateField("mpn", event.target.value)}
                  />
                </label>
                <label>
                  Brand
                  <select
                    value={form.brandId}
                    onChange={(event) =>
                      updateField("brandId", event.target.value)
                    }
                  >
                    <option value="">Select brand</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                        {!brand.active ? " (Inactive)" : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Category
                  <select
                    value={form.categoryId}
                    onChange={(event) =>
                      updateField("categoryId", event.target.value)
                    }
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {buildCategoryLabel(category, categoriesById)}
                        {!category.active ? " (Inactive)" : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Price Pi
                  <input
                    type="number"
                    min="0"
                    step="0.0000001"
                    value={form.pricePi}
                    onChange={(event) =>
                      updateField("pricePi", event.target.value)
                    }
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
                <label className="admin-toggle-row admin-full-width">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(event) =>
                      updateField("active", event.target.checked)
                    }
                  />
                  Active status
                </label>
              </div>
            )}

            {activeTab === "images" && (
              <div className="admin-editor-panel">
                <div className="admin-repeater">
                  {form.images.map((image, index) => (
                    <div key={`${index}-${image}`} className="admin-image-row">
                      <div className="admin-image-preview">
                        {image ? <img src={image} alt="" /> : <span>Image</span>}
                      </div>
                      <input
                        value={image}
                        onChange={(event) => updateImage(index, event.target.value)}
                        placeholder="https://..."
                      />
                      <button onClick={() => setPrimaryImage(index)}>
                        Main
                      </button>
                      <button onClick={() => removeImage(index)}>Remove</button>
                    </div>
                  ))}
                </div>
                <button
                  className="admin-secondary-button"
                  onClick={() =>
                    updateField("images", [...form.images, ""])
                  }
                >
                  Add image
                </button>
              </div>
            )}

            {activeTab === "inventory" && (
              <div className="admin-editor-panel admin-form-grid">
                <label>
                  Stock quantity
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={(event) => updateField("stock", event.target.value)}
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
                  Active / inactive
                </label>
              </div>
            )}

            {activeTab === "specifications" && (
              <div className="admin-editor-panel">
                <div className="admin-repeater">
                  {form.specifications.map((spec, index) => (
                    <div key={index} className="admin-spec-row">
                      <input
                        value={spec.key}
                        onChange={(event) =>
                          updateSpec(index, "key", event.target.value)
                        }
                        placeholder="Key"
                      />
                      <input
                        value={spec.value}
                        onChange={(event) =>
                          updateSpec(index, "value", event.target.value)
                        }
                        placeholder="Value"
                      />
                      <button
                        onClick={() =>
                          updateField(
                            "specifications",
                            form.specifications.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  className="admin-secondary-button"
                  onClick={() =>
                    updateField("specifications", [
                      ...form.specifications,
                      { key: "", value: "" },
                    ])
                  }
                >
                  Add specification
                </button>
              </div>
            )}

            {activeTab === "fitment" && (
              <div className="admin-editor-panel">
                <div className="admin-repeater">
                  {form.fitments.map((fitment, index) => (
                    <div key={index} className="admin-fitment-row">
                      <input
                        value={fitment.year}
                        onChange={(event) =>
                          updateFitment(index, "year", event.target.value)
                        }
                        placeholder="Year"
                      />
                      <input
                        value={fitment.make}
                        onChange={(event) =>
                          updateFitment(index, "make", event.target.value)
                        }
                        placeholder="Make"
                      />
                      <input
                        value={fitment.model}
                        onChange={(event) =>
                          updateFitment(index, "model", event.target.value)
                        }
                        placeholder="Model"
                      />
                      <input
                        value={fitment.submodel}
                        onChange={(event) =>
                          updateFitment(index, "submodel", event.target.value)
                        }
                        placeholder="Submodel"
                      />
                      <input
                        value={fitment.notes}
                        onChange={(event) =>
                          updateFitment(index, "notes", event.target.value)
                        }
                        placeholder="Notes"
                      />
                      <button
                        onClick={() =>
                          updateField(
                            "fitments",
                            form.fitments.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  className="admin-secondary-button"
                  onClick={() =>
                    updateField("fitments", [
                      ...form.fitments,
                      {
                        year: "",
                        make: "",
                        model: "",
                        submodel: "",
                        notes: "",
                      },
                    ])
                  }
                >
                  Add fitment
                </button>
              </div>
            )}

            <div className="admin-editor-actions">
              <button onClick={saveProduct} disabled={isSaving}>
                {isSaving ? "Čuvanje..." : "Sačuvaj proizvod"}
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default AdminProductEditorPage;
