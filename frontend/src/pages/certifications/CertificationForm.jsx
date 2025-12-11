import React, { useState, useRef, useEffect } from "react";

export default function CertificationForm({ addCert, editCert, cancelEdit }) {
  const [name, setName] = useState("");
  const [issuer, setIssuer] = useState("");
  const [dateEarned, setDateEarned] = useState("");
  const [doesNotExpire, setDoesNotExpire] = useState(false);
  const [expirationDate, setExpirationDate] = useState("");
  const [certNumber, setCertNumber] = useState("");
  const [documentFile, setDocumentFile] = useState(null);
  const [category, setCategory] = useState("");
  const [verified, setVerified] = useState(false);
  const [id, setId] = useState(null);

  const fileInputRef = useRef(null); 

  const categories = [
    "IT/Software", "Healthcare", "Finance", "Management", "Engineering",
    "Education", "Safety", "Legal", "Design", "Marketing", "Other"
  ];

  useEffect(() => {
    if (editCert) {
      setName(editCert.name || "");
      setIssuer(editCert.issuer || "");
      setDateEarned(editCert.date_earned || "");
      setDoesNotExpire(editCert.does_not_expire || false);
      setExpirationDate(editCert.expiration_date || "");
      setCertNumber(editCert.cert_id || editCert.cert_number || "");
      setCategory(editCert.category || "");
      setVerified(editCert.verified || false);
      setId(editCert.id);
    } else {
      resetForm();
    }
  }, [editCert]);

  const resetForm = () => {
    setName(""); setIssuer(""); setDateEarned(""); setDoesNotExpire(false);
    setExpirationDate(""); setCertNumber(""); setDocumentFile(null); setCategory(""); setVerified(false);
    setId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) return alert("Please enter certification name");
    if (!issuer.trim()) return alert("Please enter issuing organization");
    if (!dateEarned) return alert("Please select date earned");
    if (!doesNotExpire && !expirationDate) return alert("Please select expiration date or mark as does not expire");
    if (!certNumber.trim()) return alert("Please enter certification number/ID");
    if (!category) return alert("Please select a certification category");

    // Validate expiration date if set
    if (expirationDate && new Date(expirationDate) < new Date(dateEarned)) {
      return alert("Expiration date cannot be earlier than the date earned.");
    }

    const formData = new FormData();
    formData.append("id", id || `cert${Date.now()}`);
    formData.append("name", name.trim());
    formData.append("issuer", issuer.trim());
    formData.append("date_earned", dateEarned);
    formData.append("does_not_expire", doesNotExpire.toString());
    formData.append("expiration_date", doesNotExpire ? "" : expirationDate);
    formData.append("cert_number", certNumber.trim());
    formData.append("category", category);
    formData.append("verified", verified.toString());
    if (documentFile) formData.append("document", documentFile);

    if (editCert) {
      editCert.submit(formData);
    } else {
      addCert(formData);
    }

    resetForm();
    cancelEdit && cancelEdit();
  };

  const inputStyle = {
    width: "100%",
    padding: "10px",
    marginBottom: "12px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    fontSize: "14px",
    boxSizing: "border-box"
  };

  const labelStyle = {
    display: "block",
    marginBottom: "6px",
    fontWeight: "600",
    fontSize: "14px",
    color: "#333"
  };

  const sectionStyle = {
    marginBottom: "20px",
    padding: "16px",
    background: "#f9f9f9",
    borderRadius: "6px"
  };

  return (
    <div style={{
      background: "white",
      padding: "20px",
      borderRadius: "8px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      marginBottom: "24px"
    }}>
      <h2 style={{ marginTop: 0, color: "#333" }}>
        {editCert ? "✏️ Edit Certification" : "📜 Add Certification"}
      </h2>

      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <div style={sectionStyle}>
          <h3 style={{ marginTop: 0, fontSize: "16px", color: "#4f8ef7" }}>
            📋 Basic Information
          </h3>
          
          <label style={labelStyle}>Certification Name *</label>
          <input
            style={inputStyle}
            placeholder="e.g., AWS Certified Solutions Architect"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />

          <label style={labelStyle}>Issuing Organization *</label>
          <input
            style={inputStyle}
            placeholder="e.g., Amazon Web Services, Microsoft, Google"
            value={issuer}
            onChange={e => setIssuer(e.target.value)}
            required
          />

          <label style={labelStyle}>Category *</label>
          <select
            style={inputStyle}
            value={category}
            onChange={e => setCategory(e.target.value)}
            required
          >
            <option value="" disabled>Select Category</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <label style={labelStyle}>Certification Number/ID *</label>
          <input
            style={inputStyle}
            placeholder="e.g., AWS-12345-ABCDE"
            value={certNumber}
            onChange={e => setCertNumber(e.target.value)}
            required
          />
        </div>

        {/* Date Information */}
        <div style={sectionStyle}>
          <h3 style={{ marginTop: 0, fontSize: "16px", color: "#4f8ef7" }}>
            📅 Date Information
          </h3>

          <label style={labelStyle}>Date Earned *</label>
          <input
            style={inputStyle}
            type="date"
            value={dateEarned}
            onChange={e => setDateEarned(e.target.value)}
            required
          />

          {!doesNotExpire && (
            <>
              <label style={labelStyle}>Expiration Date *</label>
              <input
                style={inputStyle}
                type="date"
                value={expirationDate}
                onChange={e => setExpirationDate(e.target.value)}
                required={!doesNotExpire}
              />
            </>
          )}

          <label style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "12px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "600",
            color: "#333"
          }}>
            <input
              type="checkbox"
              checked={doesNotExpire}
              onChange={e => {
                setDoesNotExpire(e.target.checked);
                if (e.target.checked) {
                  setExpirationDate("");
                }
              }}
              style={{ width: "18px", height: "18px", cursor: "pointer" }}
            />
            Does Not Expire
          </label>
        </div>

        {/* Verification & Document */}
        <div style={sectionStyle}>
          <h3 style={{ marginTop: 0, fontSize: "16px", color: "#4f8ef7" }}>
            ✅ Verification & Document
          </h3>

          <label style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "12px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "600",
            color: "#333"
          }}>
            <input
              type="checkbox"
              checked={verified}
              onChange={e => setVerified(e.target.checked)}
              style={{ width: "18px", height: "18px", cursor: "pointer" }}
            />
            Verified by Reviewer
          </label>

          <label style={labelStyle}>Upload Certificate Document (Optional)</label>
          <input
            ref={fileInputRef}
            type="file"
            onChange={e => setDocumentFile(e.target.files[0])}
            style={{
              ...inputStyle,
              padding: "8px",
              cursor: "pointer"
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => {
              resetForm();
              cancelEdit && cancelEdit();
            }}
            style={{
              padding: "12px 24px",
              background: "#999",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600"
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              padding: "12px 24px",
              background: "#4f8ef7",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600"
            }}
          >
            {editCert ? "💾 Save Changes" : "➕ Add Certification"}
          </button>
        </div>
      </form>
    </div>
  );
}
