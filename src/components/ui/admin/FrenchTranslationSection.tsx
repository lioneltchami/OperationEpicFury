"use client";

import { FormLabel, inputClass } from "../AdminEventForm";

interface FrenchTranslationSectionProps {
  showFrench: boolean;
  setShowFrench: (v: boolean) => void;
  headlineFr: string;
  setHeadlineFr: (v: string) => void;
  bodyFr: string;
  setBodyFr: (v: string) => void;
  inputClass: string;
}

export function FrenchTranslationSection({
  showFrench,
  setShowFrench,
  headlineFr,
  setHeadlineFr,
  bodyFr,
  setBodyFr,
}: FrenchTranslationSectionProps) {
  return (
    <div className="rounded-xl border border-zinc-800/80 overflow-hidden">
      <button
        type="button"
        onClick={() => setShowFrench(!showFrench)}
        className="
          w-full flex items-center justify-between px-5 py-3.5
          text-sm text-zinc-400 hover:text-zinc-200
          bg-zinc-950/50 hover:bg-zinc-900/30
          transition-all duration-150
        "
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802"
            />
          </svg>
          French Translation
          <span className="text-[10px] text-zinc-600">(optional)</span>
        </div>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${showFrench ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {showFrench && (
        <div className="px-5 py-4 space-y-4 border-t border-zinc-800/50 bg-zinc-950/30">
          <p className="text-xs text-zinc-600">
            Leave blank to auto-translate after saving.
          </p>
          <div>
            <FormLabel>Headline (FR)</FormLabel>
            <input
              className={inputClass}
              value={headlineFr}
              onChange={(e) => setHeadlineFr(e.target.value)}
              dir="ltr"
              placeholder="Titre en fran\u00e7ais"
            />
          </div>
          <div>
            <FormLabel>Body (FR)</FormLabel>
            <textarea
              className={`${inputClass} min-h-[120px] resize-y`}
              value={bodyFr}
              onChange={(e) => setBodyFr(e.target.value)}
              dir="ltr"
              placeholder="Texte en fran\u00e7ais"
            />
          </div>
        </div>
      )}
    </div>
  );
}
