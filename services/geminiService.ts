import { GoogleGenAI, Type } from "@google/genai";
import { ReferenceImage, ImageSize, SlideContent } from "../types";
import {
  DEFAULT_CHARACTER_PROMPT,
  MODEL_NAME,
  TEXT_MODEL_NAME,
  STORYBOARD_SYSTEM_INSTRUCTION,
} from "./constants";

export async function generateSlideshowStructure(
  topic: string
): Promise<SlideContent[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("KEY_NOT_FOUND");
  }
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: TEXT_MODEL_NAME,
    contents: `Create a 6-7 slide storyboard for the topic: "${topic}".

Return an array where:
- Slide 1 is a title/cover slide.
- Slides 2 to N-1 are informative slides with 2-3 engaging lines.
- The last slide is a CTA that explicitly invites the viewer to "Download Lifestack" to manage the topic.
- Every object must include a short illustration prompt focusing only on scene, pose, props, and emotion (never describe physical traits or outfits).`,
    config: {
      systemInstruction: STORYBOARD_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            prompt: {
              type: Type.STRING,
              description:
                "Illustration prompt for the boy in the orange shirt.",
            },
          },
          required: ["title", "description", "prompt"],
        },
      },
    },
  });

  try {
    const parsedSlides: SlideContent[] = JSON.parse(response.text || "[]");
    const normalized = normalizeSlides(topic, parsedSlides);
    return normalized.length ? normalized : buildFallbackSlides(topic);
  } catch (e) {
    console.error("Failed to parse storyboard JSON", e);
    return buildFallbackSlides(topic);
  }
}

export async function generateCharacterScene(
  prompt: string,
  references: ReferenceImage[],
  size: ImageSize
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("KEY_NOT_FOUND");
  }
  const ai = new GoogleGenAI({ apiKey });

  const referenceParts = references.map((ref) => ({
    inlineData: {
      data: ref.data.split(",")[1],
      mimeType: ref.mimeType,
    },
  }));

  const fullPrompt = `
${DEFAULT_CHARACTER_PROMPT}

### Current Scene to Illustrate:
${prompt}
  `.trim();

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [...referenceParts, { text: fullPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: size,
        },
      },
    });

    let imageUrl = "";
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!imageUrl) {
      throw new Error("No image data returned from API");
    }

    return imageUrl;
  } catch (error: any) {
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("KEY_NOT_FOUND");
    }
    throw error;
  }
}

function normalizeSlides(
  topic: string,
  slides: SlideContent[]
): SlideContent[] {
  if (!slides.length) return [];

  const cleaned = slides
    .map((slide) => ({
      title: (slide.title || "").trim(),
      description: (slide.description || "").trim(),
      prompt: (slide.prompt || "").trim(),
    }))
    .filter((slide) => slide.title || slide.description || slide.prompt);

  if (!cleaned.length) return [];

  // Ensure the first slide acts as a cover/title slide
  cleaned[0] = {
    title: cleaned[0].title || topic,
    description: "",
    prompt:
      cleaned[0].prompt ||
      `The boy welcomes viewers to a slideshow about ${topic}, pointing to a big title card.`,
  };

  const hasCTA = cleaned.some((slide) =>
    /download\s+lifestack/i.test(slide.description)
  );

  if (!hasCTA) {
    cleaned.push(createCtaSlide(topic));
  }

  if (cleaned.length < 3) {
    return [];
  }

  // Limit to a max of 7 slides to keep the flow concise
  return cleaned.slice(0, 7);
}

function buildFallbackSlides(topic: string): SlideContent[] {
  const safeTopic = topic.trim() || "your topic";

  return [
    {
      title: `Introduction to ${safeTopic}`,
      description: "",
      prompt: `The boy stands beside a clean title card introducing ${safeTopic}, looking confident and inviting.`,
    },
    {
      title: `${safeTopic} basics`,
      description: `A simple overview of what ${safeTopic} means and why it matters in everyday life.`,
      prompt: `The boy gestures to minimal icons representing ${safeTopic}, smiling warmly.`,
    },
    {
      title: `Why ${safeTopic} matters`,
      description: `Two friendly lines on the benefits and positive outcomes of embracing ${safeTopic}.`,
      prompt: `The boy points to a short checklist on a board highlighting benefits of ${safeTopic}.`,
    },
    {
      title: `How to start with ${safeTopic}`,
      description: `Clear starter steps to try ${safeTopic} today, keeping it lightweight and doable.`,
      prompt: `The boy follows a simple three-step path labeled with quick wins related to ${safeTopic}.`,
    },
    {
      title: `Keep your momentum`,
      description: `Encouragement and tips to stay consistent with ${safeTopic} over time.`,
      prompt: `The boy marks progress on a small calendar with bright stickers tied to ${safeTopic}.`,
    },
    createCtaSlide(safeTopic),
  ];
}

function createCtaSlide(topic: string): SlideContent {
  return {
    title: "Ready to take action?",
    description: `Download Lifestack to stay on track with ${topic}. Plan steps, stay accountable, and keep the momentum going.`,
    prompt: "",
  };
}
