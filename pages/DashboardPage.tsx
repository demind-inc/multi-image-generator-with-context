import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppMode,
  ImageSize,
  MonthlyUsage,
  SubscriptionPlan,
  PromptPreset,
  ReferenceImage,
  ReferenceSet,
  SceneResult,
} from "../types";
import {
  generateCharacterScene,
  generateSlideshowStructure,
} from "../services/geminiService";
import { useAuth } from "../providers/AuthProvider";
import {
  DEFAULT_MONTHLY_CREDITS,
  PLAN_CREDITS,
  getMonthlyUsage,
  recordGeneration,
} from "../services/usageService";
import {
  getSubscription,
  activateSubscription,
  deactivateSubscription,
  cancelStripeSubscription,
} from "../services/subscriptionService";
import {
  getHasGeneratedFreeImage,
  setHasGeneratedFreeImage,
} from "../services/authService";
import {
  fetchPromptLibrary,
  fetchReferenceLibrary,
  savePromptPreset,
  saveReferenceImages,
} from "../services/libraryService";
import PaymentModal from "../components/PaymentModal/PaymentModal";
import Sidebar, { PanelKey } from "../components/Sidebar/Sidebar";
import Results from "../components/Results/Results";
import Footer from "../components/Footer/Footer";
import ReferenceLibraryModal from "../components/DatasetModal/ReferenceLibraryModal";
import PromptLibraryModal from "../components/DatasetModal/PromptLibraryModal";

const DashboardPage: React.FC = () => {
  const { session, authStatus, displayEmail, signOut } = useAuth();
  const navigate = useNavigate();

  const FREE_CREDIT_CAP = 3;
  const PLAN_PRICE_LABEL: Record<SubscriptionPlan, string> = {
    basic: "$9/mo",
    pro: "$29/mo",
    business: "$79/mo",
  };

  const [mode, setMode] = useState<AppMode>("slideshow");
  const [topic, setTopic] = useState<string>("");
  const [manualPrompts, setManualPrompts] = useState<string>(
    "Boy looking confused with question marks around him\nBoy feeling lonely at a cafe table\nBoy looking angry while listening to something"
  );
  const [references, setReferences] = useState<ReferenceImage[]>([]);
  const [referenceLibrary, setReferenceLibrary] = useState<ReferenceSet[]>([]);
  const [promptLibrary, setPromptLibrary] = useState<PromptPreset[]>([]);
  const [isReferenceLibraryOpen, setIsReferenceLibraryOpen] = useState(false);
  const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);
  const [isSavingReferences, setIsSavingReferences] = useState(false);
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [isLibraryLoading, setIsLibraryLoading] = useState(false);
  const [slideshowResults, setSlideshowResults] = useState<SceneResult[]>([]);
  const [manualResults, setManualResults] = useState<SceneResult[]>([]);
  const [size, setSize] = useState<ImageSize>("1K");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingStoryboard, setIsCreatingStoryboard] = useState(false);
  const [usage, setUsage] = useState<MonthlyUsage | null>(null);
  const [isUsageLoading, setIsUsageLoading] = useState(false);
  const [usageError, setUsageError] = useState<string | null>(null);
  const [hasGeneratedFreeImage, setHasGeneratedFreeImage] =
    useState<boolean>(false);
  const [isFreeImageLoading, setIsFreeImageLoading] = useState(false);
  const [isPaymentUnlocked, setIsPaymentUnlocked] = useState<boolean>(false);
  const [planType, setPlanType] = useState<SubscriptionPlan>("basic");
  const [planLockedFromSubscription, setPlanLockedFromSubscription] =
    useState(false);
  const [stripeSubscriptionId, setStripeSubscriptionId] = useState<
    string | null | undefined
  >(null);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<PanelKey>("storyboard");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stripePlanLinks: Partial<Record<SubscriptionPlan, string>> = {
    basic: import.meta.env.STRIPE_LINK_BASIC || process.env.STRIPE_LINK_BASIC,
    pro: import.meta.env.STRIPE_LINK_PRO || process.env.STRIPE_LINK_PRO,
    business:
      import.meta.env.STRIPE_LINK_BUSINESS || process.env.STRIPE_LINK_BUSINESS,
  };

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
      refreshSubscription(userId);
      refreshHasGeneratedFreeImage(userId);
      loadLibraries(userId);
    }
  }, [authStatus, session?.user?.id]);

  useEffect(() => {
    const userId = session?.user?.id;
    if (authStatus === "signed_in" && userId) {
      refreshUsage(userId);
    }
  }, [planType]);

  const refreshHasGeneratedFreeImage = async (userId: string) => {
    setIsFreeImageLoading(true);
    try {
      const hasGenerated = await getHasGeneratedFreeImage(userId);
      setHasGeneratedFreeImage(hasGenerated);
    } catch (error) {
      console.error("Failed to fetch has_generated_free_image:", error);
      setHasGeneratedFreeImage(false);
    } finally {
      setIsFreeImageLoading(false);
    }
  };

  const loadLibraries = async (userId: string) => {
    setIsLibraryLoading(true);
    try {
      const [refs, prompts] = await Promise.all([
        fetchReferenceLibrary(userId),
        fetchPromptLibrary(userId),
      ]);
      setReferenceLibrary(refs);
      setPromptLibrary(prompts);
    } catch (error) {
      console.error("Failed to load saved datasets:", error);
    } finally {
      setIsLibraryLoading(false);
    }
  };

  const refreshReferenceLibrary = async (userId: string) => {
    try {
      const refs = await fetchReferenceLibrary(userId);
      setReferenceLibrary(refs);
    } catch (error) {
      console.error("Failed to refresh reference library:", error);
    }
  };

  const refreshPromptLibrary = async (userId: string) => {
    try {
      const prompts = await fetchPromptLibrary(userId);
      setPromptLibrary(prompts);
    } catch (error) {
      console.error("Failed to refresh prompt library:", error);
    }
  };

  const refreshSubscription = async (userId: string) => {
    setIsSubscriptionLoading(true);
    try {
      const subscription = await getSubscription(userId);
      setIsPaymentUnlocked(subscription?.isActive ?? false);
      if (subscription?.planType) {
        setPlanType(subscription.planType);
        setPlanLockedFromSubscription(true);
      } else {
        setPlanLockedFromSubscription(false);
      }
      setStripeSubscriptionId(subscription?.stripeSubscriptionId);
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
      setIsPaymentUnlocked(false);
      setPlanLockedFromSubscription(false);
      setStripeSubscriptionId(null);
    } finally {
      setIsSubscriptionLoading(false);
    }
  };

  useEffect(() => {
    if (planLockedFromSubscription) return;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const urlPlan = params.get("plan");
    const storedPlan = window.localStorage.getItem(
      "preferred_plan"
    ) as SubscriptionPlan | null;

    if (urlPlan && ["basic", "pro", "business"].includes(urlPlan)) {
      setPlanType(urlPlan as SubscriptionPlan);
    } else if (
      storedPlan &&
      ["basic", "pro", "business"].includes(storedPlan)
    ) {
      setPlanType(storedPlan as SubscriptionPlan);
    }
  }, [authStatus, planLockedFromSubscription]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("preferred_plan", planType);
  }, [planType]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      isPaymentUnlocked ||
      !session?.user?.id
    )
      return;
    const params = new URLSearchParams(window.location.search);
    const paidFlag =
      params.get("paid") === "1" ||
      params.get("paid") === "true" ||
      params.get("session_id");
    const openPaymentFlag =
      params.get("openPayment") === "1" || params.get("openPayment") === "true";

    if (paidFlag) {
      const activateSubscriptionStatus = async () => {
        try {
          await activateSubscription(session.user.id, planType);
          setIsPaymentUnlocked(true);
          params.delete("paid");
          params.delete("session_id");
          const newSearch = params.toString();
          const newUrl = `${window.location.pathname}${
            newSearch ? `?${newSearch}` : ""
          }`;
          window.history.replaceState(null, "", newUrl);
        } catch (error) {
          console.error("Failed to activate subscription:", error);
        }
      };
      activateSubscriptionStatus();
    }

    if (openPaymentFlag && !isPaymentUnlocked) {
      setIsPaymentModalOpen(true);
      params.delete("openPayment");
      const newSearch = params.toString();
      const newUrl = `${window.location.pathname}${
        newSearch ? `?${newSearch}` : ""
      }`;
      window.history.replaceState(null, "", newUrl);
    }
  }, [isPaymentUnlocked, session?.user?.id, planType]);

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
  const hasSubscription = isPaymentUnlocked;
  const usedCredits = usage?.used ?? 0;
  const freeCreditsRemaining = Math.max(FREE_CREDIT_CAP - usedCredits, 0);
  const disableGenerate =
    isGenerating ||
    references.length === 0 ||
    (!!usage && usage.remaining <= 0) ||
    !!usageError;
  const planCreditLimit = PLAN_CREDITS[planType] ?? DEFAULT_MONTHLY_CREDITS;
  const displayUsageLimit = hasSubscription
    ? usage?.monthlyLimit ?? planCreditLimit
    : undefined;
  const displayUsageRemaining = hasSubscription
    ? usage?.remaining ?? planCreditLimit
    : undefined;

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

  const handleSaveReferences = async () => {
    const userId = session?.user?.id;
    if (!userId) {
      alert("Unable to verify your account. Please sign in again.");
      return;
    }

    if (references.length === 0) {
      alert("Upload a reference image first.");
      return;
    }

    const label =
      window.prompt(
        "Name this reference set",
        `Reference set (${new Date().toLocaleDateString()})`
      ) || undefined;

    setIsSavingReferences(true);
    try {
      await saveReferenceImages(userId, references, label);
      await refreshReferenceLibrary(userId);
    } catch (error) {
      console.error("Failed to save references:", error);
      alert("Could not save references. Please try again.");
    } finally {
      setIsSavingReferences(false);
    }
  };

  const handleAddReferencesFromLibrary = async (sets: ReferenceSet[]) => {
    if (!sets.length) return;
    // Flatten all images from selected sets
    const allImages = sets.flatMap((set) => set.images);

    // Convert URLs to base64 data URLs for ReferenceImage (needed for Gemini API)
    const mapped = await Promise.all(
      allImages.map(async (item): Promise<ReferenceImage> => {
        try {
          const response = await fetch(item.url);
          const blob = await response.blob();
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve({
                id: Math.random().toString(36).substring(2, 9),
                data: reader.result as string,
                mimeType: item.mimeType,
              });
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          console.error("Failed to load image from storage:", error);
          throw error;
        }
      })
    );

    setReferences((prev) => [...prev, ...mapped]);
  };

  const handleSavePromptPreset = async () => {
    const userId = session?.user?.id;
    const content = manualPrompts.trim();

    if (!userId) {
      alert("Unable to verify your account. Please sign in again.");
      return;
    }

    if (!content) {
      alert("Please add a prompt before saving.");
      return;
    }

    const title =
      window.prompt(
        "Name this prompt preset",
        `Prompt preset (${new Date().toLocaleDateString()})`
      ) || undefined;

    setIsSavingPrompt(true);
    try {
      const saved = await savePromptPreset(userId, content, title);
      setPromptLibrary((prev) => [saved, ...prev]);
    } catch (error) {
      console.error("Failed to save prompt preset:", error);
      alert("Could not save prompt preset. Please try again.");
    } finally {
      setIsSavingPrompt(false);
    }
  };

  const handleUsePromptPreset = (preset: PromptPreset) => {
    setManualPrompts(preset.content);
  };

  const openPaymentModal = () => {
    setIsPaymentModalOpen(true);
  };

  const markFirstGenerationComplete = async () => {
    const userId = session?.user?.id;
    if (!hasGeneratedFreeImage && userId) {
      try {
        await setHasGeneratedFreeImage(userId, true);
        setHasGeneratedFreeImage(true);
      } catch (error) {
        console.error("Failed to update has_generated_free_image:", error);
        // Still update local state even if DB update fails
        setHasGeneratedFreeImage(true);
      }
    }
  };

  const refreshUsage = async (userId: string) => {
    setIsUsageLoading(true);
    try {
      const stats = await getMonthlyUsage(userId, planType);
      setUsage(stats);
      setUsageError(null);
    } catch (error) {
      console.error("Usage fetch error:", error);
      setUsageError("Unable to load credits.");
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
    if (hasGeneratedFreeImage && !isPaymentUnlocked) {
      openPaymentModal();
      return;
    }

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

    let latestUsage: MonthlyUsage | null = usage;
    try {
      latestUsage = await getMonthlyUsage(userId, planType);
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
                error: "Unable to check credit balance.",
              }
            : res
        )
      );
      return;
    }

    if (
      !isPaymentUnlocked &&
      latestUsage &&
      latestUsage.used >= FREE_CREDIT_CAP
    ) {
      openPaymentModal();
      setter((prev) =>
        prev.map((res, idx) =>
          idx === index
            ? { ...res, isLoading: false, error: "Upgrade to keep generating." }
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
                error: "Monthly credit limit reached.",
              }
            : res
        )
      );
      alert("Monthly credit limit reached. Please upgrade for more.");
      return;
    }

    try {
      const imageUrl = await generateCharacterScene(
        targetResult.prompt,
        references,
        size
      );
      const updatedUsage = await recordGeneration(userId, 1, planType);
      setUsage(updatedUsage);
      markFirstGenerationComplete();
      setter((prev) =>
        prev.map((res, idx) =>
          idx === index ? { ...res, imageUrl, isLoading: false } : res
        )
      );
    } catch (error: any) {
      console.error("Regeneration error:", error);
      if (error?.message === "MONTHLY_LIMIT_REACHED") {
        await refreshUsage(userId);
        alert("Monthly credit limit reached. Please upgrade for more.");
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
    if (hasGeneratedFreeImage && !isPaymentUnlocked) {
      openPaymentModal();
      return;
    }

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

    let latestUsage: MonthlyUsage | null = usage;

    try {
      latestUsage = await getMonthlyUsage(userId, planType);
      setUsage(latestUsage);
      setUsageError(null);
    } catch (error) {
      console.error("Usage check error:", error);
      setUsageError("Unable to load credits.");
      alert("Unable to check your monthly credits. Please try again.");
      setIsGenerating(false);
      return;
    }

    if (latestUsage && scenesToGenerate > latestUsage.remaining) {
      alert(
        `You can generate ${latestUsage.remaining} more image${
          latestUsage.remaining === 1 ? "" : "s"
        } this month (credits ${latestUsage.monthlyLimit}).`
      );
      setIsGenerating(false);
      return;
    }

    if (
      !isPaymentUnlocked &&
      latestUsage &&
      latestUsage.used >= FREE_CREDIT_CAP
    ) {
      openPaymentModal();
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
          const updatedUsage = await recordGeneration(userId, 1, planType);
          setUsage(updatedUsage);
          markFirstGenerationComplete();
          setManualResults((prev) =>
            prev.map((res, idx) =>
              idx === i ? { ...res, imageUrl, isLoading: false } : res
            )
          );
        } catch (error: any) {
          console.error("Manual generation error:", error);
          if (error?.message === "MONTHLY_LIMIT_REACHED") {
            await refreshUsage(userId);
            alert("Monthly credit limit reached. Please upgrade for more.");
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
          const updatedUsage = await recordGeneration(userId, 1, planType);
          setUsage(updatedUsage);
          markFirstGenerationComplete();
          setSlideshowResults((prev) =>
            prev.map((res, idx) =>
              idx === i ? { ...res, imageUrl, isLoading: false } : res
            )
          );
        } catch (error: any) {
          console.error("Slideshow generation error:", error);
          if (error?.message === "MONTHLY_LIMIT_REACHED") {
            await refreshUsage(userId);
            alert("Monthly credit limit reached. Please upgrade for more.");
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

      <main className="app__body">
        <div className="app__content">
          <Sidebar
            mode={mode}
            onModeChange={setMode}
            activePanel={activePanel}
            onPanelChange={setActivePanel}
            onOpenSettings={() => setIsPaymentModalOpen(true)}
            displayEmail={displayEmail}
            isSubscribed={hasSubscription}
            subscriptionLabel={
              hasSubscription ? `Plan: ${planType.toUpperCase()}` : "Free"
            }
            subscriptionPrice={
              hasSubscription ? PLAN_PRICE_LABEL[planType] : null
            }
            onOpenBilling={() => setIsPaymentModalOpen(true)}
            onCancelSubscription={async () => {
              const userId = session?.user?.id;
              if (!userId) return;
              try {
                await cancelStripeSubscription(stripeSubscriptionId);
                await deactivateSubscription(userId);
                setIsPaymentUnlocked(false);
                setPlanLockedFromSubscription(false);
                setPlanType("basic");
                await refreshUsage(userId);
              } catch (error) {
                console.error("Failed to cancel subscription:", error);
                alert("Could not cancel subscription. Please try again.");
              }
            }}
            onSignOut={signOut}
          />

          <div className="app__main">
            <input
              type="file"
              ref={fileInputRef}
              multiple
              className="hidden-input"
              accept="image/*"
              onChange={handleFileUpload}
            />
            <section className="card dashboard-summary">
              <div className="dashboard-summary__top">
                <div className="brand brand--compact">
                  <div className="brand__icon">
                    <img
                      src="/assets/images/logo.png"
                      alt="NanoGen AI Logo"
                      className="brand__icon-image"
                    />
                  </div>
                  <div className="brand__text">
                    <p className="brand__eyebrow">Dashboard</p>
                    <h3 className="brand__title">NanoGen AI</h3>
                  </div>
                </div>
                <div className="dashboard-summary__plan">
                  <p className="dashboard-summary__label">Plan</p>
                  <p className="dashboard-summary__plan-title">
                    {hasSubscription
                      ? `Plan: ${planType.toUpperCase()}`
                      : "Free tier"}
                  </p>
                  <p className="dashboard-summary__plan-meta">
                    {hasSubscription
                      ? PLAN_PRICE_LABEL[planType]
                      : "3 free credits included"}
                  </p>
                  <div className="dashboard-summary__actions">
                    {hasSubscription ? (
                      <button
                        className="chip-button chip-button--ghost"
                        onClick={async () => {
                          const userId = session?.user?.id;
                          if (!userId) return;
                          try {
                            await cancelStripeSubscription(
                              stripeSubscriptionId
                            );
                            await deactivateSubscription(userId);
                            setIsPaymentUnlocked(false);
                            setPlanLockedFromSubscription(false);
                            setPlanType("basic");
                            await refreshUsage(userId);
                          } catch (error) {
                            console.error(
                              "Failed to cancel subscription:",
                              error
                            );
                            alert(
                              "Could not cancel subscription. Please try again."
                            );
                          }
                        }}
                      >
                        Cancel plan
                      </button>
                    ) : (
                      <button
                        className="chip-button"
                        onClick={() => setIsPaymentModalOpen(true)}
                      >
                        Upgrade
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="dashboard-summary__metrics">
                <div className="metric-card">
                  <p className="metric-card__value">
                    {isUsageLoading
                      ? "..."
                      : hasSubscription
                      ? displayUsageLimit
                        ? `${
                            displayUsageRemaining ?? displayUsageLimit
                          }/${displayUsageLimit}`
                        : "--/--"
                      : typeof freeCreditsRemaining === "number"
                      ? `${freeCreditsRemaining}/3`
                      : "3"}
                  </p>
                  <p className="metric-card__label">
                    {hasSubscription ? "Credits left" : "Free credits"}
                  </p>
                </div>
                <div className="metric-card">
                  <p className="metric-card__value">{references.length}</p>
                  <p className="metric-card__label">References</p>
                </div>
                <div className="metric-card">
                  <p className="metric-card__value">{totalScenes}</p>
                  <p className="metric-card__label">Scenes</p>
                </div>
                <div className="metric-card">
                  <p className="metric-card__value">{generatedCount}</p>
                  <p className="metric-card__label">Rendered</p>
                </div>
                <div className="metric-card">
                  <p className="metric-card__value">{size}</p>
                  <p className="metric-card__label">Resolution</p>
                </div>
              </div>

              <div className="dashboard-summary__actions-row">
                <div className="size-picker">
                  <span>Resolution</span>
                  <div className="size-picker__options">
                    <button
                      className={`size-picker__option ${
                        size === "1K" ? "is-active" : ""
                      }`}
                      onClick={() => setSize("1K")}
                    >
                      1K
                    </button>
                  </div>
                </div>
                <div className="dashboard-summary__cta">
                  <button
                    onClick={triggerUpload}
                    className="primary-button primary-button--ghost"
                  >
                    Upload references
                  </button>
                  <button
                    onClick={startGeneration}
                    disabled={disableGenerate}
                    className="primary-button"
                  >
                    {isGenerating ? "Processing..." : "Generate now"}
                  </button>
                </div>
              </div>
            </section>

            {activePanel === "saved" && (
              <section className="card sidebar__saved card--ghost">
                <div className="card__header">
                  <div>
                    <p className="sidebar__eyebrow">Saved</p>
                    <h4 className="card__title">Libraries</h4>
                  </div>
                  <button
                    onClick={() => setIsReferenceLibraryOpen(true)}
                    className="card__action card__action--ghost"
                  >
                    View all
                  </button>
                </div>
                <div className="sidebar__saved-grid">
                  <div className="sidebar__saved-card">
                    <div className="sidebar__saved-head">
                      <span>Reference sets</span>
                      <button
                        onClick={() => setIsReferenceLibraryOpen(true)}
                        className="link-button"
                      >
                        Add
                      </button>
                    </div>
                    <div className="sidebar__saved-list custom-scrollbar">
                      {isLibraryLoading ? (
                        <p className="sidebar__empty">Loading saved sets...</p>
                      ) : referenceLibrary.length === 0 ? (
                        <p className="sidebar__empty">
                          No saved references yet.
                        </p>
                      ) : (
                        referenceLibrary.slice(0, 4).map((set) => (
                          <button
                            key={set.setId}
                            className="sidebar__saved-item"
                            onClick={() =>
                              handleAddReferencesFromLibrary([set])
                            }
                            title="Load this reference set"
                          >
                            <div className="sidebar__saved-text">
                              <span className="sidebar__saved-title">
                                {set.label || "Untitled set"}
                              </span>
                              <span className="sidebar__saved-meta">
                                {set.images.length} image
                                {set.images.length === 1 ? "" : "s"}
                              </span>
                            </div>
                            <span className="sidebar__chevron">↗</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="sidebar__saved-card">
                    <div className="sidebar__saved-head">
                      <span>Prompt presets</span>
                      <button
                        onClick={() => setIsPromptLibraryOpen(true)}
                        className="link-button"
                      >
                        Browse
                      </button>
                    </div>
                    <div className="sidebar__saved-list custom-scrollbar">
                      {isLibraryLoading ? (
                        <p className="sidebar__empty">
                          Loading saved prompts...
                        </p>
                      ) : promptLibrary.length === 0 ? (
                        <p className="sidebar__empty">No saved prompts yet.</p>
                      ) : (
                        promptLibrary.slice(0, 4).map((preset) => (
                          <button
                            key={preset.id}
                            className="sidebar__saved-item"
                            onClick={() => handleUsePromptPreset(preset)}
                            title="Apply this prompt preset"
                          >
                            <div className="sidebar__saved-text">
                              <span className="sidebar__saved-title">
                                {preset.title}
                              </span>
                              <span className="sidebar__saved-meta">
                                Tap to apply
                              </span>
                            </div>
                            <span className="sidebar__chevron">↗</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activePanel === "references" && (
              <section className="card">
                <div className="card__header">
                  <h3 className="card__title">References</h3>
                  <div className="card__actions">
                    <button
                      onClick={() => setIsReferenceLibraryOpen(true)}
                      className="card__action card__action--ghost"
                    >
                      Dataset
                    </button>
                    <button onClick={triggerUpload} className="card__action">
                      Upload
                    </button>
                  </div>
                </div>
                <div className="reference-actions">
                  <button
                    onClick={handleSaveReferences}
                    disabled={isSavingReferences || references.length === 0}
                    className="chip-button"
                    title="Save current references for reuse"
                  >
                    {isSavingReferences ? "Saving..." : "Save to dataset"}
                  </button>
                </div>
                {references.length === 0 ? (
                  <div
                    onClick={triggerUpload}
                    className="references__placeholder"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <div>Add Character Images</div>
                  </div>
                ) : (
                  <div className="references__grid">
                    {references.map((ref) => (
                      <div key={ref.id} className="reference-thumb">
                        <img src={ref.data} alt="Reference" />
                        <button
                          onClick={() => removeReference(ref.id)}
                          className="reference-thumb__remove"
                          aria-label="Remove reference"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {activePanel === "storyboard" && mode === "slideshow" && (
              <section className="card">
                <h3 className="card__title">Slideshow Story</h3>
                <div className="sidebar__panel-content">
                  <div>
                    <label className="field-label">Overall Topic</label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g. Benefits of Yoga"
                      className="text-input"
                    />
                  </div>
                  <button
                    onClick={handleGenerateStoryboard}
                    disabled={isCreatingStoryboard || !topic.trim()}
                    className="storyboard-button"
                  >
                    {isCreatingStoryboard
                      ? "Creating Script..."
                      : "Generate Storyboard"}
                  </button>
                  <div className="sidebar__helper">
                    <p className="helper-text">
                      This will automatically create a title slide, informative
                      slides, and a CTA slide.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {activePanel === "manual" && mode === "manual" && (
              <section className="card sidebar__panel">
                <h3 className="card__title">Manual Scenarios</h3>
                <div className="prompt-actions">
                  <button
                    onClick={() => setIsPromptLibraryOpen(true)}
                    className="chip-button chip-button--ghost"
                  >
                    Use saved prompt
                  </button>
                  <button
                    onClick={handleSavePromptPreset}
                    disabled={isSavingPrompt || !manualPrompts.trim()}
                    className="chip-button"
                  >
                    {isSavingPrompt ? "Saving..." : "Save prompt"}
                  </button>
                </div>
                <textarea
                  value={manualPrompts}
                  onChange={(e) => setManualPrompts(e.target.value)}
                  placeholder="One scene prompt per line..."
                  className="textarea-input"
                />
                <p className="helper-text">
                  Describe actions, emotions, and props.
                </p>
              </section>
            )}

            <Results
              mode={mode}
              results={results}
              isGenerating={isGenerating}
              onRegenerate={handleRegenerate}
            />
          </div>
        </div>
      </main>

      <ReferenceLibraryModal
        isOpen={isReferenceLibraryOpen}
        items={referenceLibrary}
        isLoading={isLibraryLoading}
        onClose={() => setIsReferenceLibraryOpen(false)}
        onSelect={handleAddReferencesFromLibrary}
      />

      <PromptLibraryModal
        isOpen={isPromptLibraryOpen}
        items={promptLibrary}
        isLoading={isLibraryLoading}
        onClose={() => setIsPromptLibraryOpen(false)}
        onSelect={handleUsePromptPreset}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        planType={planType}
        paymentUrls={stripePlanLinks}
        onPlanSelect={(plan) => setPlanType(plan)}
      />
    </div>
  );
};

export default DashboardPage;
