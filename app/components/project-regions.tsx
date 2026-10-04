import Link from 'next/link'

type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  project_count: number
}

const fallbackImages = [
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&q=80',
]

export default function ProjectRegions({ categories }: { categories: Category[] }) {
  return (
    <section className="py-5 project-regions bg-body-tertiary" id="khu-vuc">
      <div className="container">
        <div className="row align-items-end mb-4">
          <div className="col-lg-8">
            <span className="text-success fw-bold small">DỰ ÁN LỚN</span>
            <h2 className="display-5 fw-bold mt-2 mb-3">Khám phá theo khu vực</h2>
            <p className="text-secondary mb-0">
              Gom các dự án theo từng khu vực để bạn dễ dàng xem tổng quan và lựa chọn sản phẩm phù hợp.
            </p>
          </div>
          <div className="col-lg-4 text-lg-end mt-3 mt-lg-0">
            <span className="badge rounded-pill text-bg-light border px-3 py-2">
              {categories.length} khu vực
            </span>
          </div>
        </div>

        {categories.length ? (
          <div className="row g-4">
            {categories.map((category, index) => {
              const image = category.image_url || fallbackImages[index % fallbackImages.length]
              return (
                <div className="col-12 col-md-6 col-xl-4" key={category.id}>
                  <Link href={`/regions/${category.slug}`} className="text-decoration-none">
                    <article className="card border-0 shadow-sm overflow-hidden h-100 project-region-card">
                      <div className="project-region-image position-relative">
                        <img src={image} alt={category.name} className="w-100 h-100 object-fit-cover" />
                        <div className="project-region-overlay" />
                        <div className="position-absolute top-0 start-0 p-4">
                          <span className="badge rounded-pill bg-white text-dark px-3 py-2">
                            <i className="bi bi-buildings me-2" />
                            {category.project_count} dự án
                          </span>
                        </div>
                        <div className="position-absolute bottom-0 start-0 w-100 p-4 text-white">
                          <div className="small fw-semibold text-uppercase mb-2">KHU VỰC</div>
                          <h3 className="display-6 fw-bold mb-2">{category.name}</h3>
                          <p className="mb-0 opacity-75">
                            {category.description || `Khám phá các dự án bất động sản tại ${category.name}.`}
                          </p>
                        </div>
                      </div>
                      <div className="card-body d-flex justify-content-between align-items-center">
                        <span className="fw-semibold text-dark">Xem các dự án</span>
                        <span className="project-region-arrow"><i className="bi bi-arrow-right" /></span>
                      </div>
                    </article>
                  </Link>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="alert alert-light border mb-0">
            Chưa có khu vực công khai. Bạn có thể tạo danh mục tại <strong>Quản trị → Danh mục dự án</strong>.
          </div>
        )}
      </div>
    </section>
  )
}
