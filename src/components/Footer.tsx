import { MapPin, Phone, Mail, Clock, Dices, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-black border-t-4 border-white text-zinc-400 mt-20" id="app-footer">
      {/* Upper Grid Area */}
      <div className="w-full max-w-none mx-auto px-4 sm:px-8 md:px-12 xl:px-20 2xl:px-28 3xl:px-36 4xl:px-44 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Column 1: Store Bio */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-brand-yellow-400 text-black border-2 border-black rounded-none">
                <Dices className="h-5 w-5 stroke-[3]" />
              </div>
              <span className="text-xl font-display font-black text-white tracking-tighter uppercase">
                PLANSZOWY<span className="text-brand-yellow-400">ZAKĄTEK</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm font-sans">
              Twój zaufany i w pełni zintegrowany sklep z grami planszowymi w samym sercu Rzeszowa. Oferujemy profesjonalne doradztwo, szybkie wysyłki i bazę ponad 40 wyselekcjonowanych hitów planszowych.
            </p>
            <div className="pt-2 flex flex-col gap-2.5 text-xs">
              <span className="flex items-center gap-2 font-mono font-bold text-zinc-400 uppercase">
                <Clock className="h-4 w-4 text-brand-yellow-400 stroke-[2.5]" />
                <span>PON - PT: 9:00 - 18:00 | SOB: 10:00 - 14:00</span>
              </span>
            </div>
          </div>

          {/* Column 2: Contact Details */}
          <div className="lg:col-span-3 space-y-4" id="contact-info">
            <h4 className="text-xs font-mono font-black uppercase text-brand-yellow-400 tracking-widest border-l-4 border-brand-yellow-400 pl-2.5">
              KONTAKT Stacjonarny
            </h4>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4.5 w-4.5 text-brand-yellow-400 flex-shrink-0 stroke-[2.5]" />
                <div>
                  <p className="font-black text-zinc-300 uppercase">Sklep Stacjonarny</p>
                  <p className="text-zinc-500 font-mono">Rynek 1 (Ratusz)</p>
                  <p className="text-zinc-500 font-mono">35-064 Rzeszów</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Phone className="h-4.5 w-4.5 text-brand-yellow-400 stroke-[2.5]" />
                <div>
                  <a href="tel:+48170000000" className="hover:text-white font-mono font-bold hover:underline transition-all">
                    +48 17 000 00 00
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Mail className="h-4.5 w-4.5 text-brand-yellow-400 stroke-[2.5]" />
                <div>
                  <a href="mailto:kontakt@planszowyzakatek.pl" className="hover:text-white font-mono font-bold hover:underline transition-all break-all">
                    kontakt@planszowyzakatek.pl
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Embedded Google Maps indicating Ratusz w Rzeszowie */}
          <div className="lg:col-span-5 space-y-4" id="footer-map-container">
            <h4 className="text-xs font-mono font-black uppercase text-brand-yellow-400 tracking-widest border-l-4 border-brand-yellow-400 pl-2.5">
              NASZA LOKALIZACJA
            </h4>
            <div className="w-full h-48 rounded-none overflow-hidden border-4 border-white shadow-[4px_4px_0px_0px_#FFE200] relative bg-zinc-950">
              <iframe
                title="Ratusz Rzeszowski - Planszowy Zakątek"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d262.77011316928025!2d22.003842814354538!3d50.03747202464765!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x473cfb023d5aff1f%3A0xaca529e5fa32f495!2sRzeszowski%20Ratusz!5e0!3m2!1spl!2spl!4v1782323188746!5m2!1spl!2spl"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                className="className=w-full h-full relative z-10 pointer-events-auto"
              ></iframe>
            </div>
          </div>
        </div>
      </div>

      {/* Legal and Copyright bar */}
      <div className="bg-zinc-950 border-t-2 border-zinc-900 py-6">
        <div className="w-full max-w-none mx-auto px-4 sm:px-8 md:px-12 xl:px-20 2xl:px-28 3xl:px-36 4xl:px-44 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-zinc-500 font-mono font-bold uppercase">
            &copy; 2026 PLANSZOWY ZAKĄTEK. WSZELKIE PRAWA ZASTRZEŻONE.
          </p>
          <p className="flex items-center gap-1 text-zinc-500 font-mono font-bold uppercase">
            Z MIŁOŚCI DO GIER PLANSZOWYCH <Heart className="h-3.5 w-3.5 text-brand-yellow-400 fill-brand-yellow-400" /> W RZESZOWIE.
          </p>
        </div>
      </div>
    </footer>
  );
}
