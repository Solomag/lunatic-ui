import React from "react";
import { LunaButton, LunaSwitch, confirm } from "@luna/ui";
import { redux, Tidal } from "@luna/lib";
import {
  FEATURE_FLAG_CATEGORY_ORDER,
  featureFlagCategory,
  humanizeFlagName,
  knownFlagDescription,
} from "./feature-flag-catalog";
import { LunaticSearch, LunaticSelect } from "./controls";

type FeatureFlagViewFilter = "all" | "overridden" | "enabled" | "disabled";


function getFeatureFlagState() {
  const state: any = redux.store.getState().featureFlags;
  const current = { ...Tidal.featureFlags } as Record<string, any>;
  const baseByName = new Map<string, any>();
  for (const flag of Object.values(state?.flags ?? {}) as any[]) {
    if (flag?.name) baseByName.set(flag.name, flag);
  }
  return { current, baseByName, overrides: { ...(state?.userOverrides ?? {}) } as Record<string, boolean> };
}

export const LunaticFeatureFlags = React.memo(() => {
  const [snapshot, setSnapshot] = React.useState(getFeatureFlagState);
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<FeatureFlagViewFilter>("all");

  const refresh = React.useCallback(() => setSnapshot(getFeatureFlagState()), []);
  const entries = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return Object.values(snapshot.current)
      .map((flag: any) => {
        const base = snapshot.baseByName.get(flag.name);
        const overridden = Object.prototype.hasOwnProperty.call(snapshot.overrides, flag.name);
        return {
          flag,
          baseValue: base?.value,
          overridden,
          category: featureFlagCategory(flag.name),
          description: knownFlagDescription(flag.name),
        };
      })
      .filter(({ flag, overridden, description }) => {
        if (q && !flag.name.toLowerCase().includes(q) && !humanizeFlagName(flag.name).toLowerCase().includes(q) && !(description?.toLowerCase().includes(q))) return false;
        if (filter === "overridden" && !overridden) return false;
        if (filter === "enabled" && !flag.value) return false;
        if (filter === "disabled" && flag.value) return false;
        return true;
      })
      .sort((a, b) => a.flag.name.localeCompare(b.flag.name));
  }, [snapshot, query, filter]);

  const grouped = React.useMemo(() => {
    const map = new Map<string, typeof entries>();
    for (const entry of entries) {
      const list = map.get(entry.category) ?? [];
      list.push(entry);
      map.set(entry.category, list);
    }
    const order = FEATURE_FLAG_CATEGORY_ORDER;
    return order.filter((name) => map.has(name)).map((name) => [name, map.get(name)!] as const);
  }, [entries]);

  const toggle = React.useCallback((flag: any) => {
    redux.actions["featureFlags/TOGGLE_USER_OVERRIDE"]({ ...flag, value: !flag.value });
    queueMicrotask(refresh);
  }, [refresh]);

  const resetAllOverrides = React.useCallback(async () => {
    if (Object.keys(snapshot.overrides).length === 0) return;
    const result = await confirm({
      title: "Reset all feature flag overrides",
      description: "Remove every user override and return all feature flags to TIDAL's current defaults?",
      confirmationText: "Reset overrides",
      cancellationText: "Cancel",
    });
    if (!result.confirmed) return;
    redux.actions["featureFlags/SET_USER_OVERRIDES"]({});
    queueMicrotask(refresh);
  }, [snapshot.overrides, refresh]);


  const overrideCount = Object.keys(snapshot.overrides).length;

  return (
    <section data-lunatic-settings-section="feature-flags" data-lunatic-layout-owner="lunatic-ui">
      <header data-lunatic-settings-section-header="true">
        <div>
          <strong>Feature Flags</strong>
          <div data-lunatic-settings-section-meta="true">Internal TIDAL experiments. {Object.keys(snapshot.current).length} flags · {overrideCount} user override{overrideCount === 1 ? "" : "s"}.</div>
        </div>
      </header>

      <div data-lunatic-feature-flag-toolbar="true">
        <LunaticSearch value={query} onChange={setQuery} placeholder="Search flags" ariaLabel="Search feature flags" />
        <LunaticSelect<FeatureFlagViewFilter>
          value={filter}
          onChange={setFilter}
          ariaLabel="Filter feature flags by state"
          options={[
            { value: "all", label: "All states" },
            { value: "overridden", label: "Overridden" },
            { value: "enabled", label: "Enabled" },
            { value: "disabled", label: "Disabled" },
          ]}
        />
        <LunaButton disabled={overrideCount === 0} onClick={resetAllOverrides}>Reset all overrides</LunaButton>
      </div>

      <div data-lunatic-feature-flag-note="true">
        TIDAL does not expose human-readable flag descriptions. Lunatic uses a curated catalogue for known 2026 desktop flags and leaves genuinely unclear identifiers undescribed. Know more about an unknown flag? Submit its identifier and description to the Lunatic UI project.
      </div>


      <div data-lunatic-feature-flag-groups="true">
        {grouped.map(([group, flags]) => (
          <details key={group} open data-lunatic-feature-flag-group="true">
            <summary>
              <span>{group}</span>
              <span data-lunatic-feature-flag-chevron="true" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <path d="M15 18 9 12l6-6" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </summary>
            <div data-lunatic-feature-flags-grid="true">
              {flags.map(({ flag, baseValue, overridden, description }) => (
                <article key={flag.name} data-lunatic-feature-flag="true" data-lunatic-feature-flag-overridden={overridden ? "true" : "false"}>
                  <div data-lunatic-feature-flag-copy="true">
                    <div data-lunatic-feature-flag-name="true">{flag.name}</div>
                    {description && <div data-lunatic-feature-flag-description="true">{description}</div>}
                    <div data-lunatic-feature-flag-meta="true">
                      {overridden && <strong>Override</strong>}
                      {typeof baseValue === "boolean" && <span>Default: {baseValue ? "On" : "Off"}</span>}
                    </div>
                  </div>
                  <LunaSwitch checked={!!flag.value} disabled={flag.type !== "BOOLEAN"} onChange={() => toggle(flag)} />
                </article>
              ))}
            </div>
          </details>
        ))}
        {entries.length === 0 && <div data-lunatic-feature-flags-empty="true">No feature flags match the current filters.</div>}
      </div>
    </section>
  );
});
