import React from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { Navbar } from "../components/Navbar";
import Footer from "../components/Footer";
import { BROCHURE_PDF_URL } from "../config/api";
import AnimatedCounter from "../components/Common/AnimatedCounter";
import { fadeInUp, staggerContainer, staggerItem, viewportOnce } from "../utils/animationVariants";
import {
  FileText,
  BookOpen,
  FilePlus,
  ClipboardCheck,
  GraduationCap,
  UserCircle,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  FileDown,
  Play,
  Film,
  Target,
  Flag,
  ShieldCheck,
  Award,
  School,
  BookMarked,
  ChevronDown,
} from "lucide-react";

const Home = () => {
  const features = [
    {
      icon: FileText,
      title: "Question Papers",
      description: "Create and customize exam papers with multiple question types. Build from scratch or use your saved papers.",
      color: "from-blue-500 to-blue-600",
      bgLight: "bg-blue-50",
      iconBg: "bg-blue-100",
    },
    {
      icon: BookOpen,
      title: "Prebuilt Questions",
      description: "Start with ready-made templates. Pick a template, customize questions, and generate papers in minutes.",
      color: "from-indigo-500 to-indigo-600",
      bgLight: "bg-indigo-50",
      iconBg: "bg-indigo-100",
    },
    {
      icon: FilePlus,
      title: "Practice Worksheets",
      description: "Access worksheets by subject and standard. Perfect for daily practice and revision.",
      color: "from-emerald-500 to-emerald-600",
      bgLight: "bg-emerald-50",
      iconBg: "bg-emerald-100",
    },
    {
      icon: ClipboardCheck,
      title: "Answer Sheets",
      description: "Download answer sheets and solutions. Aligned with your subject, board, and standard.",
      color: "from-amber-500 to-amber-600",
      bgLight: "bg-amber-50",
      iconBg: "bg-amber-100",
    },
  ];

  const forTeachers = [
    "Create question papers with MCQs, short & long answers, fill-in-blanks",
    "Use prebuilt templates or build from scratch",
    "Filter by subject, subject title, board & standard",
    "Manage worksheets and answer sheets in one place",
  ];

  const forStudents = [
    "Access question papers and worksheets by your class & subject",
    "Practice with worksheets and view answer sheets",
    "Clear filtering by subject, board and standard",
    "Everything in one dashboard—no clutter",
  ];

  const visionMission = {
    vision: "To be the most trusted name in educational content—empowering every teacher and student with quality question papers, worksheets, and learning resources aligned to their curriculum.",
    mission: "To simplify paper creation and practice for schools by delivering board-aligned, standard-wise content and tools that save time and improve learning outcomes.",
  };

  const trustBadges = [
    { icon: Award, label: "Quality content", sub: "Reviewed & curriculum-aligned" },
    { icon: BookMarked, label: "Board-aligned", sub: "CBSE, State boards & more" },
    { icon: School, label: "For schools", sub: "Trusted by teachers & institutions" },
    { icon: ShieldCheck, label: "Reliable & secure", sub: "Your data and content, safe" },
  ];

  const prefersReducedMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const heroBgY = useTransform(scrollY, [0, 400], [0, prefersReducedMotion ? 0 : 80]);
  const heroOpacity = useTransform(scrollY, [0, 200], [1, prefersReducedMotion ? 1 : 0.3]);

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        {/* Floating gradient blobs - very subtle; no motion when reduced motion preferred */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          <motion.div
            className="absolute w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-3xl -top-40 -right-40"
            animate={prefersReducedMotion ? undefined : { x: [0, 20, 0], y: [0, -15, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute w-[300px] h-[300px] rounded-full bg-indigo-500/10 blur-3xl bottom-20 -left-20"
            animate={prefersReducedMotion ? undefined : { x: [0, -15, 0], y: [0, 20, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute w-[250px] h-[250px] rounded-full bg-slate-400/5 blur-2xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            animate={prefersReducedMotion ? undefined : { scale: [1, 1.15, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        {/* Parallax background image */}
        <motion.div
          className="absolute inset-0 bg-[url('/s1.jpg')] bg-cover bg-center opacity-20"
          style={{ y: heroBgY }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-slate-900/50" />
        <motion.div
          className="relative z-10 max-w-5xl mx-auto px-6 py-20 text-center"
          style={{ opacity: heroOpacity }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/90 text-sm font-medium mb-8"
          >
            <Sparkles className="w-4 h-4" />
            For Teachers & Schools
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight"
          >
            Create Papers.
            <br />
            <span className="bg-gradient-to-r from-blue-300 to-indigo-300 bg-clip-text text-transparent">
              Teach Smarter.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
            className="mt-6 text-lg md:text-xl text-slate-300 max-w-2xl mx-auto"
          >
            Question papers, worksheets, and answer sheets—all in one place. Choose your subject, board & standard and get started.
          </motion.p>
          <motion.div
            initial="initial"
            animate="animate"
            variants={staggerContainer}
            className="mt-10 flex flex-wrap justify-center gap-4"
          >
            {[
              { to: "/auth/register", primary: true, label: "Get Started", icon: ArrowRight },
              { to: "/auth/login", primary: false, label: "Sign In", icon: null },
              { brochure: true },
            ].map((item, i) => (
              <motion.div key={i} variants={staggerItem}>
                {item.brochure ? (
                  <a
                    href={BROCHURE_PDF_URL || "#"}
                    target={BROCHURE_PDF_URL ? "_blank" : undefined}
                    rel={BROCHURE_PDF_URL ? "noopener noreferrer" : undefined}
                    onClick={!BROCHURE_PDF_URL ? (e) => e.preventDefault() : undefined}
                    className={`inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold border transition ${
                      BROCHURE_PDF_URL
                        ? "bg-white/10 hover:bg-white/20 text-white border-white/20"
                        : "bg-white/5 text-white/60 border-white/10 cursor-not-allowed"
                    }`}
                    title={BROCHURE_PDF_URL ? "Open brochure PDF" : "Brochure link will be added soon"}
                  >
                    <FileDown className="w-5 h-5" />
                    Download Brochure
                  </a>
                ) : item.primary ? (
                  <Link
                    to={item.to}
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-lg shadow-blue-500/30 transition duration-300 hover:shadow-xl hover:shadow-blue-500/40"
                  >
                    {item.label}
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                ) : (
                  <Link
                    to={item.to}
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/20 transition"
                  >
                    {item.label}
                  </Link>
                )}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 hidden sm:block"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center gap-1 text-white/70"
          >
            <span className="text-xs font-medium uppercase tracking-wider">Scroll</span>
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </section>

      {/* Features - What Poetree offers */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800">
              Everything you need in one place
            </h2>
            <p className="mt-4 text-slate-600 text-lg max-w-2xl mx-auto">
              Poetree helps teachers create and manage exam content—and gives students easy access to papers, worksheets, and answers.
            </p>
          </motion.div>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
            initial="initial"
            whileInView="animate"
            viewport={viewportOnce}
            variants={staggerContainer}
          >
            {features.map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  variants={staggerItem}
                  whileHover={{ scale: 1.03, transition: { duration: 0.3, ease: "easeOut" } }}
                  className={`${item.bgLight} rounded-2xl p-8 border border-slate-100 transition-all duration-300 ease-out hover:shadow-xl hover:border-slate-200 hover:shadow-slate-200/50`}
                >
                  <motion.div
                    className={`${item.iconBg} w-14 h-14 rounded-xl flex items-center justify-center mb-6 text-slate-700`}
                    whileHover={{ scale: 1.08, y: -2, transition: { duration: 0.25 } }}
                  >
                    <Icon className="w-7 h-7" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-slate-800">{item.title}</h3>
                  <p className="mt-3 text-slate-600">{item.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Link
              to="/auth/register"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
            >
              Create your account and start
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats - animated counters (lightweight strip) */}
      <section className="py-12 px-6 bg-white border-y border-slate-100">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="grid grid-cols-3 gap-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.5 }}
          >
            <div>
              <div className="text-3xl md:text-4xl font-bold text-slate-800">
                <AnimatedCounter value={500} suffix="+" duration={1800} />
              </div>
              <p className="mt-1 text-sm font-medium text-slate-500">Teachers</p>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-slate-800">
                <AnimatedCounter value={10000} suffix="+" duration={2000} />
              </div>
              <p className="mt-1 text-sm font-medium text-slate-500">Papers created</p>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-slate-800">
                <AnimatedCounter value={50} suffix="+" duration={1600} />
              </div>
              <p className="mt-1 text-sm font-medium text-slate-500">Subjects</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800">
              Our Vision & Mission
            </h2>
            <p className="mt-4 text-slate-600 text-lg max-w-2xl mx-auto">
              Why we exist and what we strive for at Poetree Publication.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4 }}
              className="rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/50 p-8 border border-slate-100 shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className="w-14 h-14 rounded-xl bg-blue-500 flex items-center justify-center mb-6">
                <Target className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Our Vision</h3>
              <p className="text-slate-600 leading-relaxed">
                {visionMission.vision}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/50 p-8 border border-slate-100 shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className="w-14 h-14 rounded-xl bg-indigo-500 flex items-center justify-center mb-6">
                <Flag className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Our Mission</h3>
              <p className="text-slate-600 leading-relaxed">
                {visionMission.mission}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust / Publication graphics - why trust Poetree */}
      <section className="py-16 px-6 bg-slate-50 border-y border-slate-200/60">
        <div className="max-w-6xl mx-auto">
          <motion.p
            className="text-center text-sm font-semibold uppercase tracking-wider text-slate-500 mb-10"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.4 }}
          >
            Why trust Poetree Publication
          </motion.p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {trustBadges.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.35, delay: i * 0.06 }}
                  whileHover={{ y: -4, transition: { duration: 0.25 } }}
                  className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-shadow duration-300"
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mb-4 text-white shadow-lg shadow-blue-500/25">
                    <Icon className="w-7 h-7" />
                  </div>
                  <span className="font-bold text-slate-800">{item.label}</span>
                  <span className="text-sm text-slate-500 mt-1">{item.sub}</span>
                </motion.div>
              );
            })}
          </div>
          <motion.div
            className="mt-12 flex flex-wrap items-center justify-center gap-x-10 gap-y-4"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white border border-slate-100 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-white font-bold text-sm">
                PP
              </div>
              <div className="text-left">
                <span className="block font-semibold text-slate-800">Poetree Publication</span>
                <span className="text-xs text-slate-500">Educational content you can trust</span>
              </div>
            </div>
            <div className="text-slate-400 text-sm font-medium">
              Question papers • Worksheets • Answer sheets • Animations
            </div>
          </motion.div>
        </div>
      </section>

      {/* Animations - Watch without login */}
      <section className="py-20 px-6 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50/50 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-center mb-14"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 text-violet-700 text-sm font-semibold mb-6">
              <Film className="w-4 h-4" />
              Free to watch
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 tracking-tight">
              Learning animations & videos
            </h2>
            <p className="mt-4 text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed">
              Watch subject-wise educational videos and animations. No login required—open and play anytime.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
            className="relative"
          >
            <Link
              to="/animations"
              className="group flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 p-8 sm:p-10 rounded-3xl bg-white border-2 border-violet-100 shadow-xl shadow-violet-500/10 hover:shadow-2xl hover:shadow-violet-500/20 hover:border-violet-200 transition-all duration-300 text-left"
            >
              <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                <Play className="w-10 h-10 text-white ml-1" fill="currentColor" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-xl sm:text-2xl font-bold text-slate-800 group-hover:text-violet-700 transition-colors">
                  Watch animations
                </h3>
                <p className="mt-2 text-slate-600">
                  Browse by subject, board & standard. Click any video to play in full screen.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-500 text-white font-semibold group-hover:bg-violet-600 transition-colors">
                Watch now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* For Teachers & Students */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800">
              Built for teachers and students
            </h2>
            <p className="mt-4 text-slate-600 text-lg max-w-2xl mx-auto">
              Poetree supports both educators and learners with the right tools in one dashboard.
            </p>
          </motion.div>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-10"
            initial="initial"
            whileInView="animate"
            viewport={viewportOnce}
            variants={staggerContainer}
          >
            {/* For Teachers */}
            <motion.div
              variants={staggerItem}
              className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-8 border border-blue-100"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
                  <UserCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">For Teachers</h3>
              </div>
              <ul className="space-y-4">
                {forTeachers.map((text, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-700">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
            {/* For Students */}
            <motion.div
              variants={staggerItem}
              className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-8 border border-emerald-100"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">For Students</h3>
              </div>
              <ul className="space-y-4">
                {forStudents.map((text, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-700">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-br from-slate-800 to-indigo-900">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Ready to create better papers?
          </h2>
          <p className="mt-4 text-slate-300 text-lg">
            Join Poetree Publication. Choose your subject, board & standard and start in minutes.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <motion.div
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                to="/auth/register"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-500 text-white font-semibold shadow-lg shadow-blue-500/30 transition-all duration-300 hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-500/40"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
            <Link
              to="/auth/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/20 transition"
            >
              Sign In
            </Link>
            <a
              href={BROCHURE_PDF_URL || "#"}
              target={BROCHURE_PDF_URL ? "_blank" : undefined}
              rel={BROCHURE_PDF_URL ? "noopener noreferrer" : undefined}
              onClick={!BROCHURE_PDF_URL ? (e) => e.preventDefault() : undefined}
              className={`inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold border transition ${
                BROCHURE_PDF_URL
                  ? "bg-white/10 hover:bg-white/20 text-white border-white/20"
                  : "bg-white/5 text-white/60 border-white/10 cursor-not-allowed"
              }`}
              title={BROCHURE_PDF_URL ? "Open brochure PDF" : "Brochure link will be added soon"}
            >
              <FileDown className="w-5 h-5" />
              Download Brochure
            </a>
          </div>
        </motion.div>
      </section>

      <Footer />
    </>
  );
};

export default Home;
