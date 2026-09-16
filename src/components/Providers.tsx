"use client";

import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { LocaleProvider } from "@/context/LocaleContext";
import LoginModal from "@/components/LoginModal";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <AuthProvider>
        <CartProvider>
          {children}
          <LoginModal />
        </CartProvider>
      </AuthProvider>
    </LocaleProvider>
  );
}
