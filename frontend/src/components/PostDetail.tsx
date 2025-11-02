import React from 'react';
import { Post } from '../types';
import { getImageUrl } from '../config/api';

interface PostDetailProps {
  post: Post;
  onBack: () => void;
}

const PostDetail: React.FC<PostDetailProps> = ({ post, onBack }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <button onClick={onBack} className="btn" style={{ marginBottom: '2rem' }}>
        ← Back to Posts
      </button>
      
      <div className="post-card" style={{ cursor: 'default', transform: 'none', boxShadow: 'none' }}>
        <h1 className="post-title" style={{ fontSize: '2rem', marginBottom: '1rem' }}>
          {post.title}
        </h1>
        
        <div className="post-date" style={{ marginBottom: '2rem' }}>
          {formatDate(post.createdAt)}
        </div>
        
        <div style={{ 
          color: '#333',
          lineHeight: '1.6',
          marginBottom: '2rem',
          whiteSpace: 'pre-wrap'
        }}>
          {post.content}
        </div>
        
        {post.images.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginTop: '2rem'
          }}>
            {post.images.map((image, index) => (
              <img
                key={index}
                src={getImageUrl(image)}
                alt={`Post image ${index + 1}`}
                style={{
                  width: '100%',
                  height: '200px',
                  objectFit: 'cover',
                  border: '2px solid #000'
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostDetail;