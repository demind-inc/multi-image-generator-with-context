import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppMode,
  DailyUsage,
  ImageSize,
  ReferenceImage,
  SceneResult,
} from "../types";
import {
  generateCharacterScene,
  generateSlideshowStructure,
} from "../services/geminiService";
import { useAuth } from "../providers/AuthProvider";
import {
  DEFAULT_DAILY_LIMIT,
  getDailyUsage,
  recordGeneration,
} from "../services/usageService";
import AppHeader from "../components/AppHeader/AppHeader";
import Hero from "../components/Hero/Hero";
import Sidebar from "../components/Sidebar/Sidebar";
import Results from "../components/Results/Results";
import Footer from "../components/Footer/Footer";

const DashboardPage: React.FC = () => {
  const { session, authStatus, displayEmail, signOut } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<AppMode>("slideshow");
  const [topic, setTopic] = useState<string>("");
  const [manualPrompts, setManualPrompts] = useState<string>(
    "Boy looking confused with question marks around him\nBoy feeling lonely at a cafe table\nBoy looking angry while listening to something"
  );
  const [references, setReferences] = useState<ReferenceImage[]>([]);
  const [slideshowResults, setSlideshowResults] = useState<SceneResult[]>([]);
  const [manualResults, setManualResults] = useState<SceneResult[]>([]);
  const [size, setSize] = useState<ImageSize>("1K");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingStoryboard, setIsCreatingStoryboard] = useState(false);
  const [usage, setUsage] = useState<DailyUsage | null>(null);
  const [isUsageLoading, setIsUsageLoading] = useState(false);
  const [usageError, setUsageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect to auth page if not authenticated
  useEffect(() => {
    if (authStatus === "signed_out") {
      navigate("/auth", { replace: true });
    }
  }, [authStatus, navigate]);

  useEffect(() => {
    const userId = session?.user?.id;
    if (authStatus === "signed_in" && userId) {
      refreshUsage(userId);
    }
  }, [authStatus, session?.user?.id]);

  // Show loading state while checking auth
  if (authStatus === "checking") {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <p>Checking your session...</p>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (authStatus !== "signed_in") {
    return null;
  }

  const results = mode === "slideshow" ? slideshowResults : manualResults;
  const generatedCount = results.filter((item) => item.imageUrl).length;
  const totalScenes = results.length;
  const disableGenerate =
    isGenerating ||
    references.length === 0 ||
    (!!usage && usage.remaining <= 0) ||
    !!usageError;
  const displayUsageLimit = usage?.dailyLimit ?? DEFAULT_DAILY_LIMIT;
  const displayUsageRemaining = usage?.remaining ?? DEFAULT_DAILY_LIMIT;

  const triggerUpload = () => fileInputRef.current?.click();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferences((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substr(2, 9),
            data: reader.result as string,
            mimeType: file.type,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeReference = (id: string) => {
    setReferences((prev) => prev.filter((r) => r.id !== id));
  };

  const refreshUsage = async (userId: string) => {
    setIsUsageLoading(true);
    try {
      const stats = await getDailyUsage(userId);
      setUsage(stats);
      setUsageError(null);
    } catch (error) {
      console.error("Usage fetch error:", error);
      setUsageError("Unable to load daily limit.");
    } finally {
      setIsUsageLoading(false);
    }
  };

  const handleGenerateStoryboard = async () => {
    if (!topic.trim()) {
      alert("Please enter a topic first.");
      return;
    }
    setIsCreatingStoryboard(true);
    try {
      const slides = await generateSlideshowStructure(topic);
      if (slides.length > 0) {
        const newResults: SceneResult[] = slides.map((slide, idx) => ({
          title: slide.title,
          description: slide.description,
          prompt: slide.prompt,
          isLoading: false,
          isCTA: idx === slides.length - 1,
        }));
        setSlideshowResults(newResults);
      }
    } catch (error) {
      console.error("Storyboard error:", error);
      alert("Failed to generate storyboard. Check your connection/key.");
    } finally {
      setIsCreatingStoryboard(false);
    }
  };

  const handleRegenerate = async (index: number) => {
    if (references.length === 0) {
      alert(
        "Please upload at least one reference image for character consistency."
      );
      return;
    }

    const userId = session?.user?.id;
    if (!userId) {
      alert("Unable to verify your account. Please sign in again.");
      return;
    }

    const setter =
      mode === "slideshow" ? setSlideshowResults : setManualResults;
    const currentList = mode === "slideshow" ? slideshowResults : manualResults;
    const targetResult = currentList[index];

    if (!targetResult || targetResult.isCTA) return;

    setter((prev) =>
      prev.map((res, idx) =>
        idx === index ? { ...res, isLoading: true, error: undefined } : res
      )
    );

    let latestUsage: DailyUsage | null = usage;
    try {
      latestUsage = await getDailyUsage(userId);
      setUsage(latestUsage);
      setUsageError(null);
    } catch (error) {
      console.error("Usage check error:", error);
      setter((prev) =>
        prev.map((res, idx) =>
          idx === index
            ? {
                ...res,
                isLoading: false,
                error: "Unable to check usage limit.",
              }
            : res
        )
      );
      return;
    }

    if (latestUsage && latestUsage.remaining <= 0) {
      setter((prev) =>
        prev.map((res, idx) =>
          idx === index
            ? {
                ...res,
                isLoading: false,
                error: "Daily limit reached.",
              }
            : res
        )
      );
      alert("Daily limit reached. Please try again tomorrow.");
      return;
    }

    try {
      const imageUrl = await generateCharacterScene(
        targetResult.prompt,
        references,
        size
      );
      const updatedUsage = await recordGeneration(userId);
      setUsage(updatedUsage);
      setter((prev) =>
        prev.map((res, idx) =>
          idx === index ? { ...res, imageUrl, isLoading: false } : res
        )
      );
    } catch (error: any) {
      console.error("Regeneration error:", error);
      if (error?.message === "DAILY_LIMIT_REACHED") {
        await refreshUsage(userId);
        alert("Daily limit reached. Please try again tomorrow.");
      }
      setter((prev) =>
        prev.map((res, idx) =>
          idx === index
            ? {
                ...res,
                error: error.message || "Generation failed",
                isLoading: false,
              }
            : res
        )
      );
    }
  };

  const startGeneration = async () => {
    if (references.length === 0) {
      alert(
        "Please upload at least one reference image for character consistency."
      );
      return;
    }

    const userId = session?.user?.id;
    if (!userId) {
      alert("Unable to verify your account. Please sign in again.");
      return;
    }

    let promptList: string[] = [];
    let scenesToGenerate = 0;

    if (mode === "manual") {
      promptList = manualPrompts.split("\n").filter((p) => p.trim() !== "");
      if (promptList.length === 0) {
        alert("Please enter some manual prompts.");
        return;
      }

      scenesToGenerate = promptList.length;
    } else {
      if (slideshowResults.length === 0) {
        alert("Please create a storyboard first.");
        return;
      }

      scenesToGenerate = slideshowResults.filter(
        (res) => !res.isCTA && !res.imageUrl
      ).length;

      if (scenesToGenerate === 0) {
        alert("All scenes are already generated.");
        return;
      }
    }

    setIsGenerating(true);

    let latestUsage: DailyUsage | null = usage;

    try {
      latestUsage = await getDailyUsage(userId);
      setUsage(latestUsage);
      setUsageError(null);
    } catch (error) {
      console.error("Usage check error:", error);
      setUsageError("Unable to load daily limit.");
      alert("Unable to check your daily limit. Please try again.");
      setIsGenerating(false);
      return;
    }

    if (latestUsage && scenesToGenerate > latestUsage.remaining) {
      alert(
        `You can generate ${latestUsage.remaining} more image${
          latestUsage.remaining === 1 ? "" : "s"
        } today (limit ${latestUsage.dailyLimit}).`
      );
      setIsGenerating(false);
      return;
    }

    if (mode === "manual") {
      const initialManualResults = promptList.map(
        (p) => ({ prompt: p, isLoading: true } as SceneResult)
      );
      setManualResults(initialManualResults);

      for (let i = 0; i < initialManualResults.length; i++) {
        try {
          const imageUrl = await generateCharacterScene(
            promptList[i],
            references,
            size
          );
          const updatedUsage = await recordGeneration(userId);
          setUsage(updatedUsage);
          setManualResults((prev) =>
            prev.map((res, idx) =>
              idx === i ? { ...res, imageUrl, isLoading: false } : res
            )
          );
        } catch (error: any) {
          console.error("Manual generation error:", error);
          if (error?.message === "DAILY_LIMIT_REACHED") {
            await refreshUsage(userId);
            alert("Daily limit reached. Please try again tomorrow.");
            break;
          }
          setManualResults((prev) =>
            prev.map((res, idx) =>
              idx === i
                ? { ...res, error: error.message, isLoading: false }
                : res
            )
          );
        }
      }
    } else {
      setSlideshowResults((prev) =>
        prev.map((res) => ({ ...res, isLoading: !res.isCTA && !res.imageUrl }))
      );

      for (let i = 0; i < slideshowResults.length; i++) {
        const currentRes = slideshowResults[i];
        if (currentRes.isCTA || currentRes.imageUrl) continue;

        try {
          const imageUrl = await generateCharacterScene(
            currentRes.prompt,
            references,
            size
          );
          const updatedUsage = await recordGeneration(userId);
          setUsage(updatedUsage);
          setSlideshowResults((prev) =>
            prev.map((res, idx) =>
              idx === i ? { ...res, imageUrl, isLoading: false } : res
            )
          );
        } catch (error: any) {
          console.error("Slideshow generation error:", error);
          if (error?.message === "DAILY_LIMIT_REACHED") {
            await refreshUsage(userId);
            alert("Daily limit reached. Please try again tomorrow.");
            break;
          }
          setSlideshowResults((prev) =>
            prev.map((res, idx) =>
              idx === i
                ? { ...res, error: error.message, isLoading: false }
                : res
            )
          );
        }
      }
    }

    setIsGenerating(false);
  };

  return (
    <div className="app">
      <div className="app__background">
        <span className="app__orb app__orb--left" />
        <span className="app__orb app__orb--right" />
      </div>

      <AppHeader
        mode={mode}
        onModeChange={setMode}
        displayEmail={displayEmail}
        onSignOut={signOut}
        referencesCount={references.length}
        totalScenes={totalScenes}
        size={size}
        onSizeChange={setSize}
        isGenerating={isGenerating}
        onGenerate={startGeneration}
        disableGenerate={disableGenerate}
        usageRemaining={displayUsageRemaining}
        usageLimit={displayUsageLimit}
        isUsageLoading={isUsageLoading}
      />

      <main className="app__body">
        <Hero
          referencesCount={references.length}
          generatedCount={generatedCount}
          size={size}
          mode={mode}
          isGenerating={isGenerating}
          disableGenerate={disableGenerate}
          onUploadClick={triggerUpload}
          onGenerate={startGeneration}
          usageRemaining={displayUsageRemaining}
          usageLimit={displayUsageLimit}
          isUsageLoading={isUsageLoading}
        />

        <div className="app__content">
          <Sidebar
            mode={mode}
            references={references}
            fileInputRef={fileInputRef}
            onUploadClick={triggerUpload}
            onFileChange={handleFileUpload}
            onRemoveReference={removeReference}
            topic={topic}
            onTopicChange={setTopic}
            onGenerateStoryboard={handleGenerateStoryboard}
            isCreatingStoryboard={isCreatingStoryboard}
            manualPrompts={manualPrompts}
            onManualPromptsChange={setManualPrompts}
          />

          <Results
            mode={mode}
            results={results}
            isGenerating={isGenerating}
            onRegenerate={handleRegenerate}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DashboardPage;
