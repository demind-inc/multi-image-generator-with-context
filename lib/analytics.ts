/**
 * Google Analytics event tracking utility
 * Tracks user interactions and events throughout the application
 */

import { sendGAEvent } from "@next/third-parties/google";
import { SubscriptionPlan } from "../types";

/**
 * Track a custom event in Google Analytics
 * @param eventName - The name of the event
 * @param eventParams - Additional parameters for the event
 */
export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, any>
) => {
  sendGAEvent("event", eventName, eventParams || {});
};

/**
 * Track button clicks
 * @param buttonName - Name/identifier of the button
 * @param additionalParams - Additional event parameters
 */
export const trackButtonClick = (
  buttonName: string,
  additionalParams?: Record<string, any>
) => {
  trackEvent("button_click", {
    button_name: buttonName,
    ...additionalParams,
  });
};

/**
 * Track image generation events
 * @param mode - Generation mode ('manual' | 'slideshow')
 * @param sceneCount - Number of scenes being generated
 * @param additionalParams - Additional event parameters
 */
export const trackImageGeneration = (
  mode: "manual" | "slideshow",
  sceneCount: number,
  additionalParams?: Record<string, any>
) => {
  trackEvent("generate_images", {
    generation_mode: mode,
    scene_count: sceneCount,
    ...additionalParams,
  });
};

/**
 * Track image regeneration events
 * @param mode - Generation mode ('manual' | 'slideshow')
 * @param index - Index of the scene being regenerated
 */
export const trackImageRegeneration = (
  mode: "manual" | "slideshow",
  index: number
) => {
  trackEvent("regenerate_image", {
    generation_mode: mode,
    scene_index: index,
  });
};

/**
 * Track storyboard generation events
 * @param topic - The topic used for storyboard generation
 */
export const trackStoryboardGeneration = (topic: string) => {
  trackEvent("generate_storyboard", {
    topic: topic.substring(0, 100), // Limit length for GA
  });
};

/**
 * Track subscription initiation events
 * @param plan - The subscription plan being selected
 */
export const trackSubscriptionInitiated = (plan: SubscriptionPlan) => {
  trackEvent("begin_checkout", {
    plan: plan,
    currency: "USD",
  });
};

/**
 * Track successful subscription completion
 * @param plan - The subscription plan that was purchased
 * @param value - The monetary value of the subscription
 */
export const trackSubscriptionCompleted = (
  plan: SubscriptionPlan,
  value?: number
) => {
  trackEvent("purchase", {
    plan: plan,
    currency: "USD",
    value: value,
  });
};
