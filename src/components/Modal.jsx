import { useEffect, useRef } from "react";
export function Modal({ id, open, onClose, children, label }) {
  const ref = useRef();
  useEffect(() => {
    const node = ref.current,
      previous = document.activeElement;
    if (open && !node.open) node.showModal();
    else if (!open && node.open) node.close();
    return () => {
      if (open) previous?.focus();
    };
  }, [open]);
  return (
    <dialog
      id={id}
      ref={ref}
      aria-label={label}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      {children}
    </dialog>
  );
}
