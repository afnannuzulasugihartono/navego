// @last-edited: 2026-11-15 UTC+7.
// @title: pilot - the pilot form: one POST, one honest answer, no account.
// @state: reads the form, posts the answers to the feedback function, and says what happened; it never pretends a message was sent when the network said otherwise.
// @dependencies: none.

(() => {
  'use strict';

  const form = document.getElementById('pilotForm');
  const status = document.getElementById('pilotStatus');
  const send = document.getElementById('pilotSend');
  if (!form || !status || !send) return;

  // WHY THE FORM POSTS TO THE PROJECT'S OWN FUNCTION: the answers are the product's first real notes from the market, and a list that lives in somebody else's form service is a list that can go away with their dashboard.
  const ENDPOINT = 'https://nenmkmtvjremqphfqnfw.supabase.co/functions/v1/opera-agent-feedback';

  const SAY = {
    id: {
      sending: 'Mengirim...',
      sent: 'Terkirim. Terima kasih - saya baca sendiri dan saya balas satu per satu.',
      failed: 'Gagal terkirim. Tulis saja ke afnannuzulasugihartono@gmail.com, atau coba lagi sebentar lagi.'
    },
    en: {
      sending: 'Sending...',
      sent: 'Sent. Thank you - I read every answer myself and reply one by one.',
      failed: 'It did not send. Write to afnannuzulasugihartono@gmail.com instead, or try again in a moment.'
    }
  };

  // WHY THE LANGUAGE FOLLOWS THE PAGE: the reader chose a language on the page, and the answer to their form should speak the same one.
  const language = () => {
    try {
      const stored = localStorage.getItem('oa-lang');
      if (stored === 'en' || stored === 'id') return stored;
    } catch {
    }
    return document.documentElement.lang === 'en' ? 'en' : 'id';
  };

  const say = (key, state) => {
    status.textContent = SAY[language()][key];
    if (state) status.setAttribute('data-state', state);
  };

  const value = (id) => String(document.getElementById(id)?.value ?? '').trim();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = value('fName');
    const contact = value('fContact');
    if (!name || !contact) {
      say('failed');
      status.setAttribute('data-state', 'failed');
      return;
    }
    send.disabled = true;
    say('sending');
    status.removeAttribute('data-state');
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name,
          contact,
          firm: value('fFirm'),
          portal: value('fPortal'),
          clients: value('fClients'),
          pain: value('fPain'),
          wantsSlot: document.getElementById('fSlot')?.checked === true,
          source: 'pilot-page'
        })
      });
      if (!response.ok) throw new Error(`the function answered ${response.status}`);
      form.reset();
      say('sent', 'sent');
    } catch {
      say('failed', 'failed');
    } finally {
      send.disabled = false;
    }
  });
})();
