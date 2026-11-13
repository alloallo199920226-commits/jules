import { Frame, Header, BottomNav, Support, useNotice, Toast, Icons } from "./_shared";

// Barème visuel de la référence, pas des récompenses réelles.
const missions = [[10, "FCFA500.00"], [20, "FCFA1000.00"], [50, "FCFA3000.00"], [100, "FCFA7000.00"], [200, "FCFA15000.00"], [500, "FCFA30000.00"]];

export default function Missions() {
  const { message, setMessage, clear } = useNotice();
  const params = new URLSearchParams(window.location.search);
  const invitation = (params.get("invitation") ?? params.get("invite") ?? params.get("invitationCode") ?? params.get("code") ?? "").trim();
  const invitationUrl = new URL("/__mockup/preview/ayala-auth/Register", window.location.origin);
  invitationUrl.searchParams.set("invitation", invitation);
  const copyInvitation = async () => {
    if (!invitation) {
      setMessage("Aucun lien disponible sans invitation ou compte connecté.");
      return;
    }
    try {
      await navigator.clipboard.writeText(invitationUrl.href);
      setMessage("Lien d’invitation copié.");
    } catch {
      setMessage("La copie est indisponible dans ce navigateur.");
    }
  };
  return <Frame>
    <div className="ayala-scroll">
      <div style={{ height: 215, background: "#0875f5", color: "white", position: "relative" }}>
        <Header title="Récompense de mission" help />
        <div style={{ padding: "5px 15px", fontSize: 14, color: "#d5e8ff" }}>Total des commissions obtenues</div>
        <div style={{ padding: "9px 15px", fontWeight: 600, fontSize: 17 }}>FCFA <b style={{ fontSize: 30 }}>—</b></div>
        <div style={{ position: "absolute", right: 13, bottom: 54, color: "#ffe38b" }}><Icons.Gift size={54} /></div>
      </div>
      <div className="ayala-card" style={{ position: "relative", margin: "-50px 15px 13px", padding: "17px 14px", display: "flex", alignItems: "center", gap: 10 }}>
        <Icons.Share2 color="#a17ab5" />
        <div style={{ flex: 1, minWidth: 0, color: "#626771", fontSize: 12 }}>Lien d’invitation<br />
          <span style={{ color: "#3980c5", overflowWrap: "anywhere" }}>{invitation ? invitationUrl.href : "Disponible après connexion"}</span>
        </div>
        <button onClick={copyInvitation} className="ayala-soft-button" style={{ height: 39, fontSize: 13 }}>Copier</button>
      </div>
      <section className="ayala-card" style={{ margin: "0 15px 20px", padding: 16 }}>
        <b style={{ fontSize: 17 }}>Centre de missions</b>
        <p style={{ color: "#999", fontSize: 12, margin: "8px 0 18px" }}>Barème de la référence — aucun gain ni avancement réel.</p>
        {missions.map(([count, reward]) => <div key={count} style={{ display: "flex", gap: 12, marginBottom: 17 }}>
          <div style={{ color: "#55ad87", padding: "2px 0" }}><Icons.Clock3 size={26} /><div style={{ height: 78, borderLeft: "1px solid #ddd", marginLeft: 12 }} /></div>
          <article style={{ flex: 1, background: "#fafbfc", borderRadius: 13, padding: "14px 14px 11px", boxShadow: "0 1px 4px #2221" }}>
            <b>Inviter à activer {count} personnes</b>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", textAlign: "center", marginTop: 12, fontWeight: 600 }}>
              <span>{reward}<small style={{ display: "block", color: "#aaa", fontWeight: 400 }}>Récompense</small></span>
              <span>{count}<small style={{ display: "block", color: "#aaa", fontWeight: 400 }}>Exigé</small></span>
              <span style={{ color: "#45ad83" }}>—<small style={{ display: "block", color: "#aaa", fontWeight: 400 }}>Complété</small></span>
            </div>
          </article>
        </div>)}
      </section>
    </div>
    <Support /><BottomNav active="Notice" /><Toast message={message} onClose={clear} />
  </Frame>;
}
