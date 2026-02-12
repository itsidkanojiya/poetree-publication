import React from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import Footer from "../components/Footer";
import { BROCHURE_PDF_URL } from "../config/api";
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

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="absolute inset-0 bg-[url('/s1.jpg')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-slate-900/50" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/90 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            For Teachers & Schools
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight">
            Create Papers.
            <br />
            <span className="bg-gradient-to-r from-blue-300 to-indigo-300 bg-clip-text text-transparent">
              Teach Smarter.
            </span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-slate-300 max-w-2xl mx-auto">
            Question papers, worksheets, and answer sheets—all in one place. Choose your subject, board & standard and get started.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/auth/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-lg shadow-blue-500/30 transition"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
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
        </div>
      </section>

      {/* Features - What Poetree offers */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800">
              Everything you need in one place
            </h2>
            <p className="mt-4 text-slate-600 text-lg max-w-2xl mx-auto">
              Poetree helps teachers create and manage exam content—and gives students easy access to papers, worksheets, and answers.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className={`${item.bgLight} rounded-2xl p-8 border border-slate-100 hover:shadow-xl hover:border-slate-200 transition-all duration-300`}
                >
                  <div
                    className={`${item.iconBg} w-14 h-14 rounded-xl flex items-center justify-center mb-6 text-slate-700`}
                  >
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">{item.title}</h3>
                  <p className="mt-3 text-slate-600">{item.description}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-12 text-center">
            <Link
              to="/auth/register"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
            >
              Create your account and start
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* For Teachers & Students */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800">
              Built for teachers and students
            </h2>
            <p className="mt-4 text-slate-600 text-lg max-w-2xl mx-auto">
              Poetree supports both educators and learners with the right tools in one dashboard.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* For Teachers */}
            <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-8 border border-blue-100">
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
            </div>
            {/* For Students */}
            <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-8 border border-emerald-100">
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
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-br from-slate-800 to-indigo-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Ready to create better papers?
          </h2>
          <p className="mt-4 text-slate-300 text-lg">
            Join Poetree Publication. Choose your subject, board & standard and start in minutes.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/auth/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-lg transition"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
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
        </div>
      </section>

      <Footer />
    </>
  );
};

export default Home;
