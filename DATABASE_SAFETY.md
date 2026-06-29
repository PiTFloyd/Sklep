# PLANSZOWY ZAKĄTEK - DOKUMENTACJA BEZPIECZEŃSTWA BAZY DANYCH (SQLITE)

Ten projekt został wyposażony w **kuloodporny, 4-filarowy system bezpieczeństwa danych**. Poniższy dokument wyjaśnia krok po kroku, jak działają zaimplementowane mechanizmy oraz jak wdrożyć je na serwerze produkcyjnym (np. Ubuntu).

---

## FILAR 1: Bezpieczeństwo Wdrażania (Deployment Safety)

Podczas aktualizowania kodu aplikacji na serwerze kluczowe jest, aby pliki bazy danych nie zostały usunięte ani nadpisane nową wersją z repozytorium Git. Ponieważ klienci wprowadzają dane wyłącznie poprzez bezpieczne formularze, ochrona dotyczy bezpośrednio samego pliku bazy danych.

### 1. Wykluczenia w `.gitignore`
Plik `.gitignore` w katalogu głównym projektu został zaktualizowany i wyklucza z wersjonowania następujące zasoby:
* `db.sqlite`, `db.sqlite-shm`, `db.sqlite-wal` (baza danych oraz jej pliki tymczasowe WAL)
* `backups/` (lokalne, skompresowane kopie zapasowe)

### 2. Konfiguracja PM2 (`ecosystem.config.cjs`)
W katalogu głównym projektu znajduje się plik `ecosystem.config.cjs`. Zawiera on definicję procesów PM2 oraz automatyczną konfigurację wdrożeniową (Git Deploy). 

Gdy uruchomisz komendę wdrożenia przez PM2:
```bash
pm2 deploy production
```
PM2 automatycznie wywoła bezpieczny hook `pre-deploy`, który **uruchomi skrypt kopii zapasowej bezpośrednio przed pobraniem nowego kodu i restartem aplikacji**.

---

## FILAR 2: Bezpieczne Migracje (Database Migrations)

Aplikacja posiada w pełni autorski, **lekki i bezpieczny system migracji** (`src/db/migrations.ts` oraz `src/db/migrationEngine.ts`). Działa on automatycznie przy każdym uruchomieniu aplikacji.

* **Brak DROP TABLE**: Zmiany wprowadzane są metodą przyrostową (`ALTER TABLE`).
* **Idempotentność**: Migracje sprawdzają strukturę bazy za pomocą `PRAGMA table_info` przed dokonaniem zmian. Zapobiega to błędom w przypadku ponownego uruchomienia skryptu.
* **Transakcyjność**: Jeśli jakakolwiek migracja zakończy się błędem, cała baza zostaje wycofana do bezpiecznego stanu, a proces startowy serwera zostanie zatrzymany.

### Przykład Migracji (Dodanie kolumny `phone_number` bez utraty danych)
Zaimplementowany skrypt w `src/db/migrations.ts` realizuje to zadanie w bezpieczny sposób:

```typescript
{
  name: "001_add_phone_number",
  up: async (dbRun, dbAll) => {
    const columns = await dbAll("PRAGMA table_info(Users)");
    const hasPhoneNumber = columns.some(col => col.name === "phone_number");

    if (!hasPhoneNumber) {
      await dbRun("ALTER TABLE Users ADD COLUMN phone_number TEXT");
    }
  },
  down: async (dbRun, dbAll) => {
    await dbRun("ALTER TABLE Users DROP COLUMN phone_number");
  }
}
```

### Jak dodać nową migrację?
1. Otwórz plik `src/db/migrations.ts`.
2. Dodaj nowy obiekt migracji na końcu tablicy `MIGRATIONS`.
3. Zdefiniuj unikalną nazwę (np. `002_add_discount_code`) oraz funkcje `up` i `down`.
4. Gotowe! Silnik automatycznie wykryje i zaaplikuje nową migrację przy następnym starcie serwera.

---

## FILAR 3: Automatyczne Kopie Zapasowe (Cron Backup)

Kopie zapasowe są najważniejszym elementem strategii bezpieczeństwa (disaster recovery).

### 1. Skrypt kopii zapasowej (`scripts/backup.sh`)
Skrypt wykonuje **online backup** bazy danych (bezpieczny, nienaruszone transakcje WAL), kompresuje plik do `.tar.gz`, a na koniec kasuje kopie zapasowe starsze niż 30 dni.

Aby nadać uprawnienia do wykonywania skryptu na serwerze, uruchom:
```bash
chmod +x scripts/backup.sh
```

### 2. Konfiguracja Crona na Ubuntu (Codziennie o 3:00 w nocy)
Zaloguj się na serwer przez SSH jako użytkownik systemowy (np. `ubuntu`) i wpisz komendę:
```bash
crontab -e
```

Wklej na samym dole poniższą linię (pamiętaj o dostosowaniu ścieżki do folderu Twojej aplikacji):
```cron
0 3 * * * /bin/bash /var/www/planszowy-zakatek/scripts/backup.sh >> /var/www/planszowy-zakatek/backups/backup.log 2>&1
```

Skrypt będzie wykonywał się codziennie o 3:00 w nocy, a logi z jego działania zostaną zapisane w pliku `backups/backup.log`.

---

## FILAR 4: Integralność SQLite w Kodzie (Database Tuning)

W pliku `server.ts` zastosowano zaawansowane parametry połączenia `PRAGMA`, które eliminują ryzyko uszkodzenia pliku bazy w przypadku nagłej awarii zasilania lub błędu systemu operacyjnego:

1. **`PRAGMA journal_mode = WAL;`** (Write-Ahead Logging)
   Zamiast blokować bazę podczas zapisu, SQLite zapisuje transakcje do dedykowanego pliku dziennika (`db.sqlite-wal`). Umożliwia to jednoczesny odczyt i zapis przez wiele procesów bez ryzyka zakleszczenia bazy.
   
2. **`PRAGMA synchronous = NORMAL;`**
   W trybie WAL ustawienie to zapewnia pełną odporność na awarie samej aplikacji i systemu operacyjnego. Dane są bezpiecznie zapisywane na dysku przy punktach kontrolnych (checkpoints), co drastycznie zwiększa wydajność zapisu przy zachowaniu pełnego bezpieczeństwa.
   
3. **`PRAGMA foreign_keys = ON;`**
   Aktywuje sprawdzanie kluczy obcych i spójności relacji między tabelami (np. nie pozwala usunąć użytkownika, który posiada przypisane aktywne zamówienia).
   
4. **`PRAGMA busy_timeout = 5000;`**
   Jeśli baza danych zostanie zablokowana przez inną transakcję, aplikacja nie wyrzuci od razu błędu, lecz poczeka do 5 sekund na zwolnienie blokady.

---

## Podsumowanie Procedury Wdrożeniowej Krok po Kroku

Podczas pierwszego wdrożenia na nowy serwer Ubuntu:

1. **Sklonuj repozytorium**: `git clone <repo_url> /var/www/planszowy-zakatek`
2. **Zainstaluj zależności**: `npm install`
3. **Zainicjalizuj strukturę bazy danych (Jednorazowo)**: `npm run db:init`
4. **Zasiej domyślne dane i konta (Jednorazowo)**: `npm run db:seed`
5. **Zbuduj aplikację**: `npm run build`
6. **Zezwól na wykonywanie backupu**: `chmod +x scripts/backup.sh`
7. **Wykonaj pierwszy próbny backup**: `./scripts/backup.sh`
8. **Dodaj skrypt do Crona**: `crontab -e` i dodaj wpis o 3:00 w nocy.
9. **Uruchom aplikację pod kontrolą PM2**: `pm2 start ecosystem.config.cjs --env production`
10. **Zapisz konfigurację PM2**: `pm2 save && pm2 startup`
