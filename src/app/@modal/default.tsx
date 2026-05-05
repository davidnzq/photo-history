// Default null content for the @modal parallel slot — rendered when no
// modal route is active. The intercepting route at @modal/(.)p/[id] takes
// over for navigations to /p/[id] from sibling pages (timeline / network /
// movements / lineage). Direct visits to /p/[id] still render the full
// SSG page (SEO friendly).
export default function ModalDefault() {
  return null;
}
