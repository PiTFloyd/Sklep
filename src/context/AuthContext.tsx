import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "../types";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  updateProfileState: (updatedFields: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Silent verification check on initial load / refresh ("hydration")
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const user = await response.json();
          setCurrentUser(user);
        } else {
          // Cookie expired or invalid - ensure state is cleared
          setCurrentUser(null);
        }
      } catch (err) {
        console.error("Błąd automatycznej weryfikacji sesji:", err);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = (user: User) => {
    setCurrentUser(user);
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Błąd sieci podczas wylogowania:", err);
    } finally {
      setCurrentUser(null);
    }
  };

  const updateProfileState = (updatedFields: Partial<User>) => {
    setCurrentUser((prevUser) => {
      if (!prevUser) return null;
      return {
        ...prevUser,
        ...updatedFields
      };
    });
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, logout, updateProfileState }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
