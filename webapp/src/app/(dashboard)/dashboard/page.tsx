import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Brain, Users, Activity } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: agent }, { data: memories }, { data: connections }] =
    await Promise.all([
      supabase
        .from("agents")
        .select("display_name, memory_count, status, personality_summary")
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("memories")
        .select("category", { count: "exact" })
        .eq("user_id", user.id)
        .eq("is_active", true),
      supabase
        .from("connections")
        .select("id", { count: "exact" })
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq("status", "accepted"),
    ]);

  const memoryCount = memories?.length ?? 0;
  const connectionCount = connections?.length ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">Pages / Main Dashboard</p>
        <h1 className="text-3xl font-bold">Main Dashboard</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Brain size={20} />}
          title="Memories"
          value={memoryCount}
          description="active memories"
        />
        <StatCard
          icon={<Users size={20} />}
          title="Connections"
          value={connectionCount}
          description="connected users"
        />
        <StatCard
          icon={<Activity size={20} />}
          title="Status"
          value={agent?.status ?? "—"}
          description={agent?.display_name ?? "Twin not configured"}
        />
      </div>

      {/* Twin summary */}
      {agent?.personality_summary && (
        <div className="rounded-lg border p-6 space-y-2">
          <h2 className="font-semibold">Twin Profile</h2>
          <p className="text-sm text-muted-foreground">
            {agent.personality_summary}
          </p>
        </div>
      )}

      {/* Empty state */}
      {memoryCount === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center space-y-2">
          <h3 className="font-medium">No memories yet</h3>
          <p className="text-sm text-muted-foreground">
            Connect the MCP server to ChatGPT to start collecting memories
            automatically, or add them manually from the Memories page.
          </p>
        </div>
      )}

      {connectionCount === 0 && memoryCount > 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center space-y-2">
          <h3 className="font-medium">No connections</h3>
          <p className="text-sm text-muted-foreground">
            Go to the Network section to find other users and send connection
            requests. Once connected, your Twins will be able to communicate.
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  description: string;
}) {
  return (
    <div className="rounded-lg border p-5 space-y-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        {icon}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
