import "@/index.css";

import { mountWidget, useLayout } from "skybridge/web";
import { useToolInfo } from "../helpers.js";
import React from "react";

interface NotificationItem {
  readonly id: string;
  readonly type: string;
  readonly title: string;
  readonly body: string | null;
  readonly metadata: Record<string, unknown>;
  readonly is_read: boolean;
  readonly created_at: string;
}

const TYPE_ICONS: Readonly<Record<string, string>> = {
  connection_request: "\uD83E\uDD1D",
  calendar_request: "\uD83D\uDCC5",
  plan_shared: "\uD83D\uDCCB",
  agent_interaction: "\uD83E\uDD16",
};

const TYPE_LABELS: Readonly<Record<string, string>> = {
  connection_request: "Connection",
  calendar_request: "Calendar",
  plan_shared: "Plan",
  agent_interaction: "Agent",
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "ora";
  if (minutes < 60) return `${minutes} min fa`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} or${hours === 1 ? "a" : "e"} fa`;
  const days = Math.floor(hours / 24);
  return `${days} giorn${days === 1 ? "o" : "i"} fa`;
}

function NotificationCard({
  notification,
}: {
  readonly notification: NotificationItem;
}) {
  const icon = TYPE_ICONS[notification.type] ?? "\uD83D\uDCEC";
  const label = TYPE_LABELS[notification.type] ?? notification.type;

  return (
    <div style={s.card}>
      <div style={s.cardIcon}>
        <span style={s.iconEmoji}>{icon}</span>
      </div>
      <div style={s.cardContent}>
        <div style={s.cardTop}>
          <span style={s.cardTitle}>{notification.title}</span>
          <span style={s.time}>{timeAgo(notification.created_at)}</span>
        </div>
        {notification.body && (
          <p style={s.cardBody}>{notification.body}</p>
        )}
        <span style={s.typeBadge}>{label}</span>
      </div>
    </div>
  );
}

function NotificationsWidget() {
  const { theme } = useLayout();
  const toolInfo = useToolInfo<"notifications">();
  const { isPending } = toolInfo;

  if (isPending || !toolInfo.isSuccess) {
    return (
      <div data-theme={theme} style={s.container}>
        <div style={s.loadingContainer}>
          <div style={s.spinner} />
          <span style={s.loadingText}>Loading notifications...</span>
        </div>
      </div>
    );
  }

  const { output } = toolInfo;
  const notifications = output.notifications as readonly NotificationItem[];

  return (
    <div data-theme={theme} style={s.container}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.headerDot} />
          <h2 style={s.title}>Notifications</h2>
        </div>
        {notifications.length > 0 && (
          <span style={s.countBadge}>{notifications.length} new</span>
        )}
      </div>

      {/* Content */}
      {notifications.length === 0 ? (
        <div style={s.empty}>
          <span style={s.emptyIcon}>{"\u2728"}</span>
          <span style={s.emptyText}>Nessuna notifica! Tutto tranquillo.</span>
        </div>
      ) : (
        <div style={s.list} data-llm="notification-list">
          {notifications.map((n: NotificationItem) => (
            <NotificationCard key={n.id} notification={n} />
          ))}
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    maxWidth: 520,
    margin: "0 auto",
    padding: 24,
    color: "var(--text-primary)",
    backgroundColor: "var(--bg-primary)",
  },

  // Loading
  loadingContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 40,
  },
  loadingText: {
    fontSize: 13,
    color: "var(--text-tertiary)",
  },
  spinner: {
    width: 18,
    height: 18,
    border: "2px solid var(--border-color)",
    borderTopColor: "var(--accent)",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },

  // Header
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottom: "1px solid var(--border-color)",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  headerDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    backgroundColor: "var(--accent)",
    flexShrink: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    margin: 0,
    letterSpacing: "-0.02em",
    color: "var(--text-primary)",
  },
  countBadge: {
    fontSize: 11,
    fontWeight: 600,
    backgroundColor: "var(--accent)",
    color: "var(--bg-primary)",
    borderRadius: "var(--radius-full)",
    padding: "3px 10px",
    letterSpacing: "0.02em",
  },

  // Empty
  empty: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 8,
    padding: 40,
  },
  emptyIcon: {
    fontSize: 24,
    opacity: 0.4,
  },
  emptyText: {
    fontSize: 13,
    color: "var(--text-tertiary)",
  },

  // List
  list: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
  },

  // Card
  card: {
    display: "flex",
    gap: 14,
    padding: 14,
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-color)",
    backgroundColor: "var(--bg-card)",
    boxShadow: "var(--shadow-sm)",
    transition: "all 0.15s ease",
    animation: "fadeIn 0.3s ease-out",
  },
  cardIcon: {
    flexShrink: 0,
    width: 36,
    height: 36,
    borderRadius: "var(--radius-sm)",
    backgroundColor: "var(--badge-bg)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  iconEmoji: {
    fontSize: 16,
  },
  cardContent: {
    flex: 1,
    minWidth: 0,
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text-primary)",
    lineHeight: 1.4,
  },
  time: {
    fontSize: 11,
    color: "var(--text-tertiary)",
    flexShrink: 0,
    whiteSpace: "nowrap" as const,
  },
  cardBody: {
    fontSize: 12,
    color: "var(--text-secondary)",
    marginTop: 4,
    lineHeight: 1.5,
    margin: 0,
  },
  typeBadge: {
    display: "inline-block",
    marginTop: 8,
    fontSize: 10,
    fontWeight: 600,
    color: "var(--text-tertiary)",
    backgroundColor: "var(--badge-bg)",
    borderRadius: "var(--radius-full)",
    padding: "2px 8px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
  },
};

export default NotificationsWidget;

mountWidget(<NotificationsWidget />);
