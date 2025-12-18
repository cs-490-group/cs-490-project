import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFlash } from "../context/flashContext";
import groupAPI from "../api/groups";
import postsAPI from "../api/posts";
import profilesAPI from "../api/profiles";
import { Container, Row, Col, Card, Button, Form, Badge, InputGroup, Nav, Spinner } from 'react-bootstrap';
import { MessageSquare, ThumbsUp, Trash2, Share2, ArrowLeft, Video, Send, User, Settings } from 'lucide-react';
import '../styles/resumes.css'; 
import posthog from 'posthog-js';

function GroupPage() {
  const { groupId } = useParams();
  const { showFlash } = useFlash();
  const navigate = useNavigate();
  const uuid = localStorage.getItem('uuid');

  const [activeTab, setActiveTab] = useState('feed');
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postType, setPostType] = useState('insight');
  const [isAnonymous, setIsAnonymous] = useState(false);
  
  const [webinarTitle, setWebinarTitle] = useState('');
  const [webinarLink, setWebinarLink] = useState('');

  const [commentTexts, setCommentTexts] = useState({});
  const [username, setUsername] = useState('');
  const [postsVisibleToNonMembers, setPostsVisibleToNonMembers] = useState(true);

  const isUserInGroup = () => group?.members?.some(m => m.uuid === uuid);
  const isUserAdmin = () => group?.members?.some(m => m.uuid === uuid && m.role === 'admin');

  useEffect(() => {
    if (groupId) {
        fetchGroupData();
        fetchPosts();
        fetchUserProfile();
    }
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
      if (response.data?.username) setUsername(response.data.username);
    } catch (error) {}
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await postsAPI.getGroupPosts(groupId);
      const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setPosts(sorted);
    } catch (error) {
      console.error('Error fetching posts:', error);
      showFlash('Failed to load posts', 'error');
    }
    setLoading(false);
  };

  const handleCreatePost = async () => {
    if (!isUserInGroup() || !postTitle.trim() || !postContent.trim()) return;
    setLoading(true);
    try {
      await postsAPI.createPost({
        groupId, uuid, title: postTitle, content: postContent, postType, isAnonymous,
        username: isAnonymous ? "Anonymous" : username,
      });
      setPostTitle(''); setPostContent(''); setPostType('insight'); setIsAnonymous(false);
      fetchPosts();
      showFlash('Post created successfully!', 'success');
    } catch (error) { showFlash('Failed to post', 'error'); }
    setLoading(false);
  };

  const handleCreateWebinar = async () => {
    if (!isUserInGroup() || !webinarTitle.trim() || !webinarLink.trim()) return;
    setLoading(true);
    try {
      await postsAPI.createPost({
        groupId, uuid, title: webinarTitle, content: webinarLink, postType: 'coaching',
        isAnonymous: false, username,
      });
      setWebinarTitle(''); setWebinarLink('');
      fetchPosts();
      showFlash('Webinar posted!', 'success');
    } catch (error) { showFlash('Failed to post webinar', 'error'); }
    setLoading(false);
  };

  const handleLikePost = async (postId) => {
    try { await postsAPI.likePost(groupId, postId, uuid); fetchPosts(); } catch(e){}
  };

  const handleUnlikePost = async (postId) => {
    try { await postsAPI.unlikePost(groupId, postId, uuid); fetchPosts(); } catch(e){}
  };

  const handleAddComment = async (postId) => {
    const text = commentTexts[postId];
    if (!isUserInGroup() || !text?.trim()) return;
    try {
      await postsAPI.addComment(groupId, postId, text, uuid, isAnonymous ? "Anonymous" : username);
      setCommentTexts({ ...commentTexts, [postId]: '' });
      fetchPosts();
      showFlash('Comment added!', 'success');
      posthog.capture('comment_added', { post_id: postId });
    } catch (error) { showFlash('Failed to add comment', 'error'); }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try { await postsAPI.deletePost(groupId, postId, uuid); fetchPosts(); posthog.capture('post_deleted', { post_id: postId }); } catch (error) { showFlash('Failed to delete post', 'error'); }
  
};

  const handleDeleteComment = async (postId, commentId, commentUuid) => {
     if (commentUuid !== uuid && !isUserAdmin()) return showFlash('You can only delete your own comment unless you are an admin', 'error');
     if (!window.confirm('Are you sure you want to delete this comment?')) return;
     try { await postsAPI.deleteComment(groupId, postId, commentId, uuid); fetchPosts(); } catch (error) { showFlash('Failed to delete comment', 'error'); }
  };

  const handleTogglePrivacy = async (value) => {
    try {
      await groupAPI.updateGroupSettings(groupId, { postsVisibleToNonMembers: value });
      setPostsVisibleToNonMembers(value);
      showFlash('Privacy updated', 'success');
    } catch (err) {
      showFlash('Failed to update privacy', 'error');
    }
  };

  if (!group) return <div className="dashboard-gradient min-vh-100 d-flex align-items-center justify-content-center"><Spinner animation="border" variant="light"/></div>;

  const displayedPosts = activeTab === 'feed' 
    ? posts.filter(p => p.postType !== 'coaching')
    : activeTab === 'coaching'
    ? posts.filter(p => p.postType === 'coaching')
    : posts.filter(p => p.postType === activeTab);

  const isCoachingTab = activeTab === 'coaching';

  return (
    <div className="dashboard-gradient min-vh-100 py-5" style={{ paddingTop: "100px" }}>
      <Container>
        {/* Header */}
        <Button variant="link" className="text-white text-decoration-none mb-3 p-0 fw-bold" onClick={() => navigate('/newGroup')}>
            <ArrowLeft size={18} className="me-1"/> Back to Groups
        </Button>
        
        <div className="text-white mb-4 bg-white bg-opacity-10 rounded-4 p-4 shadow-sm backdrop-blur">
            <div className="d-flex align-items-center gap-3">
                <h1 className="fw-bold display-5 mb-0" style={{ fontFamily: '"Playfair Display", serif' }}>{group.name}</h1>
                <Badge bg="light" text="dark" className="align-self-center mt-1">{group.category}</Badge>
            </div>
            <p className="opacity-75 mt-2 mb-0 fs-5">{group.members?.length} / {group.maxMembers} members</p>
        </div>

        <Row className="g-4">
            {/* Sidebar Navigation */}
            <Col lg={3}>
                <Card className="border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
                    <div className="p-3 bg-light border-bottom">
                        <h6 className="fw-bold text-muted mb-0 small text-uppercase">Feed Filters</h6>
                    </div>
                    <Card.Body className="p-2">
                        <Nav className="flex-column gap-1 nav-pills">
                            {[
                                {id: 'feed', label: 'All Posts'},
                                {id: 'insight', label: 'Insights'},
                                {id: 'strategy', label: 'Strategies'},
                                {id: 'success_story', label: 'Success Stories'},
                                {id: 'challenge', label: 'Challenges'},
                                {id: 'opportunity', label: 'Opportunities'},
                                {id: 'coaching', label: 'Webinars/Coaching'},
                            ].map(tab => (
                                <Nav.Link 
                                    key={tab.id}
                                    active={activeTab === tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`text-start px-3 py-2 rounded-3 ${activeTab === tab.id ? 'bg-primary text-white fw-bold' : 'text-secondary hover-bg-light'}`}
                                >
                                    {tab.label}
                                </Nav.Link>
                            ))}
                        </Nav>
                    </Card.Body>
                </Card>

                {/* Members List */}
                <Card className="border-0 shadow-sm rounded-4 mb-4">
                    <div className="p-3 bg-light border-bottom">
                        <h6 className="fw-bold text-muted mb-0 small text-uppercase">Members ({group.members?.length})</h6>
                    </div>
                    <Card.Body className="p-0">
                        <div className="list-group list-group-flush" style={{maxHeight: '300px', overflowY: 'auto'}}>
                            {group.members?.map((member, idx) => (
                                <div key={idx} className="list-group-item border-0 px-3 py-2 d-flex justify-content-between align-items-center">
                                    <span className={`small ${member.uuid === uuid ? 'fw-bold text-primary' : 'text-dark'}`}>
                                        <User size={14} className="me-2"/> 
                                        {member.username || (member.email ? member.email.split('@')[0] : "Member")}
                                    </span>
                                    {member.role === 'admin' && <Badge bg="danger" style={{fontSize: '10px'}}>ADMIN</Badge>}
                                </div>
                            ))}
                        </div>
                    </Card.Body>
                </Card>

                {/* Admin Controls */}
                {isUserAdmin() && (
                    <Card className="border-0 shadow-sm rounded-4">
                        <div className="p-3 bg-light border-bottom">
                            <h6 className="fw-bold text-muted mb-0 small text-uppercase d-flex align-items-center gap-2">
                                <Settings size={14}/> Group Settings
                            </h6>
                        </div>
                        <Card.Body className="p-3">
                            <Form.Check 
                                type="switch"
                                id="public-posts-switch"
                                label={<span className="small">Public Feed</span>}
                                checked={postsVisibleToNonMembers}
                                onChange={(e) => handleTogglePrivacy(e.target.checked)}
                            />
                            <Form.Text className="text-muted small d-block mt-1">Allow non-members to view posts</Form.Text>
                        </Card.Body>
                    </Card>
                )}
            </Col>

            {/* Main Content Area */}
            <Col lg={9}>
                {/* ... (Content Cards logic is fine) ... */}
                {/* --- WEBINAR POSTER (Only shows in Coaching Tab) --- */}
                {isCoachingTab && isUserInGroup() && (
                    <Card className="border-0 shadow-sm rounded-4 p-4 mb-4 bg-primary bg-opacity-10 border border-primary">
                        <h5 className="fw-bold mb-3 text-primary d-flex align-items-center gap-2">
                            <Video size={20}/> Post a Webinar or Resource
                        </h5>
                        <Form.Control 
                            size="lg" 
                            className="mb-3 border-0 shadow-sm" 
                            placeholder="Webinar Title (e.g. Interviewing Mastery)" 
                            value={webinarTitle} 
                            onChange={e => setWebinarTitle(e.target.value)} 
                        />
                        <InputGroup className="mb-3 shadow-sm">
                            <InputGroup.Text className="bg-white border-0"><Share2 size={18}/></InputGroup.Text>
                            <Form.Control 
                                size="lg" 
                                className="border-0"
                                placeholder="Link (Zoom, YouTube, Article...)" 
                                value={webinarLink} 
                                onChange={e => setWebinarLink(e.target.value)} 
                            />
                        </InputGroup>
                        <div className="d-flex justify-content-end">
                            <Button variant="primary" onClick={handleCreateWebinar} disabled={loading} className="fw-bold px-4">
                                {loading ? 'Posting...' : 'Share Resource'}
                            </Button>
                        </div>
                    </Card>
                )}

                {/* --- STANDARD POST CREATOR (Hidden in Coaching Tab) --- */}
                {!isCoachingTab && isUserInGroup() && (
                    <Card className="border-0 shadow-sm rounded-4 p-4 mb-4">
                        <h5 className="fw-bold mb-3 text-secondary">Share {activeTab === 'feed' ? 'an Insight' : activeTab.replace('_', ' ')}</h5>
                        <Form.Control 
                            className="mb-2 border-0 bg-light shadow-inner" 
                            placeholder="Title" 
                            value={postTitle}
                            onChange={e => setPostTitle(e.target.value)}
                        />
                        <Form.Control 
                            as="textarea" 
                            rows={3} 
                            className="mb-3 border-0 bg-light shadow-inner" 
                            placeholder="What's on your mind?" 
                            value={postContent}
                            onChange={e => setPostContent(e.target.value)}
                        />
                        <div className="d-flex justify-content-between align-items-center">
                            <div className="d-flex gap-3 align-items-center">
                                <Form.Select size="sm" style={{width: '150px'}} value={postType} onChange={e => setPostType(e.target.value)} className="border-0 bg-light fw-bold text-secondary">
                                    <option value="insight">Insight</option>
                                    <option value="strategy">Strategy</option>
                                    <option value="success_story">Success Story</option>
                                    <option value="challenge">Challenge</option>
                                    <option value="opportunity">Opportunity</option>
                                </Form.Select>
                                <Form.Check 
                                    type="checkbox" 
                                    label="Post Anonymously" 
                                    className="small text-muted mb-0"
                                    checked={isAnonymous}
                                    onChange={e => setIsAnonymous(e.target.checked)}
                                />
                            </div>
                            <Button variant="primary" onClick={handleCreatePost} disabled={loading} className="fw-bold px-4 rounded-pill">
                                Post
                            </Button>
                        </div>
                    </Card>
                )}

                {/* --- FEED LIST --- */}
                <div className="d-flex flex-column gap-3">
                    {displayedPosts.map(post => (
                        <Card key={post.id} className="border-0 shadow-sm rounded-4 overflow-hidden">
                            <Card.Body className="p-4">
                                <div className="d-flex justify-content-between mb-3">
                                    <div className="d-flex align-items-center gap-2">
                                        <Badge bg={isCoachingTab ? 'primary' : 'info'} className="text-uppercase px-2 py-1">
                                            {post.postType.replace('_', ' ')}
                                        </Badge>
                                        <span className="text-muted small">
                                            Posted by <strong>{post.username}</strong> • {new Date(post.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    {(post.uuid === uuid || isUserAdmin()) && (
                                        <Button variant="link" className="text-danger p-0" onClick={() => handleDeletePost(post.id)}>
                                            <Trash2 size={16}/>
                                        </Button>
                                    )}
                                </div>
                                
                                <h4 className="fw-bold text-dark mb-2">{post.title}</h4>
                                
                                {post.postType === 'coaching' ? (
                                    <div className="bg-light p-3 rounded-3 mb-3 d-flex align-items-center gap-3 border border-light">
                                        <div className="bg-white p-2 rounded-circle shadow-sm"><Video className="text-primary"/></div>
                                        <div className="flex-grow-1 overflow-hidden">
                                            <a href={post.content} target="_blank" rel="noreferrer" className="fw-bold text-primary text-decoration-none text-truncate d-block">
                                                {post.content}
                                            </a>
                                            <small className="text-muted">Click to open resource</small>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-secondary mb-3" style={{whiteSpace: 'pre-wrap', fontSize: '15px', lineHeight: '1.6'}}>{post.content}</p>
                                )}

                                <div className="d-flex gap-3 border-top pt-3 mt-3">
                                    <Button 
                                        variant={post.likes?.includes(uuid) ? "primary" : "light"}
                                        size="sm" 
                                        className="d-flex align-items-center gap-2 rounded-pill px-3"
                                        onClick={() => post.likes?.includes(uuid) ? handleUnlikePost(post.id) : handleLikePost(post.id)}
                                    >
                                        <ThumbsUp size={16} /> 
                                        {post.likes?.length || 0} Likes
                                    </Button>
                                    <div className="d-flex align-items-center gap-2 text-muted small ms-auto">
                                        <MessageSquare size={16} /> {post.comments?.length || 0} Comments
                                    </div>
                                </div>

                                {/* Comments Section */}
                                {post.comments?.length > 0 && (
                                    <div className="mt-3 pt-3 border-top">
                                        {post.comments.map(c => (
                                            <div key={c.id} className="d-flex justify-content-between align-items-start mb-2">
                                                <div className="bg-light rounded-3 p-2 px-3 w-100 me-2">
                                                    <strong className="small d-block text-dark">{c.username}</strong>
                                                    <span className="small text-secondary">{c.text}</span>
                                                </div>
                                                {(c.uuid === uuid || isUserAdmin()) && (
                                                    <Button variant="link" className="p-0 text-muted mt-1" onClick={() => handleDeleteComment(post.id, c.id, c.uuid)}>
                                                        <Trash2 size={14}/>
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                {isUserInGroup() && (
                                    <InputGroup size="sm" className="mt-3">
                                        <Form.Control 
                                            placeholder="Add a comment..." 
                                            value={commentTexts[post.id] || ''}
                                            onChange={e => setCommentTexts({...commentTexts, [post.id]: e.target.value})}
                                            className="bg-light border-0"
                                        />
                                        <Button variant="outline-primary" onClick={() => handleAddComment(post.id)}>
                                            <Send size={16}/>
                                        </Button>
                                    </InputGroup>
                                )}
                            </Card.Body>
                        </Card>
                    ))}
                    
                    {displayedPosts.length === 0 && (
                        <div className="text-center py-5">
                            <div className="bg-white p-4 rounded-circle d-inline-block shadow-sm mb-3">
                                <MessageSquare size={32} className="text-muted opacity-50"/>
                            </div>
                            <h5 className="text-white">No posts yet</h5>
                            <p className="text-white-50">Be the first to share in this category!</p>
                        </div>
                    )}
                </div>
            </Col>
        </Row>
      </Container>
    </div>
  );
}

export default GroupPage;