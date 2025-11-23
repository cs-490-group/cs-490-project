// frontend/src/components/jobs/materials/VersionComparisonModal.jsx
import React, { useState, useEffect } from 'react';
import ResumesAPI from '../../../api/resumes';
import CoverLetterAPI from '../../../api/coverLetters';

export default function VersionComparisonModal({ version1, version2, onClose }) {
  const [v1Data, setV1Data] = useState(null);
  const [v2Data, setV2Data] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVersionData();
  }, [version1, version2]);

  const loadVersionData = async () => {
    setLoading(true);
    try {
      // Load version 1
      if (version1) {
        if (version1.type === 'resume') {
          const res = await ResumesAPI.get(version1.material._id || version1.material.id);
          setV1Data(res.data || res);
        } else {
          const res = await CoverLetterAPI.get(version1.material._id || version1.material.id);
          setV1Data(res.data || res);
        }
      }

      // Load version 2
      if (version2) {
        if (version2.type === 'resume') {
          const res = await ResumesAPI.get(version2.material._id || version2.material.id);
          setV2Data(res.data || res);
        } else {
          const res = await CoverLetterAPI.get(version2.material._id || version2.material.id);
          setV2Data(res.data || res);
        }
      }
    } catch (error) {
      console.error('Error loading version data:', error);
    } finally {
      setLoading(false);
    }
  };

  const ComparisonField = ({ label, value1, value2 }) => {
    const isDifferent = value1 !== value2;
    return (
      <div style={{ 
        marginBottom: '16px', 
        padding: '12px', 
        background: isDifferent ? '#fff3cd' : 'white',
        borderRadius: '6px',
        border: isDifferent ? '2px solid #ffc107' : '1px solid #e0e0e0'
      }}>
        <div style={{ 
          fontSize: '13px', 
          fontWeight: '600', 
          marginBottom: '8px',
          color: isDifferent ? '#856404' : '#333'
        }}>
          {label} {isDifferent && '⚠️ Different'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ padding: '8px', background: '#f9f9f9', borderRadius: '4px' }}>
            <div style={{ fontSize: '11px', color: '#999', marginBottom: '4px' }}>Version 1</div>
            <div style={{ fontSize: '13px', wordBreak: 'break-word' }}>{value1 || 'N/A'}</div>
          </div>
          <div style={{ padding: '8px', background: '#f9f9f9', borderRadius: '4px' }}>
            <div style={{ fontSize: '11px', color: '#999', marginBottom: '4px' }}>Version 2</div>
            <div style={{ fontSize: '13px', wordBreak: 'break-word' }}>{value2 || 'N/A'}</div>
          </div>
        </div>
      </div>
    );
  };

  if (!version1 || !version2) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3000
      }}
      onClick={onClose}>
        <div onClick={(e) => e.stopPropagation()} style={{
          background: 'white',
          padding: '40px',
          borderRadius: '8px',
          maxWidth: '500px'
        }}>
          <h3>Select Two Versions to Compare</h3>
          <p style={{ color: '#666', marginTop: '12px' }}>
            Click the "Compare" button on two different materials to compare them.
          </p>
          <button onClick={onClose} style={{
            marginTop: '20px',
            padding: '10px 20px',
            background: '#4f8ef7',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3000,
      padding: '20px'
    }}
    onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'white',
        borderRadius: '8px',
        maxWidth: '1000px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>🔄 Version Comparison</h2>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#666'
          }}>×</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '18px', color: '#666' }}>Loading comparison...</div>
          </div>
        ) : (
          <>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '16px', 
              marginBottom: '24px',
              padding: '16px',
              background: '#f0f7ff',
              borderRadius: '6px'
            }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1976d2', marginBottom: '8px' }}>
                  Version 1
                </div>
                <div style={{ fontSize: '13px', color: '#666' }}>
                  <strong>Type:</strong> {version1.type}<br />
                  <strong>Name:</strong> {version1.material.version_name || version1.material.name || 'Unnamed'}<br />
                  <strong>Size:</strong> {version1.material.file_size ? `${(version1.material.file_size / 1024).toFixed(1)} KB` : 'N/A'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1976d2', marginBottom: '8px' }}>
                  Version 2
                </div>
                <div style={{ fontSize: '13px', color: '#666' }}>
                  <strong>Type:</strong> {version2.type}<br />
                  <strong>Name:</strong> {version2.material.version_name || version2.material.name || 'Unnamed'}<br />
                  <strong>Size:</strong> {version2.material.file_size ? `${(version2.material.file_size / 1024).toFixed(1)} KB` : 'N/A'}
                </div>
              </div>
            </div>

            {version1.type !== version2.type && (
              <div style={{ 
                padding: '12px', 
                background: '#ffebee', 
                borderRadius: '6px', 
                marginBottom: '16px',
                color: '#c62828',
                fontSize: '14px'
              }}>
                ⚠️ <strong>Warning:</strong> Comparing different types ({version1.type} vs {version2.type})
              </div>
            )}

            {v1Data && v2Data && (
              <div>
                <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Comparison Details</h3>
                
                <ComparisonField 
                  label="Version Name" 
                  value1={v1Data.version_name || v1Data.name || v1Data.title}
                  value2={v2Data.version_name || v2Data.name || v2Data.title}
                />

                <ComparisonField 
                  label="Created Date" 
                  value1={v1Data.created_at ? new Date(v1Data.created_at).toLocaleString() : 'N/A'}
                  value2={v2Data.created_at ? new Date(v2Data.created_at).toLocaleString() : 'N/A'}
                />

                <ComparisonField 
                  label="File Size" 
                  value1={v1Data.file_size ? `${(v1Data.file_size / 1024).toFixed(1)} KB` : 'N/A'}
                  value2={v2Data.file_size ? `${(v2Data.file_size / 1024).toFixed(1)} KB` : 'N/A'}
                />

                <ComparisonField 
                  label="Usage Count" 
                  value1={`${v1Data.usage_count || 0} applications`}
                  value2={`${v2Data.usage_count || 0} applications`}
                />

                {version1.type === 'resume' && version2.type === 'resume' && (
                  <>
                    <ComparisonField 
                      label="Template" 
                      value1={v1Data.template || 'N/A'}
                      value2={v2Data.template || 'N/A'}
                    />
                    <ComparisonField 
                      label="Summary Length" 
                      value1={v1Data.summary ? `${v1Data.summary.length} characters` : 'No summary'}
                      value2={v2Data.summary ? `${v2Data.summary.length} characters` : 'No summary'}
                    />
                    <ComparisonField 
                      label="Experience Entries" 
                      value1={`${v1Data.experience?.length || 0} entries`}
                      value2={`${v2Data.experience?.length || 0} entries`}
                    />
                    <ComparisonField 
                      label="Skills" 
                      value1={`${v1Data.skills?.length || 0} skills`}
                      value2={`${v2Data.skills?.length || 0} skills`}
                    />
                  </>
                )}

                {version1.type === 'coverLetter' && version2.type === 'coverLetter' && (
                  <>
                    <ComparisonField 
                      label="Company" 
                      value1={v1Data.company || 'N/A'}
                      value2={v2Data.company || 'N/A'}
                    />
                    <ComparisonField 
                      label="Position" 
                      value1={v1Data.position || 'N/A'}
                      value2={v2Data.position || 'N/A'}
                    />
                    <ComparisonField 
                      label="Content Length" 
                      value1={v1Data.content ? `${v1Data.content.length} characters` : 'No content'}
                      value2={v2Data.content ? `${v2Data.content.length} characters` : 'No content'}
                    />
                  </>
                )}

                <div style={{ 
                  marginTop: '24px', 
                  padding: '16px', 
                  background: '#f0f7ff', 
                  borderRadius: '6px'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                    💡 Recommendation
                  </div>
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    {v1Data.usage_count > v2Data.usage_count ? (
                      `Version 1 has been used more frequently (${v1Data.usage_count} vs ${v2Data.usage_count} times). Consider using Version 1 for consistency.`
                    ) : v2Data.usage_count > v1Data.usage_count ? (
                      `Version 2 has been used more frequently (${v2Data.usage_count} vs ${v1Data.usage_count} times). Consider using Version 2 for consistency.`
                    ) : (
                      'Both versions have similar usage. Choose based on content and target application.'
                    )}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button onClick={onClose} style={{
                padding: '10px 20px',
                background: '#999',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}>
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}