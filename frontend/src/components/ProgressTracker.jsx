import React from 'react';

const ProgressTracker = ({ data }) => {
  // Use the same completion logic as Dashboard
  const getCompletenessStatus = (cardData, schema) => {
    if (!cardData || cardData.length === 0) {
      return 'incomplete';
    }

    const threshData = {
      'profile': 7,
      'employmentHistory': 3,
      'skills': 1,
      'education': 3,
      'projects': 5,
      'certifications': 4
    };

    const threshCount = {
      'profile': 1,
      'employmentHistory': 2,
      'skills': 4,
      'education': 1,
      'projects': 2,
      'certifications': 1
    };

    const totalItems = cardData.length;
    const itemsWithContent = cardData.filter(([_, values]) => 
      values && values.length > threshData[schema] && values.some(v => v && v.trim() !== '')
    ).length;
    
    const completenessRatio = itemsWithContent / totalItems;
    
    if (completenessRatio >= 0.8 && totalItems >= threshCount[schema]) {
      return 'complete';
    } else if (totalItems > 0) {
      return 'partial';
    } else {
      return 'incomplete';
    }
  };

  // Get detailed info about what's needed for completion
  const getCompletionDetails = (cardData, schema) => {
    const threshCount = {
      'profile': 1,
      'employmentHistory': 2,
      'skills': 4,
      'education': 1,
      'projects': 2,
      'certifications': 1
    };

    const threshData = {
      'profile': 7,
      'employmentHistory': 3,
      'skills': 2,
      'education': 4,
      'projects': 5,
      'certifications': 4
    };

    if (!cardData || cardData.length === 0) {
      return {
        currentCount: 0,
        neededCount: threshCount[schema],
        needsMoreEntries: true,
        additionalNeeded: threshCount[schema]
      };
    }

    const totalItems = cardData.length;
    const requiredCount = threshCount[schema];
    const itemsWithContent = cardData.filter(([_, values]) => 
      values && values.length > threshData[schema] && values.some(v => v && v.trim() !== '')
    ).length;
    
    const completenessRatio = itemsWithContent / totalItems;
    const needsMoreEntries = totalItems < requiredCount;
    const additionalNeeded = Math.max(0, requiredCount - totalItems);
    
    // Calculate how many items need better quality
    const itemsNeedingImprovement = totalItems - itemsWithContent;

    return {
      currentCount: totalItems,
      neededCount: requiredCount,
      needsMoreEntries,
      additionalNeeded,
      itemsWithContent,
      itemsNeedingImprovement,
      completenessRatio
    };
  };

  // Check completion status for each card
  const cardStatus = {
    profile: getCompletenessStatus(data.profile, 'profile'),
    employmentHistory: getCompletenessStatus(data.employmentHistory, 'employmentHistory'),
    skills: getCompletenessStatus(data.skills, 'skills'),
    education: getCompletenessStatus(data.education, 'education'),
    projects: getCompletenessStatus(data.projects, 'projects')
  };

  // Count completed and partial cards
  const completedCards = Object.values(cardStatus).filter(status => status === 'complete').length;
  const partialCards = Object.values(cardStatus).filter(status => status === 'partial').length;
  const totalCards = Object.keys(cardStatus).length;
  
  // Calculate completion percentage (complete = 100%, partial = 50%)
  const completionPercentage = ((completedCards * 100) + (partialCards * 50)) / totalCards;

  // Tips for each category
  const tips = {
    profile: [
      "Add your personal information and contact details",
      "Include a professional summary or bio",
      "Upload a professional photo"
    ],
    employmentHistory: [
      "List your current and previous job positions",
      "Include company names and employment dates",
      "Add key achievements and responsibilities"
    ],
    skills: [
      "List your technical skills and programming languages",
      "Include soft skills and certifications",
      "Rate your proficiency levels"
    ],
    education: [
      "Add your degrees and educational institutions",
      "Include relevant certifications and courses",
      "List academic achievements and honors"
    ],
    projects: [
      "Showcase your best work and portfolio projects",
      "Include project descriptions and technologies used",
      "Add links to live demos or repositories"
    ]
  };

  // Get cards that need completion or improvement
  const incompleteCards = Object.entries(cardStatus)
    .filter(([_, status]) => status === 'incomplete')
    .map(([cardName, _]) => cardName);
  
  const partialCardsArray = Object.entries(cardStatus)
    .filter(([_, status]) => status === 'partial')
    .map(([cardName, _]) => cardName);

  // Helper function to format card names
  const formatCardName = (cardName) => {
    return cardName.replace(/([A-Z])/g, ' $1').trim();
  };

  return (
    <div style={{
      backgroundColor: '#F9FAFC', // Background Light
      padding: '20px',
      borderRadius: '12px',
      border: '1px solid #D1D5DB',
      margin: '20px 0',
      maxWidth: '800px',
      marginLeft: 'auto',
      marginRight: 'auto'
    }}>
      <h3 style={{
        fontSize: '20px',
        fontWeight: '600',
        color: '#003366', // Primary Blue
        marginBottom: '15px',
        textAlign: 'center'
      }}>
        Profile Completion
      </h3>

      {/* Progress Bar */}
      <div style={{
        backgroundColor: '#E5E9EC', // Soft Gray
        borderRadius: '10px',
        height: '20px',
        marginBottom: '15px',
        overflow: 'hidden'
      }}>
        <div style={{
          backgroundColor: '#00A67A', // Teal Green
          height: '100%',
          width: `${completionPercentage}%`,
          borderRadius: '10px',
          transition: 'width 0.3s ease'
        }}></div>
      </div>

      <p style={{
        textAlign: 'center',
        color: '#4A4A4A', // Text Secondary
        fontSize: '14px',
        marginBottom: '20px'
      }}>
        {completedCards} complete, {partialCards} partial, {incompleteCards.length} incomplete ({Math.round(completionPercentage)}%)
      </p>

      {/* Completion Status */}
      {completedCards === totalCards ? (
        <div style={{
          textAlign: 'center',
          padding: '15px',
          backgroundColor: '#1DB954', // Success Green background
          color: '#FFFFFF',
          borderRadius: '8px'
        }}>
          <p style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: '600'
          }}>
            🎉 Congratulations! Your profile is complete!
          </p>
          <p style={{
            margin: '5px 0 0 0',
            fontSize: '14px'
          }}>
            All sections have been filled out. Your profile looks great!
          </p>
        </div>
      ) : (
        <div>
          {/* Incomplete Sections */}
          {incompleteCards.length > 0 && (
            <>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#0A0F1A', // Text Primary
                marginBottom: '10px'
              }}>
                Complete these sections:
              </h4>
              
              {incompleteCards.map((cardName) => (
                <div key={cardName} style={{
                  backgroundColor: '#FFFFFF', // Surface White
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  marginBottom: '10px'
                }}>
                  <h5 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#DC2626', // Red for incomplete
                    marginBottom: '6px',
                    textTransform: 'capitalize'
                  }}>
                    {formatCardName(cardName)} - Incomplete
                  </h5>
                  <ul style={{
                    margin: 0,
                    paddingLeft: '15px',
                    color: '#4A4A4A' // Text Secondary
                  }}>
                    {tips[cardName].map((tip, index) => (
                      <li key={index} style={{
                        fontSize: '12px',
                        marginBottom: '2px'
                      }}>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </>
          )}

          {/* Partial Sections */}
          {partialCardsArray.length > 0 && (
            <>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#0A0F1A', // Text Primary
                marginBottom: '10px',
                marginTop: incompleteCards.length > 0 ? '20px' : '0'
              }}>
                Improve these sections:
              </h4>
              
              {partialCardsArray.map((cardName) => {
                const details = getCompletionDetails(data[cardName], cardName);
                
                return (
                  <div key={cardName} style={{
                    backgroundColor: '#FFFFFF', // Surface White
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #F59E0B', // Warning border
                    marginBottom: '10px'
                  }}>
                    <h5 style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#F59E0B', // Warning color
                      marginBottom: '6px',
                      textTransform: 'capitalize'
                    }}>
                      {formatCardName(cardName)} - Could be improved
                    </h5>
                    
                    {details.needsMoreEntries ? (
                      <p style={{
                        margin: 0,
                        fontSize: '12px',
                        color: '#4A4A4A'
                      }}>
                        You have <strong>{details.currentCount}</strong> {details.currentCount === 1 ? 'entry' : 'entries'}. 
                        Add <strong>{details.additionalNeeded}</strong> more {details.additionalNeeded === 1 ? 'entry' : 'entries'} to reach 
                        the recommended <strong>{details.neededCount}</strong> {details.neededCount === 1 ? 'entry' : 'entries'}.
                      </p>
                    ) : (
                      <p style={{
                        margin: 0,
                        fontSize: '12px',
                        color: '#4A4A4A'
                      }}>
                        You have enough entries ({details.currentCount}), but {details.itemsNeedingImprovement} {details.itemsNeedingImprovement === 1 ? 'needs' : 'need'} more 
                        details. Add more information to your existing {details.itemsNeedingImprovement === 1 ? 'entry' : 'entries'} to complete this section.
                      </p>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ProgressTracker;