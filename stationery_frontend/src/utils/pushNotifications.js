
import api from '../api/api';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);

  return Uint8Array.from(
    [...rawData].map(char => char.charCodeAt(0))
  );
}

export async function enablePushNotifications() {
  try {
    if (!('serviceWorker' in navigator) ||
        !('PushManager' in window)) {
      throw new Error('Push notifications are not supported.');
    }

    if (!VAPID_PUBLIC_KEY) {
      throw new Error('VAPID public key is missing.');
    }

    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      throw new Error('Notification permission was not granted.');
    }

    const registration = await navigator.serviceWorker.register(
      '/service-worker.js'
    );

    await navigator.serviceWorker.ready;

    let subscription =
      await registration.pushManager.getSubscription();


      
    if (subscription) {
      await subscription.unsubscribe();
      subscription = null;
    }
    
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        VAPID_PUBLIC_KEY
      )
    });
    
    await api.post(
      '/push/subscribe/',
      subscription.toJSON()
    );

    await api.post(
      '/push/subscribe/',
      subscription.toJSON()
    );

    return {
      success: true,
      message: 'Notifications enabled successfully!'
    };

  } catch (error) {
    console.error('Push notification error:', error);

    return {
      success: false,
      message:
        error.response?.data?.error ||
        error.message ||
        'Unable to enable notifications.'
    };
  }
}
