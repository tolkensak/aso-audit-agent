// src/tools/app-store-scraper.ts

import { Tool } from "@mastra/core/tool";
import { z } from "zod";
import { AppMetadata } from "@/types/aso-types";

const AppStoreUrlSchema = z.object({
  url: z
    .string()
    .url()
    .regex(/apps\.apple\.com\/[a-z]{2}\/app\//, {
      message: "Must be a valid Apple App Store URL",
    }),
});

export const scrapeAppStoreTool = new Tool({
  name: "scrapeAppStore",
  description: "Scrape metadata from an Apple App Store listing",
  parameters: AppStoreUrlSchema,
  execute: async ({ url }: { url: string }) => {
    // Parse app ID from URL
    const appIdMatch = url.match(/\/id(\d+)/);
    if (!appIdMatch) {
      throw new Error("Could not extract app ID from URL");
    }
    const appId = appIdMatch[1];

    const countryMatch = url.match(/apps\.apple\.com\/([a-z]{2})\//);
    const country = countryMatch ? countryMatch[1] : "us";

    try {
      const response = await fetch(
        `https://itunes.apple.com/${country}/lookup?id=${appId}`,
      );
      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        throw new Error("App not found");
      }

      const app = data.results[0];

      return {
        id: appId,
        name: app.trackName,
        developer: app.artistName,
        icon: app.artworkUrl100 || app.artworkUrl60 || "",
        category: app.primaryGenreName,
        country: country,
        title: app.trackName,
        subtitle: app.subtitle || "",
        description: app.description || "",
        keywordField: app.keywords || "",
        screenshots: app.screenshotUrls || [],
        previewVideo: app.previewUrl || null,
        rating: app.averageUserRating || 0,
        reviewCount: app.userRatingCount || 0,
        ratingHistory: [],
        promotionalText: app.promotionalText || null,
        whatsNew: app.releaseNotes || null,
        inAppEvents: app.inAppEvents || [],
        customProductPages: app.customProductPages || [],
        url: url,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Scraping error:", errorMessage);
      throw new Error(`Failed to scrape app data: ${errorMessage}`);
    }
  },
});
