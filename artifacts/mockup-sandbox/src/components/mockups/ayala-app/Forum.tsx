import React,{useState} from "react";
import { Frame,Header,BottomNav,Support,useNotice,Toast,goTo } from "./_shared";

const posts=[
 {member:"—",amount:"FCFA —",description:"RETRAIT REÇU SANS AUCUN RETARD",date:"Date: 2026-04-16 22:17:53"},
 {member:"—",amount:"FCFA —",description:"Premier retrait reçu !",date:"Date: 2026-04-15 18:42:10"},
];
export default function Forum(){
 const [expanded,setExpanded]=useState(true);
 const {message,setMessage,clear}=useNotice();
 return <Frame><div className="ayala-scroll">
  <div style={{background:"#0875f5",color:"#fff",paddingBottom:17}}><Header title="Forum" help/>
   <div style={{display:"flex",alignItems:"center",padding:"5px 15px",gap:12}}>
    <div className="ayala-avatar">I</div><div style={{fontWeight:600}}>Membre<div style={{fontSize:11,opacity:.8}}>ID　—</div></div>
    <button className="ayala-soft-button" onClick={()=>goTo("Publish")} style={{marginLeft:"auto",background:"#ffffff30",height:40}}>Publier</button>
   </div>
  </div>
  <div style={{padding:"0 15px 20px"}}>
   <button onClick={()=>setExpanded(!expanded)} style={{width:"100%",textAlign:"left",border:"1px solid #f1dfa0",borderRadius:14,background:"#fff8df",padding:"15px 17px",color:"#32343a"}}>
    <b style={{color:"#c39235"}}>Description de la récompense</b>
    {expanded&&<><div style={{fontWeight:600,marginTop:8}}>Partagez des captures d’écran de retrait pour gagner des récompenses en espèces</div><div style={{color:"#777",lineHeight:1.6,marginTop:5}}>Envoyez votre dernière capture d’écran de retrait réussi dans la zone de commentaires, et vous recevrez une récompense de 100-100000 FCFA immédiatement après validation.</div></>}
   </button>
   {posts.map((post,i)=><article key={i} className="ayala-card" style={{marginTop:13,overflow:"hidden"}}>
    <div style={{padding:"16px 15px 5px",display:"flex",alignItems:"center",gap:10}}><div className="ayala-avatar" style={{width:45,height:45}}>I</div><b>{post.member}</b><b style={{marginLeft:"auto",color:"#5aa477",fontSize:18}}>{post.amount}</b></div>
    <div style={{padding:"8px 16px 14px",fontSize:13}}>{post.description}</div>
    <div style={{margin:"0 16px 14px",height:160,borderRadius:8,background:"#20232a",display:"grid",placeItems:"center",color:"#aaa",fontSize:13}}>Preuve non fournie dans l’aperçu</div>
    <div style={{borderTop:"1px solid #f2f2f2",padding:"12px 16px",color:"#a4a5a8",fontSize:12}}>{post.date}</div>
   </article>)}
  </div>
 </div><Support/><BottomNav active="Forum"/><Toast message={message} onClose={clear}/></Frame>
}
