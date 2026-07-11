import {useEffect, useId, useRef, type PropsWithChildren} from 'react';
import {X} from '@phosphor-icons/react';

interface ModalProps extends PropsWithChildren {
  open: boolean;
  title: string;
  onClose: () => void;
  className?: string;
}

export function Modal({open, title, onClose, children, className = ''}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={`modal ${className}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
    >
      <header className="modal-header">
        <h2 id={titleId}>{title}</h2>
        <button className="icon-button" type="button" aria-label={`關閉${title}`} onClick={onClose}>
          <X aria-hidden="true" weight="bold" />
        </button>
      </header>
      {children}
    </dialog>
  );
}
