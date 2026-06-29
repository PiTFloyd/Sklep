import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, Users, Clock, ShoppingCart, Info, Sparkles, AlertCircle } from "lucide-react";
import { Product } from "../types";

interface StoreProps {
  products: Product[];
  loading: boolean;
  error: string;
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
}

export default function Store({ products, loading, error, onAddToCart, onSelectProduct }: StoreProps) {
  // Filters & Sorting state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Wszystkie");
  const [sortBy, setSortBy] = useState("default");
  const [selectedPlayers, setSelectedPlayers] = useState("any");

  // Success indicator state for button click
  const [addedProductId, setAddedProductId] = useState<number | null>(null);

  const handleAddToCartClick = (product: Product) => {
    onAddToCart(product);
    setAddedProductId(product.id);
    setTimeout(() => {
      setAddedProductId(null);
    }, 1000);
  };

  const categories = ["Wszystkie", "Rodzinne", "Strategiczne", "Przygodowe", "Karciane", "Imprezowe", "Ekonomiczne"];

  // Filter and Sort logic
  const filteredProducts = products
    .filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            product.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "Wszystkie" || product.category === selectedCategory;
      
      // Filter by players
      let matchesPlayers = true;
      if (selectedPlayers === "1") {
        matchesPlayers = product.minPlayers === 1;
      } else if (selectedPlayers === "2") {
        matchesPlayers = product.minPlayers <= 2 && product.maxPlayers >= 2;
      } else if (selectedPlayers === "3-4") {
        matchesPlayers = product.maxPlayers >= 3;
      } else if (selectedPlayers === "5+") {
        matchesPlayers = product.maxPlayers >= 5;
      }

      return matchesSearch && matchesCategory && matchesPlayers;
    })
    .sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "name-asc") return a.name.localeCompare(b.name);
      if (sortBy === "time-asc") return a.playTime - b.playTime;
      return 0; // default (id order)
    });

  return (
    <div className="w-full max-w-none mx-auto px-4 sm:px-8 md:px-12 xl:px-20 2xl:px-28 3xl:px-36 4xl:px-44 space-y-10 pb-12" id="store-page">
      {/* Page Title Header with Brutalist Border */}
      <div className="border-b-4 border-white pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-black text-brand-yellow-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
            <Sparkles className="h-4 w-4" /> PEŁNY KATALOG GIER
          </span>
          <h1 className="text-4xl sm:text-5xl font-display font-black text-white uppercase tracking-tighter">NASZE GRY PLANSZOWE</h1>
          <p className="text-zinc-400 text-xs mt-1 font-sans">Ponad 40 unikalnych tytułów dostępnych od ręki w naszym sklepie stacjonarnym w Rzeszowie.</p>
        </div>
        <div className="text-right text-xs text-brand-yellow-400 font-mono font-black uppercase">
          WYŚWIETLANE: <span className="bg-white text-black px-2 py-0.5">{filteredProducts.length}</span> / {products.length}
        </div>
      </div>

      {/* Control Panel: Filters & Sorting & Search (Brutalist blocks) */}
      <div className="bg-black border-4 border-white rounded-none p-6 space-y-6 shadow-[6px_6px_0px_0px_#FFE200]" id="store-controls">
        {/* Row 1: Search and player selectors */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Search bar */}
          <div className="relative lg:col-span-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500 h-4.5 w-4.5" />
            <input
              type="text"
              placeholder="Szukaj gry według nazwy lub opisu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-zinc-950 border-2 border-zinc-800 rounded-none text-white placeholder-zinc-700 focus:outline-none focus:border-brand-yellow-400 text-sm font-sans"
            />
          </div>

          {/* Player Count filter & sorting */}
          <div className="grid grid-cols-2 gap-4 lg:col-span-6">
            <div>
              <select
                value={selectedPlayers}
                onChange={(e) => setSelectedPlayers(e.target.value)}
                className="w-full px-4 py-3.5 bg-zinc-950 border-2 border-zinc-800 rounded-none text-zinc-300 text-xs font-mono focus:outline-none focus:border-brand-yellow-400 cursor-pointer uppercase tracking-wider"
              >
                <option value="any">LICZBA GRACZY: DOWOLNA</option>
                <option value="1">MOŻLIWOŚĆ GRY SOLO (1 os.)</option>
                <option value="2">DLA 2 OSÓB</option>
                <option value="3-4">DLA 3-4 OSÓB</option>
                <option value="5+">IMPREZOWE (5+ os.)</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3.5 bg-zinc-950 border-2 border-zinc-800 rounded-none text-zinc-300 text-xs font-mono focus:outline-none focus:border-brand-yellow-400 cursor-pointer uppercase tracking-wider"
              >
                <option value="default">SORTOWANIE: DOMYŚLNE</option>
                <option value="price-asc">CENA: OD NAJNIŻSZEJ</option>
                <option value="price-desc">CENA: OD NAJWYŻSZEJ</option>
                <option value="name-asc">NAZWA: A - Z</option>
                <option value="time-asc">CZAS GRY: NAJKRÓTSZY</option>
              </select>
            </div>
          </div>
        </div>

        {/* Row 2: Category tabs */}
        <div className="pt-4 border-t border-zinc-800">
          <div className="flex items-center gap-2 mb-3 text-zinc-500 text-[10px] font-mono font-black uppercase tracking-widest">
            <SlidersHorizontal className="h-4 w-4 text-brand-yellow-400" /> KATEGORIE PLANSZÓWEK:
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-none transition-colors border-2 ${
                  selectedCategory === cat
                    ? "bg-brand-yellow-400 text-black border-black shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
                    : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-20 text-center space-y-4">
          <div className="inline-block w-8 h-8 border-4 border-brand-yellow-400 border-t-transparent animate-spin"></div>
          <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest font-black">Wczytywanie gier planszowych...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-950/40 border-4 border-red-600 rounded-none p-8 text-center max-w-lg mx-auto space-y-4">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto stroke-[2.5]" />
          <h3 className="text-lg font-black text-white uppercase">Wystąpił błąd</h3>
          <p className="text-xs text-red-200 font-mono">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredProducts.length === 0 && (
        <div className="bg-black border-4 border-white rounded-none py-16 px-4 text-center max-w-md mx-auto space-y-4 shadow-[4px_4px_0px_0px_#FFE200]">
          <Info className="h-12 w-12 text-brand-yellow-400 mx-auto stroke-[2.5]" />
          <h3 className="text-xl font-black text-white uppercase">Brak wyników</h3>
          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
            Nie znaleźliśmy żadnej gry spełniającej Twoje kryteria wyszukiwania. Spróbuj zmienić filtry lub wpisać inne słowo kluczowe.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("Wszystkie");
              setSelectedPlayers("any");
              setSortBy("default");
            }}
            className="px-5 py-3 bg-brand-yellow-400 text-black text-xs font-black rounded-none hover:bg-white border-2 border-black transition-colors uppercase tracking-wider"
          >
            RESETUJ FILTRY
          </button>
        </div>
      )}

      {/* Products Grid with Brutalist styling */}
      {!loading && !error && filteredProducts.length > 0 && (
        <div 
          className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,360px),1fr))] gap-6 sm:gap-8 lg:gap-10"
          id="products-grid"
        >
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="group bg-zinc-950 border-4 border-black hover:border-brand-yellow-400 rounded-none overflow-hidden transition-all flex flex-col shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)] hover:shadow-[4px_4px_0px_0px_#FFE200]"
            >
              {/* Image with category badge */}
              <div 
                onClick={() => onSelectProduct(product)}
                className="relative h-48 overflow-hidden bg-black border-b-4 border-black cursor-pointer"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter grayscale contrast-115 group-hover:grayscale-0 brightness-90 group-hover:brightness-100"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute top-3 left-3 px-2 py-1 text-[8px] font-mono font-black bg-black border-2 border-brand-yellow-400 text-brand-yellow-400 uppercase">
                  {product.category}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  {/* Stats line */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] text-zinc-400 font-mono font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-brand-yellow-400 stroke-[2.5]" />
                      {product.minPlayers === product.maxPlayers 
                        ? `${product.minPlayers} OS.` 
                        : `${product.minPlayers}-${product.maxPlayers} OS.`}
                    </span>
                    <span className="h-2 w-2 bg-zinc-800"></span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-brand-yellow-400 stroke-[2.5]" />
                      {product.playTime} MIN
                    </span>
                    <span className="h-2 w-2 bg-zinc-800"></span>
                    <span className="flex items-center gap-1">
                      <span className={`h-2 w-2 rounded-full ${(product.stock === undefined || product.stock > 0) ? "bg-emerald-500" : "bg-red-500"}`}></span>
                      {(product.stock === undefined || product.stock > 0) ? "DOSTĘPNA" : "BRAK"}
                    </span>
                  </div>

                  <h3 
                    onClick={() => onSelectProduct(product)}
                    className="text-base font-black text-white leading-tight uppercase group-hover:text-brand-yellow-400 transition-colors line-clamp-1 cursor-pointer"
                  >
                    {product.name}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans line-clamp-2">
                    {product.description}
                  </p>
                </div>

                {/* Bottom line: Price & Button */}
                <div className="pt-3 border-t-2 border-black flex items-center justify-between gap-2">
                  <div className="text-left">
                    <p className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 font-bold">Cena</p>
                    <p className="text-lg font-display font-black text-white">
                      {product.price.toFixed(2)} <span className="text-xs text-brand-yellow-400 font-mono uppercase">PLN</span>
                    </p>
                  </div>

                  <button
                    onClick={() => handleAddToCartClick(product)}
                    className={`px-4 py-2.5 rounded-none font-black text-xs flex items-center gap-1.5 transition-colors border-2 border-black ${
                      addedProductId === product.id
                        ? "bg-emerald-500 text-white"
                        : "bg-brand-yellow-400 hover:bg-white text-black active:scale-95"
                    }`}
                  >
                    <ShoppingCart className="h-3.5 w-3.5 stroke-[2.5]" />
                    {addedProductId === product.id ? "DODANO!" : "DO KOSZYKA"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
