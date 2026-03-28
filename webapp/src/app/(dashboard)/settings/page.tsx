"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

interface Integration {
  readonly id: string;
  readonly provider: string;
  readonly created_at: string;
}

export default function SettingsPage() {
  const { data, isLoading, mutate } = useSWR<{ data: Integration[] }>(
    "/api/integrations/google",
    fetcher
  );
  const integrations: readonly Integration[] = data?.data ?? [];

  const connectGoogleCalendar = async () => {
    const res = await fetch("/api/integrations/google", { method: "POST" });
    const json = await res.json();
    if (json.url) {
      window.location.href = json.url;
    }
  };

  const disconnectGoogleCalendar = async () => {
    await fetch("/api/integrations/google", { method: "DELETE" });
    mutate();
  };

  const hasGoogleCalendar = integrations.some(
    (i) => i.provider === "google_calendar"
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Pages / Settings</p>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your Digital Twin integrations
        </p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="rounded-lg border p-5 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📅</span>
            <div>
              <h3 className="font-semibold">Google Calendar</h3>
              <p className="text-sm text-muted-foreground">
                Connect your calendar to let your friends check your availability
                and propose meetings.
              </p>
            </div>
          </div>

          {hasGoogleCalendar ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-green-600">
                  Connected
                </span>
              </div>
              <button
                onClick={disconnectGoogleCalendar}
                className="text-sm text-red-500 hover:text-red-700 transition-colors"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connectGoogleCalendar}
              className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors"
            >
              Connect Google Calendar
            </button>
          )}
        </div>
      )}
    </div>
  );
}
