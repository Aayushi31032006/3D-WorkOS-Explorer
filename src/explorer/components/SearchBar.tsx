import React, { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, X, Loader2 } from 'lucide-react';
import { BusinessObject, DataProvider } from '../../types';

export interface SearchBarProps {
  dataProvider: DataProvider;
  companyId: string;
  connectedToId?: string;
  onSelectObject: (obj: BusinessObject) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  dataProvider,
  companyId,
  connectedToId,
  onSelectObject
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BusinessObject[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounced search query with AbortSignal cancellation (Requirement 2.1 & 2.15)
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      setActiveIndex(-1);
      setSearchError(null);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setSearchError(null);
        const matches = await dataProvider.searchObjects(query, companyId, controller.signal, connectedToId);
        setResults(matches);
        setIsOpen(true);
        setActiveIndex(-1);
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error('Search failed');
        if (error.name !== 'AbortError') {
          setSearchError('Search failed');
          setResults([]);
          setIsOpen(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, dataProvider, companyId, connectedToId]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (obj: BusinessObject) => {
    onSelectObject(obj);
    setQuery('');
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
  };

  // Keyboard navigation for combobox ARIA (ArrowUp/Down/Enter/Escape)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' && results.length > 0) {
        setIsOpen(true);
        setActiveIndex(0);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < results.length) {
        handleSelect(results[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div 
      className="wos-search-container" 
      ref={containerRef}
      role="combobox"
      aria-expanded={isOpen}
      aria-haspopup="listbox"
      aria-controls="wos-search-results-listbox"
    >
      <div className="wos-search-input-wrap">
        <SearchIcon size={16} color="var(--wos-label-muted)" />
        <input
          ref={inputRef}
          type="text"
          className="wos-search-input"
          placeholder="Search connected records in this company"
          aria-label="Search connected records in this company"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0 || searchError) setIsOpen(true);
          }}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 && results[activeIndex] 
              ? `search-opt-${results[activeIndex].id}` 
              : undefined
          }
        />
        {loading && <Loader2 size={14} className="wos-spinner" />}
        {query && !loading && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            aria-label="Clear search input"
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: 'var(--wos-label-muted)',
              display: 'flex'
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && (
        <div 
          id="wos-search-results-listbox"
          className="wos-search-dropdown" 
          role="listbox"
          aria-label="Search results"
        >
          {searchError ? (
            <div style={{ padding: '12px 16px', fontSize: '13px', color: '#c62828', textAlign: 'center' }}>
              {searchError}
            </div>
          ) : results.length === 0 ? (
            <div style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--wos-label-muted)', textAlign: 'center' }}>
              No matches found
            </div>
          ) : (
            results.map((obj, idx) => {
              const isSelected = activeIndex === idx;
              return (
                <div
                  id={`search-opt-${obj.id}`}
                  key={obj.id}
                  role="option"
                  aria-selected={isSelected}
                  className={`wos-search-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelect(obj)}
                  onMouseEnter={() => setActiveIndex(idx)}
                >
                  <div className="wos-search-item-info">
                    <span className="wos-search-item-title">{obj.name}</span>
                    {obj.owner && (
                      <span className="wos-search-item-owner">· {obj.owner}</span>
                    )}
                  </div>
                  <span className="wos-search-type-badge">{obj.type}</span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
