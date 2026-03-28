"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

interface ConnectionRequest {
  readonly id: string;
  readonly requester_id: string;
  readonly receiver_id: string;
  readonly status: string;
  readonly created_at: string;
  readonly requester: {
    readonly id: string;
    readonly display_name: string;
    readonly bio: string | null;
  };
  readonly receiver: {
    readonly id: string;
    readonly display_name: string;
    readonly bio: string | null;
  };
}

export default function RequestsPage() {
  const { data: connData, isLoading: connLoading, mutate } = useSWR<{ data: ConnectionRequest[] }>(
    "/api/connections",
    fetcher
  );
  const { data: userData, isLoading: userLoading } = useSWR<{ user: { id: string } }>(
    "/api/auth/me",
    fetcher
  );

  const connections: readonly ConnectionRequest[] = connData?.data ?? [];
  const currentUserId = userData?.user?.id ?? null;
  const loading = connLoading || userLoading;

  async function handleAction(id: string, status: "accepted" | "rejected") {
    await fetch(`/api/connections/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    mutate();
  }

  async function handleCancel(id: string) {
    await fetch(`/api/connections/${id}`, { method: "DELETE" });
    mutate();
  }

  const incoming = connections.filter(
    (c) => c.receiver_id === currentUserId && c.status === "pending"
  );
  const outgoing = connections.filter(
    (c) => c.requester_id === currentUserId && c.status === "pending"
  );

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">Pages / Requests</p>
        <h1 className="text-3xl font-bold">Connection Requests</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage incoming and outgoing requests
        </p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <>
          {/* Incoming */}
          <div className="space-y-3">
            <h2 className="font-semibold">Incoming ({incoming.length})</h2>
            {incoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No pending requests.
              </p>
            ) : (
              incoming.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                      {req.requester.display_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{req.requester.display_name}</p>
                      {req.requester.bio && (
                        <p className="text-xs text-muted-foreground">
                          {req.requester.bio}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(req.id, "accepted")}
                      className="inline-flex h-8 items-center rounded-lg bg-foreground px-3 text-xs font-medium text-background hover:bg-foreground/90 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleAction(req.id, "rejected")}
                      className="inline-flex h-8 items-center rounded-lg border px-3 text-xs font-medium hover:bg-muted transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Outgoing */}
          <div className="space-y-3">
            <h2 className="font-semibold">Outgoing ({outgoing.length})</h2>
            {outgoing.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No sent requests.
              </p>
            ) : (
              outgoing.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                      {req.receiver.display_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{req.receiver.display_name}</p>
                      <p className="text-xs text-muted-foreground">Pending...</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCancel(req.id)}
                    className="inline-flex h-8 items-center rounded-lg border px-3 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
