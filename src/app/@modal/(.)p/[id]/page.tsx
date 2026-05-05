import { notFound } from "next/navigation";
import { getPhotographer } from "@/lib/data";
import { egoGraph } from "@/lib/relations";
import { PhotographerEntry } from "@/components/detail/PhotographerEntry";
import { EgoGraph } from "@/components/detail/EgoGraph";
import { PhotographerDrawer } from "@/components/shell/PhotographerDrawer";

type PageProps = { params: Promise<{ id: string }> };

/**
 * Intercepting route: when the user clicks a photographer from any sibling
 * route (timeline / network / movements / lineage), this slot renders a
 * slide-in drawer instead of navigating to the full page. The address bar
 * still updates to /p/[id] so the URL is shareable; reload or direct open
 * falls back to the SSG page at app/p/[id]/page.tsx.
 */
export default async function InterceptedPhotographerModal({ params }: PageProps) {
  const { id } = await params;
  const p = getPhotographer(id);
  if (!p) notFound();
  const ego = egoGraph(id);
  if (!ego) notFound();

  return (
    <PhotographerDrawer id={p.id} title={`${p.nameZh} ${p.name}`}>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-x-10 gap-y-10 px-6 lg:px-10 py-10 max-w-[1180px] mx-auto">
        <PhotographerEntry photographer={p} />
        <aside className="lg:sticky lg:top-14 lg:self-start lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto pr-1">
          <div className="border-l border-rule pl-6">
            <h2 className="font-display text-[10px] tracking-[0.24em] uppercase text-ink-3 mb-4">
              影响关系图谱 / Ego Graph
            </h2>
            <EgoGraph data={ego} center={p} />
          </div>
        </aside>
      </div>
    </PhotographerDrawer>
  );
}
