import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useI18n, type Language } from "../i18n";
import type { User } from "../types/pi.ts";

interface HeaderProps {
  onSignIn: () => void;
  onSignOut: () => void;
  onSendTestNotification: () => void;
  user: User | null;
  isLoading?: boolean;
  cartItemCount?: number;
}

const headerStyle: CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 20,
  width: "100%",
  backgroundColor: "#ffffff",
  borderBottom: "1px solid #e2e7ed",
  boxShadow: "0 4px 18px rgba(22, 34, 51, 0.05)",
};

const innerStyle: CSSProperties = {
  width: "min(1180px, calc(100% - 28px))",
  minHeight: 68,
  margin: "0 auto",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 14,
};

const logoAreaStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  color: "inherit",
  textDecoration: "none",
};

const logoStyle: CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 11,
  background: "linear-gradient(135deg, #1268d6, #0b3f87)",
  color: "white",
  display: "grid",
  placeItems: "center",
  fontWeight: 900,
  fontSize: 18,
};

const brandStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  lineHeight: 1.05,
};

const brandNameStyle: CSSProperties = {
  fontWeight: 900,
  fontSize: 19,
  color: "#102338",
  letterSpacing: "-0.4px",
};

const brandCaptionStyle: CSSProperties = {
  marginTop: 5,
  color: "#718094",
  fontSize: 11,
};

const userSectionStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 9,
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const usernameStyle: CSSProperties = {
  color: "#4c5c6f",
  fontSize: 13,
  maxWidth: 120,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const primaryButtonStyle: CSSProperties = {
  border: 0,
  borderRadius: 10,
  padding: "10px 14px",
  fontWeight: 800,
  color: "white",
  background: "#1268d6",
};

const secondaryButtonStyle: CSSProperties = {
  border: "1px solid #d7dee8",
  borderRadius: 10,
  padding: "9px 13px",
  fontWeight: 700,
  color: "#32445a",
  background: "white",
};

const cartLinkStyle: CSSProperties = {
  position: "relative",
  display: "grid",
  placeItems: "center",
  width: 42,
  height: 42,
  border: "1px solid #d7dee8",
  borderRadius: 10,
  color: "#32445a",
  background: "white",
  textDecoration: "none",
  fontSize: 20,
};

const cartBadgeStyle: CSSProperties = {
  position: "absolute",
  right: -6,
  top: -7,
  minWidth: 20,
  height: 20,
  borderRadius: 999,
  padding: "0 5px",
  display: "grid",
  placeItems: "center",
  background: "#1268d6",
  color: "#ffffff",
  fontSize: 11,
  fontWeight: 900,
};

const languageSelectStyle: CSSProperties = {
  minHeight: 42,
  border: "1px solid #d7dee8",
  borderRadius: 10,
  padding: "0 9px",
  color: "#32445a",
  background: "white",
  fontWeight: 800,
};

const Header = ({
  user,
  onSignIn,
  onSignOut,
  onSendTestNotification,
  isLoading,
  cartItemCount = 0,
}: HeaderProps) => {
  const { language, setLanguage, t } = useI18n();

  return (
    <header style={headerStyle}>
      <div style={innerStyle}>
        <Link to="/" style={logoAreaStyle} aria-label="NewParts shop">
          <div style={logoStyle}>N</div>

          <div style={brandStyle}>
            <span style={brandNameStyle}>NEWPARTS</span>
            <span style={brandCaptionStyle}>{t("header.caption")}</span>
          </div>
        </Link>

        <div style={userSectionStyle}>
          <select
            style={languageSelectStyle}
            aria-label={t("header.language")}
            value={language}
            onChange={(event) => setLanguage(event.target.value as Language)}
          >
            <option value="me">CG</option>
            <option value="en">EN</option>
          </select>

          <Link to="/account" style={cartLinkStyle} aria-label={t("header.account")}>
            👤
          </Link>

          <Link to="/cart" style={cartLinkStyle} aria-label={t("header.cart")}>
            🛒
            {cartItemCount > 0 && (
              <span style={cartBadgeStyle}>{cartItemCount}</span>
            )}
          </Link>

          {user ? (
            <>
              <span style={usernameStyle}>@{user.username}</span>

              {user.roles.includes("core_team") && (
                <button
                  style={secondaryButtonStyle}
                  onClick={onSendTestNotification}
                  disabled={isLoading}
                  title="Send test notification"
                >
                  🔔
                </button>
              )}

              <button
                style={secondaryButtonStyle}
                onClick={onSignOut}
                disabled={isLoading}
              >
                {t("header.signOut")}
              </button>
            </>
          ) : (
            <button
              style={primaryButtonStyle}
              onClick={onSignIn}
              disabled={isLoading}
            >
              {t("header.signIn")}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
