// Show Engine — the single orchestration layer for the live show.
// Thin wrapper over `event-store` so future AI/animation features can plug in
// without touching every screen. Purely additive; nothing removed.

import { useEvent } from "./event-store";
import { chapterFor } from "./ai-brain";
import { moodForChapter, PHASE_INTENSITY, type AtmospherePreset } from "./atmosphere";
import type { RevealPhase } from "./reveal-machine";
import { buildAllProfiles, type LivingProfile } from "./personality-engine";
import type { EnneagramType, Person } from "./enneagram";

// ---------- Show selectors ----------

export interface ShowSnapshot {
  screen: string;
  chapterNumber: number;
  chapterTitle: string;
  chapterSubtitle: string;
  atmosphere: AtmospherePreset;
  currentIndex: number;
  totalQuestions: number;
  progress: number;                 // 0..1
  participants: Person[];
  livingProfiles: Record<string, LivingProfile>;
  audienceContext: string;
  roomContext: string;
  soundOn: boolean;
}

export function selectShowSnapshot(revealPhase: RevealPhase = "idle"): ShowSnapshot {
  const s = useEvent.getState();
  const list = Object.values(s.people);
  const total = s.questions.length;
  const ch = chapterFor(s.currentIndex, total);
  const base = moodForChapter(ch.number);
  const intensity = PHASE_INTENSITY[revealPhase];
  const atmosphere: AtmospherePreset = {
    ...base,
    particleDensity: base.particleDensity * intensity,
    glow: Math.min(1, base.glow * intensity),
  };
  return {
    screen: s.screen,
    chapterNumber: ch.number,
    chapterTitle: ch.title,
    chapterSubtitle: ch.subtitle,
    atmosphere,
    currentIndex: s.currentIndex,
    totalQuestions: total,
    progress: total ? (s.currentIndex + 1) / total : 0,
    participants: list,
    livingProfiles: buildAllProfiles(list, s.questions),
    audienceContext: s.audienceContext,
    roomContext: s.roomContext,
    soundOn: s.soundOn,
  };
}

// ---------- Show actions ----------

export const showActions = {
  setAudience: (v: string) => useEvent.getState().setAudienceContext(v),
  setRoom: (v: string) => useEvent.getState().setRoomContext(v),
  setSound: (v: boolean) => useEvent.getState().setSoundOn(v),
  startShow: () => useEvent.getState().startEvent(),
  showQuestion: () => useEvent.getState().showQuestion(),
  showNominees: () => useEvent.getState().showNominees(),
  showWinner: () => useEvent.getState().showWinner(),
  next: () => useEvent.getState().nextQuestion(),
  results: () => useEvent.getState().showResults(),
  chemistry: () => useEvent.getState().showChemistry(),
  profiles: () => useEvent.getState().showProfiles(),
  finale: () => useEvent.getState().showFinale(),
  chapter: () => useEvent.getState().showChapter(),
  selectType: (t: EnneagramType) => useEvent.getState().selectType(t),
  compare: (pair: [string, string] | null) => useEvent.getState().setComparePair(pair),
};

export type ShowActions = typeof showActions;
