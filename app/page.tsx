"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import RichTextDisplay from "@/app/components/rich-text-display";
import ProjectRegions from "./components/project-regions";

type Project = {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  description: string | null;
  image_url: string | null;
  category_id: string | null;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  project_count: number;
};

type Tour = {
  id: string;
  title: string;
  destination: string;
  price: string;
  status: string;
  description: string | null;
  image_url: string | null;
};

type Settings = {
  brand_name: string;
  tagline: string;
  phone: string;
  zalo_url: string;
  facebook_url: string;
};

export default function Home() {
  const s = supabaseBrowser();

  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);

  const [settings, setSettings] = useState<Settings>({
    brand_name: "Công ty TNHH Bất động sản & Du lịch ATP",
    tagline: "Bất động sản & Du lịch",
    phone: "038 579 5379",
    zalo_url: "https://zalo.me/0385795379",
    facebook_url: "https://facebook.com/",
  });

  const [lead, setLead] = useState({
    name: "",
    phone: "",
    email: "",
    note: "",
  });

  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      s.from("site_settings").select("*").eq("id", 1).single(),

      s
        .from("projects")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false }),

      s
        .from("project_categories")
        .select(
          "id,name,slug,description,image_url,projects!projects_category_id_fkey(id,status)",
        )
        .eq("status", "published")
        .order("created_at", { ascending: false }),

      s
        .from("tours")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false }),
    ]).then(([settingsRes, p, c, t]) => {
      if (settingsRes.data) {
        setSettings((current) => ({
          ...current,
          ...settingsRes.data,
        }));
      }

      setProjects(p.data || []);

      setCategories(
        (c.data || []).map((x: any) => ({
          ...x,
          project_count: (x.projects || []).filter(
            (project: any) => project.status === "published",
          ).length,
        })),
      );

      setTours(t.data || []);
    });
  }, [s]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    setBusy(true);
    setError("");
    setSent(false);

    const { error: insertError } = await s.from("leads").insert(lead);

    if (insertError) {
      setError(insertError.message);
    } else {
      setLead({
        name: "",
        phone: "",
        email: "",
        note: "",
      });
      setSent(true);
    }

    setBusy(false);
  }

  const phoneHref = `tel:${settings.phone.replace(/\s/g, "")}`;

  return (
    <main>
      <ProjectRegions categories={categories} />

      <section id="du-lich" className="section section-alt">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="eyebrow">DU LỊCH</div>
              <h2>Tour & hành trình</h2>
            </div>

            <span className="count">{tours.length} tour</span>
          </div>

          <div className="grid-auto">
            {tours.map((tour) => (
              <article
                key={tour.id}
                className="card"
                role="button"
                tabIndex={0}
                aria-label={`Xem chi tiết ${tour.title}`}
                onClick={() => setSelectedTour(tour)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedTour(tour);
                  }
                }}
                style={{
                  overflow: "hidden",
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  cursor: "pointer",
                }}
              >
                {tour.image_url ? (
                  <img
                    src={tour.image_url}
                    alt={tour.title}
                    style={{
                      display: "block",
                      width: "100%",
                      aspectRatio: "4 / 3",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    className="placeholder"
                    style={{
                      width: "100%",
                      aspectRatio: "4 / 3",
                    }}
                  >
                    DU LỊCH
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    minWidth: 0,
                    padding: "18px 18px 20px",
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      minHeight: "84px",
                      fontSize: "21px",
                      lineHeight: 1.35,
                      display: "flex",
                      alignItems: "flex-start",
                    }}
                  >
                    {tour.title}
                  </h3>

                  <div
                    style={{
                      marginTop: "auto",
                      paddingTop: "16px",
                      borderTop: "1px solid #edf1ee",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                    }}
                  >
                    <a
                      className="btn btn-primary"
                      href={phoneHref}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        flexShrink: 0,
                        whiteSpace: "nowrap",
                        textDecoration: "none",
                      }}
                    >
                      <i className="bi bi-telephone-fill" /> Liên hệ
                    </a>

                    <span
                      style={{
                        flexShrink: 0,
                        whiteSpace: "nowrap",
                        fontSize: "13px",
                        fontWeight: 800,
                        color: "var(--brand)",
                        textAlign: "right",
                      }}
                    >
                      Đang nhận
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {tours.length === 0 && (
            <div className="empty">
              Chưa có tour đang được cập nhật.
            </div>
          )}
        </div>
      </section>

      {selectedTour && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Chi tiết ${selectedTour.title}`}
          onClick={() => setSelectedTour(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0, 0, 0, 0.58)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "760px",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#fff",
              borderRadius: "22px",
              boxShadow: "0 25px 70px rgba(0,0,0,0.25)",
            }}
          >
            <button
              type="button"
              aria-label="Đóng"
              onClick={() => setSelectedTour(null)}
              style={{
                position: "absolute",
                top: "14px",
                right: "14px",
                zIndex: 2,
                width: "38px",
                height: "38px",
                border: 0,
                borderRadius: "50%",
                background: "#ffffffdd",
                color: "#13251c",
                fontSize: "24px",
                lineHeight: 1,
                cursor: "pointer",
                boxShadow: "0 3px 14px rgba(0,0,0,0.16)",
              }}
            >
              ×
            </button>

            {selectedTour.image_url ? (
              <img
                src={selectedTour.image_url}
                alt={selectedTour.title}
                style={{
                  width: "100%",
                  aspectRatio: "16 / 9",
                  objectFit: "cover",
                  display: "block",
                  borderRadius: "22px 22px 0 0",
                }}
              />
            ) : (
              <div
                className="placeholder"
                style={{
                  width: "100%",
                  aspectRatio: "16 / 9",
                  borderRadius: "22px 22px 0 0",
                }}
              >
                DU LỊCH
              </div>
            )}

            <div style={{ padding: "28px" }}>
              <div className="eyebrow">CHI TIẾT TOUR</div>

              <h2
                style={{
                  margin: "8px 0 20px",
                  fontSize: "32px",
                  lineHeight: 1.2,
                }}
              >
                {selectedTour.title}
              </h2>

              <div
                style={{
                  display: "grid",
                  gap: "12px",
                  marginBottom: "22px",
                }}
              >
                <div>
                  <strong>Điểm đến:</strong>{" "}
                  {selectedTour.destination || "Đang cập nhật"}
                </div>

                <div>
                  <strong>Giá:</strong>{" "}
                  {selectedTour.price || "Liên hệ để biết giá"}
                </div>
              </div>

              <div
                style={{
                  color: "var(--muted)",
                  lineHeight: 1.75,
                  marginBottom: "24px",
                }}
              >
                {selectedTour.description ? (
                  <RichTextDisplay html={selectedTour.description} />
                ) : (
                  <p>Lịch trình đang được cập nhật.</p>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <a
                  className="btn btn-primary"
                  href={phoneHref}
                  onClick={() => setSelectedTour(null)}
                >
                  <i className="bi bi-telephone-fill" /> Gọi tư vấn
                </a>

                <a
                  className="btn btn-zalo"
                  href={settings.zalo_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <i className="bi bi-chat-dots-fill" /> Zalo
                </a>

                <button
                  type="button"
                  className="btn"
                  onClick={() => setSelectedTour(null)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <section id="tu-van" className="container section">
        <div className="contact-card">
          <div>
            <div className="eyebrow">TƯ VẤN NHANH</div>

            <h2>Để lại thông tin, tôi sẽ liên hệ với bạn.</h2>

            <p>
              Chọn dự án hoặc sản phẩm bạn quan tâm, mình sẽ tư vấn trực tiếp.
            </p>

            <div className="actions">
              <a className="btn btn-dark" href={phoneHref}>
                <i className="bi bi-whatsapp" />
                <i>⠀</i> {settings.phone}
              </a>

              <a
                className="btn btn-zalo"
                href={settings.zalo_url}
                target="_blank"
                rel="noreferrer"
              >
                <i className="bi bi-telephone-fill" />
                <i>⠀</i> Zalo
              </a>
            </div>
          </div>

          <form onSubmit={submit} className="lead-form">
            <input
              className="input"
              placeholder="Họ và tên *"
              value={lead.name}
              onChange={(e) =>
                setLead({ ...lead, name: e.target.value })
              }
              required
            />

            <input
              className="input"
              placeholder="Số điện thoại *"
              value={lead.phone}
              onChange={(e) =>
                setLead({ ...lead, phone: e.target.value })
              }
              required
            />

            <input
              className="input"
              type="email"
              placeholder="Email"
              value={lead.email}
              onChange={(e) =>
                setLead({ ...lead, email: e.target.value })
              }
            />

            <textarea
              className="input"
              placeholder="Bạn quan tâm dự án / tour nào?"
              value={lead.note}
              onChange={(e) =>
                setLead({ ...lead, note: e.target.value })
              }
            />

            <button className="btn btn-primary" disabled={busy}>
              {busy ? "Đang gửi..." : "Gửi yêu cầu tư vấn"}
            </button>

            {sent && (
              <div className="success">
                Đã gửi thông tin. Cảm ơn bạn!
              </div>
            )}

            {error && <div className="error">{error}</div>}
          </form>
        </div>
      </section>

      <section className="social-strip">
        <div className="container social-inner">
          <div>
            <b>{settings.brand_name}</b>
            <span>{settings.tagline}</span>
          </div>

          <div className="social-links">
            <a
              href={settings.zalo_url}
              target="_blank"
              rel="noreferrer"
            >
              <i className="bi bi-telephone-fill" />
              <i>⠀</i> Zalo
            </a>

            <a
              href={settings.facebook_url}
              target="_blank"
              rel="noreferrer"
            >
              <i className="bi bi-facebook" /> Facebook
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
