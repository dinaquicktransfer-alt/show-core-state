import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ENNEAGRAM,
  SAMPLE_PACKAGE,
  validateQuestions,
  type EnneagramType,
  type NomineeColor,
} from "@/lib/enneagram";
import {
  buildExportBundle,
  bundleToCSV,
  bundleToJSON,
  bundleToMarkdown,
  bundleToScript,
  importBundle,
  personLeadingTypes,
  useEvent,
} from "@/lib/event-store";
import {
  BUNDLE_GROUPS,
  buildSourceZip,
  downloadBlob,
  listBundleFiles,
} from "@/lib/source-bundle";

export const Route = createFileRoute("/host")({
  head: () => ({
    meta: [
      { title: "Host Panel · Enneagram Event" },
      {
        name: "description",
        content: "Host control panel for the Enneagram live event platform.",
      },
      { property: "og:title", content: "Host Panel · Enneagram Event" },
      {
        property: "og:description",
        content: "Host control panel for the Enneagram live event platform.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HostPanel,
});

function HostPanel() {
  const state = useEvent();
  useHostShortcuts();

  return (
    <div className="min-h-screen bg-[oklch(0.98_0_0)] text-[oklch(0.2_0.04_275)]">
      <header className="sticky top-0 z-10 border-b border-black/5 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[oklch(0.14_0.04_275)] text-sm font-black text-white">
              E
            </div>
            <div>
              <div className="text-sm font-bold">Enneagram Host Panel</div>
              <div className="text-xs text-black/50">
                Screen:{" "}
                <span className="font-semibold text-black/80">{state.screen}</span>{" "}
                · Questions loaded:{" "}
                <span className="font-semibold text-black/80">
                  {state.questions.length}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/presentation"
              target="_blank"
              className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-semibold shadow-sm hover:bg-black/5"
            >
              Open Presentation ↗
            </Link>
            <button
              onClick={() => {
                if (confirm("Reset entire event? All scores and people are erased.")) {
                  useEvent.getState().reset();
                }
              }}
              className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-red-600 shadow-sm hover:bg-red-50"
            >
              Reset event
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <PreEventPanel />
          <LiveShowPanel />
          <QuestionPackagePanel />
          <EventControlPanel />
          <div className="grid gap-6 md:grid-cols-2">
            <CurrentQuestionPanel />
            <NomineePickerPanel />
          </div>
          <WinnerPickerPanel />
          <details className="rounded-2xl border border-dashed border-black/10 bg-white/60 p-4">
            <summary className="cursor-pointer text-xs font-bold uppercase tracking-widest text-black/60">
              Legacy nominee / winner (manual typing)
            </summary>
            <div className="mt-4 grid gap-6 md:grid-cols-2">
              <NomineePanel />
              <WinnerPanel />
            </div>
          </details>
        </div>
        <div className="space-y-6">
          <ProgressPanel />
          <ComparePanel />
          <ShortcutsPanel />
          <ResultsControlPanel />
          <ExportPanel />
          <ImportPanel />
          <OwnershipCenterPanel />
          <DebugPanel />
        </div>
      </main>
    </div>
  );
}

function useHostShortcuts() {
  const state = useEvent();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement | null;
      if (tgt && /INPUT|TEXTAREA|SELECT/.test(tgt.tagName)) return;
      if (tgt?.isContentEditable) return;
      const s = useEvent.getState();
      switch (e.key.toLowerCase()) {
        case "q": s.showQuestion(); break;
        case "n": s.showNominees(); break;
        case "w": s.showWinner(); break;
        case "arrowright":
        case "→":
        case ".": s.nextQuestion(); break;
        case "r": s.showResults(); break;
        case "c": s.showChemistry(); break;
        case "s": s.showSummary(); break;
        case "1": s.setWinner("red"); break;
        case "2": s.setWinner("blue"); break;
        case "3": s.setWinner("green"); break;
        default: return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.currentIndex, state.questions.length]);
}

function ShortcutsPanel() {
  const items: [string, string][] = [
    ["Q", "Show question"],
    ["N", "Show nominees"],
    ["W", "Show winner"],
    ["→ / .", "Next question"],
    ["R", "Generate results"],
    ["C", "Show chemistry"],
    ["S", "Event summary"],
    ["1 / 2 / 3", "Pick red / blue / green winner"],
  ];
  return (
    <Panel title="Keyboard Shortcuts">
      <ul className="grid grid-cols-1 gap-1 text-xs">
        {items.map(([k, v]) => (
          <li key={k} className="flex items-center justify-between gap-2 rounded-md px-2 py-1 hover:bg-black/[0.03]">
            <span className="text-black/60">{v}</span>
            <kbd className="rounded border border-black/10 bg-white px-1.5 py-0.5 font-mono text-[10px] font-bold shadow-sm">
              {k}
            </kbd>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-widest text-black/60">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function QuestionPackagePanel() {
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const loaded = useEvent((s) => s.questions.length);

  const load = (raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      const result = validateQuestions(parsed);
      if (!result.ok || !result.data) {
        setMsg({ ok: false, text: result.error ?? "Invalid package" });
        return;
      }
      useEvent.getState().loadQuestions(result.data);
      setMsg({ ok: true, text: `Loaded ${result.data.length} questions` });
    } catch (e) {
      setMsg({ ok: false, text: `JSON parse error: ${(e as Error).message}` });
    }
  };

  return (
    <Panel
      title="Question Package"
      action={
        <span className="text-xs font-semibold text-black/50">
          {loaded} loaded
        </span>
      }
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={7}
        placeholder='[{"question":"Who would make the best principal?","primaryType":3,"secondaryType":8,"trait":"Leadership","winnerPoints":3,"secondaryPoints":2,"nomineePoints":1}]'
        className="w-full rounded-xl border border-black/10 bg-[oklch(0.98_0_0)] p-3 font-mono text-xs outline-none focus:border-black/30"
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => load(text)}
          className="rounded-lg bg-[oklch(0.14_0.04_275)] px-4 py-2 text-sm font-bold text-white hover:opacity-90"
        >
          Load package
        </button>
        <label className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold hover:bg-black/5 cursor-pointer">
          Load JSON file
          <input
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const t = await f.text();
              setText(t);
              load(t);
              e.target.value = "";
            }}
          />
        </label>
        <button
          onClick={() => {
            const s = JSON.stringify(SAMPLE_PACKAGE, null, 2);
            setText(s);
            load(s);
          }}
          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold hover:bg-black/5"
        >
          Load sample
        </button>
        {msg && (
          <span
            className={`ml-auto text-xs font-semibold ${
              msg.ok ? "text-green-600" : "text-red-600"
            }`}
          >
            {msg.text}
          </span>
        )}
      </div>
    </Panel>
  );
}

function EventControlPanel() {
  const {
    startEvent, showNominees, showWinner,
    nextQuestion, showAnalyzing, showProfiles,
    showChemistry, showMovieCast, showAwards, showSummary, setMovieTheme,
    setAudienceContext,
  } = useEvent.getState();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const hasQuestions = useEvent((s) => s.questions.length > 0);
  const hasWinner = useEvent((s) => s.winnerColor !== null);
  const hasNominees = useEvent((s) => {
    const n = s.nominees;
    return !!(n.red || n.blue || n.green);
  });
  const canNext = useEvent((s) => s.currentIndex < s.questions.length - 1);
  const movieTheme = useEvent((s) => s.movieTheme);
  const audienceContext = useEvent((s) => s.audienceContext);

  const stage =
    "flex flex-col items-start gap-1 rounded-2xl p-4 text-left text-white shadow-md transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40";
  const stageLabel = "text-[10px] font-bold uppercase tracking-[0.25em] opacity-80";
  const stageTitle = "text-base font-black leading-tight";
  const stageHint = "text-[11px] font-medium opacity-80";

  // Host clicks Generate Results → automatic analyzing sequence → results.
  const dramaticResults = () => {
    showAnalyzing();
    setTimeout(() => useEvent.getState().showResults(), 2600);
  };

  const primary: {
    key: string;
    label: string;
    title: string;
    hint: string;
    onClick: () => void;
    disabled?: boolean;
    grad: string;
  }[] = [
    { key: "start", label: "Stage 1", title: "Start the Show", hint: "Opens the welcome sequence", onClick: startEvent, grad: "from-[oklch(0.55_0.2_290)] to-[oklch(0.65_0.22_320)]" },
    { key: "nom", label: "Stage 2", title: "Reveal Nominees", hint: "Cinematic spotlight, automatic", onClick: showNominees, disabled: !hasNominees, grad: "from-[oklch(0.55_0.2_150)] to-[oklch(0.65_0.2_170)]" },
    { key: "win", label: "Stage 3", title: "Reveal Winner", hint: "Confetti + countdown, automatic", onClick: showWinner, disabled: !hasWinner, grad: "from-[oklch(0.65_0.2_60)] to-[oklch(0.6_0.22_30)]" },
    { key: "next", label: "Stage 4", title: "Next Question", hint: "Dramatic reveal, automatic", onClick: nextQuestion, disabled: !canNext, grad: "from-[oklch(0.5_0.15_275)] to-[oklch(0.55_0.15_250)]" },
    { key: "res", label: "Stage 5", title: "Generate Results", hint: "Analyzing → wheel, automatic", onClick: dramaticResults, disabled: !hasQuestions, grad: "from-[oklch(0.6_0.22_310)] to-[oklch(0.6_0.22_350)]" },
    { key: "pro", label: "Stage 6", title: "Personality Reports", hint: "Documentary-style profiles", onClick: showProfiles, grad: "from-[oklch(0.55_0.2_280)] to-[oklch(0.6_0.2_240)]" },
    { key: "chem", label: "Stage 7", title: "Group Story", hint: "Chemistry & archetype", onClick: showChemistry, grad: "from-[oklch(0.55_0.2_200)] to-[oklch(0.6_0.2_170)]" },
    { key: "aw", label: "Stage 8", title: "Awards Ceremony", hint: "🏆 Reveal winners of the night", onClick: showAwards, grad: "from-[oklch(0.7_0.2_65)] to-[oklch(0.65_0.22_35)]" },
    { key: "sum", label: "Stage 9", title: "Final Summary", hint: "Fun facts + closing story", onClick: showSummary, grad: "from-[oklch(0.45_0.1_275)] to-[oklch(0.35_0.05_275)]" },
  ];

  return (
    <Panel
      title="Event Control · Live Show"
      action={<span className="text-[10px] font-semibold uppercase tracking-widest text-black/40">automatic flow</span>}
    >
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        {primary.map((p) => (
          <button
            key={p.key}
            onClick={p.onClick}
            disabled={p.disabled}
            className={`${stage} bg-gradient-to-br ${p.grad}`}
          >
            <span className={stageLabel}>{p.label}</span>
            <span className={stageTitle}>{p.title}</span>
            <span className={stageHint}>{p.hint}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-widest text-black/60">Audience Context</span>
          <input
            value={audienceContext}
            onChange={(e) => setAudienceContext(e.target.value)}
            placeholder="e.g. teachers, engineers, sales team…"
            className="w-full rounded-xl border border-black/10 bg-[oklch(0.98_0_0)] p-3 text-sm outline-none focus:border-black/30"
          />
          <span className="text-[11px] text-black/50">Tailors insights and phrasing to your specific audience.</span>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-widest text-black/60">Movie Theme</span>
          <input
            value={movieTheme}
            onChange={(e) => setMovieTheme(e.target.value)}
            placeholder="e.g. A heist movie set in Tokyo…"
            className="w-full rounded-xl border border-black/10 bg-[oklch(0.98_0_0)] p-3 text-sm outline-none focus:border-black/30"
          />
          <span className="text-[11px] text-black/50">Used by the Movie Cast bonus screen (Advanced).</span>
        </label>
      </div>

      <button
        onClick={() => setShowAdvanced((v) => !v)}
        className="mt-4 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-bold text-black/70 hover:bg-black/5"
      >
        {showAdvanced ? "Hide" : "Show"} advanced controls
      </button>
      {showAdvanced && <AdvancedControls />}
    </Panel>
  );
}

function AdvancedControls() {
  const s = useEvent.getState();
  const people = useEvent((st) => st.people);
  const questions = useEvent((st) => st.questions);
  const currentIndex = useEvent((st) => st.currentIndex);
  const audience = useEvent((st) => st.audienceContext);

  const fireInsight = async () => {
    const { randomInsight, contextualize } = await import("@/lib/insights");
    const raw = randomInsight(Object.values(people), questions, currentIndex);
    s.showInsight(contextualize(raw, audience));
  };

  const btn =
    "rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-bold hover:bg-black/5 disabled:opacity-40";

  return (
    <div className="mt-3 rounded-xl border border-dashed border-black/10 bg-[oklch(0.98_0_0)] p-3">
      <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-black/40">
        Manual overrides — normally automatic
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={s.showNextQuestionReveal} className={btn}>Force Next-Q Reveal</button>
        <button onClick={s.showQuestion} className={btn}>Force Show Question</button>
        <button onClick={fireInsight} className={btn}>✨ Trigger Group Insight</button>
        <button onClick={s.showAnalyzing} className={btn}>Show Analyzing…</button>
        <button onClick={s.showResults} className={btn}>Skip to Results</button>
        <button onClick={s.showMovieCast} className={btn}>🎬 Movie Cast</button>
      </div>
    </div>
  );
}


function ProgressPanel() {
  const { currentIndex, questions } = useEvent();
  const pct = questions.length
    ? ((currentIndex + 1) / questions.length) * 100
    : 0;
  return (
    <Panel title="Question Progress">
      <div className="text-4xl font-black">
        {questions.length
          ? `${currentIndex + 1} of ${questions.length}`
          : "0 of 0"}
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[oklch(0.65_0.22_320)] to-[oklch(0.75_0.2_60)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </Panel>
  );
}

function CurrentQuestionPanel() {
  const q = useEvent((s) => s.questions[s.currentIndex]);
  return (
    <Panel title="Current Question">
      {q ? (
        <div>
          <div className="text-xl font-black leading-tight">{q.question}</div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {q.trait && (
              <span className="rounded-full bg-black/5 px-2 py-1 font-semibold">
                {q.trait}
              </span>
            )}
            <span className="rounded-full bg-black/5 px-2 py-1 font-semibold">
              Primary: Type {q.primaryType} · {ENNEAGRAM[q.primaryType].name}
            </span>
            <span className="rounded-full bg-black/5 px-2 py-1 font-semibold">
              Secondary: Type {q.secondaryType} · {ENNEAGRAM[q.secondaryType].name}
            </span>
            <span className="rounded-full bg-black/5 px-2 py-1 font-semibold">
              +{q.winnerPoints}/{q.secondaryPoints}/{q.nomineePoints}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-sm text-black/50">
          Load a question package to begin.
        </div>
      )}
    </Panel>
  );
}

function NomineePanel() {
  const nominees = useEvent((s) => s.nominees);
  const set = useEvent.getState().setNominee;
  const showNominees = useEvent.getState().showNominees;
  const colors: { key: NomineeColor; label: string; bg: string }[] = [
    { key: "red", label: "Red Nominee", bg: "oklch(0.65 0.24 25)" },
    { key: "blue", label: "Blue Nominee", bg: "oklch(0.62 0.2 250)" },
    { key: "green", label: "Green Nominee", bg: "oklch(0.7 0.19 150)" },
  ];
  return (
    <Panel title="Nominees">
      <div className="space-y-3">
        {colors.map((c) => (
          <label key={c.key} className="block">
            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: c.bg }}
              />
              {c.label}
            </div>
            <input
              value={nominees[c.key]}
              onChange={(e) => set(c.key, e.target.value)}
              placeholder="Name"
              className="w-full rounded-lg border border-black/10 bg-[oklch(0.98_0_0)] px-3 py-2 outline-none focus:border-black/30"
            />
          </label>
        ))}
        <button
          onClick={showNominees}
          className="w-full rounded-xl bg-[oklch(0.14_0.04_275)] px-4 py-2.5 text-sm font-bold text-white hover:opacity-90"
        >
          Show Nominees on Screen
        </button>
      </div>
    </Panel>
  );
}

function WinnerPanel() {
  const { winnerColor, nominees } = useEvent();
  const setWinner = useEvent.getState().setWinner;
  const showWinner = useEvent.getState().showWinner;
  const colors: { key: NomineeColor; bg: string; label: string }[] = [
    { key: "red", bg: "oklch(0.65 0.24 25)", label: "Red Winner" },
    { key: "blue", bg: "oklch(0.62 0.2 250)", label: "Blue Winner" },
    { key: "green", bg: "oklch(0.7 0.19 150)", label: "Green Winner" },
  ];
  return (
    <Panel title="Winner">
      <div className="grid gap-3 md:grid-cols-3">
        {colors.map((c) => {
          const isActive = winnerColor === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setWinner(c.key)}
              className={`rounded-xl p-4 text-left text-white shadow-sm transition-all ${
                isActive ? "scale-[1.02] ring-4 ring-black/20" : "opacity-90 hover:opacity-100"
              }`}
              style={{ background: `linear-gradient(160deg, ${c.bg}, oklch(from ${c.bg} calc(l - 0.15) c h))` }}
            >
              <div className="text-xs font-bold uppercase tracking-widest opacity-80">
                {c.label}
              </div>
              <div className="mt-1 text-lg font-black">
                {nominees[c.key] || "—"}
              </div>
            </button>
          );
        })}
      </div>
      <button
        onClick={showWinner}
        disabled={!winnerColor}
        className="mt-4 w-full rounded-xl bg-gradient-to-br from-[oklch(0.65_0.2_60)] to-[oklch(0.6_0.22_30)] px-4 py-2.5 text-sm font-bold text-white shadow-sm disabled:opacity-40"
      >
        Show Winner on Screen 🎉
      </button>
    </Panel>
  );
}

function ResultsControlPanel() {
  const people = useEvent((s) => s.people);
  const selectedType = useEvent((s) => s.selectedType);
  const selectType = useEvent.getState().selectType;
  const dist = useMemo(() => {
    const d: Record<EnneagramType, number> = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0,
    };
    Object.values(people).forEach((p) => {
      const { leading } = personLeadingTypes(p);
      if (leading) d[leading] += 1;
    });
    return d;
  }, [people]);
  return (
    <Panel title="Show Type on Screen">
      <div className="grid grid-cols-3 gap-2">
        {([1, 2, 3, 4, 5, 6, 7, 8, 9] as EnneagramType[]).map((t) => {
          const active = selectedType === t;
          return (
            <button
              key={t}
              onClick={() => selectType(t)}
              className={`flex flex-col items-center rounded-xl p-3 text-white shadow-sm transition-transform hover:scale-[1.03] ${
                active ? "ring-4 ring-black/25" : ""
              }`}
              style={{ backgroundColor: ENNEAGRAM[t].color }}
            >
              <span className="text-lg font-black">{t}</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest opacity-90">
                {ENNEAGRAM[t].name.replace("The ", "")}
              </span>
              <span className="mt-1 text-xs font-bold">{dist[t]}</span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

function DebugPanel() {
  const people = useEvent((s) => s.people);
  const list = Object.values(people).sort((a, b) => b.wins - a.wins || b.nominations - a.nominations);
  return (
    <Panel title="Host Debug — People">
      {list.length === 0 ? (
        <div className="text-sm text-black/50">No people yet.</div>
      ) : (
        <div className="max-h-96 overflow-auto">
          <table className="w-full text-xs">
            <thead className="text-black/50">
              <tr>
                <th className="text-left font-semibold uppercase tracking-widest">Name</th>
                <th className="font-semibold uppercase tracking-widest">Wins</th>
                <th className="font-semibold uppercase tracking-widest">Noms</th>
                <th className="font-semibold uppercase tracking-widest">Leading</th>
                <th className="font-semibold uppercase tracking-widest">Second</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => {
                const { leading, second } = personLeadingTypes(p);
                return (
                  <tr key={p.id} className="border-t border-black/5">
                    <td className="py-1.5 text-left font-semibold">{p.name}</td>
                    <td className="text-center">{p.wins}</td>
                    <td className="text-center">{p.nominations}</td>
                    <td className="text-center">
                      {leading ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-bold text-white"
                          style={{ backgroundColor: ENNEAGRAM[leading].color }}
                        >
                          {leading} · {ENNEAGRAM[leading].name.replace("The ", "")}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="text-center">
                      {second ? (
                        <span className="text-black/60">
                          {second} · {ENNEAGRAM[second].name.replace("The ", "")}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function ExportPanel() {
  const [format, setFormat] = useState<"json" | "script" | "markdown" | "csv">("json");
  const [copied, setCopied] = useState(false);
  const state = useEvent();

  const output = useMemo(() => {
    const b = buildExportBundle();
    if (format === "json") return bundleToJSON(b);
    if (format === "script") return bundleToScript(b);
    if (format === "markdown") return bundleToMarkdown(b);
    return bundleToCSV(b);
  }, [format, state.updatedAt]);

  const ext = format === "markdown" ? "md" : format === "script" ? "js" : format;
  const mime =
    format === "json"
      ? "application/json"
      : format === "csv"
      ? "text/csv"
      : format === "script"
      ? "application/javascript"
      : "text/markdown";

  const download = () => {
    const blob = new Blob([output], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `enneagram-event.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  const tabs: { key: typeof format; label: string }[] = [
    { key: "json", label: "JSON" },
    { key: "script", label: "Script (.js)" },
    { key: "markdown", label: "Markdown" },
    { key: "csv", label: "CSV" },
  ];

  return (
    <Panel
      title="Export Event"
      action={<span className="text-xs font-semibold text-black/50">portable</span>}
    >
      <div className="flex flex-wrap gap-1 rounded-lg bg-black/5 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFormat(t.key)}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs font-bold transition ${
              format === t.key
                ? "bg-white shadow-sm"
                : "text-black/60 hover:text-black"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <textarea
        readOnly
        value={output}
        rows={7}
        className="mt-3 w-full rounded-xl border border-black/10 bg-[oklch(0.98_0_0)] p-3 font-mono text-[10px] leading-relaxed outline-none"
      />
      <div className="mt-3 flex gap-2">
        <button
          onClick={copy}
          className="flex-1 rounded-lg bg-[oklch(0.14_0.04_275)] px-3 py-2 text-xs font-bold text-white hover:opacity-90"
        >
          {copied ? "Copied ✓" : "Copy to clipboard"}
        </button>
        <button
          onClick={download}
          className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-bold shadow-sm hover:bg-black/5"
        >
          Download .{ext}
        </button>
      </div>
    </Panel>
  );
}

function ImportPanel() {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const doImport = (raw: string) => {
    const r = importBundle(raw);
    setMsg({ ok: r.ok, text: r.ok ? "Event restored." : `Import failed: ${r.error}` });
  };
  return (
    <Panel
      title="Import Event"
      action={<span className="text-xs font-semibold text-black/50">restore</span>}
    >
      <div className="flex flex-wrap gap-2">
        <label className="flex-1 cursor-pointer rounded-lg border border-black/10 bg-white px-3 py-2 text-center text-xs font-bold hover:bg-black/5">
          Load event JSON
          <input
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              doImport(await f.text());
              e.target.value = "";
            }}
          />
        </label>
        <button
          onClick={async () => {
            try {
              const t = await navigator.clipboard.readText();
              doImport(t);
            } catch {
              setMsg({ ok: false, text: "Clipboard unavailable." });
            }
          }}
          className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-bold hover:bg-black/5"
        >
          Paste from clipboard
        </button>
      </div>
      {msg && (
        <div className={`mt-3 text-xs font-semibold ${msg.ok ? "text-green-600" : "text-red-600"}`}>
          {msg.text}
        </div>
      )}
    </Panel>
  );
}

function OwnershipCenterPanel() {
  const [busy, setBusy] = useState<string | null>(null);
  const [count, setCount] = useState<number | null>(null);

  const rows: { key: keyof typeof BUNDLE_GROUPS; file: string; withEvent?: boolean }[] = [
    { key: "full", file: "enneagram-event-full-project.zip", withEvent: true },
    { key: "source", file: "enneagram-event-source.zip" },
    { key: "components", file: "enneagram-event-components.zip" },
    { key: "typescript", file: "enneagram-event-typescript.zip" },
    { key: "eventEngine", file: "enneagram-event-engine.zip" },
    { key: "enneagramEngine", file: "enneagram-enneagram-engine.zip" },
    { key: "chemistryEngine", file: "enneagram-chemistry-engine.zip" },
    { key: "config", file: "enneagram-event-config.zip" },
    { key: "dataModels", file: "enneagram-event-data-models.zip" },
    { key: "docs", file: "enneagram-event-docs.zip" },
  ];

  const download = async (key: keyof typeof BUNDLE_GROUPS, file: string, withEvent?: boolean) => {
    setBusy(key);
    try {
      const extras: Record<string, string> = {};
      if (withEvent) {
        extras["event-export.json"] = bundleToJSON(buildExportBundle());
      }
      const zip = await buildSourceZip(key, extras);
      downloadBlob(zip, file);
      setCount(listBundleFiles(key).length);
    } finally {
      setBusy(null);
    }
  };

  const downloadEventPackage = () => {
    const b = buildExportBundle();
    const bundle = {
      version: "1.0",
      kind: "complete-event-package",
      exportedAt: new Date().toISOString(),
      event: b,
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    downloadBlob(blob, "complete-event-package.json");
  };

  return (
    <Panel
      title="Ownership Center"
      action={<span className="text-xs font-semibold text-black/50">take it with you</span>}
    >
      <p className="mb-3 text-xs text-black/60">
        Everything you need to run this platform outside Lovable — source, engines, config, and docs.
      </p>
      <div className="grid grid-cols-1 gap-1.5">
        {rows.map((r) => (
          <button
            key={r.key}
            disabled={busy === r.key}
            onClick={() => download(r.key, r.file, r.withEvent)}
            className="flex items-center justify-between rounded-lg border border-black/10 bg-white px-3 py-2 text-left text-xs font-bold shadow-sm hover:bg-black/5 disabled:opacity-50"
          >
            <span>Export {BUNDLE_GROUPS[r.key].label}</span>
            <span className="text-black/40">
              {busy === r.key ? "…" : `${listBundleFiles(r.key).length} files`}
            </span>
          </button>
        ))}
        <button
          onClick={downloadEventPackage}
          className="mt-1 rounded-lg bg-gradient-to-br from-[oklch(0.55_0.2_290)] to-[oklch(0.65_0.22_320)] px-3 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90"
        >
          Export Complete Event Package
        </button>
      </div>
      {count !== null && (
        <div className="mt-3 text-[11px] text-black/50">Last download: {count} files.</div>
      )}
    </Panel>
  );
}

// ============================================================
// NEW: Live Show Panel — Room Context + AI question generator +
// Sound toggle + Finale trigger. Additive; nothing else touched.
// ============================================================
function LiveShowPanel() {
  const roomContext = useEvent((s) => s.roomContext);
  const soundOn = useEvent((s) => s.soundOn);
  const people = useEvent((s) => s.people);
  const [busy, setBusy] = useState(false);
  const [count, setCount] = useState(12);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const s = useEvent.getState();

  const generate = async () => {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/ai/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomContext,
          count,
          participants: Object.values(people).map((p) => p.name),
        }),
      });
      const data = await res.json() as { ok: boolean; questions?: unknown; error?: string };
      if (!data.ok || !data.questions) {
        setMsg({ ok: false, text: data.error ?? "AI generation failed." });
        return;
      }
      s.loadQuestions(data.questions as never);
      setMsg({ ok: true, text: `Generated ${(data.questions as unknown[]).length} questions.` });
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel
      title="Live Show · Room Context"
      action={<span className="text-[10px] font-bold uppercase tracking-widest text-black/40">AI powered</span>}
    >
      <label className="block">
        <span className="text-xs font-bold uppercase tracking-widest text-black/60">Who is in the room?</span>
        <textarea
          value={roomContext}
          onChange={(e) => s.setRoomContext(e.target.value)}
          rows={2}
          placeholder="e.g. 12 middle-school teachers on a staff retreat, warm and playful."
          className="mt-1 w-full rounded-xl border border-black/10 bg-[oklch(0.98_0_0)] p-3 text-sm outline-none focus:border-black/30"
        />
        <span className="text-[11px] text-black/50">Feeds the AI question generator and every on-screen narration.</span>
      </label>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-xs font-semibold">
          Questions:
          <input
            type="number" min={5} max={25}
            value={count}
            onChange={(e) => setCount(Math.max(5, Math.min(25, Number(e.target.value) || 12)))}
            className="w-16 rounded-lg border border-black/10 bg-white px-2 py-1"
          />
        </label>
        <button
          onClick={generate}
          disabled={busy}
          className="rounded-xl bg-gradient-to-br from-[oklch(0.6_0.22_310)] to-[oklch(0.55_0.22_260)] px-4 py-2 text-sm font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-40"
        >
          {busy ? "Writing questions…" : "✨ Generate questions with AI"}
        </button>
        <button
          onClick={() => s.showFinale()}
          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-bold hover:bg-black/5"
        >
          🎬 Play Finale
        </button>
        <label className="ml-auto flex items-center gap-2 text-xs font-semibold text-black/70">
          <input
            type="checkbox"
            checked={soundOn}
            onChange={async (e) => {
              const v = e.target.checked;
              s.setSoundOn(v);
              const { setSoundEnabled } = await import("@/lib/sound");
              setSoundEnabled(v);
            }}
          />
          Sound cues
        </label>
      </div>
      {msg && (
        <div className={`mt-3 text-xs font-semibold ${msg.ok ? "text-green-600" : "text-red-600"}`}>{msg.text}</div>
      )}
    </Panel>
  );
}

// ============================================================
// NEW: Compare Panel — pick any two participants; presentation
// screen renders the side-by-side reveal.
// ============================================================
function ComparePanel() {
  const people = useEvent((s) => s.people);
  const pair = useEvent((s) => s.comparePair);
  const list = Object.values(people);
  const [a, setA] = useState<string>(pair?.[0] ?? "");
  const [b, setB] = useState<string>(pair?.[1] ?? "");

  useEffect(() => {
    if (pair) { setA(pair[0]); setB(pair[1]); }
  }, [pair]);

  const canGo = a && b && a !== b;

  return (
    <Panel title="Compare Two People">
      {list.length < 2 ? (
        <div className="text-xs text-black/50">Need at least two participants.</div>
      ) : (
        <div className="space-y-2">
          <select value={a} onChange={(e) => setA(e.target.value)}
            className="w-full rounded-lg border border-black/10 bg-white px-2 py-2 text-sm">
            <option value="">Person A…</option>
            {list.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={b} onChange={(e) => setB(e.target.value)}
            className="w-full rounded-lg border border-black/10 bg-white px-2 py-2 text-sm">
            <option value="">Person B…</option>
            {list.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button
            disabled={!canGo}
            onClick={() => useEvent.getState().setComparePair([a, b])}
            className="w-full rounded-xl bg-[oklch(0.14_0.04_275)] px-3 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-40"
          >
            Show comparison on screen
          </button>
        </div>
      )}
    </Panel>
  );
}

// ============================================================
// NEW: Pre-Event Panel — roster + audience type + AI prepare.
// Host builds the show BEFORE going live; no live typing later.
// ============================================================
function PreEventPanel() {
  const participants = useEvent((s) => s.participants);
  const audienceType = useEvent((s) => s.audienceType);
  const roomContext = useEvent((s) => s.roomContext);
  const preparedAt = useEvent((s) => s.preparedAt);
  const questionCount = useEvent((s) => s.questions.length);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const s = useEvent.getState();

  const add = () => {
    const n = name.trim();
    if (!n) return;
    s.addParticipant(n);
    setName("");
  };

  const prepare = async () => {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/ai/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomContext: `${audienceType ? audienceType + ". " : ""}${roomContext}`,
          count: Math.max(12, Math.min(24, participants.length * 3)),
          participants: participants.map((p) => p.name),
        }),
      });
      const data = await res.json() as { ok: boolean; questions?: unknown; error?: string };
      if (data.ok && data.questions) {
        s.loadQuestions(data.questions as never);
        s.markPrepared();
        setMsg({ ok: true, text: `Ready. ${(data.questions as unknown[]).length} questions loaded.` });
      } else {
        setMsg({ ok: false, text: data.error ?? "AI preparation failed. You can still load a package manually." });
      }
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const canStart = participants.length >= 2 && questionCount > 0;

  return (
    <Panel
      title="Pre-Event Setup"
      action={
        <span className={`text-[10px] font-bold uppercase tracking-widest ${preparedAt ? "text-green-600" : "text-black/40"}`}>
          {preparedAt ? "prepared ✓" : "prepare before live"}
        </span>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-widest text-black/60">Audience Type</span>
          <input
            value={audienceType}
            onChange={(e) => s.setAudienceType(e.target.value)}
            placeholder="e.g. teachers, engineers, family reunion…"
            className="w-full rounded-xl border border-black/10 bg-[oklch(0.98_0_0)] p-3 text-sm outline-none focus:border-black/30"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-widest text-black/60">Room Description</span>
          <input
            value={roomContext}
            onChange={(e) => s.setRoomContext(e.target.value)}
            placeholder="e.g. warm, playful, 12 people, staff retreat"
            className="w-full rounded-xl border border-black/10 bg-[oklch(0.98_0_0)] p-3 text-sm outline-none focus:border-black/30"
          />
        </label>
      </div>

      <div className="mt-4">
        <div className="mb-2 text-xs font-bold uppercase tracking-widest text-black/60">
          Participants ({participants.length})
        </div>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
            placeholder="Add name and press Enter"
            className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/30"
          />
          <button
            onClick={add}
            className="rounded-lg bg-[oklch(0.14_0.04_275)] px-4 py-2 text-sm font-bold text-white hover:opacity-90"
          >
            Add
          </button>
        </div>
        {participants.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {participants.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-black/5 px-3 py-1 text-xs font-semibold"
              >
                {p.name}
                <button
                  onClick={() => s.removeParticipant(p.id)}
                  className="text-black/40 hover:text-red-600"
                  aria-label={`Remove ${p.name}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={prepare}
          disabled={busy || participants.length < 2}
          className="rounded-xl bg-gradient-to-br from-[oklch(0.6_0.22_310)] to-[oklch(0.55_0.22_260)] px-4 py-2 text-sm font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-40"
        >
          {busy ? "Preparing…" : "✨ Prepare Show with AI"}
        </button>
        <button
          onClick={() => s.startEvent()}
          disabled={!canStart}
          className="rounded-xl bg-gradient-to-br from-[oklch(0.55_0.2_150)] to-[oklch(0.65_0.2_170)] px-4 py-2 text-sm font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-40"
        >
          ▶ Start the Show
        </button>
        <span className="text-[11px] text-black/50">
          {participants.length < 2 ? "Add at least 2 participants." : questionCount === 0 ? "Prepare or load a question package." : "Ready to go live."}
        </span>
      </div>
      {msg && (
        <div className={`mt-3 text-xs font-semibold ${msg.ok ? "text-green-600" : "text-red-600"}`}>{msg.text}</div>
      )}
    </Panel>
  );
}

// ============================================================
// NEW: Nominee Picker — chip-picker from the saved participants.
// No typing during the live show.
// ============================================================
function NomineePickerPanel() {
  const nominees = useEvent((s) => s.nominees);
  const participants = useEvent((s) => s.participants);
  const s = useEvent.getState();
  const colors: { key: NomineeColor; label: string; bg: string }[] = [
    { key: "red", label: "Red Nominee", bg: "oklch(0.65 0.24 25)" },
    { key: "blue", label: "Blue Nominee", bg: "oklch(0.62 0.2 250)" },
    { key: "green", label: "Green Nominee", bg: "oklch(0.7 0.19 150)" },
  ];
  const chosen = new Set(Object.values(nominees).filter(Boolean));

  return (
    <Panel title="Nominees · Pick from roster">
      {participants.length < 3 ? (
        <div className="text-xs text-black/50">
          Add at least 3 participants in Pre-Event Setup to use the picker.
        </div>
      ) : (
        <div className="space-y-3">
          {colors.map((c) => (
            <div key={c.key}>
              <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c.bg }} />
                {c.label}
                <span className="ml-auto text-[10px] font-semibold text-black/40">
                  {nominees[c.key] || "—"}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {participants.map((p) => {
                  const active = nominees[c.key] === p.name;
                  const taken = chosen.has(p.name) && !active;
                  return (
                    <button
                      key={p.id}
                      disabled={taken}
                      onClick={() => s.pickNominee(c.key, active ? "" : p.name)}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                        active ? "text-white shadow-sm" : "bg-black/5 text-black/70 hover:bg-black/10"
                      } ${taken ? "opacity-30" : ""}`}
                      style={active ? { backgroundColor: c.bg } : undefined}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <button
            onClick={s.showNominees}
            disabled={!(nominees.red && nominees.blue && nominees.green)}
            className="w-full rounded-xl bg-[oklch(0.14_0.04_275)] px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-40"
          >
            Reveal Nominees on Screen
          </button>
        </div>
      )}
    </Panel>
  );
}

// ============================================================
// NEW: Winner Picker — chips of the three current nominees.
// ============================================================
function WinnerPickerPanel() {
  const { winnerColor, nominees } = useEvent();
  const s = useEvent.getState();
  const colors: { key: NomineeColor; bg: string; label: string }[] = [
    { key: "red", bg: "oklch(0.65 0.24 25)", label: "Red" },
    { key: "blue", bg: "oklch(0.62 0.2 250)", label: "Blue" },
    { key: "green", bg: "oklch(0.7 0.19 150)", label: "Green" },
  ];
  return (
    <Panel title="Winner · Pick a nominee">
      <div className="grid gap-3 md:grid-cols-3">
        {colors.map((c) => {
          const isActive = winnerColor === c.key;
          const name = nominees[c.key];
          return (
            <button
              key={c.key}
              onClick={() => name && s.setWinner(c.key)}
              disabled={!name}
              className={`rounded-xl p-4 text-left text-white shadow-sm transition-all disabled:opacity-30 ${
                isActive ? "scale-[1.02] ring-4 ring-black/20" : "opacity-90 hover:opacity-100"
              }`}
              style={{ background: `linear-gradient(160deg, ${c.bg}, oklch(from ${c.bg} calc(l - 0.15) c h))` }}
            >
              <div className="text-xs font-bold uppercase tracking-widest opacity-80">{c.label}</div>
              <div className="mt-1 text-lg font-black">{name || "—"}</div>
            </button>
          );
        })}
      </div>
      <button
        onClick={s.showWinner}
        disabled={!winnerColor}
        className="mt-4 w-full rounded-xl bg-gradient-to-br from-[oklch(0.65_0.2_60)] to-[oklch(0.6_0.22_30)] px-4 py-2.5 text-sm font-bold text-white shadow-sm disabled:opacity-40"
      >
        Reveal Winner on Screen 🎉
      </button>
    </Panel>
  );
}



