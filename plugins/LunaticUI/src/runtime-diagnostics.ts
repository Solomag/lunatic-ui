export type LunaticRuntimeCounters = {
  playBarPolls: number;
  playBarBindChanges: number;
  playBarResizeCallbacks: number;
  playBarAttributeCallbacks: number;
  playBarRafQueued: number;
  playBarRafApplied: number;
};

export type LunaticLifecycleRecord = {
  id: number;
  version: string;
  loadedAt: number;
  unloadedAt?: number;
  adaptiveHealth: "pending" | "healthy" | "failed";
  legacyFallbackActive: boolean;
  counters: LunaticRuntimeCounters;
};

type LunaticDiagnosticsApi = {
  current: LunaticLifecycleRecord;
  history: LunaticLifecycleRecord[];
  snapshot(): {
    current: LunaticLifecycleRecord;
    history: LunaticLifecycleRecord[];
    uptimeMs: number;
  };
};

const globalWindow = window as typeof window & {
  __lunaticUiDiagnostics?: LunaticDiagnosticsApi;
  __lunaticUiLifecycleHistory?: LunaticLifecycleRecord[];
  __lunaticUiLifecycleSequence?: number;
};

const history = globalWindow.__lunaticUiLifecycleHistory ??= [];
const id = (globalWindow.__lunaticUiLifecycleSequence ?? 0) + 1;
globalWindow.__lunaticUiLifecycleSequence = id;

const current: LunaticLifecycleRecord = {
  id,
  version: "unknown",
  loadedAt: Date.now(),
  adaptiveHealth: "pending",
  legacyFallbackActive: false,
  counters: {
    playBarPolls: 0,
    playBarBindChanges: 0,
    playBarResizeCallbacks: 0,
    playBarAttributeCallbacks: 0,
    playBarRafQueued: 0,
    playBarRafApplied: 0,
  },
};
history.push(current);

function cloneRecord(record: LunaticLifecycleRecord): LunaticLifecycleRecord {
  return {
    ...record,
    counters: { ...record.counters },
  };
}

globalWindow.__lunaticUiDiagnostics = {
  current,
  history,
  snapshot() {
    return {
      current: cloneRecord(current),
      history: history.map(cloneRecord),
      uptimeMs: Date.now() - current.loadedAt,
    };
  },
};

export function initializeRuntimeDiagnostics(version: string) {
  current.version = version;
}

export function incrementRuntimeCounter(counter: keyof LunaticRuntimeCounters) {
  current.counters[counter] += 1;
}

export function setAdaptiveHealthDiagnostic(
  health: LunaticLifecycleRecord["adaptiveHealth"],
) {
  current.adaptiveHealth = health;
}

export function setLegacyFallbackDiagnostic(active: boolean) {
  current.legacyFallbackActive = active;
}

export function markRuntimeDiagnosticsUnloaded() {
  current.unloadedAt = Date.now();
  current.legacyFallbackActive = false;
}
