import { useState, useEffect } from "react";
import { ShieldCheck, Calendar, Package, User, MapPin, Phone, Mail, DollarSign, ListOrdered, CheckCircle2, RefreshCw, AlertCircle, TrendingUp, Plus, Minus, Check, Search, Filter, Database } from "lucide-react";
import { Order, User as UserType, Product } from "../types";

interface AdminDashboardProps {
  currentUser: UserType | null;
  products?: Product[];
  onRefreshProducts?: () => Promise<void>;
}

export default function AdminDashboard({ currentUser, products = [], onRefreshProducts }: AdminDashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"Złożone" | "W realizacji" | "Zrealizowane" | "Wszystkie">("Złożone");
  
  // Navigation section toggled by admin
  const [currentSection, setCurrentSection] = useState<"orders" | "products">("orders");

  // State for products search & filter
  const [productSearch, setProductSearch] = useState("");
  const [productCategory, setProductCategory] = useState("Wszystkie");

  // State for tracking which order status is updating
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  // State for tracking modified stock levels
  const [editingStocks, setEditingStocks] = useState<Record<number, number>>({});
  const [savingProductId, setSavingProductId] = useState<number | null>(null);
  const [saveSuccessId, setSaveSuccessId] = useState<number | null>(null);

  // Sync editing stocks dictionary when products prop changes
  useEffect(() => {
    if (products) {
      const initial: Record<number, number> = {};
      products.forEach((p) => {
        initial[p.id] = p.stock;
      });
      setEditingStocks(initial);
    }
  }, [products]);

  const handleStockValueChange = (productId: number, val: number) => {
    setEditingStocks((prev) => ({
      ...prev,
      [productId]: Math.max(0, val)
    }));
  };

  const handleSaveStock = async (productId: number) => {
    const newStock = editingStocks[productId];
    if (newStock === undefined || newStock < 0) return;

    setSavingProductId(productId);
    try {
      const response = await fetch(`/api/products/${productId}/stock`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUser?.token}`
        },
        body: JSON.stringify({ stock: newStock })
      });

      if (response.ok) {
        setSaveSuccessId(productId);
        setTimeout(() => setSaveSuccessId(null), 2000);
        if (onRefreshProducts) {
          await onRefreshProducts();
        }
      } else {
        alert("Błąd podczas aktualizacji stanu magazynowego.");
      }
    } catch (err) {
      console.error(err);
      alert("Błąd połączenia z serwerem.");
    } finally {
      setSavingProductId(null);
    }
  };

  useEffect(() => {
    if (currentUser?.role === "Owner") {
      fetchOrders();
    }
  }, [currentUser]);

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/orders", {
        headers: {
          Authorization: `Bearer ${currentUser?.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      } else {
        setError("Brak uprawnień lub błąd serwera przy pobieraniu zamówień.");
      }
    } catch (err) {
      setError("Błąd połączenia z serwerem podczas pobierania bazy zamówień.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUser?.token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Update local state smoothly
        setOrders((prevOrders) =>
          prevOrders.map((o) => (o.id === orderId ? { ...o, status: o.status = newStatus as any } : o))
        );
      } else {
        alert("Błąd podczas aktualizacji statusu zamówienia.");
      }
    } catch (err) {
      console.error(err);
      alert("Błąd połączenia z serwerem.");
    } finally {
      setUpdatingOrderId(null);
    }
  };



  // KPI Analytics calculations
  const totalRevenue = orders.reduce((acc, o) => acc + o.totalAmount, 0);
  const placedCount = orders.filter((o) => o.status === "Złożone").length;
  const inProgressCount = orders.filter((o) => o.status === "W realizacji").length;
  const completedCount = orders.filter((o) => o.status === "Zrealizowane").length;

  const filteredOrders = orders.filter((o) => {
    if (activeTab === "Wszystkie") return true;
    return o.status === activeTab;
  });

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return `${d.toLocaleDateString("pl-PL")}r. godz. ${d.toLocaleTimeString("pl-PL", { hour: '2-digit', minute: '2-digit' })}`;
    } catch (e) {
      return isoStr;
    }
  };

  if (!currentUser || currentUser.role !== "Owner") {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto stroke-[2.5]" />
        <h3 className="text-xl font-black text-white uppercase tracking-tight">BRAK DOSTĘPU</h3>
        <p className="text-xs text-zinc-400 font-sans">Dostęp do tej podstrony mają wyłącznie zalogowani użytkownicy z uprawnieniami administratora.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none mx-auto px-4 sm:px-8 md:px-12 xl:px-20 2xl:px-28 3xl:px-36 4xl:px-44 space-y-8 pb-12" id="admin-dashboard-page">
      {/* Title Header */}
      <div className="border-b-4 border-white pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-black text-red-500 uppercase tracking-widest flex items-center gap-1.5 mb-1">
            <ShieldCheck className="h-4.5 w-4.5" /> AUTORYZOWANY PANEL WŁAŚCICIELA
          </span>
          <h1 className="text-3xl sm:text-4xl font-display font-black text-white uppercase tracking-tighter">ZARZĄDZANIE SKLEPEM I ZAMÓWIENIAMI</h1>
          <p className="text-zinc-400 text-xs mt-1 font-sans">Poziom dostępu: Owner (Administrator bazy danych)</p>
        </div>
        <button
          onClick={currentSection === "orders" ? fetchOrders : onRefreshProducts}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-brand-yellow-400 hover:bg-white text-black font-black uppercase text-xs tracking-wider border-2 border-black rounded-none transition-colors w-fit"
          title={currentSection === "orders" ? "Odśwież dane zamówień" : "Odśwież stan magazynowy"}
        >
          <RefreshCw className="h-3.5 w-3.5 stroke-[2.5]" />
          ODŚWIEŻ LISTĘ
        </button>
      </div>

      {/* Primary Navigation Toggle (Section Selector) */}
      <div className="flex border-4 border-white bg-black p-1 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)]">
        <button
          onClick={() => setCurrentSection("orders")}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs sm:text-sm font-mono font-black uppercase tracking-wider transition-all rounded-none ${
            currentSection === "orders"
              ? "bg-brand-yellow-400 text-black border-2 border-black"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900"
          }`}
        >
          <ListOrdered className="h-4.5 w-4.5 stroke-[2.5]" />
          Zarządzanie Zamówieniami
        </button>
        <button
          onClick={() => setCurrentSection("products")}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs sm:text-sm font-mono font-black uppercase tracking-wider transition-all rounded-none ${
            currentSection === "products"
              ? "bg-brand-yellow-400 text-black border-2 border-black"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900"
          }`}
        >
          <Package className="h-4.5 w-4.5 stroke-[2.5]" />
          Zarządzanie Magazynem
        </button>
      </div>

      {currentSection === "orders" ? (
        <>
          {/* Analytical KPI Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="admin-analytics-kpi">
            {/* Card 1: Revenue */}
            <div className="bg-black border-4 border-white rounded-none p-5 shadow-[4px_4px_0px_0px_#FFE200] flex items-center gap-4">
              <div className="p-3.5 bg-brand-yellow-400 text-black border-2 border-black rounded-none">
                <TrendingUp className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-black">Łączny obrót</p>
                <h4 className="text-xl font-display font-black text-white">{totalRevenue.toFixed(2)} PLN</h4>
              </div>
            </div>

            {/* Card 2: Placed Count */}
            <div className="bg-black border-4 border-white rounded-none p-5 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)] flex items-center gap-4">
              <div className="p-3.5 bg-sky-500 text-white border-2 border-black rounded-none">
                <ListOrdered className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-black">Status: Złożone</p>
                <h4 className="text-xl font-display font-black text-sky-400">{placedCount} ZAMÓWIEŃ</h4>
              </div>
            </div>

            {/* Card 3: In Progress Count */}
            <div className="bg-black border-4 border-white rounded-none p-5 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)] flex items-center gap-4">
              <div className="p-3.5 bg-brand-yellow-500 text-black border-2 border-black rounded-none">
                <Package className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-black">Status: W realizacji</p>
                <h4 className="text-xl font-display font-black text-brand-yellow-500">{inProgressCount} ZAMÓWIEŃ</h4>
              </div>
            </div>

            {/* Card 4: Completed Count */}
            <div className="bg-black border-4 border-white rounded-none p-5 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)] flex items-center gap-4">
              <div className="p-3.5 bg-emerald-500 text-white border-2 border-black rounded-none">
                <CheckCircle2 className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-black">Status: Zrealizowane</p>
                <h4 className="text-xl font-display font-black text-emerald-400">{completedCount} ZAMÓWIEŃ</h4>
              </div>
            </div>
          </div>

          {/* Tabs Filter */}
          <div className="flex border-b-4 border-zinc-900 bg-zinc-950 p-1 flex-wrap">
            {(["Złożone", "W realizacji", "Zrealizowane", "Wszystkie"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-xs font-mono font-black uppercase tracking-widest rounded-none transition-colors ${
                  activeTab === tab
                    ? "bg-brand-yellow-400 text-black border-2 border-black font-black"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Loading & Errors */}
          {loading && (
            <div className="py-20 text-center space-y-4">
              <div className="inline-block w-8 h-8 border-4 border-brand-yellow-400 border-t-transparent animate-spin"></div>
              <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest font-black">Pobieranie rejestrów zamówień...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-950/40 border-4 border-red-600 p-8 rounded-none text-center max-w-md mx-auto space-y-3">
              <AlertCircle className="h-10 w-10 text-red-500 mx-auto stroke-[2.5]" />
              <h3 className="text-lg font-black text-white uppercase">Błąd bazy danych</h3>
              <p className="text-xs text-red-200 font-mono">{error}</p>
            </div>
          )}

          {/* Orders List */}
          {!loading && !error && (
            <div className="space-y-6">
              {filteredOrders.length === 0 ? (
                <div className="bg-zinc-950 border-4 border-zinc-800 rounded-none p-12 text-center text-zinc-500 space-y-3">
                  <Package className="h-10 w-10 mx-auto text-zinc-700" />
                  <p className="text-sm font-mono font-bold uppercase">Brak zamówień o wybranym statusie: {activeTab}</p>
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-black border-4 border-white rounded-none p-6 shadow-[6px_6px_0px_0px_rgba(255,255,255,0.15)] space-y-6"
                  >
                    {/* Order Top Bar: ID, Date, Status */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between border-b-2 border-zinc-900 pb-4 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-mono font-black text-black bg-brand-yellow-400 px-2.5 py-1.5 border-2 border-black uppercase">
                            ZAMÓWIENIE #{order.id}
                          </span>
                          <span className={`text-[9px] font-mono font-black uppercase px-2.5 py-1 border-2 ${
                            order.status === "Złożone"
                              ? "bg-sky-500/10 text-sky-400 border-sky-400"
                              : order.status === "W realizacji"
                                ? "bg-brand-yellow-500/10 text-brand-yellow-500 border-brand-yellow-500"
                                : order.status === "Zrealizowane"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-400"
                                  : "bg-red-500/10 text-red-500 border-red-500"
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 flex items-center gap-1 font-mono pt-2 font-bold uppercase">
                          <Calendar className="h-3.5 w-3.5 text-zinc-600" /> ZŁOŻONO: {formatDate(order.createdAt)}
                        </p>
                      </div>

                      {/* Status Dropdown selector */}
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-zinc-400 font-mono font-black uppercase tracking-wider">Zmień status:</span>
                          <select
                            value={order.status}
                            disabled={updatingOrderId === order.id}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className="px-3 py-2 bg-zinc-950 border-2 border-zinc-800 text-xs font-mono font-bold rounded-none text-zinc-300 focus:outline-none focus:border-brand-yellow-400 cursor-pointer disabled:opacity-50 uppercase tracking-wide"
                          >
                            <option value="Złożone">Złożone</option>
                            <option value="W realizacji">W realizacji</option>
                            <option value="Zrealizowane">Zrealizowane</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Items & Shipping grids */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Items list */}
                      <div className="lg:col-span-7 space-y-3">
                        <p className="text-xs font-mono font-black text-zinc-400 uppercase flex items-center gap-1.5 border-b-2 border-zinc-900 pb-1.5 tracking-wider">
                          <Package className="h-4.5 w-4.5 text-brand-yellow-400" /> POZYCJE ZAMÓWIENIA ({order.items.reduce((acc, i) => acc + i.quantity, 0)})
                        </p>
                        <div className="divide-y-2 divide-black bg-zinc-950 rounded-none border-2 border-zinc-800 px-4">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="py-3 flex items-center justify-between text-xs sm:text-sm">
                              <div>
                                <span className="font-black text-white uppercase">{item.name}</span>
                                <span className="text-zinc-500 ml-2 font-mono font-bold">X{item.quantity}</span>
                              </div>
                              <span className="font-mono font-black text-brand-yellow-400">{(item.price * item.quantity).toFixed(2)} PLN</span>
                            </div>
                          ))}
                        </div>
                        <div className="text-right pt-2">
                          <p className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-widest">Suma końcowa (z dostawą):</p>
                          <p className="text-xl font-display font-black text-brand-yellow-400">{order.totalAmount.toFixed(2)} PLN</p>
                        </div>
                      </div>

                      {/* Shipping Info */}
                      <div className="lg:col-span-5 space-y-4">
                        <p className="text-xs font-mono font-black text-zinc-400 uppercase flex items-center gap-1.5 border-b-2 border-zinc-900 pb-1.5 tracking-wider">
                          <User className="h-4.5 w-4.5 text-brand-yellow-400" /> SZCZEGÓŁY DOSTAWY I ODBIORCA
                        </p>
                        <div className="bg-zinc-950 rounded-none border-2 border-zinc-800 p-4 text-xs sm:text-sm space-y-3">
                          <div className="flex items-start gap-2.5">
                            <User className="h-4 w-4 text-zinc-500 flex-shrink-0 mt-0.5 stroke-[2]" />
                            <div>
                              <p className="text-zinc-500 text-[9px] font-mono font-bold uppercase">Odbiorca</p>
                              <p className="font-black text-white uppercase">{order.customerFirstName} {order.customerLastName}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2.5">
                            <MapPin className="h-4 w-4 text-zinc-500 flex-shrink-0 mt-0.5 stroke-[2]" />
                            <div>
                              <p className="text-zinc-500 text-[9px] font-mono font-bold uppercase">Adres wysyłki</p>
                              <p className="font-black text-white uppercase">{order.address}</p>
                              <p className="text-zinc-400 font-mono font-bold uppercase text-[11px]">{order.zipCode} {order.city}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-start gap-2.5">
                              <Phone className="h-4 w-4 text-zinc-500 flex-shrink-0 mt-0.5 stroke-[2]" />
                              <div>
                                <p className="text-zinc-500 text-[9px] font-mono font-bold uppercase">Telefon</p>
                                <a href={`tel:${order.phone}`} className="font-bold text-brand-yellow-400 hover:underline font-mono">{order.phone}</a>
                              </div>
                            </div>

                            <div className="flex items-start gap-2.5">
                              <Mail className="h-4 w-4 text-zinc-500 flex-shrink-0 mt-0.5 stroke-[2]" />
                              <div>
                                <p className="text-zinc-500 text-[9px] font-mono font-bold uppercase">Adres e-mail</p>
                                <a href={`mailto:${order.customerEmail}`} className="font-bold text-brand-yellow-400 hover:underline break-all font-mono">{order.customerEmail}</a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6">
          {/* Analytical Product KPI Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="admin-product-kpi">
            <div className="bg-black border-4 border-white rounded-none p-5 shadow-[4px_4px_0px_0px_#FFE200] flex items-center gap-4">
              <div className="p-3.5 bg-brand-yellow-400 text-black border-2 border-black rounded-none">
                <Package className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-black">Wszystkie produkty</p>
                <h4 className="text-xl font-display font-black text-white">{products.length} GIER</h4>
              </div>
            </div>

            <div className="bg-black border-4 border-white rounded-none p-5 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)] flex items-center gap-4">
              <div className="p-3.5 bg-emerald-500 text-white border-2 border-black rounded-none">
                <Database className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-black">Stan ogólny magazynu</p>
                <h4 className="text-xl font-display font-black text-emerald-400">
                  {products.reduce((acc, p) => acc + p.stock, 0)} SZT.
                </h4>
              </div>
            </div>

            <div className="bg-black border-4 border-white rounded-none p-5 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)] flex items-center gap-4">
              <div className="p-3.5 bg-red-600 text-white border-2 border-black rounded-none">
                <AlertCircle className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-black">Brak w magazynie</p>
                <h4 className="text-xl font-display font-black text-red-500">
                  {products.filter((p) => p.stock === 0).length} PRODUKTÓW
                </h4>
              </div>
            </div>

            <div className="bg-black border-4 border-white rounded-none p-5 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)] flex items-center gap-4">
              <div className="p-3.5 bg-brand-yellow-500 text-black border-2 border-black rounded-none">
                <TrendingUp className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-black font-bold">Niski stan (&lt; 5 szt.)</p>
                <h4 className="text-xl font-display font-black text-brand-yellow-500">
                  {products.filter((p) => p.stock > 0 && p.stock < 5).length} PRODUKTÓW
                </h4>
              </div>
            </div>
          </div>

          {/* Product Filter & Search controls */}
          <div className="bg-black border-4 border-white rounded-none p-5 space-y-4 shadow-[6px_6px_0px_0px_rgba(255,255,255,0.15)]">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Search */}
              <div className="relative md:col-span-7">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500 h-4.5 w-4.5" />
                <input
                  type="text"
                  placeholder="Wyszukaj produkt po nazwie..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-zinc-950 border-2 border-zinc-800 rounded-none text-white placeholder-zinc-700 focus:outline-none focus:border-brand-yellow-400 text-sm font-sans"
                />
              </div>

              {/* Category */}
              <div className="md:col-span-5 flex items-center gap-2">
                <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wider whitespace-nowrap">Kategoria:</span>
                <select
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-950 border-2 border-zinc-800 rounded-none text-zinc-300 text-xs font-mono focus:outline-none focus:border-brand-yellow-400 cursor-pointer uppercase tracking-wider font-bold"
                >
                  {["Wszystkie", "Rodzinne", "Strategiczne", "Przygodowe", "Karciane", "Imprezowe", "Ekonomiczne"].map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Products List/Grid with Stock Edit Panel */}
          <div className="space-y-4">
            {products.filter((p) => {
              const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase());
              const matchesCategory = productCategory === "Wszystkie" || p.category === productCategory;
              return matchesSearch && matchesCategory;
            }).length === 0 ? (
              <div className="bg-zinc-950 border-4 border-zinc-800 rounded-none p-12 text-center text-zinc-500 space-y-3">
                <Package className="h-10 w-10 mx-auto text-zinc-700" />
                <p className="text-sm font-mono font-bold uppercase">Nie znaleziono produktów spełniających kryteria</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {products
                  .filter((p) => {
                    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase());
                    const matchesCategory = productCategory === "Wszystkie" || p.category === productCategory;
                    return matchesSearch && matchesCategory;
                  })
                  .map((p) => {
                    const currentStock = editingStocks[p.id] !== undefined ? editingStocks[p.id] : p.stock;
                    const hasUnsavedChanges = currentStock !== p.stock;

                    return (
                      <div
                        key={p.id}
                        className="bg-black border-4 border-white rounded-none p-5 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] flex flex-col justify-between gap-4 border-b-4"
                      >
                        <div className="flex gap-4">
                          {p.image && (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-16 h-16 object-cover border-2 border-zinc-850 bg-zinc-950 flex-shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          )}
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono font-black text-black bg-brand-yellow-400 px-1.5 py-0.5 uppercase tracking-wide">
                              {p.category}
                            </span>
                            <h3 className="text-base font-display font-black text-white uppercase leading-tight">{p.name}</h3>
                            <p className="text-xs text-zinc-500 font-mono font-bold">{p.price.toFixed(2)} PLN</p>
                          </div>
                        </div>

                        <div className="border-t-2 border-zinc-900 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <p className="text-[9px] text-zinc-500 font-mono font-bold uppercase tracking-wider">Aktualny stan:</p>
                            <div className="flex items-center gap-2">
                              <span className={`text-lg font-display font-black ${p.stock === 0 ? "text-red-500" : p.stock < 5 ? "text-brand-yellow-500" : "text-emerald-400"}`}>
                                {p.stock} szt.
                              </span>
                              {hasUnsavedChanges && (
                                <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 font-mono font-bold animate-pulse">
                                  MODYFIKOWANO
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Stock edit controls */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center border-2 border-zinc-800 bg-zinc-950">
                              <button
                                type="button"
                                onClick={() => handleStockValueChange(p.id, currentStock - 1)}
                                className="px-2.5 py-1.5 hover:bg-zinc-900 text-white transition-colors cursor-pointer"
                                title="Zmniejsz o 1"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <input
                                type="number"
                                min="0"
                                value={currentStock}
                                onChange={(e) => handleStockValueChange(p.id, parseInt(e.target.value) || 0)}
                                className="w-12 text-center bg-transparent text-white font-mono font-bold text-xs focus:outline-none border-x-2 border-zinc-800 py-1"
                              />
                              <button
                                type="button"
                                onClick={() => handleStockValueChange(p.id, currentStock + 1)}
                                className="px-2.5 py-1.5 hover:bg-zinc-900 text-white transition-colors cursor-pointer"
                                title="Zwiększ o 1"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleSaveStock(p.id)}
                              disabled={savingProductId === p.id || !hasUnsavedChanges}
                              className={`px-4 py-2 border-2 border-black text-xs font-mono font-black uppercase tracking-wider rounded-none transition-all shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 disabled:opacity-40 disabled:pointer-events-none cursor-pointer ${
                                hasUnsavedChanges ? "bg-brand-yellow-400 text-black" : "bg-zinc-800 text-zinc-500"
                              }`}
                            >
                              {savingProductId === p.id ? "ZAPIS..." : "ZAPISZ"}
                            </button>
                          </div>
                        </div>

                        {saveSuccessId === p.id && (
                          <div className="text-right">
                            <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider flex items-center justify-end gap-1">
                              <Check className="h-3.5 w-3.5" /> Stan zapisany pomyślnie!
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
