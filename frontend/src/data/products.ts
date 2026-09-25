export type VehicleFitment = {
  year: string;
  make: string;
  model: string;
  submodel: string;
  notes: string;
  notesMe?: string;
  notesEn?: string;
};

export type VehicleSelection = Omit<VehicleFitment, "notes">;

export type ProductSpecification = {
  label: string;
  value: string;
  labelMe?: string;
  labelEn?: string;
  valueMe?: string;
  valueEn?: string;
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
  imagesMe?: string[];
  imagesEn?: string[];
  specifications: ProductSpecification[];
  fitments: VehicleFitment[];
  shippingInfo: string;
  shippingInfoMe?: string;
  shippingInfoEn?: string;
  warranty: string;
  warrantyMe?: string;
  warrantyEn?: string;
  returnPolicy: string;
  returnPolicyMe?: string;
  returnPolicyEn?: string;
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
    notesMe: "Odgovara servisnim setovima za prednju osovinu.",
    notesEn: "Fits front axle service kits.",
  },
  {
    year: "2019",
    make: "Volkswagen",
    model: "Golf 7",
    submodel: "1.6 TDI",
    notes: "Verify PR code before ordering brake components.",
    notesMe: "Provjerite PR kod prije naručivanja kočionih komponenti.",
    notesEn: "Verify PR code before ordering brake components.",
  },
  {
    year: "2020",
    make: "Audi",
    model: "A3",
    submodel: "2.0 TDI",
    notes: "Compatible with standard trim packages.",
    notesMe: "Kompatibilno sa standardnim paketima opreme.",
    notesEn: "Compatible with standard trim packages.",
  },
  {
    year: "2021",
    make: "BMW",
    model: "320d",
    submodel: "2.0 Diesel",
    notes: "Check production month for suspension parts.",
    notesMe: "Provjerite mjesec proizvodnje za djelove ovjesa.",
    notesEn: "Check production month for suspension parts.",
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
    imagesMe: [
      "https://placehold.co/900x680/F4F6F8/111827?text=Ko%C4%8Dione+plo%C4%8Dice",
      "https://placehold.co/900x680/EAF1FB/111827?text=Bo%C4%8Dni+prikaz",
      "https://placehold.co/900x680/F8FAFC/111827?text=Set+plo%C4%8Dica",
    ],
    imagesEn: [
      "https://placehold.co/900x680/F4F6F8/111827?text=Brake+Pads",
      "https://placehold.co/900x680/EAF1FB/111827?text=Brake+Pads+Side",
      "https://placehold.co/900x680/F8FAFC/111827?text=Brake+Pads+Kit",
    ],
    specifications: [
      {
        label: "Position",
        labelMe: "Pozicija",
        labelEn: "Position",
        value: "Front axle",
        valueMe: "Prednja osovina",
        valueEn: "Front axle",
      },
      {
        label: "Material",
        labelMe: "Materijal",
        labelEn: "Material",
        value: "Low-metallic ceramic blend",
        valueMe: "Niskometalna keramička mješavina",
        valueEn: "Low-metallic ceramic blend",
      },
      {
        label: "Includes",
        labelMe: "Sadrži",
        labelEn: "Includes",
        value: "4 pads with wear sensor support",
        valueMe: "4 pločice sa podrškom za senzor istrošenosti",
        valueEn: "4 pads with wear sensor support",
      },
    ],
    fitments: [
      vehicleOptions[0],
      vehicleOptions[1],
      vehicleOptions[2],
    ],
    shippingInfo: "Ships in 1-2 business days after order confirmation.",
    shippingInfoMe: "Šalje se u roku od 1-2 radna dana nakon potvrde narudžbe.",
    shippingInfoEn: "Ships in 1-2 business days after order confirmation.",
    warranty: "12 month limited manufacturer warranty.",
    warrantyMe: "Ograničena garancija proizvođača od 12 mjeseci.",
    warrantyEn: "12 month limited manufacturer warranty.",
    returnPolicy: "Returns accepted within 14 days if unused and in original packaging.",
    returnPolicyMe: "Povrat je moguć u roku od 14 dana ako proizvod nije korišćen i ako je u originalnom pakovanju.",
    returnPolicyEn: "Returns accepted within 14 days if unused and in original packaging.",
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
    imagesMe: [
      "https://placehold.co/900x680/F4F6F8/111827?text=Filter+ulja",
      "https://placehold.co/900x680/EAF1FB/111827?text=Kutija+filtera",
      "https://placehold.co/900x680/F8FAFC/111827?text=Zaptivka+filtera",
    ],
    imagesEn: [
      "https://placehold.co/900x680/F4F6F8/111827?text=Oil+Filter",
      "https://placehold.co/900x680/EAF1FB/111827?text=Oil+Filter+Box",
      "https://placehold.co/900x680/F8FAFC/111827?text=Oil+Filter+Seal",
    ],
    specifications: [
      {
        label: "Filter type",
        labelMe: "Tip filtera",
        labelEn: "Filter type",
        value: "Cartridge",
        valueMe: "Uložak",
        valueEn: "Cartridge",
      },
      {
        label: "Seal included",
        labelMe: "Zaptivka uključena",
        labelEn: "Seal included",
        value: "Yes",
        valueMe: "Da",
        valueEn: "Yes",
      },
      {
        label: "Service interval",
        labelMe: "Servisni interval",
        labelEn: "Service interval",
        value: "Per vehicle manufacturer",
        valueMe: "Prema preporuci proizvođača vozila",
        valueEn: "Per vehicle manufacturer",
      },
    ],
    fitments: vehicleOptions,
    shippingInfo: "Usually ships same day for orders placed before noon.",
    shippingInfoMe: "Obično se šalje istog dana za narudžbe poslate prije podne.",
    shippingInfoEn: "Usually ships same day for orders placed before noon.",
    warranty: "Manufacturer warranty applies against material defects.",
    warrantyMe: "Garancija proizvođača važi za materijalne nedostatke.",
    warrantyEn: "Manufacturer warranty applies against material defects.",
    returnPolicy: "Return allowed for unopened filters within 14 days.",
    returnPolicyMe: "Povrat je moguć za neotvorene filtere u roku od 14 dana.",
    returnPolicyEn: "Return allowed for unopened filters within 14 days.",
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
    imagesMe: [
      "https://placehold.co/900x680/F4F6F8/111827?text=Filter+vazduha",
      "https://placehold.co/900x680/EAF1FB/111827?text=Profil+filtera",
      "https://placehold.co/900x680/F8FAFC/111827?text=Materijal+filtera",
    ],
    imagesEn: [
      "https://placehold.co/900x680/F4F6F8/111827?text=Air+Filter",
      "https://placehold.co/900x680/EAF1FB/111827?text=Air+Filter+Profile",
      "https://placehold.co/900x680/F8FAFC/111827?text=Air+Filter+Media",
    ],
    specifications: [
      {
        label: "Filter type",
        labelMe: "Tip filtera",
        labelEn: "Filter type",
        value: "Panel",
        valueMe: "Panel",
        valueEn: "Panel",
      },
      {
        label: "Media",
        labelMe: "Materijal",
        labelEn: "Media",
        value: "Pleated paper",
        valueMe: "Naborani papir",
        valueEn: "Pleated paper",
      },
      {
        label: "Recommended use",
        labelMe: "Preporučena upotreba",
        labelEn: "Recommended use",
        value: "Engine intake filtration",
        valueMe: "Filtracija usisnog vazduha motora",
        valueEn: "Engine intake filtration",
      },
    ],
    fitments: [
      vehicleOptions[1],
      vehicleOptions[2],
    ],
    shippingInfo: "Ships in 1-2 business days.",
    shippingInfoMe: "Šalje se u roku od 1-2 radna dana.",
    shippingInfoEn: "Ships in 1-2 business days.",
    warranty: "12 month limited warranty.",
    warrantyMe: "Ograničena garancija od 12 mjeseci.",
    warrantyEn: "12 month limited warranty.",
    returnPolicy: "Return allowed if unused and clean.",
    returnPolicyMe: "Povrat je moguć ako proizvod nije korišćen i ako je čist.",
    returnPolicyEn: "Return allowed if unused and clean.",
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
    imagesMe: [
      "https://placehold.co/900x680/F4F6F8/111827?text=Svje%C4%87ice",
      "https://placehold.co/900x680/EAF1FB/111827?text=Vrh+svje%C4%87ice",
      "https://placehold.co/900x680/F8FAFC/111827?text=Set+svje%C4%87ica",
    ],
    imagesEn: [
      "https://placehold.co/900x680/F4F6F8/111827?text=Spark+Plugs",
      "https://placehold.co/900x680/EAF1FB/111827?text=Spark+Plug+Tip",
      "https://placehold.co/900x680/F8FAFC/111827?text=Spark+Plug+Set",
    ],
    specifications: [
      {
        label: "Quantity",
        labelMe: "Količina",
        labelEn: "Quantity",
        value: "4 pieces",
        valueMe: "4 komada",
        valueEn: "4 pieces",
      },
      {
        label: "Electrode",
        labelMe: "Elektroda",
        labelEn: "Electrode",
        value: "Iridium",
        valueMe: "Iridijum",
        valueEn: "Iridium",
      },
      {
        label: "Gap",
        labelMe: "Razmak elektroda",
        labelEn: "Gap",
        value: "Pre-gapped by manufacturer",
        valueMe: "Razmak fabrički podešen",
        valueEn: "Pre-gapped by manufacturer",
      },
    ],
    fitments: [
      vehicleOptions[2],
      vehicleOptions[3],
    ],
    shippingInfo: "Ships in 1-2 business days.",
    shippingInfoMe: "Šalje se u roku od 1-2 radna dana.",
    shippingInfoEn: "Ships in 1-2 business days.",
    warranty: "Manufacturer warranty for verified fitment applications.",
    warrantyMe: "Garancija proizvođača važi za potvrđene kompatibilne primjene.",
    warrantyEn: "Manufacturer warranty for verified fitment applications.",
    returnPolicy: "Electrical ignition parts are returnable only unopened.",
    returnPolicyMe: "Električni djelovi sistema paljenja mogu se vratiti samo ako nijesu otvarani.",
    returnPolicyEn: "Electrical ignition parts are returnable only unopened.",
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
    imagesMe: [
      "https://placehold.co/900x680/F4F6F8/111827?text=Amortizer",
      "https://placehold.co/900x680/EAF1FB/111827?text=Nosa%C4%8D+amortizera",
      "https://placehold.co/900x680/F8FAFC/111827?text=Du%C5%BEina+amortizera",
    ],
    imagesEn: [
      "https://placehold.co/900x680/F4F6F8/111827?text=Shock+Absorber",
      "https://placehold.co/900x680/EAF1FB/111827?text=Shock+Mount",
      "https://placehold.co/900x680/F8FAFC/111827?text=Shock+Length",
    ],
    specifications: [
      {
        label: "Position",
        labelMe: "Pozicija",
        labelEn: "Position",
        value: "Front axle",
        valueMe: "Prednja osovina",
        valueEn: "Front axle",
      },
      {
        label: "Type",
        labelMe: "Tip",
        labelEn: "Type",
        value: "Gas pressure",
        valueMe: "Gasni pritisak",
        valueEn: "Gas pressure",
      },
      {
        label: "Sold as",
        labelMe: "Prodaje se kao",
        labelEn: "Sold as",
        value: "Single unit",
        valueMe: "Jedan komad",
        valueEn: "Single unit",
      },
    ],
    fitments: [
      vehicleOptions[0],
      vehicleOptions[3],
    ],
    shippingInfo: "Oversized item. Ships in 2-3 business days.",
    shippingInfoMe: "Veći paket. Šalje se u roku od 2-3 radna dana.",
    shippingInfoEn: "Oversized item. Ships in 2-3 business days.",
    warranty: "24 month limited manufacturer warranty.",
    warrantyMe: "Ograničena garancija proizvođača od 24 mjeseca.",
    warrantyEn: "24 month limited manufacturer warranty.",
    returnPolicy: "Return accepted before installation attempt.",
    returnPolicyMe: "Povrat je moguć prije pokušaja ugradnje.",
    returnPolicyEn: "Return accepted before installation attempt.",
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
    imagesMe: [
      "https://placehold.co/900x680/F4F6F8/111827?text=Akumulator",
      "https://placehold.co/900x680/EAF1FB/111827?text=Terminali+akumulatora",
      "https://placehold.co/900x680/F8FAFC/111827?text=Oznaka+akumulatora",
    ],
    imagesEn: [
      "https://placehold.co/900x680/F4F6F8/111827?text=Battery",
      "https://placehold.co/900x680/EAF1FB/111827?text=Battery+Terminals",
      "https://placehold.co/900x680/F8FAFC/111827?text=Battery+Label",
    ],
    specifications: [
      {
        label: "Voltage",
        labelMe: "Napon",
        labelEn: "Voltage",
        value: "12V",
      },
      {
        label: "Capacity",
        labelMe: "Kapacitet",
        labelEn: "Capacity",
        value: "74Ah",
      },
      {
        label: "Cold cranking amps",
        labelMe: "Startna struja",
        labelEn: "Cold cranking amps",
        value: "680A",
      },
    ],
    fitments: vehicleOptions,
    shippingInfo: "Battery shipping depends on destination and carrier rules.",
    shippingInfoMe: "Dostava akumulatora zavisi od destinacije i pravila prevoznika.",
    shippingInfoEn: "Battery shipping depends on destination and carrier rules.",
    warranty: "24 month limited battery warranty.",
    warrantyMe: "Ograničena garancija na akumulator od 24 mjeseca.",
    warrantyEn: "24 month limited battery warranty.",
    returnPolicy: "Return accepted only for unused batteries with intact terminals.",
    returnPolicyMe: "Povrat je moguć samo za nekorišćene akumulatore sa neoštećenim terminalima.",
    returnPolicyEn: "Return accepted only for unused batteries with intact terminals.",
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

export const getLocalizedProductImages = (
  product: Product,
  language: CatalogLanguage,
) =>
  language === "en"
    ? product.imagesEn || product.images
    : product.imagesMe || product.images;

export const getLocalizedProductSpecifications = (
  product: Product,
  language: CatalogLanguage,
) =>
  product.specifications.map((specification) => ({
    label:
      language === "en"
        ? specification.labelEn || specification.label
        : specification.labelMe || specification.label,
    value:
      language === "en"
        ? specification.valueEn || specification.value
        : specification.valueMe || specification.value,
  }));

export const getLocalizedFitmentNotes = (
  fitment: VehicleFitment,
  language: CatalogLanguage,
) =>
  language === "en"
    ? fitment.notesEn || fitment.notes
    : fitment.notesMe || fitment.notes;

export const getLocalizedProductShippingInfo = (
  product: Product,
  language: CatalogLanguage,
) =>
  language === "en"
    ? product.shippingInfoEn || product.shippingInfo
    : product.shippingInfoMe || product.shippingInfo;

export const getLocalizedProductWarranty = (
  product: Product,
  language: CatalogLanguage,
) =>
  language === "en"
    ? product.warrantyEn || product.warranty
    : product.warrantyMe || product.warranty;

export const getLocalizedProductReturnPolicy = (
  product: Product,
  language: CatalogLanguage,
) =>
  language === "en"
    ? product.returnPolicyEn || product.returnPolicy
    : product.returnPolicyMe || product.returnPolicy;

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
