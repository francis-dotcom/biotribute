import { notFound } from "next/navigation";
import { requireAdminToken } from "@/lib/admin";
import { getTributeRecord } from "@/lib/tributes-store";

type EditTributePageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function EditTributePage({ params, searchParams }: EditTributePageProps) {
  const { slug } = await params;
  const { token } = await searchParams;
  requireAdminToken(token, `/${slug}`);
  const tribute = await getTributeRecord(slug);

  if (!tribute) {
    notFound();
  }

  return (
    <section className="dashboard-section">
      <article className="form-card">
        <p className="card-label">Edit Tribute</p>
        <h2>Core tribute content</h2>
        <p className="subtle-note">
          This dashboard is now structured per tribute. The next backend step is
          persisting these edits in a database instead of static data.
        </p>

        <div className="dashboard-form-grid">
          <label className="field-block">
            <span>Name</span>
            <input type="text" defaultValue={tribute.name} />
          </label>
          <label className="field-block">
            <span>Years</span>
            <input type="text" defaultValue={tribute.years} />
          </label>
          <label className="field-block dashboard-full-width">
            <span>Tagline</span>
            <input type="text" defaultValue={tribute.tagline} />
          </label>
          <label className="field-block dashboard-full-width">
            <span>Life story</span>
            <textarea defaultValue={tribute.lifeStory.join("\n\n")} />
          </label>
          <label className="field-block dashboard-full-width">
            <span>Gallery note</span>
            <textarea defaultValue={tribute.galleryNote} />
          </label>
        </div>

        <div className="dashboard-info-banner">
          Save persistence is not wired yet for tribute content. The route structure and
          editing surface are now in place for the multi-tenant dashboard.
        </div>
        <div className="dashboard-info-banner">
          Theme preference now has its own dashboard tab so families can choose the
          page mood separately from the tribute content.
        </div>
      </article>
    </section>
  );
}
