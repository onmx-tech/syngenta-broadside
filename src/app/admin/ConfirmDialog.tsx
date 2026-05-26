import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";

type Tone = "danger" | "warning" | "primary";

const toneStyles: Record<Tone, { btn: string; ring: string }> = {
  danger: {
    btn: "bg-red-600 hover:bg-red-700 text-white",
    ring: "ring-red-500/30",
  },
  warning: {
    btn: "bg-[#a07a3a] hover:bg-[#856230] text-white",
    ring: "ring-[#a07a3a]/30",
  },
  primary: {
    btn: "bg-[#7dbf44] hover:bg-[#6ba838] text-[#0d0904]",
    ring: "ring-[#7dbf44]/30",
  },
};

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Tone;
  onConfirm: () => void | Promise<void>;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "primary",
  onConfirm,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);
  const styles = toneStyles[tone];

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 bg-[#0d0904]/55 backdrop-blur-[2px] z-[60]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <motion.div
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[61] w-[calc(100%-2rem)] max-w-[440px] bg-white rounded-2xl p-6 sm:p-8 shadow-[0_28px_60px_-12px_rgba(0,0,0,0.35)]"
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 6 }}
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
              >
                <Dialog.Title className="font-bold text-[#1a1208] text-[19px] sm:text-[21px] leading-snug">
                  {title}
                </Dialog.Title>
                {description && (
                  <Dialog.Description className="mt-2 text-[#7c695d] text-[14px] leading-relaxed">
                    {description}
                  </Dialog.Description>
                )}
                <div className="mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    disabled={busy}
                    className="px-4 py-2.5 rounded-xl border border-[#7c695d]/25 text-[#7c695d] font-medium text-[14px] hover:bg-[#7c695d]/5 disabled:opacity-50"
                  >
                    {cancelLabel}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={busy}
                    className={`px-5 py-2.5 rounded-xl font-bold text-[14px] transition-colors focus:outline-none focus:ring-4 ${styles.btn} ${styles.ring} disabled:opacity-50`}
                  >
                    {busy ? "Aguarde…" : confirmLabel}
                  </button>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
