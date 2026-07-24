import { useState, useEffect } from 'react';
import { supabase } from './supabase';

export function useOnlineUsers(userId: string | undefined) {
  const [onlineCount, setOnlineCount] = useState<number>(0);

  useEffect(() => {
    if (!userId) return;

    // Use a unique channel for this account
    const channelName = `online-users-${userId}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        let count = 0;
        // Count total connections (arrays inside newState)
        for (const key in newState) {
          count += newState[key].length;
        }
        setOnlineCount(count);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track this client's presence
          await channel.track({
            online_at: new Date().toISOString(),
            device: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop'
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return onlineCount;
}
