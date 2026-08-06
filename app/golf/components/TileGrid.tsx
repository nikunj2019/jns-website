import Link from "next/link";

export type Tile = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

/**
 * The 2×3 action grid on the home screen — the app's primary navigation.
 * Tiles are deliberately large: they get tapped with a glove on, in sunlight.
 */
export default function TileGrid({ tiles }: { tiles: Tile[] }) {
  return (
    <nav className="grid grid-cols-3 gap-3" aria-label="Main">
      {tiles.map((tile) => (
        <Link
          key={tile.href}
          href={tile.href}
          className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-cream-golf/12 bg-fairway-800 p-2 text-center transition-all hover:border-brass/50 hover:bg-fairway-700 active:scale-[0.97]"
        >
          <span className="text-brass-soft" aria-hidden="true">
            {tile.icon}
          </span>
          <span className="text-[0.62rem] font-medium uppercase leading-tight tracking-[0.1em] text-cream-golf/85">
            {tile.label}
          </span>
        </Link>
      ))}
    </nav>
  );
}
