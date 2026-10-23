/**
 * Vijayadashami Carnival — Certificate Verification Client Logic
 * Verifies certificate validity against official registry API and renders status.
 */

const API_BASE_URL = (typeof window !== 'undefined' && window.location.port === '5000') ? '' : 'http://localhost:5000';

document.addEventListener('DOMContentLoaded', () => {
  const loadingState = document.getElementById('loadingState');
  const resultContent = document.getElementById('resultContent');
  const statusBanner = document.getElementById('statusBanner');
  const statusIconWrap = document.getElementById('statusIconWrap');
  const statusBadgeTitle = document.getElementById('statusBadgeTitle');
  const statusBadgeDesc = document.getElementById('statusBadgeDesc');

  const validCertDetails = document.getElementById('validCertDetails');
  const revokedCertDetails = document.getElementById('revokedCertDetails');
  const notFoundDetails = document.getElementById('notFoundDetails');

  const participantNameEl = document.getElementById('participantName');
  const metaCertIdEl = document.getElementById('metaCertId');
  const metaIssueDateEl = document.getElementById('metaIssueDate');
  const metaGamesListEl = document.getElementById('metaGamesList');
  const btnDownloadPdf = document.getElementById('btnDownloadPdf');

  const revokedCertIdEl = document.getElementById('revokedCertId');
  const manualLookupForm = document.getElementById('manualLookupForm');
  const manualInput = document.getElementById('manualInput');

  // SVG Icons
  const iconValid = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>`;

  const iconRevoked = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>`;

  const iconNotFound = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>`;

  /**
   * Extracts token or certificate ID from current URL query string or pathname
   */
  function extractTokenFromUrl() {
    // 1. Check ?token= or ?certId= query param
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token') || params.get('certId') || params.get('id');
    if (tokenParam) return tokenParam.trim();

    // 2. Check if URL path is /verify-certificate/:token
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const verifyIdx = pathParts.indexOf('verify-certificate');
    if (verifyIdx !== -1 && pathParts[verifyIdx + 1]) {
      return decodeURIComponent(pathParts[verifyIdx + 1]).trim();
    }

    return null;
  }

  /**
   * Fetches certificate verification status from backend API
   */
  async function performVerification(tokenOrId) {
    if (!tokenOrId) {
      showNotFoundState('No certificate verification token or identifier was provided.');
      return;
    }

    // Show loading
    loadingState.style.display = 'flex';
    resultContent.style.display = 'none';

    try {
      const response = await fetch(`${API_BASE_URL}/api/certificates/verify/${encodeURIComponent(tokenOrId)}`, {
        headers: { 'Accept': 'application/json' }
      });
      const data = await response.json();

      loadingState.style.display = 'none';
      resultContent.style.display = 'block';

      if (response.ok && data.status === 'valid') {
        showValidState(data.certificate);
      } else if (data.status === 'revoked') {
        showRevokedState(data.certificate);
      } else {
        showNotFoundState(data.message || 'Certificate record not found in official registry.');
      }
    } catch (err) {
      loadingState.style.display = 'none';
      resultContent.style.display = 'block';
      showNotFoundState('Unable to reach verification server. Please check your network connection.');
    }
  }

  /**
   * Renders Valid Certificate State
   */
  function showValidState(cert) {
    statusBanner.className = 'status-banner valid';
    statusIconWrap.innerHTML = iconValid;
    statusBadgeTitle.textContent = 'Authentic & Valid';
    statusBadgeDesc.textContent = cert.eventName ? `Official ${cert.eventName} Participation Certificate` : 'Official Vijayadashami Carnival Participation Certificate';

    participantNameEl.textContent = cert.participantName || 'Event Participant';
    metaCertIdEl.textContent = cert.certificateId || 'SRMU-CERT-2026';

    const metaEventNameEl = document.getElementById('metaEventName');
    if (metaEventNameEl) {
      metaEventNameEl.textContent = cert.eventName || 'Vijayadashami Carnival';
    }
    const metaEventDateVenueEl = document.getElementById('metaEventDateVenue');
    if (metaEventDateVenueEl) {
      metaEventDateVenueEl.textContent = `${cert.eventDate || '29 Oct 2026'} • ${cert.eventVenue || 'SRMU Campus, B5'}`;
    }

    const formattedDate = cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : (cert.eventDate || '29 October 2026');
    metaIssueDateEl.textContent = formattedDate;

    // Render games tags
    metaGamesListEl.innerHTML = '';
    const games = Array.isArray(cert.gamesParticipated) && cert.gamesParticipated.length > 0
      ? cert.gamesParticipated
      : ['Campus Challenges & Carnival Games'];

    games.forEach(g => {
      const tag = document.createElement('span');
      tag.className = 'game-tag';
      tag.textContent = g;
      metaGamesListEl.appendChild(tag);
    });

    // Set download URL
    const dlToken = cert.verificationToken || cert.certificateId;
    btnDownloadPdf.href = `${API_BASE_URL}/api/certificates/download/${encodeURIComponent(dlToken)}`;

    validCertDetails.style.display = 'block';
    revokedCertDetails.style.display = 'none';
    notFoundDetails.style.display = 'none';
  }

  /**
   * Renders Revoked Certificate State
   */
  function showRevokedState(cert) {
    statusBanner.className = 'status-banner revoked';
    statusIconWrap.innerHTML = iconRevoked;
    statusBadgeTitle.textContent = 'Certificate Revoked';
    statusBadgeDesc.textContent = 'This certificate was revoked and is no longer recognized as valid';

    revokedCertIdEl.textContent = cert.certificateId || 'Unknown ID';

    validCertDetails.style.display = 'none';
    revokedCertDetails.style.display = 'block';
    notFoundDetails.style.display = 'none';
  }

  /**
   * Renders Not Found / Invalid State
   */
  function showNotFoundState(msg) {
    statusBanner.className = 'status-banner not_found';
    statusIconWrap.innerHTML = iconNotFound;
    statusBadgeTitle.textContent = 'Certificate Not Found';
    statusBadgeDesc.textContent = msg || 'The certificate identifier could not be verified';

    validCertDetails.style.display = 'none';
    revokedCertDetails.style.display = 'none';
    notFoundDetails.style.display = 'block';
  }

  // Handle manual lookup submission
  if (manualLookupForm) {
    manualLookupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = manualInput.value.trim();
      if (val) {
        // Update URL query param cleanly without reload
        const newUrl = `${window.location.pathname}?token=${encodeURIComponent(val)}`;
        window.history.pushState({ token: val }, '', newUrl);
        performVerification(val);
      }
    });
  }

  // Initial Verification on load
  const initialToken = extractTokenFromUrl();
  performVerification(initialToken);
});
