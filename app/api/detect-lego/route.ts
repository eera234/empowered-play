import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { imageDataUrl } = await req.json();

    if (!imageDataUrl || !imageDataUrl.startsWith("data:image")) {
      return NextResponse.json({ isLego: false, message: "No valid image provided" }, { status: 400 });
    }

    // Convert data URL to a proper base64 buffer
    const base64Data = imageDataUrl.split(",")[1];
    if (!base64Data) {
      return NextResponse.json({ isLego: false, message: "Invalid image data" }, { status: 400 });
    }
    const imageBuffer = Buffer.from(base64Data, "base64");

    const result = await generateText({
      model: google("gemini-2.0-flash-lite"),
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
              text: `Does this image contain LEGO bricks or a structure built from LEGO pieces?

Reply ONLY with this exact JSON, nothing else:
{"isLego": true} or {"isLego": false}

Say true ONLY if you can clearly see LEGO bricks, LEGO base plates, or plastic building blocks with visible studs. Say false for everything else including random objects, people, screens, text, drawings, or anything that is not physical LEGO.`,
            },
          ],
        },
      ],
    });

    console.log("Gemini response:", result.text);

    // Parse the response
    let isLego = false;
    try {
      const cleaned = result.text.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      isLego = parsed.isLego === true;
    } catch {
      const lower = result.text.toLowerCase();
      isLego = lower.includes('"islego": true') || lower.includes('"islego":true');
    }

    return NextResponse.json({ isLego });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("LEGO detection error:", errMsg);
    // On quota/billing errors, allow upload so the game isn't blocked
    if (errMsg.includes("quota") || errMsg.includes("billing") || errMsg.includes("rate")) {
      return NextResponse.json({ isLego: true, skipped: true, error: "Detection quota exceeded. Upload allowed." });
    }
    return NextResponse.json({ isLego: false, error: errMsg });
  }
}
