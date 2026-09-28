import { listBrands, listPdps } from "@/brands/repository";
import { listEvaluations } from "@/evaluation/orchestrator";
import { listModelProfiles } from "@/models/repository";
import {
  describeEvaluationStatusShort,
  displayTitle,
} from "@/evaluation/copy";
import { signOut } from "./actions";
import { EvaluationForm } from "./evaluation-form";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [profiles, brands, pdps, evaluations] = await Promise.all([
    listModelProfiles({ enabledOnly: true }),
    listBrands(),
    listPdps(),
    listEvaluations(200),
  ]);

  const latestByPdp = new Map<string, { id: string; status: string }>();
  for (const evaluation of evaluations) {
    if (!latestByPdp.has(evaluation.pdpId)) {
      latestByPdp.set(evaluation.pdpId, {
        id: evaluation.id,
        status: evaluation.status,
      });
    }
  }

  const groups = brands
    .map((brand) => ({
      brand,
      pdps: pdps.filter((pdp) => pdp.brandId === brand.id),
    }))
    .filter((group) => group.pdps.length > 0);

  return (
    <main className="page seminar-home">
      <header className="header">
        <div className="header-row">
          <div><p className="eyebrow">Fashion · Agentic commerce demo</p><h1>What makes a product recommendable?</h1></div>
          <form action={signOut}>
            <button className="button-secondary" type="submit">
              Sign out
            </button>
          </form>
        </div>
        <p className="muted">
          Start with a shopper’s needs and a real product page. Explore what a model can support with evidence, and what it still needs to know.
        </p>
      </header>

      <section className="card">
        <h2 className="card-title">Explore a product</h2>
        <EvaluationForm
          profiles={profiles.map((profile) => ({
            id: profile.id,
            label: profile.label,
            model: profile.model,
            provider: profile.provider,
          }))}
        />
      </section>

      <section className="card">
        <h2 className="card-title">Saved explorations</h2>
        {groups.length === 0 ? (
          <p className="muted">
            Your saved examples will appear here after an exploration.
          </p>
        ) : (
          <div className="brand-groups">
            {groups.map((group) => (
              <div key={group.brand.id} className="brand-group">
                <h3 className="brand-title">{group.brand.name}</h3>
                <ul className="pdp-list">
                  {group.pdps.map((pdp) => {
                    const latest = latestByPdp.get(pdp.id);
                    return (
                      <li key={pdp.id} className="pdp-item">
                        <div className="pdp-main">
                          <span className="pdp-title">
                            {displayTitle(pdp.title, pdp.url)}
                          </span>
                          <span className="muted pdp-url">{pdp.url}</span>
                        </div>
                        {latest ? (
                          <a
                            className="pdp-status"
                            href={`/pdps/${pdp.id}`}
                          >
                            {describeEvaluationStatusShort(latest.status)}
                          </a>
                        ) : (
                          <span className="muted">Not evaluated</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
