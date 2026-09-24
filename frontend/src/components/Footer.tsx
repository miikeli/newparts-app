import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="site-footer">
    <div className="shop-container site-footer-inner">
      <div>
        <strong>NEWPARTS</strong>
        <span>Novi auto djelovi uz Pi plaćanje</span>
      </div>
      <nav aria-label="Legal navigation">
        <Link to="/privacy">Privacy Policy</Link>
        <Link to="/terms">Terms of Service</Link>
      </nav>
    </div>
  </footer>
);

export default Footer;
