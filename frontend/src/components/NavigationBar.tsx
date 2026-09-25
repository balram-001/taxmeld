import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Trash2 } from 'lucide-react';

interface NavigationBarProps {
  isAuthenticated: boolean;
  onLogoutRequest: () => void;
  onDeleteAccount: () => void;
}

export default function NavigationBar({ isAuthenticated, onLogoutRequest, onDeleteAccount }: NavigationBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const userStr = localStorage.getItem('user');
  let userEmail = "ca@taxmeld.com";
  try {
    if (userStr) {
      const parsed = JSON.parse(userStr);
      userEmail = parsed.email || parsed.username || "ca@taxmeld.com";
    }
  } catch (e) {
    userEmail = "ca@taxmeld.com";
  }

  const initial = userEmail ? userEmail.charAt(0).toUpperCase() : 'C';

  return (
    <nav className="border-b border-slate-200 bg-white shadow-sm px-4 sm:px-8 py-3 flex justify-between items-center sticky top-0 z-40">
      <Link to="/" className="flex items-center" aria-label="TaxMeld home">
        <img src="/taxmeld-logo.png" alt="TaxMeld" className="h-9 sm:h-10 w-auto object-contain" />
      </Link>
      <div className="flex items-center gap-3 relative">
        {isAuthenticated ? (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm hover:bg-indigo-700 transition cursor-pointer"
            >
              {initial}
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 text-slate-700">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs text-slate-400 font-medium">Signed in as</p>
                  <p className="text-xs font-bold text-slate-800 truncate">{userEmail}</p>
                </div>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onLogoutRequest();
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition"
                >
                  <LogOut size={14} className="text-slate-500" /> Logout
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onDeleteAccount();
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer transition border-t border-slate-100"
                >
                  <Trash2 size={14} className="text-rose-500" /> Delete Account
                </button>
              </div>
            )}
          </div>
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