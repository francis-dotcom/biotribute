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

export type TributeTheme = "ivory" | "sage" | "sky";

export type TributeThemePreset = {
  id: TributeTheme;
  name: string;
  description: string;
  variables: Record<string, string>;
};

export type TributeRecord = {
  slug: string;
  name: string;
  years: string;
  tagline: string;
  organizer: string;
  theme: TributeTheme;
  heroImageUrl?: string;
  backgroundImageUrl?: string;
  lifeStory: string[];
  timeline: TributeTimelineEntry[];
  contributors: TributeContributor[];
  galleryNote: string;
  galleryImages: TributeGalleryItem[];
  showGallerySection: boolean;
  videoUrls: string[];
  videoDescriptions: string[];
  videoNote?: string;
  showVideoSection: boolean;
  livestreamUrl?: string;
  livestreamNote?: string;
  showLivestreamSection: boolean;
  messages: TributeMessage[];
  supportAmounts: TributeSupportAmount[];
  contactEmail?: string;
  donationAccountName?: string;
  donationAccountNumber?: string;
  donationBankName?: string;
  donationPhone?: string;
  supportNote?: string;
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
    galleryNote:
      "No photos have been added yet. Family members and invited contributors will be able to upload memories here.",
    galleryImages: [],
    showGallerySection: true,
    videoUrls: [],
    videoDescriptions: [],
    videoNote:
      "Add video memories from family and friends. Use direct MP4 links or YouTube/Vimeo links for playback.",
    showVideoSection: true,
    livestreamUrl: "",
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
    donationAccountName: "",
    donationAccountNumber: "",
    donationBankName: "",
    donationPhone: "",
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
