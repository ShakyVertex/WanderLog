import React from 'react';
import { Post } from '../types';
import { getImageUrl } from '../config/api';

interface PostCardProps {
  post: Post;
  onClick: () => void;
}

const PostCard: React.FC<PostCardProps> = React.memo(({ post, onClick }) => {
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
    <div className="post-card" onClick={onClick}>
      <h3 className="post-title">{post.title}</h3>
      <p className="post-content">{post.content}</p>
      
      {post.images.length > 0 && (
        <div className="post-images">
          {post.images.slice(0, 3).map((image, index) => (
            <img
              key={index}
              src={getImageUrl(image)}
              alt={`Post image ${index + 1}`}
            />
          ))}
          {post.images.length > 3 && (
            <div style={{ 
              width: '60px', 
              height: '60px', 
              border: '1px solid #000', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: '#f5f5dc',
              fontSize: '12px'
            }}>
              +{post.images.length - 3}
            </div>
          )}
        </div>
      )}
      
      <div className="post-date">{formatDate(post.createdAt)}</div>
    </div>
  );
});

PostCard.displayName = 'PostCard';

export default PostCard;