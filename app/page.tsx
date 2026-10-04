"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import RichTextDisplay from "@/app/components/rich-text-display";
import RichTextPreview from "@/app/components/rich-text-preview";
import ProjectRegions from './components/project-regions'
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
        .select("id,name,slug,description,image_url,projects!projects_category_id_fkey(id,status)")
        .eq("status", "published")
        .order("created_at", { ascending: false }),
      s
        .from("tours")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false }),
    ]).then(([settingsRes, p, c, t]) => {
      if (settingsRes.data) setSettings({ ...settings, ...settingsRes.data });
      setProjects(p.data || []);
      setCategories((c.data || []).map((x: any) => ({
        ...x,
        project_count: (x.projects || []).filter((project: any) => project.status === "published").length,
      })));
      setTours(t.data || []);
    });
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSent(false);
    const { error } = await s.from("leads").insert(lead);
    if (error) setError(error.message);
    else {
      setLead({ name: "", phone: "", email: "", note: "" });
      setSent(true);
    }
    setBusy(false);
  }
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
            {tours.map((t) => (
              <article className="card product" key={t.id}>
                {t.image_url ? (
                  <img src={t.image_url} alt={t.title} />
                ) : (
                  <div className="placeholder">DU LỊCH</div>
                )}
                <div className="product-body">
                  <small>{t.destination}</small>
                  <h3>{t.title}</h3>
                  <RichTextPreview
                    html={t.description || "Lịch trình đang được cập nhật."}
                  />
                  <div className="product-foot">
                    <b> <a href="https://zalo.me/0385795379">Liên hệ tư vấn</a></b>
                    <span>Đang nhận khách</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section id="tu-van" className="container section">
        <div className="contact-card">
          <div>
            <div className="eyebrow">TƯ VẤN NHANH</div>
            <h2>Để lại thông tin, tôi sẽ liên hệ với bạn.</h2>
            <p>
              Chọn dự án hoặc sản phẩm bạn quan tâm, mình sẽ tư vấn trực tiếp.
            </p>
            <div className="actions">
              <a
                className="btn btn-dark"
                href={`tel:${settings.phone.replace(/\s/g, "")}`}
              >
                <i className="bi bi-telephone-fill" /> {settings.phone}
              </a>
              <a
                className="btn btn-zalo"
                href={settings.zalo_url}
                target="_blank"
                rel="noreferrer"
              >
                <b>Z</b> Zalo
              </a>
            </div>
          </div>
          <form onSubmit={submit} className="lead-form">
            <input
              className="input"
              placeholder="Họ và tên *"
              value={lead.name}
              onChange={(e) => setLead({ ...lead, name: e.target.value })}
              required
            />
            <input
              className="input"
              placeholder="Số điện thoại *"
              value={lead.phone}
              onChange={(e) => setLead({ ...lead, phone: e.target.value })}
              required
            />
            <input
              className="input"
              type="email"
              placeholder="Email"
              value={lead.email}
              onChange={(e) => setLead({ ...lead, email: e.target.value })}
            />
            <textarea
              className="input"
              placeholder="Bạn quan tâm dự án / tour nào?"
              value={lead.note}
              onChange={(e) => setLead({ ...lead, note: e.target.value })}
            />
            <button className="btn btn-primary" disabled={busy}>
              {busy ? "Đang gửi..." : "Gửi yêu cầu tư vấn"}
            </button>
            {sent && (
              <div className="success">Đã gửi thông tin. Cảm ơn bạn!</div>
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
            <a href={settings.zalo_url} target="_blank" rel="noreferrer">
              <b>Z</b> Zalo
            </a>
            <a href={settings.facebook_url} target="_blank" rel="noreferrer">
              <i className="bi bi-facebook" /> Facebook
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
