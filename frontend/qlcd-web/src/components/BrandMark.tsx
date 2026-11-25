import { Building2 } from "lucide-react";

export default function BrandMark() {
  return <span aria-hidden="true"
    className="relative grid size-10 shrink-0 place-items-center rounded-xl border border-white/20 bg-brand text-white shadow-sm">
    <Building2 size={20} strokeWidth={1.75} />
    <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-white bg-gold" />
  </span>;
}
