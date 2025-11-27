import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useFlash } from "../context/flashContext";
import groupAPI from "../api/groups";
import postsAPI from "../api/posts";
import profilesAPI from "../api/profiles";

function GroupPage() {
  const { groupId } = useParams();
  const { showFlash } = useFlash();
  const uuid = localStorage.getItem('uuid');

  const [activeTab, setActiveTab] = useState('feed');
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postType, setPostType] = useState('insight');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [commentTexts, setCommentTexts] = useState({});
  const [username, setUsername] = useState('');

  const [webinarTitle, setWebinarTitle] = useState('');
  const [webinarLink, setWebinarLink] = useState('');
  const [webinars, setWebinars] = useState([]);


  const [postsVisibleToNonMembers, setPostsVisibleToNonMembers] = useState(true);

  const isUserInGroup = () => group?.members?.some(m => m.uuid === uuid);
  const isUserAdmin = () => group?.members?.some(m => m.uuid === uuid && m.role === 'admin');

  const postTypeMap = {
    insight: 'insight',
    strategy: 'strategy',
    success_story: 'success_story',
    challenge: 'challenge',
    opportunity: 'opportunity',
  };

  useEffect(() => {
    if (!groupId) return;
    fetchGroupData();
    fetchPosts();
    fetchUserProfile();
  }, [groupId]);

  const fetchGroupData = async () => {
    try {
      const data = await groupAPI.getGroup(groupId);
      setGroup(data);

  
      setPostsVisibleToNonMembers(data.postsVisibleToNonMembers ?? true);

    } catch (error) {
      console.error('Error fetching group:', error);
      showFlash('Failed to load group', 'error');
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await profilesAPI.get();
      const user = response.data;
      if (user?.username) setUsername(user.username);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await postsAPI.getGroupPosts(groupId);
      const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setPosts(sorted);
      setWebinars(sorted.filter(p => p.postType === 'coaching'));
    } catch (error) {
      console.error('Error fetching posts:', error);
      showFlash('Failed to load posts', 'error');
    }
    setLoading(false);
  };

  const handleCreatePost = async () => {
    if (!isUserInGroup()) return showFlash('You must be a member of this group to post', 'error');
    if (!postTitle.trim() || !postContent.trim()) return showFlash('Please fill in all fields', 'error');

    setLoading(true);
    try {
      await postsAPI.createPost({
        groupId,
        uuid,
        title: postTitle,
        content: postContent,
        postType,
        isAnonymous,
        username: isAnonymous ? "Anonymous" : username,
      });
      showFlash('Post created successfully!', 'success');
      setPostTitle('');
      setPostContent('');
      setPostType('insight');
      setIsAnonymous(false);
      fetchPosts();
    } catch (error) {
      showFlash(error.message, 'error');
    }
    setLoading(false);
  };

  const handleCreateWebinar = async () => {
    if (!isUserInGroup()) return showFlash('You must join the group to post webinars', 'error');
    if (!webinarTitle.trim() || !webinarLink.trim()) return showFlash('Please fill in both fields', 'error');

    try {
      await postsAPI.createPost({
        groupId,
        uuid,
        title: webinarTitle,
        content: webinarLink,
        postType: 'coaching',
        isAnonymous: false,
        username,
      });
      showFlash('Webinar posted!', 'success');
      setWebinarTitle('');
      setWebinarLink('');
      fetchPosts();
    } catch (error) {
      showFlash('Failed to post webinar', 'error');
    }
  };

  const handleLikePost = async (postId) => {
    try {
      await postsAPI.likePost(groupId, postId, uuid);
      fetchPosts();
    } catch (error) {
      showFlash('Failed to like post', 'error');
    }
  };

  const handleUnlikePost = async (postId) => {
    try {
      await postsAPI.unlikePost(groupId, postId, uuid);
      fetchPosts();
    } catch (error) {
      showFlash('Failed to unlike post', 'error');
    }
  };

  const handleAddComment = async (postId) => {
    if (!isUserInGroup()) return showFlash('You must be a member of this group to comment', 'error');
    const commentText = commentTexts[postId];
    if (!commentText?.trim()) return showFlash('Comment cannot be empty', 'error');

    try {
      await postsAPI.addComment(groupId, postId, commentText, uuid, isAnonymous ? "Anonymous" : username);
      setCommentTexts({ ...commentTexts, [postId]: '' });
      fetchPosts();
      showFlash('Comment added!', 'success');
    } catch (error) {
      showFlash('Failed to add comment', 'error');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await postsAPI.deletePost(groupId, postId, uuid);
      showFlash('Post deleted successfully', 'success');
      fetchPosts();
    } catch (error) {
      console.error(error);
      showFlash('Failed to delete post', 'error');
    }
  };

  const handleDeleteComment = async (postId, commentId, commentUuid) => {
    if (commentUuid !== uuid && !isUserAdmin()) return showFlash('You can only delete your own comment unless you are an admin', 'error');
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await postsAPI.deleteComment(groupId, postId, commentId, uuid);
      showFlash('Comment deleted successfully', 'success');
      fetchPosts();
    } catch (error) {
      showFlash('Failed to delete comment', 'error');
    }
  };


  const handleTogglePrivacy = async (value) => {
  try {
    setPostsVisibleToNonMembers(value);
    await groupAPI.updateGroupSettings(groupId, { postsVisibleToNonMembers: value });
    showFlash('Privacy updated', 'success');
  } catch (err) {
    console.error(err);
    showFlash('Failed to update privacy', 'error');
  }
};

  if (!group) return <div style={{ padding: '20px' }}>Loading group...</div>;

  let displayedPosts = [];
  if (activeTab === 'feed') {
    displayedPosts = posts.filter(p => p.postType !== 'coaching');
  } else if (postTypeMap[activeTab]) {
    displayedPosts = posts.filter(p => p.postType === postTypeMap[activeTab]);
  }

  return (
    <div style={{ width: '100%', backgroundColor: '#f3f4f6', minHeight: '100vh', padding: '32px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '24px', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, marginBottom: '8px' }}>{group.name}</h1>
          <p style={{ color: '#666', margin: 0, marginBottom: '16px' }}>{group.category}</p>
          <p style={{ fontSize: '14px', color: '#999', margin: 0 }}>
            {group.members?.length || 0} / {group.maxMembers} members
          </p>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid #ddd', backgroundColor: '#ffffff', borderRadius: '12px 12px 0 0', padding: '16px' }}>
          {['feed', 'insight', 'strategy', 'success_story', 'challenge', 'opportunity', 'coaching', 'privacy'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                paddingBottom: '12px',
                paddingLeft: '16px',
                paddingRight: '16px',
                fontWeight: 'bold',
                borderBottom: activeTab === tab ? '2px solid #14b8a6' : 'none',
                color: activeTab === tab ? '#14b8a6' : '#666',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                textTransform: 'capitalize'
              }}
            >
              {tab === 'feed' ? 'All Posts' : tab.replace('_', ' ')}
            </button>
          ))}
        </div>


        {activeTab === 'privacy' && (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Group Privacy</h3>

            {!isUserAdmin() && (
              <p style={{ color: '#999' }}>Only admins can manage privacy settings.</p>
            )}

            {isUserAdmin() && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px' }}>
                <input
                  type="checkbox"
                  checked={postsVisibleToNonMembers}
                  onChange={(e) => handleTogglePrivacy(e.target.checked)}
                />
                Allow non-members to view posts
              </label>
            )}
          </div>
        )}


        {activeTab !== 'coaching' && activeTab !== 'privacy' && (
          <>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '24px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginTop: 0 }}>Share with Your Community</h3>
              {!isUserInGroup() && (
                <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                  <p style={{ color: '#92400e', margin: 0 }}>⚠️ You must join this group to post and comment</p>
                </div>
              )}
              <input
                type="text"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                placeholder="Post Title"
                style={{ width: '100%', padding: '10px', marginBottom: '16px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }}
              />
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="Content..."
                style={{ width: '100%', padding: '10px', marginBottom: '16px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', minHeight: '100px' }}
              />
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <select value={postType} onChange={(e) => setPostType(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}>
                  <option value="insight">Insight</option>
                  <option value="strategy">Strategy</option>
                  <option value="success_story">Success Story</option>
                  <option value="challenge">Challenge</option>
                  <option value="opportunity">Opportunity</option>
                </select>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} />
                  Post Anonymously
                </label>
              </div>
              <button
                onClick={handleCreatePost}
                disabled={loading || !isUserInGroup()}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold', cursor: loading || !isUserInGroup() ? 'not-allowed' : 'pointer', opacity: loading || !isUserInGroup() ? 0.5 : 1 }}
              >
                {loading ? 'Posting...' : 'Post'}
              </button>
            </div>

            <div>
              {loading ? (
                <p>Loading posts...</p>
              ) : displayedPosts.length === 0 ? (
                <p>No posts yet.</p>
              ) : (
                displayedPosts.map(post => (
                  <div
                    key={post.id}
                    style={{
                      filter: !postsVisibleToNonMembers && !isUserInGroup() ? 'blur(5px)' : 'none',
                      pointerEvents: !postsVisibleToNonMembers && !isUserInGroup() ? 'none' : 'auto',
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '16px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                          <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', marginRight: '8px' }}>
                            {post.postType}
                          </span>
                          {post.isAnonymous ? 'Anonymous' : post.username}
                        </div>
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>{post.title}</h3>
                      </div>
                      {(post.uuid === uuid || isUserAdmin()) && (
                        <button onClick={() => handleDeletePost(post.id)} style={{ backgroundColor: '#ef4444', color: 'white', padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px' }}>Delete</button>
                      )}
                    </div>

                    <p>{post.content}</p>

                    <div style={{ marginBottom: '12px' }}>
                      <button
                        onClick={() => post.likes?.includes(uuid) ? handleUnlikePost(post.id) : handleLikePost(post.id)}
                        style={{ marginRight: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb' }}
                      >
                        {post.likes?.includes(uuid) ? '💙 Unlike' : '🤍 Like'} ({post.likes?.length || 0})
                      </button>
                    </div>

                    <div style={{ marginTop: '12px' }}>
                      {post.comments?.map(comment => (
                        <div key={comment.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px', borderBottom: '1px solid #eee' }}>
                          <span><strong>{comment.isAnonymous ? 'Anonymous' : comment.username}:</strong> {comment.text}</span>
                          {(comment.uuid === uuid || isUserAdmin()) && (
                            <button onClick={() => handleDeleteComment(post.id, comment.id, comment.uuid)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>Delete</button>
                          )}
                        </div>
                      ))}
                      {isUserInGroup() && (
                        <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            placeholder="Add a comment..."
                            value={commentTexts[post.id] || ''}
                            onChange={(e) => setCommentTexts({ ...commentTexts, [post.id]: e.target.value })}
                            style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px' }}
                          />
                          <button onClick={() => handleAddComment(post.id)} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: '#2563eb', color: 'white', cursor: 'pointer', fontSize: '13px' }}>Comment</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {activeTab === 'coaching' && (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Post a Webinar</h3>

            {!isUserInGroup() && <p style={{ color: '#92400e' }}>⚠️ Join this group to post webinars.</p>}

            {isUserInGroup() && (
              <>
                <input
                  type="text"
                  placeholder="Webinar Title"
                  value={webinarTitle}
                  onChange={(e) => setWebinarTitle(e.target.value)}
                  style={{ width: '100%', padding: '10px', marginBottom: '8px', borderRadius: '8px', border: '1px solid #ddd' }}
                />
                <input
                  type="text"
                  placeholder="Webinar Link (Webex, Zoom, etc.)"
                  value={webinarLink}
                  onChange={(e) => setWebinarLink(e.target.value)}
                  style={{ width: '100%', padding: '10px', marginBottom: '8px', borderRadius: '8px', border: '1px solid #ddd' }}
                />
                <button
                  onClick={handleCreateWebinar}
                  style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold', cursor: 'pointer', marginBottom: '16px' }}
                >
                  Post Webinar
                </button>
              </>
            )}

            <div>
              {webinars.length === 0 ? (
                <p>No webinars posted yet.</p>
              ) : (
                webinars.map(webinar => (
                  <div key={webinar.id} style={{ borderTop: '1px solid #eee', padding: '12px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', marginRight: '12px' }}>{webinar.title}</span>
                      {(webinar.uuid === uuid || isUserAdmin()) && (
                        <button onClick={() => handleDeletePost(webinar.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>Delete</button>
                      )}
                    </div>
                    <div style={{ marginTop: '4px' }}>
                      <a href={webinar.content} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>
                        {webinar.content}
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default GroupPage;
