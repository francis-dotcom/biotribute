"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

type TributeSearchResult = {
  slug: string;
  name: string;
  years: string;
};

type SearchState = "idle" | "loading" | "ready" | "empty" | "error";

export function TributeSearch() {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TributeSearchResult[]>([]);
  const [state, setState] = useState<SearchState>("idle");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setState("idle");
      return;
    }

    setState("loading");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch(`/api/tributes/search?q=${encodeURIComponent(trimmed)}`, {
            signal: controller.signal,
          });
          const data = (await response.json()) as {
            results?: TributeSearchResult[];
            error?: string;
          };

          if (!response.ok) {
            setResults([]);
            setState("error");
            return;
          }

          const nextResults = data.results ?? [];
          setResults(nextResults);
          setState(nextResults.length > 0 ? "ready" : "empty");
          setOpen(true);
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
          setResults([]);
          setState("error");
        }
      })();
    }, 280);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [query]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const showPanel = open && query.trim().length >= 2;

  return (
    <div className="bt-search" ref={rootRef}>
      <label className="bt-search-label" htmlFor="tribute-search-input">
        Search tributes
      </label>
      <input
        id="tribute-search-input"
        className="bt-search-input"
        type="search"
        value={query}
        placeholder="Find a tribute page…"
        autoComplete="off"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={listboxId}
        aria-autocomplete="list"
        onChange={(event) => {
          setQuery(event.currentTarget.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (query.trim().length >= 2) {
            setOpen(true);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {showPanel ? (
        <div className="bt-search-panel" id={listboxId} role="listbox">
          {state === "loading" ? (
            <p className="bt-search-message">Searching…</p>
          ) : null}
          {state === "error" ? (
            <p className="bt-search-message">Unable to search right now. Please try again.</p>
          ) : null}
          {state === "empty" ? (
            <p className="bt-search-message">No public tributes match &ldquo;{query.trim()}&rdquo;.</p>
          ) : null}
          {state === "ready"
            ? results.map((result) => (
                <Link
                  key={result.slug}
                  className="bt-search-result"
                  href={`/${result.slug}`}
                  role="option"
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  <span className="bt-search-result-name">{result.name}</span>
                  {result.years ? (
                    <span className="bt-search-result-years">{result.years}</span>
                  ) : null}
                </Link>
              ))
            : null}
        </div>
      ) : null}
    </div>
  );
}
