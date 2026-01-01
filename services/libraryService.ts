import { getSupabaseClient } from "./supabaseClient";
import { PromptLibraryInsert, ReferenceLibraryInsert } from "../database.types";
import { PromptPreset, ReferenceImage, ReferenceLibraryItem } from "../types";

const DEFAULT_REFERENCE_LABEL = "Saved reference";
const DEFAULT_PROMPT_TITLE = "Saved prompt";

export async function saveReferenceImages(
  userId: string,
  references: ReferenceImage[],
  label?: string
): Promise<void> {
  if (!references.length) return;

  const supabase = getSupabaseClient();
  const baseLabel = label?.trim() || DEFAULT_REFERENCE_LABEL;

  const payload: ReferenceLibraryInsert[] = references.map((ref, idx) => ({
    user_id: userId,
    label: references.length > 1 ? `${baseLabel} #${idx + 1}` : baseLabel,
    data: ref.data,
    mime_type: ref.mimeType,
  }));

  const { error } = await supabase.from("reference_library").insert(payload);
  if (error) {
    throw error;
  }
}

export async function fetchReferenceLibrary(
  userId: string
): Promise<ReferenceLibraryItem[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("reference_library")
    .select("id, label, data, mime_type, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (
    data?.map((item) => {
      // Ensure data has the proper data URL prefix
      let imageData = item.data;
      if (!imageData.startsWith("data:")) {
        // If data doesn't have prefix, add it
        imageData = `data:${item.mime_type};base64,${imageData}`;
      }

      return {
        id: item.id,
        label: item.label,
        data: imageData,
        mimeType: item.mime_type,
        createdAt: item.created_at,
      };
    }) ?? []
  );
}

export async function savePromptPreset(
  userId: string,
  promptText: string,
  title?: string
): Promise<PromptPreset> {
  const supabase = getSupabaseClient();
  const name = title?.trim() || DEFAULT_PROMPT_TITLE;
  const payload: PromptLibraryInsert = {
    user_id: userId,
    title: name,
    prompt_text: promptText,
  };

  const { data, error } = await supabase
    .from("prompt_library")
    .insert(payload)
    .select("id, title, prompt_text, created_at")
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    title: data.title,
    content: data.prompt_text,
    createdAt: data.created_at,
  };
}

export async function fetchPromptLibrary(
  userId: string
): Promise<PromptPreset[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("prompt_library")
    .select("id, title, prompt_text, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (
    data?.map((item) => ({
      id: item.id,
      title: item.title,
      content: item.prompt_text,
      createdAt: item.created_at,
    })) ?? []
  );
}
