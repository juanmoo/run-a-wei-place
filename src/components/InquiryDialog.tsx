import { useEffect, useRef, useState, type FormEvent } from 'react'
import Dialog from './Dialog'

export default function InquiryDialog({ asset, scope = 'location', onClose }: { asset: { id: string; label: string }; scope?: 'location' | 'board'; onClose: () => void }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const request = useRef<AbortController | null>(null)
  const endpoint = import.meta.env.VITE_FORMSPREE_ENDPOINT?.trim() ?? ''
  const configured = /^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(endpoint)

  useEffect(() => () => { request.current?.abort() }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!configured || request.current) return
    const data = new FormData(event.currentTarget)
    const controller = new AbortController()
    request.current = controller
    setStatus('sending')
    const timeout = window.setTimeout(() => controller.abort(), 15000)
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      })
      if (!response.ok) throw new Error('Delivery failed')
      const result: unknown = await response.json()
      if (!result || typeof result !== 'object' || !('ok' in result) || result.ok !== true) throw new Error('Delivery not confirmed')
      setStatus('success')
    } catch {
      setStatus('error')
    } finally {
      clearTimeout(timeout)
      request.current = null
    }
  }

  return (
    <Dialog title={`${scope === 'board' ? 'Pixel board' : `Location ${asset.id}`} · Inquiry`} onClose={onClose}>
      {status === 'success' ? (
        <div role="status" className="success-message">
          <span className="success-symbol" aria-hidden="true">✓</span>
          <h2>Inquiry received.</h2>
          <p>Your request for location <strong>{asset.id}</strong> has been sent for manual review. This is an inquiry, not a reservation or purchase.</p>
          <button type="button" className="button button--primary" onClick={onClose}>Back to exploring</button>
        </div>
      ) : (
        <>
          <p className="eyebrow">A little space for your next idea</p>
          <h2>{scope === 'board' ? 'A place on the pixel board.' : `Move into ${asset.id}.`}</h2>
          <p>{scope === 'board' ? 'Tell the owner what you would like to share on the board. You can suggest a size or placement in your notes. This is a general inquiry: the owner reviews requests and manages placement manually. Pixels cannot be purchased directly, and sending this form does not reserve space.' : 'Give your project a place in this neighborhood. Share what you’re making and where this location should link. Every inquiry is reviewed by the owner—no payments or automatic reservations.'}</p>
          <p className="location-note"><span className="status-dot" /> {asset.id} / {asset.label} / {scope === 'board' ? 'General inquiry' : 'Available'}</p>
          {!configured && <p className="form-notice" role="status">Inquiries aren’t open yet. The site owner still needs to connect form delivery. Nothing can be sent until that’s ready.</p>}
          <form onSubmit={submit}>
            <input type="hidden" name="location_id" value={asset.id} />
            <input type="hidden" name="location_label" value={asset.label} />
            <input type="hidden" name="subject" value={`Location inquiry: ${asset.id}`} />
            <fieldset disabled={status === 'sending'}>
              <legend className="sr-only">Your contact details and project proposal</legend>
              <div className="form-grid">
                <label>Name<input name="name" autoComplete="name" required maxLength={100} /></label>
                <label>Email<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
              </div>
              <label>Project or business name<input name="project" required maxLength={160} /></label>
              <label>Destination URL<input name="url" type="url" placeholder="https://your-project.com" pattern="https?://.+" title="Use a full http:// or https:// web address" required maxLength={2000} /></label>
              <label>Short description<textarea name="description" rows={3} required maxLength={2000} /></label>
              <label>Notes <span className="optional">(optional)</span><textarea name="notes" rows={2} maxLength={2000} /></label>
              {status === 'error' && <p role="alert" className="form-notice">We couldn’t confirm delivery. Your details are still here. Check your connection and try again; if you already received a confirmation email, don’t resend.</p>}
              <button type="submit" className="button button--primary" disabled={!configured || status === 'sending'}>{status === 'sending' ? 'Sending inquiry…' : 'Send inquiry ↗'}</button>
              <p className="form-footnote">{configured ? 'Your contact details and proposal are sent through Formspree to the site owner for review.' : 'Form delivery is not configured for this preview.'}</p>
            </fieldset>
          </form>
        </>
      )}
    </Dialog>
  )
}
