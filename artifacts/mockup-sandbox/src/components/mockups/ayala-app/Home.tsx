import React,{useState} from "react";
import { Frame,HeaderLogo,BottomNav,Support,Modal,Toast,useNotice,Icons,goTo } from "./_shared";

export default function Home({initialAnnouncementOpen=false}:{initialAnnouncementOpen?:boolean}){
 const [modal,setModal]=useState(initialAnnouncementOpen);
 const {message,setMessage,clear}=useNotice();
 const inviteCode=new URLSearchParams(window.location.search).get("invite");
 const invitationUrl=inviteCode?`${window.location.origin}/__mockup/preview/ayala-auth/Register?invite=${encodeURIComponent(inviteCode)}`:"";
 const copyInvitation=async()=>{if(!invitationUrl){setMessage("Disponible après connexion");return}try{await navigator.clipboard.writeText(invitationUrl);setMessage("Lien copié")}catch{setMessage("Copie indisponible — autorisez l’accès au presse-papiers")}};
 const shortcuts=[
  {label:"Recharger",Icon:Icons.CircleDollarSign},{label:"Retirer",Icon:Icons.HandCoins},
  {label:"Mon Équipe",Icon:Icons.Users},{label:"Telegram",Icon:Icons.Send},
 ];
 const activities=[
  {title:"Roue de la chance",desc:"Taux de gain du tirage au sort de 100%",action:"Tirage au sort"},
  {title:"Récompenses de tâches",desc:"Complétez des tâches et gagnez un salaire supplémentaire chaque jour",action:"Aller à"},
 ];
 return <Frame>
  <div className="ayala-scroll"><HeaderLogo/><main style={{padding:"10px 15px 25px"}}>
   <div style={{height:176,borderRadius:13,background:"#050505",display:"grid",placeItems:"center",marginBottom:12}}>
    <div style={{color:"#fff",fontSize:25,fontWeight:900,letterSpacing:-2}}>IAM<i style={{color:"#c99a28",fontStyle:"normal"}}>GOLD</i><small style={{fontSize:12,borderLeft:"1px solid #777",marginLeft:10,paddingLeft:9,letterSpacing:0}}>MINING.<br/>REDEFINED.</small></div>
   </div>
   <div className="ayala-card" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",padding:"17px 7px 15px",textAlign:"center"}}>
    {shortcuts.map(({label,Icon})=><button key={label} onClick={()=>label==="Telegram"?setModal(true):setMessage("Service indisponible dans cet aperçu")} style={{border:0,background:"none",color:"#717781",fontSize:12}}><span style={{width:50,height:50,background:"#eef5ff",borderRadius:13,display:"grid",placeItems:"center",margin:"0 auto 7px",color:"#4b8abd"}}><Icon size={20}/></span>{label}</button>)}
   </div>
   <section className="ayala-card" style={{padding:18,marginTop:12}}>
    <b style={{fontSize:16}}>Récompenses d’invitation</b><div style={{color:"#a1a2a6",fontSize:12,marginTop:3}}>Investissez ensemble, enrichissez-vous ensemble</div>
    <div style={{marginTop:15,background:"#fff8f3",borderRadius:10,padding:12,display:"flex",alignItems:"center",gap:10}}><span style={{width:42,height:42,borderRadius:10,background:"#f2e3f7",display:"grid",placeItems:"center",color:"#9b63af",flexShrink:0}}><Icons.Share2 size={21}/></span><div style={{fontSize:11,color:"#85868b",flex:1,minWidth:0,overflowWrap:"anywhere"}}>Lien d’invitation<br/><span>{invitationUrl||"Disponible après connexion"}</span></div><button onClick={copyInvitation} style={{background:"#ee7e43",border:0,borderRadius:22,color:"white",padding:"9px 18px",flexShrink:0}}>{invitationUrl?"Copier":"Connexion"}</button></div>
   </section>
   <section className="ayala-card" style={{padding:19,marginTop:14}}>
    <b style={{fontSize:16}}>Centre d’activités de bien-être</b><div style={{marginTop:16}}>
     {activities.map((item,i)=><div key={item.title} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 0",borderBottom:i===0?"1px solid #f1f1f1":0}}><div style={{height:50,width:50,borderRadius:12,background:i?"#f7e8d0":"#f9eccb",display:"grid",placeItems:"center",color:"#dd9d26"}}><Icons.Gift size={24}/></div><div style={{flex:1}}><b>{item.title}</b><div style={{fontSize:11,color:"#999",marginTop:3}}>{item.desc}</div></div><button onClick={()=>i===1?goTo("Missions"):setMessage("Disponible dans l’aperçu, sans gain ni transaction")} style={{border:0,borderRadius:20,background:"#ed7a40",color:"#fff",padding:"9px 13px",fontSize:11}}>{item.action}</button></div>)}
    </div>
   </section>
   <div className="ayala-info">Maquette de prévisualisation — aucun compte ni solde réel.</div>
  </main></div>
  <Support/><BottomNav active="Home"/>
  {modal&&<Modal onClose={()=>setModal(false)}><div style={{width:62,height:62,borderRadius:"50%",background:"#4989ee",color:"#fff",display:"grid",placeItems:"center",margin:"3px auto 17px"}}><Icons.Send size={33}/></div><h2>Publication d’informations officielles</h2><p>Suivez notre canal Telegram officiel pour obtenir les dernières nouvelles et informations sur le bien-être</p><button className="ayala-soft-button" style={{width:"100%",background:"linear-gradient(90deg,#2774ee,#5595ee)"}} onClick={()=>{setModal(false);setMessage("Canal Telegram non connecté dans cet aperçu.")}}>Suivre maintenant</button></Modal>}
  <Toast message={message} onClose={clear}/>
 </Frame>
}
