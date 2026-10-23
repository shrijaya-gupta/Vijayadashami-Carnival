const http = require('http');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

function post(url, payload) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = JSON.stringify(payload);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => resolve({ status: res.statusCode, data }));
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

(async () => {
  console.log('=== VIJAYADASHAMI CARNIVAL — FINAL EVENT UPDATE VALIDATION ===\n');

  // 1. Health check
  const healthRes = await get('http://localhost:5000/api/health');
  console.log('[1] Health endpoint check (HTTP ' + healthRes.status + '):', JSON.parse(healthRes.data).status);

  // 2. Config check
  const configRes = await get('http://localhost:5000/api/config');
  const rawConfig = JSON.parse(configRes.data);
  const config = rawConfig.data;
  console.log('[2] Config endpoint check:');
  console.log('    Event Name:', config.eventName);
  console.log('    Institution:', config.institution);
  console.log('    Venue:', config.venue);
  console.log('    Date & Time:', config.date, 'at', config.time);
  console.log('    Registration Deadline Notice: Last Date for Registration:', config.registrationDeadline);
  console.log('    Supporting Text:', config.registrationDeadlineNotice);
  console.log('    Fee Policy: ₹' + config.feePerGame, config.feeCurrency, 'per game');
  console.log('    WhatsApp Group:', config.whatsapp.groupName);
  console.log('    WhatsApp Notice:', config.whatsapp.supportingText);

  // 3. Games Catalogue check
  const gamesRes = await get('http://localhost:5000/api/games');
  const gamesData = JSON.parse(gamesRes.data);
  console.log('[3] Authoritative Games Catalogue:');
  console.log('    Total active games count:', gamesData.games.length, '(Must be 6)');
  gamesData.games.forEach((g, i) => {
    console.log(`    ${i + 1}. ${g.name} (${g.id}) | Category: ${g.category} | Rules: ${g.rulesStatus}`);
  });
  const hasTreasureHunt = gamesData.games.some((g) => g.id === 'treasure-hunt' || g.name.includes('Treasure'));
  console.log('    Treasure Hunt present in active list?:', hasTreasureHunt ? 'FAIL' : 'PASS (Removed)');

  const targetShooting = gamesData.games.find((g) => g.id === 'target-shooting');
  console.log('    Target shooting mentions safety?:', targetShooting && targetShooting.description.includes('safety') ? 'PASS' : 'FAIL');

  // 4. Registration creation & dynamic fee verification
  console.log('\n[4] Dynamic Registration Fee Calculation & Payment Reference Flow:');
  const uid = Date.now().toString().slice(-6);
  // 1 Game = ₹5
  const testReg1 = {
    student: {
      fullName: 'Test Student One',
      mobileNumber: '98' + Math.floor(10000000 + Math.random() * 90000000),
      rollNumber: 'SRMU-ROLL-' + uid + 'A',
      course: 'B.Tech',
      branch: 'CSE',
      academicYear: '3rd Year'
    },
    selectedGames: [{ gameId: 'lemon-race', participationType: 'individual' }]
  };
  const reg1Res = await post('http://localhost:5000/api/registrations', testReg1);
  const reg1Data = JSON.parse(reg1Res.data);
  console.log('    1 Game Registration created: ID =', reg1Data.data.registrationId);
  console.log('    Fee calculated by server:', reg1Data.data.feeAmount, 'INR (Expected: 5):', reg1Data.data.feeAmount === 5 ? 'PASS' : 'FAIL');
  console.log('    Initial Payment Status:', reg1Data.data.paymentStatus, '(Expected: payment_pending):', reg1Data.data.paymentStatus === 'payment_pending' ? 'PASS' : 'FAIL');

  // 3 Games = ₹15 with paymentReference
  const testReg3 = {
    student: {
      fullName: 'Test Student Three',
      mobileNumber: '98' + Math.floor(10000000 + Math.random() * 90000000),
      rollNumber: 'SRMU-ROLL-' + uid + 'B',
      course: 'B.Tech',
      branch: 'IT',
      academicYear: '2nd Year'
    },
    paymentReference: 'UPI-UTR-987654321012',
    selectedGames: [
      { gameId: 'lemon-race', participationType: 'individual' },
      { gameId: 'musical-chairs', participationType: 'individual' },
      { gameId: 'target-shooting', participationType: 'individual' }
    ]
  };
  const reg3Res = await post('http://localhost:5000/api/registrations', testReg3);
  const reg3Data = JSON.parse(reg3Res.data);
  console.log('    3 Games Registration created: ID =', reg3Data.data.registrationId);
  console.log('    Fee calculated by server:', reg3Data.data.feeAmount, 'INR (Expected: 15):', reg3Data.data.feeAmount === 15 ? 'PASS' : 'FAIL');
  console.log('    Payment Status with UTR:', reg3Data.data.paymentStatus, '(Expected: payment_verification_pending):', reg3Data.data.paymentStatus === 'payment_verification_pending' ? 'PASS' : 'FAIL');
  console.log('    Payment Reference stored:', reg3Data.data.paymentReference);

  // Submit payment reference for reg1 post-submission
  console.log('\n[5] Post-Submission Payment Reference (UTR) Submission:');
  const postUtrRes = await post(
    `http://localhost:5000/api/registrations/${reg1Data.data.registrationId}/payment-reference`,
    { paymentReference: 'UTR-AFTER-SUBMIT-1234' }
  );
  const postUtrData = JSON.parse(postUtrRes.data);
  console.log('    Post-submission UTR response status:', postUtrRes.status, 'success:', postUtrData.success);
  console.log('    Updated payment status:', postUtrData.data.paymentStatus, '(Expected: payment_verification_pending):', postUtrData.data.paymentStatus === 'payment_verification_pending' ? 'PASS' : 'FAIL');

  // 6. Public HTML Content Validation
  console.log('\n[6] Public HTML Content & Privacy Validation:');
  const indexRes = await get('http://localhost:3000/index.html');
  const html = indexRes.data;
  const normalizedHtml = html.replace(/&amp;/g, '&');

  const forbiddenTerms = [
    'MongoDB connected',
    'stored in MongoDB',
    'recorded in MongoDB',
    'Express.js backend',
    'Phase 1',
    'Phase 2',
    'Phase 3',
    'Phase 4',
    'Phase 5',
    'Phase 6',
    'Phase 7'
  ];
  const leaked = forbiddenTerms.filter((term) => html.includes(term));
  console.log('    Forbidden internal terms check:', leaked.length === 0 ? 'PASS (0 internal terms found)' : 'FAIL (Found: ' + leaked.join(', ') + ')');

  const requiredPhrases = [
    'Vijayadashami Carnival',
    'Thursday, 29 October 2026',
    '11:00 AM',
    'SRMU Campus, B5',
    'Last Date for Registration: Monday, 26 October 2026',
    'Students are requested to complete their registration and online payment by the registration deadline.',
    'Join the Official Event WhatsApp Group',
    'SRMU Vijayadashami Carnivals',
    'Registered participants will be added to the event\'s WhatsApp group for important announcements, coordination and event-related updates.',
    'Exciting Gifts, Rewards & Participation Certificates',
    'Participate in the Vijayadashami Carnival, enjoy exciting games and activities, and stand a chance to receive gifts and rewards. Participation certificates will also be provided to participants.',
    '₹5 per selected game',
    'Payment Pending',
    'Payment Verification Pending'
  ];

  let passedPhrases = 0;
  requiredPhrases.forEach((phrase) => {
    const present = normalizedHtml.includes(phrase);
    if (present) passedPhrases++;
    console.log(`    Checking: "${phrase.slice(0, 45)}...":`, present ? 'PASS' : 'FAIL');
  });

  console.log(`\nValidation complete: ${passedPhrases}/${requiredPhrases.length} required phrases verified in public UI.`);
})();
