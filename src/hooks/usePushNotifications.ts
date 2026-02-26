import { useState, useEffect } from "react";
import {
  savePushSubscription,
  deletePushSubscription,
} from "@/lib/supabase/reminderActions";
import { toast } from "sonner";

type PushStatus = "unsupported" | "denied" | "granted" | "default" | "loading";

export function usePushNotifications() {
  const [status, setStatus] = useState<PushStatus>("loading");
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null,
  );

  useEffect(() => {
    async function checkPermission() {
      if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        setStatus("unsupported");
        return;
      }

      const permission = Notification.permission;
      if (permission === "denied") {
        setStatus("denied");
      } else if (permission === "granted") {
        // Check if we already have a subscription
        const registration = await navigator.serviceWorker.ready;
        const existingSub = await registration.pushManager.getSubscription();
        if (existingSub) {
          setSubscription(existingSub);
          setStatus("granted");
        } else {
          setStatus("default");
        }
      } else {
        setStatus("default");
      }
    }

    checkPermission();
  }, []);

  const subscribe = async (): Promise<boolean> => {
    try {
      if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        toast.error("Push notifications are not supported in this browser");
        return false;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        toast.error("Notification permission denied");
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error("VAPID public key not configured");
        toast.error("Push notifications not configured");
        return false;
      }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          vapidPublicKey,
        ) as BufferSource,
      });

      // Save subscription to database
      const keys = sub.toJSON().keys;
      if (!keys?.p256dh || !keys?.auth) {
        toast.error("Failed to get subscription keys");
        return false;
      }

      const result = await savePushSubscription({
        endpoint: sub.endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      });

      if (result.success) {
        setSubscription(sub);
        setStatus("granted");
        toast.success("Browser notifications enabled");
        return true;
      } else {
        toast.error("Failed to save subscription");
        return false;
      }
    } catch (error) {
      console.error("Push subscription error:", error);
      toast.error("Failed to enable notifications");
      return false;
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    try {
      if (!subscription) return true;

      // Unsubscribe from push service
      await subscription.unsubscribe();

      // Delete from database
      await deletePushSubscription(subscription.endpoint);

      setSubscription(null);
      setStatus("default");
      toast.success("Browser notifications disabled");
      return true;
    } catch (error) {
      console.error("Push unsubscribe error:", error);
      toast.error("Failed to disable notifications");
      return false;
    }
  };

  return {
    status,
    subscription,
    subscribe,
    unsubscribe,
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
