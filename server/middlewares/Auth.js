import Fetch from 'node-fetch';
import wrap from 'common/utils/wrap';

module.exports = () => {
    return wrap(async (req, res, next) => {
        const App = req.app;
        const User = App.models.User;
        const config = App.get('services');
        const service = App.get('service');

        const accessToken = req.headers.authorization ? req.headers.authorization.replace('Bearer ', '') : null;

        if (accessToken === null) {
            req.user = getAnonymousUser();
        } else {
            try {
                req.user = await getCurrentUser();
            } catch (error) {
                console.error(error);
                req.user = getAnonymousUser();
            }
        }

        function getAnonymousUser() {
            const permissions = service.anonymousPermissions ? {
                [service.group]: {
                    [service.name]: service.anonymousPermissions
                }
            } : {};

            return new User({
                id: '',
                firstName: "Anonymous",
                email: "guest@hope.ua",
                permissions
            });
        }

        async function getCurrentUser() {
            const apiResponse = await Fetch(`${config.auth.url}/users/self`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });

            const userData = await apiResponse.json();

            return new User(userData);
        }

        next();
    });
};
