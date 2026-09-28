export const AI_CRAWLERS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "Google-Extended",
  "PerplexityBot",
  "CCBot",
  "Applebot-Extended",
  "Bytespider",
  "Amazonbot",
  "meta-externalagent",
] as const;

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export type RobotsRule = { allow: boolean; path: string };

export type RobotsRules = Map<string, RobotsRule[]>;

export function parseRobots(text: string): RobotsRules {
  const rules: RobotsRules = new Map();
  let currentAgents: string[] = [];
  let inRules = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (line === "") {
      continue;
    }
    const separator = line.indexOf(":");
    if (separator === -1) {
      continue;
    }
    const field = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();

    if (field === "user-agent") {
      if (inRules) {
        currentAgents = [];
        inRules = false;
      }
      const agent = value.toLowerCase() || "*";
      currentAgents.push(agent);
      if (!rules.has(agent)) {
        rules.set(agent, []);
      }
    } else if (field === "allow" || field === "disallow") {
      inRules = true;
      const allow = field === "allow";
      for (const agent of currentAgents) {
        rules.get(agent)?.push({ allow, path: value });
      }
    }
  }

  return rules;
}

function pathMatches(pattern: string, path: string): boolean {
  if (pattern === "") {
    return false;
  }
  if (pattern.endsWith("$")) {
    return path === pattern.slice(0, -1);
  }
  const prefix = pattern.replace(/\*+$/, "");
  return path.startsWith(prefix);
}

export function isPathAllowed(
  rules: RobotsRule[],
  path = "/",
): boolean {
  let best: RobotsRule | undefined;
  for (const rule of rules) {
    if (!pathMatches(rule.path, path)) {
      continue;
    }
    if (
      !best ||
      rule.path.length > best.path.length ||
      (rule.path.length === best.path.length && rule.allow)
    ) {
      best = rule;
    }
  }
  return best ? best.allow : true;
}

export type BotAccess = {
  name: string;
  allowed: boolean;
  source: "specific" | "wildcard";
};

export type RobotsEvaluation = {
  allowed: boolean;
  blockedBots: string[];
  bots: BotAccess[];
};

export function evaluateRobots(
  text: string,
  bots: readonly string[] = AI_CRAWLERS,
): RobotsEvaluation {
  const rules = parseRobots(text);
  const wildcard = rules.get("*") ?? [];

  const results: BotAccess[] = bots.map((name) => {
    const specific = rules.get(name.toLowerCase());
    const hasSpecific = Boolean(specific && specific.length > 0);
    const effective = hasSpecific ? specific! : wildcard;
    return {
      name,
      allowed: isPathAllowed(effective, "/"),
      source: hasSpecific ? "specific" : "wildcard",
    };
  });

  const blockedBots = results.filter((bot) => !bot.allowed).map((b) => b.name);

  return { allowed: blockedBots.length === 0, blockedBots, bots: results };
}

export type RobotsFetchResult = {
  robotsUrl: string;
  statusCode: number;
  present: boolean;
  text?: string;
  error?: string;
  fetchedAt: Date;
};

export type FetchRobotsOptions = {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  userAgent?: string;
};

export async function fetchRobots(
  url: string,
  options: FetchRobotsOptions = {},
): Promise<RobotsFetchResult> {
  const fetchFn = options.fetchImpl ?? fetch;
  const timeoutMs =
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const userAgent =
    options.userAgent ?? process.env.FETCH_USER_AGENT ?? DEFAULT_USER_AGENT;

  const origin = new URL(url).origin;
  const robotsUrl = `${origin}/robots.txt`;
  const fetchedAt = new Date();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchFn(robotsUrl, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": userAgent, accept: "text/plain,*/*" },
    });
    const text = await response.text();
    return {
      robotsUrl,
      statusCode: response.status,
      present: response.ok && text.trim() !== "",
      text,
      fetchedAt,
    };
  } catch (error) {
    return {
      robotsUrl,
      statusCode: 0,
      present: false,
      error: controller.signal.aborted
        ? "timeout"
        : error instanceof Error
          ? error.message
          : String(error),
      fetchedAt,
    };
  } finally {
    clearTimeout(timer);
  }
}

export type AgentAccessResult = RobotsFetchResult & {
  allowed: boolean;
  blockedBots: string[];
  bots: BotAccess[];
};

export async function checkAgentAccess(
  url: string,
  options: FetchRobotsOptions = {},
): Promise<AgentAccessResult> {
  const fetched = await fetchRobots(url, options);
  if (!fetched.present || !fetched.text) {
    return {
      ...fetched,
      allowed: true,
      blockedBots: [],
      bots: AI_CRAWLERS.map((name) => ({
        name,
        allowed: true,
        source: "wildcard" as const,
      })),
    };
  }

  const evaluation = evaluateRobots(fetched.text);
  return { ...fetched, ...evaluation };
}
