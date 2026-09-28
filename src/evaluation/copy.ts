/** Customer-facing copy for evaluation steps and failure reasons. */

export function displayTitle(
  title: string | null | undefined,
  url: string,
): string {
  if (title && title.trim() !== "") {
    return title.trim();
  }
  try {
    const parsed = new URL(url);
    const segment = parsed.pathname.split("/").filter(Boolean).pop();
    if (segment) {
      return segment
        .replace(/[-_]+/g, " ")
        .replace(/\.[a-z0-9]+$/i, "")
        .replace(/\b\w/g, (character) => character.toUpperCase());
    }
    return parsed.hostname;
  } catch {
    return "Product page";
  }
}

export function describeApiError(code: string | undefined): string {
  switch (code) {
    case "url must be a valid absolute URL":
      return "Enter a valid URL including https://";
    case "invalid_request":
      return "Please check the form and try again.";
    case "pdp_not_found":
      return "We couldn't find that product page.";
    case "profile_not_found":
      return "One of the selected models is no longer available.";
    case "too_many_models":
      return "Too many models selected. Deselect a few and try again.";
    case "cost_ceiling_exceeded":
      return "This run would exceed the cost limit. Select fewer models or raise the limit.";
    case "modelProfileIds must be a non-empty string array":
      return "Select at least one model.";
    case "invalid password":
      return "Incorrect password. Please try again.";
    case "auth is not configured":
      return "Sign-in is not configured. Set APP_PASSWORD in your environment.";
    default:
      return code && code.trim() !== ""
        ? "Something went wrong. Please try again."
        : "Something went wrong. Please try again.";
  }
}

export function describeClassification(label: string | undefined): string {
  switch (label) {
    case "product":
      return "Product page";
    case "homepage":
      return "Homepage";
    case "category":
      return "Category page";
    case "error":
      return "Page could not be loaded";
    case "unknown":
      return "Unrecognized page";
    default:
      return "Page";
  }
}

export function describeEvaluationStatusShort(status: string): string {
  switch (status) {
    case "created":
      return "Queued";
    case "fetching":
      return "Fetching";
    case "evaluating":
      return "Running";
    case "completed":
      return "Completed";
    case "partial":
      return "Partial";
    case "failed":
      return "Failed";
    default:
      return status;
  }
}

export function describeStepStatus(status: string): string {
  return status === "ok" ? "Done" : status === "failed" ? "Error" : status;
}

export function describeModelStatus(status: string): string {
  return status === "completed" ? "Completed" : "Failed";
}

export function describeCheckStatus(status: string): string {
  switch (status) {
    case "pass":
      return "Pass";
    case "partial":
      return "Partly";
    case "fail":
      return "Issue";
    default:
      return status;
  }
}

export function describeModelError(message: string | null | undefined): string {
  if (!message) {
    return "";
  }
  const http = /HTTP (\d{3})/i.exec(message);
  if (http) {
    const code = http[1];
    if (code === "503") {
      return "The AI provider was temporarily busy (503). Try again.";
    }
    if (code === "429") {
      return "Rate limited by the AI provider (429). Try again shortly.";
    }
    if (code === "404") {
      return "This model is not available for your account (404).";
    }
    if (code === "401" || code === "403") {
      return "The AI provider rejected the API key (401/403). Check your key.";
    }
    return `The AI provider returned an error (${code}).`;
  }
  if (/timeout/i.test(message)) {
    return "The AI provider took too long to respond. Try again.";
  }
  if (/missing_credentials|not set|requires/i.test(message)) {
    return "No API key is configured for this model.";
  }
  return "The model could not be reached. Try again.";
}

export function describeStep(name: string): string {
  if (name.startsWith("model:")) {
    return `Asking ${name.slice("model:".length)} to read the page`;
  }
  if (name.startsWith("retry:")) {
    return `Retrying ${name.slice("retry:".length)}`;
  }
  const map: Record<string, string> = {
    resolve_pdp: "Looking up the product",
    fetch: "Fetching the page as a search engine would",
    normalize: "Reading and cleaning the content",
    classify: "Checking that this is a product page",
    deterministic_checks: "Running the readiness checks",
    scoring: "Scoring and writing recommendations",
    cost_ceiling: "Stopping to stay within the cost ceiling",
  };
  return map[name] ?? name;
}

export type ReasonCopy = { title: string; detail: string };

export function describeReason(reason: string | null | undefined): ReasonCopy {
  if (!reason) {
    return {
      title: "Evaluation finished",
      detail: "The evaluation completed successfully.",
    };
  }
  if (reason.startsWith("fetch_blocked")) {
    return {
      title: "We couldn't reach the page",
      detail:
        "The site blocked our automated request. Try again later, or evaluate a different product page. Some sites only allow real browsers.",
    };
  }
  if (reason.startsWith("fetch_failed")) {
    return {
      title: "We couldn't load the page",
      detail:
        "The request to the site failed. Check the URL and try again.",
    };
  }
  if (reason.startsWith("not_a_pdp")) {
    return {
      title: "This doesn't look like a product page",
      detail:
        "The URL looks like a homepage or a category page. Use a link to a specific product.",
    };
  }
  if (reason === "cost_ceiling_exceeded") {
    return {
      title: "Stopped to stay within budget",
      detail:
        "The estimated cost reached your ceiling before every model finished. Raise the ceiling or select fewer models.",
    };
  }
  if (reason === "all_models_failed") {
    return {
      title: "No AI model could be reached",
      detail:
        "This is often a temporary provider issue. Try again; if it persists, check your API keys and quotas.",
    };
  }
  if (reason.startsWith("models_failed:")) {
    const counts = reason.slice("models_failed:".length);
    const [failed, total] = counts.split("/");
    return {
      title: "Some models failed",
      detail: `${failed} of ${total} models could not be reached, so these results are partial. You can retry the failed models below.`,
    };
  }
  return {
    title: "Something went wrong",
    detail: reason,
  };
}
