export type VehicleFitment = {
  year: string;
  make: string;
  model: string;
  submodel: string;
  notes: string;
};

export type VehicleSelection = Omit<VehicleFitment, "notes">;

export type ProductSpecification = {
  label: string;
  value: string;
};

export type Product = {
  id: string;
  name: string;
  nameMe?: string;
  nameEn?: string;
  brand: string;
  sku: string;
  mpn: string;
  description: string;
  descriptionMe?: string;
  descriptionEn?: string;
  category: string;
  categoryId: string;
  price: number;
  stock: number;
  images: string[];
  specifications: ProductSpecification[];
  fitments: VehicleFitment[];
  shippingInfo: string;
  warranty: string;
  returnPolicy: string;
};

export type CatalogLanguage = "me" | "en";

export type Category = {
  id: string;
  nameMe: string;
  nameEn: string;
};

export const vehicleOptions: VehicleFitment[] = [
  {
    year: "2019",
    make: "Volkswagen",
    model: "Golf 7",
    submodel: "2.0 TDI",
    notes: "Fits front axle service kits.",
  },
  {
    year: "2019",
    make: "Volkswagen",
    model: "Golf 7",
    submodel: "1.6 TDI",
    notes: "Verify PR code before ordering brake components.",
  },
  {
    year: "2020",
    make: "Audi",
    model: "A3",
    submodel: "2.0 TDI",
    notes: "Compatible with standard trim packages.",
  },
  {
    year: "2021",
    make: "BMW",
    model: "320d",
    submodel: "2.0 Diesel",
    notes: "Check production month for suspension parts.",
  },
];

export const products: Product[] = [
  {
    id: "brake_pads_1",
    name: "Prednje kočione pločice",
    nameMe: "Prednje kočione pločice",
    nameEn: "Front Brake Pads",
    brand: "Brembo",
    sku: "NP-BRK-1001",
    mpn: "P85075N",
    description: "Set prednjih pločica za VW Golf 7, Audi A3 i Seat Leon.",
    descriptionMe: "Set prednjih pločica za VW Golf 7, Audi A3 i Seat Leon.",
    descriptionEn: "Front brake pad set for VW Golf 7, Audi A3 and Seat Leon.",
    category: "Kočnice",
    categoryId: "brake-pads",
    price: 0.1,
    stock: 18,
    images: [
      "https://placehold.co/900x680/F4F6F8/111827?text=Brake+Pads",
      "https://placehold.co/900x680/EAF1FB/111827?text=Brake+Pads+Side",
      "https://placehold.co/900x680/F8FAFC/111827?text=Brake+Pads+Kit",
    ],
    specifications: [
      { label: "Position", value: "Front axle" },
      { label: "Material", value: "Low-metallic ceramic blend" },
      { label: "Includes", value: "4 pads with wear sensor support" },
    ],
    fitments: [
      vehicleOptions[0],
      vehicleOptions[1],
      vehicleOptions[2],
    ],
    shippingInfo: "Ships in 1-2 business days after order confirmation.",
    warranty: "12 month limited manufacturer warranty.",
    returnPolicy: "Returns accepted within 14 days if unused and in original packaging.",
  },
  {
    id: "oil_filter_1",
    name: "Filter ulja",
    nameMe: "Filter ulja",
    nameEn: "Oil Filter",
    brand: "MANN-FILTER",
    sku: "NP-FLT-2040",
    mpn: "HU 719/7 X",
    description: "Kvalitetni filter ulja za veliki broj benzinskih i dizel motora.",
    descriptionMe: "Kvalitetni filter ulja za veliki broj benzinskih i dizel motora.",
    descriptionEn: "High-quality oil filter for a wide range of petrol and diesel engines.",
    category: "Filteri",
    categoryId: "filters",
    price: 0.08,
    stock: 42,
    images: [
      "https://placehold.co/900x680/F4F6F8/111827?text=Oil+Filter",
      "https://placehold.co/900x680/EAF1FB/111827?text=Oil+Filter+Box",
      "https://placehold.co/900x680/F8FAFC/111827?text=Oil+Filter+Seal",
    ],
    specifications: [
      { label: "Filter type", value: "Cartridge" },
      { label: "Seal included", value: "Yes" },
      { label: "Service interval", value: "Per vehicle manufacturer" },
    ],
    fitments: vehicleOptions,
    shippingInfo: "Usually ships same day for orders placed before noon.",
    warranty: "Manufacturer warranty applies against material defects.",
    returnPolicy: "Return allowed for unopened filters within 14 days.",
  },
  {
    id: "air_filter_1",
    name: "Filter vazduha",
    nameMe: "Filter vazduha",
    nameEn: "Air Filter",
    brand: "Bosch",
    sku: "NP-FLT-3102",
    mpn: "F 026 400 462",
    description: "Filter motora sa visokim stepenom filtracije i dugim vijekom trajanja.",
    descriptionMe: "Filter motora sa visokim stepenom filtracije i dugim vijekom trajanja.",
    descriptionEn: "Engine air filter with high filtration efficiency and long service life.",
    category: "Filteri",
    categoryId: "filters",
    price: 0.09,
    stock: 27,
    images: [
      "https://placehold.co/900x680/F4F6F8/111827?text=Air+Filter",
      "https://placehold.co/900x680/EAF1FB/111827?text=Air+Filter+Profile",
      "https://placehold.co/900x680/F8FAFC/111827?text=Air+Filter+Media",
    ],
    specifications: [
      { label: "Filter type", value: "Panel" },
      { label: "Media", value: "Pleated paper" },
      { label: "Recommended use", value: "Engine intake filtration" },
    ],
    fitments: [
      vehicleOptions[1],
      vehicleOptions[2],
    ],
    shippingInfo: "Ships in 1-2 business days.",
    warranty: "12 month limited warranty.",
    returnPolicy: "Return allowed if unused and clean.",
  },
  {
    id: "spark_plugs_1",
    name: "Set svjećica",
    nameMe: "Set svjećica",
    nameEn: "Spark Plug Set",
    brand: "NGK",
    sku: "NP-IGN-4100",
    mpn: "IZFR6P7",
    description: "Set od 4 svjećice za stabilno paljenje i optimalan rad motora.",
    descriptionMe: "Set od 4 svjećice za stabilno paljenje i optimalan rad motora.",
    descriptionEn: "Set of 4 spark plugs for stable ignition and optimal engine performance.",
    category: "Motor",
    categoryId: "ignition",
    price: 0.12,
    stock: 11,
    images: [
      "https://placehold.co/900x680/F4F6F8/111827?text=Spark+Plugs",
      "https://placehold.co/900x680/EAF1FB/111827?text=Spark+Plug+Tip",
      "https://placehold.co/900x680/F8FAFC/111827?text=Spark+Plug+Set",
    ],
    specifications: [
      { label: "Quantity", value: "4 pieces" },
      { label: "Electrode", value: "Iridium" },
      { label: "Gap", value: "Pre-gapped by manufacturer" },
    ],
    fitments: [
      vehicleOptions[2],
      vehicleOptions[3],
    ],
    shippingInfo: "Ships in 1-2 business days.",
    warranty: "Manufacturer warranty for verified fitment applications.",
    returnPolicy: "Electrical ignition parts are returnable only unopened.",
  },
  {
    id: "shock_absorber_1",
    name: "Prednji amortizer",
    nameMe: "Prednji amortizer",
    nameEn: "Front Shock Absorber",
    brand: "Sachs",
    sku: "NP-SUS-5200",
    mpn: "315 087",
    description: "Gasni amortizer za stabilnost, kontrolu i udobnu vožnju.",
    descriptionMe: "Gasni amortizer za stabilnost, kontrolu i udobnu vožnju.",
    descriptionEn: "Gas shock absorber for stability, control and comfortable driving.",
    category: "Ovjes",
    categoryId: "suspension",
    price: 0.18,
    stock: 8,
    images: [
      "https://placehold.co/900x680/F4F6F8/111827?text=Shock+Absorber",
      "https://placehold.co/900x680/EAF1FB/111827?text=Shock+Mount",
      "https://placehold.co/900x680/F8FAFC/111827?text=Shock+Length",
    ],
    specifications: [
      { label: "Position", value: "Front axle" },
      { label: "Type", value: "Gas pressure" },
      { label: "Sold as", value: "Single unit" },
    ],
    fitments: [
      vehicleOptions[0],
      vehicleOptions[3],
    ],
    shippingInfo: "Oversized item. Ships in 2-3 business days.",
    warranty: "24 month limited manufacturer warranty.",
    returnPolicy: "Return accepted before installation attempt.",
  },
  {
    id: "battery_1",
    name: "Akumulator 74Ah",
    nameMe: "Akumulator 74Ah",
    nameEn: "74Ah Battery",
    brand: "Varta",
    sku: "NP-ELC-7400",
    mpn: "E11 Blue Dynamic",
    description: "12V akumulator za pouzdano pokretanje vozila u svim vremenskim uslovima.",
    descriptionMe: "12V akumulator za pouzdano pokretanje vozila u svim vremenskim uslovima.",
    descriptionEn: "12V battery for reliable vehicle starting in all weather conditions.",
    category: "Elektrika",
    categoryId: "electrical",
    price: 0.25,
    stock: 6,
    images: [
      "https://placehold.co/900x680/F4F6F8/111827?text=Battery",
      "https://placehold.co/900x680/EAF1FB/111827?text=Battery+Terminals",
      "https://placehold.co/900x680/F8FAFC/111827?text=Battery+Label",
    ],
    specifications: [
      { label: "Voltage", value: "12V" },
      { label: "Capacity", value: "74Ah" },
      { label: "Cold cranking amps", value: "680A" },
    ],
    fitments: vehicleOptions,
    shippingInfo: "Battery shipping depends on destination and carrier rules.",
    warranty: "24 month limited battery warranty.",
    returnPolicy: "Return accepted only for unused batteries with intact terminals.",
  },
];

export const categories: Category[] = [
  { id: "brake-pads", nameMe: "Kočnice", nameEn: "Brakes" },
  { id: "ignition", nameMe: "Paljenje", nameEn: "Ignition" },
  { id: "engine", nameMe: "Motor", nameEn: "Engine" },
  { id: "suspension", nameMe: "Ovjes", nameEn: "Suspension" },
  { id: "steering", nameMe: "Upravljanje", nameEn: "Steering" },
  { id: "fuel", nameMe: "Gorivo", nameEn: "Fuel" },
  { id: "cooling", nameMe: "Hlađenje", nameEn: "Cooling" },
  { id: "electrical", nameMe: "Elektrika", nameEn: "Electrical" },
  { id: "climate", nameMe: "Klima", nameEn: "Climate Control" },
];

export const brands = [
  "BOSCH",
  "BREMBO",
  "MANN-FILTER",
  "VARTA",
  "LIQUI MOLY",
  "DENSO",
  "NGK",
  "SACHS",
];

export const findProductById = (productId: string) =>
  products.find((product) => product.id === productId);

export const getLocalizedProductName = (
  product: Product,
  language: CatalogLanguage,
) =>
  language === "en"
    ? product.nameEn || product.name
    : product.nameMe || product.name;

export const getLocalizedProductDescription = (
  product: Product,
  language: CatalogLanguage,
) =>
  language === "en"
    ? product.descriptionEn || product.description
    : product.descriptionMe || product.description;

export const getLocalizedCategoryName = (
  category: Category | undefined,
  language: CatalogLanguage,
) => {
  if (!category) {
    return "";
  }

  return language === "en"
    ? category.nameEn || category.nameMe
    : category.nameMe || category.nameEn;
};

export const findCategoryById = (categoryId: string) =>
  categories.find((category) => category.id === categoryId);

export const getLocalizedProductCategory = (
  product: Product,
  language: CatalogLanguage,
) =>
  getLocalizedCategoryName(findCategoryById(product.categoryId), language) ||
  product.category;
