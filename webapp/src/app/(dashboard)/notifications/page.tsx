"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

interface Notification {
  readonly id: string;
  readonly type: string;
  readonly title: string;
  readonly body: string | null;
  readonly metadata: Record<string, unknown>;
  readonly is_read: boolean;
  readonly created_at: string;
}

const TYPE_ICONS: Record<string, string> = {
  connection_request: "🤝",
  calendar_request: "📅",
  plan_shared: "📋",
  agent_interaction: "🤖",
};

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationsPage() {
  const { data, isLoading, mutate } = useSWR<{ data: Notification[] }>(
    "/api/notifications",
    fetcher
  );
  const notifications: readonly Notification[] = data?.data ?? [];

  const markAsRead = async (notificationId: string) => {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notification_id: notificationId }),
    });
    mutate();
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mark_all_read: true }),
    });
    mutate();
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Pages / Notifications</p>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading
              ? "Loading..."
              : unreadCount > 0
                ? `${unreadCount} unread`
                : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : notifications.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center space-y-2">
          <h3 className="font-medium">No notifications</h3>
          <p className="text-sm text-muted-foreground">
            Notifications will appear when someone interacts with your Twin or
            sends you a connection request.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-lg border p-4 flex items-start gap-3 transition-colors ${
                n.is_read ? "opacity-60" : "bg-accent/30"
              }`}
            >
              <span className="text-xl mt-0.5">
                {TYPE_ICONS[n.type] ?? "📬"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{n.title}</p>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {timeAgo(n.created_at)}
                  </span>
                </div>
                {n.body && (
                  <p className="text-sm text-muted-foreground mt-1">{n.body}</p>
                )}
              </div>
              {!n.is_read && (
                <button
                  onClick={() => markAsRead(n.id)}
                  className="text-xs text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                >
                  Read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
