import { PHOTOGRAPHERS, MOVEMENTS, EVENTS } from "@/lib/data";
import { AboutContent } from "@/app/about/AboutContent";
import { AboutModalShell } from "@/components/shell/AboutModalShell";

/**
 * Intercepting route: when soft-navigated from any sibling route via the i
 * icon, About slides in as a modal over the current view. Direct visits to
 * /about render the standalone page (app/about/page.tsx) for SEO.
 */
export default function InterceptedAbout() {
  return (
    <AboutModalShell>
      <AboutContent
        inModal
        counts={{
          photographers: PHOTOGRAPHERS.length,
          movements: MOVEMENTS.length,
          events: EVENTS.length,
        }}
      />
    </AboutModalShell>
  );
}
