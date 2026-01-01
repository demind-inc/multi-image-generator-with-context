export type ImageSize = "1K" | "2K" | "4K";
export type AppMode = "slideshow" | "manual";
export type AuthStatus = "checking" | "signed_out" | "signed_in";

export interface SlideContent {
  title: string;
  description: string;
  prompt: string;
}

export interface SceneResult {
  prompt: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  isLoading: boolean;
  error?: string;
  isCTA?: boolean;
}

export interface ReferenceImage {
  id: string;
  data: string; // base64
  mimeType: string;
}

export interface ReferenceLibraryItem {
  id: string;
  label: string | null;
  data: string;
  mimeType: string;
  createdAt?: string | null;
}

export interface PromptPreset {
  id: string;
  title: string;
  content: string;
  createdAt?: string | null;
}

export interface AccountProfile {
  id: string;
  email: string | null;
  full_name?: string | null;
  last_sign_in_at?: string | null;
  created_at?: string | null;
}

export interface DailyUsage {
  userId: string;
  usageDate: string;
  used: number;
  dailyLimit: number;
  remaining: number;
}
