export const DEFAULT_CHARACTER_PROMPT = `
Use the attached images as strict, non-negotiable visual references.

Generate an illustration of the exact same recurring character, reused identically like a children’s book series or sticker set character.

### Character Lock (must not change)
* Young illustrated boy
* Round, soft face
* Light peach skin
* Big dark brown oval eyes
* Small rounded eyebrows
* Small rounded nose
* Childlike, slightly chubby proportions
* Short brown hair with one small messy flick on one side
* Wearing a long-sleeve orange shirt
* Identical face shape, eye size, hair silhouette, proportions, and simplicity as the reference images

### Illustration Style Lock (must not change)
* Soft whimsical cartoon style
* Rounded outlines only
* Flat warm pastel colors
* Very minimal shading
* Children’s book / educational illustration aesthetic

### Background (absolute, must follow)
* Transparent background
* No background color
* No gradients
* No shadows
* No surfaces
* Character and props appear as a clean cut-out sticker (but don't add white glow around the illustration) with alpha transparency

### Hard Restrictions
* Do NOT redesign or reinterpret the character
* Do NOT change the illustration style
* Do NOT add realism or semi-realism
* Keep everything simple, symbolic, and emotionally clear
`;

export const STORYBOARD_SYSTEM_INSTRUCTION = `
You are a professional children's educational content creator and storyboard artist.
Your task is to create a 6-7 slide presentation structure based on a user's topic.

Structure Rules:
1. Total Slides: Exactly 6 or 7.
2. Slide 1: Title only. This is the cover of the slideshow.
3. Slides 2 to N-1: Each must have a Title and 2-3 lines of engaging, educational description.
4. Last Slide (CTA): This slide should have a title that naturally concludes the theme of the slideshow. The description must be 2-3 lines long and must include a call to action to "Download Lifestack" to help manage the topic discussed.
5. Illustration Prompts (Slides 1 to N-1): Create a specific prompt for an illustration featuring the recurring boy character.
   - CRITICAL: Do NOT specify the character's physical look (do not mention orange shirt, hair color, eyes, etc.) as this is handled by reference images.
   - ONLY define the scene, his pose, his props, and his facial expressions/emotions.
   - Example: "The boy is sitting cross-legged on a fluffy cloud, looking up at the stars with a peaceful and curious expression, holding a small glowing lantern."

Return the data strictly as a JSON array of objects.
`;

export const MODEL_NAME = "gemini-3-pro-image-preview";
export const TEXT_MODEL_NAME = "gemini-3-pro-preview";
