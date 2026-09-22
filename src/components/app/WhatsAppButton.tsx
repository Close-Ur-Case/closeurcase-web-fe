export const WHATSAPP_NUMBER = "919494530799";

export function whatsappUrl(message?: string) {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
      <path d="M16.004 3C9.377 3 4 8.377 4 15.004c0 2.386.66 4.617 1.807 6.522L4 29l7.646-1.771a11.94 11.94 0 0 0 4.358.822h.004c6.627 0 12.004-5.377 12.004-12.004C28.012 8.42 22.63 3 16.004 3zm0 21.79h-.003a9.75 9.75 0 0 1-4.968-1.362l-.356-.212-3.68.853.876-3.588-.232-.368a9.73 9.73 0 0 1-1.5-5.109c0-5.39 4.39-9.78 9.867-9.78 2.636 0 5.113 1.028 6.977 2.895a9.8 9.8 0 0 1 2.886 6.977c0 5.39-4.39 9.694-9.867 9.694zm5.4-7.29c-.296-.148-1.75-.864-2.022-.963-.271-.099-.469-.148-.667.148-.198.297-.766.963-.94 1.16-.173.198-.346.223-.642.075-.296-.148-1.25-.461-2.382-1.47-.88-.785-1.475-1.756-1.648-2.052-.173-.297-.018-.457.13-.605.134-.133.297-.347.445-.52.148-.174.198-.298.297-.496.099-.198.05-.372-.025-.52-.074-.148-.667-1.608-.914-2.202-.24-.578-.485-.5-.667-.51l-.568-.01c-.198 0-.52.075-.792.372-.272.297-1.04 1.016-1.04 2.478s1.065 2.874 1.213 3.072c.148.198 2.096 3.2 5.078 4.487.71.306 1.263.489 1.694.626.712.227 1.36.195 1.872.118.571-.085 1.75-.716 1.996-1.407.247-.692.247-1.284.173-1.408-.074-.123-.272-.198-.568-.346z" />
    </svg>
  );
}

export function WhatsAppFloatingButton({
  position = "left",
  raised = false,
}: {
  position?: "left" | "right";
  /** Lifts the button on mobile so it clears a fixed bottom tab bar. */
  raised?: boolean;
} = {}) {
  const sideCls = position === "right" ? "right-4 sm:right-6" : "left-4 sm:left-6";
  const bottomCls = raised ? "bottom-24 sm:bottom-6" : "bottom-4 sm:bottom-6";
  return (
    <a
      href={whatsappUrl("Hi, I need help with my legal case on CloseUrCase.")}
      target="_blank"
      rel="noopener noreferrer"
      title="Chat with us on WhatsApp"
      aria-label="Chat with us on WhatsApp"
      className={`fixed ${bottomCls} ${sideCls} z-40 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl border border-black/5 hover:bg-[#20bd5a] transition-all hover:scale-110 active:scale-95`}
    >
      <WhatsAppGlyph className="h-6 w-6" />
    </a>
  );
}

export function WhatsAppInlineIcon({ className = "h-5 w-5" }: { className?: string }) {
  return <WhatsAppGlyph className={className} />;
}
