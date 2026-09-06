export type CatalogProduct = {
  id: string;
  name: string;
  price: number;
  stock: number;
};

export const catalogProducts: CatalogProduct[] = [
  {
    id: "brake_pads_1",
    name: "Prednje kočione pločice",
    price: 0.1,
    stock: 18,
  },
  {
    id: "oil_filter_1",
    name: "Filter ulja",
    price: 0.08,
    stock: 42,
  },
  {
    id: "air_filter_1",
    name: "Filter vazduha",
    price: 0.09,
    stock: 27,
  },
  {
    id: "spark_plugs_1",
    name: "Set svjećica",
    price: 0.12,
    stock: 11,
  },
  {
    id: "shock_absorber_1",
    name: "Prednji amortizer",
    price: 0.18,
    stock: 8,
  },
  {
    id: "battery_1",
    name: "Akumulator 74Ah",
    price: 0.25,
    stock: 6,
  },
];

const catalogById: { [productId: string]: CatalogProduct } = {};

catalogProducts.forEach((product) => {
  catalogById[product.id] = product;
});

export const findCatalogProductById = (productId: string) =>
  catalogById[productId];
