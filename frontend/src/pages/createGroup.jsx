import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFlash } from "../context/flashContext";
import groupAPI from "../api/groups";

function CreateGroup() {
  const [activeTab, setActiveTab] = useState('create');
  const [groupName, setGroupName] = useState('');
  const [category, setCategory] = useState('Software Development');
  const [maxMembers, setMaxMembers] = useState('10');
  const [allGroups, setAllGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showFlash } = useFlash();
  const navigate = useNavigate();
  const uuid = localStorage.getItem('uuid');

  useEffect(() => {
    if (activeTab === 'join') {
      fetchAllGroups();
    }
  }, [activeTab]);

  const fetchAllGroups = async () => {
    setLoading(true);
    try {
      const data = await groupAPI.getAllGroups();
      setAllGroups(data);
    } catch (error) {
      console.error('Error fetching groups:', error);
      setAllGroups([]);
    }
    setLoading(false);
  };

   const handleCreateSubmit = async () => {
    if (groupName.trim()) {
      setLoading(true);
      try {
        const data = await groupAPI.createGroup({
          name: groupName,
          category: category,
          maxMembers: parseInt(maxMembers),
          uuid: uuid,
        });
        showFlash(`Group "${data.name}" created successfully!`, "success");
        setGroupName('');
        setCategory('Software Development');
        setMaxMembers('10');
        
        navigate(`/group/${data.id}`);
      } catch (error) {
        showFlash(error.message, "error");
      }
      setLoading(false);
    }
  };

  const handleJoinGroup = async (groupId) => {
    setLoading(true);
    try {
      const data = await groupAPI.joinGroup({
        groupId: groupId,
        uuid: uuid,
      });
      showFlash(data.message, "success");
      fetchAllGroups();
    } catch (error) {
      showFlash(error.message, "error");
    }
    setLoading(false);
  };

  const handleLeaveGroup = async (groupId) => {
    setLoading(true);
    try {
      const data = await groupAPI.leaveGroup({
        groupId: groupId,
        uuid: uuid,
      });
      showFlash(data.message, "success");
      fetchAllGroups();
    } catch (error) {
      showFlash(error.message, "error");
    }
    setLoading(false);
  };

  const isUserInGroup = (group) => {
    return group.members && group.members.some(m => m.uuid === uuid);
  };

  return (
    <div style={{ width: '100%', backgroundColor: '#f3f4f6', padding: '32px', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '40px' }}>
      <div style={{ maxWidth: '500px', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px' }}>Groups</h1>
        <p style={{ color: '#666', marginBottom: '32px' }}>Manage and join groups to collaborate with others</p>

        <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid #ddd', marginBottom: '32px' }}>
          <button
            onClick={() => setActiveTab('create')}
            style={{
              paddingBottom: '12px',
              paddingLeft: '8px',
              paddingRight: '8px',
              fontWeight: 'bold',
              borderBottom: activeTab === 'create' ? '2px solid #14b8a6' : 'none',
              color: activeTab === 'create' ? '#14b8a6' : '#666',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Create Group
          </button>
          <button
            onClick={() => setActiveTab('join')}
            style={{
              paddingBottom: '12px',
              paddingLeft: '8px',
              paddingRight: '8px',
              fontWeight: 'bold',
              borderBottom: activeTab === 'join' ? '2px solid #14b8a6' : 'none',
              color: activeTab === 'join' ? '#14b8a6' : '#666',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Join Group
          </button>
        </div>

        {activeTab === 'create' && (
          <div style={{ maxWidth: '400px', paddingBottom: '32px' }}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                Group Name
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                Group Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="Software Development">Software Development</option>
                <option value="Marketing">Marketing</option>
                <option value="Education">Education</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                Maximum Members (1-50)
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={maxMembers}
                onChange={(e) => setMaxMembers(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              onClick={handleCreateSubmit}
              disabled={loading || !groupName.trim()}
              style={{
                width: '100%',
                backgroundColor: '#2563eb',
                color: 'white',
                padding: '12px 16px',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '16px',
                border: 'none',
                cursor: loading || !groupName.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !groupName.trim() ? 0.5 : 1
              }}
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        )}

        {activeTab === 'join' && (
          <div>
            {loading && <p style={{ color: '#666', fontWeight: 'bold' }}>Loading groups...</p>}
            {!loading && allGroups.length === 0 && <p style={{ color: '#666', fontWeight: 'bold' }}>No groups available</p>}
            {allGroups.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {allGroups.map((group) => (
                  <div
                    key={group.id}
                    style={{
                      border: '1px solid #ddd',
                      padding: '16px',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontWeight: 'bold', fontSize: '16px', margin: 0 }}>{group.name}</h3>
                      <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{group.category}</p>
                      {group.memberCount && (
                        <p style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                          {group.memberCount} members
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => isUserInGroup(group) ? handleLeaveGroup(group.id) : handleJoinGroup(group.id)}
                      disabled={loading}
                      style={{
                        backgroundColor: isUserInGroup(group) ? '#ef4444' : '#22c55e',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        border: 'none',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        marginLeft: '16px',
                        whiteSpace: 'nowrap',
                        opacity: loading ? 0.5 : 1
                      }}
                    >
                      {isUserInGroup(group) ? 'Leave' : '+ Join'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CreateGroup;