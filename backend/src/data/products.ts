export type ProductSpecification = {
  key: string;
  value: string;
};

export type VehicleFitment = {
  year: string;
  make: string;
  model: string;
  submodel: string;
  notes: string;
};

export type CatalogProduct = {
  id: string;
  name: string;
  nameMe: string;
  nameEn: string;
  brand: string;
  sku: string;
  mpn: string;
  category: string;
  price: number;
  stock: number;
  active: boolean;
  description: string;
  descriptionMe: string;
  descriptionEn: string;
  images: string[];
  image: string;
  specifications: ProductSpecification[];
  fitments: VehicleFitment[];
};

const vehicleOptions: VehicleFitment[] = [
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

const productImage = (text: string) =>
  `https://placehold.co/900x680/F4F6F8/111827?text=${text}`;

export const catalogProducts: CatalogProduct[] = [
  {
    id: "brake_pads_1",
    name: "Prednje kočione pločice",
    nameMe: "Prednje kočione pločice",
    nameEn: "Front Brake Pads",
    brand: "Brembo",
    sku: "NP-BRK-1001",
    mpn: "P85075N",
    category: "Kočnice",
    price: 0.1,
    stock: 18,
    active: true,
    description: "Set prednjih pločica za VW Golf 7, Audi A3 i Seat Leon.",
    descriptionMe: "Set prednjih pločica za VW Golf 7, Audi A3 i Seat Leon.",
    descriptionEn: "Front brake pad set for VW Golf 7, Audi A3 and Seat Leon.",
    images: [productImage("Brake+Pads")],
    image: productImage("Brake+Pads"),
    specifications: [
      { key: "Position", value: "Front axle" },
      { key: "Material", value: "Low-metallic ceramic blend" },
      { key: "Includes", value: "4 pads with wear sensor support" },
    ],
    fitments: [vehicleOptions[0], vehicleOptions[1], vehicleOptions[2]],
  },
  {
    id: "oil_filter_1",
    name: "Filter ulja",
    nameMe: "Filter ulja",
    nameEn: "Oil Filter",
    brand: "MANN-FILTER",
    sku: "NP-FLT-2040",
    mpn: "HU 719/7 X",
    category: "Filteri",
    price: 0.08,
    stock: 42,
    active: true,
    description: "Kvalitetni filter ulja za veliki broj benzinskih i dizel motora.",
    descriptionMe: "Kvalitetni filter ulja za veliki broj benzinskih i dizel motora.",
    descriptionEn: "High-quality oil filter for a wide range of petrol and diesel engines.",
    images: [productImage("Oil+Filter")],
    image: productImage("Oil+Filter"),
    specifications: [
      { key: "Filter type", value: "Cartridge" },
      { key: "Seal included", value: "Yes" },
      { key: "Service interval", value: "Per vehicle manufacturer" },
    ],
    fitments: vehicleOptions,
  },
  {
    id: "air_filter_1",
    name: "Filter vazduha",
    nameMe: "Filter vazduha",
    nameEn: "Air Filter",
    brand: "Bosch",
    sku: "NP-FLT-3102",
    mpn: "F 026 400 462",
    category: "Filteri",
    price: 0.09,
    stock: 27,
    active: true,
    description: "Filter motora sa visokim stepenom filtracije i dugim vijekom trajanja.",
    descriptionMe: "Filter motora sa visokim stepenom filtracije i dugim vijekom trajanja.",
    descriptionEn: "Engine air filter with high filtration efficiency and long service life.",
    images: [productImage("Air+Filter")],
    image: productImage("Air+Filter"),
    specifications: [
      { key: "Filter type", value: "Panel" },
      { key: "Media", value: "Pleated paper" },
      { key: "Recommended use", value: "Engine intake filtration" },
    ],
    fitments: [vehicleOptions[1], vehicleOptions[2]],
  },
  {
    id: "spark_plugs_1",
    name: "Set svjećica",
    nameMe: "Set svjećica",
    nameEn: "Spark Plug Set",
    brand: "NGK",
    sku: "NP-IGN-4100",
    mpn: "IZFR6P7",
    category: "Motor",
    price: 0.12,
    stock: 11,
    active: true,
    description: "Set od 4 svjećice za stabilno paljenje i optimalan rad motora.",
    descriptionMe: "Set od 4 svjećice za stabilno paljenje i optimalan rad motora.",
    descriptionEn: "Set of 4 spark plugs for stable ignition and optimal engine performance.",
    images: [productImage("Spark+Plugs")],
    image: productImage("Spark+Plugs"),
    specifications: [
      { key: "Quantity", value: "4 pieces" },
      { key: "Electrode", value: "Iridium" },
      { key: "Gap", value: "Pre-gapped by manufacturer" },
    ],
    fitments: [vehicleOptions[2], vehicleOptions[3]],
  },
  {
    id: "shock_absorber_1",
    name: "Prednji amortizer",
    nameMe: "Prednji amortizer",
    nameEn: "Front Shock Absorber",
    brand: "Sachs",
    sku: "NP-SUS-5200",
    mpn: "315 087",
    category: "Ovjes",
    price: 0.18,
    stock: 8,
    active: true,
    description: "Gasni amortizer za stabilnost, kontrolu i udobnu vožnju.",
    descriptionMe: "Gasni amortizer za stabilnost, kontrolu i udobnu vožnju.",
    descriptionEn: "Gas shock absorber for stability, control and comfortable driving.",
    images: [productImage("Shock+Absorber")],
    image: productImage("Shock+Absorber"),
    specifications: [
      { key: "Position", value: "Front axle" },
      { key: "Type", value: "Gas pressure" },
      { key: "Sold as", value: "Single unit" },
    ],
    fitments: [vehicleOptions[0], vehicleOptions[3]],
  },
  {
    id: "battery_1",
    name: "Akumulator 74Ah",
    nameMe: "Akumulator 74Ah",
    nameEn: "74Ah Battery",
    brand: "Varta",
    sku: "NP-ELC-7400",
    mpn: "E11 Blue Dynamic",
    category: "Elektrika",
    price: 0.25,
    stock: 6,
    active: true,
    description: "12V akumulator za pouzdano pokretanje vozila u svim vremenskim uslovima.",
    descriptionMe: "12V akumulator za pouzdano pokretanje vozila u svim vremenskim uslovima.",
    descriptionEn: "12V battery for reliable vehicle starting in all weather conditions.",
    images: [productImage("Battery")],
    image: productImage("Battery"),
    specifications: [
      { key: "Voltage", value: "12V" },
      { key: "Capacity", value: "74Ah" },
      { key: "Cold cranking amps", value: "680A" },
    ],
    fitments: vehicleOptions,
  },
];

const catalogById: { [productId: string]: CatalogProduct } = {};

catalogProducts.forEach((product) => {
  catalogById[product.id] = product;
});

export const findCatalogProductById = (productId: string) =>
  catalogById[productId];
