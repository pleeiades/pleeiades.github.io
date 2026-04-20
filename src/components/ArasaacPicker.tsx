import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ArasaacResult } from '../types';
import { db } from '../db';

const SEARCH_URL = 'https://api.arasaac.org/api/pictograms/en/search/';
const IMAGE_URL = (id: number) =>
  `https://static.arasaac.org/pictograms/${id}/${id}_500.png`;
const PREF_KEY = 'lastCategory';

async function searchArasaac(query: string): Promise<ArasaacResult[]> {
  const res = await fetch(`${SEARCH_URL}${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`ARASAAC error: ${res.status}`);
  return res.json();
}

async function fetchImageAsDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch image');
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function titleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

interface Props {
  initialQuery: string;
  onSelect: (dataUrl: string, arasaacId: number) => void;
}

export default function ArasaacPicker({ initialQuery, onSelect }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [category, setCategory] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    db.preferences.get(PREF_KEY).then((pref) => {
      if (pref) setCategory(pref.value);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['arasaac', debouncedQuery],
    queryFn: () => searchArasaac(debouncedQuery),
    enabled: debouncedQuery.trim().length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const allResults = data ?? [];

  const availableCategories = Array.from(
    new Set(allResults.flatMap((r) => r.categories ?? []))
  ).sort();

  const filtered = category
    ? allResults.filter((r) => (r.categories ?? []).includes(category))
    : allResults;
  const results = filtered.slice(0, 20);

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    if (val) {
      db.preferences.put({ key: PREF_KEY, value: val }).catch(() => {});
    } else {
      db.preferences.delete(PREF_KEY).catch(() => {});
    }
  };

  const handlePick = async (result: ArasaacResult) => {
    setLoadingId(result._id);
    try {
      const dataUrl = await fetchImageAsDataUrl(IMAGE_URL(result._id));
      onSelect(dataUrl, result._id);
    } catch {
      alert('Could not load this image. Please try another or use the Upload tab.');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="arasaac-search" className="block text-sm font-medium text-gray-700 mb-1">
          Search pictograms
        </label>
        <input
          id="arasaac-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. cat, eat, happy…"
          className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {allResults.length > 0 && availableCategories.length > 0 && (
        <div>
          <label htmlFor="arasaac-category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <div className="flex items-center gap-2">
            <select
              id="arasaac-category"
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="flex-1 border border-gray-300 rounded-xl px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All categories</option>
              {availableCategories.map((c) => (
                <option key={c} value={c}>{titleCase(c)}</option>
              ))}
            </select>
            {category && (
              <button
                onClick={() => handleCategoryChange('')}
                className="flex items-center gap-1 bg-blue-100 text-blue-700 text-sm px-3 py-1.5 rounded-full hover:bg-blue-200 transition-colors whitespace-nowrap"
                aria-label={`Clear ${titleCase(category)} filter`}
              >
                {titleCase(category)}
                <span aria-hidden="true" className="text-base leading-none">×</span>
              </button>
            )}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-8 text-gray-400">
          <svg className="animate-spin h-6 w-6 mr-2" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Searching…
        </div>
      )}

      {isError && (
        <div className="bg-red-50 text-red-700 rounded-xl p-3 text-sm">
          Could not reach ARASAAC. Check your connection, or use the Upload tab to add your own image.
        </div>
      )}

      {!isLoading && !isError && debouncedQuery && results.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-4">
          {category
            ? <>No "{debouncedQuery}" results in {titleCase(category)}. <button onClick={() => handleCategoryChange('')} className="underline">Clear filter</button></>
            : `No results for "${debouncedQuery}".`
          }
        </p>
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
          {results.map((r) => {
            const keyword = r.keywords[0]?.keyword ?? '';
            return (
              <button
                key={r._id}
                onClick={() => handlePick(r)}
                disabled={loadingId !== null}
                className="aspect-square bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-400 rounded-xl p-1 flex flex-col items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                title={keyword}
                aria-label={keyword}
              >
                {loadingId === r._id ? (
                  <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <img
                    src={IMAGE_URL(r._id)}
                    alt={keyword}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
