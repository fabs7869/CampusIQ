import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import { useAuth } from './AuthContext';

interface BadgeCounts {
  notifications: number;
  feed: number;
  home: number;
}

interface BadgeContextType {
  badges: BadgeCounts;
  refreshBadges: () => Promise<void>;
  clearBadge: (type: 'notifications' | 'feed' | 'home') => Promise<void>;
}

const BadgeContext = createContext<BadgeContextType | undefined>(undefined);

export const BadgeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [badges, setBadges] = useState<BadgeCounts>({
    notifications: 0,
    feed: 0,
    home: 0,
  });

  const refreshBadges = useCallback(async () => {
    if (!user) return;
    try {
      const res = await authAPI.getBadgeStatus();
      setBadges({
        notifications: res.data.unread_notifications,
        feed: res.data.new_feed_items,
        home: res.data.new_complaint_updates,
      });
    } catch (e) {
      console.log('Error refreshing badges', e);
    }
  }, [user]);

  const clearBadge = async (type: 'notifications' | 'feed' | 'home') => {
    if (!user) return;
    
    // Optimistic update
    setBadges(prev => ({ ...prev, [type]: 0 }));

    try {
      const now = new Date().toISOString();
      if (type === 'feed') {
        await authAPI.updateActivity({ last_feed_viewed_at: now });
      } else if (type === 'home') {
        await authAPI.updateActivity({ last_complaints_viewed_at: now });
      }
      // For notifications, we don't clear via activity timestamp because 
      // notifications have their own 'is_read' status handled in NotificationScreen.
      // But we still refresh to get the latest accurate count.
      await refreshBadges();
    } catch (e) {
      console.log(`Error clearing badge ${type}`, e);
    }
  };

  useEffect(() => {
    if (user) {
      refreshBadges();
      const interval = setInterval(refreshBadges, 60000); // 1 minute polling
      return () => clearInterval(interval);
    } else {
      setBadges({ notifications: 0, feed: 0, home: 0 });
    }
  }, [user, refreshBadges]);

  return (
    <BadgeContext.Provider value={{ badges, refreshBadges, clearBadge }}>
      {children}
    </BadgeContext.Provider>
  );
};

export const useBadges = () => {
  const context = useContext(BadgeContext);
  if (!context) {
    throw new Error('useBadges must be used within a BadgeProvider');
  }
  return context;
};
