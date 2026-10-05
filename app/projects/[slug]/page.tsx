"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";
import RichTextDisplay from "@/app/components/rich-text-display";
import RichTextPreview from "@/app/components/rich-text-preview";
import PropertyGallery from "@/app/components/property-gallery";
import ProjectOverviewSlider from "@/app/components/project-overview-slider";

type Project = {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  description: string | null;
  image_url: string | null;
  potential_description: string | null;
};
type Settings = { phone: string; zalo_url: string; facebook_url: string };
type Property = {
  id: string;
  title: string;
  location: string;
  price: string;
  description: string | null;
  image_url: string | null;
  status: string;
};
type ImageItem = {
  id: string;
  property_id: string;
  image_url: string;
  sort_order: number;
};
type ProjectImage = {
  id: string;
  project_id: string;
  image_url: string;
  sort_order: number;
};
type Place = {
  id: string;
  project_id: string;
  section: "amenity" | "connection" | "travel";
  name: string;
  category: string;
  travel_minutes: number | null;
  distance_km: number | null;
  note: string | null;
  image_url: string | null;
  sort_order: number;
};
type Tour = {
  id: string;
  title: string;
  destination: string;
  price: string;
  description: string | null;
  image_url: string | null;
  status: string;
};

function PlaceCard({ item }: { item: Place }) {
  return (
    <article className="project-place-card">
      {item.image_url ? (
        <img
          src={item.image_url}
          alt={item.name}
          className="project-place-image"
        />
      ) : (
        <div className="project-place-image project-place-placeholder">📍</div>
      )}
      <div className="project-place-body">
        <div className="project-place-category">
          {item.category || "ĐỊA ĐIỂM"}
        </div>
        <h3>{item.name}</h3>
        <div className="project-place-meta">
          {item.travel_minutes != null && (
            <span>🚗 {item.travel_minutes} phút</span>
          )}
          {item.distance_km != null && <span>📍 {item.distance_km} km</span>}
        </div>
        {item.note && <p>{item.note}</p>}
      </div>
    </article>
  );
}

function TourCard({ item }: { item: Tour }) {
  return (
    <article className="project-tour-card">
      {item.image_url ? (
        <img src={item.image_url} alt={item.title} />
      ) : (
        <div className="project-tour-placeholder">DU LỊCH</div>
      )}
      <div className="project-tour-body">
        <span className="project-place-category">TRẢI NGHIỆM</span>
        <h3>{item.title}</h3>
        <p className="project-tour-destination">📍 {item.destination}</p>
        {item.description && <RichTextPreview html={item.description} />}
        <div className="project-tour-foot">
         <a href="https://zalo.me/0385795379"></a> <strong >Liên hệ tư vấn</strong>
        </div>
      </div>
    </article>
  );
}

export default function ProjectPage() {
  const { slug } = useParams<{ slug: string }>();
  const s = supabaseBrowser();
  const [project, setProject] = useState<Project | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [projectImages, setProjectImages] = useState<ProjectImage[]>([]);
  const [images, setImages] = useState<Record<string, ImageItem[]>>({});
  const [places, setPlaces] = useState<Place[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [settings, setSettings] = useState<Settings>({
    phone: "038 579 5379",
    zalo_url: "https://zalo.me/0385795379",
    facebook_url: "https://facebook.com/",
  });
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    async function load() {
      try {
        const [{ data: settingsData }, { data: projectData }] =
          await Promise.all([
            s
              .from("site_settings")
              .select("phone,zalo_url,facebook_url")
              .eq("id", 1)
              .maybeSingle(),
            s
              .from("projects")
              .select(
                "id,name,slug,location,description,image_url,potential_description",
              )
              .eq("slug", slug)
              .eq("status", "published")
              .maybeSingle(),
          ]);
        if (settingsData) setSettings({ ...settings, ...settingsData });
        setProject(projectData);
        setNotFound(!projectData);
        if (!projectData) return;
        const [
          { data: propertyData },
          { data: placeData },
          { data: tourData },
          { data: projectImageData },
        ] = await Promise.all([
          s
            .from("properties")
            .select("*")
            .eq("project_id", projectData.id)
            .eq("status", "published")
            .order("created_at", { ascending: false }),
          s
            .from("project_places")
            .select("*")
            .eq("project_id", projectData.id)
            .order("section")
            .order("sort_order")
            .order("created_at"),
          s
            .from("tours")
            .select("*")
            .eq("status", "published")
            .order("created_at", { ascending: false }),
          s
            .from("project_images")
            .select("id,project_id,image_url,sort_order")
            .eq("project_id", projectData.id)
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: true }),
        ]);
        const list = propertyData || [];
        setProperties(list);
        setPlaces((placeData || []) as Place[]);
        setTours(tourData || []);
        setProjectImages((projectImageData || []) as ProjectImage[]);
        if (list.length) {
          const ids = list.map((x) => x.id);
          const { data: imageData } = await s
            .from("property_images")
            .select("id,property_id,image_url,sort_order")
            .in("property_id", ids)
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: true });
          const grouped: Record<string, ImageItem[]> = {};
          (imageData || []).forEach((img: ImageItem) => {
            (grouped[img.property_id] ||= []).push(img);
          });
          setImages(grouped);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  const internalAmenities = useMemo(
    () => places.filter((x) => x.section === "amenity"),
    [places],
  );
  const connections = useMemo(
    () => places.filter((x) => x.section === "connection"),
    [places],
  );
  const travelPlaces = useMemo(
    () => places.filter((x) => x.section === "travel"),
    [places],
  );

  if (loading)
    return <main className="project-page-loading">Đang tải dự án...</main>;
  if (notFound || !project)
    return (
      <main className="container section">
        <div className="empty">
          Không tìm thấy dự án hoặc dự án chưa được công khai.
        </div>
        <a className="btn btn-primary" href="/">
          ← Về trang chủ
        </a>
      </main>
    );

  const phone = settings.phone.replace(/\s/g, "");

  return (
    <main className="project-page">
     <section className="project-overview container" id="tong-quan">
    <div className="project-section-kicker">01. TỔNG QUAN</div>
    
    <div className="project-overview-heading">
      <div>
        <h1>{project.name}</h1>
        {project.location && (
          <p className="project-location">📍 {project.location}</p>
        )}
      </div>
      <a className="btn btn-primary" href="#dau-tu">
        Xem cơ hội đầu tư
      </a>
    </div>

    <ProjectOverviewSlider
      images={projectImages}
      fallback={project.image_url}
      alt={project.name}
    />

    {/* Bắt đầu chia 2 cột bằng Flexbox inline-style */}
    <div 
      className="project-overview-content" 
      style={{ 
        display: 'flex', 
        gap: '2rem', 
        marginTop: '2rem',
        flexWrap: 'wrap' // Tự động xuống hàng trên giao diện mobile
      }}
    >
      {/* Phần 1: Nội dung mô tả bên TRÁI */}
      <div 
        className="project-description-wrapper"
        style={{ flex: '1 1 500px', minWidth: '300px' }} // Chiếm phần lớn không gian, co giãn linh hoạt
      >
        {project.description && (
          <RichTextDisplay
            html={project.description}
            className="project-overview-description rich-output"
          />
        )}
      </div>

      {/* Phần 2: Bản đồ Google Map bên PHẢI */}
      <div 
        className="project-map-wrapper" 
        style={{ 
          flex: '1 1 350px', // Chiếm không gian cột bên phải
          minWidth: '300px' 
        }}
      >
        <div className="project-map" style={{ width: '100%' }}>
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d601.8041330684888!2d107.73539625043945!3d11.599199918304263!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1svi!2s!4v1791191995799!5m2!1svi!2s" 
            width="100%" // Đặt 100% để bản đồ khít theo khung cột bên phải
            height="350" // Tăng nhẹ chiều cao từ 250 lên 350 để cân đối với cột chữ
            style={{ border: 0, borderRadius: '8px' }} // Thêm bo góc nhẹ cho hiện đại
            allowFullScreen
            loading="lazy" 
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>
    </div>
  </section>

      <section className="project-section project-section-soft" id="tien-ich">
        <div className="container">
          <div className="project-section-heading">
            <div>
              <div className="project-section-kicker">02. TIỆN ÍCH</div>
              <h2>Tiện ích nội khu</h2>
            </div>
            <span className="project-section-count">
              {internalAmenities.length} tiện ích
            </span>
          </div>
          {internalAmenities.length ? (
            <div className="project-place-grid">
              {internalAmenities.map((x) => (
                <PlaceCard key={x.id} item={x} />
              ))}
            </div>
          ) : (
            <div className="project-empty-inline">
              Chưa có tiện ích nội khu được cập nhật.
            </div>
          )}
        </div>
      </section>

      <section className="project-section container" id="ket-noi">
        <div className="project-section-heading">
          <div>
            <div className="project-section-kicker">03. KẾT NỐI</div>
            <h2>Kết nối xung quanh</h2>
          </div>
          <span className="project-section-count">
            {connections.length} điểm
          </span>
        </div>
        {connections.length ? (
          <div className="project-place-grid">
            {connections.map((x) => (
              <PlaceCard key={x.id} item={x} />
            ))}
          </div>
        ) : (
          <div className="project-empty-inline">
            Các điểm du lịch, tiện ích và hạ tầng xung quanh sẽ được cập nhật
            tại đây.
          </div>
        )}

         <section
        className="project-section project-container"
        id="du-lich-tham-quan"
      >
        {/* <div className="container"> */}
          <div className="project-section-heading">
            <div>
              {/* <div className="project-section-kicker">06. TRẢI NGHIỆM</div> */}
              <h2>Du lịch tham quan trải nghiệm</h2>
            </div>
            <span className="project-section-count">
              {travelPlaces.length } nội dung
            </span>
          </div>
          {travelPlaces.length ? (
            <div className="project-place-grid">
              {travelPlaces.map((x) => (
                <PlaceCard key={x.id} item={x} />
              ))}
            </div>
          ) : (
            <div className="project-empty-inline">
              Chưa có điểm tham quan trải nghiệm được cập nhật.
            </div>
          )}
          
        {/* </div> */}
      </section>

      </section>

      <section className="project-section project-section-soft" id="tiem-nang">
        <div className="container">
          <div className="project-section-heading">
            <div>
              <div className="project-section-kicker">04. TIỀM NĂNG</div>
              <h2>Tiềm năng phát triển</h2>
            </div>
          </div>
          {project.potential_description ? (
            <RichTextDisplay
              html={project.potential_description}
              className="project-potential rich-output"
            />
          ) : (
            <div className="project-empty-inline">
              Chưa có nội dung tiềm năng.
            </div>
          )}
        </div>
      </section>

      <section className="project-section container" id="dau-tu">
        <div className="project-section-heading">
          <div>
            <div className="project-section-kicker">05. ĐẦU TƯ</div>
            <h2>Bất động sản</h2>
          </div>
          <span className="project-section-count">
            {properties.length} sản phẩm
          </span>
        </div>
        {properties.length ? (
          <div className="project-properties-grid">
            {properties.map((item) => (
              <article className="project-property-card" key={item.id}>
                <PropertyGallery
                  images={images[item.id] || []}
                  fallback={item.image_url}
                  alt={item.title}
                />
                <div className="project-property-body">
                  <div className="project-property-location">
                    {item.location}
                  </div>
                  <h3>{item.title}</h3>
                  <RichTextPreview
                    html={item.description || "Thông tin đang được cập nhật."}
                  />
                  <div className="project-property-contact">
                    <strong>Liên hệ tư vấn</strong>
                    <a className="btn btn-primary" href={`tel:${phone}`}>
                      Tư vấn
                    </a>
                  </div>
                  <div className="product-links">
                    <a href={`tel:${phone}`}>☎ Gọi ngay</a>
                    <a
                      href={settings.zalo_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Zalo
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="project-empty-inline">
            Dự án chưa có bất động sản công khai.
          </div>
        )}
      </section>

      <section
        className="project-section project-section-soft"
        id="du-lich-tham-quan"
      >
        <div className="container">
         
          
          {tours.length > 0 && (
            <>
              <div className="project-subheading">
                <h3>Tour & trải nghiệm</h3>
              </div>
              <div className="project-tours-grid">
                {tours.slice(0, 6).map((x) => (
                  <TourCard key={x.id} item={x} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="project-final-cta">
        <div className="container project-final-cta-inner">
          <div>
            <div className="project-section-kicker">SẴN SÀNG TƯ VẤN</div>
            <h2>Quan tâm {project.name}?</h2>
            <p>Liên hệ để nhận thông tin BĐS, vị trí và chính sách mới nhất.</p>
          </div>
          <div className="actions-row">
            <a className="btn btn-primary" href={`tel:${phone}`}>
              ☎ Gọi ngay
            </a>
            <a
              className="btn btn-zalo"
              href={settings.zalo_url}
              target="_blank"
              rel="noreferrer"
            >
              Zalo
            </a>
            <a
              className="btn btn-primary"
              href={settings.facebook_url}
              target="_blank"
              rel="noreferrer"
            >
              Facebook
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
