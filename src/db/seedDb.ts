/**
 * ==============================================================================
 * PLANSZOWY ZAKĄTEK - STANDALONE DATABASE SEEDING SCRIPT
 * ==============================================================================
 * Description: This script can be executed on the server or in development
 *              to safely seed default accounts (admin & klient) and default products
 *              into an already initialized database structure.
 * Usage: npm run db:seed OR npx tsx src/db/seedDb.ts
 * ==============================================================================
 */

import path from "path";
import sqlite3 from "sqlite3";

const DB_FILE = path.join(process.cwd(), "db.sqlite");

console.log(`Starting Database Seeding on: ${DB_FILE}`);

const db = new sqlite3.Database(DB_FILE, async (err) => {
  if (err) {
    console.error("Failed to open SQLite database during seeding:", err.message);
    process.exit(1);
  }

  console.log("Connected to SQLite Database. Starting data seeding...");

  try {
    // Helper query functions inside connection scope
    const dbRun = (sql: string, params: any[] = []): Promise<{ id: number; changes: number }> => {
      return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, changes: this.changes });
        });
      });
    };

    const dbGet = <T = any>(sql: string, params: any[] = []): Promise<T | undefined> => {
      return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
          if (err) reject(err);
          else resolve(row as T | undefined);
        });
      });
    };

    // 1. Seed default Users (Admin & Client) if they do not exist
    const adminUser = await dbGet("SELECT * FROM Users WHERE username = ?", ["admin"]);
    if (!adminUser) {
      await dbRun("INSERT INTO Users (username, password, role) VALUES (?, ?, ?)", ["admin", "admin", "Owner"]);
      console.log("Admin account seeded successfully (admin / admin).");
    } else {
      console.log("Admin account already exists.");
    }

    const clientUser = await dbGet("SELECT * FROM Users WHERE username = ?", ["klient"]);
    if (!clientUser) {
      await dbRun(
        `INSERT INTO Users (username, password, role, firstName, lastName, email, phone, address, city, zipCode) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ["klient", "klient", "Client", "Jan", "Kowalski", "jan.kowalski@gmail.com", "500600700", "Rynek 10", "Rzeszów", "35-001"]
      );
      console.log("Client account seeded successfully (klient / klient).");
    } else {
      // Update existing klient user so they have testing data prepopulated
      await dbRun(
        `UPDATE Users SET 
          firstName = COALESCE(firstName, 'Jan'), 
          lastName = COALESCE(lastName, 'Kowalski'), 
          email = COALESCE(email, 'jan.kowalski@gmail.com'), 
          phone = COALESCE(phone, '500600700'), 
          address = COALESCE(address, 'Rynek 10'), 
          city = COALESCE(city, 'Rzeszów'), 
          zipCode = COALESCE(zipCode, '35-001') 
         WHERE username = 'klient'`
      );
      console.log("Client account validated and kept.");
    }

    // 2. Seed default products if the Products table is completely empty
    const productCount = await dbGet<{ count: number }>("SELECT COUNT(*) as count FROM Products");
    if (productCount && productCount.count === 0) {
      console.log("Products table is empty. Seeding board games list...");
      await seedProducts(dbRun);
    } else {
      console.log(`Products table already contains ${productCount?.count || 0} items. Skipping seeding to prevent duplicate data.`);
    }

    console.log("Seeding process completed successfully!");
    
    // Close connection cleanly
    db.close((closeErr) => {
      if (closeErr) {
        console.error("Error closing database connection after seeding:", closeErr.message);
        process.exit(1);
      } else {
        console.log("Database connection closed.");
        process.exit(0);
      }
    });

  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
});

async function seedProducts(dbRun: (sql: string, params?: any[]) => Promise<any>) {
  const productsSeed = [
    {
      name: "Catan (Osadnicy z Catanu)",
      price: 129.99,
      category: "Rodzinne",
      image: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&q=80&w=600",
      description: "Klasyczna gra o budowaniu osad, rozwijaniu dróg i handlu surowcami na wyspie Catan.",
      min_players: 3,
      max_players: 4,
      play_time: 75
    },
    {
      name: "Wsiąść do Pociągu: Europa",
      price: 149.00,
      category: "Rodzinne",
      image: "https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&q=80&w=600",
      description: "Zbuduj swoje kolejowe imperium w Europie! Łącz miasta, stawiaj dworce i realizuj tajne bilety.",
      min_players: 2,
      max_players: 5,
      play_time: 45
    },
    {
      name: "Carcassonne",
      price: 119.50,
      category: "Rodzinne",
      image: "https://images.unsplash.com/photo-1611195974226-a6a9be9dd763?auto=format&fit=crop&q=80&w=600",
      description: "Układaj kafelki terenu, twórz średniowieczne krajobrazy i kontroluj je swoimi poddanymi.",
      min_players: 2,
      max_players: 5,
      play_time: 40
    },
    {
      name: "Dixit",
      price: 114.99,
      category: "Imprezowe",
      image: "https://images.unsplash.com/photo-1629981879703-35058ae99b7a?auto=format&fit=crop&q=80&w=600",
      description: "Przepięknie ilustrowana gra skojarzeń, w której ogranicza Cię tylko własna wyobraźnia.",
      min_players: 3,
      max_players: 8,
      play_time: 30
    },
    {
      name: "Splendor",
      price: 124.99,
      category: "Rodzinne",
      image: "https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&q=80&w=600",
      description: "Zostań renesansowym kupcem, zbieraj drogocenne klejnoty i przyciągaj bogatych arystokratów.",
      min_players: 2,
      max_players: 4,
      play_time: 30
    },
    {
      name: "Terraformacja Marsa",
      price: 189.00,
      category: "Strategiczne",
      image: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&q=80&w=600",
      description: "Kieruj potężną korporacją i przekształć Czerwoną Planetę w miejsce zdatne do życia ludzkiego.",
      min_players: 1,
      max_players: 5,
      play_time: 120
    },
    {
      name: "Na Skrzydłach (Wingspan)",
      price: 199.99,
      category: "Strategiczne",
      image: "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&q=80&w=600",
      description: "Odkrywaj i przyciągaj najpiękniejsze gatunki ptaków do swoich rezerwatów przyrody.",
      min_players: 1,
      max_players: 5,
      play_time: 70
    },
    {
      name: "Nemesis",
      price: 499.00,
      category: "Przygodowe",
      image: "https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&q=80&w=600",
      description: "Klimatyczny i wymagający survival horror na statku kosmicznym opanowanym przez Intruzów.",
      min_players: 1,
      max_players: 5,
      play_time: 150
    },
    {
      name: "Gloomhaven: Szczęki Lwa",
      price: 229.00,
      category: "Przygodowe",
      image: "https://images.unsplash.com/photo-1585504198199-20277593b94f?auto=format&fit=crop&q=80&w=600",
      description: "W pełni kooperacyjna gra kampanijna z elementami RPG i taktyczną walką bez kości.",
      min_players: 1,
      max_players: 4,
      play_time: 90
    },
    {
      name: "Dobble",
      price: 49.00,
      category: "Imprezowe",
      image: "https://images.unsplash.com/photo-1629981879703-35058ae99b7a?auto=format&fit=crop&q=80&w=600",
      description: "Sprawdź swój refleks i spostrzegawczość. Znajdź wspólny symbol między dwiema kartami!",
      min_players: 2,
      max_players: 8,
      play_time: 15
    },
    {
      name: "Tajniacy",
      price: 69.00,
      category: "Imprezowe",
      image: "https://images.unsplash.com/photo-1611195974226-a6a9be9dd763?auto=format&fit=crop&q=80&w=600",
      description: "Dwie drużyny rywalizują o jak najszybsze nawiązanie kontaktu ze wszystkimi swoimi agentami.",
      min_players: 2,
      max_players: 8,
      play_time: 15
    },
    {
      name: "Everdell",
      price: 239.00,
      category: "Strategiczne",
      image: "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&q=80&w=600",
      description: "Rozwijaj leśną cywilizację uroczych zwierzątek, stawiaj budynki i przygotuj się na nadejście zimy.",
      min_players: 1,
      max_players: 4,
      play_time: 80
    },
    {
      name: "Azul",
      price: 149.00,
      category: "Rodzinne",
      image: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&q=80&w=600",
      description: "Zaprojektuj i wykafelkuj ściany pałacu królewskiego w Evorze przepięknymi płytkami azulejos.",
      min_players: 2,
      max_players: 4,
      play_time: 45
    },
    {
      name: "Wirus!",
      price: 39.00,
      category: "Karciane",
      image: "https://images.unsplash.com/photo-1629981879703-35058ae99b7a?auto=format&fit=crop&q=80&w=600",
      description: "Szybka gra karciana, w której musisz skompletować cztery zdrowe organy, zarażając rywali.",
      min_players: 2,
      max_players: 6,
      play_time: 20
    },
    {
      name: "Horror w Arkham LCG",
      price: 159.00,
      category: "Karciane",
      image: "https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&q=80&w=600",
      description: "Wejdź w świat horroru H.P. Lovecrafta w tej genialnej, stale rozwijanej kooperacyjnej karciance.",
      min_players: 1,
      max_players: 2,
      play_time: 60
    },
    {
      name: "7 Cudów Świata: Pojedynek",
      price: 109.00,
      category: "Strategiczne",
      image: "https://images.unsplash.com/photo-1611195974226-a6a9be9dd763?auto=format&fit=crop&q=80&w=600",
      description: "Znakomity dwuosobowy pojedynek, w którym prowadzisz swoją cywilizację ku naukowej lub militarnej dominacji.",
      min_players: 2,
      max_players: 2,
      play_time: 30
    },
    {
      name: "Root",
      price: 249.00,
      category: "Strategiczne",
      image: "https://images.unsplash.com/photo-1585504198199-20277593b94f?auto=format&fit=crop&q=80&w=600",
      description: "Wspaniała asymetryczna gra wojenna, w której każda z frakcji leśnych stworzeń ma zupełnie inne zasady.",
      min_players: 2,
      max_players: 4,
      play_time: 90
    },
    {
      name: "Scythe",
      price: 299.00,
      category: "Strategiczne",
      image: "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&q=80&w=600",
      description: "Alternatywne lata 20. XX wieku w Europa Wschodniej. Buduj fabryki, kontroluj mechy i gromadź wpływy.",
      min_players: 1,
      max_players: 5,
      play_time: 115
    },
    {
      name: "Podróże przez Śródziemie",
      price: 379.00,
      category: "Przygodowe",
      image: "https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&q=80&w=600",
      description: "Wyrusz w podróż po świecie Tolkiena wraz ze swoimi towarzyszami w kooperacyjnej grze z aplikacją mobilną.",
      min_players: 1,
      max_players: 5,
      play_time: 120
    },
    {
      name: "Mindbug",
      price: 59.00,
      category: "Karciane",
      image: "https://images.unsplash.com/photo-1629981879703-35058ae99b7a?auto=format&fit=crop&q=80&w=600",
      description: "Ekstremalnie szybki, taktyczny pojedynek karciany stworzony przez legendarnego Richarda Garfielda.",
      min_players: 2,
      max_players: 2,
      play_time: 15
    },
    {
      name: "Brass: Birmingham",
      price: 289.00,
      category: "Ekonomiczne",
      image: "https://images.unsplash.com/photo-1611195974226-a6a9be9dd763?auto=format&fit=crop&q=80&w=600",
      description: "Jedna z najwyżej ocenianych gier ekonomicznych świata. Buduj imperium przemysłowe w XIX-wiecznej Anglii.",
      min_players: 2,
      max_players: 4,
      play_time: 120
    },
    {
      name: "Robinson Crusoe",
      price: 179.00,
      category: "Przygodowe",
      image: "https://images.unsplash.com/photo-1585504198199-20277593b94f?auto=format&fit=crop&q=80&w=600",
      description: "Wymagająca, kooperacyjna walka o przetrwanie na bezludnej, pełnej niebezpieczeństw wyspie.",
      min_players: 1,
      max_players: 4,
      play_time: 120
    },
    {
      name: "Sabotażysta",
      price: 45.00,
      category: "Imprezowe",
      image: "https://images.unsplash.com/photo-1629981879703-35058ae99b7a?auto=format&fit=crop&q=80&w=600",
      description: "Kop korytarze i szukaj złota jako uczciwy krasnolud, lub przeszkadzaj innym potajemnie jako sabotażysta.",
      min_players: 3,
      max_players: 10,
      play_time: 30
    },
    {
      name: "List Miłosny",
      price: 35.00,
      category: "Karciane",
      image: "https://images.unsplash.com/photo-1629981879703-35058ae99b7a?auto=format&fit=crop&q=80&w=600",
      description: "Mała talia o wielkich możliwościach dedukcji i ryzyka. Przekaż swój list miłosny księżniczce.",
      min_players: 2,
      max_players: 4,
      play_time: 20
    },
    {
      name: "5 Sekund",
      price: 89.00,
      category: "Imprezowe",
      image: "https://images.unsplash.com/photo-1585504198199-20277593b94f?auto=format&fit=crop&q=80&w=600",
      description: "Pod presją uciekających sekund podaj 3 pasujące odpowiedzi. Proste pytania, gigantyczny stres!",
      min_players: 3,
      max_players: 6,
      play_time: 30
    },
    {
      name: "Sherlock Holmes",
      price: 139.00,
      category: "Przygodowe",
      image: "https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&q=80&w=600",
      description: "Czy Twoje zdolności dedukcyjne pozwolą Ci prześcignąć legendarnego detektywa w rozwiązywaniu spraw kryminalnych?",
      min_players: 1,
      max_players: 8,
      play_time: 120
    },
    {
      name: "Detektyw",
      price: 129.00,
      category: "Przygodowe",
      image: "https://images.unsplash.com/photo-1611195974226-a6a9be9dd763?auto=format&fit=crop&q=80&w=600",
      description: "Polska, przełomowa kooperacyjna gra śledcza. Wykorzystaj bazę Antares do analizowania dowodów.",
      min_players: 1,
      max_players: 5,
      play_time: 150
    },
    {
      name: "Dune: Imperium",
      price: 199.00,
      category: "Strategiczne",
      image: "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&q=80&w=600",
      description: "Przejmij kontrolę nad Arrakis w niezwykle napiętym połączeniu budowania talii i walki o wpływy.",
      min_players: 1,
      max_players: 4,
      play_time: 90
    },
    {
      name: "Cascadia (Kaskadia)",
      price: 139.00,
      category: "Rodzinne",
      image: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&q=80&w=600",
      description: "Relaksująca gra o układaniu kafelków środowiska i dopasowywaniu unikalnych wzorców zwierząt.",
      min_players: 1,
      max_players: 4,
      play_time: 45
    },
    {
      name: "Great Western Trail",
      price: 219.00,
      category: "Strategiczne",
      image: "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&q=80&w=600",
      description: "Kieruj ranczem w XIX-wiecznej Ameryce, ulepszaj swoje linie kolejowe i sprzedawaj najlepsze bydło.",
      min_players: 1,
      max_players: 4,
      play_time: 120
    },
    {
      name: "MicroMacro: Na Tropie",
      price: 99.00,
      category: "Imprezowe",
      image: "https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&q=80&w=600",
      description: "Śledź podejrzanych i rozwiązuj skomplikowane zagadki na ogromnej, pełnej szczegółów mapie miasta.",
      min_players: 1,
      max_players: 4,
      play_time: 45
    },
    {
      name: "Karak",
      price: 119.00,
      category: "Rodzinne",
      image: "https://images.unsplash.com/photo-1585504198199-20277593b94f?auto=format&fit=crop&q=80&w=600",
      description: "Wciel się w jednego z bohaterów i eksploruj tajemnicze lochy zamku Karak pełne potworów i skarbów.",
      min_players: 2,
      max_players: 5,
      play_time: 45
    },
    {
      name: "Eksplodujące Kotki",
      price: 79.00,
      category: "Karciane",
      image: "https://images.unsplash.com/photo-1629981879703-35058ae99b7a?auto=format&fit=crop&q=80&w=600",
      description: "Zabawna, pełna negatywnej interakcji rosyjska ruletka z kotkami w roli głównej.",
      min_players: 2,
      max_players: 5,
      play_time: 15
    },
    {
      name: "Unmatched: Bitwa Legend",
      price: 149.00,
      category: "Strategiczne",
      image: "https://images.unsplash.com/photo-1611195974226-a6a9be9dd763?auto=format&fit=crop&q=80&w=600",
      description: "Pojedynek legendarnych postaci: Alice vs Król Artur vs Meduza vs Sindbad w dynamicznej walce taktycznej.",
      min_players: 2,
      max_players: 4,
      play_time: 30
    },
    {
      name: "Star Wars: Rebelia",
      price: 399.00,
      category: "Strategiczne",
      image: "https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&q=80&w=600",
      description: "Epicki pojedynek w świecie Gwiezdnych Wojen. Pokieruj potęgą Imperium lub zorganizuj partyzantkę Rebelii.",
      min_players: 2,
      max_players: 4,
      play_time: 180
    },
    {
      name: "Gra o Tron (Edycja 2)",
      price: 229.00,
      category: "Strategiczne",
      image: "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&q=80&w=600",
      description: "Poprowadź swój ród do walki o Żelazny Tron Westeros poprzez sojusze, intrygi i zdrady.",
      min_players: 3,
      max_players: 6,
      play_time: 180
    },
    {
      name: "Ark Nova",
      price: 259.00,
      category: "Ekonomiczne",
      image: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&q=80&w=600",
      description: "Zaplanuj i stwórz nowoczesne zoo, wspieraj programy ochronne i hoduj niezwykłe zwierzęta.",
      min_players: 1,
      max_players: 4,
      play_time: 150
    },
    {
      name: "Terraformacja Marsa: Ares",
      price: 149.00,
      category: "Karciane",
      image: "https://images.unsplash.com/photo-1629981879703-35058ae99b7a?auto=format&fit=crop&q=80&w=600",
      description: "Szybsza, dynamiczna, karciana adaptacja kultowego hitu. Zbuduj silnik produkcyjny na Marsie.",
      min_players: 1,
      max_players: 4,
      play_time: 60
    },
    {
      name: "Blood Rage",
      price: 299.00,
      category: "Strategiczne",
      image: "https://images.unsplash.com/photo-1611195974226-a6a9be9dd763?auto=format&fit=crop&q=80&w=600",
      description: "Ragnarok nadchodzi! Prowadź swój klan wikingów do epickich bitew, zdobywaj chwałę i umieraj walecznie.",
      min_players: 2,
      max_players: 4,
      play_time: 90
    },
    {
      name: "Projekt Gaja",
      price: 279.00,
      category: "Strategiczne",
      image: "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&q=80&w=600",
      description: "Zaawansowana, bezlosowa gra strategiczna o podboju kosmosu przez 14 unikalnych frakcji kosmitów.",
      min_players: 1,
      max_players: 4,
      play_time: 150
    }
  ];

  for (const product of productsSeed) {
    const stock = Math.floor(Math.random() * 11) + 5; // random stock between 5 and 15
    await dbRun(
      `INSERT INTO Products (name, price, category, image, description, min_players, max_players, play_time, stock)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product.name,
        product.price,
        product.category,
        product.image,
        product.description,
        product.min_players,
        product.max_players,
        product.play_time,
        stock
      ]
    );
  }
  console.log(`Successfully seeded ${productsSeed.length} products.`);
}
