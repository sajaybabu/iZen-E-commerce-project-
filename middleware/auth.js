const isLogin = (req, res, next) => {
    if (req.session.user) {
        return res.redirect('/user/home');
    }
    next();
};

const checkSession = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/user/login');
    }
    next();
};

module.exports = {
    isLogin,
    checkSession
};