import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function usePushNotifications() {
  const { session } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'default'
  );

  useEffect(() => {
    if (!session || !('serviceWorker' in navigator) || !('PushManager' in window)) return;
    
    // Check if already subscribed
    navigator.serviceWorker.ready.then(async (registration) => {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        setIsSubscribed(true);
      }
    });
  }, [session]);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribe = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !session) {
      return false;
    }

    try {
      const currentPermission = await Notification.requestPermission();
      setPermission(currentPermission);
      
      if (currentPermission !== 'granted') {
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Fetch VAPID public key from backend or env
        let vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
           const res = await fetch('/api/v1/notifications/vapid-public-key', {
             headers: { Authorization: `Bearer ${session.access_token}` }
           });
           const data = await res.json();
           vapidPublicKey = data.publicKey;
        }

        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
      }

      // Send to backend
      const res = await fetch('/api/v1/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify(subscription)
      });

      if (res.ok) {
        setIsSubscribed(true);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to subscribe to push notifications', err);
      return false;
    }
  };

  return { isSubscribed, permission, subscribe };
}
