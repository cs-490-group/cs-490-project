import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CoverLetterAPI from "../../api/coverLetters";
import JobsAPI from "../../api/jobs";
import UserAPI from "../../api/user";
import AIAPI from "../../api/AI";
import { useFlash } from "../../context/flashContext";
import { Undo2, Redo2, Bold, Italic, Underline, List, Zap, Save, Clock, AlertCircle, CheckCircle } from "lucide-react";

export default function EditCoverLetterPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showFlash } = useFlash();
  const iframeRef = useRef(null);

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const contentRef = useRef("");
  const [letterLoaded, setLetterLoaded] = useState(false);
  const [editorMode, setEditorMode] = useState("visual");
  const [htmlContent, setHtmlContent] = useState("");
  const [showAIHelper, setShowAIHelper] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [readabilityScore, setReadabilityScore] = useState(0);
  const [versionHistory, setVersionHistory] = useState([]);
  const [autoSaveStatus, setAutoSaveStatus] = useState("saved");
  const [selectedWord, setSelectedWord] = useState(null);
  const [synonyms, setSynonyms] = useState([]);
  const [showSynonyms, setShowSynonyms] = useState(false);

  // AI Suggestions state
  const [aiSuggestions, setAiSuggestions] = useState("");
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  

  // Load cover letter
  useEffect(() => {
    if (!id) return;
    const loadData = async () => {
      try {
        // Fetch Letter AND Versions in parallel
        const [letterRes, versionsRes] = await Promise.all([
          CoverLetterAPI.get(id),
          CoverLetterAPI.getVersions(id) 
        ]);

        const letter = letterRes.data;
        setTitle(letter.title || "");
        setCompany(letter.company || "");
        setPosition(letter.position || "");
        contentRef.current = letter.content || "";
        setHtmlContent(letter.content || "");
        
        // Transform database versions for the UI
        const history = (versionsRes.data || []).map(v => ({
          timestamp: new Date(v.created_at),
          content: v.content_snapshot
        }));
        
        setVersionHistory(history);
        setLetterLoaded(true);
      } catch (err) {
        console.error(err);
        showFlash("Failed to load cover letter data.", "error");
      }
    };
    loadData();
  }, [id, navigate, showFlash]);

  const calculateStats = (text) => {
    const plainText = text.replace(/<[^>]*>/g, "");
    const words = plainText.trim().split(/\s+/).filter(Boolean);
    const chars = plainText.length;
    const sentences = plainText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = words.length / (sentences.length || 1);
    const score = Math.max(0, Math.min(100, 100 - (avgWordsPerSentence * 5)));
    setWordCount(words.length);
    setCharCount(chars);
    setReadabilityScore(Math.round(score));
  };

  // Iframe editor setup
  useEffect(() => {
    if (!iframeRef.current || !letterLoaded || editorMode !== "visual") return;
    const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
    doc.open();
    doc.write(contentRef.current);
    doc.close();
    doc.body.contentEditable = "true";

    const onInput = () => {
      const htmlText = doc.documentElement.innerHTML;
      contentRef.current = htmlText;
      setHtmlContent(htmlText);
      calculateStats(htmlText);
      setAutoSaveStatus("unsaved");
    };

    const onMouseUp = () => {
      const selection = doc.getSelection();
      if (selection.toString().length > 0) {
        setSelectedWord(selection.toString().trim());
        setShowSynonyms(true);
        fetchSynonyms(selection.toString().trim());
      }
    };

    doc.body.addEventListener("input", onInput);
    doc.body.addEventListener("mouseup", onMouseUp);
    return () => {
      doc.body.removeEventListener("input", onInput);
      doc.body.removeEventListener("mouseup", onMouseUp);
    };
  }, [letterLoaded, editorMode]);

  // Auto-save
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (autoSaveStatus === "unsaved" && contentRef.current) performAutoSave();
    }, 30000);
    return () => clearInterval(autoSaveInterval);
  }, [autoSaveStatus]);

  const performAutoSave = async () => {
    setAutoSaveStatus("saving");
    try {
      await CoverLetterAPI.update(id, { title, content: contentRef.current });
      setAutoSaveStatus("saved");
      setVersionHistory(prev => [...prev, { timestamp: new Date(), content: contentRef.current }].slice(-10));
    } catch (err) {
      console.error("Auto-save failed:", err);
      setAutoSaveStatus("unsaved");
    }
  };

  const fetchSynonyms = async (word) => {
    try {
      const res = await AIAPI.generateText({
        prompt: `Generate 4 synonyms for "${word}", return as a comma-separated list only.`,
        system_message: "You are a helpful assistant generating synonyms."
      });
      const syns = (res.data.result || res.data.response || res.data.text || "").split(",").map(s => s.trim()).filter(Boolean);
      setSynonyms(syns);
    } catch (err) {
      console.error(err);
      setSynonyms([]);
    }
  };

  const replaceSynonym = (synonym) => {
    if (!iframeRef.current || !selectedWord) return;
    const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
    const selection = doc.getSelection();
    if (selection.rangeCount > 0) {
      selection.deleteFromDocument();
      const span = doc.createElement("span");
      span.textContent = synonym;
      selection.getRangeAt(0).insertNode(span);
    }
    setShowSynonyms(false);
    contentRef.current = doc.documentElement.innerHTML;
    calculateStats(doc.documentElement.innerHTML);
  };

  const restoreVersion = (version) => {
    contentRef.current = version.content;
    setHtmlContent(version.content);
    if (editorMode === "visual") {
      setEditorMode("html");
      setTimeout(() => {
        setEditorMode("visual");
        setTimeout(() => {
          if (iframeRef.current) {
            const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
            doc.open();
            doc.write(version.content);
            doc.close();
            doc.body.contentEditable = "true";
          }
        }, 50);
      }, 50);
    }
    calculateStats(version.content);
    setAutoSaveStatus("unsaved");
    showFlash("Version restored", "success");
  };

  const applyFormatting = (command, value = null) => {
    const doc = iframeRef.current?.contentDocument || iframeRef.current?.contentWindow.document;
    if (!doc) return;
    doc.execCommand(command, false, value);
    doc.body.focus();
  };

  const insertList = (type) => {
    const doc = iframeRef.current?.contentDocument || iframeRef.current?.contentWindow.document;
    if (!doc) return;
    doc.execCommand(type === "ul" ? "insertUnorderedList" : "insertOrderedList");
    doc.body.focus();
  };

  const handleSave = async () => {
    try {
      const contentToSave = editorMode === "visual" && iframeRef.current
        ? iframeRef.current.contentDocument.documentElement.innerHTML
        : htmlContent;

      // Update main document
      await CoverLetterAPI.update(id, { title, company, position, content: contentToSave });
      await CoverLetterAPI.createVersion(id, {version_name: `Save: ${new Date().toLocaleTimeString()}`,content_snapshot: contentToSave,title_snapshot: title});


      const versionsRes = await CoverLetterAPI.getVersions(id);
      const history = (versionsRes.data || []).map(v => ({
        timestamp: new Date(v.created_at),
        content: v.content_snapshot
      }));
      setVersionHistory(history);

      setAutoSaveStatus("saved");
      showFlash("Cover letter saved!", "success");
    } catch (err) {
      console.error(err);
      showFlash("Failed to save cover letter.", "error");
    }
  };

const handleGenerateCoverLetter = async () => {
  setAiLoading(true);
  try {
    const userData = await UserAPI.getAllData();
    
    // Fetch all jobs to find the matching one
    let jobData = null;
    try {
      const jobsRes = await JobsAPI.getAll();
      const jobs = jobsRes.data || [];
      
      // Try to find a job that matches the company/position in the cover letter
      if (company || position) {
        jobData = jobs.find(j => 
          (company && j.company && j.company.toLowerCase().includes(company.toLowerCase())) ||
          (position && j.title && j.title.toLowerCase().includes(position.toLowerCase()))
        );
      }
      
      // If no match found, use the most recent job
      if (!jobData && jobs.length > 0) {
        jobData = jobs[0];
      }
    } catch (err) {
      console.warn("Failed to fetch job data:", err);
    }

    const res = await AIAPI.generateText({
      prompt: `
User instructions: "${aiPrompt}"
Personalize for company "${company}" and role "${position}".
if "${company}" is specified, then you MUST provide at one or two specific details about the company, as well as a comment about recent news of the company in the cover letter (the more specific, the better). This is non-negotiable.
Preserve all HTML and inline styles.
Return ONLY updated HTML content.
DO NOT ADD YOUR OWN STYLINGS OR HTML ELEMENTS OR CSS. ONLY WHAT WAS ORIGINALLY THERE. 
Return ONLY HTML content.
Don't invent any personal details/certifications/education/skills. Only use what you are given in the cover letter.

User Profile Data:
${JSON.stringify(userData, null, 2)}

${jobData ? `
Job Details:
${JSON.stringify(jobData, null, 2)}
` : ''}

Current letter content:
${contentRef.current}
      `,
      system_message: `
You are a professional cover letter writer.
Preserve all HTML and inline styles.
DO NOT ADD YOUR OWN STYLINGS OR HTML ELEMENTS OR CSS. ONLY WHAT WAS ORIGINALLY THERE. 
Return ONLY HTML content.
Don't invent any personal details/certifications/education/skills. Only use what you are given.

Reference Data:
${JSON.stringify(userData, null, 2)}
${jobData ? `\nJob Data:\n${JSON.stringify(jobData, null, 2)}` : ''}
`
    });

    const generated = res.data.response || res.data.result || res.data.text || "";
    if (iframeRef.current && editorMode === "visual") {
      const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
      doc.body.innerHTML = generated;
      contentRef.current = doc.documentElement.innerHTML;
      setHtmlContent(doc.documentElement.innerHTML);
      calculateStats(doc.documentElement.innerHTML);
      setAutoSaveStatus("unsaved");
    }

    setAiPrompt("");
    showFlash("Cover letter generated successfully.", "success");
  } catch (err) {
    console.error(err);
    showFlash("Failed to generate cover letter.", "error");
  } finally {
    setAiLoading(false);
  }
};

  // AI Suggestions handler (text-only)
  const handleAISuggestions = async () => {
    if (!contentRef.current) return;
    setAiLoading(true);
    try {
      const res = await AIAPI.generateText({
        prompt: `
Provide text-only suggestions for improving this cover letter content.
Do NOT change HTML structure, CSS, or inline styles.

Current letter content:
${contentRef.current}
      `,
      system_message: `
You are a helpful AI assistant providing suggestions for improving cover letters.
Return plain text suggestions only. Do not mention html/css elements or tags in your suggestions. So you should not comment on the html at all. So no <h1> or <p> mentions, for example.
      `
    });

    const suggestions = res.data.response || res.data.result || res.data.text || "";
    setAiSuggestions(suggestions);
    setShowAISuggestions(true);
    showFlash("AI suggestions generated.", "success");
    } catch (err) {
      console.error(err);
      showFlash("Failed to generate AI suggestions.", "error");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2>Edit Cover Letter</h2>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {autoSaveStatus === "saved" && <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#34c759" }}><CheckCircle size={16} /><span style={{ fontSize: "12px" }}>Auto-saved</span></div>}
          {autoSaveStatus === "saving" && <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#ff9500" }}><Clock size={16} /><span style={{ fontSize: "12px" }}>Saving...</span></div>}
          {autoSaveStatus === "unsaved" && <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#ff3b30" }}><AlertCircle size={16} /><span style={{ fontSize: "12px" }}>Unsaved changes</span></div>}
        </div>
      </div>

      {/* Form Fields */}
      <div style={{ marginBottom: "20px" }}>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" style={{ width: "100%", marginBottom: "10px", padding: "10px", fontSize: "14px" }} />
        <div style={{ display: "flex", gap: "10px" }}>
          <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="Company" style={{ flex: 1, padding: "10px", fontSize: "14px" }} />
          <input type="text" value={position} onChange={e => setPosition(e.target.value)} placeholder="Position" style={{ flex: 1, padding: "10px", fontSize: "14px" }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "20px" }}>
        <div>
          <div style={{ marginBottom: "15px", display: "flex", gap: "10px" }}>
            <button onClick={() => setEditorMode("visual")} style={{ padding: "8px 16px", background: editorMode === "visual" ? "#2196f3" : "#ccc", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Visual Editor</button>
            <button onClick={() => setEditorMode("html")} style={{ padding: "8px 16px", background: editorMode === "html" ? "#2196f3" : "#ccc", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>HTML Editor</button>
          </div>

          {editorMode === "visual" && (
            <>
              <div style={{ display: "flex", gap: "5px", padding: "10px", background: "#f5f5f5", borderRadius: "4px", marginBottom: "10px", flexWrap: "wrap", alignItems: "center" }}>
                <button onClick={() => applyFormatting("undo")} title="Undo" style={{ padding: "6px 10px", cursor: "pointer", border: "1px solid #ccc", borderRadius: "3px" }}><Undo2 size={16} /></button>
                <button onClick={() => applyFormatting("redo")} title="Redo" style={{ padding: "6px 10px", cursor: "pointer", border: "1px solid #ccc", borderRadius: "3px" }}><Redo2 size={16} /></button>
                <div style={{ width: "1px", height: "20px", background: "#ccc", margin: "0 5px" }} />
                <button onClick={() => applyFormatting("bold")} title="Bold" style={{ padding: "6px 10px", cursor: "pointer", border: "1px solid #ccc", borderRadius: "3px" }}><Bold size={16} /></button>
                <button onClick={() => applyFormatting("italic")} title="Italic" style={{ padding: "6px 10px", cursor: "pointer", border: "1px solid #ccc", borderRadius: "3px" }}><Italic size={16} /></button>
                <button onClick={() => applyFormatting("underline")} title="Underline" style={{ padding: "6px 10px", cursor: "pointer", border: "1px solid #ccc", borderRadius: "3px" }}><Underline size={16} /></button>
                <div style={{ width: "1px", height: "20px", background: "#ccc", margin: "0 5px" }} />
                <button onClick={() => insertList("ul")} title="Bullet List" style={{ padding: "6px 10px", cursor: "pointer", border: "1px solid #ccc", borderRadius: "3px" }}><List size={16} /></button>
                <button onClick={() => insertList("ol")} title="Numbered List" style={{ padding: "6px 10px", cursor: "pointer", border: "1px solid #ccc", borderRadius: "3px" }}><List size={16} style={{ transform: "rotate(90deg)" }} /></button>
                <div style={{ width: "1px", height: "20px", background: "#ccc", margin: "0 5px" }} />
                <button onClick={() => setShowAIHelper(!showAIHelper)} title="AI Helper" style={{ padding: "6px 10px", cursor: "pointer", border: "1px solid #ccc", borderRadius: "3px", background: showAIHelper ? "#e0f7fa" : "white" }}><Zap size={16} /></button>
                <button onClick={handleSave} title="Save Now" style={{ padding: "6px 10px", cursor: "pointer", border: "1px solid #ccc", borderRadius: "3px" }}><Save size={16} /></button>
                <button 
                  onClick={() => navigate("/cover-letter")} 
                  title="Cancel" 
                  style={{ padding: "6px 10px", cursor: "pointer", border: "1px solid #ccc", borderRadius: "3px", marginLeft: "5px", background: "#ff3b30", color: "white" }}
                >
                  Exit
                </button>
              </div>

              <iframe ref={iframeRef} title="Cover Letter Editor" style={{ width: "100%", height: "500px", border: "1px solid #ccc", borderRadius: "4px", background: "white" }}></iframe>

              {showSynonyms && synonyms.length > 0 && (
                <div style={{ position: "absolute", background: "white", border: "1px solid #ccc", borderRadius: "4px", padding: "8px", top: "100px", right: "20px", width: "200px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>
                  <strong>Synonyms:</strong>
                  <ul style={{ listStyle: "none", padding: 0, marginTop: "5px" }}>
                    {synonyms.map((syn, idx) => (
                      <li key={idx} onClick={() => replaceSynonym(syn)} style={{ cursor: "pointer", marginBottom: "4px", color: "#2196f3" }}>{syn}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {editorMode === "html" && (
            <textarea value={htmlContent} onChange={(e) => { setHtmlContent(e.target.value); contentRef.current = e.target.value; calculateStats(e.target.value); setAutoSaveStatus("unsaved"); }} style={{ width: "100%", height: "500px", fontFamily: "monospace", fontSize: "14px", border: "1px solid #ccc", borderRadius: "4px", padding: "10px" }} />
          )}
        </div>

        <div>
          {showAIHelper && (
            <div style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "15px", background: "#fafafa" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <Zap size={18} />
                <h4 style={{ margin: 0 }}>AI Helper</h4>
              </div>

              <textarea 
                value={aiPrompt} 
                onChange={(e) => setAiPrompt(e.target.value)} 
                placeholder="Optionally, provide instructions to improve the cover letter..." 
                style={{ width: "100%", height: "100px", padding: "8px", marginBottom: "10px", borderRadius: "4px" }} 
              />

              {/* Generate Cover Letter button */}
              <button 
                onClick={handleGenerateCoverLetter} 
                disabled={aiLoading} 
                style={{ width: "100%", padding: "8px", background: "#2196f3", color: "white", border: "none", borderRadius: "4px", cursor: aiLoading ? "not-allowed" : "pointer", marginBottom: "10px" }}
              >
                {aiLoading ? "Generating..." : "Generate Cover Letter"}
              </button>

              {/* AI Suggestions button */}
              <button 
                onClick={handleAISuggestions} 
                disabled={aiLoading} 
                style={{ width: "100%", padding: "8px", background: "#ffeb3b", color: "black", border: "none", borderRadius: "4px", cursor: aiLoading ? "not-allowed" : "pointer" }}
              >
                💡 Suggestions
              </button>
            </div>
          )}

          {showAISuggestions && (
            <div style={{ marginTop: "20px", padding: "10px", border: "1px solid #ccc", borderRadius: "4px", background: "#fff" }}>
              <h5>AI Suggestions</h5>
              <p style={{ whiteSpace: "pre-wrap" }}>{aiSuggestions}</p>
              <button 
                onClick={() => setShowAISuggestions(false)} 
                style={{ marginTop: "10px", padding: "6px 10px", borderRadius: "4px", border: "none", background: "#2196f3", color: "white", cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          )}

          <div style={{ marginTop: "20px", padding: "10px", border: "1px solid #ccc", borderRadius: "4px", background: "#fff" }}>
            <h5>Stats</h5>
            <p>Words: {wordCount}</p>
            <p>Characters: {charCount}</p>
            <p>Readability: {readabilityScore}</p>
          </div>

          <div style={{ marginTop: "20px", padding: "10px", border: "1px solid #ccc", borderRadius: "4px", background: "#fff" }}>
            <h5>Version History</h5>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {versionHistory.map((v, idx) => (
                <li key={idx} style={{ cursor: "pointer", color: "#2196f3", marginBottom: "5px" }} onClick={() => restoreVersion(v)}>
                  {v.timestamp.toLocaleString()}
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}
