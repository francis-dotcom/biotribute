export type TributeMessagePlacement = "feed" | "timeline";

export type TributeMessage = {
  id: string;
  author: string;
  date: string;
  placement: TributeMessagePlacement;
  excerpt: string;
  full: string;
};

export type TributeTimelineEntry = {
  year: string;
  title: string;
  copy: string;
};

export type TributeContributor = {
  label: string;
  name: string;
  copy: string;
};

export type TributeSupportAmount = {
  label: string;
  featured?: boolean;
};

export type TributeGalleryItem = {
  id: string;
  imageUrl: string;
};

/** Theme tokens stored on each tribute row; palettes live in tributeThemePresets. */
export const TRIBUTE_THEME_IDS = [
  "ivory",
  "sage",
  "sky",
  "amethyst",
  "midnight",
  "candlelight",
  "rose-quartz",
  "pearl-coast",
  "evergreen",
  "harvest",
  "charcoal",
] as const;
export type TributeTheme = (typeof TRIBUTE_THEME_IDS)[number];
export type TributeLivestreamDisplayMode = "video" | "image-url" | "uploaded-image";

export type TributeThemePreset = {
  id: TributeTheme;
  name: string;
  description: string;
  variables: Record<string, string>;
};

export type TributeRecord = {
  slug: string;
  ownerUserId?: string | null;
  name: string;
  honorificTitle?: string;
  positionTitle?: string;
  years: string;
  tagline: string;
  organizer: string;
  theme: TributeTheme;
  heroImageUrl?: string;
  backgroundImageUrl?: string;
  lifeStory: string[];
  timeline: TributeTimelineEntry[];
  contributors: TributeContributor[];
  galleryIntro?: string;
  galleryNote: string;
  galleryImages: TributeGalleryItem[];
  showGallerySection: boolean;
  servicePosterImageUrl?: string;
  servicePosterTitle?: string;
  servicePosterNote?: string;
  showServicePosterSection: boolean;
  videoUrls: string[];
  videoDescriptions: string[];
  videoThumbnailUrls: string[];
  activeVideoIndex?: number;
  videoNote?: string;
  showVideoSection: boolean;
  livestreamUrl?: string;
  livestreamThumbnailUrl?: string;
  livestreamDisplayMode?: TributeLivestreamDisplayMode;
  livestreamNote?: string;
  showLivestreamSection: boolean;
  messages: TributeMessage[];
  supportAmounts: TributeSupportAmount[];
  contactEmail?: string;
  donationAccountName?: string;
  donationAccountNumber?: string;
  donationBankName?: string;
  donationPhone?: string;
  showCondolencePopup?: boolean;
  condolenceCardImageUrl?: string;
  heroCountdownTargetDate?: string;
  heroCountdownUnit?: string;
  supportNote?: string;
  /** When true, public page cycles through `themeRotationThemeIds` on an interval. Stored in support-note metadata. */
  themeRotationEnabled?: boolean;
  themeRotationIntervalMinutes?: number;
  themeRotationThemeIds?: TributeTheme[];
};

export const tributes: TributeRecord[] = [
  {
    slug: "SirFemiOgini",
    name: "Sir FEmi FRancis OGini",
    years: "1965 - 2024",
    tagline: "Beloved Father, Mentor, and Friend",
    organizer: "Sarah Doe",
    theme: "ivory",
    heroImageUrl: "/portrait-placeholder.svg",
    backgroundImageUrl: "/portrait-placeholder.svg",
    lifeStory: [
      "John was known for kindness, wisdom, and steady presence. He built a life of service, family, and quiet leadership, shaping every room not by volume but by steadiness.",
      "He believed in showing up for people. Whether he was guiding his children, mentoring younger colleagues, or helping a neighbor solve an ordinary problem, his instinct was always to make life gentler for someone else.",
      "Those who knew him remember a patient listener, a thoughtful teacher, and a man whose values were visible in daily practice. This tribute is a place to hold those memories with care."
    ],
    timeline: [
      {
        year: "1965",
        title: "A Beginning Rooted in Family",
        copy: "Born into a close-knit family, John carried those early values of generosity and responsibility throughout his life."
      },
      {
        year: "1990s",
        title: "Building a Life of Work and Service",
        copy: "He became known as a dependable presence at work and a trusted source of calm guidance for those around him."
      },
      {
        year: "2000s-2024",
        title: "Mentor, Father, and Friend",
        copy: "His later years were defined by family, mentorship, and a quiet legacy of care that continues through the people he shaped."
      }
    ],
    contributors: [
      {
        label: "Family Organizer",
        name: "Sarah Doe",
        copy: "Daughter and page steward, gathering memories, photos, and support from friends and family."
      },
      {
        label: "Contributor",
        name: "Michael Doe Jr.",
        copy: "Adding milestone stories, family history, and notes from those who worked alongside John."
      },
      {
        label: "Community",
        name: "Friends & Colleagues",
        copy: "Guests can leave messages, submit memories, and contribute support as the page grows."
      }
    ],
    galleryIntro:
      "A gentle space for family photos, celebration moments, and the scenes that made his life recognizable to everyone who loved him.",
    galleryNote:
      "No photos have been added yet. Family members and invited contributors will be able to upload memories here.",
    galleryImages: [],
    showGallerySection: true,
    servicePosterImageUrl: "",
    servicePosterTitle: "Service Poster",
    servicePosterNote:
      "View and share the funeral service program details for wake, mass, interment, and reception.",
    showServicePosterSection: true,
    videoUrls: [],
    videoDescriptions: [],
    videoThumbnailUrls: [],
    activeVideoIndex: 0,
    videoNote:
      "Add video memories from family and friends. Use direct MP4 links or YouTube/Vimeo links for playback.",
    showVideoSection: true,
    livestreamUrl: "https://www.youtube.com/live/_HgtGwjKX_k?si=Dp_qLufASpNwcPBr",
    livestreamThumbnailUrl: "",
    livestreamDisplayMode: "video",
    livestreamNote:
      "If you are running a memorial live stream, paste the YouTube/Vimeo stream link in the console.",
    showLivestreamSection: true,
    messages: [
      {
        id: "grace-a",
        author: "Grace A.",
        date: "April 18, 2026",
        placement: "feed",
        excerpt: "John had a way of making people feel steady. Even brief conversations with him left you clearer and calmer than before.",
        full: "John had a way of making people feel steady. Even brief conversations with him left you clearer and calmer than before. He listened closely, remembered details, and always spoke with a kind honesty that made you feel seen."
      },
      {
        id: "daniel-k",
        author: "Daniel K.",
        date: "April 21, 2026",
        placement: "timeline",
        excerpt: "He led with kindness and patience. I still use lessons he taught me years ago, and I think many of us do without even realizing it.",
        full: "He led with kindness and patience. I still use lessons he taught me years ago, and I think many of us do without even realizing it. He showed us that leadership was less about control and more about consistent care."
      },
      {
        id: "maria-s",
        author: "Maria S.",
        date: "April 24, 2026",
        placement: "feed",
        excerpt: "He remembered details about people. That kind of care stays with you for years after the conversation is over.",
        full: "He remembered details about people. That kind of care stays with you for years after the conversation is over. I still remember him asking about my mother months after a single conversation."
      },
      {
        id: "samuel-t",
        author: "Samuel T.",
        date: "April 28, 2026",
        placement: "timeline",
        excerpt: "One story deserves a place in the life timeline, because it says so much about the kind of father and mentor he was.",
        full: "One story deserves a place in the life timeline, because it says so much about the kind of father and mentor he was. He spent an entire weekend helping a young colleague prepare for a difficult moment, never asking for recognition."
      }
    ],
    supportAmounts: [
      { label: "Standard Card" },
      { label: "Premium Card", featured: true },
      { label: "Family Support Tribute" },
      { label: "Featured Memorial Card" },
      { label: "Custom Tribute" }
    ],
    contactEmail: "",
    donationAccountName: "DR IRENE OLUBUNMI MOJOYINOLA (NEE OGINI)",
    donationAccountNumber: "11111111111111111111",
    donationBankName: "ECO BANK",
    donationPhone: "0803 835 5005",
    showCondolencePopup: true,
    condolenceCardImageUrl: "/condolence-exact.png",
    heroCountdownTargetDate: "2026-06-11",
    heroCountdownUnit: "Days",
    supportNote:
      "Choose a paid tribute card tier and include a personal sympathy message for the family."
  }
];

export const tributeThemePresets: TributeThemePreset[] = [
  {
    id: "ivory",
    name: "Ivory Memorial",
    description: "Warm ivory neutrals with gold accents for a classic memorial tone.",
    variables: {
      "--bg": "#f9f9fb",
      "--bg-2": "#f4f4f7",
      "--panel": "rgba(255, 255, 255, 0.86)",
      "--panel-solid": "#ffffff",
      "--text": "#1c1c1e",
      "--muted": "#666666",
      "--muted-2": "#444444",
      "--muted-3": "#7a7a83",
      "--line": "#e5e5ea",
      "--gold": "#c8a96a",
      "--gold-deep": "#b29151",
      "--gold-soft": "#f4ebda",
      "--violet-soft": "#f2f0f6",
      "--violet-deep": "#60557c",
    },
  },
  {
    id: "sage",
    name: "Sage Garden",
    description: "Muted greens and soft parchment for a calmer, earthier atmosphere.",
    variables: {
      "--bg": "#f3f6f2",
      "--bg-2": "#e9efe6",
      "--panel": "rgba(255, 255, 255, 0.84)",
      "--panel-solid": "#fbfdf9",
      "--text": "#1f2823",
      "--muted": "#66736b",
      "--muted-2": "#49584f",
      "--muted-3": "#708077",
      "--line": "#d9e1da",
      "--gold": "#8ca57d",
      "--gold-deep": "#6e8663",
      "--gold-soft": "#e4eee0",
      "--violet-soft": "#edf1eb",
      "--violet-deep": "#5b6d5f",
    },
  },
  {
    id: "sky",
    name: "Quiet Sky",
    description: "Light blue-grays with a serene, airy memorial feel.",
    variables: {
      "--bg": "#f4f7fb",
      "--bg-2": "#eaf0f7",
      "--panel": "rgba(255, 255, 255, 0.86)",
      "--panel-solid": "#ffffff",
      "--text": "#1d2330",
      "--muted": "#677284",
      "--muted-2": "#49566b",
      "--muted-3": "#74829a",
      "--line": "#dce4ef",
      "--gold": "#88a8c7",
      "--gold-deep": "#6988a6",
      "--gold-soft": "#e6eef7",
      "--violet-soft": "#eef3f8",
      "--violet-deep": "#59718e",
    },
  },
  {
    id: "amethyst",
    name: "Cool Amethyst",
    description:
      "Cool lavender and dusty plum tones with icy highlights for a modern purple memorial palette.",
    variables: {
      "--bg": "#f4f2fa",
      "--bg-2": "#eae6f5",
      "--panel": "rgba(255, 255, 255, 0.88)",
      "--panel-solid": "#faf9ff",
      "--text": "#211c2e",
      "--muted": "#635b78",
      "--muted-2": "#473d5c",
      "--muted-3": "#766d8f",
      "--line": "#dad4e8",
      "--gold": "#9d8dcb",
      "--gold-deep": "#6e5fa3",
      "--gold-soft": "#ebe6f9",
      "--violet-soft": "#e2dcf5",
      "--violet-deep": "#45306a",
    },
  },
  {
    id: "midnight",
    name: "Midnight Remembrance",
    description:
      "Deep navy and ink tones with soft champagne accents for a quiet, dignified night palette.",
    variables: {
      "--bg": "#1b2030",
      "--bg-2": "#141823",
      "--panel": "rgba(34, 40, 56, 0.92)",
      "--panel-solid": "#242b3d",
      "--text": "#f2f4f8",
      "--muted": "#bcc5d6",
      "--muted-2": "#e2e8f2",
      "--muted-3": "#9fa9bf",
      "--line": "#55607a",
      "--gold": "#dccda8",
      "--gold-deep": "#efd8a6",
      "--gold-soft": "#414b63",
      "--violet-soft": "#303a54",
      "--violet-deep": "#c4d0ea",
    },
  },
  {
    id: "candlelight",
    name: "Warm Candlelight",
    description:
      "Cream parchment and soft amber accents that feel intimate, like candlelight in a chapel.",
    variables: {
      "--bg": "#faf6f0",
      "--bg-2": "#f3eae0",
      "--panel": "rgba(255, 252, 247, 0.9)",
      "--panel-solid": "#fffdfb",
      "--text": "#2c2419",
      "--muted": "#6b5d4d",
      "--muted-2": "#4a4136",
      "--muted-3": "#837566",
      "--line": "#e8dfd2",
      "--gold": "#c4894d",
      "--gold-deep": "#9e6630",
      "--gold-soft": "#f7eadd",
      "--violet-soft": "#eee6dc",
      "--violet-deep": "#6b5845",
    },
  },
  {
    id: "rose-quartz",
    name: "Rose Remembrance",
    description:
      "Dusty rose and mauve with gentle neutrals—a soft floral sympathy without harsh contrast.",
    variables: {
      "--bg": "#faf5f8",
      "--bg-2": "#f2e8ee",
      "--panel": "rgba(255, 251, 253, 0.9)",
      "--panel-solid": "#fffcfc",
      "--text": "#2a2126",
      "--muted": "#7a6570",
      "--muted-2": "#58454f",
      "--muted-3": "#957a87",
      "--line": "#eadce3",
      "--gold": "#b6788c",
      "--gold-deep": "#905567",
      "--gold-soft": "#f8e9ef",
      "--violet-soft": "#ebe1e8",
      "--violet-deep": "#684d5d",
    },
  },
  {
    id: "pearl-coast",
    name: "Coastal Pearl",
    description:
      "Fog-gray shells and muted sea-glass teal for an open, calm coastal memorial mood.",
    variables: {
      "--bg": "#f4f9f9",
      "--bg-2": "#e6f2f2",
      "--panel": "rgba(255, 253, 252, 0.92)",
      "--panel-solid": "#fbfdfd",
      "--text": "#1c2a29",
      "--muted": "#516b69",
      "--muted-2": "#3a504e",
      "--muted-3": "#698784",
      "--line": "#d2e4e2",
      "--gold": "#5a9890",
      "--gold-deep": "#3f736c",
      "--gold-soft": "#dff5f2",
      "--violet-soft": "#e5f4f2",
      "--violet-deep": "#2f5f59",
    },
  },
  {
    id: "evergreen",
    name: "Evergreen Hymn",
    description:
      "Deep pine greens with snowy highlights for a reverent woodland chapel feeling.",
    variables: {
      "--bg": "#f1f7f4",
      "--bg-2": "#e2efe8",
      "--panel": "rgba(255, 252, 250, 0.9)",
      "--panel-solid": "#fbfdfa",
      "--text": "#15231f",
      "--muted": "#4a635b",
      "--muted-2": "#374e47",
      "--muted-3": "#627c73",
      "--line": "#c8dbd4",
      "--gold": "#2d6849",
      "--gold-deep": "#1f4a34",
      "--gold-soft": "#dcede4",
      "--violet-soft": "#dfece6",
      "--violet-deep": "#274a3d",
    },
  },
  {
    id: "harvest",
    name: "Harvest Wheat",
    description:
      "Golden wheat fields, warm parchment, and russet highlights for autumn remembrance.",
    variables: {
      "--bg": "#faf7ef",
      "--bg-2": "#efe6d6",
      "--panel": "rgba(255, 251, 244, 0.9)",
      "--panel-solid": "#fffbf4",
      "--text": "#2d261a",
      "--muted": "#6e6349",
      "--muted-2": "#534835",
      "--muted-3": "#8a7f63",
      "--line": "#e4dac6",
      "--gold": "#b8892e",
      "--gold-deep": "#8f6818",
      "--gold-soft": "#f7edd4",
      "--violet-soft": "#eae2d2",
      "--violet-deep": "#786040",
    },
  },
  {
    id: "charcoal",
    name: "Monochrome Charcoal",
    description:
      "Cool grays with slate accents—minimal, editorial, easy to pair with photography.",
    variables: {
      "--bg": "#f0f2f5",
      "--bg-2": "#e2e6ec",
      "--panel": "rgba(254, 254, 255, 0.92)",
      "--panel-solid": "#fafbfb",
      "--text": "#121418",
      "--muted": "#5a616d",
      "--muted-2": "#383e48",
      "--muted-3": "#75808f",
      "--line": "#cfd4dc",
      "--gold": "#5c6778",
      "--gold-deep": "#3e4756",
      "--gold-soft": "#e9ecf1",
      "--violet-soft": "#eaecef",
      "--violet-deep": "#3d4654",
    },
  },
];

export function getTributeThemePreset(theme: TributeTheme) {
  return tributeThemePresets.find((preset) => preset.id === theme) ?? tributeThemePresets[0];
}

export function getTributeBySlug(slug: string) {
  return tributes.find((tribute) => tribute.slug === slug);
}

export function getTributeBySlugInsensitive(slug: string) {
  const normalized = slug.trim().toLowerCase();
  return tributes.find((tribute) => tribute.slug.toLowerCase() === normalized);
}
