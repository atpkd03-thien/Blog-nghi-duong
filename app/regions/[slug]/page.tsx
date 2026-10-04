import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import RichTextPreview from "@/app/components/rich-text-preview";

export default async function RegionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = await supabaseServer();
  const { data: category } = await s
    .from("project_categories")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  if (!category) notFound();

  const { data: projects } = await s
    .from("projects")
    .select("*")
    .eq("category_id", category.id)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  return (
    <main>
      <section className="py-5 bg-body-tertiary">
        <div className="container py-lg-4">
          <Link
            href="/#khu-vuc"
            className="text-decoration-none small fw-semibold"
          >
            <i className="bi bi-arrow-left me-2" />
            Tất cả khu vực
          </Link>
          <div className="mt-4 row align-items-end g-4">
            <div className="col-lg-8">
              <div className="eyebrow">KHU VỰC</div>
              <h1 className="display-4 fw-bold mt-2">{category.name}</h1>
              <p className="lead text-secondary mb-0">
                {category.description ||
                  `Các dự án bất động sản tại ${category.name}.`}
              </p>
            </div>
            <div className="col-lg-4 text-lg-end">
              <span className="badge rounded-pill text-bg-light border px-3 py-2">
                {projects?.length || 0} dự án
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <div>
            <div className="eyebrow">BẤT ĐỘNG SẢN</div>
            <h2>Dự án tại {category.name}</h2>
          </div>
        </div>
        {projects?.length ? (
          <div className="grid-auto">
            {projects.map((p) => (
              <Link
                href={`/projects/${p.slug}`}
                className="card product text-decoration-none"
                key={p.id}
              >
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} />
                ) : (
                  <div className="placeholder">DỰ ÁN</div>
                )}
                <div className="product-body">
                  <small>{p.location || "Đang cập nhật"}</small>
                  <h3>{p.name}</h3>
                  <RichTextPreview
                    html={p.description || "Xem thông tin chi tiết dự án."}
                  />
                  <div className="product-foot">
                    <b>Xem dự án</b>
                    <span>Đang mở</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty">Khu vực này chưa có dự án công khai.</div>
        )}
      </section>
    </main>
  );
}
