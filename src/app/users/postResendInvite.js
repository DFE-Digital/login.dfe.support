const {resendInvite} = require('./../../infrastructure/directories');
const postResendInvite  = async (req, res) => {
  const resend = await resendInvite(req.params.uid.substr(4));
  if (!resend) {
    // change this to warning
    res.flash('info', `Failed to send invitation email to ${req.session.user.firstName} ${req.session.user.lastName}`);
    return res.redirect(req.header('Referer'));
  }
  res.flash('info', `Resent invitation email to ${req.session.user.firstName} ${req.session.user.lastName}`);
  return res.redirect(req.header('Referer'));

};

module.exports = postResendInvite;