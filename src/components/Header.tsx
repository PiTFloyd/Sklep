import { useState, FormEvent, useEffect } from "react";
import { ShoppingCart, LogIn, LogOut, ShieldAlert, Menu, X, User as UserIcon, Dices } from "lucide-react";
import { User, CartItem } from "../types";

interface HeaderProps {
  currentUser: User | null;
  onLogin: (user: User) => void;
  onLogout: () => void;
  cart: CartItem[];
  currentView: "home" | "store" | "cart" | "admin" | "client-dashboard";
  setView: (view: "home" | "store" | "cart" | "admin" | "client-dashboard") => void;
}

export default function Header({
  currentUser,
  onLogin,
  onLogout,
  cart,
  currentView,
  setView
}: HeaderProps) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleOpenLogin = () => {
      setIsLoginOpen(true);
      setIsRegisterMode(false);
    };
    window.addEventListener("open-login-modal", handleOpenLogin);
    return () => window.removeEventListener("open-login-modal", handleOpenLogin);
  }, []);

  // Shipping information for registration
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regStreet, setRegStreet] = useState("");
  const [regZipCode, setRegZipCode] = useState("");
  const [regCity, setRegCity] = useState("");

  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (isRegisterMode) {
      if (!regFirstName || !regLastName || !regEmail || !regPhone || !regStreet || !regZipCode || !regCity) {
        setErrorMsg("Wszystkie dane do wysyłki są wymagane.");
        return;
      }
      const zipPattern = /^[0-9]{2}-[0-9]{3}$/;
      if (!zipPattern.test(regZipCode)) {
        setErrorMsg("Nieprawidłowy format kodu pocztowego. Użyj formatu XX-XXX (np. 35-001).");
        return;
      }

      try {
        const response = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: usernameInput,
            password: passwordInput,
            firstName: regFirstName,
            lastName: regLastName,
            email: regEmail,
            phone: regPhone,
            address: regStreet,
            city: regCity,
            zipCode: regZipCode
          })
        });
        const data = await response.json();
        if (response.ok) {
          setSuccessMsg("Rejestracja pomyślna! Możesz się teraz zalogować.");
          setIsRegisterMode(false);
          setPasswordInput("");
          // Clear registration state
          setRegFirstName("");
          setRegLastName("");
          setRegEmail("");
          setRegPhone("");
          setRegStreet("");
          setRegZipCode("");
          setRegCity("");
        } else {
          setErrorMsg(data.error || "Błąd podczas rejestracji.");
        }
      } catch (err) {
        setErrorMsg("Błąd połączenia z serwerem.");
      }
    } else {
      try {
        const response = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: usernameInput, password: passwordInput })
        });

        const data = await response.json();

        if (response.ok) {
          onLogin({
            username: data.username,
            role: data.role,
            token: data.token,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            address: data.address,
            city: data.city,
            zipCode: data.zipCode
          });
          setIsLoginOpen(false);
          setUsernameInput("");
          setPasswordInput("");
          
          // Auto-navigate to admin if user is admin
          if (data.role === "Owner") {
            setView("admin");
          }
        } else {
          setErrorMsg(data.error || "Błędny login lub hasło.");
        }
      } catch (err) {
        setErrorMsg("Błąd połączenia z serwerem.");
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-brand-yellow-400 text-black border-b-4 border-black shrink-0" id="app-header">
      <div className="w-full max-w-none mx-auto px-4 sm:px-8 md:px-12 xl:px-20 2xl:px-28 3xl:px-36 4xl:px-44">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div 
            onClick={() => setView("home")} 
            className="flex items-center gap-3 cursor-pointer group"
            id="logo-container"
          >
            <div className="p-2 bg-black text-brand-yellow-400 rounded-none transition-transform duration-300 group-hover:scale-105 border-2 border-black">
              <Dices className="h-6 w-6 stroke-[3]" />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl leading-none font-display font-black text-black tracking-tighter uppercase">
                PLANSZOWY<br/>ZAKĄTEK
              </span>
              <div className="w-1 h-8 bg-black hidden sm:block"></div>
              <div className="text-[10px] leading-tight uppercase font-black tracking-wider text-black hidden sm:block">
                PREMIUM<br/>TABLETOP<br/>STORE
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-2">
            <button
              onClick={() => setView("home")}
              className={`px-4 py-2 rounded-none text-xs font-black uppercase tracking-wider transition-all border-2 ${
                currentView === "home"
                  ? "bg-black text-brand-yellow-400 border-black"
                  : "text-black hover:bg-black hover:text-brand-yellow-400 border-transparent"
              }`}
            >
              Strona Główna
            </button>
            <button
              onClick={() => setView("store")}
              className={`px-4 py-2 rounded-none text-xs font-black uppercase tracking-wider transition-all border-2 ${
                currentView === "store"
                  ? "bg-black text-brand-yellow-400 border-black"
                  : "text-black hover:bg-black hover:text-brand-yellow-400 border-transparent"
              }`}
            >
              Sklep
            </button>
          </nav>

          {/* Right Actions */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Cart Button */}
            <button
              onClick={() => setView("cart")}
              className={`relative p-3 rounded-none transition-all border-2 ${
                currentView === "cart"
                  ? "bg-black border-black text-brand-yellow-400 scale-105"
                  : "bg-transparent border-black text-black hover:bg-black hover:text-brand-yellow-400"
              }`}
              title="Mój koszyk"
              id="cart-button-desktop"
            >
              <ShoppingCart className="h-5 w-5 stroke-[2.5]" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-black animate-pulse">
                  {cartItemsCount}
                </span>
              )}
            </button>

            {/* User Dropdown */}
            <div className="relative pl-2 border-l-2 border-black" id="desktop-user-menu">
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className={`flex items-center gap-2 p-3 rounded-none transition-all border-2 ${
                  isUserDropdownOpen || currentView === "client-dashboard"
                    ? "bg-black border-black text-brand-yellow-400 scale-105"
                    : "bg-transparent border-black text-black hover:bg-black hover:text-brand-yellow-400"
                }`}
                title="Konto użytkownika"
              >
                <UserIcon className="h-5 w-5 stroke-[2.5]" />
                {currentUser && (
                  <span className="text-xs font-mono font-black uppercase max-w-[100px] truncate">{currentUser.username}</span>
                )}
              </button>
              
              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-black border-4 border-white rounded-none shadow-[4px_4px_0px_0px_#FFE200] z-50 text-white p-1">
                  {currentUser ? (
                    <>
                      <div className="px-3 py-2 border-b border-zinc-900 text-left">
                        <span className="text-[9px] font-mono text-zinc-500 uppercase block">Konto</span>
                        <span className="text-xs font-sans font-black text-white block truncate uppercase">{currentUser.username}</span>
                        <span className="text-[9px] font-mono text-brand-yellow-400 uppercase tracking-widest">{currentUser.role === 'Owner' ? 'Właściciel' : 'Klient'}</span>
                      </div>
                      
                      <button
                        onClick={() => {
                          setView("client-dashboard");
                          setIsUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2.5 text-xs font-mono font-black uppercase tracking-wider text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors"
                      >
                        Moje konto
                      </button>
                      
                      {currentUser?.role === "Owner" && (
                        <button
                          onClick={() => {
                            setView("admin");
                            setIsUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2.5 text-xs font-mono font-black uppercase tracking-wider text-red-400 hover:bg-zinc-900 transition-colors"
                        >
                          Panel Admina
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          onLogout();
                          setIsUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2.5 text-xs font-mono font-black uppercase tracking-wider text-red-500 hover:bg-red-950/30 transition-colors border-t border-zinc-900"
                      >
                        Wyloguj się
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setIsLoginOpen(true);
                        setIsUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2.5 text-xs font-mono font-black uppercase tracking-wider text-brand-yellow-400 hover:bg-zinc-900 transition-colors"
                    >
                      Zaloguj się
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setView("cart")}
              className="relative p-2.5 bg-transparent border-2 border-black text-black rounded-none"
              id="cart-button-mobile"
            >
              <ShoppingCart className="h-5 w-5 stroke-[2.5]" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center border border-black">
                  {cartItemsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2.5 bg-transparent border-2 border-black text-black hover:bg-black hover:text-brand-yellow-400 rounded-none"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5 stroke-[2.5]" /> : <Menu className="h-5 w-5 stroke-[2.5]" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-brand-yellow-400 border-t-2 border-black px-4 py-4 space-y-3">
          <button
            onClick={() => { setView("home"); setIsMobileMenuOpen(false); }}
            className={`w-full text-left px-4 py-2.5 rounded-none text-xs font-black uppercase tracking-widest ${
              currentView === "home" ? "bg-black text-brand-yellow-400" : "text-black hover:bg-black/10"
            }`}
          >
            Strona Główna
          </button>
          <button
            onClick={() => { setView("store"); setIsMobileMenuOpen(false); }}
            className={`w-full text-left px-4 py-2.5 rounded-none text-xs font-black uppercase tracking-widest ${
              currentView === "store" ? "bg-black text-brand-yellow-400" : "text-black hover:bg-black/10"
            }`}
          >
            Sklep
          </button>

          <div className="pt-2 border-t-2 border-black">
            {currentUser ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-4 py-2 bg-black/10 border border-black rounded-none">
                  <div>
                    <p className="text-[9px] text-black/70 font-black uppercase tracking-wider">Zalogowany:</p>
                    <p className="text-xs font-black text-black uppercase tracking-tight">{currentUser.username}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => { setView("client-dashboard"); setIsMobileMenuOpen(false); }}
                  className="w-full text-center py-2.5 bg-black text-brand-yellow-400 font-mono font-black text-xs uppercase tracking-widest border-2 border-black"
                >
                  Moje konto
                </button>
                
                {currentUser?.role === "Owner" && (
                  <button
                    onClick={() => { setView("admin"); setIsMobileMenuOpen(false); }}
                    className="w-full text-center py-2.5 bg-zinc-900 text-red-500 font-mono font-black text-xs uppercase tracking-widest border-2 border-black"
                  >
                    Panel Admina
                  </button>
                )}
                
                <button
                  onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
                  className="w-full text-center py-2.5 bg-red-700 hover:bg-red-850 text-white font-mono font-black text-xs uppercase tracking-widest border-2 border-black"
                >
                  Wyloguj się
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setIsLoginOpen(true); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-black text-brand-yellow-400 hover:bg-zinc-900 font-black text-xs uppercase tracking-widest rounded-none border-2 border-black"
              >
                <LogIn className="h-4 w-4 stroke-[3]" />
                Zaloguj się
              </button>
            )}
          </div>
        </div>
      )}

      {/* Login Modal */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            onClick={() => {
              setIsLoginOpen(false);
              setIsRegisterMode(false);
              setErrorMsg("");
              setSuccessMsg("");
            }}
          ></div>
          
          {/* Modal Container */}
          <div className="relative bg-black border-4 border-brand-yellow-400 rounded-none w-full max-w-md max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl text-white">
            <div className="flex items-center justify-between mb-6 border-b-2 border-brand-yellow-400 pb-4">
              <div className="flex items-center gap-2.5">
                <UserIcon className="h-5 w-5 text-brand-yellow-400" />
                <h3 className="text-xl font-display font-black text-brand-yellow-400 uppercase tracking-tight">
                  {isRegisterMode ? "REJESTRACJA" : "LOGOWANIE"}
                </h3>
              </div>
              <button 
                onClick={() => {
                  setIsLoginOpen(false);
                  setIsRegisterMode(false);
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className="p-1 rounded-none text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors border border-transparent hover:border-zinc-700"
              >
                <X className="h-5 w-5 stroke-[2.5]" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-950/80 border-2 border-red-600 text-red-200 text-xs rounded-none flex items-center gap-2 font-black uppercase tracking-wider">
                <span className="font-black text-red-500">BŁĄD:</span> {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-950/80 border-2 border-emerald-600 text-emerald-200 text-xs rounded-none flex items-center gap-2 font-black uppercase tracking-wider">
                <span className="font-black text-emerald-400">INFO:</span> {successMsg}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-zinc-400 mb-1.5 font-mono">
                  Użytkownik / Login
                </label>
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Wpisz nazwę..."
                  className="w-full px-4 py-3 bg-zinc-950 border-2 border-zinc-800 rounded-none text-white placeholder-zinc-700 focus:outline-none focus:border-brand-yellow-400 transition-all text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-zinc-400 mb-1.5 font-mono">
                  Hasło
                </label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Wpisz hasło..."
                  className="w-full px-4 py-3 bg-zinc-950 border-2 border-zinc-800 rounded-none text-white placeholder-zinc-700 focus:outline-none focus:border-brand-yellow-400 transition-all text-sm font-mono"
                />
              </div>

              {isRegisterMode && (
                <div className="space-y-4 pt-2 border-t-2 border-zinc-900">
                  <p className="text-[10px] font-mono font-black text-brand-yellow-400 uppercase tracking-widest">
                    ▼ DANE DO DOSTAWY / WYSYŁKI
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 font-mono">
                        Imię
                      </label>
                      <input
                        type="text"
                        required
                        value={regFirstName}
                        onChange={(e) => setRegFirstName(e.target.value)}
                        placeholder="np. Jan"
                        className="w-full px-4 py-2.5 bg-zinc-950 border-2 border-zinc-800 rounded-none text-white placeholder-zinc-700 focus:outline-none focus:border-brand-yellow-400 text-xs font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 font-mono">
                        Nazwisko
                      </label>
                      <input
                        type="text"
                        required
                        value={regLastName}
                        onChange={(e) => setRegLastName(e.target.value)}
                        placeholder="np. Kowalski"
                        className="w-full px-4 py-2.5 bg-zinc-950 border-2 border-zinc-800 rounded-none text-white placeholder-zinc-700 focus:outline-none focus:border-brand-yellow-400 text-xs font-sans"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 font-mono">
                      Adres E-mail
                    </label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="np. jan@przyklad.pl"
                      className="w-full px-4 py-2.5 bg-zinc-950 border-2 border-zinc-800 rounded-none text-white placeholder-zinc-700 focus:outline-none focus:border-brand-yellow-400 text-xs font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 font-mono">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="np. 500600700"
                      className="w-full px-4 py-2.5 bg-zinc-950 border-2 border-zinc-800 rounded-none text-white placeholder-zinc-700 focus:outline-none focus:border-brand-yellow-400 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 font-mono">
                      Ulica, numer domu / mieszkania
                    </label>
                    <input
                      type="text"
                      required
                      value={regStreet}
                      onChange={(e) => setRegStreet(e.target.value)}
                      placeholder="np. Rynek 1"
                      className="w-full px-4 py-2.5 bg-zinc-950 border-2 border-zinc-800 rounded-none text-white placeholder-zinc-700 focus:outline-none focus:border-brand-yellow-400 text-xs font-sans"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 font-mono">
                        Kod pocztowy
                      </label>
                      <input
                        type="text"
                        required
                        value={regZipCode}
                        onChange={(e) => setRegZipCode(e.target.value)}
                        placeholder="35-001"
                        className="w-full px-4 py-2.5 bg-zinc-950 border-2 border-zinc-800 rounded-none text-white placeholder-zinc-700 focus:outline-none focus:border-brand-yellow-400 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 font-mono">
                        Miejscowość / Miasto
                      </label>
                      <input
                        type="text"
                        required
                        value={regCity}
                        onChange={(e) => setRegCity(e.target.value)}
                        placeholder="np. Rzeszów"
                        className="w-full px-4 py-2.5 bg-zinc-950 border-2 border-zinc-800 rounded-none text-white placeholder-zinc-700 focus:outline-none focus:border-brand-yellow-400 text-xs font-sans"
                      />
                    </div>
                  </div>
                  
                  <p className="text-[11px] text-brand-yellow-400 font-black uppercase tracking-widest text-center pt-2 font-mono">
                    ★ Twoje dane służą nam do wysyłki
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 bg-brand-yellow-400 hover:bg-brand-yellow-300 text-black font-black rounded-none transition-transform hover:scale-[1.02] active:scale-100 text-sm tracking-widest uppercase border-2 border-black"
              >
                {isRegisterMode ? "ZAREJESTRUJ SIĘ" : "ZALOGUJ SIĘ"}
              </button>
            </form>

            {/* Toggle mode links */}
            <div className="mt-6 pt-5 border-t border-zinc-800 text-center text-xs">
              {isRegisterMode ? (
                <p className="text-zinc-400 font-sans">
                  Masz już konto?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisterMode(false);
                      setErrorMsg("");
                      setSuccessMsg("");
                    }}
                    className="text-brand-yellow-400 font-bold hover:underline font-mono uppercase tracking-widest pl-1"
                  >
                    Zaloguj się
                  </button>
                </p>
              ) : (
                <p className="text-zinc-400 font-sans">
                  Nie masz konta?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisterMode(true);
                      setErrorMsg("");
                      setSuccessMsg("");
                    }}
                    className="text-brand-yellow-400 font-bold hover:underline font-mono uppercase tracking-widest pl-1"
                  >
                    Zarejestruj się
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
