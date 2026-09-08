import course1 from "@/assets/course-1.jpg";
import course2 from "@/assets/course-2.jpg";
import course3 from "@/assets/course-3.jpg";
import course4 from "@/assets/course-4.jpg";
import mathsReasoningImg from "@/assets/course-maths-reasoning.jpg";
import tamilAmudhuImg from "@/assets/course-tamil-amudhu.jpg";
import tnTetImg from "@/assets/course-tn-tet.jpg";
import group2aMainsImg from "@/assets/course-tnpsc-group-2a-mains.jpg";
import group24Img from "@/assets/course-tnpsc-group-2-4.jpg";
import policeImg from "@/assets/course-tnusrb-police.jpg";

export type Course = {
  id: string;
  title: string;
  titleTa: string;
  /** Compact label used by filter tabs where the full title is too long. */
  shortTitle: string;
  track: string;
  duration: string;
  lessons: number;
  price: string;
  blurb: string;
  blurbTa: string;
  /** Short all-caps promise printed on the course thumbnail. */
  tagline: string;
  image: string;
  /** When true, show the uploaded photo without the branded colour overlay. */
  hasThumbnail?: boolean;
};

export const courses: Course[] = [
  {
    id: "tnpsc-group-2-4",
    title: "TNPSC Group II & IV Full Course",
    titleTa: "TNPSC குரூப் II & IV முழுப் பாடத்திட்டம்",
    shortTitle: "Group II & IV",
    track: "TNPSC",
    duration: "9 months",
    lessons: 214,
    price: "₹64,000",
    blurb:
      "General Tamil, Maths, Reasoning and General Studies for the Group II and IV prelims, taught in Tamil medium.",
    blurbTa:
      "குரூப் II மற்றும் IV முதல்நிலைத் தேர்வுக்கான பொதுத் தமிழ், கணிதம், அறிவுத்திறன் மற்றும் பொது அறிவு — தமிழ் வழியில்.",
    tagline: "Tamil medium · first test free",
    image: group24Img,
  },
  {
    id: "tn-tet",
    title: "TN TET / TRB-TET",
    titleTa: "ஆசிரியர் தகுதித் தேர்வு (TET)",
    shortTitle: "TET",
    track: "TET",
    duration: "6 months",
    lessons: 96,
    price: "₹42,000",
    blurb:
      "Child Development and Pedagogy unit by unit, with term-wise Tamil for the school classes the paper draws from.",
    blurbTa:
      "குழந்தை வளர்ச்சி மற்றும் கற்பித்தல் அலகு வாரியாக; தேர்வுக்குத் தேவையான வகுப்புகளின் தமிழ் பாடம் பருவம் வாரியாக.",
    tagline: "Unit-wise pedagogy · answer key",
    image: tnTetImg,
  },
  {
    id: "tnpsc-group-2a-mains",
    title: "TNPSC Group II-A Mains",
    titleTa: "TNPSC குரூப் II-A முதன்மைத் தேர்வு",
    shortTitle: "Group II-A Mains",
    track: "TNPSC",
    duration: "5 months",
    lessons: 128,
    price: "₹38,000",
    blurb:
      "Reasoning shortcuts and descriptive paper practice, with answer key explanation after every exam.",
    blurbTa:
      "அறிவுத்திறன் குறுக்கு வழிகள் மற்றும் விளக்கமான தாள் பயிற்சி; ஒவ்வொரு தேர்வுக்குப் பிறகும் விடைக்குறிப்பு விளக்கம்.",
    tagline: "Answer key expl. & practice",
    image: group2aMainsImg,
  },
  {
    id: "tnusrb-police",
    title: "TNUSRB Police — PC & SI",
    titleTa: "காவல்துறைத் தேர்வு (PC & SI)",
    shortTitle: "Police",
    track: "Police",
    duration: "8 weeks",
    lessons: 32,
    price: "₹28,000",
    blurb:
      "General Studies and Psychology for the constable and SI papers, with post-exam answer key sessions.",
    blurbTa:
      "காவலர் மற்றும் எஸ்.ஐ. தாள்களுக்கான பொது அறிவு மற்றும் உளவியல்; தேர்வுக்குப் பிறகு விடைக்குறிப்பு வகுப்பு.",
    tagline: "GK + psychology · PC & SI",
    image: policeImg,
  },
  {
    id: "tamil-amudhu-test-batch",
    title: "Tamil Amudhu Test Batch",
    titleTa: "தமிழ் அமுது தேர்வுத் தொகுப்பு",
    shortTitle: "Tamil Amudhu",
    track: "Test Batch",
    duration: "6 months",
    lessons: 54,
    price: "₹22,000",
    blurb:
      "A General Tamil test batch for Group II and IV aimed at 95+/100. First test is free and open to all.",
    blurbTa:
      "குரூப் II மற்றும் IV-க்கான பொதுத் தமிழ் தேர்வுத் தொகுப்பு; இலக்கு 95+/100. முதல் தேர்வு இலவசம், அனைவருக்கும் திறந்தது.",
    tagline: "Target 95+/100 in Tamil",
    image: tamilAmudhuImg,
  },
  {
    id: "maths-reasoning-pyq",
    title: "Maths & Reasoning PYQ Test Series",
    titleTa: "கணிதம் & அறிவுத்திறன் முந்தைய வினா தேர்வுத் தொடர்",
    shortTitle: "Maths & Reasoning",
    track: "Test Batch",
    duration: "2 months",
    lessons: 48,
    price: "₹16,000",
    blurb:
      "Live previous-year question tests in Maths and Reasoning, each followed by a shortcut walkthrough.",
    blurbTa:
      "கணிதம் மற்றும் அறிவுத்திறன் முந்தைய ஆண்டு வினாக்களுக்கான நேரடித் தேர்வுகள், குறுக்கு வழி விளக்கத்துடன்.",
    tagline: "PYQ tests + shortcut class",
    image: mathsReasoningImg,
  },
];

export type UpcomingClass = {
  id: string;
  title: string;
  track: string;
  faculty: string;
  day: string;
  time: string;
  mode: string;
  seatsLeft: number;
  image: string;
};

export const upcomingClasses: UpcomingClass[] = [
  {
    id: "u1",
    title: "Polity Clinic — Basic Structure Doctrine",
    track: "Prelims",
    faculty: "R. Krishnan",
    day: "Mon, 31 Aug",
    time: "7:00 pm IST",
    mode: "Live online",
    seatsLeft: 12,
    image: course1,
  },
  {
    id: "u2",
    title: "Map Lab — Peninsular Rivers & Relief",
    track: "Optional",
    faculty: "S. Meera",
    day: "Wed, 2 Sep",
    time: "6:30 pm IST",
    mode: "Live online",
    seatsLeft: 8,
    image: course2,
  },
  {
    id: "u3",
    title: "Answer Writing Workshop — GS-II",
    track: "Mains",
    faculty: "A. Bhatt",
    day: "Thu, 3 Sep",
    time: "8:00 pm IST",
    mode: "Hybrid",
    seatsLeft: 20,
    image: course3,
  },
  {
    id: "u4",
    title: "Ethics Case Studies — Conflict of Interest",
    track: "Mains",
    faculty: "V. Nair",
    day: "Sat, 5 Sep",
    time: "10:30 am IST",
    mode: "Campus",
    seatsLeft: 6,
    image: course4,
  },
  {
    id: "u5",
    title: "CSAT Speed Drill — Data Interpretation",
    track: "Prelims",
    faculty: "S. Meera",
    day: "Sun, 6 Sep",
    time: "9:00 am IST",
    mode: "Live online",
    seatsLeft: 15,
    image: course2,
  },
  {
    id: "u6",
    title: "Mock Interview Board — Panel A",
    track: "Interview",
    faculty: "V. Nair",
    day: "Tue, 8 Sep",
    time: "4:00 pm IST",
    mode: "Campus",
    seatsLeft: 4,
    image: course4,
  },
];

export const youtubeChannelUrl = "https://www.youtube.com/@vibuthariasacademy";

export type Video = {
  /** YouTube video id — also used to build the thumbnail and embed URLs. */
  id: string;
  title: string;
  /** Matches a `courses[].id`, which drives the library tabs. */
  courseId: string;
  duration: string;
};

export const youtubeThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

export function youtubeIdFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be" || parsed.hostname.endsWith(".youtu.be")) {
      return parsed.pathname.split("/").filter(Boolean)[0] ?? "";
    }
    const fromQuery = parsed.searchParams.get("v");
    if (fromQuery) return fromQuery;
    const parts = parsed.pathname.split("/").filter(Boolean);
    const marker = parts.findIndex((part) => part === "embed" || part === "shorts" || part === "live");
    if (marker >= 0 && parts[marker + 1]) return parts[marker + 1];
  } catch {
    return "";
  }
  return "";
}

export function formatLectureDuration(minutes: number) {
  if (!Number.isFinite(minutes) || minutes < 1) return "";
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  if (hours && rest) return `${hours}h ${rest}m`;
  if (hours) return `${hours}h`;
  return `${minutes} min`;
}

/**
 * Embed params chosen to keep students inside the library: no related videos,
 * no annotations and no keyboard shortcut that jumps out to YouTube.
 */
export const youtubeEmbed = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&playsinline=1&fs=0`;

export const videos: Video[] = [
  {
    id: "Qpw2IEQw7iw",
    title: "Tamil Amudhu (General Tamil) — Special Test Batch for TNPSC Group II & IV",
    courseId: "tamil-amudhu-test-batch",
    duration: "3:13",
  },
  {
    id: "Rjyf3YPFbuA",
    title: "TNPSC Group II & IV New Test Batch — Tamil 95+/100, 6 months",
    courseId: "tamil-amudhu-test-batch",
    duration: "8:47",
  },
  {
    id: "dlJ001AdLSw",
    title: "TNPSC Group II & IV New Test Batch — first test free, open to all",
    courseId: "tnpsc-group-2-4",
    duration: "2:30",
  },
  {
    id: "8bfpoJo3WC4",
    title: "Group II & IV Uttham Sei Tamil Free Test — answer key explanation",
    courseId: "tnpsc-group-2-4",
    duration: "47:44",
  },
  {
    id: "M_JovJEzSu8",
    title: "Free TNPSC Group II & IV Full Model Test (Tamil & Maths) — offline and online",
    courseId: "tnpsc-group-2-4",
    duration: "1:58",
  },
  {
    id: "ChV3zlIDPB4",
    title: "Group II & IV Uttham Sei Free Test — Maths + Reasoning answer key",
    courseId: "maths-reasoning-pyq",
    duration: "1:09:08",
  },
  {
    id: "AERvVyzMt7A",
    title: "TNPSC Group II-A Mains 2026 — Reasoning answer key explanation",
    courseId: "tnpsc-group-2a-mains",
    duration: "57:02",
  },
  {
    id: "5lJOazi4FSM",
    title: "TNPSC Group II-A Mains — Reasoning: direction & distance",
    courseId: "tnpsc-group-2a-mains",
    duration: "1:05:47",
  },
  {
    id: "yiTtAsUo0Zo",
    title: "Police 2025 — பொது அறிவு / General Studies answer key explanation",
    courseId: "tnusrb-police",
    duration: "14:59",
  },
  {
    id: "Cv5mlNAYAOI",
    title: "Police 2025 — உளவியல் / Psychology answer key explanation",
    courseId: "tnusrb-police",
    duration: "16:21",
  },
  {
    id: "ggmcwhuolPI",
    title: "TN TET 2025 — Psychology answer key: Child Development and Pedagogy",
    courseId: "tn-tet",
    duration: "19:07",
  },
  {
    id: "Cd6kB2Jk6w4",
    title: "TN TET — 30 Tamil questions explained with book proof",
    courseId: "tn-tet",
    duration: "17:19",
  },
  {
    id: "OuhuzJPOKsM",
    title: "TN TET 2025 — Tamil answer key with proof",
    courseId: "tn-tet",
    duration: "8:18",
  },
  {
    id: "e1DL_kKZhO0",
    title: "TN TET 2025 — Psychology: most important abbreviations",
    courseId: "tn-tet",
    duration: "14:15",
  },
  {
    id: "rZ4z45YuP14",
    title: "TN TET 2025 — Tamil: 9th class 100 important questions",
    courseId: "tn-tet",
    duration: "32:59",
  },
  {
    id: "QVZptVIMhDg",
    title: "TN TET 2025 — Psychology unit 7: child development & socialization agencies",
    courseId: "tn-tet",
    duration: "18:53",
  },
  {
    id: "o3iPhxwnH-s",
    title: "TET 2025 — Psychology unit 6: ஆளுமை (personality)",
    courseId: "tn-tet",
    duration: "20:50",
  },
  {
    id: "A497poGbdBU",
    title: "TET 2025 — Psychology unit 5: child development & pedagogy",
    courseId: "tn-tet",
    duration: "21:48",
  },
  {
    id: "VP5kTjatOto",
    title: "TET 2025 — Psychology unit 4: child development & pedagogy",
    courseId: "tn-tet",
    duration: "24:16",
  },
  {
    id: "nCOfbOc9Id0",
    title: "TET 2025 — Psychology unit 3: child development & pedagogy",
    courseId: "tn-tet",
    duration: "24:19",
  },
  {
    id: "7Zkuf3TH5H0",
    title: "TN TET — Child Development previous year questions explanation",
    courseId: "tn-tet",
    duration: "11:27",
  },
  {
    id: "e_tLK7Te6cU",
    title: "TN TET — Tamil previous year questions explanation",
    courseId: "tn-tet",
    duration: "13:42",
  },
  {
    id: "PBSuSZsvSco",
    title: "TET 2025 — Tamil: 8th class 3rd term important questions",
    courseId: "tn-tet",
    duration: "10:41",
  },
  {
    id: "HF7nghHDO7g",
    title: "TET 2025 — Tamil: 8th class 2nd term important questions",
    courseId: "tn-tet",
    duration: "9:07",
  },
  {
    id: "bjnwuaekaIo",
    title: "TET 2025 — Tamil: 8th class 1st term important questions",
    courseId: "tn-tet",
    duration: "9:47",
  },
  {
    id: "R9vUcRkXmyA",
    title: "TN TET 2025 — Tamil: 7th class 3rd term important questions",
    courseId: "tn-tet",
    duration: "9:55",
  },
  {
    id: "hGs9KWTUdHA",
    title: "TN TET 2025 — Tamil: 7th class 2nd term important questions",
    courseId: "tn-tet",
    duration: "10:47",
  },
];

export type Branch = {
  town: string;
  townTa: string;
  lines: string[];
};

export const branches: Branch[] = [
  {
    town: "Sankarankovil",
    townTa: "சங்கரன்கோவில்",
    lines: [
      "7th Street, Ramasamyapuram",
      "Near Annamalai Hotel",
      "Bus Stand back side",
      "Sankarankovil - 627756",
    ],
  },
  {
    town: "Puliangudi",
    townTa: "புளியங்குடி",
    lines: ["32-A, Gangaiamman Kovil Street", "Gandhi Bazar", "Puliangudi - 627855"],
  },
  {
    town: "Kadayam",
    townTa: "கடையம்",
    lines: [
      "118-F, Indian Bank Complex",
      "Kadayam Main Road",
      "Near Union Bus Stop",
      "Kadayam - 627415",
    ],
  },
];

export const officePhone = {
  label: "82489 42219",
  href: "tel:+918248942219",
};

export const officeEmail = {
  label: "vibutharacademy@gmail.com",
  href: "mailto:vibutharacademy@gmail.com",
};
