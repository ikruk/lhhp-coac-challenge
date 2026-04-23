import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export async function generateTags(content: string, title: string): Promise<string[]> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `Analyze this artifact and return 3-6 relevant tags as a JSON array of lowercase strings. No explanation, just the JSON array.

Title: ${title}
Content (first 2000 chars): ${content.slice(0, 2000)}`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const match = text.match(/\[[\s\S]*\]/);
  if (match) {
    return JSON.parse(match[0]);
  }
  return [];
}

export async function generateDescription(
  content: string,
  title: string
): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: `Write a 1-2 sentence description of this artifact. Be concise and specific. No quotes or prefixes, just the description.

Title: ${title}
Content (first 2000 chars): ${content.slice(0, 2000)}`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  return text.trim();
}

export async function summarizeFeedback(
  feedbackItems: { authorName: string; content: string; rating?: number | null }[]
): Promise<string> {
  if (feedbackItems.length === 0) return "No feedback yet.";

  const formatted = feedbackItems
    .map(
      (f, i) =>
        `${i + 1}. ${f.authorName}${f.rating ? ` (${f.rating}/5)` : ""}: ${f.content}`
    )
    .join("\n");

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `Summarize this feedback on an artifact in 2-4 sentences. Highlight consensus, disagreements, and actionable suggestions. Be direct.

Feedback:
${formatted}`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  return text.trim();
}
