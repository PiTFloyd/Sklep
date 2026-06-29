import { useState } from "react";
import { ArrowLeft, ShoppingCart, Users, Clock, Sparkles, ShieldCheck, Box } from "lucide-react";
import { Product } from "../types";

interface ProductDetailsProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onGoBack: () => void;
}

export default function ProductDetails({ product, onAddToCart, onGoBack }: ProductDetailsProps) {
  const [added, setAdded] = useState(false);

  const handleAddToCartClick = () => {
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
    }, 1500);
  };

  // Stock formatting helper
  const stockCount = product.stock !== undefined ? product.stock : 10;
  const isAvailable = stockCount > 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16" id="product-details-page">
      {/* Back button */}
      <div>
        <button
          onClick={onGoBack}
          className="group flex items-center gap-2 px-4 py-2.5 bg-black hover:bg-zinc-900 text-white font-black text-xs uppercase tracking-widest rounded-none border-2 border-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          POWRÓT DO KATALOGU
        </button>
      </div>

      {/* Main product showcase grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 bg-zinc-950 border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(255,255,255,0.15)] relative">
        
        {/* Left Column: Large Image */}
        <div className="md:col-span-5 space-y-4">
          <div className="relative aspect-square overflow-hidden bg-black border-4 border-black shadow-[4px_4px_0px_0px_#FFE200]">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover grayscale contrast-115 hover:grayscale-0 transition-all duration-500"
              referrerPolicy="no-referrer"
            />
            <span className="absolute top-4 left-4 px-3 py-1 text-[10px] font-mono font-black bg-black border-2 border-brand-yellow-400 text-brand-yellow-400 uppercase">
              {product.category}
            </span>
          </div>
          
          {/* Unsplash and placeholder disclaimer */}
          <p className="text-[10px] text-zinc-500 font-mono text-center uppercase tracking-wider">
            Zdjęcie poglądowe reprezentujące kategorię gier: {product.category}
          </p>
        </div>

        {/* Right Column: Information & Actions */}
        <div className="md:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Title & Badge */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-black text-brand-yellow-400 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 fill-brand-yellow-400" /> WYSELEKCJONOWANY HIT PLANSZOWY
              </span>
              <h2 className="text-3xl sm:text-4xl font-display font-black text-white uppercase tracking-tight leading-tight">
                {product.name}
              </h2>
            </div>

            {/* Quick stats tags */}
            <div className="flex flex-wrap gap-3 pt-2">
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-black border border-zinc-800 text-xs font-mono font-bold text-zinc-300 uppercase">
                <Users className="h-4 w-4 text-brand-yellow-400" />
                Gracze: {product.minPlayers === product.maxPlayers ? `${product.minPlayers} os.` : `${product.minPlayers}-${product.maxPlayers} os.`}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-black border border-zinc-800 text-xs font-mono font-bold text-zinc-300 uppercase">
                <Clock className="h-4 w-4 text-brand-yellow-400" />
                Czas gry: {product.playTime} min
              </span>
            </div>

            {/* Price & Stock Display Card */}
            <div className="bg-black border-2 border-zinc-800 p-5 grid grid-cols-2 gap-4 items-center rounded-none divide-x divide-zinc-900">
              {/* Price */}
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-1">CENA SKLEPOWA</p>
                <p className="text-3xl font-display font-black text-white">
                  {product.price.toFixed(2)} <span className="text-sm text-brand-yellow-400 font-mono">PLN</span>
                </p>
              </div>

              {/* Stock / Availability */}
              <div className="pl-4">
                <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-1">DOSTĘPNOŚĆ W SKLEPIE</p>
                <div className="flex items-center gap-2">
                  <span className={`h-3.5 w-3.5 border-2 border-black ${isAvailable ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}></span>
                  <span className={`text-sm font-mono font-black uppercase ${isAvailable ? "text-emerald-400" : "text-red-500"}`}>
                    {isAvailable ? `W MAGAZYNIE (${stockCount} szt.)` : "BRAK W MAGAZYNIE"}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2 pt-2">
              <p className="text-[11px] font-mono font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-900 pb-1">
                OPIS ROZGRYWKI I MECHANIKA
              </p>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
                {product.description}
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t-2 border-zinc-900 flex flex-col sm:flex-row gap-4 items-center">
            <button
              onClick={handleAddToCartClick}
              disabled={!isAvailable}
              className={`w-full sm:flex-1 py-4 font-black text-sm tracking-wider uppercase border-2 border-black rounded-none flex items-center justify-center gap-2 transition-colors ${
                !isAvailable
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  : added
                    ? "bg-emerald-500 text-white"
                    : "bg-brand-yellow-400 hover:bg-white text-black active:scale-[0.98]"
              }`}
            >
              <ShoppingCart className="h-4.5 w-4.5 stroke-[2.5]" />
              {added ? "DODANO DO KOSZYKA!" : !isAvailable ? "CHWILOWO NIEDOSTĘPNE" : "DODAJ DO KOSZYKA"}
            </button>
            
            <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono font-bold uppercase tracking-wide">
              <ShieldCheck className="h-4.5 w-4.5 text-brand-yellow-400 stroke-[2]" />
              Gwarancja 100% oryginalności
            </div>
          </div>
        </div>
      </div>

      {/* Rzeszów pickup banner details */}
      <div className="bg-black border-4 border-white p-6 rounded-none flex flex-col sm:flex-row items-center gap-4 justify-between shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-yellow-400 text-black border-2 border-black rounded-none">
            <Box className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider">ODBIÓR TEGO SAMEGO DNIA</h4>
            <p className="text-[11px] text-zinc-400 font-sans">Złóż zamówienie i odbierz grę osobiście w naszym punkcie przy Ratuszu w Rzeszowie bez dodatkowych opłat.</p>
          </div>
        </div>
        <button
          onClick={onGoBack}
          className="text-xs font-mono font-black uppercase text-brand-yellow-400 hover:text-white transition-colors tracking-widest whitespace-nowrap"
        >
          ZOBACZ INNE GRY ➔
        </button>
      </div>
    </div>
  );
}
