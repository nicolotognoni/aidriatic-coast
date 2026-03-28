"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

interface Plan {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly status: string;
  readonly agent_ids: readonly string[];
  readonly created_at: string;
  readonly updated_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  active: "Active",
  completed: "Completed",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800",
  active: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function PlansPage() {
  const { data, isLoading } = useSWR<{ data: Plan[] }>(
    "/api/plans",
    fetcher
  );
  const plans: readonly Plan[] = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Pages / Plans</p>
        <h1 className="text-3xl font-bold">Plans</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Collaborative plans created with your agents
        </p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : plans.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center space-y-2">
          <h3 className="font-medium">No plans yet</h3>
          <p className="text-sm text-muted-foreground">
            Create a plan in ChatGPT with the agent team. Plans will be saved
            automatically and shown here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <div key={plan.id} className="rounded-lg border p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{plan.name}</h3>
                  {plan.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {plan.description}
                    </p>
                  )}
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${
                    STATUS_COLORS[plan.status] ?? "bg-gray-100 text-gray-800"
                  }`}
                >
                  {STATUS_LABELS[plan.status] ?? plan.status}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{plan.agent_ids.length} agents</span>
                <span>Created {formatDate(plan.created_at)}</span>
                {plan.updated_at !== plan.created_at && (
                  <span>Updated {formatDate(plan.updated_at)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
