export type CatalogProduct = {
  id: string;
  name: string;
  brand: string;
  sku: string;
  mpn: string;
  price: number;
  stock: number;
  image: string;
};

export const catalogProducts: CatalogProduct[] = [
  {
    id: "brake_pads_1",
    name: "Prednje kočione pločice",
    brand: "Brembo",
    sku: "NP-BRK-1001",
    mpn: "P85075N",
    price: 0.1,
    stock: 18,
    image: "https://placehold.co/900x680/F4F6F8/111827?text=Brake+Pads",
  },
  {
    id: "oil_filter_1",
    name: "Filter ulja",
    brand: "MANN-FILTER",
    sku: "NP-FLT-2040",
    mpn: "HU 719/7 X",
    price: 0.08,
    stock: 42,
    image: "https://placehold.co/900x680/F4F6F8/111827?text=Oil+Filter",
  },
  {
    id: "air_filter_1",
    name: "Filter vazduha",
    brand: "Bosch",
    sku: "NP-FLT-3102",
    mpn: "F 026 400 462",
    price: 0.09,
    stock: 27,
    image: "https://placehold.co/900x680/F4F6F8/111827?text=Air+Filter",
  },
  {
    id: "spark_plugs_1",
    name: "Set svjećica",
    brand: "NGK",
    sku: "NP-IGN-4100",
    mpn: "IZFR6P7",
    price: 0.12,
    stock: 11,
    image: "https://placehold.co/900x680/F4F6F8/111827?text=Spark+Plugs",
  },
  {
    id: "shock_absorber_1",
    name: "Prednji amortizer",
    brand: "Sachs",
    sku: "NP-SUS-5200",
    mpn: "315 087",
    price: 0.18,
    stock: 8,
    image: "https://placehold.co/900x680/F4F6F8/111827?text=Shock+Absorber",
  },
  {
    id: "battery_1",
    name: "Akumulator 74Ah",
    brand: "Varta",
    sku: "NP-ELC-7400",
    mpn: "E11 Blue Dynamic",
    price: 0.25,
    stock: 6,
    image: "https://placehold.co/900x680/F4F6F8/111827?text=Battery",
  },
];

const catalogById: { [productId: string]: CatalogProduct } = {};

catalogProducts.forEach((product) => {
  catalogById[product.id] = product;
});

export const findCatalogProductById = (productId: string) =>
  catalogById[productId];
