import { describe, expect, it } from "vitest";
import type { Bot, Group, Message } from "@/state/store";
import { contextualPromptSuggestion } from "./prompt-suggestions";

const bot: Bot = {
  id: "atlas",
  threadId: "t1",
  name: "Atlas",
  title: "Research Lead",
  description: "analyzing market trends and strategy",
  color: "purple",
  notifications: false,
  unread: false,
  messages: [],
  modelSelection: { instanceId: "inst", model: "model" },
};

const group: Group = {
  id: "g1",
  threadId: "gt1",
  name: "Q4 Roadmap",
  memberIds: ["atlas"],
  defaultResponder: { kind: "member", botId: "atlas" },
  messages: [],
  createdAt: 1,
  setupCompletedAt: 1,
  bulletin: "",
  unread: false,
};

const msg = (props: Partial<Message>): Message => ({
  id: "m1",
  at: 1,
  role: "bot",
  kind: "text",
  ...props,
});

describe("contextualPromptSuggestion", () => {
  it("provides starter prompt for an empty bot thread with description", () => {
    const result = contextualPromptSuggestion({ messages: [], bot });
    expect(result).toBe("Help me with analyzing market trends and strategy");
  });

  it("provides starter prompt for an empty bot thread without description", () => {
    const noDescBot: Bot = { ...bot, description: "" };
    const result = contextualPromptSuggestion({ messages: [], bot: noDescBot });
    expect(result).toBe("Hi Atlas, what can you help me with?");
  });

  it("provides starter prompt for an empty group thread", () => {
    const result = contextualPromptSuggestion({ messages: [], group });
    expect(result).toBe("Let's get started on Q4 Roadmap");
  });

  it("extracts the first option from an open option card", () => {
    const messages: Message[] = [
      msg({
        kind: "options",
        card: {
          title: "Select an approach",
          subtitle: "How should we proceed?",
          options: ["Run simulation across audiences", "Inspect raw feedback"],
        },
      }),
    ];
    const result = contextualPromptSuggestion({ messages, bot });
    expect(result).toBe("Run simulation across audiences");
  });

  it("ignores answered or dismissed option cards", () => {
    const messages: Message[] = [
      msg({
        kind: "options",
        card: {
          title: "Select an approach",
          subtitle: "How should we proceed?",
          options: ["Run simulation across audiences"],
          answered: "Run simulation across audiences",
        },
      }),
    ];
    const result = contextualPromptSuggestion({ messages, bot });
    expect(result).toBeNull();
  });

  it("extracts the first next step from a structured bot response", () => {
    const messages: Message[] = [
      msg({
        text: "Here is what I found about the user funnel.\n\nNext steps:\n1. Run A/B test on hero headline\n2. Update pricing tiers",
      }),
    ];
    const result = contextualPromptSuggestion({ messages, bot });
    expect(result).toBe("Run A/B test on hero headline");
  });

  it("extracts action from a closing question", () => {
    const messages: Message[] = [
      msg({
        text: "The analysis is complete. Would you like me to generate the full audit report?",
      }),
    ];
    const result = contextualPromptSuggestion({ messages, bot });
    expect(result).toBe("Go ahead and generate the full audit report");
  });

  it("returns null when no suggestion can be inferred from a generic response", () => {
    const messages: Message[] = [
      msg({
        text: "All files have been saved successfully.",
      }),
    ];
    const result = contextualPromptSuggestion({ messages, bot });
    expect(result).toBeNull();
  });
});
