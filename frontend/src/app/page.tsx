import ForexPlans from "@/components/ForexPlans/ForexPlans";
import { fetchCatalogueServer } from "@/lib/api";
import type { ForexCatalogue } from "@/types/forex";

// Always render fresh on request — the catalogue/prices may change upstream.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  let initialData: ForexCatalogue | null = null;
  try {
    initialData = await fetchCatalogueServer();
  } catch {
    // Backend may be warming up; the client will retry via SWR.
    initialData = null;
  }

  return (
    <main>
      <ForexPlans initialData={initialData} />
    </main>
  );
}
