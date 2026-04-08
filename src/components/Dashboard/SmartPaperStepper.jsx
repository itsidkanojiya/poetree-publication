import { Check } from "lucide-react";

const STEPS = [
  { key: "header", label: "Paper header" },
  { key: "subject", label: "Subject" },
  { key: "targets", label: "Smart settings" },
];

/**
 * Horizontal stepper for the Smart paper wizard (first three configuration steps).
 * @param {0|1|2} activeIndex — 0 = header, 1 = subject, 2 = targets
 */
export default function SmartPaperStepper({ activeIndex = 0 }) {
  return (
    <nav aria-label="Smart paper steps" className="w-full max-w-lg mx-auto mb-8 px-2">
      <div className="flex items-center justify-between gap-1">
        {STEPS.map((step, i) => {
          const done = i < activeIndex;
          const current = i === activeIndex;
          return (
            <div key={step.key} className="flex flex-1 items-center min-w-0">
              <div className="flex flex-col items-center flex-1 min-w-0">
                <div
                  className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all ${
                    done
                      ? "bg-emerald-500 text-white shadow-md"
                      : current
                        ? "bg-indigo-600 text-white shadow-lg ring-4 ring-indigo-200"
                        : "bg-gray-200 text-gray-500"
                  }`}
                  aria-current={current ? "step" : undefined}
                >
                  {done ? <Check className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={3} /> : i + 1}
                </div>
                <span
                  className={`mt-2 text-center text-[10px] sm:text-xs font-semibold leading-tight ${
                    current ? "text-indigo-700" : done ? "text-emerald-700" : "text-gray-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 min-w-[6px] mx-1 rounded-full shrink ${
                    i < activeIndex ? "bg-emerald-400" : "bg-gray-200"
                  }`}
                  style={{ maxWidth: "48px" }}
                  aria-hidden
                />
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
