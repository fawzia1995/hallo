const generateToken = () => Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

const getResetPasswordUrl = ({ host, token }) => `${host}/reset-password?token=${encodeURIComponent(token)}`;
const getActivationUrl = ({ host, token }) => `${host}/api/activate?token=${encodeURIComponent(token)}`;

const buildResetPasswordEmailHtml = ({ username, resetUrl }) => `
      <p>مرحباً ${username},</p>
      <p>لقد طلبت إعادة تعيين كلمة المرور لحسابك في موقع فعاليات درعا.</p>
      <p>اضغط الرابط التالي لإعادة تعيين كلمة المرور:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>إذا لم تطلب هذا، تجاهل الرسالة.</p>
      <p>الرابط صالح لمدة ساعة واحدة.</p>
    `;

const buildActivationEmailHtml = ({ username, activationUrl }) => `
      <p>مرحباً ${username},</p>
      <p>شكراً لتسجيلك في موقع فعاليات درعا.</p>
      <p>اضغط الرابط التالي لتفعيل حسابك:</p>
      <p><a href="${activationUrl}">${activationUrl}</a></p>
      <p>إذا لم تطلب هذا، تجاهل الرسالة.</p>
      <p>الرابط صالح لمدة 24 ساعة.</p>
    `;

const makeAttachOptionalUser = (getUserFromToken) => (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  req.user = token ? getUserFromToken(token) : null;
  next();
};

const makeRequireAuth = (getUserFromToken) => (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const user = token ? getUserFromToken(token) : null;
  if (!user) {
    return res.status(401).json({ error: 'غير مصرح بالدخول' });
  }
  req.user = user;
  next();
};

const makeRequireAdmin = (getUserFromToken) => (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const user = token ? getUserFromToken(token) : null;
  if (!user) {
    return res.status(401).json({ error: 'غير مصرح بالدخول' });
  }
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'صلاحية المدير مطلوبة' });
  }
  req.user = user;
  next();
};

module.exports = {
  generateToken,
  getResetPasswordUrl,
  getActivationUrl,
  buildResetPasswordEmailHtml,
  buildActivationEmailHtml,
  makeAttachOptionalUser,
  makeRequireAuth,
  makeRequireAdmin
};
