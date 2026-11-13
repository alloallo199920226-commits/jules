export const industrialTokens = {
  colors: {
    midnight: '#07172e', industrialNavy: '#0b2443', sapphire: '#123b65',
    champagne: '#e9c778', metallicGold: '#d5a33b', brightGold: '#ffd978',
    platinum: '#f7f8fa', silver: '#dce3ea',
  },
  spacing: { edge: 12, panelGap: 12, detailGap: 8, touchTarget: 44 },
  geometry: { frameStroke: 1.2, innerInset: 2.35, navChamfer: 8, investmentChamfer: 7, modalChamfer: 5 },
  lighting: { source: 'upper-left', specular: 'restrained' },
  investment: {
    cardMaxWidth: 470,
    modalMaxWidth: 610,
    referenceListRatio: '852 / 1846',
    referenceModalRatio: '1081 / 1455',
  },
} as const;
