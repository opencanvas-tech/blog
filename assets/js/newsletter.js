(function () {
  var form = document.getElementById('newsletter-form');
  if (!form) return;

  var endpoint = form.getAttribute('data-endpoint');
  var emailInput = form.querySelector('input[name="email"]');
  var honeypot = form.querySelector('input[name="website"]');
  var button = form.querySelector('button[type="submit"]');
  var btnText = form.querySelector('.btn-text');
  var btnLoading = form.querySelector('.btn-loading');
  var messageEl = form.querySelector('.newsletter-message');

  // Track when page loaded — reject submissions faster than 2 seconds
  var loadTime = Date.now();

  function showMessage(type, text) {
    messageEl.className = 'newsletter-message ' + type;
    messageEl.textContent = text;
  }

  function setLoading(loading) {
    button.disabled = loading;
    btnText.style.display = loading ? 'none' : 'inline';
    btnLoading.style.display = loading ? 'inline' : 'none';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Honeypot check — bots fill hidden fields, humans don't
    if (honeypot && honeypot.value) {
      showMessage('success', "You're subscribed! Welcome aboard.");
      return;
    }

    // Time-based check — reject if submitted too fast (likely a bot)
    if (Date.now() - loadTime < 2000) {
      showMessage('success', "You're subscribed! Welcome aboard.");
      return;
    }

    var email = emailInput.value.trim();
    if (!email) return;

    if (!endpoint) {
      showMessage('error', 'Newsletter is not configured yet. Please try again later.');
      return;
    }

    setLoading(true);
    messageEl.className = 'newsletter-message';
    messageEl.textContent = '';

    var data = {
      email: email,
      pageUrl: window.location.href,
      timestamp: new Date().toISOString(),
      referrer: document.referrer || '',
      userAgent: navigator.userAgent || ''
    };

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(data).toString(),
      mode: 'no-cors'
    })
      .then(function () {
        showMessage('success', "You're subscribed! Welcome aboard.");
        emailInput.value = '';
      })
      .catch(function () {
        showMessage('error', 'Something went wrong. Please try again.');
      })
      .finally(function () {
        setLoading(false);
      });
  });
})();
