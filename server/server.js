import Loopback from 'loopback';
import Boot from 'loopback-boot';

const app = module.exports = Loopback();

app.start = () => {
    // start the web server
    return app.listen(() => {
        app.emit('started');
        const baseUrl = app.get('url').replace(/\/$/, '');
        console.log('REST API is available at: %s', baseUrl);
    });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
Boot(app, __dirname, (err) => {
    if (err) {
        throw err;
    }

    // start the server if `$ node server.js`
    if (require.main === module) {
        app.start();
    }
});
