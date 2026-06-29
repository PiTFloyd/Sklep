import { Dices, ShieldCheck, Truck, RotateCcw, Heart, Star, Sparkles } from "lucide-react";

interface HeroProps {
  onGoToStore: () => void;
}

export default function Hero({ onGoToStore }: HeroProps) {
  // 4 main categories displayed as flat brutalist portfolio cards
  const featuredCategories = [
    {
      title: "Gry Strategiczne",
      desc: "Głębokie wyzwania dla umysłu, rozbudowane mechaniki oraz rywalizacja o podbój nowych terytoriów.",
      count: "12 gier",
      tag: "Dla Ekspertów",
      color: "border-brand-yellow-400 text-brand-yellow-400 bg-brand-yellow-400/10",
      image: "https://images.unsplash.com/photo-1611195974226-a6a9be9dd763?auto=format&fit=crop&q=80&w=600"
    },
    {
      title: "Gry Rodzinne",
      desc: "Przystępne zasady, kupa śmiechu oraz zabawa, która łączy pokolenia przy jednym stole.",
      count: "14 gier",
      tag: "Bestsellery",
      color: "border-lime-400 text-lime-400 bg-lime-400/10",
      image: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&q=80&w=600"
    },
    {
      title: "Gry Przygodowe",
      desc: "Kooperacyjne scenariusze, pasjonujące wątki fabularne oraz pełna zwrotów akcji eksploracja lochów.",
      count: "8 gier",
      tag: "Pełna Imersja",
      color: "border-sky-400 text-sky-400 bg-sky-400/10",
      image: "https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&q=80&w=600"
    },
    {
      title: "Gry Imprezowe",
      desc: "Szybkie rundy, wysoka interakcja i salwy śmiechu. Doskonały wybór na każde spotkanie ze znajomymi.",
      count: "6 gier",
      tag: "Od 3 do 10 osób",
      color: "border-fuchsia-400 text-fuchsia-400 bg-fuchsia-400/10",
      image: "https://images.unsplash.com/photo-1585504198199-20277593b94f?auto=format&fit=crop&q=80&w=600"
    }
  ];

  return (
    <div className="space-y-20 pb-16" id="landing-page">
      {/* 1. Hero Section with centered Shop Logo and Unsplash background */}
      <section className="relative h-[650px] flex items-center justify-center overflow-hidden border-b-4 border-black" id="hero-section">
        {/* Immersive background image with high-impact dark vignette overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&q=80&w=2000" 
            alt="Board Game Store Shelves" 
            className="w-full h-full object-cover object-center scale-105 filter grayscale contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-black/60 z-10"></div>
        </div>

        {/* Hero Content (Centered) */}
        <div className="relative z-20 max-w-4xl mx-auto text-center px-4 space-y-8">
          {/* Main Logo Emblem in stark colors */}
          <div className="inline-flex items-center justify-center p-5 bg-brand-yellow-400 text-black border-4 border-black rounded-none shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] mb-2">
            <Dices className="h-16 w-16 stroke-[3]" />
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-display font-black tracking-tighter text-white uppercase leading-[0.9]">
              GRAJ BEZ<br />
              <span className="text-brand-yellow-400">
                OGRANICZEŃ
              </span>
            </h1>
            <p className="text-sm sm:text-lg text-zinc-300 max-w-xl mx-auto font-medium leading-relaxed font-sans">
              Największy wybór gier planszowych w Rzeszowie. Od legendarnych klasyków po najnowsze, unikalne premiery Kickstarterowe.
            </p>
          </div>

          {/* Button connecting to store */}
          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={onGoToStore}
              className="w-full sm:w-auto px-8 py-4.5 bg-brand-yellow-400 hover:bg-white text-black font-black text-xl uppercase tracking-wider rounded-none transition-colors border-4 border-black shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]"
              id="cta-go-to-products"
            >
              PRZEJDŹ DO GRY ➔
            </button>
            <a
              href="#about-store"
              className="w-full sm:w-auto px-8 py-4.5 bg-black hover:bg-zinc-950 border-4 border-white rounded-none text-sm font-black uppercase tracking-wider text-white transition-colors"
            >
              DOWIEDZ SIĘ WIĘCEJ
            </a>
          </div>
        </div>


      </section>

      {/* 2. Quality Accents Bar with Brutalist styling */}
      <section className="w-full max-w-none mx-auto px-4 sm:px-8 md:px-12 xl:px-20 2xl:px-28 3xl:px-36 4xl:px-44">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 bg-black border-4 border-white rounded-none divide-y-4 md:divide-y-0 md:divide-x-4 divide-white p-0 shadow-[8px_8px_0px_0px_#FFE200]">
          
          <div className="flex items-start gap-4 p-8">
            <div className="p-3 bg-brand-yellow-400 text-black border-2 border-black rounded-none">
              <Truck className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-md font-black uppercase text-brand-yellow-400 mb-1 tracking-tight">Dostawa od 250 zł</h4>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">Ekspresowa i bezpieczna wysyłka paczkomatowa lub kurierska bezpośrednio pod Twoje drzwi.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-8">
            <div className="p-3 bg-brand-yellow-400 text-black border-2 border-black rounded-none">
              <ShieldCheck className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-md font-black uppercase text-brand-yellow-400 mb-1 tracking-tight">100% Oryginalne Gry</h4>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans font-normal">Współpracujemy wyłącznie z oficjalnymi polskimi i światowymi wydawcami gier planszowych.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-8">
            <div className="p-3 bg-brand-yellow-400 text-black border-2 border-black rounded-none">
              <RotateCcw className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-md font-black uppercase text-brand-yellow-400 mb-1 tracking-tight">30 dni na zwrot</h4>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">Rozmyśliłeś się? Masz aż 30 dni na zwrot fabrycznie zafoliowanej gry bez podawania przyczyny.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Portfolio Categories Showcase */}
      <section className="w-full max-w-none mx-auto px-4 sm:px-8 md:px-12 xl:px-20 2xl:px-28 3xl:px-36 4xl:px-44 space-y-10" id="about-store">
        <div className="text-center space-y-3">
          <span className="text-xs font-mono font-black tracking-widest text-brand-yellow-400 uppercase flex items-center justify-center gap-1.5">
            <Sparkles className="h-4.5 w-4.5 text-brand-yellow-400 fill-brand-yellow-400" /> PONAD 40 NAJLEPSZYCH TYTUŁÓW W RZESZOWIE
          </span>
          <h2 className="text-4xl sm:text-5xl font-display font-black text-white leading-none uppercase">
            KATEGORIE ROZGRYWKI
          </h2>
          <div className="w-24 h-1 bg-brand-yellow-400 mx-auto"></div>
          <p className="text-zinc-400 max-w-2xl mx-auto text-xs sm:text-sm leading-relaxed font-sans">
            Stworzyliśmy wyselekcjonowaną ofertę gier podzieloną na intuicyjne kategorie, aby pomóc Ci znaleźć grę dopasowaną dokładnie do Twojej ekipy.
          </p>
        </div>

        {/* Portfolio Category Cards with Brutalist styling */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10 xl:gap-12 2xl:gap-16">
          {featuredCategories.map((cat, idx) => (
            <div 
              key={idx}
              className="group bg-zinc-950 border-4 border-black hover:border-brand-yellow-400 rounded-none overflow-hidden transition-all flex flex-col shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)] hover:shadow-[4px_4px_0px_0px_#FFE200]"
            >
              {/* Image Header with Badge */}
              <div className="relative h-44 overflow-hidden border-b-4 border-black">
                <img 
                  src={cat.image} 
                  alt={cat.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter grayscale brightness-75 group-hover:grayscale-0"
                />
                <span className={`absolute top-4 left-4 px-2.5 py-1 text-[9px] font-mono font-black uppercase rounded-none border-2 border-black bg-black ${cat.color}`}>
                  {cat.tag}
                </span>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <span className="text-xs font-mono text-zinc-500 font-black uppercase tracking-wider">{cat.count}</span>
                  <h3 className="text-lg font-black text-white group-hover:text-brand-yellow-400 transition-colors uppercase">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                    {cat.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Giant Promo Section calling to the Store with high contrast bold styling */}
        <div className="relative bg-brand-yellow-400 rounded-none border-4 border-black p-8 sm:p-12 lg:p-16 text-black overflow-hidden shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] flex flex-col lg:flex-row items-center gap-8 justify-between">
          <div className="relative z-10 max-w-xl space-y-4 text-center lg:text-left">
            <span className="px-3 py-1 bg-black text-brand-yellow-400 text-[10px] font-mono font-black tracking-widest uppercase rounded-none">
              PROMOCJA SEZONOWA
            </span>
            <h3 className="text-3xl sm:text-5xl font-display font-black leading-[0.95] tracking-tighter uppercase">
              PRZYGOTUJ SIĘ NA WEEKENDOWE GRANIE!
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-zinc-900 leading-relaxed">
              Zrób zakupy za min. 200 zł, wpisz kod <span className="font-mono font-black bg-black text-brand-yellow-400 px-2.5 py-1 text-xs tracking-wider">KOSTKA10</span> przy kasie i odbierz darmową grę niespodziankę o wartości do 50 zł!
            </p>
          </div>

          <div className="relative z-10 flex-shrink-0 w-full lg:w-auto">
            <button
              onClick={onGoToStore}
              className="w-full lg:w-auto px-8 py-4 bg-black hover:bg-white text-brand-yellow-400 hover:text-black font-black text-sm tracking-widest uppercase rounded-none transition-all border-4 border-black"
            >
              PRZEJDŹ DO OFERTY GRY ➔
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
