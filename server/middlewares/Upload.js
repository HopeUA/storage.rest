import App from 'server/server';
import Path from 'path';
import Fs from 'fs-extra-promise';
import ApiError from '@hope/error';

import wrap from 'common/utils/wrap';
import Acl from 'common/utils/acl';

const config = App.get('service');

module.exports = () => {
    return wrap(async (req, res) => {
        if (!Acl.isGranted(req.user, 'files:write', req.path)) {
            throw new ApiError({
                status: 401,
                message: 'Access denied'
            });
        }

        const filePath = Path.resolve(
            __dirname + '/../..',
            config.rootPath + req.path
        );

        const pathInfo = Path.parse(filePath);
        if (pathInfo.ext === '' || pathInfo.ext === '.') {
            throw new ApiError({
                status: 403,
                message: 'File extension is not set'
            });
        }

        await Fs.ensureDirAsync(pathInfo.dir);

        const stream = Fs.createWriteStream(filePath);
        req.pipe(stream);

        res.status(201);
        res.header({
            Location: req.path
        });
        res.end();
    });
};
