import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { Post } from '../types';

interface SearchState {
  query: string;
  filteredPosts: Post[];
  allPosts: Post[];
  isSearching: boolean;
  searchHistory: string[];
}

type SearchAction = 
  | { type: 'SET_QUERY'; payload: string }
  | { type: 'SET_ALL_POSTS'; payload: Post[] }
  | { type: 'FILTER_POSTS'; payload: Post[] }
  | { type: 'SET_SEARCHING'; payload: boolean }
  | { type: 'ADD_TO_HISTORY'; payload: string }
  | { type: 'CLEAR_SEARCH' }
  | { type: 'CLEAR_HISTORY' };

const searchReducer = (state: SearchState, action: SearchAction): SearchState => {
  switch (action.type) {
    case 'SET_QUERY':
      return {
        ...state,
        query: action.payload
      };
    case 'SET_ALL_POSTS':
      return {
        ...state,
        allPosts: action.payload,
        filteredPosts: state.query ? state.filteredPosts : action.payload
      };
    case 'FILTER_POSTS':
      return {
        ...state,
        filteredPosts: action.payload,
        isSearching: false
      };
    case 'SET_SEARCHING':
      return {
        ...state,
        isSearching: action.payload
      };
    case 'ADD_TO_HISTORY':
      const newHistory = [action.payload, ...state.searchHistory.filter(h => h !== action.payload)].slice(0, 5);
      return {
        ...state,
        searchHistory: newHistory
      };
    case 'CLEAR_SEARCH':
      return {
        ...state,
        query: '',
        filteredPosts: state.allPosts,
        isSearching: false
      };
    case 'CLEAR_HISTORY':
      return {
        ...state,
        searchHistory: []
      };
    default:
      return state;
  }
};

interface SearchContextType {
  state: SearchState;
  setQuery: (query: string) => void;
  setAllPosts: (posts: Post[]) => void;
  filterPosts: (posts: Post[]) => void;
  setSearching: (searching: boolean) => void;
  addToHistory: (query: string) => void;
  clearSearch: () => void;
  clearHistory: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

interface SearchProviderProps {
  children: ReactNode;
}

// Initialize search history outside component to avoid re-reading localStorage
const getInitialSearchHistory = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem('wanderlog-search-history') || '[]');
  } catch {
    return [];
  }
};

export const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(searchReducer, {
    query: '',
    filteredPosts: [],
    allPosts: [],
    isSearching: false,
    searchHistory: getInitialSearchHistory()
  });

  const setQuery = (query: string) => {
    dispatch({ type: 'SET_QUERY', payload: query });
  };

  const setAllPosts = (posts: Post[]) => {
    dispatch({ type: 'SET_ALL_POSTS', payload: posts });
  };

  const filterPosts = (posts: Post[]) => {
    dispatch({ type: 'FILTER_POSTS', payload: posts });
  };

  const setSearching = (searching: boolean) => {
    dispatch({ type: 'SET_SEARCHING', payload: searching });
  };

  const addToHistory = useCallback((query: string) => {
    if (query.trim()) {
      dispatch({ type: 'ADD_TO_HISTORY', payload: query.trim() });
      // Use a timeout to batch localStorage updates
      setTimeout(() => {
        localStorage.setItem('wanderlog-search-history', JSON.stringify(state.searchHistory));
      }, 100);
    }
  }, [state.searchHistory]);

  const clearSearch = () => {
    dispatch({ type: 'CLEAR_SEARCH' });
  };

  const clearHistory = () => {
    dispatch({ type: 'CLEAR_HISTORY' });
    localStorage.removeItem('wanderlog-search-history');
  };

  const value = {
    state,
    setQuery,
    setAllPosts,
    filterPosts,
    setSearching,
    addToHistory,
    clearSearch,
    clearHistory
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = (): SearchContextType => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};