import { useState, useEffect, FormEvent } from "react";
import { User, Package, Calendar, MapPin, Phone, Mail, FileText, CheckCircle2, Clock, AlertCircle, RefreshCw, Save } from "lucide-react";
import { User as UserType, Order } from "../types";

interface ClientDashboardProps {
  currentUser: UserType | null;
  onProfileUpdate: (updatedUser: Partial<UserType>) => void;
  onGoToStore: () => void;
}

export default function ClientDashboard({ currentUser, onProfileUpdate, onGoToStore }: ClientDashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState("");

  // Profile form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (currentUser) {
      // Load current profile fields
      setFirstName(currentUser.firstName || (currentUser.fullName ? currentUser.fullName.split(" ")[0] : ""));
      setLastName(currentUser.lastName || (currentUser.fullName ? currentUser.fullName.split(" ").slice(1).join(" ") : ""));
      setEmail(currentUser.email || "");
      setPhone(currentUser.phone || "");
      setAddress(currentUser.address || "");
      setCity(currentUser.city || "");
      setZipCode(currentUser.zipCode || "");

      // Fetch user orders
      fetchUserOrders();
    }
  }, [currentUser]);

  const fetchUserOrders = async () => {
    if (!currentUser) return;
    setLoadingOrders(true);
    setOrdersError("");
    try {
      const response = await fetch(`/api/users/${currentUser.username}/orders`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      } else {
        setOrdersError("Nie udało się pobrać historii zamówień.");
      }
    } catch (err) {
      setOrdersError("Błąd połączenia z serwerem podczas pobierania zamówień.");
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setSavingProfile(true);
    setSuccessMsg("");
    setErrorMsg("");

    const zipPattern = /^[0-9]{2}-[0-9]{3}$/;
    if (zipCode && !zipPattern.test(zipCode)) {
      setErrorMsg("Kod pocztowy musi mieć format XX-XXX (np. 35-001).");
      setSavingProfile(false);
      return;
    }

    try {
      const response = await fetch(`/api/users/${currentUser.username}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          address,
          city,
          zipCode
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMsg("Dane profilu zostały pomyślnie zaktualizowane!");
        // Update user context state in App.tsx
        onProfileUpdate({
          firstName,
          lastName,
          email,
          phone,
          address,
          city,
          zipCode
        });
      } else {
        setErrorMsg(data.error || "Wystąpił błąd podczas zapisywania profilu.");
      }
    } catch (err) {
      setErrorMsg("Błąd połączenia z serwerem podczas zapisywania zmian.");
    } finally {
      setSavingProfile(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4" id="client-dashboard-unauth">
        <AlertCircle className="h-12 w-12 text-brand-yellow-400 mx-auto stroke-[2.5]" />
        <h3 className="text-xl font-black text-white uppercase tracking-tight">ZALOGUJ SIĘ</h3>
        <p className="text-xs text-zinc-400 font-sans">Musisz być zalogowany, aby uzyskać dostęp do swojego panelu klienta.</p>
      </div>
    );
  }

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return `${d.toLocaleDateString("pl-PL")}r. godz. ${d.toLocaleTimeString("pl-PL", { hour: '2-digit', minute: '2-digit' })}`;
    } catch (e) {
      return isoStr;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Zrealizowane":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-950 text-emerald-400 border border-emerald-500 text-[10px] font-mono uppercase tracking-wider font-black">
            <CheckCircle2 className="h-3.5 w-3.5 stroke-[2.5]" /> Zrealizowane
          </span>
        );
      case "W realizacji":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-950 text-indigo-400 border border-indigo-500 text-[10px] font-mono uppercase tracking-wider font-black">
            <RefreshCw className="h-3.5 w-3.5 stroke-[2.5] animate-spin" /> W realizacji
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-900 text-brand-yellow-400 border border-brand-yellow-400 text-[10px] font-mono uppercase tracking-wider font-black">
            <Clock className="h-3.5 w-3.5 stroke-[2.5]" /> Złożone
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-none mx-auto px-4 sm:px-8 md:px-12 xl:px-20 2xl:px-28 3xl:px-36 4xl:px-44 pb-20" id="client-dashboard-main">
      {/* Upper header block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b-4 border-white pb-6">
        <div>
          <div className="text-[10px] font-mono font-black text-brand-yellow-400 uppercase tracking-widest flex items-center gap-1.5">
            <User className="h-4 w-4" /> PANEL KLIENTA ZAKĄTKA
          </div>
          <h2 className="text-3xl font-display font-black text-white uppercase tracking-tight mt-1">
            Witaj, <span className="text-brand-yellow-400">{currentUser.username}</span>!
          </h2>
        </div>
        <button
          onClick={onGoToStore}
          className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-mono font-black uppercase text-xs border-2 border-white tracking-wider hover:scale-[1.02] transition-all"
        >
          Powrót do sklepu
        </button>
      </div>

      {/* Grid: Profile Editor Left, Orders History Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Profile Editor */}
        <div className="lg:col-span-5 bg-black border-4 border-white p-6 shadow-[6px_6px_0px_0px_rgba(255,255,255,0.15)] relative">
          <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 bg-brand-yellow-400 text-black border-2 border-black font-mono font-black text-[10px] uppercase tracking-wider px-2 py-0.5">
            PROFIL
          </div>
          <h3 className="text-lg font-display font-black text-white uppercase tracking-tight mb-4 pb-2 border-b-2 border-zinc-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-brand-yellow-400" /> Twoje Dane do Wysyłki
          </h3>

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-950/50 border-2 border-emerald-500 text-emerald-200 text-xs rounded-none font-bold font-sans uppercase tracking-wide">
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-950/80 border-2 border-red-600 text-red-200 text-xs rounded-none font-mono font-black uppercase tracking-wider">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1 font-mono">Imię</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="np. Jan"
                  className="w-full px-4 py-2.5 bg-zinc-950 border-2 border-zinc-800 rounded-none text-white placeholder-zinc-700 focus:outline-none focus:border-brand-yellow-400 text-xs font-sans"
                />
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1 font-mono">Nazwisko</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="np. Kowalski"
                  className="w-full px-4 py-2.5 bg-zinc-950 border-2 border-zinc-800 rounded-none text-white placeholder-zinc-700 focus:outline-none focus:border-brand-yellow-400 text-xs font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1 font-mono">Adres E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="np. jan@gmail.com"
                className="w-full px-4 py-2.5 bg-zinc-950 border-2 border-zinc-800 rounded-none text-white placeholder-zinc-700 focus:outline-none focus:border-brand-yellow-400 text-xs font-sans"
              />
            </div>

            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1 font-mono">Telefon</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="np. 500600700"
                className="w-full px-4 py-2.5 bg-zinc-950 border-2 border-zinc-800 rounded-none text-white placeholder-zinc-700 focus:outline-none focus:border-brand-yellow-400 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1 font-mono">Ulica, numer domu / mieszkania</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="np. Rynek 1"
                className="w-full px-4 py-2.5 bg-zinc-950 border-2 border-zinc-800 rounded-none text-white placeholder-zinc-700 focus:outline-none focus:border-brand-yellow-400 text-xs font-sans"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1 font-mono">Kod pocztowy</label>
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="35-001"
                  className="w-full px-4 py-2.5 bg-zinc-950 border-2 border-zinc-800 rounded-none text-white placeholder-zinc-700 focus:outline-none focus:border-brand-yellow-400 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1 font-mono">Miejscowość / Miasto</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="np. Rzeszów"
                  className="w-full px-4 py-2.5 bg-zinc-950 border-2 border-zinc-800 rounded-none text-white placeholder-zinc-700 focus:outline-none focus:border-brand-yellow-400 text-xs font-sans"
                />
              </div>
            </div>

            <p className="text-[10px] text-zinc-500 font-mono text-center pt-1 leading-relaxed">
              * Te dane będą automatycznie pobierane do każdego zamówienia w Twoim koszyku, co przyspieszy zakupy.
            </p>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full py-3.5 bg-brand-yellow-400 hover:bg-white text-black font-black text-xs tracking-widest uppercase rounded-none transition-colors border-2 border-black flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              {savingProfile ? "ZAPISYWANIE..." : "ZAPISZ ZMIANY W PROFILU"}
            </button>
          </form>
        </div>

        {/* Right column: Order History */}
        <div className="lg:col-span-7 bg-zinc-950 border-4 border-white p-6 shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)] relative">
          <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 bg-zinc-900 text-white border-2 border-white font-mono font-black text-[10px] uppercase tracking-wider px-2 py-0.5">
            ZAMÓWIENIA
          </div>
          <h3 className="text-lg font-display font-black text-white uppercase tracking-tight mb-4 pb-2 border-b-2 border-zinc-900 flex items-center gap-2">
            <Package className="h-5 w-5 text-brand-yellow-400" /> Historia Twoich Zamówień
          </h3>

          {loadingOrders ? (
            <div className="py-20 text-center text-zinc-500 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="h-8 w-8 animate-spin text-brand-yellow-400" />
              <span className="text-xs font-mono font-black uppercase tracking-wider">Wczytywanie historii zamówień...</span>
            </div>
          ) : ordersError ? (
            <div className="p-4 bg-red-950/40 border-2 border-red-600 text-red-200 text-xs text-center font-mono font-bold">
              {ordersError}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-zinc-850 p-6 space-y-4">
              <Package className="h-10 w-10 text-zinc-700 mx-auto" />
              <div>
                <p className="text-sm font-bold text-zinc-400">Nie złożyłeś jeszcze żadnego zamówienia.</p>
                <p className="text-xs text-zinc-600 mt-1">Gdy dokonasz pierwszego zakupu gier, szczegóły pojawią się na tej liście.</p>
              </div>
              <button
                onClick={onGoToStore}
                className="px-4 py-2 bg-brand-yellow-400 text-black font-mono font-black text-xs uppercase tracking-wider border-2 border-black"
              >
                Przeglądaj Gry
              </button>
            </div>
          ) : (
            <div className="space-y-6 max-h-[600px] overflow-y-auto pr-1">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-black border-2 border-zinc-800 p-4 relative hover:border-zinc-700 transition-colors"
                >
                  {/* Order ID & Status line */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-900 pb-3 mb-3 gap-2">
                    <div>
                      <span className="text-xs font-mono font-black text-white uppercase">
                        Zamówienie <span className="text-brand-yellow-400">#{order.id}</span>
                      </span>
                      <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3 text-zinc-600" />
                        {formatDate(order.createdAt)}
                      </div>
                    </div>
                    <div>{getStatusBadge(order.status)}</div>
                  </div>

                  {/* List of items */}
                  <div className="space-y-1.5 mb-3.5">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs font-sans text-zinc-300">
                        <span>
                          {item.product?.name || "Gra planszowa"}{" "}
                          <span className="text-brand-yellow-400 font-mono font-bold">x{item.quantity}</span>
                        </span>
                        <span className="font-mono text-zinc-400">
                          {((item.product?.price || 0) * item.quantity).toFixed(2)} PLN
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Pricing / Details Summary */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-zinc-900 text-xs gap-2">
                    <div className="text-[10px] font-mono text-zinc-500 space-y-0.5">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {order.address}, {order.zipCode} {order.city}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {order.phone}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-500 uppercase font-mono block">Suma zamówienia</span>
                      <span className="text-sm font-display font-black text-brand-yellow-400 tracking-tight">
                        {order.totalAmount.toFixed(2)} PLN
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
