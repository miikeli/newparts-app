import type { CSSProperties } from "react";

interface ProductCardProps {
  name: string;
  description: string;
  price: number;
  pictureURL: string;
  onClickBuyWithPi: () => void;
  onClickBuyWithIrra: () => void;
  disabled?: boolean;
  brand?: string;
  category?: string;
}

const cardStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  overflow: "hidden",
  background: "#ffffff",
  border: "1px solid #e0e6ed",
  borderRadius: 18,
  boxShadow: "0 8px 28px rgba(20, 32, 51, 0.06)",
};

const imageWrapperStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  aspectRatio: "4 / 3",
  background: "#eef2f6",
  overflow: "hidden",
};

const imageStyle: CSSProperties = {
  display: "block",
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const categoryStyle: CSSProperties = {
  position: "absolute",
  left: 12,
  top: 12,
  borderRadius: 999,
  padding: "6px 9px",
  background: "rgba(11, 31, 51, 0.88)",
  color: "#ffffff",
  fontSize: 11,
  fontWeight: 800,
};

const bodyStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  flexGrow: 1,
  padding: 16,
};

const brandStyle: CSSProperties = {
  marginBottom: 5,
  color: "#1268d6",
  fontSize: 12,
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.7px",
};

const titleStyle: CSSProperties = {
  margin: 0,
  color: "#142033",
  fontSize: 18,
  lineHeight: 1.3,
};

const descriptionStyle: CSSProperties = {
  margin: "8px 0 14px",
  color: "#697789",
  fontSize: 13,
  lineHeight: 1.5,
};

const bottomStyle: CSSProperties = {
  marginTop: "auto",
};

const priceStyle: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: 5,
  marginBottom: 12,
};

const priceNumberStyle: CSSProperties = {
  color: "#102338",
  fontSize: 24,
  fontWeight: 900,
};

const priceCurrencyStyle: CSSProperties = {
  color: "#687688",
  fontSize: 13,
  fontWeight: 700,
};

const piButtonStyle: CSSProperties = {
  width: "100%",
  minHeight: 44,
  border: 0,
  borderRadius: 11,
  padding: "10px 12px",
  background: "#1268d6",
  color: "#ffffff",
  fontWeight: 900,
};

const irraButtonStyle: CSSProperties = {
  width: "100%",
  minHeight: 40,
  marginTop: 8,
  border: "1px solid #d9e0e8",
  borderRadius: 11,
  padding: "9px 12px",
  background: "#ffffff",
  color: "#46566a",
  fontWeight: 750,
};

const demoCaptionStyle: CSSProperties = {
  margin: "7px 0 0",
  color: "#98a2af",
  textAlign: "center",
  fontSize: 10,
};

const ProductCard = ({
  name,
  description,
  price,
  pictureURL,
  onClickBuyWithPi,
  onClickBuyWithIrra,
  disabled,
  brand,
  category,
}: ProductCardProps) => {
  return (
    <article style={cardStyle}>
      <div style={imageWrapperStyle}>
        <img style={imageStyle} src={pictureURL} alt={name} />

        {category && <span style={categoryStyle}>{category}</span>}
      </div>

      <div style={bodyStyle}>
        {brand && <div style={brandStyle}>{brand}</div>}

        <h3 style={titleStyle}>{name}</h3>
        <p style={descriptionStyle}>{description}</p>

        <div style={bottomStyle}>
          <div style={priceStyle}>
            <span style={priceNumberStyle}>{price}</span>
            <span style={priceCurrencyStyle}>Test-Pi</span>
          </div>

          <button
            style={piButtonStyle}
            onClick={onClickBuyWithPi}
            disabled={disabled}
          >
            Kupi sa Pi
          </button>

          <button
            style={irraButtonStyle}
            onClick={onClickBuyWithIrra}
            disabled={disabled}
          >
            Kupi sa IRRA
          </button>

          <p style={demoCaptionStyle}>
            IRRA cijena je trenutno samo demonstraciona.
          </p>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;