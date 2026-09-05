import type { CSSProperties } from "react";
import type { User } from "../types/pi.ts";

interface HeaderProps {
  onSignIn: () => void;
  onSignOut: () => void;
  onSendTestNotification: () => void;
  user: User | null;
  isLoading?: boolean;
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

const Header = ({
  user,
  onSignIn,
  onSignOut,
  onSendTestNotification,
  isLoading,
}: HeaderProps) => {
  return (
    <header style={headerStyle}>
      <div style={innerStyle}>
        <div style={logoAreaStyle}>
          <div style={logoStyle}>N</div>

          <div style={brandStyle}>
            <span style={brandNameStyle}>NEWPARTS</span>
            <span style={brandCaptionStyle}>Novi auto djelovi</span>
          </div>
        </div>

        <div style={userSectionStyle}>
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
                Odjava
              </button>
            </>
          ) : (
            <button
              style={primaryButtonStyle}
              onClick={onSignIn}
              disabled={isLoading}
            >
              Pi prijava
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;