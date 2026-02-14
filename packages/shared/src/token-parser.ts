const EMOJI_REGEX = /:(\w[\w-]*):/g;
const STICKER_REGEX = /\[sticker:(\w[\w-]*)\]/g;
const MAX_STICKERS_PER_COMMENT = 1;

export type TokenType = "emoji" | "sticker";

export type Token = {
  type: TokenType;
  name: string;
  raw: string;
};

export type ContentSegment =
  | { type: "text"; content: string }
  | { type: "emoji"; name: string }
  | { type: "sticker"; name: string };

export function parseTokens(content: string): Token[] {
  const tokens: Token[] = [];

  for (const match of content.matchAll(EMOJI_REGEX)) {
    tokens.push({ type: "emoji", name: match[1]!, raw: match[0] });
  }

  for (const match of content.matchAll(STICKER_REGEX)) {
    tokens.push({ type: "sticker", name: match[1]!, raw: match[0] });
  }

  return tokens;
}

export function validateTokenLimit(tokens: Token[]): {
  valid: boolean;
  error?: string;
} {
  const stickerCount = tokens.filter((t) => t.type === "sticker").length;
  if (stickerCount > MAX_STICKERS_PER_COMMENT) {
    return {
      valid: false,
      error: `Solo un sticker por comentario (encontrados: ${stickerCount})`,
    };
  }
  return { valid: true };
}

export function renderTokenizedContent(content: string): ContentSegment[] {
  const combined = new RegExp(
    `${EMOJI_REGEX.source}|${STICKER_REGEX.source}`,
    "g"
  );
  const segments: ContentSegment[] = [];
  let lastIndex = 0;

  for (const match of content.matchAll(combined)) {
    const matchIndex = match.index!;

    if (matchIndex > lastIndex) {
      segments.push({
        type: "text",
        content: content.slice(lastIndex, matchIndex),
      });
    }

    if (match[0].startsWith(":")) {
      segments.push({ type: "emoji", name: match[1]! });
    } else {
      segments.push({ type: "sticker", name: match[2]! });
    }

    lastIndex = matchIndex + match[0].length;
  }

  if (lastIndex < content.length) {
    segments.push({ type: "text", content: content.slice(lastIndex) });
  }

  return segments;
}
