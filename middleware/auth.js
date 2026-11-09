
// Check if the user is logged in
const isAuthenticated = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/');
    }

    next();
};

// Allow only administrators
const isAdmin = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/');
    }

    if (req.session.user.role !== 'admin') {
        return res.status(403).render('errors/403', {
            title: 'Access Denied',
            message: 'You are not authorized to access this page.',
            layout:false
        });
    }

    next();
};

// Allow only normal users
const isUser = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/');
    }

    if (req.session.user.role !== 'user') {
        return res.status(403).render('errors/403', {
            title: 'Access Denied',
            message: 'You are not authorized to access this page.',
            layout:false
        });
    }

    next();
};

module.exports = {
    isAuthenticated,
    isAdmin,
    isUser
};
