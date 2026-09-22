import { useId, type ReactNode, type MouseEventHandler } from "react";
import { MdMenuEl, MdMenuItemEl } from "./elements";

export interface MenuTriggerProps {
  id: string;
  onClick: MouseEventHandler<HTMLElement>;
}

/**
 * A trigger element + anchored M3 menu. Pass a render-prop `trigger` so the
 * trigger can be any element (icon button, avatar, list item, ...) while
 * this component wires up the `id`/`anchor` relationship and open state.
 */
export function Menu({
  trigger,
  open,
  onOpenChange,
  children,
  anchorCorner = "end-start",
  menuCorner = "start-start",
}: {
  trigger: (props: MenuTriggerProps) => ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  anchorCorner?: "start-start" | "start-end" | "end-start" | "end-end";
  menuCorner?: "start-start" | "start-end" | "end-start" | "end-end";
}) {
  const anchorId = useId();
  return (
    <>
      {trigger({ id: anchorId, onClick: () => onOpenChange(!open) })}
      <MdMenuEl
        anchor={anchorId}
        open={open}
        anchorCorner={anchorCorner}
        menuCorner={menuCorner}
        onClosed={() => onOpenChange(false)}
      >
        {children}
      </MdMenuEl>
    </>
  );
}

export function MenuItem({
  children,
  onClick,
  leadingIcon,
  disabled,
  className,
}: {
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLElement>;
  leadingIcon?: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <MdMenuItemEl onClick={onClick} disabled={disabled} className={className}>
      {leadingIcon && <span slot="start">{leadingIcon}</span>}
      <div slot="headline">{children}</div>
    </MdMenuItemEl>
  );
}
