import { MdDividerEl } from "./elements";

export function Divider({ inset, className }: { inset?: boolean; className?: string }) {
  return <MdDividerEl inset={inset} className={className} />;
}
