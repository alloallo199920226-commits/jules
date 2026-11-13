import React,{useEffect,useState} from "react";
import { Frame,Header,Support,Modal,Toast,useNotice,Icons } from "./_shared";

export default function Publish(){
 const [consent,setConsent]=useState(false);
 const [modal,setModal]=useState(true);
 const [content,setContent]=useState("");
 const [file,setFile]=useState<File|null>(null);
 const [previewUrl,setPreviewUrl]=useState("");
 const {message,setMessage,clear}=useNotice();
 useEffect(()=>{
  if(!file){setPreviewUrl("");return}
  const url=URL.createObjectURL(file);
  setPreviewUrl(url);
  return()=>URL.revokeObjectURL(url);
 },[file]);
 const publish=()=>{
  if(!consent){setModal(true);return}
  if(!content.trim()){setMessage("Veuillez saisir le contenu avant de continuer.");return}
  if(!file){setMessage("Ajoutez une image de preuve locale pour continuer.");return}
  setMessage("Aucune publication effectuée : le service de publication n’est pas connecté.");
 };
 return <Frame>
  <Header title="Publier" help/>
  <div className="ayala-scroll" style={{padding:"15px 15px 20px"}}>
   <section className="ayala-card" style={{padding:"21px 20px",minHeight:424}}>
    <label htmlFor="ayala-post-content" style={{fontWeight:600}}>Contenu</label>
    <textarea id="ayala-post-content" value={content} onChange={e=>setContent(e.target.value)} placeholder="Veuillez entrer le contenu" style={{display:"block",width:"100%",height:178,resize:"none",marginTop:10,border:"1px solid #e7e8ea",borderRadius:8,background:"#fafbfc",padding:15,fontFamily:"inherit",fontSize:14}}/>
    <b style={{display:"block",marginTop:24,lineHeight:1.3}}>Preuve de retrait de la plateforme de téléchargement et de la banque</b>
    <label htmlFor="ayala-proof-image" style={{margin:"12px 10px",width:100,height:100,border:"1px dashed #d8dadd",borderRadius:10,background:"#fafbfc",color:"#b7bbc1",display:"grid",placeItems:"center",overflow:"hidden",cursor:"pointer"}}>
     {previewUrl?<img src={previewUrl} alt="Aperçu local de la preuve sélectionnée" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<Icons.Camera size={30}/>}
    </label>
    <input id="ayala-proof-image" type="file" accept="image/*" onChange={e=>setFile(e.currentTarget.files?.[0]||null)} style={{position:"absolute",width:1,height:1,opacity:0}}/>
    <div style={{fontSize:11,color:"#969ba4",marginLeft:10}}>Image locale uniquement — aucun transfert</div>
   </section>
   <button className="ayala-soft-button" onClick={publish} style={{width:"100%",height:51,marginTop:19}}>Publier</button>
  </div>
  <Support/>
  {modal&&<Modal onClose={()=>setModal(false)}>
   <div className="ayala-modal-symbol"><Icons.Gift size={34}/></div>
   <h2>Partagez des captures d’écran de retrait pour recevoir des récompenses en espèces</h2>
   <p>Envoyez une capture d’écran du dernier retrait réussi dans la section des commentaires, et une fois approuvé, vous recevrez immédiatement une récompense de 100-100000 FCFA</p>
   <label style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,fontSize:12,color:"#777",marginBottom:15}}><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>J’ai compris</label>
   <button className="ayala-soft-button" style={{width:"100%",opacity:consent?1:.55,cursor:consent?"pointer":"not-allowed"}} disabled={!consent} onClick={()=>setModal(false)}>J’ai compris</button>
  </Modal>}
  <Toast message={message} onClose={clear}/>
 </Frame>
}
