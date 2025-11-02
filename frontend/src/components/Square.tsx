import React, { useState, useEffect, useCallback } from 'react';
import PostCard from './PostCard';
import PostDetail from './PostDetail';
import SearchBar from './SearchBar';
import { Post } from '../types';
import { useSearch } from '../contexts/SearchContext';
import { getApiUrl } from '../config/api';

interface SquareProps {
  onRefresh?: () => void;
}

const Square: React.FC<SquareProps> = React.memo(({ onRefresh }) => {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { state, setAllPosts: setSearchPosts } = useSearch();

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl('/api/posts'));
      if (response.ok) {
        const data = await response.json();
        setAllPosts(data);
        setSearchPosts(data);
        setError(null);
      } else {
        setError('Failed to fetch posts');
      }
    } catch (err) {
      setError('Failed to fetch posts');
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  }, [setSearchPosts]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePostClick = useCallback((post: Post) => {
    setSelectedPost(post);
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedPost(null);
  }, []);

  if (selectedPost) {
    return <PostDetail post={selectedPost} onBack={handleBackToList} />;
  }

  const displayPosts = state.query ? state.filteredPosts : allPosts;

  return (
    <div className="square-container">
      <SearchBar posts={allPosts} />
      
      {error && <div className="error">{error}</div>}
      
      {loading ? (
        <div className="loading">Loading posts...</div>
      ) : (
        <div className="posts-grid">
          {displayPosts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              {state.query ? 
                `No posts found matching "${state.query}"` : 
                "No posts yet. Create the first one in the \"Create New\" tab!"
              }
            </div>
          ) : (
            displayPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onClick={() => handlePostClick(post)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
});

Square.displayName = 'Square';

export default Square;