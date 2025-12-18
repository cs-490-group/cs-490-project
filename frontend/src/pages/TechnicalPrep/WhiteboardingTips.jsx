import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/technicalPrep.css";

const WhiteboardingTips = () => {
  const navigate = useNavigate();
  const [expandedSection, setExpandedSection] = useState(null);

  const tips = [
    {
      id: "problem-clarification",
      title: "1. Clarify the Problem",
      icon: "❓",
      details: [
        "Ask clarifying questions before jumping into solutions",
        "Confirm input/output format and constraints",
        "Discuss edge cases and special scenarios",
        "Example: 'What's the maximum size of the input?' or 'Are there any constraints on memory?'"
      ],
      tips: [
        "Repeat the problem back to the interviewer to confirm understanding",
        "Ask about worst-case scenarios",
        "Clarify ambiguous requirements immediately",
        "Document constraints on the whiteboard"
      ]
    },
    {
      id: "approach",
      title: "2. Discuss Your Approach",
      icon: "🗺️",
      details: [
        "Walk through your approach BEFORE writing code",
        "Explain trade-offs between different approaches",
        "Discuss time and space complexity upfront",
        "Ask for feedback on your approach"
      ],
      tips: [
        "Start with a brute force solution, then optimize",
        "Discuss why you chose this approach",
        "Be open to interviewer suggestions",
        "Consider multiple solutions and their tradeoffs"
      ]
    },
    {
      id: "pseudocode",
      title: "3. Write Pseudocode First",
      icon: "📝",
      details: [
        "Write pseudocode before actual code",
        "This shows logical thinking without syntax issues",
        "Makes it easier to spot logical errors early",
        "Your interviewer can follow your logic more easily"
      ],
      tips: [
        "Use clear, descriptive variable names",
        "Break complex logic into smaller steps",
        "Pseudocode doesn't need to be syntactically perfect",
        "Walk through pseudocode with an example"
      ]
    },
    {
      id: "clean-code",
      title: "4. Write Clean, Readable Code",
      icon: "✨",
      details: [
        "Use meaningful variable names (not 'x', 'y', 'z')",
        "Add comments explaining complex logic",
        "Use consistent indentation and formatting",
        "Make your code easy to read and understand"
      ],
      tips: [
        "Leave space between logical sections",
        "Write code large enough to be readable from a distance",
        "Use standard naming conventions for your language",
        "Don't cram too much into one line"
      ]
    },
    {
      id: "test-cases",
      title: "5. Test With Examples",
      icon: "🧪",
      details: [
        "Walk through your code with concrete examples",
        "Test both normal and edge cases",
        "Trace through the code step by step",
        "Catch bugs before the interviewer does"
      ],
      tips: [
        "Start with a simple, small example",
        "Test edge cases (empty input, single element, etc.)",
        "Use the whiteboard to trace variable states",
        "Explain what each step does as you trace"
      ]
    },
    {
      id: "complexity-analysis",
      title: "6. Analyze Complexity",
      icon: "📊",
      details: [
        "Clearly state time and space complexity",
        "Explain WHY this is the complexity",
        "Discuss if it can be optimized further",
        "Be prepared to discuss trade-offs"
      ],
      tips: [
        "Break down complexity analysis step by step",
        "Consider best, average, and worst cases",
        "Be honest if you're not sure - ask for feedback",
        "Show how you derived the complexity calculation"
      ]
    },
    {
      id: "communication",
      title: "7. Communicate Constantly",
      icon: "💬",
      details: [
        "Think out loud - explain what you're doing",
        "Don't silently code for long periods",
        "Ask for help when stuck",
        "Engage with the interviewer's feedback"
      ],
      tips: [
        "Narrate each step of your solution",
        "If you get stuck, talk through the problem",
        "Ask clarifying questions if unsure",
        "Thank the interviewer for suggestions and incorporate them"
      ]
    },
    {
      id: "mistakes",
      title: "8. Handle Mistakes Gracefully",
      icon: "🔧",
      details: [
        "If you make a mistake, acknowledge it immediately",
        "Don't try to hide or cover up errors",
        "Work through the correction systematically",
        "Learn from the mistake in real-time"
      ],
      tips: [
        "Pause and think before erasing everything",
        "Explain what went wrong and how to fix it",
        "Use mistakes as learning opportunities",
        "Stay calm and composed when errors appear"
      ]
    },
    {
      id: "optimization",
      title: "9. Optimize if Time Permits",
      icon: "⚡",
      details: [
        "Only optimize AFTER basic solution works",
        "Focus on bottlenecks, not premature optimization",
        "Explain what you're optimizing and why",
        "Discuss new complexity after optimization"
      ],
      tips: [
        "Identify the slowest part of your solution",
        "Try caching/memoization for repeated computations",
        "Use appropriate data structures for the problem",
        "Balance optimization with code readability"
      ]
    },
    {
      id: "system-design",
      title: "10. System Design Specifics",
      icon: "🏗️",
      details: [
        "Start with high-level architecture",
        "Draw boxes for major components",
        "Show data flow between components",
        "Discuss scalability and trade-offs"
      ],
      tips: [
        "Draw APIs and data models clearly",
        "Use arrows to show communication flows",
        "Label all components with their purpose",
        "Discuss backup and failover strategies"
      ]
    }
  ];

  return (
    <div className="technical-prep-container">
      {/* Header */}
      <div className="prep-header">
        <button
          onClick={() => navigate("/technical-prep")}
          style={{ marginBottom: "16px", padding: "8px 16px", background: "#e5e7eb", border: "none", borderRadius: "6px", cursor: "pointer" }}
        >
          ← Back to Technical Prep
        </button>
        <h1>Whiteboarding Best Practices & Techniques</h1>
        <p>Master the art of communicating your solution during technical interviews</p>
      </div>

      {/* Quick Tips Card */}
      <div style={{
        backgroundColor: "#fef3c7",
        border: "2px solid #fbbf24",
        borderRadius: "8px",
        padding: "20px",
        marginBottom: "32px"
      }}>
        <h3 style={{ marginTop: 0, color: "#92400e" }}>💡 Golden Rules</h3>
        <ul style={{ margin: "12px 0", paddingLeft: "20px", color: "#78350f" }}>
          <li>Think out loud - silence is bad during interviews</li>
          <li>Clarify ambiguities before starting to code</li>
          <li>Optimize only after your basic solution works</li>
          <li>Test your code with examples before declaring success</li>
          <li>Communication matters as much as the solution</li>
        </ul>
      </div>

      {/* Tips Grid */}
      <div className="tips-grid" style={{ marginBottom: "32px" }}>
        {tips.map((tip) => (
          <div key={tip.id} className="tip-card" style={{
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            marginBottom: "16px",
            backgroundColor: "#ffffff"
          }}>
            <button
              onClick={() => setExpandedSection(expandedSection === tip.id ? null : tip.id)}
              style={{
                width: "100%",
                padding: "16px",
                border: "none",
                backgroundColor: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                fontSize: "1rem",
                fontWeight: "600",
                color: "#1f2937"
              }}
            >
              <span style={{ fontSize: "1.5rem" }}>{tip.icon}</span>
              <span style={{ flex: 1, textAlign: "left" }}>{tip.title}</span>
              <span style={{ fontSize: "1.2rem" }}>{expandedSection === tip.id ? "▼" : "▶"}</span>
            </button>

            {expandedSection === tip.id && (
              <div style={{ padding: "0 16px 16px 16px", borderTop: "1px solid #e5e7eb" }}>
                <div style={{ marginBottom: "16px" }}>
                  <h4 style={{ color: "#374151", marginTop: "12px", marginBottom: "8px" }}>Details:</h4>
                  <ul style={{ margin: "0", paddingLeft: "20px", color: "#6b7280" }}>
                    {tip.details.map((detail, idx) => (
                      <li key={idx} style={{ marginBottom: "6px" }}>{detail}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 style={{ color: "#374151", marginBottom: "8px" }}>Pro Tips:</h4>
                  <ul style={{ margin: "0", paddingLeft: "20px", color: "#6b7280" }}>
                    {tip.tips.map((t, idx) => (
                      <li key={idx} style={{ marginBottom: "6px" }}>{t}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Common Mistakes */}
      <div style={{
        backgroundColor: "#fee2e2",
        border: "2px solid #fca5a5",
        borderRadius: "8px",
        padding: "20px",
        marginBottom: "32px"
      }}>
        <h3 style={{ marginTop: 0, color: "#7f1d1d" }}>❌ Common Mistakes to Avoid</h3>
        <ul style={{ margin: "12px 0", paddingLeft: "20px", color: "#991b1b" }}>
          <li><strong>Jumping into code too quickly</strong> - Take time to discuss the approach first</li>
          <li><strong>Not testing your code</strong> - Always trace through with examples</li>
          <li><strong>Making assumptions without clarifying</strong> - Ask questions upfront</li>
          <li><strong>Ignoring edge cases</strong> - Test with empty, single-item, and boundary inputs</li>
          <li><strong>Poor naming conventions</strong> - Use descriptive variable names</li>
          <li><strong>Staying silent</strong> - Interviewers want to hear your thought process</li>
          <li><strong>Premature optimization</strong> - Get a working solution first</li>
          <li><strong>Ignoring complexity analysis</strong> - Always discuss Time/Space complexity</li>
        </ul>
      </div>

      {/* Example Walkthrough */}
      <div style={{
        backgroundColor: "#e0f2fe",
        border: "2px solid #38bdf8",
        borderRadius: "8px",
        padding: "20px",
        marginBottom: "32px"
      }}>
        <h3 style={{ marginTop: 0, color: "#0c4a6e" }}>📋 Example: Two Sum Problem</h3>
        <p style={{ color: "#164e63", marginBottom: "12px" }}><strong>Step 1: Clarify</strong></p>
        <p style={{ color: "#164e63", marginLeft: "16px", marginBottom: "12px" }}>
          "So I need to find two numbers in an array that add up to a target. I should return the indices, right? Can the array have duplicates? What about negative numbers?"
        </p>

        <p style={{ color: "#164e63", marginBottom: "12px" }}><strong>Step 2: Discuss Approach</strong></p>
        <p style={{ color: "#164e63", marginLeft: "16px", marginBottom: "12px" }}>
          "I could use a hash map to track values I've seen. For each number, I'll check if its complement exists in the map. This gives O(n) time and O(n) space."
        </p>

        <p style={{ color: "#164e63", marginBottom: "12px" }}><strong>Step 3: Pseudocode</strong></p>
        <pre style={{
          backgroundColor: "#1e293b",
          color: "#e0f2fe",
          padding: "12px",
          borderRadius: "6px",
          marginLeft: "16px",
          marginBottom: "12px",
          overflow: "auto"
        }}>
{`create empty hashmap
for each number in array:
  complement = target - number
  if complement in hashmap:
    return [hashmap[complement], current_index]
  hashmap[number] = current_index
return empty list (no solution found)`}
        </pre>

        <p style={{ color: "#164e63", marginBottom: "12px" }}><strong>Step 4: Code</strong></p>
        <pre style={{
          backgroundColor: "#1e293b",
          color: "#e0f2fe",
          padding: "12px",
          borderRadius: "6px",
          marginLeft: "16px",
          marginBottom: "12px",
          overflow: "auto"
        }}>
{`def twoSum(nums, target):
  seen = {}
  for i, num in enumerate(nums):
    complement = target - num
    if complement in seen:
      return [seen[complement], i]
    seen[num] = i
  return []`}
        </pre>

        <p style={{ color: "#164e63", marginBottom: "12px" }}><strong>Step 5: Test</strong></p>
        <p style={{ color: "#164e63", marginLeft: "16px", marginBottom: "12px" }}>
          "Let me trace through with [2, 7, 11, 15], target = 9:<br/>
          i=0: num=2, complement=7, seen={}, add 2<br/>
          i=1: num=7, complement=2, found! Return [0, 1] ✓"
        </p>

        <p style={{ color: "#164e63", marginBottom: "12px" }}><strong>Step 6: Complexity</strong></p>
        <p style={{ color: "#164e63", marginLeft: "16px" }}>
          "Time: O(n) - single pass through array<br/>
          Space: O(n) - hashmap stores up to n elements"
        </p>
      </div>

      {/* Resources */}
      <div className="resources-section">
        <h2>📚 Additional Resources</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px" }}>
          <div style={{
            backgroundColor: "#f9fafb",
            padding: "16px",
            borderRadius: "8px",
            border: "1px solid #e5e7eb"
          }}>
            <h3 style={{ marginTop: 0 }}>Data Structure Review</h3>
            <p>Refresh on Arrays, Linked Lists, Trees, Graphs, and Hash Maps</p>
            <button onClick={() => navigate("/technical-prep/coding")} className="btn btn-primary">
              Practice Coding →
            </button>
          </div>

          <div style={{
            backgroundColor: "#f9fafb",
            padding: "16px",
            borderRadius: "8px",
            border: "1px solid #e5e7eb"
          }}>
            <h3 style={{ marginTop: 0 }}>System Design Practice</h3>
            <p>Learn to design large-scale systems and components</p>
            <button onClick={() => navigate("/technical-prep/system-design")} className="btn btn-primary">
              Explore Design →
            </button>
          </div>

          <div style={{
            backgroundColor: "#f9fafb",
            padding: "16px",
            borderRadius: "8px",
            border: "1px solid #e5e7eb"
          }}>
            <h3 style={{ marginTop: 0 }}>Behavioral Practice</h3>
            <p>Master case studies and business problem-solving</p>
            <button onClick={() => navigate("/technical-prep/case-study")} className="btn btn-primary">
              Try Case Studies →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhiteboardingTips;
