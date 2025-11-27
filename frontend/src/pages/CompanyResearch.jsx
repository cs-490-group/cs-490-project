import React, { useState } from "react";
import axios from "axios";
import { Container, Card, Form, Button, Spinner } from "react-bootstrap";

export default function CompanyResearch() {
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const handleSearch = async () => {
    if (!company.trim()) return;

    setLoading(true);
    setData(null);

    try {
      const res = await axios.post("http://127.0.0.1:8000/api/company-research", {
        company,
      });

      setData(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch company research.");
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0d74a5, #1fa085)",
        paddingTop: "40px",
      }}
    >
      <Container style={{ maxWidth: "900px" }}>
        <h1
          style={{
            color: "white",
            marginBottom: "20px",
            fontWeight: "700",
            textAlign: "left",
          }}
        >
          Company Research
        </h1>

        {/* Search Bar */}
        <Form className="mb-4">
          <Form.Control
            type="text"
            placeholder="Search for a company..."
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            style={{
              height: "50px",
              borderRadius: "8px",
              border: "1px solid #d0d0d0",
            }}
          />
        </Form>

        <div className="text-start mb-4">
          <Button
            onClick={handleSearch}
            style={{
              backgroundColor: "#4a6cf7",
              border: "none",
              padding: "10px 20px",
              borderRadius: "6px",
            }}
          >
            {loading ? <Spinner animation="border" size="sm" /> : "Start Research"}
          </Button>
        </div>

        {/* Loading */}
        {loading && (
          <Card className="p-4" style={{ borderRadius: "10px", background: "white" }}>
            <Spinner animation="border" /> Loading company details...
          </Card>
        )}

        {/* Results */}
        {data && (
          <>
            <Card className="p-4 mb-4 shadow-sm" style={{ borderRadius: "10px" }}>
              <h4>Basic Information</h4>
              <p><strong>Name:</strong> {data.basic?.name}</p>
              <p><strong>Industry:</strong> {data.basic?.industry}</p>
              <p><strong>Size:</strong> {data.basic?.size}</p>
              <p><strong>Headquarters:</strong> {data.basic?.hq}</p>
            </Card>

            <Card className="p-4 mb-4 shadow-sm"><h4>Mission, Values & Culture</h4><p>{data.mission}</p></Card>
            <Card className="p-4 mb-4 shadow-sm">
              <h4>Leadership</h4>
                {data.executives?.map((x, i) => (
                <p key={i}>
                {typeof x === "string"
                  ? x
                  : [x.name, x.title].filter(Boolean).join(" – ")}
                </p>
                ))}
            </Card>

            <Card className="p-4 mb-4 shadow-sm">
              <h4>Products</h4>
                {data.products?.map((x, i) => (
                <p key={i}>{typeof x === "string" ? x : JSON.stringify(x)}</p>
                ))}
            </Card>

            <Card className="p-4 mb-4 shadow-sm">
              <h4>Competitors</h4>
                {data.competitors?.map((x, i) => (
                <p key={i}>{typeof x === "string" ? x : JSON.stringify(x)}</p>
                ))}
            </Card>

            <Card className="p-4 mb-4 shadow-sm">
              <h4>Socials</h4>
                {data.socials?.map((x, i) => (
                <p key={i}>{typeof x === "string" ? x : JSON.stringify(x)}</p>
                ))}
            </Card>


            <Card className="p-4 mb-4 shadow-sm">
              <h4>Recent News</h4>
              {data.news?.map((n, i) => (
                <div key={i} className="mb-3">
                  <strong>{n.title}</strong>
                  <p>{n.source} — {n.date}</p>
                  <a href={n.url} target="_blank" rel="noreferrer">Read more</a>
                </div>
              ))}
            </Card>

            <Card className="p-4 mb-5 shadow-sm"><h4>AI Summary</h4><p>{data.summary}</p></Card>
          </>
        )}
      </Container>
    </div>
  );
}

