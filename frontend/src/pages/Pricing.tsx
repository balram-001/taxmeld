import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Pricing: React.FC = () => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('trial');
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  // Polling trigger: Check if payment is verified by MacroDroid webhook
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await axios.get('https://taxmeld-backend.onrender.com/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.subscriptionStatus === 'active') {
          setSubscriptionStatus('active');
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Polling error...', err);
      }
    }, 3000); // Har 3 second mein status check karega

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Upgrade Your TaxMeld Subscription
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Secure your CA practice automation with zero gateway fees.
        </p>
      </div>

      <div className="mt-10 max-w-md mx-auto bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        {subscriptionStatus === 'active' ? (
          <div className="text-center py-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 text-green-600 mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Subscription Active! 🎉</h3>
            <p className="mt-2 text-sm text-gray-600">
              Your payment has been successfully verified. You have full access to TaxMeld.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-6 w-full bg-indigo-600 text-white py-2 px-4 rounded-md font-medium hover:bg-indigo-700"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div>
            <div className="text-center">
              <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
                Founding Seat Offer
              </span>
              <h2 className="mt-4 text-4xl font-extrabold text-gray-900">₹299 <span className="text-base font-medium text-gray-500">/ month</span></h2>
              <p className="mt-2 text-sm text-gray-500">Scan the QR code below via PhonePe, GPay, or Paytm.</p>
            </div>

            {/* UPI QR Code Placeholder */}
            <div className="mt-6 flex justify-center">
              <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 w-48 h-48 flex items-center justify-center text-center">
                <span className="text-xs text-gray-500">[ Yahan Apna UPI QR Code Image Lagayein ]</span>
              </div>
            </div>

            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4 text-sm text-yellow-800 text-center">
              <p className="font-semibold">Waiting for Payment...</p>
              <p className="mt-1 text-xs text-yellow-600">
                Screen automatically update ho jayegi jaise hi payment confirm hoga!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pricing;