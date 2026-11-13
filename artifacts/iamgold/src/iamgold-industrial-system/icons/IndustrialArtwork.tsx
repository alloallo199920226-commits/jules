export type IndustrialArtworkName =
  | 'bullion' | 'coin-rise' | 'engineers' | 'telegram'
  | 'wheel-gift' | 'task-rewards' | 'ore' | 'banner-ore' | 'banner-bullion';

/** Decorative illustrations extracted from the user's supplied brand artwork.
 * All labels, navigation, amounts and interaction states remain live HTML.
 */
export function IndustrialArtwork({ name }: { name: IndustrialArtworkName }) {
  return <img
    className={`ig-industrial-art ig-industrial-art-${name}`}
    src={`${import.meta.env.BASE_URL}iamgold-industrial-art/${name}.webp`}
    alt=""
    aria-hidden="true"
    decoding="async"
    draggable={false}
  />;
}
