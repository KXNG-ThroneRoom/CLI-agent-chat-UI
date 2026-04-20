export type ToolMeta = {
  name: string;
  label: string;
  icon: string;
  category: "file" | "shell" | "browser" | "ai" | "system" | "skill" | "media";
  accent: string;
};

export const TOOL_REGISTRY: Record<string, ToolMeta> = {
  read_file: {
    name: "read_file",
    label: "read file",
    icon: "FileText",
    category: "file",
    accent: "#22d3ee",
  },
  write_file: {
    name: "write_file",
    label: "write file",
    icon: "FilePlus",
    category: "file",
    accent: "#22d3ee",
  },
  search_files: {
    name: "search_files",
    label: "search files",
    icon: "Search",
    category: "file",
    accent: "#22d3ee",
  },
  patch: {
    name: "patch",
    label: "patch",
    icon: "GitBranch",
    category: "file",
    accent: "#22d3ee",
  },
  terminal: {
    name: "terminal",
    label: "terminal",
    icon: "TerminalSquare",
    category: "shell",
    accent: "#a78bfa",
  },
  execute_code: {
    name: "execute_code",
    label: "execute code",
    icon: "Code2",
    category: "shell",
    accent: "#a78bfa",
  },
  browser_navigate: {
    name: "browser_navigate",
    label: "browser navigate",
    icon: "Globe",
    category: "browser",
    accent: "#38bdf8",
  },
  browser_snapshot: {
    name: "browser_snapshot",
    label: "browser snapshot",
    icon: "Camera",
    category: "browser",
    accent: "#38bdf8",
  },
  browser_click: {
    name: "browser_click",
    label: "browser click",
    icon: "MousePointerClick",
    category: "browser",
    accent: "#38bdf8",
  },
  browser_type: {
    name: "browser_type",
    label: "browser type",
    icon: "Keyboard",
    category: "browser",
    accent: "#38bdf8",
  },
  browser_scroll: {
    name: "browser_scroll",
    label: "browser scroll",
    icon: "ScrollText",
    category: "browser",
    accent: "#38bdf8",
  },
  browser_console: {
    name: "browser_console",
    label: "browser console",
    icon: "SquareTerminal",
    category: "browser",
    accent: "#38bdf8",
  },
  browser_get_images: {
    name: "browser_get_images",
    label: "browser images",
    icon: "Images",
    category: "browser",
    accent: "#38bdf8",
  },
  browser_vision: {
    name: "browser_vision",
    label: "browser vision",
    icon: "Eye",
    category: "browser",
    accent: "#38bdf8",
  },
  clarify: {
    name: "clarify",
    label: "clarify",
    icon: "HelpCircle",
    category: "ai",
    accent: "#f472b6",
  },
  memory: {
    name: "memory",
    label: "memory",
    icon: "Brain",
    category: "ai",
    accent: "#f472b6",
  },
  session_search: {
    name: "session_search",
    label: "session search",
    icon: "History",
    category: "ai",
    accent: "#f472b6",
  },
  cronjob: {
    name: "cronjob",
    label: "cron job",
    icon: "CalendarClock",
    category: "system",
    accent: "#fbbf24",
  },
  process: {
    name: "process",
    label: "process",
    icon: "Cpu",
    category: "system",
    accent: "#fbbf24",
  },
  skill_view: {
    name: "skill_view",
    label: "skill view",
    icon: "BookOpen",
    category: "skill",
    accent: "#6366f1",
  },
  skills_list: {
    name: "skills_list",
    label: "skills list",
    icon: "List",
    category: "skill",
    accent: "#6366f1",
  },
  skill_manage: {
    name: "skill_manage",
    label: "skill manage",
    icon: "Settings2",
    category: "skill",
    accent: "#6366f1",
  },
  texttospeech: {
    name: "texttospeech",
    label: "text to speech",
    icon: "Volume2",
    category: "media",
    accent: "#34d399",
  },
};

export function getToolMeta(name: string): ToolMeta {
  return (
    TOOL_REGISTRY[name] ?? {
      name,
      label: name.replace(/_/g, " "),
      icon: "Sparkles",
      category: "ai",
      accent: "#6366f1",
    }
  );
}
