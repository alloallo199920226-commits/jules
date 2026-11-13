import React,{useState} from "react";
import { Activity,Flame,Gift } from "lucide-react";
import { Frame,Header,BottomNav,Support,previewOffers,useNotice,Toast } from "./_shared";

export default function Investments(){
 const [tab,setTab]=useState("Stable");
 const {message,setMessage,clear}=useNotice();
 const categories=[{name:"Stable",Icon:Activity},{name:"Bien-être",Icon:Gift},{name:"Activité",Icon:Flame}];
 const offers=tab==="Stable"?previewOffers:[];
 return <Frame>
  <Header title="Liste d’investissement"/>
  <div style={{display:"flex",height:"calc(100% - 151px)"}}>
   <aside style={{width:99,flexShrink:0,background:"#fff",paddingTop:15}}>
    {categories.map(({name,Icon})=><button key={name} onClick={()=>setTab(name)} style={{height:88,width:"100%",border:0,borderLeft:`3px solid ${tab===name?"#1682e8":"transparent"}`,background:tab===name?"#f7fbff":"#fff",color:tab===name?"#1476c7":"#858a92",fontSize:12}}><Icon size={21} style={{display:"block",margin:"0 auto 7px"}}/>{name}</button>)}
   </aside>
   <div className="ayala-scroll" style={{flex:1,padding:"15px 15px 30px"}}>
    {offers.length?offers.map(offer=><article className="ayala-card" key={offer.name} style={{overflow:"hidden",marginBottom:15}}>
     <div style={{height:140,background:"linear-gradient(120deg,#6169d2,#8744ac)"}}/>
     <div style={{padding:"15px 15px 16px"}}>
      <b style={{fontSize:15,display:"block",minHeight:38}}>{offer.name}</b>
      {offer.unit&&[["Prix unitaire",offer.unit],["Revenu",offer.days],["Revenus quotidiens",offer.daily],["Revenu total",offer.total]].map(([label,val])=><div key={label} style={{display:"flex",justifyContent:"space-between",marginTop:9,fontSize:12}}><span style={{color:"#999da5"}}>{label}</span><span style={{color:label==="Prix unitaire"?"#c77a40":"#373b43"}}>{val}</span></div>)}
      {!offer.unit&&<p style={{color:"#969ba4",fontSize:12,margin:"9px 0"}}>Détails non disponibles dans la référence.</p>}
      <button className="ayala-soft-button" style={{width:"100%",marginTop:16}} onClick={()=>setMessage("Aperçu uniquement — aucune opération financière n’a été effectuée.")}>Investir maintenant</button>
     </div>
    </article>):<div className="ayala-card" style={{padding:20,color:"#868b93",fontSize:13}}>Offres non disponibles dans la référence.</div>}
   </div>
  </div>
  <Support/><BottomNav active="Investments"/><Toast message={message} onClose={clear}/>
 </Frame>
}
