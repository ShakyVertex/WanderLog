import React, { useState, useEffect, useCallback } from 'react';
import { useSearch } from '../contexts/SearchContext';
import { useDebounce } from '../hooks/useDebounce';
import { Post } from '../types';

interface SearchBarProps {
  posts: Post[];
}

const SearchBar: React.FC<SearchBarProps> = React.memo(({ posts }) => {
  const { state, setQuery, filterPosts, setSearching, addToHistory, clearSearch } = useSearch();
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debouncedSearchTerm = useDebounce(inputValue, 300);

  // Filter posts based on search query
  const filterPostsByQuery = useCallback((searchQuery: string, allPosts: Post[]): Post[] => {
    if (!searchQuery.trim()) {
      return allPosts;
    }

    const query = searchQuery.toLowerCase();
    return allPosts.filter(post => 
      post.title.toLowerCase().includes(query) ||
      post.content.toLowerCase().includes(query)
    );
  }, []);

  // Effect for debounced search
  useEffect(() => {
    setQuery(debouncedSearchTerm);
    setSearching(!!debouncedSearchTerm);

    if (debouncedSearchTerm) {
      const filtered = filterPostsByQuery(debouncedSearchTerm, posts);
      filterPosts(filtered);
      
      // Add to search history if it's a meaningful search (3+ chars)
      if (debouncedSearchTerm.length >= 3) {
        addToHistory(debouncedSearchTerm);
      }
    } else {
      filterPosts(posts);
    }
    
    setSearching(false);
  }, [debouncedSearchTerm, posts]); // Remove context functions from dependencies

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setShowSuggestions(!!value);
  };

  const handleClearSearch = () => {
    setInputValue('');
    clearSearch();
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="search-container">
      <div className="search-input-wrapper">
        <input
          type="text"
          placeholder="Search posts by title or content..."
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(!!inputValue)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onKeyDown={handleKeyDown}
          className="search-input"
        />
        {inputValue && (
          <button 
            onClick={handleClearSearch}
            className="search-clear"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
        {state.isSearching && (
          <div className="search-loading">
            <span className="spinner">⟳</span>
          </div>
        )}
      </div>
      
      {showSuggestions && state.searchHistory.length > 0 && (
        <div className="search-suggestions">
          <div className="suggestions-header">Recent searches:</div>
          {state.searchHistory.map((suggestion, index) => (
            <button
              key={index}
              className="suggestion-item"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              🕒 {suggestion}
            </button>
          ))}
        </div>
      )}
      
      {state.query && (
        <div className="search-results-info">
          Found {state.filteredPosts.length} post{state.filteredPosts.length !== 1 ? 's' : ''} 
          {state.query && ` for "${state.query}"`}
        </div>
      )}
    </div>
  );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;