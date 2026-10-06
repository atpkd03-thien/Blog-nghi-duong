"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import RichTextEditor from "@/app/components/rich-text-editor";
type Category = { id: string; name: string };
type Project = {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  description: string | null;
  image_url: string | null;
  status: string;
  category_id: string | null;
};
const empty = {
  name: "",
  slug: "",
  location: "",
  description: "",
  image_url: "",
  status: "draft",
  category_id: "",
};
export default function Projects() {
  const s = supabaseBrowser();
  const [items, setItems] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function load() {
    const categoryFilter =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("category")
        : null;
    let q = s
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    if (categoryFilter) q = q.eq("category_id", categoryFilter);
    const { data } = await q;
    setItems(data || []);
    const { data: cats } = await s
      .from("project_categories")
      .select("id,name")
      .order("name");
    setCategories(cats || []);
  }
  useEffect(() => {
    load();
  }, []);
  function edit(x: Project) {
    setEditing(x.id);
    setForm({
      name: x.name,
      slug: x.slug,
      location: x.location || "",
      description: x.description || "",
      image_url: x.image_url || "",
      status: x.status,
      category_id: x.category_id || "",
    });
    setFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function reset() {
    setEditing(null);
    setForm(empty);
    setFile(null);
    setMessage("");
  }
  async function upload() {
    if (!file) return form.image_url;
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `projects/${crypto.randomUUID()}.${ext}`;
    const { error } = await s.storage
      .from("media")
      .upload(path, file, { contentType: file.type });
    if (error) throw error;
    return s.storage.from("media").getPublicUrl(path).data.publicUrl;
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const image_url = await upload();
      const payload = {
        ...form,
        image_url,
        slug: form.slug.trim().toLowerCase().replace(/\s+/g, "-"),
      };
      const r = editing
        ? await s.from("projects").update(payload).eq("id", editing)
        : await s.from("projects").insert(payload);
      if (r.error) throw r.error;
      setMessage(editing ? "Đã cập nhật dự án." : "Đã tạo dự án.");
      reset();
      load();
    } catch (e: any) {
      setMessage(e?.message || "Có lỗi.");
    } finally {
      setBusy(false);
    }
  }
  async function remove(id: string) {
    if (
      !confirm("Xóa dự án? BĐS thuộc dự án sẽ được giữ lại nhưng bỏ liên kết.")
    )
      return;
    const { error } = await s.from("projects").delete().eq("id", id);
    if (error) setMessage(error.message);
    else load();
  }
  return (
    <main className="container section">
      <div className="admin-top">
        <div>
          <div className="eyebrow">PROJECTS</div>
          <h1>Quản lý dự án</h1>
          <p>Mỗi dự án có nhiều bất động sản bên trong.</p>
        </div>
        <div className="actions-row">
          <a className="btn" href="/admin/categories">
            Danh mục
          </a>
          <a className="btn" href="/admin">
            ← Dashboard
          </a>
        </div>
      </div>
      <form className="card form-grid" onSubmit={save}>
        <input
          className="input"
          placeholder="Tên dự án *"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          className="input"
          placeholder="Slug, ví dụ: eco-town-binh-duong"
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
          required
        />
        <input
          className="input"
          placeholder="Vị trí"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
        />
        <select
          className="input"
          value={form.category_id}
          onChange={(e) => setForm({ ...form, category_id: e.target.value })}
        >
          <option value="">-- Chưa gắn danh mục --</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className="input"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          <option value="draft">Nháp</option>
          <option value="published">Công khai</option>
          <option value="archived">Lưu trữ</option>
        </select>
        <div className="full">
          <label className="editor-label">Mô tả dự án</label>
          <RichTextEditor
            key={editing || "new"}
            value={form.description}
            onChange={(description) => setForm({ ...form, description })}
            placeholder="Viết mô tả dự án..."
          />
        </div>
        <input
          className="input"
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        {form.image_url && (
          <img className="preview-img" src={form.image_url} alt="Ảnh dự án" />
        )}
        <div className="full actions-row">
          <button className="btn btn-primary" disabled={busy}>
            {busy ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Tạo dự án"}
          </button>
          {editing && (
            <button type="button" className="btn" onClick={reset}>
              Hủy
            </button>
          )}
        </div>
        {message && <div className="full success">{message}</div>}
      </form>
      <div className="grid-auto">
        {items.map((x) => (
          <article className="card admin-project" key={x.id}>
            {x.image_url ? (
              <img src={x.image_url} alt={x.name} />
            ) : (
              <div className="placeholder">DỰ ÁN</div>
            )}
            <div>
              <div className="eyebrow">
                {x.status}{" "}
                {x.category_id &&
                  `• ${categories.find((c) => c.id === x.category_id)?.name || ""}`}
              </div>
              <h3>{x.name}</h3>
              <p>{x.location || "Chưa có vị trí"}</p>
              <div className="actions-row">
                <a
                  className="btn btn-primary"
                  href={`/admin/projects/${x.id}/content`}
                >
                  Quản lý Landing
                </a>
                <a className="btn" href={`/admin/properties?project=${x.id}`}>
                  BĐS trong dự án
                </a>
                <button className="btn" onClick={() => edit(x)}>
                  Sửa
                </button>
                <button className="btn" onClick={() => remove(x.id)}>
                  Xóa
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
