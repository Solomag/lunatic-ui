/** Curated TIDAL Feature Flag metadata used by Lunatic UI. */

export const FEATURE_FLAG_CATEGORY_ORDER = [
  "AI & generation",
  "Artist claiming",
  "Creator tools",
  "Playback & devices",
  "Playlists & sharing",
  "Discovery & search",
  "Desktop & interface",
  "Account & access",
  "Uploads & moderation",
  "Telemetry",
  "Other / internal",
] as const;

export type FeatureFlagCategory = typeof FEATURE_FLAG_CATEGORY_ORDER[number];
type FeatureFlagInfo = {
  category: FeatureFlagCategory;
  description?: string;
};

/**
 * Curated catalogue for flags observed in the 2026-09 desktop client.
 * Descriptions are deliberately conservative. If the public/client evidence
 * only tells us the surface controlled by a flag, we describe that surface
 * rather than inventing implementation details.
 */
const FEATURE_FLAG_INFO: Record<string, FeatureFlagInfo> = {
  "ai-chatbox": {
    category: "AI & generation",
    description: "Controls TIDAL's AI chat interface.",
  },
  "ai-generated-playlist": {
    category: "AI & generation",
    description: "Enables AI-generated playlists.",
  },
  "ai-playlist-experiment": {
    category: "AI & generation",
    description: "Controls the experimental AI playlist experience.",
  },
  "ai-policy": {
    category: "AI & generation",
    description: "Controls AI-policy handling used by TIDAL's AI features.",
  },
  "ai-policy-uploads": {
    category: "Uploads & moderation",
    description: "Applies TIDAL's AI-policy handling to uploaded content.",
  },

  "artist-claiming": {
    category: "Artist claiming",
    description: "Enables the artist-profile claiming flow.",
  },
  "artist-claiming-cdbaby": {
    category: "Artist claiming",
    description: "Enables CD Baby as a path/provider in artist claiming.",
  },
  "artist-claiming-desktop": {
    category: "Artist claiming",
    description: "Enables artist claiming in the desktop client.",
  },
  "artist-claiming-distrokid": {
    category: "Artist claiming",
    description: "Enables DistroKid as a path/provider in artist claiming.",
  },
  "artist-claiming-manual": {
    category: "Artist claiming",
    description: "Enables the manual artist-claiming path.",
  },
  "artist-claiming-pull": {
    category: "Artist claiming",
  },
  "artist-claiming-push": {
    category: "Artist claiming",
  },
  "artist-claiming-tunecore": {
    category: "Artist claiming",
    description: "Enables TuneCore as a path/provider in artist claiming.",
  },

  "creator-content-contributions": {
    category: "Creator tools",
    description: "Enables creator contribution/credit-management features.",
  },
  "creator-content-contributions-edit": {
    category: "Creator tools",
    description: "Enables editing creator contributions/credits.",
  },
  "creator-content-contributions-receiver": {
    category: "Creator tools",
    description: "Enables the receiver-side flow for creator contributions.",
  },
  "creator-content-profile-configure-public-playlists": {
    category: "Creator tools",
    description: "Lets creator profiles configure which playlists are public.",
  },
  "creator-content-purchases": {
    category: "Creator tools",
  },
  "creator-content-spotlight": {
    category: "Creator tools",
    description: "Enables Spotlight controls in TIDAL's creator-content tools.",
  },
  "creator-content-uploader": {
    category: "Creator tools",
    description: "Enables TIDAL's creator-content uploader.",
  },
  "spotlight-2-0": {
    category: "Creator tools",
    description: "Enables the newer Spotlight 2.0 creator/profile experience.",
  },
  "spotlight-2-0-launch": {
    category: "Creator tools",
    description: "Controls the launch treatment for Spotlight 2.0.",
  },

  "cloud-queue-v2": {
    category: "Playback & devices",
    description: "Enables Cloud Queue v2, TIDAL's newer cloud-backed playback queue.",
  },
  "compact-player": {
    category: "Playback & devices",
    description: "Enables TIDAL's compact / mini player interface.",
  },
  "remote-queue": {
    category: "Playback & devices",
    description: "Enables queue handling for remote playback sessions/devices.",
  },
  "sonos-ui": {
    category: "Playback & devices",
    description: "Enables TIDAL's Sonos-specific playback UI.",
  },

  "new-track-sharing-page-web": {
    category: "Playlists & sharing",
    description: "Enables the newer web sharing page for tracks.",
  },
  "playlist-collaborators": {
    category: "Playlists & sharing",
    description: "Enables collaborative playlists.",
  },
  "playlist-collaborators-owner": {
    category: "Playlists & sharing",
    description: "Enables owner-side controls for collaborative playlists.",
  },
  "playlist-collaborators-route-with-preview": {
    category: "Playlists & sharing",
    description: "Enables the collaborator route with a playlist preview.",
  },
  "playlist-collaborators-show-in-collection": {
    category: "Playlists & sharing",
    description: "Shows collaborative playlists in My Collection.",
  },
  "playlist-page-tidal-api-migration": {
    category: "Playlists & sharing",
    description: "Switches playlist-page data loading to TIDAL's newer API path.",
  },
  "playlist-page-tidal-api-web-header": {
    category: "Playlists & sharing",
    description: "Uses the newer TIDAL API-backed web header on playlist pages.",
  },
  "reactions": {
    category: "Playlists & sharing",
    description: "Enables TIDAL's reactions feature where supported.",
  },
  "save-for-later": {
    category: "Playlists & sharing",
    description: "Enables the Save for later feature.",
  },

  "headliners-announcement": {
    category: "Discovery & search",
    description: "Controls a Headliners announcement/promotion surface.",
  },
  "home-page-promo-banner-treatment": {
    category: "Discovery & search",
    description: "Controls the experiment/treatment used by the home-page promo banner.",
  },
  "homepage-promo-banner": {
    category: "Discovery & search",
    description: "Enables the promotional banner on the home page.",
  },
  "homepage-promo-banner-logged-in": {
    category: "Discovery & search",
    description: "Shows the home-page promotional banner to signed-in users.",
  },
  "logged-out-search": {
    category: "Discovery & search",
    description: "Allows the search experience to be available while signed out.",
  },
  "mix-descriptions": {
    category: "Discovery & search",
    description: "Shows descriptive text for TIDAL mixes.",
  },
  "search-quality-badges": {
    category: "Discovery & search",
    description: "Shows audio-quality badges in search results where available.",
  },

  "image-metadata-color": {
    category: "Desktop & interface",
    description: "Enables use of image color metadata by the interface.",
  },
  "mac-hide-sidebar": {
    category: "Desktop & interface",
    description: "Enables hiding the sidebar on macOS.",
  },
  "new-media-table": {
    category: "Desktop & interface",
    description: "Enables TIDAL's newer media-table/list implementation.",
  },
  "open-links-in-desktop-app": {
    category: "Desktop & interface",
    description: "Enables the setting/behavior that opens supported TIDAL links in the desktop app.",
  },
  "sidebar-albums": {
    category: "Desktop & interface",
    description: "Enables the Albums destination/section in the sidebar.",
  },

  "enable-free-tier": {
    category: "Account & access",
    description: "Enables code paths for TIDAL's free-tier experience.",
  },
  "onboarding-holdout-q-3-transfer-included": {
    category: "Account & access",
  },
  "paygating-artist": {
    category: "Account & access",
    description: "Enables paywall/paygating behavior on artist-related surfaces.",
  },
  "paygating-artist-square": {
    category: "Account & access",
    description: "Enables the artist-square variant of TIDAL's paygating treatment.",
  },
  "paygating-artist-tracks": {
    category: "Account & access",
    description: "Enables paygating for artist-track surfaces.",
  },
  "paygating-fan": {
    category: "Account & access",
    description: "Enables paywall/paygating behavior on fan-facing surfaces.",
  },
  "paygating-fan-tracks": {
    category: "Account & access",
    description: "Enables paygating for fan-facing track surfaces.",
  },
  "updated-terms-popup": {
    category: "Account & access",
    description: "Enables the prompt shown when updated terms need to be presented to the user.",
  },

  "content-reporting": {
    category: "Uploads & moderation",
    description: "Enables in-app content reporting/moderation entry points.",
  },
  "upload-billboard-charts-info": {
    category: "Uploads & moderation",
    description: "Enables Billboard chart information in TIDAL's upload/creator-content flow.",
  },
  "upload-share-unlisted-albums": {
    category: "Uploads & moderation",
    description: "Allows unlisted uploaded albums to be shared.",
  },

  "web-datadog-rum-sample": {
    category: "Telemetry",
    description: "Controls sampling for Datadog Real User Monitoring (RUM) telemetry in the web client.",
  },
  "web-datadog-session-replay-sample": {
    category: "Telemetry",
    description: "Controls sampling for Datadog Session Replay telemetry in the web client.",
  },

  "internal": {
    category: "Other / internal",
  },
  "square-89723423": {
    category: "Other / internal",
  },
};

export function humanizeFlagName(name: string) {
  return name
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

export function featureFlagCategory(name: string): FeatureFlagCategory {
  const curated = FEATURE_FLAG_INFO[name]?.category;
  if (curated) return curated;

  // Conservative fallback for flags introduced by newer TIDAL builds.
  // This only affects grouping; unknown flags stay undescribed until curated.
  const n = name.toLowerCase();
  if (n.startsWith("ai-") || n.includes("-ai-")) return "AI & generation";
  if (n.startsWith("artist-claiming")) return "Artist claiming";
  if (n.startsWith("creator-content") || n.startsWith("spotlight")) return "Creator tools";
  if (n.includes("queue") || n.includes("player") || n.includes("sonos")) return "Playback & devices";
  if (n.startsWith("playlist-") || n.includes("sharing") || n.includes("save-for-later") || n === "reactions") return "Playlists & sharing";
  if (n.includes("search") || n.includes("mix-description")) return "Discovery & search";
  if (n.includes("desktop") || n.includes("sidebar") || n.includes("media-table") || n.includes("homepage") || n.includes("home-page") || n.includes("image-metadata")) return "Desktop & interface";
  if (n.includes("paygating") || n.includes("free-tier") || n.includes("terms") || n.includes("onboarding")) return "Account & access";
  if (n.includes("upload") || n.includes("reporting") || n.includes("policy")) return "Uploads & moderation";
  if (n.includes("datadog") || n.includes("telemetry") || n.includes("rum") || n.includes("session-replay")) return "Telemetry";
  return "Other / internal";
}

export function knownFlagDescription(name: string) {
  return FEATURE_FLAG_INFO[name]?.description ?? null;
}
