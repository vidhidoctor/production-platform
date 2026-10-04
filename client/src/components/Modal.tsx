import { useEffect, useRef, type FormEvent, type ReactNode } from "react";

interface Props {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  /** Footer buttons. When onSubmit is given, the modal is a <form> and Enter submits it. */
  footer?: ReactNode;
  onSubmit?: () => void;
  width?: number;
}

// Native <dialog>: focus trapping, Esc to close and the backdrop come from the browser.
export function Modal({ open, title, onClose, children, footer, onSubmit, width }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const body = (
    <>
      <div className="modal-head">
        <h2>{title}</h2>
        <span className="spacer" />
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>
      <div className="modal-body">{children}</div>
      {footer && <div className="modal-foot">{footer}</div>}
    </>
  );

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit?.();
  };

  return (
    <dialog ref={ref} className="modal" style={width ? { width: `min(${width}px, calc(100vw - 32px))` } : undefined} onClose={onClose}>
      {open && (onSubmit ? <form onSubmit={submit}>{body}</form> : body)}
    </dialog>
  );
}
