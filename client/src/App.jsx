import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import CatalogPage from './pages/CatalogPage';
import CartPage from './pages/CartPage';
import AuthPage from './pages/AuthPage';
import AdminPage from './pages/AdminPage';
import './App.css';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <div className="site-wrapper">
            <Navbar />
            <main className="site-main">
              <Routes>
                <Route path="/" element={<CatalogPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/admin" element={<AdminPage />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}