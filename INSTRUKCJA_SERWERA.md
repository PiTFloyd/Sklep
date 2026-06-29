# INSTRUKCJA WDRAŻANIA, MIGRACJI I OBSŁUGI APLIKACJI "PLANSZOWY ZAKĄTEK"

Niniejszy dokument stanowi kompletny przewodnik dla administratorów, programistów oraz wdrożeniowców. Wyjaśnia krok po kroku, jak zainstalować aplikację na czystym serwerze VPS, jak zarządzać strukturą bazy danych przy użyciu autorskiego systemu migracji oraz jak działają poszczególne moduły funkcjonalne systemu.

---

## 1. PROCES INSTALACYJNY NA CZYSTYM SERWERZE VPS

Poniższa instrukcja zakłada, że posiadasz **czysty serwer** z systemem operacyjnym **Ubuntu 22.04 LTS / 24.04 LTS** bez zainstalowanych jakichkolwiek usług (brak Node.js, Nginx, PM2, bazy danych czy certyfikatów SSL).

### KROK 1: Aktualizacja pakietów systemowych
Przed instalacją czegokolwiek należy zsynchronizować listę pakietów oraz zaktualizować system do najnowszych wersji stabilnych. Zapobiega to konfliktom bibliotek.
```bash
sudo apt update && sudo apt upgrade -y
```
* **Co to powoduje:** `apt update` pobiera aktualne listy pakietów z repozytoriów, a `apt upgrade -y` instaluje najnowsze poprawki bezpieczeństwa i aktualizacje systemowe bez pytania o potwierdzenie.

### KROK 2: Instalacja narzędzi kompilacji i pobierania
Niektóre pakiety npm (w tym SQLite) wymagają kompilacji kodu C++ podczas instalacji.
```bash
sudo apt install build-essential curl git -y
```
* **Co to powoduje:** Instaluje kompilatory `gcc`, `g++` oraz narzędzia `make`, niezbędne do budowania natywnych bibliotek Node.js. Instaluje również `curl` (do pobierania skryptów) oraz `git` (do pobrania kodu aplikacji).

### KROK 3: Instalacja Node.js (wersja 20 LTS)
Zalecanym sposobem instalacji Node.js na czystym serwerze jest użycie menedżera wersji **NVM** (Node Version Manager) lub oficjalnego repozytorium **NodeSource**. Tutaj użyjemy NodeSource dla instalacji systemowej.
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```
* **Co to powoduje:** Pobiera skrypt instalacyjny dystrybucji NodeSource dla wersji Node.js 20.x, dodaje klucze GPG do bazy zaufanych źródeł systemowych, a następnie instaluje stabilną wersję `nodejs` oraz menedżer pakietów `npm`.
* **Weryfikacja:** Sprawdź poprawność instalacji komendami: `node -v` oraz `npm -v`.

### KROK 4: Pobranie kodu aplikacji (Klonowanie repozytorium)
Przejdź do katalogu `/var/www` (standardowe miejsce dla aplikacji webowych) i sklonuj repozytorium.
```bash
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www
git clone <URL_REPOZYTORIUM_PLANSZOWY_ZAKATEK> planszowy-zakatek
cd planszowy-zakatek
```
* **Co to powoduje:** Tworzy strukturę katalogów pod serwer WWW, nadaje uprawnienia aktualnemu użytkownikowi, pobiera najnowszą wersję kodu źródłowego z Git i przechodzi do folderu projektu.

### KROK 5: Instalacja zależności produkcyjnych i deweloperskich
Instalujemy wszystkie pakiety zdefiniowane w pliku `package.json`.
```bash
npm install
```
* **Co to powoduje:** Odczytuje plik `package.json` oraz `package-lock.json`, pobiera precyzyjnie określone wersje bibliotek (React, Express, SQLite3, TypeScript itp.) do katalogu `node_modules`.

### KROK 6: Inicjalizacja struktury bazy danych (SQLite)
Inicjalizujemy bazę danych przy użyciu wydzielonego skryptu instalacji bazy.
```bash
npm run db:init
```
* **Co to powoduje:** Skrypt `src/db/initDb.ts` wykonuje następujące operacje:
  1. Tworzy plik bazy danych `db.sqlite` w katalogu głównym projektu (jeśli jeszcze nie istnieje).
  2. Włącza tryb **WAL** (Write-Ahead Logging) dla bazy SQLite, co diametralnie przyspiesza zapisy i zapobiega blokowaniu bazy przez jednoczesne zapytania odczytu.
  3. Konfiguruje parametry integracji (`foreign_keys = ON`, `busy_timeout = 5000`).
  4. Wykonuje system migracji (`runMigrations`), tworząc tabelę `_migrations` i aplikując oczekujące migracje.
  5. Tworzy puste tabele systemowe: `Users`, `Products`, `Orders` wraz ze wszystkimi niezbędnymi kolumnami (dbając o to, by nie nadpisać istniejących struktur dzięki klauzulom `IF NOT EXISTS` oraz bezpiecznym procedurom dodawania kolumn `ALTER TABLE`).

### KROK 7: Zasilenie bazy danych (Seeding)
Wgrywamy domyślne dane startowe aplikacji.
```bash
npm run db:seed
```
* **Co to powoduje:** Skrypt `src/db/seedDb.ts` wykonuje bezpieczne zasilenie danymi:
  1. Sprawdza, czy w tabeli `Users` istnieją konta testowe. Jeśli nie, tworzy konto administratora (`admin` z hasłem `admin`, rola `Owner`) oraz konto klienta (`klient` z hasłem `klient`, rola `Client` i wypełnionymi danymi wysyłkowymi).
  2. Sprawdza liczbę produktów w tabeli `Products`. Jeśli tabela jest pusta (wynosi 0), wstrzykuje zestaw 40 najpopularniejszych gier planszowych wraz z parametrami (cena, czas gry, gracze, losowy stan magazynowy, opisy i zdjęcia).
  3. Jeśli baza posiada już produkty, skrypt pomija ten krok, co chroni przed dublowaniem rekordów lub utratą danych wprowadzonych przez użytkownika.

### KROK 8: Budowa aplikacji produkcyjnej (Build)
Kompilujemy kod źródłowy TypeScript/React do formatu produkcyjnego.
```bash
npm run build
```
* **Co to powoduje:**
  1. Kompilator Vite przetwarza pliki frontendu (React z TS i Tailwind CSS), minimalizuje kod, optymalizuje zasoby i zapisuje statyczne pliki w katalogu `/dist`.
  2. Narzędzie `esbuild` kompiluje serwer backendu (`server.ts`) z formatu TypeScript do jednego zoptymalizowanego pliku CommonJS o nazwie `dist/server.cjs`. Rozwiązuje to wszelkie problemy z importami ścieżek relatywnych w środowisku Node.

### KROK 9: Konfiguracja PM2 (Menedżera Procesów)
PM2 dba o to, by nasza aplikacja działała nieprzerwanie w tle, uruchamiała się automatycznie po awarii lub restarcie serwera.
```bash
sudo npm install -g pm2
pm2 start ecosystem.config.cjs --env production
pm2 startup
```
* **Co to powoduje:** Instaluje PM2 globalnie w systemie. Następnie uruchamia proces serwera aplikacji w trybie produkcyjnym na bazie pliku konfiguracyjnego `ecosystem.config.cjs`. Komenda `pm2 startup` wygeneruje skrypt systemd, który należy skopiować i uruchomić w terminalu (z uprawnieniami `sudo`), aby PM2 wstawał wraz z serwerem.
* **Zapisanie stanu:** Po wykonaniu polecenia startup, wpisz: `pm2 save`.

### KROK 10: Instalacja i konfiguracja Nginx jako Reverse Proxy
Użytkownicy nie powinni łączyć się bezpośrednio z aplikacją na porcie 3000. Nginx posłuży jako bezpieczny i wydajny pośrednik.
```bash
sudo apt install nginx -y
```
Następnie edytujemy domyślną konfigurację strony w Nginx:
```bash
sudo nano /etc/nginx/sites-available/default
```
Zastąp zawartość pliku poniższą konfiguracją (zmień `twoja-domena.pl` na swoją rzeczywistą domenę):
```nginx
server {
    listen 80;
    server_name twoja-domena.pl www.twoja-domena.pl;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```
Zapisz plik (`Ctrl+O`, `Enter`, `Ctrl+X`) i zrestartuj Nginx:
```bash
sudo nginx -t
sudo systemctl restart nginx
```
* **Co to powoduje:** Instaluje serwer WWW Nginx, konfiguruje przekierowywanie całego ruchu z portu 80 (HTTP) na port lokalny 3000, na którym pracuje nasza aplikacja Node.js. Przekazuje również nagłówki IP użytkownika, co pozwala na poprawne logowanie i analizę bezpieczeństwa.

### KROK 11: Konfiguracja Zapory Sieciowej (UFW)
Blokujemy bezpośredni dostęp do portu 3000 z zewnątrz, zostawiając otwarte tylko niezbędne porty.
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```
* **Co to powoduje:** Zezwala na połączenia SSH (port 22) oraz ruch HTTP/HTTPS (porty 80/443) obsługiwany przez Nginx. Blokuje wszelkie inne próby połączeń do serwera.

### KROK 12: Zabezpieczenie certyfikatem SSL Let's Encrypt (HTTPS)
Instalujemy darmowy, automatycznie odnawiany certyfikat SSL dla naszej domeny.
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d twoja-domena.pl -d www.twoja-domena.pl
```
* **Co to powoduje:** Pobiera narzędzie Certbot, komunikuje się z urzędem certyfikacji Let's Encrypt, weryfikuje własność domeny, generuje klucze kryptograficzne, instaluje certyfikat SSL bezpośrednio w konfiguracji Nginx oraz konfiguruje automatyczne przekierowanie całego ruchu z HTTP na bezpieczny protokół HTTPS (port 443).

---

## 2. SYSTEM MIGRACJI BAZY DANYCH (MIGRATION ENGINE)

Nasz projekt korzysta z **dedykowanego, transakcyjnego silnika migracji bazy danych**. Pozwala on na bezkonfliktowe aktualizowanie schematu bazy danych (dodawanie tabel, kolumn, indeksów) na działającym serwerze produkcyjnym, bez ryzyka utraty wprowadzonych przez użytkowników danych.

### Jak działają migracje w teorii?
Silnik migracji śledzi, które skrypty SQL zostały już wykonane, zapisując ich nazwy w specjalnej systemowej tabeli o nazwie `_migrations`. 
Podczas uruchomienia komendy inicjalizacji bazy danych (`npm run db:init`):
1. Silnik sprawdza, czy tabela `_migrations` istnieje. Jeśli nie, tworzy ją.
2. Odczytuje z bazy listę już zaaplikowanych migracji.
3. Porównuje ją z listą zdefiniowaną w pliku `src/db/migrations.ts`.
4. Wykonuje **tylko te migracje**, które jeszcze nie były uruchomione. Każda migracja jest wykonywana w **bezpiecznej transakcji SQLite** (jeśli krok się nie powiedzie, cała operacja zostanie cofnięta).

### Jak krok po kroku stworzyć nową migrację?

Załóżmy, że chcesz dodać nową tabelę `Reviews` (opinie o grach) oraz dodać nową kolumnę `discount` do tabeli `Products`.

#### Krok 1: Otwórz plik z migracjami
Otwórz plik `src/db/migrations.ts` w swoim edytorze kodu.

#### Krok 2: Zdefiniuj nową migrację w tablicy `MIGRATIONS`
Dopisz nowy obiekt migracji na końcu tablicy `MIGRATIONS`. Każda migracja musi mieć unikalną nazwę (dobrą praktyką jest stosowanie formatu z datą, np. `20260629_add_reviews_and_discount`) oraz zapytanie SQL.

```typescript
// Przykład modyfikacji pliku src/db/migrations.ts
export const MIGRATIONS: Migration[] = [
  // ... dotychczasowe migracje (NIE modyfikuj ich ani nie usuwaj!)
  
  {
    name: "20260629_add_reviews_and_discount",
    sql: `
      -- 1. Dodanie kolumny rabatu do tabeli produktów
      ALTER TABLE Products ADD COLUMN discount REAL DEFAULT 0.0;

      -- 2. Utworzenie nowej tabeli opinii użytkowników
      CREATE TABLE IF NOT EXISTS Reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        username TEXT,
        rating INTEGER CHECK(rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE CASCADE
      );
    `
  }
];
```

#### Krok 3: Uruchomienie migracji
Gdy kod nowej migracji znajdzie się na serwerze, wystarczy uruchomić:
```bash
npm run db:init
```
* **Co się stanie:** Silnik migracyjny odczyta tabelę `_migrations`, zorientuje się, że migracje wstępne już tam widnieją, znajdzie nową migrację `20260629_add_reviews_and_discount`, otworzy transakcję, doda kolumnę `discount` do bazy, utworzy tabelę `Reviews` i na koniec doda wpis `20260629_add_reviews_and_discount` do tabeli `_migrations`.
* **Dlaczego to jest w 100% bezpieczne:** 
  1. Istniejące dane w tabeli `Products` (oraz innych tabelach) pozostaną nienaruszone.
  2. Gdyby w zapytaniu SQL wkradł się błąd składniowy (np. literówka w słowie `CREATE`), cała transakcja zostanie natychmiast wycofana (rollback), zapobiegając uszkodzeniu bazy danych lub pozostawieniu jej w stanie niespójnym.
  3. Kolejne uruchomienie polecenia `npm run db:init` nie wykona tej migracji ponownie, ponieważ jej nazwa jest już zapisana w tabeli `_migrations` (pełna idempotencja).

---

## 3. OPIS ZAGADNIEŃ I FUNKCJONALNOŚCI STRONY (DLA UŻYTKOWNIKA)

Aplikacja "Planszowy Zakątek" to nowoczesna, w pełni responsywna platforma e-commerce dedykowana pasjonatom gier planszowych. Poniżej znajduje się szczegółowe wyjaśnienie poszczególnych modułów i pojęć występujących w systemie:

### A. Katalog Gier (Sklep / Strona Główna)
To serce aplikacji. Umożliwia przeglądanie dostępnego asortymentu planszówek.
* **Filtrowanie i wyszukiwanie:** Użytkownik może wyszukiwać gry po nazwie wpisanej w wyszukiwarkę, a także filtrować je według:
  * *Kategorii:* Rodzinne, Strategiczne, Imprezowe, Przygodowe, Karciane, Ekonomiczne.
  * *Liczby graczy:* Filtr dynamicznie porównuje wpisaną liczbę z przedziałem `min_players` oraz `max_players` zdefiniowanym dla każdej gry w bazie danych.
  * *Czasu rozgrywki:* Filtrowanie gier na szybkie (do 30 min), średnie (30-90 min) oraz długie, wielogodzinne strategie (powyżej 90 min).
* **Stany magazynowe (Stock):** Każdy produkt ma przypisaną skończoną liczbę dostępnych sztuk w magazynie. Próba dodania do koszyka większej liczby sztuk niż pozwala na to stan magazynowy jest blokowana na poziomie interfejsu oraz walidowana po stronie serwera API.

### B. System Autoryzacji i Zarządzanie Sesją (JWT & Cookies)
System autoryzacji chroni wrażliwe operacje i personalizuje doświadczenie zakupowe użytkowników.
* **Tokeny JWT (JSON Web Tokens):** Po pomyślnym zalogowaniu, serwer generuje zaszyfrowany token zawierający identyfikator użytkownika oraz jego rolę systemową. Token ten jest przechowywany w przeglądarce w bezpiecznym ciasteczku (Cookie).
* **Rola: Owner (Właściciel / Administrator):** Posiada pełne uprawnienia do zarządzania sklepem. Widzi specjalne zakładki w panelu administracyjnym, może edytować asortyment, zarządzać bazą użytkowników oraz aktualizować statusy zamówień wszystkich klientów.
* **Rola: Client (Klient):** Standardowy profil kupującego. Może składać zamówienia, zarządzać swoim wirtualnym koszykiem, edytować własne dane adresowe oraz przeglądać historię swoich zakupów.

### C. Koszyk zakupowy, Ceny i Kasy (Cart & Checkout)
Umożliwia gromadzenie produktów i finalizację transakcji.
* **Sesja koszyka:** Produkty dodane do koszyka są zapisywane w stanie sesji użytkownika. Dla zalogowanych klientów, ich koszyk jest automatycznie synchronizowany z bazą danych (kolumna `cart` w tabeli `Users`), co pozwala na dokończenie zakupów na dowolnym urządzeniu bez utraty wybranych gier.
* **Dostawa (Delivery Types):** System obsługuje trzy formy dostawy:
  * *Kurier (Dostawa do domu):* Wymaga podania pełnego adresu. Koszt dostawy jest automatycznie doliczany do sumy zamówienia.
  * *Paczkomat:* Integracja z systemem map/wyboru punktów odbioru (lub wpisanie identyfikatora paczkomatu).
  * *Odbiór osobisty:* Darmowy odbiór bezpośrednio w sklepie stacjonarnym w Rzeszowie. Wyłącza konieczność podawania danych adresowych dostawy.

### D. Panel Klienta
Zindywidualizowane centrum dowodzenia każdego zalogowanego kupującego.
* **Zarządzanie danymi adresowymi:** Klient może zapisać swoje domyślne dane (imię, nazwisko, adres, miasto, kod pocztowy, telefon, e-mail). Dane te będą automatycznie podstawiały się podczas kolejnych zakupów, co minimalizuje czas potrzebny na realizację zamówienia.
* **Historia zamówień:** Lista wszystkich transakcji sfinalizowanych przez danego klienta. Zawiera unikalny numer zamówienia, datę złożenia, sumę, szczegółową listę kupionych gier wraz z cenami jednostkowymi oraz aktualny stan realizacji.

### E. Panel Administratora (Właściciela)
Dostępny wyłącznie dla użytkowników z uprawnieniem `Owner`. Umożliwia operacyjne prowadzenie biznesu.
* **Asortyment (Zarządzanie Produktami):**
  * *Dodawanie:* Formularz umożliwia dodanie nowej gry (nazwa, kategoria, opis, min/max graczy, czas, cena, stan magazynowy oraz URL zdjęcia).
  * *Edycja:* Możliwość korygowania cen, poprawiania opisów czy aktualizacji zdjęć gier.
  * *Zarządzanie magazynem (Stock):* Bezpośrednie zwiększanie lub zmniejszanie liczby sztuk gier na stanie.
  * *Usuwanie:* Bezpieczne usuwanie gier z oferty sklepu (z walidacją relacji w bazie).
* **Zamówienia (Zarządzanie Zamówieniami):**
  * *Podgląd globalny:* Lista zamówień od wszystkich klientów, posortowana od najnowszych.
  * *Aktualizacja statusów:* Administrator może zmieniać stany zamówień:
    * **Nowe / Oczekujące:** Zamówienie złożone, oczekuje na weryfikację lub wpłatę.
    * **Wysłane:** Towar został spakowany i przekazany przewoźnikowi. Automatycznie aktualizuje stan magazynowy produktów.
    * **Zrealizowane:** Zamówienie odebrane przez klienta, transakcja zamknięta.
    * **Anulowane:** Zamówienie wycofane (np. na prośbę klienta lub brak wpłaty). Przywraca zarezerwowane sztuki gier z powrotem na stan magazynowy.
* **Zarządzanie Użytkownikami:**
  * Lista wszystkich zarejestrowanych osób w systemie.
  * Możliwość awansowania klienta do rangi `Owner` (np. przy zatrudnianiu nowego pracownika do obsługi sklepu) lub blokowania kont.

---

## 4. SPÓJNOŚĆ I STABILNOŚĆ BAZY DANYCH

Aby zapewnić maksymalne bezpieczeństwo i stabilność działania sklepu, system został wyposażony w potrójną linię ochrony spójności danych:
1. **Klucze Obce (Foreign Keys):** SQLite pilnuje relacji między tabelami. Usunięcie użytkownika lub produktu nie spowoduje "osierocenia" zamówień w bazie, ponieważ relacje są chronione odpowiednimi klauzulami (np. `ON DELETE CASCADE` lub `ON DELETE SET NULL`).
2. **Wielodostępność (WAL Mode):** Dzięki uruchomieniu bazy w trybie Write-Ahead Logging, jednoczesne zakupy wielu użytkowników nie powodują blokad zapisu ani błędów "Database is locked".
3. **Izolacja Skryptów (Init vs. Seed):** Całkowite odseparowanie skryptu tworzącego tabele (`initDb.ts`) od skryptu wstrzykującego dane testowe (`seedDb.ts`) gwarantuje, że ponowne wdrożenie kodu, restart serwera lub aktualizacja bazy na produkcji **nigdy przypadkowo nie usunie danych klientów ani nie nadpisze bazy danych**.
