# IAMGOLD icon usage audit

**Scope:** source scan of `src/pages`, `src/iamgold-industrial-system`, and `src/components`; no blanket restyle or icon replacement outside the missions reconstruction.

## Current system

- **Member navigation and route UI:** `src/components/industrial-icons.tsx` is the shared IAMGOLD SVG library; `src/pages/member/shared.tsx` exposes the route aliases used by the five-item bottom navigation. Industrial artwork is separately centralized in `src/iamgold-industrial-system/icons/IndustrialArtwork.tsx` for larger illustrations.
- **Mission-specific symbols:** `IndustrialIcon` includes dimensional `groupAdd`, `copy`, and `target` variants; `MissionMedal` supplies a numbered, volumetric laurel badge. The mission view also uses shared `bullionStack`, `gift`, `coins`, and `share` artwork. These remain SVG/HTML controls and information, not screenshot assets.
- **Route families observed using the central IAMGOLD system:** account/home, investments and finance, mission rewards, team/invitation, editorial/notice/help, lottery, profile/security, and publishing. Decorative artwork stays separate from functional icons.
- **Generic library imports found:** Lucide imports are confined to reusable UI primitives (`src/components/ui/*`). `FinancialTable.tsx` uses the IAMGOLD icon system; it is not a Lucide consumer. These primitive imports are not a blanket authorization to change every route. Migrate only when a page is intentionally touched and its component semantics/geometry can be preserved.

## Safe migration policy

1. Prefer `IndustrialIcon` or a purposeful component in the central icon/artwork library for new member-route work.
2. Keep icon hit-area, accessible label, action, data state, and page-specific visual treatment intact during any later migration.
3. Do not replace bespoke artwork or table/chart content with generic glyphs; do not change historical route styling as collateral.
4. Avoid emoji or Unicode symbols as interface icon substitutes. This reconstruction keeps every visible action as a real button and all unknown operational values as unknown.

This is a source-level inventory, not a claim that every icon on every route was visually compared or migrated. A complete route-by-route visual audit still requires browser evidence.
