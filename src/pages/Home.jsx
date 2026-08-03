import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "../components/Navbar";
import Footer from "../components/Footer";
import { BROCHURE_PDF_URL } from "../config/api";
import AnimatedCounter from "../components/Common/AnimatedCounter";
import { staggerContainer, staggerItem, viewportOnce } from "../utils/animationVariants";
import {
  FilePlus,
  ClipboardCheck,
  GraduationCap,
  UserCircle,
  ArrowRight,
  CheckCircle2,
  FileDown,
  Play,
  Bot,
  Layers,
  SlidersHorizontal,
  MousePointerClick,
  School,
  PenTool,
  ClipboardList,
  BarChart3,
  Video,
  Wand2,
  NotebookPen,
  Star,
  Quote,
  Mail,
  Send,
  Cpu,
  Rocket,
  Bookmark,
  Printer,
  BookOpen,
} from "lucide-react";

/**
 * Poetree Publications — public landing page.
 *
 * Redesigned as a modern ed-tech landing: two-column hero, quick-search strip,
 * colourful category cards, a stats band, "who it's for", a tools row,
 * testimonials + brochure, and a newsletter CTA.
 *
 * Every CTA points at a route that actually exists. Gated product areas route to
 * /auth/register (or /auth/login); "Videos" points at the public /animations page.
 */

// --- Content -------------------------------------------------------------

// Hero feature bullets (labels match the hero illustration).
const HERO_FEATURES = [
  { icon: Cpu, label: "AI Question Paper Generator", color: "text-violet-600" },
  { icon: Rocket, label: "AI-Powered Performance", color: "text-indigo-600" },
  { icon: Bookmark, label: "School-Board Syllabus Aligned", color: "text-emerald-600" },
  { icon: Printer, label: "Print-Ready Resources", color: "text-rose-600" },
  { icon: ClipboardCheck, label: "Instant & Smart Assessments", color: "text-amber-600" },
  { icon: BookOpen, label: "Multi-Subject Support", color: "text-teal-600" },
];

// The six big category cards. `to` is always a real route.
const CATEGORIES = [
  {
    icon: Bot,
    title: "AI Question Paper Generator",
    description: "Create customized question papers in minutes with multiple question types.",
    cta: "Try Now",
    to: "/auth/register",
    accent: "blue",
    art: "/cards/ai-paper.svg",
  },
  {
    icon: FilePlus,
    title: "Worksheets",
    description: "Download printable worksheets by subject, board and standard.",
    cta: "Explore",
    to: "/auth/register",
    accent: "emerald",
    art: "/cards/worksheets.svg",
  },
  {
    icon: ClipboardCheck,
    title: "Answer Sheets",
    description: "Answer sheets and step-by-step solutions aligned to every paper.",
    cta: "Browse",
    to: "/auth/register",
    accent: "amber",
    art: "/cards/answer-sheets.svg",
  },
  {
    icon: Video,
    title: "Educational Videos",
    description: "Engaging animations & concept videos — free to watch, no login.",
    cta: "Watch Now",
    to: "/animations",
    accent: "violet",
    art: "/cards/videos.svg",
  },
  {
    icon: ClipboardList,
    title: "Tests & Assessments",
    description: "Build quizzes and live tests, then track results in one place.",
    cta: "Start Test",
    to: "/auth/register",
    accent: "rose",
    art: "/cards/tests.svg",
  },
  {
    icon: School,
    title: "Teacher & School Solutions",
    description: "Smart digital tools to manage teaching, learning & assessment.",
    cta: "Know More",
    to: "/auth/register",
    accent: "sky",
    art: "/cards/school.svg",
  },
];

// Tailwind classes per accent (kept as full class strings so JIT doesn't purge them).
const ACCENTS = {
  blue: { tint: "bg-blue-50", ring: "border-blue-100", icon: "bg-blue-100 text-blue-600", link: "text-blue-600", grad: "from-blue-500 to-blue-600" },
  emerald: { tint: "bg-emerald-50", ring: "border-emerald-100", icon: "bg-emerald-100 text-emerald-600", link: "text-emerald-600", grad: "from-emerald-500 to-emerald-600" },
  amber: { tint: "bg-amber-50", ring: "border-amber-100", icon: "bg-amber-100 text-amber-600", link: "text-amber-600", grad: "from-amber-500 to-amber-600" },
  violet: { tint: "bg-violet-50", ring: "border-violet-100", icon: "bg-violet-100 text-violet-600", link: "text-violet-600", grad: "from-violet-500 to-fuchsia-600" },
  rose: { tint: "bg-rose-50", ring: "border-rose-100", icon: "bg-rose-100 text-rose-600", link: "text-rose-600", grad: "from-rose-500 to-pink-600" },
  sky: { tint: "bg-sky-50", ring: "border-sky-100", icon: "bg-sky-100 text-sky-600", link: "text-sky-600", grad: "from-sky-500 to-indigo-600" },
};

// "How it works" — the 4-step paper generation flow.
const PAPER_STEPS = [
  {
    icon: Layers,
    title: "Choose your context",
    description: "Pick the subject, board and standard. Everything you see is aligned to that class.",
  },
  {
    icon: Bot,
    title: "Add questions",
    description: "Select from the ready question bank, or let the AI generator build a full set for you.",
  },
  {
    icon: SlidersHorizontal,
    title: "Configure marks & sections",
    description: "Set per-question marks, arrange sections, add your school header — full control.",
  },
  {
    icon: FileDown,
    title: "Preview & download",
    description: "See a live preview of the exact paper, then export a clean, print-ready PDF.",
  },
];

// Two ways to create a paper.
const CREATE_MODES = [
  {
    icon: MousePointerClick,
    tag: "Manual Builder",
    title: "Build it yourself, exactly your way",
    grad: "from-blue-500 to-indigo-600",
    points: [
      "Pick questions from the bank by subject & chapter",
      "Mix MCQs, short, long, fill-in-the-blanks & more",
      "Reorder sections and set marks per question",
      "Add your school header and download the PDF",
    ],
  },
  {
    icon: Wand2,
    tag: "AI Generator",
    title: "Let AI draft a full paper in seconds",
    grad: "from-violet-500 to-fuchsia-600",
    points: [
      "Choose chapters and how much weight each gets",
      "Set the easy / medium / hard difficulty split",
      "Pick how many questions of each type you need",
      "Review, tweak anything, and export instantly",
    ],
  },
];

const STATS = [
  { value: 500, suffix: "+", label: "Happy Teachers" },
  { value: 50, suffix: "+", label: "Schools" },
  { value: 10000, suffix: "+", label: "Papers Created" },
  { value: 50, suffix: "+", label: "Subjects" },
  { value: 2000, suffix: "+", label: "Worksheets" },
];

const AUDIENCES = [
  {
    icon: UserCircle,
    title: "For Teachers",
    description: "Save time, create better assessments and engage your students.",
    grad: "from-blue-500 to-indigo-500",
    to: "/auth/register",
  },
  {
    icon: School,
    title: "For Schools",
    description: "Digital solutions to manage teaching, content & learning at scale.",
    grad: "from-emerald-500 to-teal-500",
    to: "/auth/register",
  },
  {
    icon: GraduationCap,
    title: "For Students",
    description: "Learn with interactive videos, practice worksheets and tests.",
    grad: "from-violet-500 to-fuchsia-500",
    to: "/animations",
  },
];

const TOOLS = [
  { icon: Wand2, label: "Question Paper Generator", to: "/auth/register" },
  { icon: NotebookPen, label: "Worksheet Builder", to: "/auth/register" },
  { icon: ClipboardCheck, label: "Answer Sheet Generator", to: "/auth/register" },
  { icon: PenTool, label: "Online Test Creator", to: "/auth/register" },
  { icon: Video, label: "Animation Library", to: "/animations" },
  { icon: BarChart3, label: "Result & Report Analysis", to: "/auth/register" },
];

const TESTIMONIALS = [
  {
    quote: "Poetree Publications has reduced my preparation time by 70%. All question papers and worksheets are excellent!",
    name: "Neha Sharma",
    role: "Teacher, Ahmedabad",
  },
  {
    quote: "Worksheets are well-designed and help my students practice better. Highly recommended for all teachers.",
    name: "Ramesh Patel",
    role: "Principal, Rajkot",
  },
  {
    quote: "The educational videos are amazing! My students understand concepts so much better now.",
    name: "Priya Mehta",
    role: "Teacher, Vadodara",
  },
];

// --- Component -----------------------------------------------------------

const Home = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) setSubscribed(true);
  };

  const brochureProps = {
    href: BROCHURE_PDF_URL || "#",
    target: BROCHURE_PDF_URL ? "_blank" : undefined,
    rel: BROCHURE_PDF_URL ? "noopener noreferrer" : undefined,
    onClick: !BROCHURE_PDF_URL ? (e) => e.preventDefault() : undefined,
  };

  return (
    <>
      <Navbar />

      {/* ============================= HERO ============================= */}
      {/* Real HTML text on the left (crisp & responsive) + the illustration
          cropped from the reference image on the right. */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-blue-50">
        {/* soft decorative blobs */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute -top-24 -right-16 w-96 h-96 rounded-full bg-blue-200/40 blur-3xl" />
          <div className="absolute top-40 -left-24 w-80 h-80 rounded-full bg-violet-200/40 blur-3xl" />
        </div>

        {/* decorative paper plane */}
        <motion.img
          src="/paper-plane.svg"
          alt=""
          aria-hidden
          className="hidden lg:block absolute top-24 left-[46%] w-16 pointer-events-none"
          initial={{ opacity: 0, y: 10, x: -10 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-8 items-center">
            {/* Left: copy */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                Empowering Education.
                <br />
                <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                  Inspiring Futures.
                </span>
              </h1>
              <p className="mt-5 text-lg text-slate-600 max-w-xl">
                Everything teachers need to teach better and students need to learn smarter.
              </p>

              {/* feature bullets */}
              <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4">
                {HERO_FEATURES.map(({ icon: Icon, label, color }) => (
                  <div key={label} className="flex items-center gap-3 text-slate-700">
                    <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-white shadow-sm border border-slate-100 flex items-center justify-center">
                      <Icon className={`w-5 h-5 ${color}`} />
                    </span>
                    <span className="text-sm font-semibold leading-tight">{label}</span>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="mt-9 flex flex-wrap gap-4">
                <Link
                  to="/auth/register"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-600/25 transition"
                >
                  Explore Tools
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/animations"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold border border-slate-200 shadow-sm transition"
                >
                  <Play className="w-5 h-5 text-blue-600" fill="currentColor" />
                  Watch Demo
                </Link>
              </div>
            </motion.div>

            {/* Right: illustration cropped from the reference image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
              className="relative"
            >
              <img
                src="/hero-cut.webp"
                alt="A teacher and student learning together with an AI assistant — Poetree Publications"
                className="w-full h-auto max-w-lg mx-auto lg:max-w-none"
                fetchpriority="high"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ======================= CATEGORY CARDS ======================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="initial"
            whileInView="animate"
            viewport={viewportOnce}
            variants={staggerContainer}
          >
            {CATEGORIES.map(({ icon: Icon, title, description, cta, to, accent, art }) => {
              const a = ACCENTS[accent];
              return (
                <motion.div key={title} variants={staggerItem} whileHover={{ y: -6 }}>
                  <Link
                    to={to}
                    className={`group relative block h-full overflow-hidden rounded-2xl ${a.tint} border ${a.ring} p-7 pb-24 transition-shadow hover:shadow-xl`}
                  >
                    <div className={`w-14 h-14 rounded-2xl ${a.icon} flex items-center justify-center mb-5`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 max-w-[70%]">{title}</h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-[75%]">{description}</p>
                    <span className={`mt-5 inline-flex items-center gap-1.5 text-sm font-semibold ${a.link}`}>
                      {cta}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                    {/* card illustration — drops in /cards/*.png, otherwise nothing shows */}
                    {art && (
                      <SmartImage
                        src={art}
                        alt=""
                        imgClassName="pointer-events-none absolute bottom-3 right-3 w-28 h-28 object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ==================== HOW PAPER GENERATION WORKS ==================== */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <SectionHeading
            eyebrow="How it works"
            title="Create a question paper in 4 simple steps"
            subtitle="From an empty page to a print-ready paper in minutes — no design skills needed."
          />
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="initial"
            whileInView="animate"
            viewport={viewportOnce}
            variants={staggerContainer}
          >
            {PAPER_STEPS.map(({ icon: Icon, title, description }, i) => (
              <motion.div
                key={title}
                variants={staggerItem}
                className="relative rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-lg transition-shadow p-7"
              >
                <span className="absolute top-5 right-6 text-5xl font-black text-slate-100 select-none">
                  {i + 1}
                </span>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-slate-800">{title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{description}</p>
              </motion.div>
            ))}
          </motion.div>
          <div className="mt-12 text-center">
            <Link
              to="/auth/register"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-600/25 transition"
            >
              Start creating your paper
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ==================== TWO WAYS TO CREATE ==================== */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <SectionHeading
            eyebrow="Two ways to create"
            title="Do it manually, or let AI do the heavy lifting"
            subtitle="Full manual control when you want it, one-click AI drafting when you're short on time."
          />
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            initial="initial"
            whileInView="animate"
            viewport={viewportOnce}
            variants={staggerContainer}
          >
            {CREATE_MODES.map(({ icon: Icon, tag, title, grad, points }) => (
              <motion.div
                key={tag}
                variants={staggerItem}
                className="rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-shadow p-8"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-white shadow-lg`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{tag}</span>
                    <h3 className="text-xl font-bold text-slate-800">{title}</h3>
                  </div>
                </div>
                <ul className="mt-6 space-y-3">
                  {points.map((p) => (
                    <li key={p} className="flex items-start gap-3 text-slate-700">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{p}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/auth/register"
                  className="mt-7 inline-flex items-center gap-1.5 text-blue-600 font-semibold hover:text-blue-700"
                >
                  Get started
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* =========================== STATS =========================== */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-12 shadow-xl">
            <motion.div
              className="grid grid-cols-2 md:grid-cols-5 gap-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.5 }}
            >
              {STATS.map((s) => (
                <div key={s.label}>
                  <div className="text-3xl md:text-4xl font-extrabold text-white">
                    <AnimatedCounter value={s.value} suffix={s.suffix} duration={1800} />
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-400">{s.label}</p>
                </div>
              ))}
            </motion.div>
            <p className="mt-8 text-center text-slate-400 text-sm">
              Trusted by teachers &amp; schools across India
            </p>
          </div>
        </div>
      </section>

      {/* ====================== WHO IS POETREE FOR ====================== */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <SectionHeading
            eyebrow="Who is Poetree for?"
            title="Made for everyone in the classroom"
            subtitle="One platform that supports teachers, schools and students alike."
          />
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            initial="initial"
            whileInView="animate"
            viewport={viewportOnce}
            variants={staggerContainer}
          >
            {AUDIENCES.map(({ icon: Icon, title, description, grad, to }) => (
              <motion.div
                key={title}
                variants={staggerItem}
                whileHover={{ y: -6 }}
                className="rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-shadow p-8 text-center"
              >
                <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-white shadow-lg`}>
                  <Icon className="w-8 h-8" />
                </div>
                <h3 className="mt-5 text-xl font-bold text-slate-800">{title}</h3>
                <p className="mt-2 text-slate-600">{description}</p>
                <Link to={to} className="mt-5 inline-flex items-center gap-1.5 text-blue-600 font-semibold hover:text-blue-700">
                  Learn More
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ======================== POPULAR TOOLS ======================== */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <SectionHeading
            eyebrow="Popular Tools for You"
            title="Everything you need to create & assess"
          />
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
            initial="initial"
            whileInView="animate"
            viewport={viewportOnce}
            variants={staggerContainer}
          >
            {TOOLS.map(({ icon: Icon, label, to }) => (
              <motion.div key={label} variants={staggerItem} whileHover={{ y: -4 }}>
                <Link
                  to={to}
                  className="flex flex-col items-center text-center gap-3 h-full rounded-2xl bg-white border border-slate-100 p-5 shadow-sm hover:shadow-md hover:border-blue-100 transition"
                >
                  <span className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </span>
                  <span className="text-sm font-semibold text-slate-700 leading-snug">{label}</span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ======================== TESTIMONIALS ======================== */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <SectionHeading
            eyebrow="What Teachers Say About Us"
            title="Loved by educators everywhere"
          />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* three testimonials in a nested grid */}
            <motion.div
              className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6"
              initial="initial"
              whileInView="animate"
              viewport={viewportOnce}
              variants={staggerContainer}
            >
              {TESTIMONIALS.map((t) => (
                <motion.div
                  key={t.name}
                  variants={staggerItem}
                  className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6 flex flex-col"
                >
                  <Quote className="w-8 h-8 text-blue-200" />
                  <div className="flex gap-0.5 mt-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-amber-400" fill="currentColor" />
                    ))}
                  </div>
                  <p className="mt-3 text-slate-700 leading-relaxed flex-1">“{t.quote}”</p>
                  <div className="mt-5 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{t.name}</p>
                      <p className="text-xs text-slate-500">{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* brochure / "take it anywhere" card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.5 }}
              className="rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-900 p-8 text-white flex flex-col justify-center"
            >
              <h3 className="text-2xl font-bold">Take learning anywhere</h3>
              <p className="mt-3 text-slate-300">
                Get the full catalogue of papers, worksheets and resources. Download our brochure to see everything Poetree offers.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <a
                  {...brochureProps}
                  className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition ${
                    BROCHURE_PDF_URL
                      ? "bg-white text-slate-900 hover:bg-slate-100"
                      : "bg-white/10 text-white/60 border border-white/10 cursor-not-allowed"
                  }`}
                  title={BROCHURE_PDF_URL ? "Open brochure PDF" : "Brochure link coming soon"}
                >
                  <FileDown className="w-5 h-5" />
                  Download Brochure
                </a>
                <Link
                  to="/auth/register"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/20 transition"
                >
                  Create free account
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================= NEWSLETTER ========================= */}
      <section className="px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-12 sm:px-12 text-center shadow-xl">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 text-white mb-5">
              <Mail className="w-7 h-7" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              Stay updated with the latest resources
            </h2>
            <p className="mt-3 text-white/80 max-w-xl mx-auto">
              Subscribe to our newsletter and never miss a new paper, worksheet or update.
            </p>
            {subscribed ? (
              <div className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-emerald-700 font-semibold">
                <CheckCircle2 className="w-5 h-5" />
                Thanks for subscribing!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="flex-1 px-5 py-3 rounded-xl bg-white outline-none text-slate-700 placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition"
                >
                  <Send className="w-4 h-4" />
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

/**
 * Renders an <img>, but if the file is missing/broken it swaps to `fallback`
 * (or renders nothing). Lets us design for illustrations that may not be added
 * to /public yet — the layout never shows a broken-image icon.
 */
const SmartImage = ({ src, alt, imgClassName = "", fallback = null }) => {
  const [failed, setFailed] = useState(false);
  if (failed) return fallback;
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={imgClassName}
      onError={() => setFailed(true)}
    />
  );
};

// Shared section heading with a coloured eyebrow.
const SectionHeading = ({ eyebrow, title, subtitle }) => (
  <motion.div
    className="text-center mb-12"
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={viewportOnce}
    transition={{ duration: 0.5 }}
  >
    {eyebrow && (
      <span className="inline-block text-sm font-bold uppercase tracking-wider text-blue-600 mb-3">
        {eyebrow}
      </span>
    )}
    <h2 className="text-3xl md:text-4xl font-bold text-slate-900">{title}</h2>
    {subtitle && <p className="mt-4 text-slate-600 text-lg max-w-2xl mx-auto">{subtitle}</p>}
  </motion.div>
);

export default Home;
