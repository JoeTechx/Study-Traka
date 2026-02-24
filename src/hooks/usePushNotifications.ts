"use client";

import { useEffect, useState, useCallback } from "react";
import {
  savePushSubscription,
  deletePushSubscription,
} from "@/lib/supabase/reminderActions";
import { toast } from "sonner";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(new ArrayBuffer(rawData.length));
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

export type PushStatus =
  | "unsupported"
  | "denied"
  | "granted"
  | "default"
  | "loading";

export function usePushNotifications() {
  const [status, setStatus] = useState<PushStatus>("loading");
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null,
  );
  const [swRegistration, setSwRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  // Register service worker once on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then(async (reg) => {
        setSwRegistration(reg);

        // Check if already subscribed
        const existing = await reg.pushManager.getSubscription();
        if (existing) {
          setSubscription(existing);
          setStatus("granted");
        } else {
          // Not subscribed yet — reflect current browser permission
          const perm = Notification.permission;
          setStatus(perm === "granted" ? "default" : (perm as PushStatus));
        }
      })
      .catch((err) => {
        console.error("SW registration failed:", err);
        setStatus("unsupported");
      });
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!swRegistration) {
      toast.error("Service worker not ready — please refresh and try again");
      return false;
    }
    if (!VAPID_PUBLIC_KEY) {
      toast.error("Push notifications are not configured (missing VAPID key)");
      return false;
    }

    try {
      setStatus("loading");

      // This is the fix — convert to BufferSource directly, no cast needed
      const convertedKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

      const sub = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey,
      });

      const keyBuffer = sub.getKey("p256dh");
      const authBuffer = sub.getKey("auth");

      if (!keyBuffer || !authBuffer) {
        throw new Error("Push subscription keys are missing");
      }

      const p256dh = btoa(
        String.fromCharCode(...Array.from(new Uint8Array(keyBuffer))),
      );
      const auth = btoa(
        String.fromCharCode(...Array.from(new Uint8Array(authBuffer))),
      );

      const res = await savePushSubscription({
        endpoint: sub.endpoint,
        p256dh,
        auth,
      });

      if (!res.success)
        throw new Error(res.error ?? "Failed to save subscription");

      setSubscription(sub);
      setStatus("granted");
      toast.success("Browser notifications enabled!");
      return true;
    } catch (err) {
      console.error("Push subscribe error:", err);
      if (Notification.permission === "denied") {
        setStatus("denied");
        toast.error(
          "Notifications are blocked. Allow them in your browser settings.",
        );
      } else {
        setStatus("default");
        toast.error("Failed to enable notifications — please try again");
      }
      return false;
    }
  }, [swRegistration]);

  // Unsubscribe
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!subscription) return false;
    try {
      await deletePushSubscription(subscription.endpoint);
      await subscription.unsubscribe();
      setSubscription(null);
      setStatus("default");
      toast.success("Browser notifications disabled");
      return true;
    } catch (err) {
      console.error("Push unsubscribe error:", err);
      toast.error("Failed to disable notifications");
      return false;
    }
  }, [subscription]);

  return { status, subscription, subscribe, unsubscribe };
}
