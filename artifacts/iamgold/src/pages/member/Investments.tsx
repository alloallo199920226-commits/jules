import { useEffect, useMemo, useState } from 'react';
import { Activity, Flame, Gift } from '@/components/industrial-icons';
import { BottomNav, Frame, Header, Support } from './shared';
import InvestmentDialog from './InvestmentDialog';
import { investmentProducts, type InvestmentProduct } from './investment-products';
import { InvestmentCard } from '@/iamgold-industrial-system/components/InvestmentCard';
import { listMemberProducts } from '@workspace/api-client-react';

const categories = [
  { name: 'Stable', slug: 'stable', Icon: Activity },
  { name: 'Bien-être', slug: 'wellbeing', Icon: Gift },
  { name: 'Activités', slug: 'activity', Icon: Flame },
] as const;

export default function Investments() {
  const [tab, setTab] = useState<(typeof categories)[number]['name']>('Stable');
  const [selectedProduct, setSelectedProduct] = useState<InvestmentProduct | null>(null);
  const [catalog, setCatalog] = useState<InvestmentProduct[]>([]);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    listMemberProducts({ signal: controller.signal })
      .then(result => {
        setConfigured(result.configured);
        setCatalog(result.products.filter(product => product.active).map(product => ({
          id: product.id, name: product.name, category: product.category, unitPrice: product.price,
          dailyRevenue: product.dailyIncome, totalRevenue: product.totalIncome, durationDays: product.durationDays, maximumShares: null,
        })));
        setFailed(false);
      })
      .catch(() => { if (!controller.signal.aborted) setFailed(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [retry]);
  const products = useMemo(() => {
    const slug = categories.find(category => category.name === tab)?.slug;
    if (configured) return catalog.filter(product => product.category === slug);
    return tab === 'Stable' ? investmentProducts : [];
  }, [tab, catalog, configured]);

  return (
    <Frame>
      <div className="investment-shell">
        <div className="investment-masthead" role="img" aria-label="IAMGOLD, La plateforme AYALA — fabrication et raffinage d’or">
          <img src={`${import.meta.env.BASE_URL}iamgold-home-header.webp`} alt="" />
        </div>
        <Header title="Liste d’investissement" />
        <div className="member-invest-layout investment-layout">
          <aside className="investment-categories" aria-label="Catégories de lots">
            {categories.map(({ name, Icon }) => (
              <button
                key={name}
                type="button"
                className={`investment-category${tab === name ? ' selected' : ''}`}
                aria-pressed={tab === name}
                onClick={() => setTab(name)}
                data-testid={`category-${name.toLowerCase().replace('ê', 'e')}`}
              >
                <span className="investment-category-icon"><Icon size={27} /></span>
                <span>{name}</span>
              </button>
            ))}
            <div className="investment-sidebar-ore" aria-hidden="true"><span /><span /><span /><span /></div>
          </aside>
          <main className="ayala-scroll member-invest-list investment-list" aria-label={`Lots ${tab}`}>
            {loading ? <div className="investment-loading" role="status" aria-label="Chargement du catalogue"><i/><i/></div> : failed ? <div className="investment-empty" role="alert"><p className="investment-empty-kicker">CATALOGUE IAMGOLD</p><h2>Catalogue indisponible</h2><p>Les offres n’ont pas pu être chargées.</p><button type="button" className="investment-category" onClick={() => setRetry(value => value + 1)}>Réessayer</button></div> : products.length ? (
              <div className="investment-card-stack">
                {products.map((product, index) => (
                  <InvestmentCard
                    key={product.id}
                    product={product}
                    illustration={index === 0 ? 'truck' : 'excavator'}
                    onSelect={() => setSelectedProduct(product)}
                  />
                ))}
              </div>
            ) : (
              <section className="investment-empty" aria-live="polite" data-testid={`empty-category-${tab.toLowerCase().replace('ê', 'e')}`}>
                <div className="investment-empty-mark" aria-hidden="true"><span /><span /><span /></div>
                <p className="investment-empty-kicker">CATÉGORIE · {tab.toUpperCase()}</p>
                <h2>Aucun lot de référence</h2>
                <p>{configured ? 'Aucun produit actif dans cette catégorie.' : 'Aucune offre n’est renseignée dans cette catégorie.'}</p>
              </section>
            )}
          </main>
        </div>
      </div>
      <div className="investment-support-row"><span>Besoin d’aide ?</span><Support inline /></div>
      <BottomNav active="Investments" />
      {selectedProduct && (
        <InvestmentDialog
          key={selectedProduct.id}
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </Frame>
  );
}
