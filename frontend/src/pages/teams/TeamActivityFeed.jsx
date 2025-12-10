import React, { useState, useEffect } from "react";
import { Trophy, Calendar, Sparkles, User, MessageCircle } from "lucide-react";
import { Card, Button, Spinner, Badge } from 'react-bootstrap';
import progressAPI from "../../api/progressSharing"; 

export default function TeamActivityFeed({ teamId, members, currentUserId }) {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (teamId && members && members.length > 0) {
      fetchTeamFeed();
    }
  }, [teamId, members]);

  const fetchTeamFeed = async () => {
    try {
      setLoading(true);
      
      const candidates = members.filter(m => m.role === 'candidate');

      const promises = candidates.map(async (member) => {
        try {
          const res = await progressAPI.getMilestones(teamId, member.uuid, 30); 
          
          return (res.data.milestones || []).map(m => ({
            ...m,
            memberName: member.name,
            memberRole: member.role,
            memberId: member.uuid
          }));
        } catch (e) {
          return []; 
        }
      });

      const results = await Promise.all(promises);

      // 3. Flatten and sort by date
      const allMilestones = results.flat().sort((a, b) => 
        new Date(b.achieved_date) - new Date(a.achieved_date)
      );

      setFeed(allMilestones);
    } catch (err) {
      console.error("Failed to load team feed", err);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (category) => {
    switch(category) {
      case 'offer_received': return <Trophy className="text-warning" size={20} />;
      case 'interview_scheduled': return <Calendar className="text-primary" size={20} />;
      case 'goal_completed': return <Sparkles className="text-success" size={20} />;
      default: return <User className="text-secondary" size={20} />;
    }
  };

  const handleCelebrate = async (milestone) => {
    // Reuse your existing celebration logic
    const emojis = ["🔥", "👏", "🚀", "❤️"];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    
    try {
      await progressAPI.addCelebration(teamId, milestone.memberId, {
        id: milestone.id,
        emoji: emoji,
        message: "Way to go!" 
      });
      alert(`Sent ${emoji} to ${milestone.memberName}!`);
    } catch (e) {
      console.error("Failed to celebrate");
    }
  };

  if (loading) return <div className="text-center p-4"><Spinner animation="border" size="sm" /></div>;

  return (
    <Card className="border-0 shadow-sm rounded-4 h-100">
      <Card.Header className="bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2">
            <Sparkles className="text-warning" size={24}/>
            <h4 className="fw-bold text-dark mb-0">Team Activity Feed</h4>
        </div>
        <Badge bg="light" text="dark" className="border">Live Updates</Badge>
      </Card.Header>
      <Card.Body className="p-0">
        <div style={{ maxHeight: '500px', overflowY: 'auto' }} className="px-4 pb-4 pt-2">
            {feed.length === 0 ? (
                <div className="text-center text-muted py-5">
                    <p>No recent activity yet. Time to get to work! 💼</p>
                </div>
            ) : (
                <div className="d-flex flex-column gap-3">
                    {feed.map((item, idx) => (
                        <div key={idx} className="d-flex gap-3 p-3 rounded-3 border border-light bg-light bg-opacity-50">
                            {/* Avatar / Icon */}
                            <div className="flex-shrink-0">
                                <div className="bg-white p-2 rounded-circle shadow-sm d-flex align-items-center justify-content-center" style={{width: '45px', height: '45px'}}>
                                    {getIcon(item.category)}
                                </div>
                            </div>
                            
                            {/* Content */}
                            <div className="flex-grow-1">
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <span className="fw-bold text-dark">{item.memberName}</span>
                                        <span className="text-muted small mx-2">•</span>
                                        <span className="text-muted small">{new Date(item.achieved_date).toLocaleDateString()}</span>
                                    </div>
                                    <Badge bg="white" text="secondary" className="border fw-normal text-capitalize">
                                        {item.category.replace('_', ' ')}
                                    </Badge>
                                </div>
                                
                                <h6 className="fw-bold mt-1 mb-1 text-primary">{item.title}</h6>
                                <p className="text-muted small mb-2">{item.description}</p>
                                
                                {item.memberId !== currentUserId && (
                                    <Button 
                                        variant="outline-secondary" 
                                        size="sm" 
                                        className="py-0 px-2" 
                                        style={{fontSize: '12px'}}
                                        onClick={() => handleCelebrate(item)}
                                    >
                                        👏 Celebrate
                                    </Button>
                     )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </Card.Body>
    </Card>
  );
}