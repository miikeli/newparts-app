import { Link } from "react-router-dom";
import { useI18n } from "../i18n";

const Footer = () => {
  const { t } = useI18n();

  return (
    <footer className="site-footer">
      <div className="shop-container site-footer-inner">
        <div>
          <strong>NEWPARTS</strong>
          <span>{t("footer.tagline")}</span>
        </div>
        <nav aria-label="Legal navigation">
          <Link to="/privacy">{t("footer.privacy")}</Link>
          <Link to="/terms">{t("footer.terms")}</Link>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
