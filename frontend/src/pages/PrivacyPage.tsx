import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../i18n";

const PrivacyPage = () => {
  const { privacy, t } = useI18n();

  useEffect(() => {
    document.title = t("privacy.titleTag");
  }, [t]);

  return (
    <main className="legal-page">
      <div className="shop-container legal-container">
        <Link className="back-link" to="/">
          {t("privacy.back")}
        </Link>

        <header className="legal-header">
          <p>{privacy.lastUpdated}</p>
          <h1>{privacy.title}</h1>
          <span>{privacy.intro}</span>
        </header>

        {privacy.sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {"list" in section && section.list && (
              <ul>
                {section.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </main>
  );
};

export default PrivacyPage;
