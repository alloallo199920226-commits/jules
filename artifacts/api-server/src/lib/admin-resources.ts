import { randomBytes } from "node:crypto";
import { z } from "zod/v4";
import { fail } from "./administration";

const money=z.number().int().min(1).max(Number.MAX_SAFE_INTEGER);
const text=z.string().trim().min(1).max(160);
const product=z.object({
  name:text,price:money,dailyIncome:money,totalIncome:money,
  durationDays:z.number().int().min(1).max(3650),
  category:z.enum(["stable","wellbeing","activity"]).default("stable"),
  code:z.string().regex(/^[A-Z0-9_-]{2,32}$/).optional(),imageClass:z.string().max(200).default(""),
}).strict().refine(p=>p.totalIncome>=p.dailyIncome&&p.totalIncome<=p.dailyIncome*p.durationDays,"Revenus incompatibles avec la durée.");
const channel=z.object({
  country:text,countryCode:z.string().regex(/^\+\d{1,4}$/),operatorName:text,receiverNumber:z.string().regex(/^\+?\d[\d -]{5,38}$/),
  receiverName:z.string().max(160).default(""),ussdTemplate:z.string().max(500).default(""),
  logoUrl:z.union([z.literal(""),z.url().refine(s=>s.startsWith("https://"))]).default(""),
  logoColor:z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#26352d"),logoText:z.string().max(160).default(""),
  isActive:z.boolean().default(true),sortOrder:z.coerce.number().int().min(0).max(99999).default(0),
}).strict();
const announcement=z.object({
  title:text,content:z.string().trim().min(1).max(8000),kind:z.enum(["announcement","notification"]).default("announcement"),
  audience:z.enum(["all","level"]).default("all"),audienceLevel:z.string().max(80).nullish(),
}).strict();
const gift=z.object({code:z.string().regex(/^[A-Z0-9_-]{16,64}$/).optional(),amount:money,
  maxRedemptions:z.number().int().min(1).max(10000),expiresInDays:z.number().int().min(1).max(365).default(30)}).strict();
export const resourceKinds:Record<string,{kind:string;key:string}>={
  products:{kind:"product",key:"products"},"gift-codes":{kind:"gift_code",key:"codes"},
  "payment-channels":{kind:"channel",key:"channels"},announcements:{kind:"announcement",key:"announcements"},
};
export function resourceInput(kind:string,body:unknown,prior:Record<string,unknown>={}):Record<string,unknown>{
  const keys:Record<string,string[]>={
    product:["name","price","dailyIncome","totalIncome","durationDays","category","code","imageClass"],
    channel:["country","countryCode","operatorName","receiverNumber","receiverName","ussdTemplate","logoUrl","logoColor","logoText","isActive","sortOrder"],
    announcement:["title","content","kind","audience","audienceLevel"],gift_code:["code","amount","maxRedemptions","expiresInDays"],
  };
  if(!body||typeof body!=="object"||Array.isArray(body))fail(400,"Champs invalides.");
  if(Object.keys(body).some(k=>!keys[kind]?.includes(k)))fail(400,"Champs inattendus.");
  const retained=Object.fromEntries(Object.entries(prior).filter(([k])=>keys[kind]?.includes(k)));
  const result=(kind==="product"?product:kind==="channel"?channel:kind==="announcement"?announcement:gift).safeParse({...retained,...body});
  if(!result.success)fail(400,"Vérifiez les champs : "+result.error.issues[0]?.message);
  const p=result.data as Record<string,unknown>;
  if(kind==="product")return {...prior,...p,code:p.code??prior.code??`LOT_${randomBytes(5).toString("hex").toUpperCase()}`,active:prior.active??true};
  if(kind==="gift_code")return {...p,code:p.code??randomBytes(16).toString("hex").toUpperCase(),active:true,redemptions:0,
    expiresAt:new Date(Date.now()+Number(p.expiresInDays)*86400000).toISOString()};
  if(kind==="announcement"){
    if(p.audience==="level"&&!p.audienceLevel)fail(400,"Précisez le niveau destinataire.");
    return {...prior,...p,status:prior.status??"draft",publishedAt:prior.publishedAt??null};
  }
  if(kind==="channel"){
    const countries:Record<string,string>={"Bénin":"+229","Togo":"+228","Niger":"+227","Tchad":"+235","Cameroun":"+237",
      "Sénégal":"+221","Burkina Faso":"+226","Côte d'Ivoire":"+225"};
    if(countries[String(p.country)]!==p.countryCode)fail(400,"Pays et indicatif incompatibles.");
  }
  return {...prior,...p};
}
