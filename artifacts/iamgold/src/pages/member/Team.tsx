import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMemberTeam, type MemberTeam } from '@workspace/api-client-react';
import { ChevronRight, IndustrialIcon, Users } from '@/components/industrial-icons';
import { useSession } from '@/session';
import { invitationLink, useMember } from './member-context';
import { BottomNav, copyLink, Frame, goBack, goTo, Support } from './shared';
import { formatHistoryDate } from './FinancialHistoryCard';
import { TeamInsignia } from '@/iamgold-industrial-system/components/TeamInsignia';
import { RoyalMasthead, RoyalToolbar } from '@/iamgold-industrial-system/components/RoyalMasthead';
import './team.css';
import { MemberGoldBadge } from '@/components/MemberGoldBadge';

function useTeamQuery(level: number, page: number) {
  const { user } = useMember();
  return useQuery<MemberTeam>({
    queryKey: ['member-team', user.id, level, page],
    queryFn: ({ signal }) => getMemberTeam({ level, page }, { signal }),
    staleTime: 15_000,
    retry: false,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}

function TeamCard({ level, total, activated, onClick }: {
  level: number;
  total: number | null;
  activated: number | null;
  onClick: () => void;
}) {
  const className = `team-level-card team-level-${level}`;
  return (
    <button type="button" className={className} onClick={onClick} data-testid={`button-team-level-${level}`}>
      <TeamInsignia level={level} />
      <span className="team-level-rate-wrap"><strong className="team-level-rate">{[30, 5, 1][level - 1]}<small>%</small></strong><small className="team-level-rebate">Taux de réf.</small></span>
      <span className="team-level-count"><b>{total ?? '—'}</b><small>Total invité</small></span>
      <span className="team-level-active"><b>{activated ?? '—'}</b><small>Activé</small></span>
      <ChevronRight className="team-chevron" size={18} />
    </button>
  );
}

function InviteLinkRow({ link }: { link: string }) {
  const { showNotice } = useSession();
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    setCopied(false);
    const success = await copyLink(link, showNotice);
    if (success) setCopied(true);
  };
  return (
    <div className="team-code-row team-link-row">
      <span className="team-code-symbol team-link-symbol"><IndustrialIcon name="share" size={23} /></span>
      <div className="team-code-value">
        <small>Lien d’invitation</small>
        <strong data-testid="text-invitation-link">{link || '—'}</strong>
      </div>
      <button type="button" className={`team-copy-button${copied ? ' is-copied' : ''}`} aria-label="Copier le lien d’invitation" data-testid="button-copy-invitation-link" onClick={() => void handleCopy()} disabled={!link}>
        <IndustrialIcon name={copied ? 'check' : 'card'} size={18} /><span>{copied ? 'Copié' : 'Copier'}</span>
      </button>
    </div>
  );
}

function InviteCodes({ code, link }: { code: string; link: string }) {
  const { showNotice } = useSession();
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    setCopied(false);
    const success = await copyLink(code, showNotice, 'Code copié');
    if (success) setCopied(true);
  };
  return (
    <section className="team-code-list" aria-label="Vos informations d’invitation">
      <div className="team-invite-subtitle">Investissez ensemble, enrichissez-vous ensemble</div>
      <div className="team-code-row">
        <span className="team-code-symbol"><IndustrialIcon name="invite" size={23} /></span>
        <div className="team-code-value">
          <small>Code d’invitation</small>
          <strong data-testid="text-invitation-code">{code || '—'}</strong>
        </div>
        <button type="button" className={`team-copy-button${copied ? ' is-copied' : ''}`} aria-label="Copier le code d’invitation" data-testid="button-copy-invitation-code" onClick={() => void handleCopy()} disabled={!code}>
          <IndustrialIcon name={copied ? 'check' : 'card'} size={18} /><span>{copied ? 'Copié' : 'Copier'}</span>
        </button>
      </div>
      <InviteLinkRow link={link} />
    </section>
  );
}

export function InvitationPage() {
  const { overview } = useMember();
  const team = useTeamQuery(1, 1);
  const code = overview.invitationCode ?? '';
  const link = code ? invitationLink(code) : '';
  const levels = team.data?.levels ?? [];

  return (
    <Frame>
      <div className="ayala-scroll team-scroll royal-page royal-invitation">
        <RoyalMasthead />
        <RoyalToolbar title="Récompenses d’invitation" onBack={() => goBack('Home')} action="gift" actionLabel="Accéder au tirage au sort" onAction={() => goTo('Lottery')} />
        <main className="team-main">
          <section className="team-activity ayala-card" aria-label="Centre d’activités de bien-être">
            <div className="team-section-title">
              <span className="team-title-emblem" aria-hidden="true"><IndustrialIcon name="crown" size={25} /></span>
              <h2>Centre d’activités de bien-être</h2>
            </div>
            <div className="team-lottery-row">
              <div className="team-lottery-art" aria-hidden="true"><img src={`${import.meta.env.BASE_URL}iamgold-industrial-art/wheel-gift.webp`} alt="" /></div>
              <div className="team-lottery-copy"><strong>Roue de la chance</strong><small>Tirages disponibles : {overview.lotteryChances ?? 0}</small><button type="button" onClick={() => goTo('Lottery')} data-testid="button-lottery">Tirage au sort <ChevronRight size={17} /></button></div>
            </div>
          </section>

          <section className="team-invitation-section ayala-card" aria-label="Récompenses d’invitation">
            <div className="team-section-title">
              <span className="team-title-emblem" aria-hidden="true"><IndustrialIcon name="gift" size={24} /></span>
              <h2>Récompenses d’invitation</h2>
            </div>
            <InviteCodes code={code} link={link} />
          </section>

          <section className="team-overview-levels ayala-card">
            <div className="team-card-heading">
              <h2>Niveau d’équipe</h2>
              <button type="button" onClick={() => goTo('Team')} data-testid="link-team-details">Détails de l’équipe <ChevronRight size={16} /></button>
            </div>
            <p className="royal-reference-note">Taux affichés à titre de référence uniquement ; ils ne représentent pas des commissions créditées.</p>
            {team.isLoading ? (
              <div className="team-level-skeleton" aria-label="Chargement des niveaux"><i /><i /><i /></div>
            ) : team.isError ? (
              <div className="team-query-error" role="alert" data-testid="status-team-overview-error">
                <span>Impossible de charger les niveaux.</span><button type="button" onClick={() => void team.refetch()}>Réessayer</button>
              </div>
            ) : (
              <section className="team-level-list" aria-label="Niveaux de l’équipe">
                {[1, 2, 3].map(level => {
                  const item = levels.find(entry => entry.level === level);
                  return <TeamCard key={level} level={level} total={item?.total ?? null} activated={item?.activated ?? null} onClick={() => goTo(`Team${level}`)} />;
                })}
              </section>
            )}
          </section>
        </main>
        <Support inline availabilityUnknown />
        <BottomNav active="Account" />
      </div>
    </Frame>
  );
}

export function TeamPage() {
  const team = useTeamQuery(1, 1);
  const { overview } = useMember();
  const levels = team.data?.levels ?? [];
  return (
    <Frame>
      <div className="ayala-scroll team-scroll royal-page royal-team">
        <RoyalMasthead />
        <RoyalToolbar title="Détails de l’équipe" onBack={() => goBack('Invitation')} />
        <main className="team-main team-detail-main">
          <section className="team-code-card team-link-only ayala-card" aria-label="Lien d’invitation">
            <InviteLinkRow link={overview.invitationCode ? invitationLink(overview.invitationCode) : ''} />
          </section>
          {team.isLoading ? <div className="team-level-skeleton" aria-label="Chargement des niveaux"><i /><i /><i /></div>
            : team.isError ? <div className="team-query-error" role="alert" data-testid="status-team-details-error"><span>Impossible de charger les niveaux.</span><button type="button" onClick={() => void team.refetch()}>Réessayer</button></div>
              : <section className="team-overview-levels ayala-card team-detail-list">
                <div className="team-card-heading"><h2>Niveau d’équipe</h2></div>
                <p className="royal-reference-note">Les taux sont des repères locaux et ne constituent pas un historique de gains ou de commissions.</p>
                <div className="team-level-list">{[1, 2, 3].map(level => {
                const item = levels.find(entry => entry.level === level);
                return <TeamCard key={level} level={level} total={item?.total ?? null} activated={item?.activated ?? null} onClick={() => goTo(`Team${level}`)} />;
              })}</div></section>}
        </main>
        <Support inline availabilityUnknown />
      </div>
    </Frame>
  );
}

export function TeamMembersPage({ level }: { level: number }) {
  const [page, setPage] = useState(1);
  const team = useTeamQuery(level, page);
  useEffect(() => {
    setPage(1);
  }, [level]);
  const rows = team.data?.members ?? [];
  const levelInfo = team.data?.levels.find(item => item.level === level);

  return (
    <Frame>
      <div className="ayala-scroll team-scroll team-members-scroll royal-page royal-team-members">
        <RoyalMasthead />
        <RoyalToolbar title={`Membre de l’équipe ${level}`} onBack={() => goBack('Team')} />
        <main className="team-main team-members-main">
          {team.isError && rows.length === 0 ? (
            <div className="team-query-error team-member-error" role="alert" data-testid="status-team-members-error">
              <span>Impossible de charger les membres.</span><button type="button" onClick={() => void team.refetch()}>Réessayer</button>
            </div>
          ) : (
            <>
              <section className="team-member-stats" aria-label="Statistiques des membres">
                <article className="team-stat-card"><strong data-testid="text-team-total-invited">{levelInfo?.total ?? '—'}</strong><span>Total invité</span></article>
                <article className="team-stat-card"><strong data-testid="text-team-total-activated">{levelInfo?.activated ?? '—'}</strong><span>Activé</span></article>
              </section>
              <section className="team-members-card ayala-card">
                {team.isLoading && !team.data ? <div className="team-member-skeleton"><i /><i /><i /></div>
                  : <>
                    <div className="team-members-title"><h2>Liste des membres</h2></div>
                    {rows.length === 0 ? <div className="team-empty-state" data-testid="empty-team-members"><span><Users size={23} /></span><strong>Aucun membre pour le moment</strong><small>Les membres invités à ce niveau apparaîtront ici.</small></div>
                    : <div className="team-member-list">
                      {rows.map((member, index) => {
                        const avatarPath = member.avatarPath
                          ? `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api/storage${member.avatarPath.startsWith('/') ? member.avatarPath : `/${member.avatarPath}`}`
                          : '';
                        return <article className="team-member-row" key={`${member.id}-${index}`} data-testid={`row-team-member-${member.id}`}>
                          {avatarPath ? <img className="team-member-avatar" src={avatarPath} alt="" onError={event => { event.currentTarget.style.display = 'none'; }} /> : <span className="team-member-avatar team-member-avatar-fallback" aria-hidden="true">I</span>}
                          <div className="team-member-identity"><div className="team-member-name-row"><strong data-testid={`text-team-nickname-${member.id}`}>{member.nickname}</strong>{member.nickname?.trim() && <MemberGoldBadge size={22} />}</div><small>Rejoint le {formatHistoryDate(member.joinedAt)}</small></div>
                          <span className={`team-status ${member.activated === true ? 'team-status-active' : member.activated === false ? 'team-status-inactive' : 'team-status-unknown'}`} data-testid={`status-team-member-${member.id}`}>
                            {member.activated === true ? 'Activé' : member.activated === false ? 'Inactif' : '—'}
                          </span>
                        </article>;
                      })}
                    </div>}
                  </>}
                {team.isError && rows.length > 0 && <div className="team-inline-error" role="alert">La mise à jour a échoué. <button type="button" onClick={() => void team.refetch()}>Réessayer</button></div>}
                {team.data && (page > 1 || team.data.hasMore) && <div className="team-pagination">
                  <button type="button" onClick={() => setPage(current => Math.max(1, current - 1))} disabled={page <= 1 || team.isFetching} data-testid="button-team-previous">Précédent</button>
                  <span>Page {page}</span>
                  <button type="button" onClick={() => setPage(current => current + 1)} disabled={!team.data?.hasMore || team.isFetching} data-testid="button-team-next">{team.isFetching ? 'Chargement…' : 'Suivant'}</button>
                </div>}
              </section>
            </>
          )}
        </main>
        <Support inline availabilityUnknown />
      </div>
    </Frame>
  );
}
