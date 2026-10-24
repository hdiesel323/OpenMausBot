import type { Bot, Group, Message } from "@/state/store";

export interface PromptSuggestionContext {
  messages: readonly Message[];
  bot?: Bot;
  group?: Group;
}

const QUESTION_PATTERNS = [
  /would you like (?:me to )?([^?]+)\?/i,
  /do you want (?:me to )?([^?]+)\?/i,
  /shall (?:we|i) ([^?]+)\?/i,
  /should (?:we|i) ([^?]+)\?/i,
  /want me to ([^?]+)\?/i,
];

const NEXT_STEPS_PATTERN = /(?:next steps?|try asking|options?|suggestions?):\s*\n(?:[-*•]|\d+\.)\s*([^\n]+)/i;

/**
 * Extracts a suggested next prompt from the last bot message or thread context.
 * Returns null if no actionable suggestion can be inferred.
 */
export function contextualPromptSuggestion(context: PromptSuggestionContext): string | null {
  const { messages, bot, group } = context;

  if (messages.length > 0) {
    const lastBot = [...messages].reverse().find((m) => m.role === "bot");
    if (lastBot) {
      if (lastBot.card?.options?.length && !lastBot.card.answered && !lastBot.card.dismissed) {
        return lastBot.card.options[0] ?? null;
      }

      const text = lastBot.text?.trim() ?? "";
      if (text) {
        const stepsMatch = NEXT_STEPS_PATTERN.exec(text);
        if (stepsMatch?.[1]) {
          return stepsMatch[1].replace(/^["'`]+|["'`]+$/g, "").replace(/\s+/g, " ").trim();
        }

        for (const pattern of QUESTION_PATTERNS) {
          const match = pattern.exec(text);
          if (match?.[1]) {
            const action = match[1].replace(/^["'`]+|["'`]+$/g, "").replace(/\s+/g, " ").trim();
            return `Go ahead and ${action}`;
          }
        }
      }
    }
    return null;
  }

  if (bot) {
    if (bot.description?.trim()) {
      const desc = bot.description.replace(/^["'`]+|["'`]+$/g, "").replace(/\s+/g, " ").trim();
      return `Help me with ${desc}`;
    }
    if (bot.name?.trim()) {
      return `Hi ${bot.name}, what can you help me with?`;
    }
  }

  if (group?.name?.trim()) {
    return `Let's get started on ${group.name}`;
  }

  return null;
}
