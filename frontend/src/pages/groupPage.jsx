import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFlash } from "../context/flashContext";
import groupAPI from "../api/groups";
import postsAPI from "../api/posts";
import profilesAPI from "../api/profiles";
import { Container, Row, Col, Card, Button, Form, Badge, Dropdown, Nav, InputGroup } from 'react-bootstrap';
import { MessageSquare, ThumbsUp, Trash2, Share2, MoreHorizontal, ArrowLeft, Video, Send } from 'lucide-react';

function GroupPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { showFlash } = useFlash();
  const uuid = localStorage.getItem('uuid');

  const [activeTab, setActiveTab] = useState('feed');
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Post Form State
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postType, setPostType] = useState('insight');
  const [isAnonymous, setIsAnonymous] = useState(false);
  
  // Webinar State
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
      console.error(error);
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
      console.error(error);
    }
    setLoading(false);
  };

  const handleCreatePost = async () => {
    if (!postTitle.trim() || !postContent.trim()) return;
    try {
      await postsAPI.createPost({
        groupId, uuid, title: postTitle, content: postContent, postType, isAnonymous,
        username: isAnonymous ? "Anonymous" : username,
      });
      setPostTitle(''); setPostContent(''); setPostType('insight'); setIsAnonymous(false);
      fetchPosts();
      showFlash('Post created!', 'success');
    } catch (error) { showFlash('Failed to post', 'error'); }
  };

  const handleCreateWebinar = async () => {
    try {
      await postsAPI.createPost({
        groupId, uuid, title: webinarTitle, content: webinarLink, postType: 'coaching',
        isAnonymous: false, username,
      });
      setWebinarTitle(''); setWebinarLink('');
      fetchPosts();
      showFlash('Webinar posted!', 'success');
    } catch (error) { showFlash('Failed to post webinar', 'error'); }
  };

  const handleLikePost = async (postId) => {
    try { await postsAPI.likePost(groupId, postId, uuid); fetchPosts(); } catch(e){}
  };

  const handleUnlikePost = async (postId) => {
    try { await postsAPI.unlikePost(groupId, postId, uuid); fetchPosts(); } catch(e){}
  };

  const handleAddComment = async (postId) => {
    const text = commentTexts[postId];
    if (!text?.trim()) return;
    try {
      await postsAPI.addComment(groupId, postId, text, uuid, isAnonymous ? "Anonymous" : username);
      setCommentTexts({ ...commentTexts, [postId]: '' });
      fetchPosts();
    } catch(e){}
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm("Delete post?")) {
        await postsAPI.deletePost(groupId, postId, uuid);
        fetchPosts();
    }
  };

  const handleDeleteComment = async (postId, commentId, commentUuid) => {
     if (window.confirm("Delete comment?")) {
        await postsAPI.deleteComment(groupId, postId, commentId, uuid);
        fetchPosts();
     }
  };

  if (!group) return <div className="p-5 text-center">Loading...</div>;

  const filteredPosts = activeTab === 'feed' 
    ? posts.filter(p => p.postType !== 'coaching')
    : activeTab === 'coaching'
    ? posts.filter(p => p.postType === 'coaching')
    : posts.filter(p => p.postType === activeTab);

  return (
    <div className="dashboard-gradient min-vh-100 py-4" style={{ paddingTop: "100px" }}>
      <Container>
        {/* Header */}
        <Button variant="link" className="text-white text-decoration-none mb-3 p-0" onClick={() => navigate('/newGroup')}>
            <ArrowLeft size={18} className="me-1"/> Back to Groups
        </Button>
        
        <div className="text-white mb-4">
            <div className="d-flex align-items-center gap-2">
                <h1 className="fw-bold display-5 mb-0" style={{ fontFamily: '"Playfair Display", serif' }}>{group.name}</h1>
                <Badge bg="light" text="dark" className="align-self-start mt-2">{group.category}</Badge>
            </div>
            <p className="opacity-75">{group.memberCount} members</p>
        </div>

        <Row className="g-4">
            {/* Sidebar */}
            <Col lg={3}>
                <Card className="border-0 shadow-sm rounded-4 mb-4">
                    <Card.Body>
                        <h6 className="fw-bold text-muted mb-3">FILTERS</h6>
                        <Nav className="flex-column gap-1 nav-pills">
                            {[
                                {id: 'feed', label: 'All Posts'},
                                {id: 'insight', label: 'Insights'},
                                {id: 'strategy', label: 'Strategies'},
                                {id: 'success_story', label: 'Success Stories'},
                                {id: 'challenge', label: 'Challenges'},
                                {id: 'coaching', label: 'Webinars'},
                            ].map(tab => (
                                <Nav.Link 
                                    key={tab.id}
                                    active={activeTab === tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`text-start ${activeTab === tab.id ? 'fw-bold' : 'text-secondary'}`}
                                >
                                    {tab.label}
                                </Nav.Link>
                            ))}
                        </Nav>
                    </Card.Body>
                </Card>

                {isUserAdmin() && (
                    <Card className="border-0 shadow-sm rounded-4">
                        <Card.Body>
                            <h6 className="fw-bold text-muted mb-2">ADMIN</h6>
                            <Form.Check 
                                type="switch"
                                label="Public Posts"
                                checked={postsVisibleToNonMembers}
                                onChange={(e) => {
                                    setPostsVisibleToNonMembers(e.target.checked);
                                    groupAPI.updateGroupSettings(groupId, { postsVisibleToNonMembers: e.target.checked });
                                }}
                            />
                        </Card.Body>
                    </Card>
                )}
            </Col>

            {/* Main Feed */}
            <Col lg={9}>
                {/* Post Creator */}
                {isUserInGroup() && activeTab !== 'coaching' && (
                    <Card className="border-0 shadow-sm rounded-4 mb-4">
                        <Card.Body>
                            <h5 className="fw-bold mb-3">Share with the community</h5>
                            <Form.Control 
                                className="mb-2 border-0 bg-light" 
                                placeholder="Post Title" 
                                value={postTitle}
                                onChange={e => setPostTitle(e.target.value)}
                            />
                            <Form.Control 
                                as="textarea" 
                                rows={3} 
                                className="mb-3 border-0 bg-light" 
                                placeholder="What's on your mind?" 
                                value={postContent}
                                onChange={e => setPostContent(e.target.value)}
                            />
                            <div className="d-flex justify-content-between align-items-center">
                                <div className="d-flex gap-2 align-items-center">
                                    <Form.Select 
                                        size="sm" 
                                        style={{width: '140px'}} 
                                        value={postType}
                                        onChange={e => setPostType(e.target.value)}
                                    >
                                        <option value="insight">Insight</option>
                                        <option value="strategy">Strategy</option>
                                        <option value="success_story">Success Story</option>
                                        <option value="challenge">Challenge</option>
                                        <option value="opportunity">Opportunity</option>
                                    </Form.Select>
                                    <Form.Check 
                                        type="checkbox" 
                                        label="Anonymous" 
                                        className="small text-muted mb-0"
                                        checked={isAnonymous}
                                        onChange={e => setIsAnonymous(e.target.checked)}
                                    />
                                </div>
                                <Button variant="primary" className="fw-bold px-4" onClick={handleCreatePost}>
                                    Post
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                )}

                {/* Feed List */}
                <div className="d-flex flex-column gap-3">
                    {filteredPosts.map(post => (
                        <Card key={post.id} className="border-0 shadow-sm rounded-4">
                            <Card.Body>
                                <div className="d-flex justify-content-between mb-2">
                                    <div>
                                        <Badge bg="light" text="primary" className="me-2 text-uppercase border border-primary-subtle">
                                            {post.postType.replace('_', ' ')}
                                        </Badge>
                                        <span className="fw-bold text-dark me-2">{post.title}</span>
                                        <small className="text-muted">by {post.username}</small>
                                    </div>
                                    {(post.uuid === uuid || isUserAdmin()) && (
                                        <Button variant="link" className="text-danger p-0" onClick={() => handleDeletePost(post.id)}>
                                            <Trash2 size={16}/>
                                        </Button>
                                    )}
                                </div>
                                
                                <p className="text-secondary mb-3" style={{whiteSpace: 'pre-wrap'}}>{post.content}</p>
                                
                                {post.postType === 'coaching' && (
                                    <div className="bg-light p-3 rounded-3 mb-3 d-flex align-items-center gap-3">
                                        <div className="bg-white p-2 rounded-circle"><Video className="text-primary"/></div>
                                        <a href={post.content} target="_blank" rel="noreferrer" className="fw-bold text-decoration-none">
                                            Join Webinar / View Resource
                                        </a>
                                    </div>
                                )}

                                <div className="d-flex gap-3 border-top pt-3">
                                    <Button 
                                        variant="light" 
                                        size="sm" 
                                        className={`d-flex align-items-center gap-2 ${post.likes?.includes(uuid) ? 'text-primary' : 'text-muted'}`}
                                        onClick={() => post.likes?.includes(uuid) ? handleUnlikePost(post.id) : handleLikePost(post.id)}
                                    >
                                        <ThumbsUp size={16} fill={post.likes?.includes(uuid) ? "currentColor" : "none"} /> 
                                        {post.likes?.length || 0} Likes
                                    </Button>
                                </div>

                                {/* Comments */}
                                <div className="mt-3 bg-light rounded-3 p-3">
                                    {post.comments?.map(c => (
                                        <div key={c.id} className="d-flex justify-content-between align-items-start mb-2 border-bottom pb-2 last-0">
                                            <div>
                                                <strong className="small">{c.username}: </strong>
                                                <span className="small text-secondary">{c.text}</span>
                                            </div>
                                            {(c.uuid === uuid || isUserAdmin()) && (
                                                <Button variant="link" className="p-0 text-muted" onClick={() => handleDeleteComment(post.id, c.id, c.uuid)}>
                                                    <Trash2 size={12}/>
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                    {isUserInGroup() && (
                                        <InputGroup size="sm" className="mt-2">
                                            <Form.Control 
                                                placeholder="Write a comment..." 
                                                value={commentTexts[post.id] || ''}
                                                onChange={e => setCommentTexts({...commentTexts, [post.id]: e.target.value})}
                                            />
                                            <Button variant="outline-primary" onClick={() => handleAddComment(post.id)}>
                                                <Send size={14}/>
                                            </Button>
                                        </InputGroup>
                                    )}
                                </div>
                            </Card.Body>
                        </Card>
                    ))}
                    {filteredPosts.length === 0 && (
                        <div className="text-center text-white py-5">
                            <h5>No posts yet</h5>
                            <p className="opacity-75">Be the first to share something!</p>
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