const fetch = globalThis.fetch;
(async () => {
  try {
    const loginRes = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'user', password: 'user123' })
    });
    const loginData = await loginRes.json();
    console.log('login', loginRes.status, loginData);
    if (!loginRes.ok) process.exit(1);
    const token = loginData.token;

    const seatRes = await fetch('http://localhost:3000/api/events/1/seat-map');
    const seatData = await seatRes.json();
    console.log('seatMap loaded', seatRes.status);
    let selected = null;
    for (const cat of seatData.seatMap.categories) {
      const seat = cat.seats.find((s) => !s.reserved);
      if (seat) {
        selected = { category: cat.id, number: seat.number, priceCents: cat.priceCents };
        break;
      }
    }
    if (!selected) {
      console.error('No available seat found');
      process.exit(1);
    }
    console.log('selected seat', selected);

    const ticketRes = await fetch('http://localhost:3000/api/events/1/tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        ticketType: selected.category,
        priceCents: selected.priceCents,
        paymentProvider: 'card',
        email: 'test@example.com',
        isVirtual: false,
        seatCategory: selected.category,
        seatNumber: selected.number
      })
    });
    const ticketData = await ticketRes.json();
    console.log('ticket create', ticketRes.status, JSON.stringify(ticketData, null, 2));
    if (!ticketRes.ok) process.exit(1);

    const myTicketsRes = await fetch('http://localhost:3000/api/users/me/tickets', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const myTickets = await myTicketsRes.json();
    console.log('my tickets', myTicketsRes.status, JSON.stringify(myTickets, null, 2));
  } catch (err) {
    console.error('ERROR', err);
    process.exit(1);
  }
})();
