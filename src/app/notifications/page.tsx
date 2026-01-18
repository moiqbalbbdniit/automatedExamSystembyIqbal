'use client'; 

import React, { useEffect, useState } from 'react';
import { Bell, ArrowLeft } from 'lucide-react'; 
// import { useRouter } from 'next/navigation'; // REMOVED: Dependency causing the build error

// Define the interface for the Notification data retrieved from the API
interface NotificationType {
  _id: string;
  message: string;
  createdAt: string; 
}

const NotificationsPage: React.FC = () => {
  // const router = useRouter(); // REMOVED: Replaced with native history API
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Function to handle native browser back navigation
  const handleBack = () => {
    window.history.back();
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // Fetching from the standard GET route
        const response = await fetch('/api/admin/notifications', { 
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          let errorMessage = 'Failed to fetch notifications from the server.';
          try {
              const errorData = await response.json();
              if (errorData.message) errorMessage = errorData.message;
          } catch (e) { /* silent fail on json parsing */ }
          
          throw new Error(errorMessage);
        }

        const data = await response.json();
        setNotifications(data.notifications || []);
      } catch (err) {
        console.error('Fetch error:', err);
        setError((err as Error).message || 'Could not load notifications. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Helper function to format the date
  const formatDate = (dateString: string) => {
    // Check if dateString is valid before trying to format
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return "Invalid date";
    }
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // --- Rendering based on state ---

  if (loading) {
    return (
      // Full screen background for all devices
      <div className="min-h-screen bg-gray-950 flex justify-center items-center">
        <p className="text-xl text-blue-400 font-medium">Loading notifications...</p>
      </div>
    );
  }

  return (
    // Main container with dark background for "black" theme
    <div className="min-h-screen bg-gray-950 text-white p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header and Back Button Section */}
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-blue-900">
          
          {/* Back Button (Mobile-friendly touch target) */}
          <button
            // FIX: Using native history API instead of Next.js router
            onClick={handleBack} 
            className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors p-2 rounded-lg"
            aria-label="Go back to the previous page"
          >
            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
            <span className="text-sm md:text-base font-medium hidden sm:inline cursor-pointer">Back to Dashboard</span>
          </button>

          {/* Title */}
          <div className="flex items-center space-x-3">
            <Bell className="w-6 h-6 text-blue-500" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
             Your Notifications 
            </h1>
          </div>
          
          {/* Spacer to balance the layout */}
          <div className="w-16"></div> 
        </header>

        {/* Error State */}
        {error && (
            <div className="p-4 bg-red-900 border border-red-700 rounded-lg text-red-300 mb-8 mx-auto max-w-lg">
                <p className="font-semibold text-lg mb-1">Connection Error</p>
                <p className="text-sm">{error}</p>
            </div>
        )}

        {/* Notification List */}
        {notifications.length === 0 ? (
          <div className="text-center py-12 bg-gray-900 rounded-xl border border-blue-600/50 shadow-lg mt-10">
            <p className="text-2xl text-blue-400 font-light">You&lsquo;re all caught up!</p>
            <p className="text-gray-500 mt-2">No system-wide messages or alerts at this time.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {notifications.map((notif, index) => {
              // Alternating color logic: Blue on even index (0, 2, 4...)
              const isBlueShade = index % 2 === 0; 
              
              // Blue Card: High-contrast, vibrant
              const blueClasses = 'bg-blue-600 text-white shadow-xl shadow-blue-500/20';
              const blueSmallText = 'text-blue-200';

              // Black Card: Subtle, professional dark gray
              const blackClasses = 'bg-gray-800 text-gray-100 border border-gray-700 shadow-lg shadow-black/30';
              const blackSmallText = 'text-gray-400';

              return (
                <li 
                  key={notif._id} 
                  className={`p-4 md:p-6 rounded-xl transition-all duration-300 cursor-pointer 
                    ${isBlueShade ? blueClasses : blackClasses}
                    hover:scale-[1.01] hover:shadow-2xl ${isBlueShade ? 'hover:shadow-blue-500/40' : 'hover:shadow-black/60'}`} 
                >
                  <p className="font-semibold text-base sm:text-lg">
                    {notif.message}
                  </p>
                  <small 
                    className={`mt-2 block text-xs md:text-sm font-light ${
                      isBlueShade ? blueSmallText : blackSmallText
                    }`}
                  >
                    Posted: {formatDate(notif.createdAt)}
                  </small>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;