"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Search, X, History, TrendingUp } from "lucide-react";

interface Suggestion {
  _id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
}

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

const POPULAR_SEARCHES = [
  "Banarasi Saree",
  "Kalidar Anarkali",
  "Peacock Silk Dupatta",
  "Royal Bridal Lehenga",
  "Chanderi Silk Kurti",
  "Temple Border Saree",
];

const RECENT_KEY = "vrindav_recent_searches";

export default function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_KEY);
      if (saved) {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      }
    } catch {
      // ignore
    }
  }, [open]);

  const saveRecentSearch = (term: string) => {
    try {
      const trimmed = term.trim();
      if (!trimmed) return;
      const updated = [trimmed, ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleClose = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setQuery("");
    setSuggestions([]);
    setHighlightIndex(-1);
    setLoading(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}`
        );
        if (!res.ok) return;
        const data = (await res.json()) as { suggestions?: Suggestion[] };
        setSuggestions(data.suggestions || []);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const navigateToProduct = (slug: string, term?: string) => {
    if (term) saveRecentSearch(term);
    handleClose();
    router.push(`/product/${slug}`);
  };

  const executeSearch = (searchTerm: string) => {
    saveRecentSearch(searchTerm);
    handleClose();
    router.push(`/shop?q=${encodeURIComponent(searchTerm)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex >= 0 && suggestions[highlightIndex]) {
        navigateToProduct(suggestions[highlightIndex].slug, suggestions[highlightIndex].name);
      } else if (query.trim()) {
        executeSearch(query.trim());
      }
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4" role="dialog" aria-modal="true">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-[#171717]/40 backdrop-blur-xs"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Modal dialog */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-2xl"
          >
            {/* Input Bar */}
            <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-6 py-4">
              <Search
                size={20}
                className="shrink-0 text-[var(--color-text-muted)]"
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlightIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search products, collections..."
                className="flex-1 bg-transparent text-base text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]"
                autoComplete="off"
                role="combobox"
                aria-expanded={suggestions.length > 0}
                aria-controls="search-results"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="rounded-full p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                >
                  <X size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={handleClose}
                className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] hover:text-[var(--color-text)] pl-2"
              >
                Esc
              </button>
            </div>

            {/* Results or Suggestions */}
            <div id="search-results" className="max-h-[60vh] overflow-y-auto p-6">
              {loading && (
                <div className="flex items-center justify-center py-10">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
                </div>
              )}

              {!loading && query.trim() && suggestions.length === 0 && (
                <div className="py-8 text-center">
                  <p className="font-serif text-base text-[var(--color-text)]">
                    No products found
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    Try checking your spelling or searching for a broader term.
                  </p>
                </div>
              )}

              {!loading && suggestions.length > 0 && (
                <div className="space-y-1">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                    Products ({suggestions.length})
                  </p>
                  <ul className="divide-y divide-[var(--color-border)]">
                    {suggestions.map((item, idx) => (
                      <li key={item._id}>
                        <button
                          type="button"
                          onClick={() => navigateToProduct(item.slug, item.name)}
                          onMouseEnter={() => setHighlightIndex(idx)}
                          className={`flex w-full items-center gap-4 py-3 text-left transition-colors rounded-lg px-3 ${
                            idx === highlightIndex
                              ? "bg-[var(--color-bg-muted)]"
                              : "hover:bg-[var(--color-bg-muted)]"
                          }`}
                        >
                          <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded border border-[var(--color-border)] bg-[var(--color-bg-muted)]">
                            {item.images?.[0] && (
                              <Image
                                src={item.images[0]}
                                alt={item.name}
                                fill
                                sizes="48px"
                                className="object-cover object-center"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-serif text-sm font-medium text-[var(--color-text)] truncate">
                              {item.name}
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                              ₹{Number(item.price).toLocaleString("en-IN")}
                            </p>
                          </div>
                          <ArrowRight
                            size={16}
                            className="shrink-0 text-[var(--color-text-subtle)]"
                          />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!loading && !query.trim() && (
                <div className="space-y-6">
                  {recentSearches.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                        <History size={13} />
                        <span>Recent Searches</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((term) => (
                          <button
                            key={term}
                            type="button"
                            onClick={() => executeSearch(term)}
                            className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3.5 py-1.5 text-xs text-[var(--color-text)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                      <TrendingUp size={13} />
                      <span>Popular Searches</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {POPULAR_SEARCHES.map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => executeSearch(term)}
                          className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3.5 py-1.5 text-xs text-[var(--color-text)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
