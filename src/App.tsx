import { useState, useEffect, lazy, Suspense } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Footer from "./components/Footer";
import { Product, CartItem, User } from "./types";
import { AlertOctagon, RefreshCw } from "lucide-react";
import { useAuth } from "./context/AuthContext";

// Code splitting utilizing dynamic imports (React.lazy)
const Store = lazy(() => import("./components/Store"));
const Cart = lazy(() => import("./components/Cart"));
const AdminDashboard = lazy(() => import("./components/AdminDashboard"));
const ClientDashboard = lazy(() => import("./components/ClientDashboard"));
const ProductDetails = lazy(() => import("./components/ProductDetails"));

export default function App() {
  const [currentView, setView] = useState<"home" | "store" | "cart" | "admin" | "product-details" | "client-dashboard">("home");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Products state loaded from API
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [serverDown, setServerDown] = useState(false);
  const [fetchError, setFetchError] = useState("");

  // Fetch products from database
  const fetchProductsData = async () => {
    setLoadingProducts(true);
    setFetchError("");
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
        setServerDown(false);
      } else {
        setServerDown(true);
        setFetchError("Nie udało się pobrać gier z bazy danych.");
      }
    } catch (err) {
      setServerDown(true);
      setFetchError("Błąd podczas łączenia z serwerem.");
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProductsData();
  }, []);

  // Initialize cart from localStorage
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem("planszowki_cart");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  // Consume secure global authentication context
  const { currentUser, loading: authLoading, login: contextLogin, logout: contextLogout, updateProfileState } = useAuth();

  // Synchronize cart changes to localStorage
  useEffect(() => {
    localStorage.setItem("planszowki_cart", JSON.stringify(cart));
  }, [cart]);

  const handleProfileUpdate = (updatedFields: Partial<User>) => {
    updateProfileState(updatedFields);
  };

  // Load saved cart when user logs in
  useEffect(() => {
    if (currentUser) {
      const loadSavedCart = async () => {
        try {
          const response = await fetch(`/api/users/${currentUser.username}/cart`);
          if (response.ok) {
            const data = await response.json();
            if (data.cart) {
              setCart(data.cart);
            } else {
              setCart([]);
            }
          }
        } catch (e) {
          console.error("Błąd ładowania koszyka z bazy danych:", e);
        }
      };
      loadSavedCart();
    } else {
      setCart([]);
    }
  }, [currentUser?.username]);

  // Save cart to DB when it changes and user is logged in
  useEffect(() => {
    if (currentUser) {
      const saveCartToDb = async () => {
        try {
          await fetch(`/api/users/${currentUser.username}/cart`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              cart: cart
            })
          });
        } catch (e) {
          console.error("Błąd zapisywania koszyka do bazy danych:", e);
        }
      };
      
      const timer = setTimeout(() => {
        saveCartToDb();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [cart, currentUser?.username]);

  // LOGOUT CONDITION 3: Inactivity timer of 30 minutes
  useEffect(() => {
    if (!currentUser) return;
    let timeoutId: any;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleLogout();
        alert("Zostałeś automatycznie wylogowany z powodu 30 minut bezczynności.");
      }, 30 * 60 * 1000); // 30 minutes
    };

    // Events that reset the inactivity timer
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"];
    const handleActivity = () => {
      resetTimer();
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // Start timer immediately
    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [currentUser]);

  // Cart operations
  const handleAddToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id);
    const currentQty = existingItem ? existingItem.quantity : 0;
    const maxStock = product.stock !== undefined ? product.stock : 10;

    if (currentQty >= maxStock) {
      alert(`Przepraszamy, nie możesz dodać więcej sztuk tej gry. Osiągnięto limit dostępny w magazynie (${maxStock} szt.).`);
      return;
    }

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        // Pure copy to prevent StrictMode double rendering from mutating state by reference
        return prevCart.map((item, idx) => 
          idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevCart, { product, quantity: 1 }];
      }
    });
  };

  const handleUpdateQuantity = (productId: number, change: number) => {
    const itemInCart = cart.find((item) => item.product.id === productId);
    if (itemInCart && change > 0) {
      const maxStock = itemInCart.product.stock !== undefined ? itemInCart.product.stock : 10;
      if (itemInCart.quantity + change > maxStock) {
        alert(`Niewystarczająca ilość sztuk w magazynie! Maksymalny dostępny stan to ${maxStock} szt.`);
        return;
      }
    }

    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + change;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const handleRemoveFromCart = (productId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleLogin = (user: User) => {
    contextLogin(user);
  };

  const handleLogout = async () => {
    await contextLogout();
    setView("home");
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setView("product-details");
  };

  // Full-screen Server/Database Connection Error
  if (serverDown) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4" id="db-error-fullscreen">
        <div className="max-w-md w-full text-center space-y-8 bg-zinc-950 border-4 border-red-600 p-8 shadow-[8px_8px_0px_0px_#EF4444]">
          <div className="inline-flex items-center justify-center p-4 bg-red-600 text-white border-4 border-black rounded-none">
            <AlertOctagon className="h-16 w-16 stroke-[2.5]" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-display font-black tracking-tight text-white uppercase leading-none">
              Błąd połączenia z serwerem
            </h1>
            <p className="text-xs text-red-500 font-mono uppercase tracking-wide font-black">
              ▲ STATUS: UTRACOMO POŁĄCZENIE Z BAZĄ DANYCH
            </p>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans font-normal">
              Nie udało się skomunikować z bazą danych SQLite sklepu. Sprawdź swoje połączenie z Internetem lub spróbuj nawiązać połączenie ponownie przyciskiem poniżej.
            </p>
          </div>
          <button
            onClick={fetchProductsData}
            disabled={loadingProducts}
            className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black text-xs tracking-widest uppercase rounded-none transition-colors border-2 border-black flex items-center justify-center gap-2"
          >
            <RefreshCw className={`h-4.5 w-4.5 stroke-[2.5] ${loadingProducts ? "animate-spin" : ""}`} />
            {loadingProducts ? "NAWIĄZYWANIE POŁĄCZENIA..." : "SPRÓBUJ PONOWNIE"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-dark-950 text-zinc-100" id="app-root-container">
      {/* Navigation Header */}
      <Header
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
        cart={cart}
        currentView={currentView}
        setView={setView}
      />

      {/* Main View Area with custom transition fades */}
      <main className="flex-grow pt-8 sm:pt-12">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-400">
            <RefreshCw className="h-10 w-10 animate-spin text-amber-500 mb-4" />
            <p className="text-sm tracking-wider font-mono">ŁADOWANIE WIDOKU...</p>
          </div>
        }>
          {currentView === "home" && (
            <Hero onGoToStore={() => setView("store")} />
          )}
          {currentView === "store" && (
            <Store 
              products={products}
              loading={loadingProducts}
              error={fetchError}
              onAddToCart={handleAddToCart} 
              onSelectProduct={handleSelectProduct}
            />
          )}
          {currentView === "cart" && (
            <Cart
              cart={cart}
              currentUser={currentUser}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveFromCart={handleRemoveFromCart}
              onClearCart={handleClearCart}
              onGoToStore={() => setView("store")}
              onCheckoutSuccess={fetchProductsData}
              onGoToProfile={() => setView("client-dashboard")}
            />
          )}
          {currentView === "product-details" && selectedProduct && (
            <ProductDetails
              product={selectedProduct}
              onAddToCart={handleAddToCart}
              onGoBack={() => setView("store")}
            />
          )}
          {currentView === "admin" && (
            <AdminDashboard
              currentUser={currentUser}
              products={products}
              onRefreshProducts={fetchProductsData}
            />
          )}
          {currentView === "client-dashboard" && (
            <ClientDashboard
              currentUser={currentUser}
              onProfileUpdate={handleProfileUpdate}
              onGoToStore={() => setView("store")}
            />
          )}
        </Suspense>
      </main>

      {/* Footer Details */}
      <Footer />
    </div>
  );
}
