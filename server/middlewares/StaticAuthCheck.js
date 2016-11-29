import ApiError from '@hope/error';

import wrap from 'common/utils/wrap';
import Acl from 'common/utils/acl';

module.exports = () => {
    return wrap(async (req, res, next) => {
        if (!Acl.isGranted(req.user, 'files:read', req.path)) {
            throw new ApiError({
                status: 401,
                message: 'Access denied'
            });
        }

        next();
    });
};
