import type { MouseEvent, ReactNode } from "react";

/**
 * A real `mailto:` anchor (right-click → "Copy email address" still works, and
 * native desktop mail clients open as usual) with a safety net: on machines
 * that have no registered `mailto:` handler, clicking one otherwise just leaves
 * the user staring at a blank page. If focus never leaves the browser shortly
 * after the click — i.e. nothing handled the `mailto:` — we open Gmail's web
 * compose window in a new tab instead.
 */
export function MailLink({
  email,
  subject,
  body,
  className,
  children,
}: {
  email: string;
  subject?: string;
  body?: string;
  className?: string;
  children: ReactNode;
}) {
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  const query = params.toString();
  const href = `mailto:${email}${query ? `?${query}` : ""}`;

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Leave new-tab / modified / non-primary clicks to the browser.
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }

    let handedOff = false;
    const markHandedOff = () => {
      handedOff = true;
    };
    // A working mail handler pulls OS focus away from the browser.
    window.addEventListener("blur", markHandedOff, { once: true });

    window.setTimeout(() => {
      window.removeEventListener("blur", markHandedOff);
      if (handedOff || !document.hasFocus()) return;

      const gmail = new URL("https://mail.google.com/mail/");
      gmail.searchParams.set("view", "cm");
      gmail.searchParams.set("fs", "1");
      gmail.searchParams.set("to", email);
      if (subject) gmail.searchParams.set("su", subject);
      if (body) gmail.searchParams.set("body", body);
      window.open(gmail.toString(), "_blank", "noopener,noreferrer");
    }, 700);
  };

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
