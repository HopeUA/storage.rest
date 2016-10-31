import Minimatch from 'minimatch';

const App = require('server/server');

export default class Acl {
    static isGranted(user, policy, resource = null) {
        // Get permissions for current service
        const service = App.get('service');
        if (!(user.permissions[service.domain] && user.permissions[service.domain][service.name])) {
            return false;
        }
        const permissions = user.permissions[service.domain][service.name];

        // Check current
        if (!permissions[policy]) {
            return false;
        }

        const permission = permissions[policy];
        const match = permission.findIndex((mask) => {
            return Minimatch(resource, mask);
        });

        return (match !== -1);
    }
}
