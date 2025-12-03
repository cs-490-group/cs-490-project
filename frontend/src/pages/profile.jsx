import { useEffect, useRef, useState } from "react";
import ProfilesAPI from "../api/profiles";
import DeleteAccount from "../components/DeleteAccount";
import "../styles/profile.css";

export default function Profile() {
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [form, setForm] = useState({
        username: "",
        email: "",
        full_name: "",
        phone_number: "",
        address: "",
        title: "",
        biography: "",
        industry: "",
        experience_level: "",
    });
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [msg, setMsg] = useState("");

    const fileRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const meRes = await ProfilesAPI.get();
                const me = meRes.data;
                setForm({
                    username: me.username ?? "",
                    email: me.email ?? "",
                    full_name: me.full_name ?? "",
                    phone_number: me.phone_number ?? "",
                    address: me.address ?? "",
                    title: me.title ?? "",
                    biography: me.biography ?? "",
                    industry: me.industry ?? "",
                    experience_level: me.experience_level ?? "",
                });

                // Load avatar
                try {
                    const res = await ProfilesAPI.getAvatar();
                    const blob = res.data;
                    const url = URL.createObjectURL(blob);
                    if (url) {
                        setAvatarUrl(url);
                    }
                } catch (avatarError) {
                    console.log("No avatar found, using default");
                    setAvatarUrl("/default.png");
                }
            } catch (e) {
                // setErr("Failed to load profile: " + (e.message || "Unknown error"));
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // Cleanup blob URLs on unmount
    useEffect(() => {
        return () => {
            if (avatarUrl?.startsWith("blob:")) {
                URL.revokeObjectURL(avatarUrl);
            }
        };
    }, [avatarUrl]);

    const resizeImage = (file, maxWidth = 1280, maxHeight = 720) => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // Calculate new dimensions to fit within 720p
                let { width, height } = img;
                
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width *= ratio;
                    height *= ratio;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Draw resized image
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(resolve, 'image/jpeg', 0.9);
            };
            
            img.src = URL.createObjectURL(file);
        });
    };

    const onChange = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
    };

    const onPick = async (e) => {
        const f = e.target.files?.[0];
        
        if (f) {
            // Resize image to max 720p before setting
            try {
                const resizedFile = await resizeImage(f);
                setSelectedFile(resizedFile);
                
                // Create local preview using FileReader
                const reader = new FileReader();
                reader.onload = (event) => {
                    setPreviewUrl(event.target.result);
                };
                reader.readAsDataURL(resizedFile);
            } catch (error) {
                console.error("Image resize failed:", error);
                // Fallback to original file
                setSelectedFile(f);
                const reader = new FileReader();
                reader.onload = (event) => {
                    setPreviewUrl(event.target.result);
                };
                reader.readAsDataURL(f);
            }
        } else {
            setSelectedFile(null);
            setPreviewUrl(null);
        }
    };

    const onSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErr("");
        setMsg("");

        try {
            const data = {
                username: form.username || null,
                email: form.email || null,
                full_name: form.full_name || null,
                phone_number: form.phone_number || "",
                address: form.address || "",
                title: form.title || "",
                biography: form.biography || "",
                industry: form.industry || "",
                experience_level: form.experience_level || null,
            };
            await ProfilesAPI.update(data);

            // Update username in localStorage
            if (form.username) {
                localStorage.setItem("username", form.username);
            }

            if (selectedFile) {
                await ProfilesAPI.uploadAvatar(selectedFile);
            }

            setMsg("Profile updated successfully!");

            // If user uploaded a new avatar, fetch it from backend
            if (selectedFile) {
                const res = await ProfilesAPI.getAvatar();
                const blob = res.data;
                const newAvatarUrl = URL.createObjectURL(blob);
                if (newAvatarUrl) {
                    // Revoke old blob URL if it exists
                    if (avatarUrl?.startsWith("blob:")) {
                        URL.revokeObjectURL(avatarUrl);
                    }
                    setAvatarUrl(newAvatarUrl);
                }
            }

            // Dispatch custom event to notify Nav component
            window.dispatchEvent(new Event("profileUpdated"));

            // Clear file selection UI after brief delay so save completes visually
            setTimeout(() => {
                setSelectedFile(null);
                setPreviewUrl(null);
                if (fileRef.current) fileRef.current.value = "";
            }, 500);
        } catch (e) {
            setErr(e.message || "Failed to save profile.");
        } finally {
            setSaving(false);
        }
    };

    if (loading)
        return (
            <div className="profile-loading">
                <div className="spinner"></div>
                <p>Loading your profile...</p>
            </div>
        );


    return (
        <div className="simple-profile">
            <div className="profile-card">
                <h1 className="profile-title">My Profile</h1>


                {msg && (
                    <div className="profile-message">
                        <i className="fas fa-check-circle" style={{ marginRight: 6 }}></i>
                        {msg}
                    </div>
                )}
                {err && (
                    <div className="profile-message error">
                        <i className="fas fa-exclamation-circle" style={{ marginRight: 6 }}></i>
                        {err}
                    </div>
                )}


                {/* Profile Picture */}
                <div className="profile-photo">
                    <img
                        src={previewUrl || avatarUrl || "/default.png"}
                        alt="Profile"
                        className="avatar"
                    />
                    <button
                        type="button"
                        className="upload-btn"
                        onClick={() => fileRef.current?.click()}
                    >
                        <i className="fas fa-upload"></i> Upload Photo
                    </button>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        onChange={onPick}
                        hidden
                    />
                    {selectedFile && (
                        <div style={{ fontSize: 13, marginTop: 6, color: "#555" }}>
                            Selected: <strong>{selectedFile.name}</strong>
                        </div>
                    )}
                </div>


                {/* Profile Form */}
                <form className="profile-form" onSubmit={onSave}>
                    <label>
                        <div className="label-title">
                            <span>👤 Username</span>
                        </div>
                        <input
                            name="username"
                            value={form.username}
                            onChange={onChange}
                            placeholder="e.g. JohnSmith1"
                        />
                    </label>


                    <label>
                        <div className="label-title">
                            <span>📧 Email</span>
                        </div>
                        <input
                            name="email"
                            value={form.email}
                            onChange={onChange}
                            placeholder="e.g. JohnSmith@gmail.com"
                        />
                    </label>


                    <label>
                        <div className="label-title">
                            <span>🪪 Full Name</span>
                        </div>
                        <input
                            name="full_name"
                            value={form.full_name}
                            onChange={onChange}
                            placeholder="e.g. John Smith"
                        />
                    </label>


                    <label>
                        <div className="label-title">
                            <span>📞 Phone</span>
                        </div>
                        <input
                            name="phone_number"
                            value={form.phone_number}
                            onChange={onChange}
                            placeholder="e.g. (555) 123-4567"
                        />
                    </label>


                    <label>
                        <div className="label-title">
                            <span>📍 Address</span>
                        </div>
                        <input
                            name="address"
                            value={form.address}
                            onChange={onChange}
                            placeholder="City, State"
                        />
                    </label>


                    <label>
                        <div className="label-title">
                            <span>💼 Headline / Title</span>
                        </div>
                        <input
                            name="title"
                            value={form.title}
                            onChange={onChange}
                            placeholder="e.g. Project Manager"
                        />
                    </label>


                    <label>
                        <div className="label-title">
                            <span>🏢 Industry</span>
                        </div>
                        <input
                            name="industry"
                            value={form.industry}
                            onChange={onChange}
                            placeholder="e.g. Technology"
                        />
                    </label>


                    <label>
                        <div className="label-title">
                            <span>📈 Experience Level</span>
                        </div>
                        <select
                            name="experience_level"
                            value={form.experience_level}
                            onChange={onChange}
                        >
                            <option value="">(select)</option>
                            <option>Intern</option>
                            <option>Junior</option>
                            <option>Mid</option>
                            <option>Senior</option>
                        </select>
                    </label>


                    <label className="full-width">
                        <div className="label-title">
                            <span>✍️ Bio</span>
                        </div>
                        <textarea
                            name="biography"
                            rows={4}
                            value={form.biography}
                            onChange={onChange}
                            placeholder="Write a short bio about yourself..."
                        />
                    </label>


                    <button type="submit" className="save-btn" disabled={saving}>
                        <i className="fas fa-save"></i>
                        {saving ? "Saving…" : "Save Profile"}
                    </button>
                </form>


                <div className="delete-account">
                    <p>
                        Want To Delete Your Account?{" "}
                    </p>
                    <DeleteAccount />
                </div>
            </div>
        </div>
    );

}

function Row({ children }) {
    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {children}
        </div>
    );
}

function Field({ label, children }) {
    return (
        <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 600 }}>{label}</span>
            <div>{children}</div>
            <style>{`
        input, select, textarea {
          padding: 8px 10px;
          border: 1px solid #d0d0d0;
          border-radius: 8px;
          font: inherit;
        }
        textarea { resize: vertical; }
      `}</style>
        </label>
    );
}