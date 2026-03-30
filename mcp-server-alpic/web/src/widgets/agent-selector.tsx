import "@/index.css";

import { mountWidget, useLayout } from "skybridge/web";
import { useToolInfo, useCallTool } from "../helpers.js";
import React, { useCallback, useMemo, useState } from "react";

interface Agent {
  readonly id: string;
  readonly name: string;
  readonly specialty: string;
  readonly icon: string;
}

interface FriendAgent extends Agent {
  readonly memory_count: number;
}

function renderMarkdown(md: string): string {
  return md
    .replace(/```(\w*)\n([\s\S]*?)```/g, "<pre><code>$2</code></pre>")
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    .replace(/^#### (.+)$/gm, "<h4>$1</h4>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^[-*] (.+)$/gm, "<li>$1</li>")
    .replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>")
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    .replace(/^---$/gm, "<hr/>")
    .replace(/^(?!<[hluop]|<hr|<pre|<li)(.+)$/gm, "<p>$1</p>")
    .replace(/<\/ul>\s*<ul>/g, "")
    .replace(/\n{2,}/g, "\n");
}

function Markdown({ content }: { readonly content: string }) {
  const html = useMemo(() => renderMarkdown(content), [content]);
  return (
    <div
      className="md-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function AgentChip({
  agent,
  selected,
  onToggle,
  badge,
}: {
  readonly agent: Agent;
  readonly selected: boolean;
  readonly onToggle: () => void;
  readonly badge?: string;
}) {
  return (
    <button
      onClick={onToggle}
      style={{
        ...s.chip,
        ...(selected ? s.chipSelected : {}),
      }}
    >
      <span style={s.chipIcon}>{agent.icon}</span>
      <span style={s.chipName}>{agent.name}</span>
      {badge && <span style={s.chipBadge}>{badge}</span>}
      <span style={{ ...s.chipCheck, ...(selected ? s.chipCheckSelected : {}) }}>
        {selected ? "\u2713" : "\u002B"}
      </span>
    </button>
  );
}

function AgentSelector() {
  const { theme } = useLayout();
  const toolInfo = useToolInfo<"agent-selector">();
  const { isPending } = toolInfo;

  const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);
  const [planDescription, setPlanDescription] = useState<string>("");

  const {
    callTool: callCreatePlan,
    isPending: isCreatingPlan,
    data: planResult,
  } = useCallTool("create-plan");

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const toggleAgent = useCallback(
    (id: string) => {
      setSelectedIds(
        selectedSet.has(id)
          ? selectedIds.filter((sid) => sid !== id)
          : [...selectedIds, id]
      );
    },
    [selectedIds, selectedSet, setSelectedIds]
  );

  const handleCreatePlan = useCallback(() => {
    if (selectedIds.length === 0 || !planDescription.trim()) return;

    callCreatePlan({
      plan_description: planDescription,
      agent_ids: [...selectedIds],
    });
  }, [selectedIds, planDescription, callCreatePlan]);

  if (isPending || !toolInfo.isSuccess) {
    return (
      <div data-theme={theme} style={s.container}>
        <div style={s.loadingContainer}>
          <div style={s.spinner} />
          <span style={s.loadingText}>Loading agents...</span>
        </div>
      </div>
    );
  }

  const { output } = toolInfo;
  const allAgents = output.builtin_agents as readonly Agent[];
  const friendAgents = output.friend_agents as readonly FriendAgent[];

  return (
    <div data-theme={theme} style={s.container}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.headerDot} />
          <div>
            <h2 style={s.title}>Build Your Team</h2>
            <p style={s.subtitle}>Select agents to collaborate on your plan</p>
          </div>
        </div>
        <div style={s.selectedBadge} data-llm="selected-count">
          {selectedIds.length} selected
        </div>
      </div>

      {/* Specialist Agents */}
      <div style={s.section}>
        <div style={s.sectionHeader}>
          <span style={s.sectionLabel}>Specialist Agents</span>
          <span style={s.sectionCount}>{allAgents.length}</span>
        </div>
        <div style={s.chipGrid} data-llm="specialist-agents">
          {allAgents.map((agent) => (
            <AgentChip
              key={agent.id}
              agent={agent}
              selected={selectedSet.has(agent.id)}
              onToggle={() => toggleAgent(agent.id)}
            />
          ))}
        </div>
      </div>

      {/* Friend Agents */}
      {friendAgents.length > 0 && (
        <div style={s.section}>
          <div style={s.sectionHeader}>
            <span style={s.sectionLabel}>Friends' Digital Twins</span>
            <span style={s.sectionCount}>{friendAgents.length}</span>
          </div>
          <div style={s.chipGrid} data-llm="friend-agents">
            {friendAgents.map((agent) => (
              <AgentChip
                key={agent.id}
                agent={agent}
                selected={selectedSet.has(agent.id)}
                onToggle={() => toggleAgent(agent.id)}
                badge={`${agent.memory_count} memories`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Plan Input */}
      <div style={s.section}>
        <div style={s.sectionHeader}>
          <span style={s.sectionLabel}>Describe Your Plan</span>
        </div>
        <textarea
          value={planDescription}
          onChange={(e) => setPlanDescription(e.target.value)}
          placeholder="Describe the project or feature you want to plan..."
          style={s.textarea}
          rows={3}
          data-llm="plan-description"
        />
      </div>

      {/* Action Footer */}
      <div style={s.footer}>
        <button
          onClick={handleCreatePlan}
          disabled={
            selectedIds.length === 0 ||
            !planDescription.trim() ||
            isCreatingPlan
          }
          style={{
            ...s.button,
            ...(selectedIds.length === 0 ||
            !planDescription.trim() ||
            isCreatingPlan
              ? s.buttonDisabled
              : {}),
          }}
        >
          {isCreatingPlan ? "Creating..." : "Create Plan"}
        </button>
      </div>

      {/* Loading state */}
      {isCreatingPlan && (
        <div style={s.collaboratingBanner}>
          <div style={s.spinnerSmall} />
          <span>Agents are collaborating on your plan...</span>
        </div>
      )}

      {/* Plan Result */}
      {planResult && (
        <div style={s.resultContainer}>
          <div style={s.resultHeader}>
            <h3 style={s.resultTitle}>Collaborative Plan</h3>
          </div>

          {/* Agent contributions */}
          {((): React.ReactNode => {
            const contributions = (planResult.structuredContent as Record<string, unknown>)
              ?.contributions as ReadonlyArray<{
              agentId: string;
              icon: string;
              agentName: string;
              contribution: string;
            }> | undefined;
            if (!contributions) return null;
            return contributions.map((c) => (
              <div key={c.agentId} style={s.contribution}>
                <div style={s.contributionHeader}>
                  <span style={s.contributionIcon}>{c.icon}</span>
                  <span style={s.contributionName}>{c.agentName}</span>
                </div>
                <Markdown content={c.contribution} />
              </div>
            ));
          })()}

          {/* Unified plan */}
          <div style={s.unifiedPlan}>
            <div style={s.unifiedPlanHeader}>
              <span style={s.unifiedPlanLabel}>Unified Plan</span>
            </div>
            <Markdown
              content={
                ((planResult.structuredContent as Record<string, unknown>)
                  ?.unified_plan as string) ?? ""
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    maxWidth: 700,
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
    padding: 48,
  },
  loadingText: {
    fontSize: 13,
    color: "var(--text-tertiary)",
  },
  spinner: {
    width: 20,
    height: 20,
    border: "2px solid var(--border-color)",
    borderTopColor: "var(--accent)",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },

  // Header
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
    paddingBottom: 20,
    borderBottom: "1px solid var(--border-color)",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  headerDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    backgroundColor: "var(--accent)",
    flexShrink: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
    letterSpacing: "-0.02em",
    color: "var(--text-primary)",
  },
  subtitle: {
    fontSize: 13,
    color: "var(--text-tertiary)",
    margin: 0,
    marginTop: 2,
  },
  selectedBadge: {
    fontSize: 11,
    fontWeight: 600,
    color: "var(--text-secondary)",
    backgroundColor: "var(--accent-soft)",
    border: "1px solid var(--accent-border)",
    borderRadius: "var(--radius-full)",
    padding: "4px 12px",
    letterSpacing: "0.02em",
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    color: "var(--text-tertiary)",
  },
  sectionCount: {
    fontSize: 10,
    fontWeight: 600,
    color: "var(--badge-text)",
    backgroundColor: "var(--badge-bg)",
    borderRadius: "var(--radius-full)",
    padding: "1px 7px",
  },

  // Agent Chips
  chipGrid: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 8,
  },
  chip: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 14px",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-color)",
    backgroundColor: "var(--bg-card)",
    cursor: "pointer",
    transition: "all 0.15s ease",
    boxShadow: "var(--shadow-sm)",
    fontSize: 13,
    fontFamily: "inherit",
    color: "var(--text-primary)",
  },
  chipSelected: {
    borderColor: "var(--border-selected)",
    backgroundColor: "var(--bg-active)",
    boxShadow: "var(--shadow-focus)",
  },
  chipIcon: {
    fontSize: 18,
    lineHeight: 1,
  },
  chipName: {
    fontSize: 13,
    fontWeight: 500,
    color: "var(--text-primary)",
  },
  chipBadge: {
    fontSize: 10,
    color: "var(--text-tertiary)",
    backgroundColor: "var(--badge-bg)",
    borderRadius: "var(--radius-full)",
    padding: "1px 6px",
    fontWeight: 500,
  },
  chipCheck: {
    width: 18,
    height: 18,
    borderRadius: 6,
    border: "1.5px solid var(--border-color)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 700,
    color: "var(--text-muted)",
    flexShrink: 0,
    marginLeft: 2,
    transition: "all 0.15s ease",
  },
  chipCheckSelected: {
    backgroundColor: "var(--accent)",
    borderColor: "var(--accent)",
    color: "var(--bg-primary)",
  },

  // Textarea
  textarea: {
    width: "100%",
    padding: 14,
    border: "1px solid var(--input-border)",
    borderRadius: "var(--radius-md)",
    fontSize: 13,
    fontFamily: "inherit",
    lineHeight: 1.6,
    resize: "vertical" as const,
    outline: "none",
    boxSizing: "border-box" as const,
    backgroundColor: "var(--input-bg)",
    color: "var(--text-primary)",
    transition: "border-color 0.15s ease",
  },

  // Footer
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    paddingTop: 16,
    borderTop: "1px solid var(--border-color)",
  },
  button: {
    padding: "10px 28px",
    backgroundColor: "var(--accent)",
    color: "var(--bg-primary)",
    border: "none",
    borderRadius: "var(--radius-full)",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "inherit",
    cursor: "pointer",
    transition: "all 0.15s ease",
    letterSpacing: "0.01em",
  },
  buttonDisabled: {
    backgroundColor: "var(--badge-bg)",
    color: "var(--text-muted)",
    cursor: "not-allowed",
  },

  // Collaborating banner
  collaboratingBanner: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "var(--accent-soft)",
    border: "1px solid var(--accent-border)",
    borderRadius: "var(--radius-md)",
    display: "flex",
    alignItems: "center",
    gap: 12,
    fontSize: 13,
    color: "var(--text-secondary)",
    animation: "fadeIn 0.3s ease-out",
  },
  spinnerSmall: {
    width: 16,
    height: 16,
    border: "2px solid var(--border-color)",
    borderTopColor: "var(--accent)",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    flexShrink: 0,
  },

  // Plan Result
  resultContainer: {
    marginTop: 24,
    paddingTop: 24,
    borderTop: "1px solid var(--border-color)",
    animation: "slideIn 0.4s ease-out",
  },
  resultHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 17,
    fontWeight: 700,
    margin: 0,
    letterSpacing: "-0.01em",
    color: "var(--text-primary)",
  },

  // Contributions
  contribution: {
    marginBottom: 12,
    padding: 16,
    backgroundColor: "var(--bg-secondary)",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-color)",
  },
  contributionHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    paddingBottom: 10,
    borderBottom: "1px solid var(--border-color)",
  },
  contributionIcon: {
    fontSize: 16,
  },
  contributionName: {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text-primary)",
  },

  // Unified plan
  unifiedPlan: {
    marginTop: 16,
    padding: 20,
    backgroundColor: "var(--bg-secondary)",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-color)",
  },
  unifiedPlanHeader: {
    marginBottom: 12,
    paddingBottom: 10,
    borderBottom: "1px solid var(--border-color)",
  },
  unifiedPlanLabel: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    color: "var(--text-tertiary)",
  },
};

export default AgentSelector;

mountWidget(<AgentSelector />);
