import Link from "next/link";

export default function FilterChip({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count?: number;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "page" : undefined}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm transition ${
        active
          ? "border-navy bg-navy text-white"
          : "border-line bg-background hover:border-accent hover:text-accent"
      }`}
    >
      {label}
      {count !== undefined && <span className={active ? "text-white/70" : "text-muted"}>{count}</span>}
    </Link>
  );
}
