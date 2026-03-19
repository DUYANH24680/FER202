import React, { useState, useEffect } from "react";
import axios from "axios";
import { Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

function UserTerms() {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get("http://localhost:9999/settings/1")
            .then(res => setSettings(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const formatVND = (amount) =>
        new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

    if (loading) {
        return (
            <div className="text-center mt-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">Loading...</p>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            padding: "48px 16px"
        }}>
            <div style={{ maxWidth: "720px", width: "100%" }}>

                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "40px" }}>
                    <div style={{
                        width: "72px", height: "72px",
                        background: "linear-gradient(135deg, #ec5b13, #f97316)",
                        borderRadius: "20px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "36px",
                        margin: "0 auto 20px auto",
                        boxShadow: "0 8px 24px rgba(236,91,19,0.3)"
                    }}>
                        📚
                    </div>
                    <h1 style={{ fontSize: "32px", fontWeight: "800", color: "#1e293b", margin: "0 0 8px 0" }}>
                        Library Terms & Conditions
                    </h1>
                    <p style={{ color: "#64748b", fontSize: "15px", margin: 0 }}>
                        Please read the following rules carefully before using our library services.
                    </p>
                </div>

                {/* Card */}
                <div style={{
                    background: "white",
                    borderRadius: "20px",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                    overflow: "hidden"
                }}>
                    {/* Section: Borrowing Policy */}
                    <div style={{ padding: "32px 40px", borderBottom: "1px solid #f1f5f9" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                            <div style={{
                                width: "40px", height: "40px", background: "#eff6ff",
                                borderRadius: "10px", display: "flex", alignItems: "center",
                                justifyContent: "center", fontSize: "20px", flexShrink: 0
                            }}>📖</div>
                            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: "#1e293b" }}>
                                Article 1 — Borrowing Policy
                            </h2>
                        </div>
                        <div style={{ paddingLeft: "52px" }}>
                            <TermItem index="1.1">
                                Each user may borrow a maximum of <Strong>{settings?.maxBooksPerUser} books</Strong> at the same time.
                            </TermItem>
                            <TermItem index="1.2">
                                The maximum borrowing period is <Strong>{settings?.maxBorrowDays} days</Strong> per borrow request.
                            </TermItem>
                            <TermItem index="1.3">
                                The borrowing fee is <Strong>{formatVND(settings?.pricePerBook)} per book</Strong>, charged at the time of approval.
                            </TermItem>
                            <TermItem index="1.4">
                                Users must ensure books are returned in the same condition as when borrowed.
                            </TermItem>
                        </div>
                    </div>

                    {/* Section: Late Returns */}
                    <div style={{ padding: "32px 40px", borderBottom: "1px solid #f1f5f9", background: "#fffbeb" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                            <div style={{
                                width: "40px", height: "40px", background: "#fef3c7",
                                borderRadius: "10px", display: "flex", alignItems: "center",
                                justifyContent: "center", fontSize: "20px", flexShrink: 0
                            }}>⚠️</div>
                            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: "#1e293b" }}>
                                Article 2 — Late Return Fines
                            </h2>
                        </div>
                        <div style={{ paddingLeft: "52px" }}>
                            <TermItem index="2.1">
                                If a book is returned after the due date, a fine of <Strong>{formatVND(settings?.finePerDay)} per day</Strong> will be charged.
                            </TermItem>
                            <TermItem index="2.2">
                                The fine is calculated from the day after the due date until the actual return date.
                            </TermItem>
                            <TermItem index="2.3">
                                Outstanding fines must be paid before the user can submit new borrow requests.
                            </TermItem>
                        </div>
                    </div>

                    {/* Section: Damage & Loss */}
                    <div style={{ padding: "32px 40px", borderBottom: "1px solid #f1f5f9" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                            <div style={{
                                width: "40px", height: "40px", background: "#fef2f2",
                                borderRadius: "10px", display: "flex", alignItems: "center",
                                justifyContent: "center", fontSize: "20px", flexShrink: 0
                            }}>📕</div>
                            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: "#1e293b" }}>
                                Article 3 — Damage & Loss Compensation
                            </h2>
                        </div>
                        <div style={{ paddingLeft: "52px" }}>
                            <TermItem index="3.1">
                                If a book is damaged, the user must pay a compensation fee of <Strong>{formatVND(settings?.damagedbook)} per book</Strong>.
                            </TermItem>
                            <TermItem index="3.2">
                                If a book is lost, the user must pay a compensation fee of <Strong>{formatVND(settings?.lostbook)} per book</Strong>.
                            </TermItem>
                            <TermItem index="3.3">
                                Damage and loss fees are in addition to any applicable late return fines.
                            </TermItem>
                        </div>
                    </div>

                    {/* Section: User Responsibilities */}
                    <div style={{ padding: "32px 40px", borderBottom: "1px solid #f1f5f9" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                            <div style={{
                                width: "40px", height: "40px", background: "#f0fdf4",
                                borderRadius: "10px", display: "flex", alignItems: "center",
                                justifyContent: "center", fontSize: "20px", flexShrink: 0
                            }}>👤</div>
                            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: "#1e293b" }}>
                                Article 4 — User Responsibilities
                            </h2>
                        </div>
                        <div style={{ paddingLeft: "52px" }}>
                            <TermItem index="4.1">
                                Users are responsible for keeping their account credentials secure and confidential.
                            </TermItem>
                            <TermItem index="4.2">
                                Users must not lend borrowed books to others or use them for commercial purposes.
                            </TermItem>
                            <TermItem index="4.3">
                                Any misuse of the library system may result in account suspension or permanent ban.
                            </TermItem>
                            <TermItem index="4.4">
                                Users agree to comply with all current and future rules set by the library administration.
                            </TermItem>
                        </div>
                    </div>

                    {/* Footer Note */}
                    <div style={{ padding: "24px 40px", background: "#f8fafc" }}>
                        <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8", lineHeight: "1.6" }}>
                            These terms are subject to change at any time by the library administration.
                            Continued use of the library service constitutes acceptance of the current terms.
                            Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}.
                        </p>
                    </div>
                </div>

                {/* Accept Button */}
                <div style={{ textAlign: "center", marginTop: "32px" }}>
                    <button
                        onClick={() => navigate("/user/books")}
                        style={{
                            background: "linear-gradient(135deg, #ec5b13, #f97316)",
                            color: "white",
                            border: "none",
                            borderRadius: "14px",
                            padding: "16px 48px",
                            fontSize: "16px",
                            fontWeight: "700",
                            cursor: "pointer",
                            boxShadow: "0 8px 24px rgba(236,91,19,0.3)",
                            transition: "all 0.2s"
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                        onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                    >
                        I Understand & Accept →
                    </button>
                    <p style={{ marginTop: "12px", fontSize: "13px", color: "#94a3b8" }}>
                        By continuing, you agree to abide by all library rules listed above.
                    </p>
                </div>

            </div>
        </div>
    );
}

function TermItem({ index, children }) {
    return (
        <div style={{ display: "flex", gap: "12px", marginBottom: "14px" }}>
            <span style={{
                flexShrink: 0,
                fontSize: "12px",
                fontWeight: "700",
                color: "#ec5b13",
                background: "#fff7ed",
                border: "1px solid #fed7aa",
                borderRadius: "6px",
                padding: "2px 8px",
                height: "fit-content",
                marginTop: "2px"
            }}>
                {index}
            </span>
            <p style={{ margin: 0, fontSize: "15px", color: "#475569", lineHeight: "1.7" }}>
                {children}
            </p>
        </div>
    );
}

function Strong({ children }) {
    return (
        <strong style={{ color: "#1e293b", fontWeight: "700" }}>{children}</strong>
    );
}

export default UserTerms;
