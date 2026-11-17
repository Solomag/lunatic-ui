import React from "react";
import { LunaButton } from "@luna/ui";
import { requestJson } from "../net";
import { LunaticSearch } from "./controls";

type SupporterUser = { login: string; avatarUrl: string; url: string };

const SupporterGrid = React.memo(({ users }: { users: SupporterUser[] }) => (
  <div data-lunatic-supporter-grid="true">
    {users.map((user) => (
      <a key={`${user.login}:${user.url}`} href={user.url} target="_blank" rel="noreferrer" data-lunatic-supporter="true">
        <img src={user.avatarUrl} alt="" loading="lazy" />
        <span>{user.login}</span>
      </a>
    ))}
  </div>
));

const LunaticSupporterSection = React.memo(({ kind, query }: { kind: "sponsors" | "contributors" | "stars"; query: string }) => {
  const [users, setUsers] = React.useState<SupporterUser[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [error, setError] = React.useState<string | undefined>();
  const [starCount, setStarCount] = React.useState<number | undefined>();
  const [hideStars, setHideStars] = React.useState(false);

  const title = kind === "sponsors" ? "Sponsors ❤️" : kind === "contributors" ? "Contributors 👾" : "Stargazers ⭐";
  const filteredUsers = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? users.filter((user) => user.login.toLowerCase().includes(q)) : users;
  }, [query, users]);

  const loadStarCountFallback = React.useCallback(async () => {
    try {
      const repo = await requestJson<{ stargazers_count?: number }>("https://api.github.com/repos/Inrixia/TidaLuna");
      if (typeof repo.stargazers_count === "number") {
        setStarCount(repo.stargazers_count);
        setHideStars(false);
        return true;
      }
    } catch {
      // Public repository metadata can also fail (offline/rate limit). In that
      // case the section is simply omitted instead of surfacing API noise.
    }
    setHideStars(true);
    return false;
  }, []);

  const load = React.useCallback(async (nextPage = page) => {
    if (loading || (!hasMore && nextPage !== 1)) return;
    setLoading(true);
    setError(undefined);
    try {
      let next: SupporterUser[] = [];
      if (kind === "sponsors") {
        const data = await requestJson<Array<{ login: string; avatarUrl: string; url: string }>>("https://sponsors.hug.rip");
        next = data;
        setHasMore(false);
      } else if (kind === "contributors") {
        const data = await requestJson<Array<{ login: string; avatar_url: string; html_url: string }>>(`https://api.github.com/repos/Inrixia/TidaLuna/contributors?per_page=100&page=${nextPage}`);
        next = data.map(({ login, avatar_url, html_url }) => ({ login, avatarUrl: avatar_url, url: html_url }));
        setHasMore(data.length === 100);
      } else {
        try {
          const data = await requestJson<Array<{ user: { login: string; avatar_url: string; html_url: string } }>>(
            `https://api.github.com/repos/Inrixia/TidaLuna/stargazers?per_page=100&page=${nextPage}`,
            { headers: { Accept: "application/vnd.github.v3.star+json" } },
          );
          next = data.map(({ user }) => ({ login: user.login, avatarUrl: user.avatar_url, url: user.html_url }));
          setHasMore(data.length === 100);
          setStarCount(undefined);
          setHideStars(false);
        } catch {
          // GitHub no longer exposes the stargazer identity list to every
          // unauthenticated client. Preserve useful public information without
          // pretending this is a Lunatic/TidaLuna failure.
          setUsers([]);
          setHasMore(false);
          await loadStarCountFallback();
          return;
        }
      }
      setUsers((current) => nextPage === 1 ? next : [...current, ...next]);
      setPage(nextPage);
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }, [hasMore, kind, loadStarCountFallback, loading, page]);

  React.useEffect(() => { if (users.length === 0 && !(kind === "stars" && starCount !== undefined)) void load(1); }, []);

  if (kind === "stars" && hideStars) return null;

  return (
    <section data-lunatic-supporters-section={kind} data-lunatic-layout-owner="lunatic-ui">
      <header data-lunatic-settings-section-header="true"><strong>{title}</strong></header>
      {error && kind !== "stars" && <div role="alert" data-lunatic-settings-error="true">{error}</div>}
      {kind === "stars" && starCount !== undefined ? (
        query.trim() ? <div data-lunatic-empty-state="true">Stargazer identities are unavailable for search.</div> : <div data-lunatic-stargazer-count="true">★ {starCount.toLocaleString()} stars</div>
      ) : filteredUsers.length > 0 ? (
        <SupporterGrid users={filteredUsers} />
      ) : !loading ? (
        <div data-lunatic-empty-state="true">No supporters match the current search.</div>
      ) : null}
      {loading && <div data-lunatic-supporters-loading="true">Loading…</div>}
      {!loading && hasMore && kind !== "sponsors" && <LunaButton size="small" onClick={() => void load(page + 1)}>Load more</LunaButton>}
    </section>
  );
});

export const LunaticSupporters = React.memo(({ active: _active }: { active: boolean }) => {
  const [query, setQuery] = React.useState("");
  return (
    <div data-lunatic-supporters-page="true" data-lunatic-layout-owner="lunatic-ui">
      <label data-lunatic-page-search-field="true">
        <span>Search</span>
        <LunaticSearch value={query} onChange={setQuery} placeholder="Search supporters…" ariaLabel="Search supporters" />
      </label>
      <LunaticSupporterSection kind="sponsors" query={query} />
      <LunaticSupporterSection kind="contributors" query={query} />
      <LunaticSupporterSection kind="stars" query={query} />
    </div>
  );
});
