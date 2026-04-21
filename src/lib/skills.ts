export type Skill = {
  id: string;
  name: string;
  description: string;
};

export type SkillCategory = {
  id: string;
  name: string;
  accent: string;
  skills: Skill[];
};

export const SKILL_CATEGORIES: SkillCategory[] = [
  {
    id: "dev",
    name: "Software Development & Coding",
    accent: "from-indigo-500/30 to-violet-500/10",
    skills: [
      {
        id: "writing-plans",
        name: "writing-plans",
        description: "Draft detailed implementation plans before coding.",
      },
      {
        id: "test-driven-development",
        name: "test-driven-development",
        description: "Write tests first, then implement until they pass.",
      },
      {
        id: "subagent-driven-development",
        name: "subagent-driven-development",
        description: "Delegate parallelizable work to specialized subagents.",
      },
      {
        id: "systematic-debugging",
        name: "systematic-debugging",
        description: "Bisect, isolate, and fix bugs with repeatable method.",
      },
      {
        id: "requesting-code-review",
        name: "requesting-code-review",
        description: "Package a diff and invite a structured review.",
      },
    ],
  },
  {
    id: "devops",
    name: "DevOps & Infrastructure",
    accent: "from-cyan-500/30 to-sky-500/10",
    skills: [
      {
        id: "github-repo-management",
        name: "github-repo-management",
        description: "Manage branches, issues, and repo configuration.",
      },
      {
        id: "github-pr-workflow",
        name: "github-pr-workflow",
        description: "Open, review, and merge pull requests end-to-end.",
      },
      {
        id: "webhook-subscriptions",
        name: "webhook-subscriptions",
        description: "Subscribe to live webhook streams for PR activity.",
      },
    ],
  },
  {
    id: "ml",
    name: "Data Science & ML/AI",
    accent: "from-emerald-500/30 to-teal-500/10",
    skills: [
      {
        id: "jupyter-live-kernel",
        name: "jupyter-live-kernel",
        description: "Drive a live Jupyter kernel for notebooks.",
      },
      {
        id: "huggingface-hub",
        name: "huggingface-hub",
        description: "Search, download, and interact with HF models.",
      },
      {
        id: "dspy",
        name: "dspy",
        description: "Build and optimize DSPy programs.",
      },
      {
        id: "evaluating-llms-harness",
        name: "evaluating-llms-harness",
        description: "Run the lm-evaluation-harness over models.",
      },
    ],
  },
  {
    id: "creative",
    name: "Creative & Media",
    accent: "from-pink-500/30 to-rose-500/10",
    skills: [
      {
        id: "architecture-diagram",
        name: "architecture-diagram",
        description: "Render system architecture diagrams.",
      },
      {
        id: "ascii-art",
        name: "ascii-art",
        description: "Generate ASCII art and ASCII video.",
      },
      {
        id: "p5js",
        name: "p5js",
        description: "Generative sketches and creative coding with p5.",
      },
    ],
  },
  {
    id: "productivity",
    name: "Productivity & Research",
    accent: "from-amber-500/30 to-orange-500/10",
    skills: [
      {
        id: "google-workspace",
        name: "google-workspace",
        description: "Drive Docs, Sheets, Calendar, Gmail.",
      },
      {
        id: "notion",
        name: "notion",
        description: "Read & write Notion pages and databases.",
      },
      {
        id: "arxiv",
        name: "arxiv",
        description: "Search and summarize arXiv papers.",
      },
    ],
  },
];

export function allSkills(): Skill[] {
  return SKILL_CATEGORIES.flatMap((c) => c.skills);
}
