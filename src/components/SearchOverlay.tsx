"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Search, X } from "lucide-react";

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

export default function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      return () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
      };
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}`,
        );
        if (!res.ok) return;
        const data = (await res.json()) as { suggestions?: Suggestion[] };
        setSuggestions(data.suggestions || []);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const navigateTo = (slug: string) => {
    handleClose();
    router.push(`/product/${slug}`);
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
        navigateTo(suggestions[highlightIndex].slug);
      } else if (query.trim()) {
        const q = query.trim();
        handleClose();
        router.push(`/shop?q=${encodeURIComponent(q)}`);
      }
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed left-0 right-0 top-0 z-[80] mx-auto w-full max-w-2xl px-4 pt-4 sm:pt-6"
          >
            <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/95 shadow-2xl backdrop-blur-2xl">
              <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-5 py-4">
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
                  placeholder="Search for divine treasures..."
                  className="flex-1 bg-transparent text-base text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]"
                  autoComplete="off"
                  role="combobox"
                  aria-expanded={suggestions.length > 0}
                  aria-controls="search-results"
                  aria-activedescendant={
                    highlightIndex >= 0 ? `search-item-${highlightIndex}` : undefined
                  }
                />
                <button
                  type="button"
                  onClick={handleClose}
                  className="shrink-0 rounded-full p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-white/10 hover:text-[var(--color-text)]"
                  aria-label="Close search"
                >
                  <X size={18} />
                </button>
              </div>

              <div
                id="search-results"
                role="listbox"
                className="max-h-[60vh] overflow-y-auto"
              >
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
                  </div>
                )}

                {!loading && query.trim() && suggestions.length === 0 && (
                  <div className="px-5 py-8 text-center">
                    <p className="text-sm text-[var(--color-text-muted)]">
                      No results found for &ldquo;{query}&rdquo;
                    </p>
                  </div>
                )}

                {!loading && suggestions.length > 0 && (
                  <ul className="p-2">
                    {suggestions.map((item, idx) => (
                      <li
                        key={item._id}
                        id={`search-item-${idx}`}
                        role="option"
                        aria-selected={idx === highlightIndex}
                      >
                        <button
                          type="button"
                          onClick={() => navigateTo(item.slug)}
                          onMouseEnter={() => setHighlightIndex(idx)}
                          className={`flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left transition-colors ${
                            idx === highlightIndex
                              ? "bg-white/10"
                              : "hover:bg-white/5"
                          }`}
                        >
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-white/5">
                            {item.images?.[0] ? (
                              <img
                                src={item.images[0]}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs text-[var(--color-text-muted)]">
                                No img
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-[var(--color-text)]">
                              {item.name}
                            </p>
                            <p className="mt-0.5 text-sm font-semibold text-[var(--color-secondary)]">
                              ₹{item.price.toLocaleString("en-IN")}
                            </p>
                          </div>
                          <ArrowRight
                            size={16}
                            className="shrink-0 text-[var(--color-text-muted)]"
                          />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {!loading && !query.trim() && (
                  <div className="px-5 py-8 text-center">
                    <p className="text-sm text-[var(--color-text-muted)]">
                      Start typing to search...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
