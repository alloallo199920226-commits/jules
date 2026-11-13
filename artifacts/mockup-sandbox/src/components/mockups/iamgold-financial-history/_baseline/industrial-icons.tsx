import { useId, type CSSProperties, type ReactNode, type SVGProps } from 'react';
import './industrial-icons.css';

export type IndustrialIconName =
  | 'profile' | 'country' | 'phone' | 'lock' | 'invite' | 'verify' | 'eye' | 'eyeOff'
  | 'support' | 'join' | 'login' | 'secure' | 'swift' | 'help' | 'arrow' | 'home'
  | 'wallet' | 'deposit' | 'withdraw' | 'orders' | 'team' | 'send' | 'settings' | 'clock'
  | 'gold' | 'camera' | 'share' | 'logout' | 'chevron' | 'close' | 'check' | 'message'
  | 'coin' | 'gift' | 'truck' | 'excavator' | 'mine' | 'nugget' | 'equipment' | 'plant'
  | 'activity' | 'flame' | 'minus' | 'plus' | 'card' | 'sun' | 'info' | 'key' | 'alert'
  | 'arrowLeft' | 'chevronRight' | 'loader' | 'conveyor' | 'refinery' | 'furnace'
  | 'pour' | 'machine' | 'ore' | 'productionlot' | 'mines' | 'diamond' | 'rewards'
   | 'wheel' | 'crown' | 'bullion' | 'bullionStack' | 'withdrawalHand' | 'mobileMoney' | 'email'
   | 'coinRise' | 'engineers' | 'oreCluster' | 'taskClipboardCoins' | 'wheelGift' | 'calendar' | 'coins' | 'groupAdd' | 'copy' | 'target'
   | 'heart' | 'thumbsUp' | 'imagePlus' | 'paperclip' | 'download' | 'search';
// Messaging and media controls share the same faceted metallic treatment.

type Props = SVGProps<SVGSVGElement> & { name: IndustrialIconName; size?: number; color?: string; strokeWidth?: number };

const shapes: Record<IndustrialIconName, ReactNode> = {
  profile: <><circle cx="12" cy="8" r="3.4"/><path d="M5 20c.7-3.7 3-5.5 7-5.5s6.3 1.8 7 5.5"/><path className="ig-icon-gold-fill" d="M18.3 3.8v5.5m-2.8-2.8H21"/></>,
  country: <><circle cx="12" cy="12" r="8.2"/><path d="M3.8 12h16.4M12 3.8c2.3 2.2 3.4 4.9 3.4 8.2s-1.1 6-3.4 8.2C9.7 18 8.6 15.3 8.6 12s1.1-6 3.4-8.2z"/></>,
  phone: <><path d="m6.7 3.8 3 3.7-1.9 2a12.4 12.4 0 0 0 4.7 4.7l2-1.9 3.7 3-.9 3.1a1.8 1.8 0 0 1-2 1.3C9 18.8 5.2 15 4.3 8.7a1.8 1.8 0 0 1 1.3-2z"/></>,
  lock: <><rect x="4.5" y="10" width="15" height="11" rx="2"/><path d="M7.5 10V7a4.5 4.5 0 0 1 9 0v3"/><path className="ig-icon-gold-fill" d="M12 13v4"/></>,
  invite: <><path d="m9 14-1.8 1.8a3.5 3.5 0 0 1-5-5l3.4-3.4a3.5 3.5 0 0 1 5 0"/><path d="m15 10 1.8-1.8a3.5 3.5 0 0 1 5 5l-3.4 3.4a3.5 3.5 0 0 1-5 0"/><path d="m8.3 15.7 7.4-7.4"/></>,
  verify: <><path d="m12 2.5 7.2 3v5.1c0 4.5-2.4 7.5-7.2 9.5-4.8-2-7.2-5-7.2-9.5V5.5z"/><path className="ig-icon-gold-fill" d="m8.3 11.3 2.3 2.2 4.7-5"/></>,
  eye: <><path d="M2.5 12s3.1-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.1 5.5-9.5 5.5S2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.6"/></>,
  eyeOff: <><path d="m3 3 18 18M9.8 6.7c.7-.2 1.4-.2 2.2-.2 6.4 0 9.5 5.5 9.5 5.5a14.7 14.7 0 0 1-3 3.6M6.1 7.7A16 16 0 0 0 2.5 12s3.1 5.5 9.5 5.5c.9 0 1.8-.1 2.6-.4"/></>,
  support: <><path className="ig-icon-metal-edge" d="M3 13a9 9 0 0 1 18 0"/><path className="ig-icon-gold-fill" d="M3 11h4v7H5a2 2 0 0 1-2-2zm18 0h-4v7h2a2 2 0 0 0 2-2z"/><path className="ig-icon-metal-highlight" d="M4 12h1v4H4zm15 0h1v4h-1z"/><path d="M18 18c-.8 2-2.5 3-5 3"/></>,
  join: <><circle cx="9" cy="8" r="3.4"/><path d="M2.5 20c.6-3.6 2.8-5.4 6.5-5.4 2.8 0 4.7 1 5.8 3"/><path className="ig-icon-gold-fill" d="M18 13v7m-3.5-3.5h7"/></>,
  login: <><path d="M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6"/><path d="M10 12h10m-4-4 4 4-4 4"/></>,
  secure: <><path className="ig-icon-gold-fill" d="m12 2.5 7.2 3v5.1c0 4.5-2.4 7.5-7.2 9.5-4.8-2-7.2-5-7.2-9.5V5.5z"/><path className="ig-icon-metal-side" d="m12 4.3 5.4 2.2v4.1c0 3.5-1.7 5.9-5.4 7.7z"/><path className="ig-icon-metal-highlight" d="m7.5 6.9 3.2-1.4v1.2L7.5 8z"/><path d="m8.3 11.3 2.3 2.2 4.7-5"/></>,
  swift: <><path className="ig-icon-gold-fill" d="m13.2 1.8-7.5 11h5.5l-1.1 8.3 8.2-11.2h-5.7z"/></>,
  help: <><path d="M3 12a9 9 0 0 1 18 0"/><path d="M3 11h3v6H5a2 2 0 0 1-2-2zm18 0h-3v6h1a2 2 0 0 0 2-2zm-3 6c-.8 2-2.5 3-5 3"/></>,
  arrow: <><path d="M3 12h16m-6-6 6 6-6 6"/></>,
  home: <><path d="m3 10 9-7 9 7v10a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 20z"/><path d="M9 21v-7h6v7"/></>,
  wallet: <><path className="ig-icon-gold-fill" d="M4 6h15a2 2 0 0 1 2 2v10.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h13"/><path className="ig-icon-metal-side" d="M12 8h7a2 2 0 0 1 2 2v7h-9z"/><path className="ig-icon-metal-highlight" d="M5 5h13v2H5z"/><path d="M15 12h6m-5 .2a.8.8 0 1 0 0-.1"/></>,
  deposit: <><path className="ig-icon-gold-fill" d="m5 14 2-5h10l2 5-2 4H7z"/><path className="ig-icon-metal-side" d="M12 9h5l2 5-2 4h-5z"/><path className="ig-icon-metal-highlight" d="M8 9h8l1 2H7z"/><path d="M12 2v7m-3-3 3 3 3-3M4 20h16"/></>,
  withdraw: <><path className="ig-icon-gold-fill" d="M4 4h16v5H4z"/><path className="ig-icon-metal-side" d="M12 4h8v5h-8z"/><path className="ig-icon-metal-highlight" d="M5 5h14v1H5z"/><path d="M12 10v10m-4-4 4 4 4-4M2 3h20"/></>,
  orders: <><path className="ig-icon-gold-fill" d="M5 3h10l5 5v12a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path className="ig-icon-metal-side" d="M15 3v5h5v12a1 1 0 0 1-1 1h-7V3z"/><path className="ig-icon-metal-highlight" d="M6 5h7v1H6z"/><path d="M14 3v5h5M7 12h2m2 0h5M7 16h2m2 0h5"/></>,
  team: <><path className="ig-icon-gold-fill" d="M2 17.2c1.3-3 3.4-4.7 6.4-4.7 2.5 0 4.5 1.3 5.5 3.8 1-2.5 2.6-3.8 5-3.8 2.1 0 3.5 1.5 4.2 4.7v2.3H2z"/><path className="ig-icon-metal-side" d="M12 15.6c.8-2 2.3-3.1 4.5-3.1 2.4 0 4 1.5 4.8 4.7v2.3H12z"/><path className="ig-icon-metal-highlight" d="M4 17.3c1-2.2 2.5-3.3 4.5-3.3 2.2 0 3.7 1 4.5 3.3z"/><circle className="ig-icon-gold-fill" cx="8.2" cy="7.5" r="3.4"/><circle className="ig-icon-metal-side" cx="17.6" cy="8.8" r="2.7"/><path className="ig-icon-metal-highlight" d="M6.2 5.4c1-.9 2.8-.9 4 0v2.7h-4z"/><path className="ig-icon-metal-edge" d="M3 19.5h18"/><path className="ig-icon-metal-highlight" d="M4 20.5h16v1H4z"/></>,
  send: <><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></>,
  settings: <><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"/><path d="m19.4 13.5 1.3 1-1.5 2.6-1.6-.5a7.8 7.8 0 0 1-1.7 1l-.3 1.7h-3l-.4-1.7a7.8 7.8 0 0 1-1.7-1l-1.6.5-1.5-2.6 1.3-1a7 7 0 0 1 0-2l-1.3-1 1.5-2.6 1.6.5a7.8 7.8 0 0 1 1.7-1l.4-1.7h3l.3 1.7a7.8 7.8 0 0 1 1.7 1l1.6-.5 1.5 2.6-1.3 1a7 7 0 0 1 0 2Z"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></>,
  gold: <><path className="ig-icon-gold-fill" d="m4 7 8-4 8 4-2 11-6 3-6-3z"/><path d="m4 7 8 3 8-3M12 10v11M7 18l5-8 5 8"/></>,
  camera: <><path d="M3 8h4l2-3h6l2 3h4v12H3z"/><circle cx="12" cy="14" r="3.5"/></>,
  share: <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.7 10.6 6.6-4.2m-6.6 7 6.6 4.1"/></>,
  logout: <><path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5"/><path d="M13 16l4-4-4-4m4 4H8"/></>,
  chevron: <><path d="m8 10 4 4 4-4"/></>,
  chevronRight: <><path d="m9 5 7 7-7 7"/></>,
  arrowLeft: <><path d="M21 12H5m6 6-6-6 6-6"/></>,
  close: <><path d="m5 5 14 14M19 5 5 19"/></>,
  check: <><path d="m4 12 5 5L20 6"/></>,
  message: <><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 9 9 0 0 1-3.5-.7L4 20l1.2-3.6A7.3 7.3 0 0 1 4 12c0-4.1 3.6-7.5 8-7.5s8 3.4 8 7Z"/><path d="M8 11h8m-8 4h5"/></>,
  coin: <><circle cx="12" cy="12" r="9"/><path d="M15 8.5c-.8-.8-1.7-1.2-3-1.2-1.5 0-2.5.7-2.5 1.8 0 3 5.5 1.2 5.5 4.5 0 1.2-1.2 2.2-3 2.2-1.3 0-2.4-.4-3.2-1.3M12 5.5v13"/></>,
  gift: <><path className="ig-icon-gold-fill" d="M3 9h18v12H3z"/><path className="ig-icon-metal-side" d="M12 9h9v12h-9z"/><path className="ig-icon-metal-highlight" d="M2 6h20v4H2z"/><path d="M12 6v15"/><path className="ig-icon-metal-edge" d="M12 6H8.5a2 2 0 1 1 2-2c0 1.2 1.5 2 1.5 2Zm0 0h3.5a2 2 0 1 0-2-2c0 1.2-1.5 2-1.5 2Z"/><path d="M7 12h2m6 5h2"/></>,
  truck: <><path className="ig-icon-gold-fill" d="M1.5 6h10.8v9H2.5L1.5 6Z"/><path className="ig-icon-metal-side" d="m3.2 7.5 7.5 0v6H4.1z"/><path className="ig-icon-metal-highlight" d="m2.5 6.7 1.1.2 1.8 6.2-1.4.2z"/><path className="ig-icon-gold-fill" d="M12.3 9h5.2l4.8 4.2V17h-2.1m-5 0H9.4m-3.8 0H2v-2h10.3"/><path className="ig-icon-metal-edge" d="M12.5 10.4h4.3l3.2 3h-7.5z"/><circle className="ig-icon-wheel" cx="7.6" cy="17.2" r="2.5"/><circle className="ig-icon-wheel" cx="18" cy="17.2" r="2.5"/><circle className="ig-icon-wheel-hub" cx="7.6" cy="17.2" r=".8"/><circle className="ig-icon-wheel-hub" cx="18" cy="17.2" r=".8"/><path d="M3 8.2h7"/></>,
  excavator: <><path className="ig-icon-metal-edge" d="m4 15 1.8-5h7.5l2.2 5z"/><path className="ig-icon-gold-fill" d="M5 14.5h11l2 3H8z"/><path className="ig-icon-metal-side" d="M7 11h5l2 3.5H8z"/><path className="ig-icon-metal-edge" d="m12.3 10.5 2.2-5 3.3-2m-3.3 2 3.3 3.3 3-1.2m-8.5 2V7h4l2.3 3.7"/><path d="M5 17.5h14"/><circle className="ig-icon-wheel" cx="7" cy="19" r="2"/><circle className="ig-icon-wheel" cx="17" cy="19" r="2"/><path className="ig-icon-metal-highlight" d="m18.3 7.5 2.5 1"/></>,
  mine: <><path className="ig-icon-gold-fill" d="m2 19 6-9 4 5 4-8 6 12z"/><path d="M7 19v-3h3v3m5 0v-4h3v4M6 8l2-3 2 3m5-1 2-4 2 4"/></>,
  nugget: <><path className="ig-icon-gold-fill" d="m3 14 3-7 5-3 6 2 4 6-4 7-8 2-6-3z"/><path d="m6 7 4 3 1-6m1 13 5-5 4 0m-10-2 5 2"/></>,
  equipment: <><path d="M4 20V8h16v12M2 8h20M7 8V4h10v4M8 12h2m4 0h2M8 16h2m4 0h2"/></>,
  plant: <><path className="ig-icon-gold-fill" d="M4 20V9h5V5h5v6h6v9z"/><path d="M2 20h20M7 9V5m0 0h4m-1 9h2m3 0h2"/></>,
  activity: <><path d="M3 12h4l2-7 4 14 3-8h5"/></>,
  flame: <><path d="M13 2c1 5-3 6-2 10 1-2 3-3 4-5 3 3 5 6 4 10a7 7 0 0 1-14 0c0-4 3-8 8-15Z"/><path className="ig-icon-gold-fill" d="M12 13c2 2 3 3 2.5 5a2.5 2.5 0 0 1-5 0c0-1.5 1-3 2.5-5Z"/></>,
  minus: <><path d="M5 12h14"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  card: <><rect x="2.5" y="4.5" width="19" height="15" rx="2"/><path d="M3 9h18m-14 5h4"/></>,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2m10-10h-2M4 12H2m17.1-7.1-1.4 1.4M6.3 17.7l-1.4 1.4m14.2 0-1.4-1.4M6.3 6.3 4.9 4.9"/></>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/></>,
  key: <><circle cx="8" cy="15" r="4"/><path d="m11 12 8-8 2 2-2 2 2 2-3 3-2-2-2 2"/></>,
  alert: <><path d="m12 3 10 18H2z"/><path d="M12 9v5m0 3h.01"/></>,
  loader: <><path className="ig-icon-metal-edge" d="m3 13 3-5h7l3 5"/><path className="ig-icon-gold-fill" d="M5 12h10l2 5H7z"/><path className="ig-icon-metal-side" d="M8 9h4l2 3H7z"/><path className="ig-icon-metal-edge" d="m15 13 4-2 2 1-2 2h-3"/><path d="M3 17h17"/><circle className="ig-icon-wheel" cx="8" cy="18.5" r="2.2"/><circle className="ig-icon-wheel" cx="17" cy="18.5" r="2.2"/><path className="ig-icon-metal-highlight" d="M9 9h2v2H9z"/></>,
  conveyor: <><path className="ig-icon-gold-fill" d="m3 15 5-8h3l-5 8zm6 0 5-8h3l-5 8zm6 0 5-8h2l-5 8z"/><path className="ig-icon-metal-edge" d="M2 16h20M5 17v3m14-3v3M3 20h18"/><circle className="ig-icon-wheel" cx="5" cy="16" r="1.2"/><circle className="ig-icon-wheel" cx="10" cy="16" r="1.2"/><circle className="ig-icon-wheel" cx="15" cy="16" r="1.2"/><circle className="ig-icon-wheel" cx="20" cy="16" r="1.2"/></>,
  refinery: <><path className="ig-icon-gold-fill" d="M3 20V9l4 3V8l4 4V4h4v8l3-3v11z"/><path className="ig-icon-metal-side" d="M15 5h2v5l-2 2z"/><path className="ig-icon-metal-edge" d="M4 8V5h2v5m11 2V6h2v5M2 20h20"/><path d="M7 15h2m3 0h2m3 0h2M7 18h2m3 0h2m3 0h2"/></>,
  furnace: <><path className="ig-icon-metal-edge" d="M5 21V7h14v14M3 7h18M7 7V4h10v3"/><path className="ig-icon-metal-side" d="M8 13h8v8H8z"/><path className="ig-icon-gold-fill" d="M12 19c-2.7-2.2.7-3.3 0-5 2.8 2 3.6 4.6 1.3 6.2-.4.3-.9.4-1.3.4z"/><path className="ig-icon-metal-highlight" d="M9 9h6v1H9z"/></>,
  pour: <><path className="ig-icon-metal-edge" d="M3 7h10l-1 4H5zM8 11v3"/><path className="ig-icon-gold-fill" d="M7 14h2v5H7z"/><path className="ig-icon-metal-highlight" d="M8 14c3 1 5 1 7 0v5H8z"/><path className="ig-icon-gold-fill" d="M15 14h5l-1.2 5h-5z"/><path d="m15 10 2-2 2 2m-5 12h8"/></>,
  machine: <><path className="ig-icon-metal-edge" d="M4 20V7h12v13M2 7h16M7 7V4h6v3"/><path className="ig-icon-gold-fill" d="M16 10h4v7h-4z"/><path className="ig-icon-metal-side" d="M17 11h2v5h-2z"/><circle className="ig-icon-wheel" cx="10" cy="13" r="3"/><circle className="ig-icon-wheel-hub" cx="10" cy="13" r="1"/><path d="M7 20h13m-8-7h4"/></>,
  ore: <><path className="ig-icon-gold-fill" d="m2 17 2-5 4-2 2-6 4 3 4-1 4 7-2 5-7 3-8-1z"/><path className="ig-icon-metal-side" d="m10 10 4-3 3 6-5 3z"/><path className="ig-icon-metal-highlight" d="m4 12 4-2 2 5-5 2z"/><path d="m8 10 2 5m7-2 4-1m-9 4 1 4"/></>,
  productionlot: <><path className="ig-icon-metal-edge" d="M4 4h13l3 3v13H4z"/><path className="ig-icon-metal-side" d="M17 4v4h4"/><path className="ig-icon-gold-fill" d="M7 11h3v3H7zm6 0h3v3h-3zm-6 5h3v2H7zm6 0h3v2h-3z"/><path d="M6 8h7"/></>,
  mines: <><path className="ig-icon-gold-fill" d="m2 19 5-8 3 4 4-9 3 5 5 8z"/><path className="ig-icon-metal-side" d="m10 15 4-9 3 5-5 5z"/><path className="ig-icon-metal-edge" d="M4 19v-3h3v3m8 0v-4h3v4"/><path d="m5 9 2-4 2 4m4-2 2-4 2 4"/></>,
  diamond: <><path className="ig-icon-metal-edge" d="m3 8 3-4h12l3 4-9 13z"/><path className="ig-icon-diamond-face" d="m3 8 4 0 5 13z"/><path className="ig-icon-diamond-mid" d="m7 8 5 0 5 0-5 13z"/><path className="ig-icon-diamond-shadow" d="m12 8 5 0 4 0-9 13z"/><path className="ig-icon-diamond-glint" d="M6 4h12l2 3H4z"/><path d="m7 8 5 13 5-13"/></>,
  rewards: <><path className="ig-icon-gold-fill" d="M4 9h16v12H4z"/><path className="ig-icon-metal-side" d="M12 9h8v12h-8z"/><path className="ig-icon-metal-highlight" d="M3 6h18v4H3z"/><path d="M12 6v15M12 6H8a2.2 2.2 0 1 1 2.2-2.2C10.2 5.1 12 6 12 6Zm0 0h4a2.2 2.2 0 1 0-2.2-2.2C13.8 5.1 12 6 12 6Z"/></>,
  wheel: <><circle className="ig-icon-wheel" cx="11" cy="9.5" r="8.4"/><circle className="ig-icon-gold-fill" cx="11" cy="9.5" r="7.1"/><path className="ig-icon-metal-side" d="M11 9.5V2.4a7.1 7.1 0 0 1 6.2 3.6z"/><path className="ig-icon-metal-highlight" d="m11 9.5 6.2-3.5a7.1 7.1 0 0 1 .2 7.1z"/><path className="ig-icon-gold-fill" d="m11 9.5 6.4 3.6a7.1 7.1 0 0 1-6.4 3.5z"/><path className="ig-icon-metal-side" d="M11 9.5v7.1a7.1 7.1 0 0 1-6.2-3.5z"/><path className="ig-icon-metal-highlight" d="M11 9.5 4.8 13a7.1 7.1 0 0 1 0-7z"/><path d="M11 2.4v14.2M4.8 6l12.4 7M4.8 13l12.4-7"/><circle className="ig-icon-wheel-hub" cx="11" cy="9.5" r="2"/><path className="ig-icon-metal-edge" d="m7 17 4 3 4-3M8 20h6"/><path className="ig-icon-gold-fill" d="M16 17h6v4h-6z"/><path className="ig-icon-metal-highlight" d="M18.5 17v4M16 19h6"/></>,
  crown: <><path className="ig-icon-gold-fill" d="m3 8 4 3 5-7 5 7 4-3-2 11H5z"/><path className="ig-icon-metal-side" d="m12 4 5 7 4-3-2 11h-7z"/><path className="ig-icon-metal-highlight" d="m4 8 3 2 5-6v5l-4 5H5z"/><path className="ig-icon-metal-edge" d="M5 19h14M3 8l4 3 5-7 5 7 4-3"/></>,
  bullion: <><path className="ig-icon-metal-edge" d="m3 14 3-7h12l3 7-3 5H6z"/><path className="ig-icon-gold-fill" d="m5 13 2-4h10l2 4-2 4H7z"/><path className="ig-icon-metal-side" d="m12 9h5l2 4-2 4h-5z"/><path className="ig-icon-metal-highlight" d="m7 9 2-2h8l-2 2z"/><path d="M8 12h2m4 3h2m-5-5 1 2"/></>,
  bullionStack: <><path className="ig-icon-metal-edge" d="m2 16 2-4h8l2 4-2 4H4z"/><path className="ig-icon-gold-fill" d="m4 15 1.5-2.5h5L12 15l-1.5 3H5.5z"/><path className="ig-icon-metal-side" d="m8 12.5h2.5L12 15l-1.5 3H8z"/><path className="ig-icon-metal-edge" d="m10 13 2-4h8l2 4-2 4h-8z"/><path className="ig-icon-gold-fill" d="m12 12 1.5-2.5h5L20 12l-1.5 3h-5z"/><path className="ig-icon-metal-side" d="M16 9.5h2.5L20 12l-1.5 3H16z"/><path className="ig-icon-metal-highlight" d="m6 8 2-4h8l2 4-2 4H8z"/><path className="ig-icon-gold-fill" d="m8 7 1.3-2.4h5.4L16 7l-1.3 3H9.3z"/><path className="ig-icon-metal-side" d="M12 4.6h2.7L16 7l-1.3 3H12z"/><path d="M9 6h4m-7 9h2m8-3h2"/></>,
  withdrawalHand: <><path className="ig-icon-gold-fill" d="M12 3v9m-3-3 3 3 3-3"/><path className="ig-icon-metal-highlight" d="M4 16.5c2.5-2.7 4.1-3.8 6.3-3.8h2.1c1.4 0 1.8 1.7.5 2.3l-1.4.7h5.2c1.3 0 1.8 1.8.5 2.4l-5.7 2.5H7.3z"/><path className="ig-icon-metal-side" d="m13 15.7 4-.1c1.4 0 1.8 1.8.5 2.4l-5.7 2.5H10z"/><path className="ig-icon-metal-edge" d="M3 15.5c2.7-2.9 4.5-4.1 7-4.1m-7 8.2h4.2"/></>,
  mobileMoney: <><path className="ig-icon-gold-fill" d="M3 7h15a2 2 0 0 1 2 2v11H5a2 2 0 0 1-2-2z"/><path className="ig-icon-metal-side" d="M12 9h8v11h-8z"/><path className="ig-icon-metal-highlight" d="M4 8h13v2H4z"/><rect className="ig-icon-wheel" x="6" y="12" width="4" height="6" rx="1"/><path d="M7.5 16.5h1m4-2h5m-5 3h4"/><circle className="ig-icon-wheel-hub" cx="8" cy="13" r=".35"/></>,
  email: <><path className="ig-icon-gold-fill" d="M3 5h18v14H3z"/><path className="ig-icon-metal-side" d="M12 5h9v14h-9z"/><path className="ig-icon-metal-highlight" d="M4 6h16v2H4z"/><path d="m4 8 8 6 8-6M4 17l5-5m11 5-5-5"/></>,
  coinRise: <><ellipse className="ig-icon-wheel" cx="6.8" cy="18.3" rx="4.2" ry="2.1"/><path className="ig-icon-gold-fill" d="M2.6 16.2v2.1c0 1.2 1.9 2.1 4.2 2.1s4.2-.9 4.2-2.1v-2.1"/><ellipse className="ig-icon-metal-highlight" cx="6.8" cy="16.2" rx="4.2" ry="2.1"/><ellipse className="ig-icon-wheel" cx="14.8" cy="19" rx="4.1" ry="2"/><path className="ig-icon-gold-fill" d="M10.7 16.9V19c0 1.1 1.8 2 4.1 2s4.1-.9 4.1-2v-2.1"/><ellipse className="ig-icon-metal-highlight" cx="14.8" cy="16.9" rx="4.1" ry="2"/><path d="m4 13 5-4 3 2 7-7m-5 0h5v5"/><path className="ig-icon-metal-edge" d="m15 15 3-3 3 3"/></>,
  calendar: <><path className="ig-icon-metal-edge" d="M5 3.5v4m14-4v4M3.5 8h17v12.5h-17z"/><path className="ig-icon-gold-fill" d="M4.5 8.5h15v10.8h-15z"/><path className="ig-icon-metal-side" d="M12 8.5h7.5v10.8H12z"/><path className="ig-icon-metal-highlight" d="M4.5 8.5h15v2h-15z"/><path d="M8 3.5v4m8-4v4M7.5 13h2m4 0h2m-8 3.2h2m4 0h2"/></>,
  coins: <><ellipse className="ig-icon-wheel" cx="7" cy="17.8" rx="4.5" ry="2.2"/><path className="ig-icon-gold-fill" d="M2.5 14.5v3.3c0 1.2 2 2.2 4.5 2.2s4.5-1 4.5-2.2v-3.3"/><ellipse className="ig-icon-metal-highlight" cx="7" cy="14.5" rx="4.5" ry="2.2"/><path className="ig-icon-metal-side" d="M3.2 16.2v1.5c0 .9 1.7 1.7 3.8 1.9v-1.5c-2.1-.2-3.8-1-3.8-1.9Z"/><ellipse className="ig-icon-wheel" cx="16.7" cy="17.6" rx="4.2" ry="2"/><path className="ig-icon-gold-fill" d="M12.5 14.5v3.1c0 1.1 1.9 2 4.2 2s4.2-.9 4.2-2v-3.1"/><ellipse className="ig-icon-metal-highlight" cx="16.7" cy="14.5" rx="4.2" ry="2"/><ellipse className="ig-icon-wheel" cx="12" cy="8.1" rx="4.5" ry="2.2"/><path className="ig-icon-gold-fill" d="M7.5 5.7v2.4c0 1.2 2 2.2 4.5 2.2s4.5-1 4.5-2.2V5.7"/><ellipse className="ig-icon-metal-highlight" cx="12" cy="5.7" rx="4.5" ry="2.2"/><path d="M9.5 5.7h5m-9.5 8.8h4m5.6 0h4"/></>,
  engineers: <><path className="ig-icon-gold-fill" d="M1.8 18.8c.4-3.2 2.2-4.8 5.3-4.8s4.9 1.6 5.3 4.8v2H1.8z"/><path className="ig-icon-metal-side" d="M11.6 18.8c.4-3.2 2.2-4.8 5.3-4.8s4.9 1.6 5.3 4.8v2h-10.6z"/><circle className="ig-icon-wheel" cx="7.1" cy="9.1" r="3.1"/><circle className="ig-icon-gold-fill" cx="16.9" cy="9.1" r="3.1"/><path className="ig-icon-metal-edge" d="M3.3 7.8c.4-3 6.8-3 7.5 0l-.4 1.3H3.7zM13.2 7.8c.4-3 6.8-3 7.5 0l-.4 1.3h-6.7z"/><path className="ig-icon-metal-highlight" d="M5.4 6.2h3.4l1 1.7H4.4zm9.8 0h3.4l1 1.7h-5.4z"/><path d="M5.1 16.4h3.8m6.2 0h3.8"/></>,
  oreCluster: <><path className="ig-icon-gold-fill" d="m1.8 17.3 2-4.4 3.1-1.1 1.7-5 4.2 1.1 2.5 4-1.1 6-4.4 2.2-6.1-.5z"/><path className="ig-icon-metal-side" d="m9 11.8 3.8-4 3.7 1.1 2.8 5.1-1.2 4.8-5.4 1.5-4.4-2.8z"/><path className="ig-icon-metal-highlight" d="m14.1 17 2.1-5.2 3.1-1 3 3.2-1.4 4.4-4.5 2.5-3.4-1.7z"/><path d="m4 13 3-1.2m4.3 1.5 2.8-2.7m3.1 2.2 2.6-.8M5 17l3.1 1m7.5 1.2 2.3-1"/></>,
  taskClipboardCoins: <><path className="ig-icon-metal-edge" d="M5 4h10l2 2v13H5z"/><path className="ig-icon-gold-fill" d="M6 5h8.5L16 6.5V18H6z"/><path className="ig-icon-metal-side" d="M14.5 5v2H16v11h-3.5V5z"/><path className="ig-icon-wheel" d="M8 9h1.2m1.8 0h3.1M8 12.2h1.2m1.8 0h3.1M8 15.4h1.2m1.8 0h3.1"/><path d="m7.8 9 .4.4.7-.8m-1.1 4 .4.4.7-.8m-1.1 4 .4.4.7-.8"/><path className="ig-icon-metal-edge" d="m19.1 3.1 2.2 1.2-5.4 10.4-2.4 1.2.2-2.8z"/><path className="ig-icon-metal-highlight" d="m14.1 13.1 1.7.9-1.4 1.9-.9.4z"/><ellipse className="ig-icon-wheel" cx="5.2" cy="20.2" rx="3.2" ry="1.5"/><path className="ig-icon-gold-fill" d="M2 20.2v1.4c0 .8 1.4 1.4 3.2 1.4s3.2-.6 3.2-1.4v-1.4"/><ellipse className="ig-icon-metal-highlight" cx="5.2" cy="20.2" rx="3.2" ry="1.5"/><path d="M2 21.2c0 .8 1.4 1.4 3.2 1.4s3.2-.6 3.2-1.4"/></>,
  wheelGift: <><circle className="ig-icon-wheel" cx="9.2" cy="9.3" r="8"/><circle className="ig-icon-gold-fill" cx="9.2" cy="9.3" r="6.8"/><path className="ig-icon-metal-side" d="M9.2 9.3V2.5a6.8 6.8 0 0 1 5.9 3.4z"/><path className="ig-icon-metal-highlight" d="m9.2 9.3 5.9-3.4a6.8 6.8 0 0 1 .3 6.8z"/><path className="ig-icon-gold-fill" d="m9.2 9.3 6.2 3.4a6.8 6.8 0 0 1-6.2 3.4z"/><path className="ig-icon-metal-side" d="M9.2 9.3v6.8a6.8 6.8 0 0 1-5.9-3.4z"/><path className="ig-icon-metal-highlight" d="M9.2 9.3 3.3 12.7a6.8 6.8 0 0 1 0-6.8z"/><path d="M9.2 2.5v13.6m-5.9-10 11.8 6.6M3.3 12.7l11.8-6.8"/><circle className="ig-icon-wheel-hub" cx="9.2" cy="9.3" r="1.7"/><path className="ig-icon-metal-edge" d="m5.5 17 3.7 2.7 3.8-2.7"/><path className="ig-icon-gold-fill" d="M16 16h6v6h-6z"/><path className="ig-icon-metal-highlight" d="M19 16v6m-3-3h6"/><path className="ig-icon-metal-edge" d="M19 16c-2.1-1.6-3.8-1.1-3.7.2.1 1.2 1.9 1.5 3.7-.2Zm0 0c2.1-1.6 3.8-1.1 3.7.2-.1 1.2-1.9 1.5-3.7-.2Z"/></>,
  groupAdd: <><circle className="ig-icon-gold-fill" cx="8" cy="8" r="3.1"/><circle className="ig-icon-metal-side" cx="16.7" cy="9" r="2.6"/><path className="ig-icon-gold-fill" d="M2.2 18.8c.4-3.3 2.2-5 5.8-5s5.4 1.7 5.8 5v1H2.2zm11.2-3.3c.8-1.2 1.9-1.8 3.7-1.8 2.9 0 4.4 1.5 4.7 4.5v1.6h-7.1"/><path className="ig-icon-metal-highlight" d="M6 6.5c1-.9 2.8-.8 3.8 0v2.1H6z"/><path className="ig-icon-metal-edge" d="M4 19.4h8.5m1-4.1c.8-1 1.9-1.5 3.6-1.5"/><circle className="ig-icon-wheel" cx="19" cy="18.7" r="3.7"/><path className="ig-icon-metal-highlight" d="M19 16.5v4.4m-2.2-2.2h4.4"/></>,
  copy: <><rect className="ig-icon-gold-fill" x="8" y="6" width="12" height="15" rx="1.8"/><path className="ig-icon-metal-side" d="M14 6h6v13h-6z"/><path className="ig-icon-metal-highlight" d="M10 8h8v1.3h-8z"/><path className="ig-icon-metal-edge" d="M16 6V4.7A1.7 1.7 0 0 0 14.3 3H5.7A1.7 1.7 0 0 0 4 4.7v11.6A1.7 1.7 0 0 0 5.7 18H8"/></>,
  target: <><circle className="ig-icon-wheel" cx="11" cy="12" r="8.2"/><circle className="ig-icon-gold-fill" cx="11" cy="12" r="5.7"/><circle className="ig-icon-metal-highlight" cx="11" cy="12" r="2.7"/><path className="ig-icon-metal-edge" d="m10.2 12.8 7.3-7.3m-2.3 0h2.3v2.3"/><path className="ig-icon-gold-fill" d="m16 4 4 4-1.5 1.5-4-4z"/><path className="ig-icon-metal-edge" d="m17.5 8.5 2 2"/></>,
  heart: <><path className="ig-icon-gold-fill" d="M20.4 5.8a5 5 0 0 0-7.1 0L12 7.1l-1.3-1.3a5 5 0 0 0-7.1 7.1L12 21l8.4-8.1a5 5 0 0 0 0-7.1Z"/><path className="ig-icon-metal-highlight" d="M5.2 7.1a3 3 0 0 1 4.2 0l1.1 1.1-5.3 5.1a4.1 4.1 0 0 1 0-6.2Z"/></>,
  thumbsUp: <><path className="ig-icon-gold-fill" d="M8 10 12.4 3c.7-1 2.3-.5 2.2.8l-.4 4.1h4.3a2.2 2.2 0 0 1 2.1 2.8l-2 8a2.3 2.3 0 0 1-2.2 1.7H8z"/><path className="ig-icon-metal-side" d="M14.2 8h4.3a2.2 2.2 0 0 1 2.1 2.8l-2 8a2.3 2.3 0 0 1-2.2 1.7h-2.2z"/><path d="M3 10h5v10H3z"/></>,
  imagePlus: <><rect className="ig-icon-gold-fill" x="3" y="4" width="18" height="16" rx="2"/><path className="ig-icon-metal-side" d="M12 4h7a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-7z"/><circle cx="8.5" cy="9" r="1.5"/><path d="m4 17 5-5 3 3 3-3 5 5m-8-7v5m-2.5-2.5h5"/></>,
  paperclip: <><path d="m8.5 12.5 6.4-6.4a3.4 3.4 0 0 1 4.8 4.8l-8.5 8.5a5 5 0 0 1-7.1-7.1l8.1-8.1"/><path className="ig-icon-gold-fill" d="m7.4 13.6 7.5-7.5a2 2 0 0 1 2.8 2.8l-7.5 7.5a3.2 3.2 0 0 1-4.5-4.5z"/></>,
  download: <><path className="ig-icon-gold-fill" d="M10 3h4v9l3-3 2.8 2.8L12 20l-7.8-8.2L7 9l3 3z"/><path d="M4 21h16"/></>,
  search: <><circle className="ig-icon-gold-fill" cx="10.8" cy="10.8" r="6.8"/><path className="ig-icon-metal-side" d="M10.8 4a6.8 6.8 0 0 1 0 13.6z"/><path d="m16 16 5 5"/></>,
};

export function IndustrialIcon({ name, size = 22, color, strokeWidth = 1.8, className, ...props }: Props) {
  const instanceId = useId().replace(/:/g, '');
  const metallicStyle = {
    '--iamgold-metal': `url(#iamgold-metal-${instanceId})`,
    '--iamgold-metal-shadow': `url(#iamgold-metal-shadow-${instanceId})`,
    '--iamgold-metal-light': `url(#iamgold-metal-light-${instanceId})`,
  } as CSSProperties;
  return <svg className={['iamgold-icon', className].filter(Boolean).join(' ')} width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke={color ?? 'currentColor'} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
    {...props} aria-hidden="true" focusable="false" style={{ ...metallicStyle, ...props.style }}>
    <defs>
      <linearGradient id={`iamgold-metal-${instanceId}`} x1="3" y1="2" x2="19" y2="22" gradientUnits="userSpaceOnUse"><stop stopColor="#fff4c7"/><stop offset=".24" stopColor="#f4d577"/><stop offset=".48" stopColor="#c68c24"/><stop offset=".73" stopColor="#8b5b12"/><stop offset="1" stopColor="#f8df96"/></linearGradient>
      <linearGradient id={`iamgold-metal-shadow-${instanceId}`} x1="1" y1="0" x2="22" y2="20" gradientUnits="userSpaceOnUse"><stop stopColor="#fff0a8"/><stop offset=".32" stopColor="#c28b24"/><stop offset=".7" stopColor="#84530f"/><stop offset="1" stopColor="#dcae4b"/></linearGradient>
      <linearGradient id={`iamgold-metal-light-${instanceId}`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff9dd"/><stop offset="1" stopColor="#e9c779"/></linearGradient>
    </defs>
    {shapes[name]}</svg>;
}

export function MissionMedal({ number, size = 54, className }: { number: number; size?: number; className?: string }) {
  const instanceId = useId().replace(/:/g, '');
  return <svg className={['iamgold-mission-medal', className].filter(Boolean).join(' ')} width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={`Mission ${String(number).padStart(2, '0')}`}>
    <defs>
      <linearGradient id={`medal-face-${instanceId}`} x1="12" y1="7" x2="53" y2="57" gradientUnits="userSpaceOnUse"><stop stopColor="#fff2b8"/><stop offset=".25" stopColor="#e4b84d"/><stop offset=".56" stopColor="#9d6413"/><stop offset=".78" stopColor="#f8d978"/><stop offset="1" stopColor="#80500c"/></linearGradient>
      <linearGradient id={`medal-rim-${instanceId}`} x1="8" y1="5" x2="56" y2="58" gradientUnits="userSpaceOnUse"><stop stopColor="#fff8d7"/><stop offset=".3" stopColor="#dca937"/><stop offset=".62" stopColor="#71450a"/><stop offset="1" stopColor="#f7da81"/></linearGradient>
      <filter id={`medal-shadow-${instanceId}`} x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="3" stdDeviation="2" floodColor="#000" floodOpacity=".58"/></filter>
    </defs>
    <g filter={`url(#medal-shadow-${instanceId})`}>
      <path d="M10 16c-4.4 4.8-6.4 10-6.1 15.3.2 5.6 2.4 10.2 6.2 14" fill="none" stroke={`url(#medal-rim-${instanceId})`} strokeWidth="1.7" strokeLinecap="round"/>
      <g fill={`url(#medal-rim-${instanceId})`} stroke="#79500e" strokeWidth=".65" strokeLinejoin="round">
        <path d="M10.8 18.8c-3.5-4.6-6.5-4.8-8.2-2.6 1.7 3.4 4.7 4.5 8.2 2.6Z"/>
        <path d="M7.4 23.1c-4.6-3.4-7.2-2.4-7.6.4 2.2 3 5.1 3.4 7.8.7Z"/>
        <path d="M6.1 28.3c-4.6-2.1-7.1-.4-6.5 2.4 2.7 2.5 5.3 2.1 7.1-1Z"/>
        <path d="M6.4 34c-4.3-.8-6.3 1.3-4.8 3.7 3.1 1.7 5.3.7 6.4-2.1Z"/>
        <path d="M8.5 39.1c-3.6.5-4.8 2.9-2.6 4.7 3.2.6 4.8-1 4.8-3.6Z"/>
        <path d="M53.2 18.8c3.5-4.6 6.5-4.8 8.2-2.6-1.7 3.4-4.7 4.5-8.2 2.6Z"/>
        <path d="M56.6 23.1c4.6-3.4 7.2-2.4 7.6.4-2.2 3-5.1 3.4-7.8.7Z"/>
        <path d="M57.9 28.3c4.6-2.1 7.1-.4 6.5 2.4-2.7 2.5-5.3 2.1-7.1-1Z"/>
        <path d="M57.6 34c4.3-.8 6.3 1.3 4.8 3.7-3.1 1.7-5.3.7-6.4-2.1Z"/>
        <path d="M55.5 39.1c3.6.5 4.8 2.9 2.6 4.7-3.2.6-4.8-1-4.8-3.6Z"/>
      </g>
      <path d="m8.3 19.4 2 1.1M5.8 24.1l2.1 1M4.8 29.5l2.2.5M5 35l2.2-.1m1 5.1 1.9-.7m44.1-20-2 1.1m4.5 3.7-2.1 1m3.1 4.6-2.2.5m2 5.1-2.2-.1m-1 5.1-1.9-.7" fill="none" stroke="#fff0b1" strokeWidth=".65" strokeLinecap="round"/>
      <circle cx="32" cy="31" r="23.5" fill={`url(#medal-rim-${instanceId})`} stroke="#fff0ae" strokeWidth="1.4"/>
      <circle cx="32" cy="31" r="19.1" fill={`url(#medal-face-${instanceId})`} stroke="#8e5b11" strokeWidth="1.3"/>
      <circle cx="32" cy="31" r="16.6" fill="none" stroke="#ffe9a2" strokeWidth=".8" opacity=".85"/>
      <path className="iamgold-medal-glint" d="M19.4 22.2c4.6-6.2 13.3-8.9 20.4-6.2l-8.6 9.1-11.8-2.9Z" fill="#fff9dd" opacity=".2"/>
      <path d="M23 48 20 60l12-6 12 6-3-12" fill={`url(#medal-face-${instanceId})`} stroke="#a66e16" strokeWidth="1.2" strokeLinejoin="round"/>
      <text x="32" y="39" textAnchor="middle" fill="#fff4c7" stroke="#80500b" strokeWidth=".8" paintOrder="stroke" fontFamily="Georgia,serif" fontWeight="700" fontSize={number >= 10 ? 19 : 26}>{number}</text>
      <path d="M20 19c6-5 18-6 25 0" fill="none" stroke="#fff7d5" strokeWidth="1.1" opacity=".72"/>
    </g>
  </svg>;
}

export type RegisterIconName = 'profile' | 'country' | 'phone' | 'person' | 'lock' | 'invite' | 'verify' | 'eye' | 'eye-off' | 'support' | 'join' | 'login' | 'secure' | 'swift' | 'help' | 'arrow';
const registrationShapes: Record<RegisterIconName, ReactNode> = {
  profile: <><circle cx="10" cy="7" r="3.2"/><path d="M3.4 17.2c.6-3.1 2.8-4.7 6.6-4.7s6 1.6 6.6 4.7"/><path className="ig-metal-fill" d="M16.6 3.2v5.6M13.8 6h5.6"/></>,
  country: <><circle cx="11" cy="11" r="7.5"/><path d="M3.8 11h14.4M11 3.5c2.2 2.1 3.1 4.6 3.1 7.5s-.9 5.4-3.1 7.5c-2.2-2.1-3.1-4.6-3.1-7.5S8.8 5.6 11 3.5z"/></>,
  phone: <><path d="M6.1 3.7 8.5 7l-1.6 1.8a12 12 0 0 0 4.3 4.3l1.8-1.6 3.3 2.4-.9 3a1.5 1.5 0 0 1-1.7 1.1C8.2 17.1 4 12.9 3.1 7.4A1.5 1.5 0 0 1 4.2 5.7z"/></>,
  person: <><circle cx="10.8" cy="7" r="3.3"/><path d="M4 18c.5-3.5 2.7-5.3 6.8-5.3s6.2 1.8 6.7 5.3"/></>,
  lock: <><rect x="4.1" y="9" width="13.8" height="10" rx="2"/><path d="M7.2 9V6.4a3.8 3.8 0 0 1 7.6 0V9"/><path className="ig-metal-fill" d="M11 12.3v3.4"/></>,
  invite: <><path d="M8.1 13.9 6.7 15.3a3.2 3.2 0 0 1-4.5-4.5l3-3a3.2 3.2 0 0 1 4.5 0"/><path d="m13.9 8.1 1.4-1.4a3.2 3.2 0 0 1 4.5 4.5l-3 3a3.2 3.2 0 0 1-4.5 0"/><path d="m7.5 12.5 5-5"/></>,
  verify: <><path d="m11 2.5 7 2.8v5.2c0 4.3-2.4 7.1-7 9-4.6-1.9-7-4.7-7-9V5.3z"/><path className="ig-metal-fill" d="m7.8 10.8 2.1 2.1 4.4-4.6"/></>,
  eye: <><path d="M2.5 11s3-5.4 8.5-5.4 8.5 5.4 8.5 5.4-3 5.4-8.5 5.4S2.5 11 2.5 11z"/><circle cx="11" cy="11" r="2.4"/></>,
  'eye-off': <><path d="m3 3 16 16M8.4 5.9A9 9 0 0 1 11 5.6c5.5 0 8.5 5.4 8.5 5.4a14 14 0 0 1-2.5 3.1M5.4 6.9A15 15 0 0 0 2.5 11s3 5.4 8.5 5.4c.9 0 1.7-.1 2.4-.4"/></>,
  support: <><path d="M3 11a8 8 0 0 1 16 0"/><path d="M3.2 10.6h2.6v5H4.6A1.6 1.6 0 0 1 3 14v-2.1a1.3 1.3 0 0 1 .2-1.3zM18.8 10.6h-2.6v5h1.2A1.6 1.6 0 0 0 19 14v-2.1a1.3 1.3 0 0 1-.2-1.3zM16.2 16.1c-.7 1.2-1.9 1.8-3.8 1.8"/></>,
  join: <><circle cx="8" cy="7" r="3"/><path d="M2.5 17.8c.5-3 2.3-4.5 5.5-4.5 2.4 0 4 .8 4.9 2.4"/><path className="ig-metal-fill" d="M16 11.2v6.5M12.8 14.5h6.4"/></>,
  login: <><path d="M11.5 4H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h6.5"/><path d="M9 11h10m-4-4 4 4-4 4"/></>,
  secure: <><path d="m11 2.5 7 2.8v5.2c0 4.3-2.4 7.1-7 9-4.6-1.9-7-4.7-7-9V5.3z"/><path className="ig-metal-fill" d="m7.8 10.8 2.1 2.1 4.4-4.6"/></>,
  swift: <><path className="ig-metal-fill" d="m12.5 1.8-7 10h5l-1 7.4 7.2-10h-5.1z"/></>,
  help: <><path d="M3 11a8 8 0 0 1 16 0"/><path d="M3.2 10.6h2.6v5H4.6A1.6 1.6 0 0 1 3 14v-2.1a1.3 1.3 0 0 1 .2-1.3zM18.8 10.6h-2.6v5h1.2A1.6 1.6 0 0 0 19 14v-2.1a1.3 1.3 0 0 1-.2-1.3zM16.2 16.1c-.7 1.2-1.9 1.8-3.8 1.8"/></>,
  arrow: <><path d="M3 11h14m-5-6 6 6-6 6"/></>,
};

export function RegisterIcon({ name, size = 20 }: { name: RegisterIconName; size?: number }) {
  return <svg className="ig-register-icon" width={size} height={size} viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{registrationShapes[name]}</svg>;
}

type AliasProps = Omit<Props, 'name'>;
function alias(name: IndustrialIconName) {
  return function IndustrialAlias(props: AliasProps) { return <IndustrialIcon name={name} {...props}/>; };
}

export const ArrowLeft = alias('arrowLeft');
export const Headset = alias('support');
export const House = alias('home');
export const CircleDollarSign = alias('coin');
export const MessageCircle = alias('message');
export const UserRound = alias('profile');
export const Gift = alias('gift');
export const HandCoins = alias('withdraw');
export const ClipboardList = alias('orders');
export const Users = alias('team');
export const Send = alias('send');
export const Settings = alias('settings');
export const Clock3 = alias('clock');
export const Gem = alias('gold');
export const Camera = alias('camera');
export const Share2 = alias('share');
export const LogOut = alias('logout');
export const ChevronDown = alias('chevron');
export const ChevronRight = alias('chevronRight');
export const Heart = alias('heart');
export const ThumbsUp = alias('thumbsUp');
export const ImagePlus = alias('imagePlus');
export const Paperclip = alias('paperclip');
export const Download = alias('download');
export const Search = alias('search');
export const CircleX = alias('close');
export const Eye = alias('eye');
export const EyeOff = alias('eyeOff');
export const Info = alias('info');
export const KeyRound = alias('key');
export const LockKeyhole = alias('lock');
export const Activity = alias('activity');
export const Flame = alias('flame');
export const Minus = alias('minus');
export const Plus = alias('plus');
export const Check = alias('check');
export const CreditCard = alias('card');
export const Link2 = alias('invite');
export const Sun = alias('sun');
export const PhoneCall = alias('phone');
export const AlertCircle = alias('alert');
export const Diamond = alias('diamond');
export const Crown = alias('crown');
export const Bullion = alias('bullion');
export const Wheel = alias('wheel');
export const Loader = alias('loader');
export const Conveyor = alias('conveyor');
export const Refinery = alias('refinery');
export const Furnace = alias('furnace');
export const Pour = alias('pour');
export const Machine = alias('machine');
export const Ore = alias('ore');
export const ProductionLot = alias('productionlot');
export const Mines = alias('mines');
export const Rewards = alias('rewards');
export const WithdrawalHand = alias('withdrawalHand');
export const MobileMoneyIcon = alias('mobileMoney');
export const CoinRise = alias('coinRise');
export const Engineers = alias('engineers');
