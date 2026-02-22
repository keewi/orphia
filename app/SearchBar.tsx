"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Musical } from "@/data/musicals";

function highlightMatch(title: string, query: string) {
  if (!query) return title;
  const idx = title.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return title;
  return (
    <>
      {title.slice(0, idx)}
      <mark className="typeahead-highlight">
        {title.slice(idx, idx + query.length)}
      </mark>
      {title.slice(idx + query.length)}
    </>
  );
}

interface SearchBarProps {
  musicals: Musical[];
  onSearch: (query: string) => void;
}

export default function SearchBar({ musicals, onSearch }: SearchBarProps) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = inputValue.trim()
    ? musicals.filter((m) =>
        m.title.toLowerCase().includes(inputValue.toLowerCase())
      )
    : [];

  const showDropdown = isOpen && inputValue.trim().length > 0;

  const selectSuggestion = useCallback(
    (musical: Musical) => {
      setInputValue(musical.title);
      onSearch(musical.title);
      setIsOpen(false);
      setHighlightedIndex(-1);
    },
    [onSearch]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setIsOpen(true);
    setHighlightedIndex(-1);
    onSearch(val);
  };

  const handleClear = () => {
    setInputValue("");
    onSearch("");
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[highlightedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="search-container" ref={containerRef}>
      <div className="search-input-wrapper">
        <span className="search-icon" aria-hidden="true">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="Search musicals..."
          value={inputValue}
          onChange={handleChange}
          onFocus={() => inputValue.trim() && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          aria-controls="typeahead-list"
        />
        {inputValue && (
          <button
            type="button"
            className="search-clear"
            onClick={handleClear}
            aria-label="Clear search"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="typeahead-dropdown" id="typeahead-list" role="listbox">
          {suggestions.length === 0 ? (
            <div className="typeahead-no-results">No musicals found</div>
          ) : (
            suggestions.map((m, index) => (
              <div
                key={m.id}
                className={`typeahead-option ${index === highlightedIndex ? "highlighted" : ""}`}
                role="option"
                aria-selected={index === highlightedIndex}
                onClick={() => selectSuggestion(m)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <span className="typeahead-option-title">
                  {highlightMatch(m.title, inputValue)}
                </span>
                <span className="typeahead-option-year">{m.year}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
