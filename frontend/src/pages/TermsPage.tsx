import { useEffect } from "react";
import { Link } from "react-router-dom";

const TermsPage = () => {
  useEffect(() => {
    document.title = "Terms of Service | NewParts";
  }, []);

  return (
    <main className="legal-page">
      <div className="shop-container legal-container">
        <Link className="back-link" to="/">
          Nazad na shop
        </Link>

        <header className="legal-header">
          <p>Last updated: 25.09.2026.</p>
          <h1>Terms of Service</h1>
          <span>
            Ovi uslovi uređuju korišćenje NewParts aplikacije za pregled i
            kupovinu novih auto djelova uz Pi Sign-In i Pi plaćanja.
          </span>
        </header>

        <section>
          <h2>1. Prihvatanje uslova</h2>
          <p>
            Korišćenjem NewParts aplikacije prihvatate ove uslove. Ako se ne
            slažete sa uslovima, nemojte koristiti aplikaciju.
          </p>
        </section>

        <section>
          <h2>2. Korišćenje aplikacije</h2>
          <p>
            NewParts omogućava pregled kataloga novih auto djelova, izbor
            vozila, dodavanje proizvoda u korpu i, kada je dostupno, plaćanje
            putem Pi Platforme. Aplikaciju morate koristiti zakonito i bez
            pokušaja zloupotrebe sistema, plaćanja ili korisničkih naloga.
          </p>
        </section>

        <section>
          <h2>3. Pi Sign-In i korisnički nalog</h2>
          <p>
            Određene funkcije zahtijevaju Pi Sign-In. Pi identitet koristimo za
            autentifikaciju, zaštitu porudžbina i povezivanje porudžbine sa
            ispravnim korisnikom. Vi ste odgovorni za sigurnost svog Pi naloga.
          </p>
        </section>

        <section>
          <h2>4. Proizvodi, dostupnost i cijene</h2>
          <p>
            Cijene su prikazane u Pi kada je Pi checkout dostupan. Dostupnost,
            stock i cijena proizvoda mogu se promijeniti prije potvrde
            kupovine. Porudžbina nije konačna dok plaćanje i order processing ne
            budu potvrđeni kroz aplikaciju.
          </p>
          <p>
            Slike, opisi, specifikacije i fitment podaci su informativni i mogu
            sadržati greške ili biti nepotpuni.
          </p>
        </section>

        <section>
          <h2>5. Kompatibilnost djelova</h2>
          <p>
            Vehicle selector i fitment informacije služe kao pomoć pri kupovini.
            Korisnik je odgovoran da prije kupovine provjeri da li dio odgovara
            njegovom vozilu, uključujući godinu, marku, model, podmodel,
            motor, opremu i druge relevantne karakteristike.
          </p>
        </section>

        <section>
          <h2>6. Porudžbine i potvrda</h2>
          <p>
            Nakon uspješnog checkout-a možemo prikazati osnovne podatke o
            porudžbini, status i istoriju porudžbina. Zadržavamo pravo da
            odbijemo ili poništimo porudžbinu ako validacija plaćanja, stock ili
            sigurnosne provjere ne prođu.
          </p>
        </section>

        <section>
          <h2>7. Dostava</h2>
          <p>
            Korisnik je odgovoran da unese tačnu adresu dostave. Dostava,
            vrijeme isporuke i eventualni troškovi dostave mogu zavisiti od
            lokacije, dostupnosti proizvoda i operativnih mogućnosti. Cijena
            dostave nije dio trenutnog product subtotal-a osim ako je posebno
            prikazana u checkout-u.
          </p>
        </section>

        <section>
          <h2>8. Returns i refunds</h2>
          <p>
            Povrati i refundacije su subject to applicable return/refund policy.
            Ako posebna return policy još nije objavljena u aplikaciji, uslovi
            povrata biće definisani kroz customer support ili posebnu politiku
            prije šire produkcione upotrebe. Ne obećavamo automatski refund
            sistem dok takva funkcionalnost nije posebno objavljena.
          </p>
        </section>

        <section>
          <h2>9. Zabranjena zloupotreba</h2>
          <p>
            Zabranjeno je pokušavati neovlašćen pristup, mijenjati payment
            metadata, zloupotrebljavati Pi identitet, ometati rad aplikacije,
            unositi lažne podatke ili koristiti aplikaciju na način koji može
            štetiti drugim korisnicima ili sistemu.
          </p>
        </section>

        <section>
          <h2>10. Intellectual property</h2>
          <p>
            NewParts naziv, UI, tekstovi, organizacija kataloga i drugi elementi
            aplikacije mogu biti zaštićeni pravima intelektualne svojine.
            Nazivi proizvođača, brendovi i oznake djelova mogu pripadati njihovim
            vlasnicima i koriste se radi identifikacije proizvoda.
          </p>
        </section>

        <section>
          <h2>11. Third-party services</h2>
          <p>
            Aplikacija se oslanja na third-party servise kao što su Pi Network /
            Pi Platform, hosting infrastruktura i database infrastruktura. Njihovi
            uslovi i politike mogu se primjenjivati na djelove usluge koje oni
            pružaju.
          </p>
        </section>

        <section>
          <h2>12. Ograničenje odgovornosti</h2>
          <p>
            U mjeri dozvoljenoj primjenjivim pravilima, NewParts nije odgovoran
            za indirektne, slučajne ili posljedične gubitke koji nastanu zbog
            korišćenja aplikacije, nedostupnosti servisa, netačnih fitment
            informacija ili third-party servisa. Ovo ne ograničava prava koja ne
            mogu biti ograničena zakonom.
          </p>
        </section>

        <section>
          <h2>13. Suspenzija ili prekid pristupa</h2>
          <p>
            Možemo ograničiti ili suspendovati pristup ako postoji sumnja na
            zloupotrebu, sigurnosni rizik, kršenje ovih uslova ili pokušaj
            manipulacije plaćanjem ili porudžbinama.
          </p>
        </section>

        <section>
          <h2>14. Promjene uslova</h2>
          <p>
            Ove uslove možemo povremeno ažurirati. Nastavak korišćenja
            aplikacije nakon objave izmjena znači da prihvatate ažurirane uslove.
          </p>
        </section>

        <section>
          <h2>15. Governing law</h2>
          <p>
            Primjenjivo pravo i nadležnost biće definisani u skladu sa poslovnim
            sjedištem i relevantnim pravilima prije šire produkcione upotrebe.
            Do tada, ove uslove treba tumačiti na razuman i neutralan način.
          </p>
        </section>

        <section>
          <h2>16. Kontakt</h2>
          <p>
            Za pitanja o ovim uslovima kontaktirajte nas na:
            <strong> support@newparts.example</strong>. Ovaj kontakt je
            placeholder i biće zamijenjen zvaničnim kontaktom.
          </p>
        </section>
      </div>
    </main>
  );
};

export default TermsPage;
