import React, { useState, useEffect } from "react";
import CertificationForm from "./CertificationForm";
import CertificationCard from "./CertificationCard";
import CertificationsAPI from "../../api/certifications";
import { useLocation } from "react-router-dom";
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';

export default function CertificationList() {
  const [certs, setCerts] = useState([]);
  const [search, setSearch] = useState("");
  const [editCert, setEditCert] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.showForm) {
      setShowForm(true);
    }
  }, [location.state]);

  useEffect(() => {
    loadCertifications();
  }, []);

  const loadCertifications = async () => {
    try {
      setLoading(true);
      const res = await CertificationsAPI.getAll();

      // Transform backend data to frontend format
      const transformedCerts = await Promise.all((res.data || []).map(async cert => {
        // Check if certification has associated media
        let hasDocument = false;
        let mediaId = null;

        try {
          const idsRes = await CertificationsAPI.getMediaIds(cert._id);
          const mediaIds = idsRes.data.media_id_list || [];

          if (mediaIds.length > 0) {
            hasDocument = true;
            mediaId = mediaIds[0];
          }
        } catch (error) {
          console.error("Error fetching media for cert:", cert._id, error);
        }

        return {
          id: cert._id,
          name: cert.name,
          category: cert.category,
          issuer: cert.issuer,
          date_earned: cert.date_earned,
          expiration_date: cert.date_expiry,
          does_not_expire: !cert.date_expiry,
          verified: cert.verified || false,
          has_document: hasDocument,
          media_id: mediaId,
          cert_id: cert.cert_number,
          document_name: cert.document_name
        };
      }));

      setCerts(sortCerts(transformedCerts));
    } catch (error) {
      console.error("Failed to load certifications:", error);
      setCerts([]);
    } finally {
      setLoading(false);
    }
  };

  const sortCerts = (certArray) => {
    const today = new Date();
    return certArray
      .map((c) => ({ ...c }))
      .sort((a, b) => {
        const aExp = a.expiration_date ? new Date(a.expiration_date) : null;
        const bExp = b.expiration_date ? new Date(b.expiration_date) : null;

        const aExpired = aExp && aExp < today;
        const bExpired = bExp && bExp < today;

        const aExpSoon = aExp && aExp - today <= 1000 * 60 * 60 * 24 * 90;
        const bExpSoon = bExp && bExp - today <= 1000 * 60 * 60 * 24 * 90;

        if (aExpired && !bExpired) return -1;
        if (!aExpired && bExpired) return 1;
        if (aExpSoon && !bExpSoon) return -1;
        if (!aExpSoon && bExpSoon) return 1;
        return 0;
      });
  };

  const addCert = async (formData) => {
    try {
      const certData = Object.fromEntries(formData.entries());
      const documentFile = formData.get('document');

      const backendData = {
        name: certData.name,
        issuer: certData.issuer,
        date_earned: certData.date_earned,
        date_expiry: certData.does_not_expire === 'true' ? null : certData.expiration_date,
        cert_number: certData.cert_number,
        category: certData.category,
        verified: certData.verified === 'true',
        document_name: documentFile && documentFile.size > 0 ? documentFile.name : null
      };

      // Create certification first
      const res = await CertificationsAPI.add(backendData);

      if (documentFile && documentFile.size > 0) {
        const certificationId = res.data.certification_id;
        await CertificationsAPI.uploadMedia(certificationId, documentFile);
      }

      await loadCertifications();
      setShowForm(false);
    } catch (error) {
      console.error("Failed to add certification:", error);
      alert(error.response?.data?.detail || "Failed to add certification. Please try again.");
    }
  };

  const submitEdit = async (formData) => {
    try {
      const certData = Object.fromEntries(formData.entries());
      const documentFile = formData.get('document');

      const backendData = {
        name: certData.name,
        issuer: certData.issuer,
        date_earned: certData.date_earned,
        date_expiry: certData.does_not_expire === 'true' ? null : certData.expiration_date,
        cert_number: certData.cert_number,
        category: certData.category,
        verified: certData.verified === 'true'
      };

      if (documentFile && documentFile.size > 0) {
        backendData.document_name = documentFile.name;
      }

      // Update certification
      await CertificationsAPI.update(editCert.id, backendData);

      if (documentFile && documentFile.size > 0) {
        // Check if certification already has media
        const idsRes = await CertificationsAPI.getMediaIds(editCert.id);
        const existingMediaIds = idsRes.data.media_id_list || [];

        if (existingMediaIds.length > 0) {
          const mediaId = existingMediaIds[0];
          await CertificationsAPI.updateMedia(mediaId, documentFile);
        } else {
          // Upload new media
          await CertificationsAPI.uploadMedia(editCert.id, documentFile);
        }
      }

      await loadCertifications();
      setEditCert(null);
      setShowForm(false);
    } catch (error) {
      console.error("Failed to update certification:", error);
      alert(error.response?.data?.detail || "Failed to update certification. Please try again.");
    }
  };

  const deleteCert = async (id) => {
    if (!window.confirm("Delete this certification?")) return;

    try {
      await CertificationsAPI.delete(id);
      setCerts(sortCerts(certs.filter((c) => c.id !== id)));
    } catch (error) {
      console.error("Failed to delete certification:", error);
      alert(error.response?.data?.detail || "Failed to delete certification. Please try again.");
    }
  };

  const filteredCerts = sortCerts(
    certs.filter((c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.issuer?.toLowerCase().includes(search.toLowerCase()) ||
      c.category?.toLowerCase().includes(search.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="dashboard-gradient min-vh-100 py-4">
        <Container>
          <h1 className="text-center text-white fw-bold mb-5 display-4">
            Certifications
          </h1>
          <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: '200px' }}>
            <Spinner animation="border" variant="light" className="mb-3" />
            <p className="text-white fs-5">Loading Certifications data...</p>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #005e9e, #00c28a)",
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "40px 20px",
        boxSizing: "border-box",
        }}
    >

    <div style={{ width: "100%", maxWidth: "1200px", }}>

    <div
      style={{
        display: "flex",
        flexDirection: "column", // stacks title & button vertically on small screens
        alignItems: "center",
        flexWrap: "wrap",
        textAlign: "center",
        gap: "15px", // adds clean spacing
        marginBottom: "30px",
      }}
    >
      
    {/*Wrap text */}
    <div style={{ display: "inline-block" }}>
      <h1
        style={{
          margin: 0,
          color: "#ffffff",
          fontWeight: 700,
          fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
          fontFamily: '"Playfair Display", serif',
          WebkitTextFillColor: "#ffffff", // ensures true white text
        }}
      >
        📜 Certifications
      </h1>

      {/* underline centered under text */}
      <div
        style={{
          width: "120px", // you can tweak this 
          height: "4px",
          margin: "6px auto 0",
          borderRadius: "2px",
          background: "linear-gradient(90deg, #00c28a, #005e9e)", // green → blue
        }}
      />
    </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditCert(null);
          }}
          style={{
            padding: "12px 24px",
            background: "#4f8ef7",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "14px"
          }}
        >
          {showForm ? "← Cancel" : "+ Add Certification"}
        </button>
      </div>

      {showForm && (
        <CertificationForm
          addCert={addCert}
          editCert={editCert ? { ...editCert, submit: submitEdit } : null}
          cancelEdit={() => {
            setEditCert(null);
            setShowForm(false);
          }}
        />
      )}

      {!showForm && (
        <>
          <div style={{ marginBottom: "20px" }}>
            <input
              placeholder="🔍 Search certifications by name, issuer, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "14px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                boxSizing: "border-box"
              }}
            />
          </div>

          {filteredCerts.length === 0 ? (
            <div style={{
              background: "#f9f9f9",
              padding: "40px",
              borderRadius: "8px",
              textAlign: "center",
              color: "#999"
            }}>
              <p style={{ fontSize: "16px" }}>
                {search ? "No certifications match your search" : "No certifications yet. Add your first one!"}
              </p>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
              gap: "20px",
              paddingTop: "20px"
            }}>
              {filteredCerts.map((c) => (
                <CertificationCard
                  key={c.id}
                  cert={c}
                  onDelete={deleteCert}
                  onEdit={(cert) => {
                    setEditCert(cert);
                    setShowForm(true);
                  }}
                  onMediaDelete={loadCertifications}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
    </div>
  );
}