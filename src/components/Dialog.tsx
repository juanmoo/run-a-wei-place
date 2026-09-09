import { useEffect, useRef, type ReactNode } from 'react'

export default function Dialog({ title, onClose, children, wide = false }: {
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current!
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    dialog.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
      if (previousFocus?.isConnected && previousFocus.getClientRects().length && !previousFocus.closest('[inert], [hidden]')) previousFocus.focus({ preventScroll: true })
    }
  }, [])

  return (
    <dialog ref={ref} className={`dialog${wide ? ' dialog--wide' : ''}`} aria-labelledby="dialog-title" onCancel={(event) => { event.preventDefault(); onClose() }}>
      <div className="dialog-bar"><span id="dialog-title">{title}</span><button className="close-button" type="button" aria-label="Close dialog" onClick={onClose}>×</button></div>
      <div className="dialog-body">{children}</div>
    </dialog>
  )
}
