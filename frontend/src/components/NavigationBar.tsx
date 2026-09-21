import React from 'react';
import { Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';

interface NavigationBarProps {
  isAuthenticated: boolean;
  onLogoutRequest: () => void;
}

export default function NavigationBar({ isAuthenticated, onLogoutRequest }: NavigationBarProps) {
  return (
    <nav className="border-b border-slate-200 bg-white shadow-sm px-4 sm:px-8 py-3 flex justify-between items-center sticky top-0 z-40">
      <Link to="/" className="flex items-center" aria-label="TaxMeld home">
        <img src="/taxmeld-logo.png" alt="TaxMeld" className="h-9 sm:h-10 w-auto object-contain" />
      </Link>
      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <button
            onClick={onLogoutRequest}
            className="text-xs flex items-center gap-1.5 text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 font-medium cursor-pointer transition"
          >
            <LogOut size={13} /> Logout
          </button>
        ) : (
          <div className="flex gap-2">
            <Link to="/login" className="text-xs px-2.5 py-1.5 text-slate-700 hover:text-slate-900 font-medium">
              Login
            </Link>
            <Link to="/register" className="text-xs px-3 py-1.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 shadow-sm">
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}