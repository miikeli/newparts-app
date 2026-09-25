import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../i18n";

const TermsPage = () => {
  const { terms, t } = useI18n();

  useEffect(() => {
    document.title = t("terms.titleTag");
  }, [t]);

  return (
    <main className="legal-page">
      <div className="shop-container legal-container">
        <Link className="back-link" to="/">
          {t("terms.back")}
        </Link>

        <header className="legal-header">
          <p>{terms.lastUpdated}</p>
          <h1>{terms.title}</h1>
          <span>{terms.intro}</span>
        </header>

        {terms.sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}
      </div>
    </main>
  );
};

export default TermsPage;
