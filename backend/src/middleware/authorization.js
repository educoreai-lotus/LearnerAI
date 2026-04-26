function requireSelfUser(paramName = 'userId') {
  return (req, res, next) => {
    const targetUserId = req.params[paramName];

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        error: 'Target user ID is required'
      });
    }

    if (!req.user?.directory_user_id) {
      return res.status(401).json({
        success: false,
        error: 'Authenticated user context is missing'
      });
    }

    if (req.user.directory_user_id !== targetUserId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: user can only access their own learning data'
      });
    }

    return next();
  };
}

export { requireSelfUser };
