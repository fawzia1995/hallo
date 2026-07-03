(function () {
  const translations = {
    ar: {
      home: 'الرئيسية',
      about: 'عن الموقع',
      profile: 'صفحتي',
      install: 'تثبيت التطبيق',
      login: 'تسجيل الدخول',
      loginBtn: 'دخول',
      register: 'إنشاء حساب جديد',
      createAccountBtn: 'إنشاء الحساب',
      forgotPassword: 'نسيت كلمة المرور',
      resetPasswordBtn: 'إرسال رابط إعادة التعيين',
      logout: 'تسجيل الخروج',
      welcome: 'مرحبا بك',
      siteTitle: 'موقع فعاليات محافظة درعا',
      siteSubtitle: 'سجل دخول لعرض الفعاليات أو لإدارة المحتوى إذا كنت مدير.',
      username: 'اسم المستخدم',
      password: 'كلمة المرور',
      createAccountLink: 'إنشاء حساب جديد',
      resendActivationLink: 'إعادة إرسال رابط التفعيل',
      forgotPasswordLink: 'إعادة تعيين كلمة المرور',
      loginLink: 'تسجيل الدخول',
      resendActivation: 'إعادة إرسال رابط التفعيل',
      sendLinkBtn: 'إرسال الرابط',
      backToLogin: 'العودة لتسجيل الدخول',
      eventDetailsTitle: 'تفاصيل الفعالية',
      eventCountLabel: 'عدد الفعاليات:',
      of: 'من',
      noMatchingEvents: 'لا توجد فعاليات تطابق معايير البحث.',
      confirmed: 'المؤكدون:',
      maybe: 'ربما:',
      commentsCount: 'عدد التعليقات:',
      communityComments: 'تعليقات المجتمع',
      loadingComments: 'جارٍ تحميل التعليقات...',
      yourRating: 'تقييمك',
      commentPlaceholder: 'اكتب تعليقك هنا...',
      submitComment: 'أرسل التعليق',
      loginToComment: 'سجل دخول لتتمكن من المشاركة بالتعليقات.',
      noRatings: 'بدون تقييم',
      reviewsCount: 'تقييمات',
      rate: 'قيّم بـ',
      aboutPageTitle: 'عن موقع فعاليات درعا',
      aboutPageSubtitle: 'منصة تجمع بين الفعاليات المحلية والخبرة المجتمعية.',
      aboutLead: 'يهدف هذا الموقع إلى تسهيل اكتشاف الفعاليات في محافظة درعا ومشاركة المجتمع فيها.',
      aboutFeaturesTitle: 'ما الذي يقدمه الموقع؟',
      aboutFeature1Title: 'إدارة الفعاليات',
      aboutFeature1Text: 'إضافة وتعديل وحذف الفعاليات بسهولة عبر لوحة إدارة واضحة.',
      aboutFeature2Title: 'التقييمات والتعليقات',
      aboutFeature2Text: 'يمكن للزوار ترك تقييمات وتعليقات لتمكين المجتمع من اختيار الأفضل.',
      aboutFeature3Title: 'اللغة المزدوجة',
      aboutFeature3Text: 'واجهة بسيطة يمكن استخدامها بالعربية أو الإنجليزية بلمسة واحدة.',
      aboutFooter: 'مصمم لتجربة سلسة للمستخدمين والإدارة على حد سواء.'
    },
    en: {
      home: 'Home',
      about: 'About',
      profile: 'My Profile',
      install: 'Install App',
      login: 'Login',
      loginBtn: 'Enter',
      register: 'Create Account',
      createAccountBtn: 'Create Account',
      forgotPassword: 'Forgot Password',
      resetPasswordBtn: 'Send Reset Link',
      logout: 'Logout',
      welcome: 'Welcome',
      siteTitle: 'Daraa Events Portal',
      siteSubtitle: 'Sign in to view events or manage content if you are an admin.',
      username: 'Username',
      password: 'Password',
      createAccountLink: 'Create a new account',
      resendActivationLink: 'Resend activation link',
      forgotPasswordLink: 'Reset password',
      loginLink: 'Login',
      resendActivation: 'Resend Activation Link',
      sendLinkBtn: 'Send Link',
      backToLogin: 'Back to login',
      eventDetailsTitle: 'Event Details',
      eventCountLabel: 'Events count:',
      of: 'of',
      noMatchingEvents: 'No events match the current filters.',
      confirmed: 'Confirmed:',
      maybe: 'Maybe:',
      commentsCount: 'Comments:',
      communityComments: 'Community Comments',
      loadingComments: 'Loading comments...',
      yourRating: 'Your Rating',
      commentPlaceholder: 'Write your comment here...',
      submitComment: 'Send Comment',
      loginToComment: 'Sign in to join the conversation.',
      noRatings: 'No rating yet',
      reviewsCount: 'reviews',
      rate: 'Rate with',
      aboutPageTitle: 'About Daraa Events',
      aboutPageSubtitle: 'A platform that connects local events with the community experience.',
      aboutLead: 'This site makes it easier to discover events in Daraa Governorate and share them with the community.',
      aboutFeaturesTitle: 'What the platform offers',
      aboutFeature1Title: 'Event Management',
      aboutFeature1Text: 'Add, edit, and delete events easily through a clear admin dashboard.',
      aboutFeature2Title: 'Ratings and Comments',
      aboutFeature2Text: 'Visitors can leave reviews and comments to help the community choose the best experiences.',
      aboutFeature3Title: 'Dual Language Support',
      aboutFeature3Text: 'The interface works smoothly in Arabic or English with a single toggle.',
      aboutFooter: 'Designed to provide a smooth experience for both users and administrators.'
    }
  };

  const storageKey = 'eventAppLanguage';
  let currentLanguage = localStorage.getItem(storageKey) || 'ar';

  const applyPageTranslations = () => {
    document.documentElement.lang = currentLanguage;
    document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';

    document.querySelectorAll('[data-i18n]').forEach((element) => {
      const key = element.getAttribute('data-i18n');
      const value = translations[currentLanguage][key] || translations.ar[key];
      if (value) {
        element.textContent = value;
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
      const key = element.getAttribute('data-i18n-placeholder');
      const value = translations[currentLanguage][key] || translations.ar[key];
      if (value) {
        element.setAttribute('placeholder', value);
      }
    });

    const toggle = document.getElementById('langToggle');
    if (toggle) {
      toggle.textContent = currentLanguage === 'ar' ? 'EN' : 'العربية';
    }

    document.dispatchEvent(new CustomEvent('languagechanged', { detail: { lang: currentLanguage } }));
  };

  const setLanguage = (lang) => {
    if (!translations[lang]) {
      lang = 'ar';
    }
    currentLanguage = lang;
    localStorage.setItem(storageKey, lang);
    applyPageTranslations();
  };

  const getLanguage = () => currentLanguage;
  const t = (key, lang = currentLanguage) => translations[lang]?.[key] || translations.ar[key] || key;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyPageTranslations);
  } else {
    applyPageTranslations();
  }

  window.appI18n = { setLanguage, getLanguage, t, applyPageTranslations };
  window.setAppLanguage = setLanguage;
})();
