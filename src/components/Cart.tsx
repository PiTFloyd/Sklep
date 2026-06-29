import { useState, FormEvent, useEffect } from "react";
import { Trash2, ShoppingBag, Plus, Minus, ArrowRight, CheckCircle, Percent, Truck, Building } from "lucide-react";
import { CartItem, Product, User } from "../types";

interface CartProps {
  cart: CartItem[];
  currentUser: User | null;
  onUpdateQuantity: (productId: number, change: number) => void;
  onRemoveFromCart: (productId: number) => void;
  onClearCart: () => void;
  onGoToStore: () => void;
  onCheckoutSuccess?: () => void;
  onGoToProfile?: () => void;
}

export default function Cart({
  cart,
  currentUser,
  onUpdateQuantity,
  onRemoveFromCart,
  onClearCart,
  onGoToStore,
  onCheckoutSuccess,
  onGoToProfile
}: CartProps) {
  // Promo code
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [activeDiscount, setActiveDiscount] = useState(0); // decimal percent (e.g. 0.1 for 10%)
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState("");

  // Delivery type
  const [deliveryType, setDeliveryType] = useState<"paczkomat" | "kurier" | "personal">("paczkomat");

  // Checkout form fields
  const [formFirstName, setFormFirstName] = useState("");
  const [formLastName, setFormLastName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formStreet, setFormStreet] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formZip, setFormZip] = useState("");
  const [dbLoadedMessage, setDbLoadedMessage] = useState("");
  const [dbConnectionError, setDbConnectionError] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setDbLoadedMessage("");
      setDbConnectionError(false);
      const fetchUserProfile = async () => {
        try {
          const response = await fetch(`/api/users/${currentUser.username}`);
          if (response.ok) {
            const data = await response.json();
            setFormFirstName(data.firstName || (data.fullName ? data.fullName.split(" ")[0] : ""));
            setFormLastName(data.lastName || (data.fullName ? data.fullName.split(" ").slice(1).join(" ") : ""));
            setFormEmail(data.email || "");
            setFormPhone(data.phone || "");
            setFormStreet(data.address || "");
            setFormCity(data.city || "");
            setFormZip(data.zipCode || "");
            setDbConnectionError(false);
            if (data.firstName || data.fullName) {
              setDbLoadedMessage("✓ Dane do wysyłki zostały automatycznie pobrane z bazy danych Twojego konta.");
            } else {
              setDbLoadedMessage("Twoje konto nie posiada jeszcze zapisanych danych wysyłkowych. Wpisz je poniżej.");
            }
          } else {
            setDbConnectionError(true);
          }
        } catch (e) {
          console.error("Błąd podczas pobierania danych użytkownika z bazy danych:", e);
          setDbConnectionError(true);
        }
      };
      fetchUserProfile();
    } else {
      setDbLoadedMessage("");
      setDbConnectionError(false);
      setFormFirstName("");
      setFormLastName("");
      setFormEmail("");
      setFormPhone("");
      setFormStreet("");
      setFormCity("");
      setFormZip("");
    }
  }, [currentUser]);

  // Order status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState<{ id: number; total: number } | null>(null);
  const [orderError, setOrderError] = useState("");

  const itemsSubtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  // Delivery costs: Free shipping from 250 PLN, else Paczkomat: 15 PLN, Kurier: 19 PLN, Personal: 0 PLN
  const isFreeShipping = itemsSubtotal >= 250;
  const deliveryCost = isFreeShipping 
    ? 0 
    : deliveryType === "paczkomat" 
      ? 15 
      : deliveryType === "kurier" 
        ? 19 
        : 0;

  const discountAmount = itemsSubtotal * activeDiscount;
  const totalAmount = itemsSubtotal - discountAmount + deliveryCost;

  const handleApplyPromo = (e: FormEvent) => {
    e.preventDefault();
    setPromoError("");
    setPromoSuccess("");

    if (promoCodeInput.toUpperCase() === "KOSTKA10") {
      setActiveDiscount(0.1);
      setPromoSuccess("KOD 'KOSTKA10' AKTYWOWANY! OTRZYMUJESZ 10% RABATU.");
    } else {
      setPromoError("NIEPRAWIDŁOWY KOD RABATOWY.");
    }
  };

  const handleCheckoutSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (cart.length === 0) return;

    setOrderError("");
    setIsSubmitting(true);

    // Format zip-code to XX-XXX format validation if possible
    if (deliveryType !== "personal") {
      const zipPattern = /^[0-9]{2}-[0-9]{3}$/;
      if (!zipPattern.test(formZip)) {
        setOrderError("NIEPRAWIDŁOWY FORMAT KODU POCZTOWEGO. UŻYJ FORMATU XX-XXX (NP. 35-001).");
        setIsSubmitting(false);
        return;
      }
    }

    const orderPayload = {
      customerFirstName: formFirstName,
      customerLastName: formLastName,
      customerEmail: formEmail,
      address: deliveryType === "personal" ? "Odbiór osobisty (Rynek)" : formStreet,
      city: deliveryType === "personal" ? "Rzeszów" : formCity,
      zipCode: deliveryType === "personal" ? "35-000" : formZip,
      phone: formPhone,
      totalAmount: totalAmount,
      items: cart.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity
      })),
      username: currentUser?.username || null
    };

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessOrder({ id: data.id, total: totalAmount });
        onClearCart();
        onCheckoutSuccess?.();
      } else {
        setOrderError(data.message || data.error || "Wystąpił błąd podczas składania zamówienia.");
      }
    } catch (err) {
      setOrderError("Brak połączenia z serwerem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Success view
  if (successOrder !== null) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6" id="checkout-success">
        <div className="inline-flex items-center justify-center p-4 bg-brand-yellow-400 text-black border-4 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
          <CheckCircle className="h-16 w-16 stroke-[3]" />
        </div>
        <div className="space-y-3">
          <h2 className="text-4xl font-display font-black text-white uppercase tracking-tight">ZAMÓWIENIE ZAPISANE!</h2>
          <p className="text-zinc-400 text-xs leading-relaxed max-w-sm mx-auto font-sans">
            Twoje zamówienie zostało pomyślnie dodane do bazy danych sklepu. Właściciel wkrótce je zweryfikuje.
          </p>
        </div>

        <div className="bg-black border-4 border-brand-yellow-400 rounded-none p-6 text-left space-y-3 shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
          <p className="text-xs font-mono font-black uppercase text-brand-yellow-400 tracking-widest">Szczegóły transakcji</p>
          <div className="flex justify-between items-center py-2 border-b border-zinc-900">
            <span className="text-xs font-mono text-zinc-400 uppercase">Id zamówienia:</span>
            <span className="text-sm font-mono font-black text-brand-yellow-400">#{successOrder.id}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-zinc-900">
            <span className="text-xs font-mono text-zinc-400 uppercase">Odbiorca:</span>
            <span className="text-xs font-black text-white uppercase">{formFirstName} {formLastName}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-zinc-900">
            <span className="text-xs font-mono text-zinc-400 uppercase">Suma końcowa:</span>
            <span className="text-sm font-display font-black text-brand-yellow-400">
              {successOrder.total.toFixed(2)} PLN
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-xs font-mono text-zinc-400 uppercase">Typ wysyłki:</span>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-zinc-950 text-white rounded-none border-2 border-zinc-800 uppercase">
              {deliveryType === "paczkomat" ? "Paczkomat InPost" : deliveryType === "kurier" ? "Kurier" : "Odbiór osobisty w Rzeszowie"}
            </span>
          </div>
        </div>

        <button
          onClick={onGoToStore}
          className="w-full sm:w-auto px-8 py-4 bg-brand-yellow-400 hover:bg-white text-black font-black text-sm uppercase rounded-none transition-colors border-2 border-black tracking-widest shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
        >
          WRÓĆ DO OFERTY SKLEPU
        </button>
      </div>
    );
  }

  // 2. Empty cart view
  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6" id="empty-cart-view">
        <div className="inline-flex items-center justify-center p-4 bg-zinc-950 border-4 border-black text-zinc-500 rounded-none shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)]">
          <ShoppingBag className="h-12 w-12 stroke-[2]" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-display font-black text-white uppercase tracking-tight">KOSZYK JEST PUSTY</h2>
          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
            Nie dodałeś jeszcze żadnej gry do koszyka. Przeglądnij naszą bazę i wybierz coś idealnego dla siebie!
          </p>
        </div>
        <button
          onClick={onGoToStore}
          className="w-full px-6 py-4 bg-brand-yellow-400 hover:bg-white text-black font-black text-xs uppercase rounded-none transition-colors border-2 border-black tracking-widest shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
        >
          PRZEJDŹ DO SKLEPU GIER
        </button>
      </div>
    );
  }

  // 3. Regular Cart and Checkout view
  return (
    <div className="w-full max-w-none mx-auto px-4 sm:px-8 md:px-12 xl:px-20 2xl:px-28 3xl:px-36 4xl:px-44 space-y-10 pb-16" id="cart-page">
      <div className="border-b-4 border-white pb-4">
        <h1 className="text-4xl sm:text-5xl font-display font-black text-white uppercase tracking-tighter">MÓJ KOSZYK</h1>
        <p className="text-zinc-400 text-xs mt-1 font-sans">Skompletuj dane zamówienia i sfinalizuj transakcję stacjonarnie lub wysyłkowo.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Cart items & Promo */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-black border-4 border-white rounded-none overflow-hidden shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)]">
            {/* Header */}
            <div className="px-6 py-4 bg-zinc-950 border-b-4 border-black flex justify-between items-center">
              <span className="text-xs font-mono font-black text-zinc-300 uppercase tracking-widest">Wybrane planszówki</span>
              <button
                onClick={onClearCart}
                className="text-xs text-red-500 hover:text-red-400 font-bold uppercase tracking-wide flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5 stroke-[2.5]" />
                Wyczyść koszyk
              </button>
            </div>

            {/* Items List */}
            <div className="divide-y-4 divide-black bg-zinc-950">
              {cart.map((item) => (
                <div key={item.product.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {/* Info */}
                  <div className="flex items-center gap-4">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-none border-2 border-black"
                    />
                    <div>
                      <span className="text-[9px] font-mono font-black px-2 py-0.5 bg-black text-brand-yellow-400 border border-zinc-800 uppercase">
                        {item.product.category}
                      </span>
                      <h4 className="text-sm font-black text-white mt-1.5 uppercase leading-tight">{item.product.name}</h4>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5 font-bold uppercase">{item.product.price.toFixed(2)} PLN / SZT.</p>
                    </div>
                  </div>

                  {/* Quantity & Delete */}
                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6">
                    <div className="flex items-center bg-black border-2 border-zinc-800 rounded-none overflow-hidden">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, -1)}
                        className="p-2.5 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                      >
                        <Minus className="h-3.5 w-3.5 stroke-[2.5]" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val >= 1) {
                            onUpdateQuantity(item.product.id, val - item.quantity);
                          }
                        }}
                        className="w-12 text-center bg-zinc-950 text-white font-mono font-black text-xs border-x-2 border-zinc-800 py-1.5 focus:outline-none focus:text-brand-yellow-400"
                      />
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, 1)}
                        className="p-2.5 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-mono font-black text-brand-yellow-400">
                        {(item.product.price * item.quantity).toFixed(2)} PLN
                      </p>
                      <button
                        onClick={() => onRemoveFromCart(item.product.id)}
                        className="text-[10px] text-zinc-500 hover:text-red-400 font-bold uppercase tracking-wider mt-1 transition-colors hover:underline"
                      >
                        Usuń
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Promo code card */}
          <div className="bg-black border-4 border-white rounded-none p-6 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)]">
            <h4 className="text-xs font-mono font-black text-white mb-3 flex items-center gap-1.5 uppercase tracking-widest">
              <Percent className="h-4.5 w-4.5 text-brand-yellow-400" />
              KOD RABATOWY?
            </h4>
            <form onSubmit={handleApplyPromo} className="flex gap-2">
              <input
                type="text"
                placeholder="Wpisz kod (np. KOSTKA10)"
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value)}
                className="flex-1 px-4 py-3 bg-zinc-950 border-2 border-zinc-800 rounded-none text-white placeholder-zinc-700 focus:outline-none focus:border-brand-yellow-400 text-xs font-mono uppercase"
              />
              <button
                type="submit"
                className="px-5 py-3 bg-brand-yellow-400 hover:bg-white text-black font-black text-xs uppercase rounded-none transition-colors border-2 border-black tracking-widest"
              >
                ZASTOSUJ
              </button>
            </form>
            {promoError && <p className="text-red-500 text-xs mt-2 font-mono font-black tracking-wider">▲ {promoError}</p>}
            {promoSuccess && <p className="text-emerald-500 text-xs mt-2 font-mono font-black tracking-wider">▼ {promoSuccess}</p>}
          </div>
        </div>

        {/* Right Column: Checkout details & Delivery */}
        <div className="lg:col-span-5 space-y-6">
          {/* Order Summary */}
          <div className="bg-black border-4 border-white rounded-none p-6 shadow-[6px_6px_0px_0px_#FFE200] space-y-6">
            <h3 className="text-xl font-display font-black text-white border-b-2 border-zinc-900 pb-3 uppercase tracking-tight">Podsumowanie Koszyka</h3>

            {/* Delivery choice */}
            <div className="space-y-3">
              <p className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest">Sposób dostawy</p>
              <div className="space-y-2">
                <label className={`flex items-center justify-between p-3.5 rounded-none border-2 cursor-pointer transition-colors ${
                  deliveryType === "paczkomat" 
                    ? "bg-brand-yellow-400 text-black border-black" 
                    : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                }`}>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="delivery"
                      checked={deliveryType === "paczkomat"}
                      onChange={() => setDeliveryType("paczkomat")}
                      className="text-black focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-black block uppercase tracking-tight">Paczkomat InPost</span>
                      <span className="text-[9px] font-mono uppercase opacity-80">Dostawa do Paczkomatu</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-black">{isFreeShipping ? "GRATIS" : "15.00 PLN"}</span>
                </label>

                <label className={`flex items-center justify-between p-3.5 rounded-none border-2 cursor-pointer transition-colors ${
                  deliveryType === "kurier" 
                    ? "bg-brand-yellow-400 text-black border-black" 
                    : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                }`}>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="delivery"
                      checked={deliveryType === "kurier"}
                      onChange={() => setDeliveryType("kurier")}
                      className="text-black focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-black block uppercase tracking-tight">Kurier DPD / DHL</span>
                      <span className="text-[9px] font-mono uppercase opacity-80">Doręczenie pod adres</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-black">{isFreeShipping ? "GRATIS" : "19.00 PLN"}</span>
                </label>

                <label className={`flex items-center justify-between p-3.5 rounded-none border-2 cursor-pointer transition-colors ${
                  deliveryType === "personal" 
                    ? "bg-brand-yellow-400 text-black border-black" 
                    : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                }`}>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="delivery"
                      checked={deliveryType === "personal"}
                      onChange={() => setDeliveryType("personal")}
                      className="text-black focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-black block uppercase tracking-tight">Odbiór osobisty</span>
                      <span className="text-[9px] font-mono uppercase opacity-80">Rynek Rzeszów (Ratusz)</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-black">0.00 PLN</span>
                </label>
              </div>
              {isFreeShipping ? (
                <p className="text-[10px] text-emerald-400 font-mono bg-emerald-950/20 border-2 border-emerald-800 p-2.5 rounded-none flex items-center gap-1.5 justify-center uppercase font-black tracking-wider">
                  <Truck className="h-4 w-4 animate-bounce" /> DARMOWA DOSTAWY AKTYWNA!
                </p>
              ) : (
                <p className="text-[10px] text-zinc-500 font-mono text-center font-bold uppercase tracking-wider">
                  DODAJ GRY ZA JESZCZE <span className="text-brand-yellow-400 font-black font-mono">{(250 - itemsSubtotal).toFixed(2)} PLN</span> DLA DARMOWEJ DOSTAWY!
                </p>
              )}
            </div>

            {/* Calculations block */}
            <div className="border-t-2 border-zinc-900 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-zinc-400 uppercase text-xs font-mono">
                <span>Wartość gier:</span>
                <span className="font-mono font-black text-white">{itemsSubtotal.toFixed(2)} PLN</span>
              </div>
              {activeDiscount > 0 && (
                <div className="flex justify-between text-brand-yellow-400 uppercase text-xs font-mono font-black">
                  <span>Rabat (10%):</span>
                  <span className="font-mono">- {discountAmount.toFixed(2)} PLN</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-400 uppercase text-xs font-mono">
                <span>Koszt wysyłki:</span>
                <span className="font-mono font-black text-white">
                  {deliveryCost === 0 ? "0.00 PLN" : `${deliveryCost.toFixed(2)} PLN`}
                </span>
              </div>
              <div className="flex justify-between text-base font-black text-white pt-3 border-t-2 border-zinc-900 uppercase">
                <span>RAZEM DO ZAPŁATY:</span>
                <span className="font-display font-black text-brand-yellow-400 text-xl">
                  {totalAmount.toFixed(2)} PLN
                </span>
              </div>
            </div>

            {/* Delivery address display or login prompt */}
            <div className="border-t-2 border-zinc-900 pt-4 space-y-4">
              {!currentUser ? (
                // Not logged in: Show warning block
                <div className="bg-zinc-950 border-2 border-brand-yellow-400 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-brand-yellow-400">
                    <ShoppingBag className="h-4.5 w-4.5 stroke-[2.5]" />
                    <span className="text-[10px] font-mono font-black uppercase tracking-wider">Wymagane Logowanie</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                    Aby sfinalizować zakupy i złożyć zamówienie w naszym sklepie, musisz zalogować się na swoje konto użytkownika.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent("open-login-modal"));
                    }}
                    className="w-full py-2.5 bg-brand-yellow-400 hover:bg-white text-black font-black text-[10px] tracking-wider uppercase transition-colors border-2 border-black flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
                  >
                    ZALOGUJ SIĘ / STWÓRZ KONTO
                    <ArrowRight className="h-3.5 w-3.5 stroke-[3]" />
                  </button>
                </div>
              ) : (
                // Logged in: Show read-only shipping details and place order button
                <div className="space-y-4">
                  <div className="bg-zinc-950 border-2 border-zinc-900 p-4 space-y-3">
                    <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                      <span className="text-[10px] font-mono font-black text-brand-yellow-400 uppercase tracking-wider">Dane wysyłkowe z konta</span>
                      {onGoToProfile && (
                        <button
                          type="button"
                          onClick={onGoToProfile}
                          className="text-[9px] font-mono font-black text-zinc-400 hover:text-white uppercase underline"
                        >
                          Edytuj profil
                        </button>
                      )}
                    </div>

                    {dbLoadedMessage && !formFirstName && (
                      <p className="text-[10px] text-zinc-500 font-mono italic">{dbLoadedMessage}</p>
                    )}

                    {formFirstName ? (
                      <div className="space-y-1.5 text-xs font-sans text-zinc-300">
                        <div className="flex justify-between gap-2">
                          <span className="text-zinc-500 font-mono text-[10px] uppercase shrink-0">Odbiorca:</span>
                          <span className="font-bold text-white uppercase text-right truncate">{formFirstName} {formLastName}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-zinc-500 font-mono text-[10px] uppercase shrink-0">E-mail:</span>
                          <span className="text-white font-mono text-right truncate">{formEmail}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-zinc-500 font-mono text-[10px] uppercase shrink-0">Telefon:</span>
                          <span className="text-white font-mono text-right truncate">{formPhone}</span>
                        </div>
                        {deliveryType !== "personal" && (
                          <div className="flex justify-between gap-2">
                            <span className="text-zinc-500 font-mono text-[10px] uppercase shrink-0">Adres:</span>
                            <span className="text-white text-right font-medium break-words max-w-[200px]">
                              {formStreet}, {formZip} {formCity}
                            </span>
                          </div>
                        )}
                        {deliveryType === "personal" && (
                          <div className="flex justify-between gap-2">
                            <span className="text-zinc-500 font-mono text-[10px] uppercase shrink-0">Odbiór:</span>
                            <span className="text-white text-right font-bold text-[10px] uppercase">Osobisty (Rynek Rzeszów)</span>
                          </div>
                        )}
                      </div>
                    ) : dbConnectionError ? (
                      <div className="space-y-2 text-center py-2">
                        <p className="text-[10px] text-red-500 font-mono font-black uppercase tracking-wider">brak połączenia z serwerem</p>
                        <p className="text-[10px] text-zinc-400 leading-normal font-sans">
                          Nie udało się połączyć z bazą danych w celu pobrania Twojego profilu. Spróbuj ponownie później.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 text-center py-2">
                        <p className="text-[10px] text-red-500 font-mono font-black uppercase tracking-wider">Profil niekompletny</p>
                        <p className="text-[10px] text-zinc-400 leading-normal font-sans">
                          Twoje konto nie posiada jeszcze zapisanych danych do wysyłki. Uzupełnij je, aby złożyć zamówienie.
                        </p>
                        {onGoToProfile && (
                          <button
                            type="button"
                            onClick={onGoToProfile}
                            className="w-full py-2 bg-zinc-900 hover:bg-zinc-850 text-brand-yellow-400 text-[10px] font-mono font-black uppercase tracking-wider border-2 border-brand-yellow-400"
                          >
                            UZUPEŁNIJ PROFIL W MOJE KONTO
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {orderError && (
                    <div className="p-3 bg-red-950/80 border-2 border-red-600 text-red-200 text-xs rounded-none font-mono font-black uppercase tracking-wider">
                      {orderError}
                    </div>
                  )}

                  {formFirstName && (deliveryType === "personal" || (formStreet && formCity && formZip)) ? (
                    <button
                      type="button"
                      onClick={() => handleCheckoutSubmit()}
                      disabled={isSubmitting}
                      className="w-full py-4 bg-brand-yellow-400 hover:bg-white disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-black text-xs tracking-widest uppercase rounded-none transition-colors border-2 border-black flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
                    >
                      {isSubmitting ? "Weryfikacja zamówienia..." : "ZŁÓŻ ZAMÓWIENIE"}
                      <ArrowRight className="h-4.5 w-4.5 stroke-[2.5]" />
                    </button>
                  ) : formFirstName ? (
                    <div className="space-y-2">
                      <p className="text-[9px] text-red-400 font-mono text-center uppercase tracking-wider">Brak adresu do wysyłki dla wybranej metody dostawy!</p>
                      <button
                        type="button"
                        disabled
                        className="w-full py-4 bg-zinc-900 text-zinc-600 font-black text-xs tracking-widest uppercase rounded-none border-2 border-zinc-800 flex items-center justify-center gap-2"
                      >
                        UZUPEŁNIJ ADRES DO WYSYŁKI
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
