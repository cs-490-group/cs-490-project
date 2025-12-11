import React from 'react';

const CategoryCard = ({ data }) => {
  // Default data if none provided
  const defaultData = [
    ["Sub1", ["thing1", "thing 2", "thing 3"]], 
    ["Sub2", ["thing4", "thing 5"]],
    ["Sub3", ["thing4", "thing 5"]],
    ["Sub4", ["thing4", "thing 5"]],
    ["Sub5", ["thing4", "thing 5"]],
    ["Sub6", ["thing4", "thing 5"]],
    ["Sub7", ["thing4", "thing 5"]], 
    ["Sub8", ["thing6", "thing7"]]
  ];

  const cardData = data || defaultData;

  // Check if data is empty array
  if (data && data.length === 0) {
    return (
      <div style={{
        width: '100%',
        padding: '10px',
        backgroundColor: '#E5E9EC', // Soft Gray for card backgrounds
        borderRadius: '6px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
        border: '1px solid #D1D5DB', // Divider Gray
        boxSizing: 'border-box',
        textAlign: 'center'
      }}>
        <p style={{ 
          margin: 0, 
          color: '#4A4A4A', // Text Secondary
          fontSize: '12px'
        }}>
          No Data Available
        </p>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      height: '100%', // Fill the scrollable container
      padding: '10px',
      backgroundColor: '#E5E9EC', // Soft Gray for card backgrounds
      borderRadius: '6px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
      border: '1px solid #D1D5DB', // Divider Gray
      boxSizing: 'border-box',
      // overflowY: 'auto', // Allow vertical scrolling
      overflowX: 'hidden', // Prevent horizontal overflow
      wordWrap: 'break-word', // Break long words
      overflowWrap: 'break-word' // Additional word breaking support
    }}>
      {cardData.map((section, index) => {
        const [subheading, items] = section;
        
        return (
          <div key={index} style={{ 
            marginBottom: index === cardData.length - 1 ? '0' : '12px',
            width: '100%' // Ensure section takes full width
          }}>
            <h2 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#0A0F1A', // Text Primary
              marginBottom: '4px',
              paddingBottom: '2px',
              borderBottom: '1px solid #D1D5DB', // Divider Gray
              wordWrap: 'break-word', // Break long words
              overflowWrap: 'break-word', // Additional word breaking
              width: '100%' // Ensure full width
            }}>
              {subheading}
            </h2>
            <ul style={{ 
              listStyle: 'none', 
              padding: 0, 
              margin: 0,
              width: '100%' // Ensure ul takes full width
            }}>
              {items.map((item, itemIndex) => (
                <li key={itemIndex} style={{
                  color: '#4A4A4A', // Text Secondary
                  marginLeft: '10px',
                  marginBottom: '2px',
                  fontSize: '12px',
                  lineHeight: '1.3',
                  wordWrap: 'break-word', // Break long words
                  overflowWrap: 'break-word', // Additional word breaking
                  maxWidth: 'calc(100% - 10px)', // Account for margin
                  whiteSpace: 'normal', // Allow text wrapping
                  textAlign: 'left',
                  paddingLeft: '5%'
                }}>
                  • {item}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
};

export default CategoryCard;