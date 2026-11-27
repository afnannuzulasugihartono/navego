import { useState } from 'react';

const FEEDBACK = 'https://nenmkmtvjremqphfqnfw.supabase.co/functions/v1/navego-feedback';

export function FeedbackForm() {
  const [status, setStatus] = useState('');

  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = {
      name: String(data.get('name') ?? ''),
      contact: String(data.get('contact') ?? ''),
      firm: String(data.get('firm') ?? ''),
      portal: String(data.get('portal') ?? ''),
      clients: String(data.get('clients') ?? ''),
      pain: String(data.get('pain') ?? '')
    };
    setStatus('Mengirim…');
    try {
      const response = await fetch(FEEDBACK, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const answer = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatus(`Gagal terkirim: ${answer?.error || `HTTP ${response.status}`}`);
        return;
      }
      setStatus('Terkirim. Terima kasih — kami baca lewat kotak masuk dukungan di repo.');
      event.currentTarget.reset();
    } catch {
      setStatus('Gagal terkirim. Periksa koneksi lalu coba lagi.');
    }
  }

  return (
    <form className="card" id="form-dukungan" onSubmit={send}>
      <h3>Kirim lewat form dukungan</h3>
      <p className="note">Jawaban masuk ke kotak masuk dukungan di repo, bukan ke email pribadi. Isi yang perlu saja.</p>
      <div className="field"><label htmlFor="fb-name">Nama</label><input id="fb-name" name="name" required maxLength={120} /></div>
      <div className="field"><label htmlFor="fb-contact">Cara membalas</label><input id="fb-contact" name="contact" required maxLength={160} placeholder="email atau kontak lain" /></div>
      <div className="field"><label htmlFor="fb-firm">Perusahaan</label><input id="fb-firm" name="firm" maxLength={120} /></div>
      <div className="field"><label htmlFor="fb-portal">Portal yang dipakai</label><input id="fb-portal" name="portal" maxLength={160} /></div>
      <div className="field"><label htmlFor="fb-clients">Jumlah klien</label><input id="fb-clients" name="clients" maxLength={40} /></div>
      <div className="field"><label htmlFor="fb-pain">Yang paling melelahkan</label><textarea id="fb-pain" name="pain" rows={4} maxLength={600} /></div>
      <button className="btn btn-solid" type="submit">Kirim jawaban</button>
      <p className="status" role="status">{status}</p>
    </form>
  );
}
