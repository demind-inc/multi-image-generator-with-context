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
import AppHeader from "../components/AppHeader/AppHeader";
import Hero from "../components/Hero/Hero";
import PaymentModal from "../components/PaymentModal/PaymentModal";
import Sidebar from "../components/Sidebar/Sidebar";
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
  const dashboardPlans = [
    {
      badge: "Basic",
      price: "$9/mo",
      credits: "60 credits/month",
      plan: "basic" as SubscriptionPlan,
    },
    {
      badge: "Pro",
      price: "$29/mo",
      credits: "180 credits/month",
      plan: "pro" as SubscriptionPlan,
    },
    {
      badge: "Business",
      price: "$79/mo",
      credits: "600 credits/month",
      plan: "business" as SubscriptionPlan,
    },
  ];

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
        isSubscribed={hasSubscription}
        freeCreditsRemaining={freeCreditsRemaining}
        subscriptionLabel={
          hasSubscription ? `Plan: ${planType.toUpperCase()}` : "Free"
        }
        subscriptionPrice={hasSubscription ? PLAN_PRICE_LABEL[planType] : null}
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
          isSubscribed={hasSubscription}
          freeCreditsRemaining={freeCreditsRemaining}
        />

        <div className="app__content">
          <Sidebar
            mode={mode}
            references={references}
            fileInputRef={fileInputRef}
            onUploadClick={triggerUpload}
            onFileChange={handleFileUpload}
            onRemoveReference={removeReference}
            onSaveReferences={handleSaveReferences}
            isSavingReferences={isSavingReferences}
            onOpenReferenceLibrary={() => setIsReferenceLibraryOpen(true)}
            topic={topic}
            onTopicChange={setTopic}
            onGenerateStoryboard={handleGenerateStoryboard}
            isCreatingStoryboard={isCreatingStoryboard}
            manualPrompts={manualPrompts}
            onManualPromptsChange={setManualPrompts}
            onSavePrompt={handleSavePromptPreset}
            isSavingPrompt={isSavingPrompt}
            onOpenPromptLibrary={() => setIsPromptLibraryOpen(true)}
          />

          <Results
            mode={mode}
            results={results}
            isGenerating={isGenerating}
            onRegenerate={handleRegenerate}
          />
        </div>

        {!hasSubscription && (
          <section className="dashboard-pricing">
            <h3>Upgrade for more credits</h3>
            <div className="dashboard-pricing__grid">
              {dashboardPlans.map((planCard) => (
                <div className="dashboard-pricing__card" key={planCard.plan}>
                  <p className="dashboard-pricing__badge">{planCard.badge}</p>
                  <p className="dashboard-pricing__price">{planCard.price}</p>
                  <p className="dashboard-pricing__credits">
                    {planCard.credits}
                  </p>
                  <button
                    className="primary-button"
                    onClick={() => {
                      setPlanType(planCard.plan);
                      setIsPaymentModalOpen(true);
                    }}
                  >
                    Choose {planCard.badge}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
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
      />

      <Footer />
    </div>
  );
};

export default DashboardPage;
