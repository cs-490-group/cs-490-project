import React from "react";

export default function FilterBar({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  industryFilter,
  setIndustryFilter,
  locationFilter,
  setLocationFilter,
  jobTypeFilter,
  setJobTypeFilter,
  salaryFilter,
  setSalaryFilter,
  sortBy,
  setSortBy,
  clearAllFilters,
  selectAllVisible,
  showArchived,
  stages,
  sortedJobsLength
}) {
  const inputStyle = {
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    fontSize: "14px",
  };

  return (
    <div style={{ background: "#f9f9f9", padding: "16px", borderRadius: "8px", marginBottom: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <h3 style={{ margin: 0, fontSize: "16px" }}>🔍 Search & Filters</h3>
        <div style={{ display: "flex", gap: "10px" }}>
          {!showArchived && (
            <button
              onClick={selectAllVisible}
              style={{
                padding: "6px 12px",
                background: "#4f8ef7",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              ☑️ Select All Visible
            </button>
          )}
          <button
            onClick={clearAllFilters}
            style={{
              padding: "6px 12px",
              background: "#ff3b30",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Clear All
          </button>
        </div>
      </div>

      <div style={{ marginBottom: "12px" }}>
        <input
          type="text"
          placeholder="Search by job title, company, or keywords..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px" }}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={inputStyle}>
          <option value="All">All Statuses</option>
          {stages.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select value={industryFilter} onChange={(e) => setIndustryFilter(e.target.value)} style={inputStyle}>
          <option value="All">All Industries</option>
          <option value="Technology">Technology</option>
          <option value="Finance">Finance</option>
          <option value="Healthcare">Healthcare</option>
          <option value="Education">Education</option>
          <option value="Marketing">Marketing</option>
          <option value="Design">Design</option>
          <option value="Consulting">Consulting</option>
          <option value="Manufacturing">Manufacturing</option>
          <option value="Retail">Retail</option>
          <option value="Other">Other</option>
        </select>

        <input
          type="text"
          placeholder="Location..."
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          style={inputStyle}
        />

        <select value={jobTypeFilter} onChange={(e) => setJobTypeFilter(e.target.value)} style={inputStyle}>
          <option value="All">All Types</option>
          <option value="Full-Time">Full-Time</option>
          <option value="Part-Time">Part-Time</option>
          <option value="Contract">Contract</option>
          <option value="Internship">Internship</option>
        </select>

        <input
          type="text"
          placeholder="Min salary..."
          value={salaryFilter}
          onChange={(e) => setSalaryFilter(e.target.value)}
          style={inputStyle}
        />

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={inputStyle}>
          <option value="dateAdded">Sort: Date Added</option>
          <option value="deadline">Sort: Deadline</option>
          <option value="company">Sort: Company</option>
          <option value="title">Sort: Title</option>
          {showArchived && <option value="archiveDate">Sort: Archive Date</option>}
        </select>
      </div>
      
      {showArchived && (
        <div style={{
          marginTop: "12px",
          padding: "12px",
          background: "#fff3cd",
          borderRadius: "4px",
          fontSize: "14px",
          color: "#856404"
        }}>
          📦 Viewing archived jobs ({sortedJobsLength} total)
        </div>
      )}
    </div>
  );
}