const queryParams = new URLSearchParams(window.location.search);
const eventId = queryParams.get('id');
const eventLoading = document.getElementById('eventLoading');
const eventDetails = document.getElementById('eventDetails');
const eventTitle = document.getElementById('eventTitle');
const eventMeta = document.getElementById('eventMeta');
const eventRating = document.getElementById('eventRating');
const eventDescription = document.getElementById('eventDescription');
const eventDate = document.getElementById('eventDate');
const eventDistrict = document.getElementById('eventDistrict');
const eventBudget = document.getElementById('eventBudget');
const eventCategory = document.getElementById('eventCategory');
const eventAttendance = document.getElementById('eventAttendance');
const eventCountdown = document.getElementById('eventCountdown');
const eventMedia = document.getElementById('eventMedia');
const eventMap = document.getElementById('eventMap');
const ticketPrices = document.getElementById('ticketPrices');
const bookButton = document.getElementById('bookButton');
const reviewForm = document.getElementById('reviewForm');
const openReviewFormBtn = document.getElementById('openReviewFormBtn');
const loginNotice = document.getElementById('loginNotice');
const reviewAccessMessage = document.getElementById('reviewAccessMessage');
const existingCommentsContainer = document.getElementById('existingComments');
const reviewRating = document.getElementById('reviewRating');
const reviewContent = document.getElementById('reviewContent');
const submitReviewBtn = document.getElementById('submitReviewBtn');
const reviewMessage = document.getElementById('reviewMessage');
const reviewStars = document.getElementById('reviewStars');
const attendBtn = document.getElementById('attendBtn');

let countdownInterval = null;
let currentEvent = null;
let authToken = null;

// Retrieve the current authenticated session token from localStorage.
const getAuthToken = () => {
  try {
    const session = JSON.parse(localStorage.getItem('eventAppSession') || 'null');
    return session?.authToken || null;
  } catch (err) {
    return null;
  }
};

// Perform fetch requests with the auth token header when available.
const fetchWithAuth = (url, options = {}) => {
  const headers = options.headers || {};
  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return fetch(url, { ...options, headers });
};

const getCurrentLanguage = () => window.appI18n?.getLanguage?.() || localStorage.getItem('eventAppLanguage') || 'ar';
const translate = (key) => window.appI18n?.t?.(key, getCurrentLanguage()) || key;

const renderStars = (value = 0, max = 5) => {
  const numericValue = Number(value) || 0;
  const safeValue = Math.max(0, Math.min(max, numericValue));
  const fullStars = Math.round(safeValue);
  const emptyStars = Math.max(0, max - fullStars);
  return `<span class="star-rating" aria-label="${safeValue} من ${max}">${'★'.repeat(fullStars)}${'☆'.repeat(emptyStars)}</span>`;
};

const renderReviewStars = () => {
  if (!reviewStars) return;
  reviewStars.innerHTML = [1, 2, 3, 4, 5].map((value) => `<button type="button" class="star-input-btn" data-rating="${value}" aria-label="${translate('rate')} ${value}">★</button>`).join('');
  updateReviewStarSelection();
};

const updateReviewStarSelection = () => {
  if (!reviewStars) return;
  const selectedValue = Number(reviewRating.value || 0);
  reviewStars.querySelectorAll('.star-input-btn').forEach((button) => {
    const rating = Number(button.dataset.rating || 0);
    button.classList.toggle('active', rating <= selectedValue);
  });
};

// Format a date string into a readable Arabic date and time format.
const formatDate = (value) => {
  const date = new Date(value);
  return new Intl.DateTimeFormat('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
};

const padZero = (value) => value.toString().padStart(2, '0');

// Update the countdown timer for the current event and refresh it every second.
const updateCountdown = (dateString) => {
  if (countdownInterval) clearInterval(countdownInterval);
  const targetDate = new Date(dateString);
  countdownInterval = setInterval(() => {
    const now = new Date();
    const diff = targetDate.getTime() - now.getTime();
    if (diff <= 0) {
      eventCountdown.textContent = 'انتهت الفعالية';
      clearInterval(countdownInterval);
      return;
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    eventCountdown.textContent = `${padZero(days)} يوم ${padZero(hours)} ساعة ${padZero(minutes)} دقيقة ${padZero(seconds)} ثانية`;
  }, 1000);
};

// Render event media gallery items, including images and video links.
const renderMedia = (media = []) => {
  if (!media.length) {
    eventMedia.innerHTML = '<p class="muted-text">لا توجد صور أو فيديو توضيحي لهذه الفعالية.</p>';
    return;
  }

  eventMedia.innerHTML = media.map((item) => {
    const src = item.url;
    if (item.type === 'video') {
      const videoTag = src.startsWith('/uploads/') ? `<video controls src="${src}"></video>` : `<a href="${src}" target="_blank" rel="noopener">عرض الفيديو الخارجي</a>`;
      return `<div class="media-item media-video">${videoTag}</div>`;
    }
    return `<div class="media-item media-image"><img src="${src}" alt="${currentEvent?.title || 'فعالية'}" loading="lazy" /></div>`;
  }).join('');
};

// Display an embedded OpenStreetMap view for the event location.
const renderMap = (event) => {
  if (!event.latitude || !event.longitude) {
    eventMap.innerHTML = '<p class="muted-text">لا توجد بيانات موقع جغرافي لهذه الفعالية.</p>';
    return;
  }
  eventMap.innerHTML = `
    <iframe
      width="100%"
      height="320"
      frameborder="0"
      scrolling="no"
      src="https://www.openstreetmap.org/export/embed.html?bbox=${event.longitude - 0.02}%2C${event.latitude - 0.01}%2C${event.longitude + 0.02}%2C${event.latitude + 0.01}&layer=mapnik&marker=${event.latitude}%2C${event.longitude}">
    </iframe>
    <p class="map-caption"><a href="https://www.openstreetmap.org/?mlat=${event.latitude}&mlon=${event.longitude}#map=15/${event.latitude}/${event.longitude}" target="_blank" rel="noopener">فتح الخريطة كاملة</a></p>
  `;
};

// Render the available ticket price options for this event.
const renderPrices = (event, seatMap) => {
  const rows = [];
  if (event.isHybrid) {
    rows.push(`<div class="ticket-price-item"><strong>تذكرة افتراضية</strong> — ${Math.round((event.virtualPriceCents || 1500) / 100)}$</div>`);
  }
  if (seatMap?.categories?.length) {
    seatMap.categories.forEach((category) => {
      rows.push(`<div class="ticket-price-item"><strong>${category.label}</strong> — ${Math.round(category.priceCents / 100)}$</div>`);
    });
  } else {
    rows.push('<div class="ticket-price-item">لا توجد بيانات أسعار المقاعد المتاحة.</div>');
  }
  ticketPrices.innerHTML = rows.join('');
};

// Create the HTML for a single user review comment card.
const renderComment = (comment) => {
  const stars = comment.rating ? `<span class="comment-rating">${renderStars(comment.rating)}</span>` : `<span class="muted-text">${translate('noRatings')}</span>`;
  return `
    <article class="comment-card">
      <div class="comment-header">
        <strong>${comment.username}</strong>
        ${stars}
      </div>
      <p>${comment.content}</p>
      <p class="muted-text">${comment.createdAt ? formatDate(comment.createdAt) : ''}</p>
    </article>
  `;
};

// Load review comments for the current event and show them in the comments section.
const loadComments = async () => {
  existingCommentsContainer.innerHTML = '<p class="muted-text">جارٍ تحميل تقييمات الحضور...</p>';
  try {
    const response = await fetch(`/api/events/${encodeURIComponent(eventId)}/comments?limit=10`);
    if (!response.ok) {
      throw new Error('فشل تحميل التقييمات');
    }
    const data = await response.json();
    if (!data.comments || data.comments.length === 0) {
      existingCommentsContainer.innerHTML = '<p class="muted-text">لا توجد تقييمات حتى الآن.</p>';
      return;
    }
    existingCommentsContainer.innerHTML = data.comments.map(renderComment).join('');
  } catch (err) {
    existingCommentsContainer.innerHTML = `<p class="error-text">${err.message}</p>`;
  }
};

// Fill the event details page with the selected event's information.
const renderEvent = async (event) => {
  currentEvent = event;
  eventTitle.textContent = event.title;
  eventMeta.textContent = `${event.category} · ${event.district || 'المنطقة غير محددة'}`;
  if (eventRating) {
    const rating = Number(event.averageRating || 0);
    const count = Number(event.ratingCount || 0);
    eventRating.innerHTML = `${renderStars(rating)} <span>${rating > 0 ? `${rating.toFixed(1)} / 5` : translate('noRatings')}</span> <span class="rating-count">${count} ${translate('reviewsCount')}</span>`;
  }
  eventDescription.textContent = event.description;
  eventDate.textContent = formatDate(event.date);
  eventDistrict.textContent = event.district || 'غير محدد';
  eventBudget.textContent = event.budgetCents ? `${Math.round(event.budgetCents / 100)}$` : 'غير محددة';
  eventCategory.textContent = event.category;
  eventAttendance.textContent = `${event.attendingCount || 0} تأكيد حضور`;
  renderMedia(event.media || []);
  renderMap(event);
  updateCountdown(event.date);
  if (event.userHasTicket) {
    bookButton.textContent = 'لقد حجزت هذه الفعالية بالفعل';
    bookButton.removeAttribute('href');
    bookButton.classList.add('disabled');
  } else {
    bookButton.textContent = 'احجز الآن';
    bookButton.href = `/checkout.html?eventId=${event.id}`;
    bookButton.classList.remove('disabled');
  }

  // Show attend button for logged-in users who haven't marked attendance yet
  const token = getAuthToken();
  if (attendBtn) {
    if (token && !event.userHasAttendance) {
      attendBtn.classList.remove('hidden');
    } else {
      attendBtn.classList.add('hidden');
    }
  }

  const response = await fetchWithAuth(`/api/events/${event.id}/seat-map`);
  if (response.ok) {
    const data = await response.json();
    renderPrices(event, data.seatMap);
  } else {
    renderPrices(event, null);
  }

  if (!token) {
    reviewForm.classList.add('hidden');
    openReviewFormBtn.classList.add('hidden');
    loginNotice.classList.remove('hidden');
    reviewAccessMessage.classList.add('hidden');
  } else if (event.userCanReview) {
    reviewForm.classList.add('hidden');
    openReviewFormBtn.classList.remove('hidden');
    loginNotice.classList.add('hidden');
    reviewAccessMessage.classList.add('hidden');
  } else {
    reviewForm.classList.add('hidden');
    openReviewFormBtn.classList.add('hidden');
    loginNotice.classList.add('hidden');
    reviewAccessMessage.classList.remove('hidden');
    reviewAccessMessage.textContent = 'يمكنك إضافة تقييم فقط بعد شراء تذكرة أو تأكيد الحضور.';
  }

  renderReviewStars();
  loadComments();
};

reviewStars?.addEventListener('click', (event) => {
  const button = event.target.closest('.star-input-btn');
  if (!button) return;
  reviewRating.value = button.dataset.rating || '0';
  updateReviewStarSelection();
});

// Mark attendance (RSVP) as 'attending' so users can be allowed to review
attendBtn?.addEventListener('click', async () => {
  try {
    attendBtn.disabled = true;
    const resp = await fetchWithAuth(`/api/events/${encodeURIComponent(eventId)}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'attending' })
    });
    const data = await resp.json();
    if (!resp.ok) {
      reviewMessage.textContent = data.error || 'فشل تحديث حالة الحضور';
      attendBtn.disabled = false;
      return;
    }
    // Update UI: show review ability and update attendees count
    event.userHasAttendance = true;
    event.userCanReview = true;
    eventAttendance.textContent = `${data.attendingCount || 0} تأكيد حضور`;
    attendBtn.classList.add('hidden');
    openReviewFormBtn.classList.remove('hidden');
    reviewMessage.textContent = 'تم تأكيد حضورك، يمكنك الآن إضافة مراجعة.';
    reviewForm.classList.remove('hidden');
  } catch (err) {
    reviewMessage.textContent = err.message || 'خطأ أثناء الاتصال بالخادم';
    attendBtn.disabled = false;
  }
});

openReviewFormBtn?.addEventListener('click', () => {
  reviewForm.classList.remove('hidden');
  openReviewFormBtn.classList.add('hidden');
  reviewForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// Show an error message on the event detail page when data cannot be retrieved.
const showError = (message) => {
  eventLoading.textContent = message;
  eventDetails.classList.add('hidden');
};

// Load the event data from the backend using the id query parameter.
const loadEvent = async () => {
  if (!eventId) {
    showError('لا يوجد معرف فعالية صالح في الرابط.');
    return;
  }

  try {
    const response = await fetchWithAuth(`/api/events/${encodeURIComponent(eventId)}`);
    if (!response.ok) {
      throw new Error('فشل تحميل بيانات الفعالية.');
    }
    const event = await response.json();
    eventLoading.classList.add('hidden');
    eventDetails.classList.remove('hidden');
    renderEvent(event);
  } catch (err) {
    console.error(err);
    showError(err.message || 'حدث خطأ أثناء تحميل بيانات الفعالية.');
  }
};

// Post a user review to the backend and display success or error feedback.
const postReview = async () => {
  reviewMessage.textContent = '';
  const content = reviewContent.value.trim();
  const rating = Number(reviewRating.value || 0);
  if (!content) {
    reviewMessage.textContent = 'يرجى كتابة المراجعة قبل الإرسال.';
    return;
  }
  try {
    const response = await fetchWithAuth(`/api/events/${encodeURIComponent(eventId)}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, rating })
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'فشل إرسال المراجعة');
    }
    reviewMessage.textContent = 'تم إرسال المراجعة بنجاح.';
    reviewContent.value = '';
    reviewRating.value = '0';
    updateReviewStarSelection();
    await loadEvent();
  } catch (err) {
    reviewMessage.textContent = err.message;
  }
};

submitReviewBtn?.addEventListener('click', postReview);

loadEvent();
