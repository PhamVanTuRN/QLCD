import type { ReactNode } from "react";

/** Keep the pager outside both scroll axes. Native table semantics remain with the caller. */
export default function DataTable({ label, children, footer }: {
  label: string; children: ReactNode; footer?: ReactNode;
}) {
  return <div className="data-table">
    <div className="data-table-scroll" role="region" aria-label={label} tabIndex={0}>
      {children}
    </div>
    {footer}
  </div>;
}
