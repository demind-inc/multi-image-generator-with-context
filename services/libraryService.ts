import { getSupabaseClient } from "./supabaseClient";
import { PromptLibraryInsert, ReferenceLibraryInsert } from "../database.types";
import {
  PromptPreset,
  ReferenceImage,
  ReferenceLibraryItem,
  ReferenceSet,
} from "../types";

const DEFAULT_REFERENCE_LABEL = "Saved reference";
const DEFAULT_PROMPT_TITLE = "Saved prompt";
const STORAGE_BUCKET = "reference-images";

// Helper to convert base64 data URL to Blob
const dataURLtoBlob = (dataURL: string): Blob => {
  const arr = dataURL.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/png";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

export async function saveReferenceImages(
  userId: string,
  references: ReferenceImage[],
  label?: string
): Promise<void> {
  if (!references.length) return;

  const supabase = getSupabaseClient();
  const baseLabel = label?.trim() || DEFAULT_REFERENCE_LABEL;
  // Generate a set_id to group all images together
  const setId = crypto.randomUUID();

  // Upload images to Supabase Storage
  const uploadPromises = references.map(async (ref, index) => {
    const fileExtension = ref.mimeType.split("/")[1] || "png";
    const fileName = `${userId}/${setId}/${index}.${fileExtension}`;
    const blob = dataURLtoBlob(ref.data);

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, blob, {
        contentType: ref.mimeType,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    return {
      user_id: userId,
      set_id: setId,
      label: baseLabel,
      file_path: fileName,
      mime_type: ref.mimeType,
    };
  });

  const payload = await Promise.all(uploadPromises);

  // Save metadata to database
  const { error } = await supabase
    .from("reference_library")
    .insert(payload as any);
  if (error) {
    throw error;
  }
}

export async function fetchReferenceLibrary(
  userId: string
): Promise<ReferenceSet[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("reference_library")
    .select("id, set_id, label, file_path, mime_type, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Group images by set_id
  const setsMap = new Map<string, ReferenceSet>();

  // Generate signed URLs for all images (private bucket requires signed URLs)
  // Signed URLs expire after 1 hour (3600 seconds)
  const signedUrlPromises = (data as any[]).map(async (item) => {
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(item.file_path, 3600); // 1 hour expiration

    if (urlError) {
      console.error(
        "Failed to create signed URL for file:",
        item.file_path,
        urlError
      );
      return { item, signedUrl: null };
    }

    return {
      item,
      signedUrl: signedUrlData?.signedUrl || null,
    };
  });

  const urlResults = await Promise.all(signedUrlPromises);

  for (const { item, signedUrl } of urlResults) {
    if (!signedUrl) {
      console.error("Skipping item due to missing signed URL:", item.file_path);
      continue;
    }

    const libraryItem: ReferenceLibraryItem = {
      id: item.id,
      setId: item.set_id,
      label: item.label,
      url: signedUrl,
      mimeType: item.mime_type,
      createdAt: item.created_at,
    };

    if (!setsMap.has(item.set_id)) {
      setsMap.set(item.set_id, {
        setId: item.set_id,
        label: item.label,
        images: [],
        createdAt: item.created_at,
      });
    }

    setsMap.get(item.set_id)!.images.push(libraryItem);
  }

  // Convert map to array and sort by creation date (most recent first)
  return Array.from(setsMap.values()).sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });
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
    .insert(payload as any)
    .select("id, title, prompt_text, created_at")
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Failed to create prompt preset");
  }

  const row = data as any;
  return {
    id: row.id,
    title: row.title,
    content: row.prompt_text,
    createdAt: row.created_at,
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
    (data as any[])?.map((item: any) => ({
      id: item.id,
      title: item.title,
      content: item.prompt_text,
      createdAt: item.created_at,
    })) ?? []
  );
}

export async function updatePromptPreset(
  userId: string,
  presetId: string,
  title: string,
  content: string
): Promise<PromptPreset> {
  const supabase = getSupabaseClient();
  const trimmedTitle = title.trim() || DEFAULT_PROMPT_TITLE;
  const { data, error } = await (supabase.from("prompt_library") as any)
    .update({
      title: trimmedTitle,
      prompt_text: content,
    } as Partial<PromptLibraryInsert>)
    .eq("id", presetId)
    .eq("user_id", userId)
    .select("id, title, prompt_text, created_at")
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Failed to update prompt preset");
  }

  const row = data as any;
  return {
    id: row.id,
    title: row.title,
    content: row.prompt_text,
    createdAt: row.created_at,
  };
}

export async function updateReferenceSetLabel(
  userId: string,
  setId: string,
  label: string
): Promise<void> {
  const supabase = getSupabaseClient();
  const trimmedLabel = label.trim() || DEFAULT_REFERENCE_LABEL;
  const { error } = await (supabase.from("reference_library") as any)
    .update({ label: trimmedLabel } as Partial<ReferenceLibraryInsert>)
    .eq("set_id", setId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}
