import { useEffect } from "react";
import { Link } from "react-router-dom";

const PrivacyPage = () => {
  useEffect(() => {
    document.title = "Privacy Policy | NewParts";
  }, []);

  return (
    <main className="legal-page">
      <div className="shop-container legal-container">
        <Link className="back-link" to="/">
          Nazad na shop
        </Link>

        <header className="legal-header">
          <p>Last updated: 25.09.2026.</p>
          <h1>Privacy Policy</h1>
          <span>
            Ova politika objašnjava kako NewParts može obrađivati podatke kada
            koristite našu ecommerce aplikaciju za nove auto djelove.
          </span>
        </header>

        <section>
          <h2>1. Podaci koje možemo obrađivati</h2>
          <p>
            Kada koristite NewParts, možemo obrađivati podatke potrebne za rad
            aplikacije, uključujući Pi identitet, Pi UID i korisničko ime ako
            koristite Pi Sign-In. Ako unesete adresu dostave, možemo čuvati ime
            i prezime, telefon, adresu, grad, poštanski broj, državu i slične
            podatke potrebne za isporuku.
          </p>
          <p>
            Takođe možemo čuvati istoriju porudžbina, stavke u porudžbini,
            status porudžbine, payment reference, status Pi plaćanja i tehničke
            podatke potrebne za sigurnost, sesije i osnovno funkcionisanje
            aplikacije.
          </p>
        </section>

        <section>
          <h2>2. Pi plaćanja i wallet podaci</h2>
          <p>
            NewParts koristi Pi Platform za autentifikaciju i plaćanja. Ne
            čuvamo Pi wallet private keys, seed phrase, lozinke walleta ili
            druge payment tajne. Backend može čuvati payment ID, status,
            reference i transaction ID kada je to potrebno za evidenciju
            porudžbine.
          </p>
        </section>

        <section>
          <h2>3. Svrhe obrade</h2>
          <p>Podatke možemo koristiti za:</p>
          <ul>
            <li>autentifikaciju i održavanje korisničke sesije;</li>
            <li>obradu porudžbine i prikaz istorije porudžbina;</li>
            <li>pripremu i organizaciju dostave;</li>
            <li>customer support i komunikaciju u vezi porudžbine;</li>
            <li>sigurnost, validaciju plaćanja i sprečavanje zloupotrebe;</li>
            <li>održavanje i poboljšanje stabilnosti aplikacije.</li>
          </ul>
        </section>

        <section>
          <h2>4. Cookies i sesije</h2>
          <p>
            Aplikacija koristi sesije i tehničke cookie mehanizme potrebne za
            prijavu, sigurnost i rad osnovnih funkcija. Ovi mehanizmi nijesu
            namijenjeni za prodaju ličnih podataka.
          </p>
        </section>

        <section>
          <h2>5. Third-party servisi</h2>
          <p>
            NewParts može koristiti Pi Network / Pi Platform za Pi Sign-In i Pi
            plaćanja, Render za hosting aplikacije i MongoDB hosting/database
            infrastrukturu za čuvanje podataka aplikacije.
          </p>
          <p>
            Cloudinary ili sličan media provider može biti korišćen za product
            media u budućoj fazi. Ne tvrdimo da trenutno obrađuje customer PII
            kroz NewParts osim ako takva integracija bude posebno uvedena.
          </p>
        </section>

        <section>
          <h2>6. Čuvanje podataka</h2>
          <p>
            Podatke čuvamo onoliko koliko je razumno potrebno za rad naloga,
            evidenciju porudžbina, podršku korisnicima, sigurnost i zakonske ili
            poslovne obaveze koje se mogu primjenjivati. Kada podaci više nijesu
            potrebni, možemo ih obrisati, anonimizovati ili arhivirati na
            bezbjedan način.
          </p>
        </section>

        <section>
          <h2>7. Korisnička prava</h2>
          <p>
            Možete zatražiti pristup, ispravku ili brisanje svojih podataka.
            Određeni podaci o porudžbinama ili plaćanjima mogu se čuvati duže
            ako su potrebni za sigurnost, evidenciju transakcija, rješavanje
            sporova ili primjenjive obaveze.
          </p>
        </section>

        <section>
          <h2>8. Sigurnost podataka</h2>
          <p>
            Nastojimo da koristimo razumne tehničke i organizacione mjere za
            zaštitu podataka, uključujući server-side validaciju plaćanja,
            autorizaciju za korisničke podatke i ograničen pristup internim
            sistemima. Nijedan online sistem nije potpuno bez rizika.
          </p>
        </section>

        <section>
          <h2>9. Djeca i maloljetnici</h2>
          <p>
            NewParts nije namijenjen djeci. Maloljetnici treba da koriste
            aplikaciju samo uz odgovarajuću saglasnost i nadzor roditelja ili
            staratelja, u skladu sa primjenjivim pravilima.
          </p>
        </section>

        <section>
          <h2>10. Promjene politike</h2>
          <p>
            Ovu politiku možemo povremeno ažurirati. Nova verzija biće
            objavljena na ovoj stranici sa ažuriranim datumom.
          </p>
        </section>

        <section>
          <h2>11. Kontakt</h2>
          <p>
            Za pitanja o privatnosti ili zahtjeve u vezi podataka kontaktirajte
            nas na: <strong>privacy@newparts.example</strong>. Ovaj kontakt je
            placeholder i biće zamijenjen zvaničnim kontaktom prije šire
            produkcione upotrebe.
          </p>
        </section>
      </div>
    </main>
  );
};

export default PrivacyPage;
