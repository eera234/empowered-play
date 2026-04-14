"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

export const detectBuildingBlocks = action({
  args: { imageBase64: v.string() },
  handler: async (_ctx, { imageBase64 }) => {
    try {
      const imageBuffer = Buffer.from(imageBase64, "base64");

      const result = await generateText({
        model: anthropic("claude-haiku-4-5-20251001"),
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                image: imageBuffer,
              },
              {
                type: "text",
                text: `Does this photo show physical building blocks, interlocking bricks, or a structure built from plastic or wooden blocks? This includes LEGO, Mega Bloks, Duplo, or any construction toy.

Reply ONLY: YES or NO`,
              },
            ],
          },
        ],
      });

      console.log("Detection response:", result.text);
      const isLego = result.text.trim().toUpperCase().startsWith("YES");
      return { isLego };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error("Detection error:", errMsg);
      return { isLego: true, skipped: true, error: errMsg };
    }
  },
});
