import test from 'ava';
import request from 'supertest-as-promised';
import App from '../server/server';

import Fs from 'fs-extra-promise';
import Path from 'path';
import Nock from 'nock';

// Root directory for file storage
const config = App.get('service');
const services = App.get('services');

const rootPath = Path.resolve('..', config.rootPath);
const fileName = '/dir/file.txt';
const badFileName = '/dir/file';
const filePath = Path.join(rootPath, fileName);
const fileContent = 'File content';
const fileOverwritedContent = 'New file content';

test.before('Root directory clean', async t => {
    await Fs.emptyDirAsync(rootPath);
});

test.before('Mock Auth service', async t => {
    Nock(services.auth.url)
        .persist()
        .get('/users/self')
        .reply(302, null, { location: `${services.auth.url}/users/userid` })
        .get('/users/userid')
        .reply(200, {
            id: 'userid',
            permissions: {
                [config.domain]: {
                    storage: {
                        'files.read': [
                            '/ro/*',
                            '/dir',
                            '/dir/*'
                        ],
                        'files.write': [
                            '/rw/*',
                            '/dir',
                            '/dir/*'
                        ]
                    }
                }
            }
        });
});

test.serial('File upload', async t => {
    const res = await request(App)
        .post(fileName)
        .set({ Authorization: 'Bearer Token' })
        .send(fileContent)
        .expect(201);

    const uploadedContent = await Fs.readFileAsync(filePath);
    t.is(uploadedContent.toString('utf8'), fileContent);
});

test.serial('Bad file upload', async t => {
    await request(App)
        .post(badFileName)
        .set({ Authorization: 'Bearer Token' })
        .send(fileContent)
        .expect(403);
});

test.serial('Overwrite file', async t => {
    const res = await request(App)
        .post(fileName)
        .set({ Authorization: 'Bearer Token' })
        .send(fileOverwritedContent)
        .expect(201);

    const uploadedContent = await Fs.readFileAsync(filePath);
    t.is(uploadedContent.toString('utf8'), fileOverwritedContent);
});

test.serial('Get file', async t => {
    const res = await request(App)
        .get(fileName)
        .set({ Authorization: 'Bearer Token' })
        .expect(200);
    t.is(res.text, fileOverwritedContent);
});

test.serial('Directory listing not allowed', async t => {
    const dirName = Path.dirname(fileName);

    await request(App)
        .get(dirName)
        .set({ Authorization: 'Bearer Token' })
        .expect(404);
});

test.serial('Get file info', async t => {
    const res = await request(App)
        .head(fileName)
        .set({ Authorization: 'Bearer Token' })
        .expect(200);

    t.true(res.headers['content-length'] > 0);
    t.not(res.headers['last-modified'], undefined);
});

test.serial('Access denied on read', async t => {
    const res = await request(App)
        .get(fileName)
        .expect(401);
});

test.serial('Access denied on write', async t => {
    const res = await request(App)
        .post(fileName)
        .send(fileContent)
        .expect(401);
});

test.after('Root directory clean', async t => {
    await Fs.removeAsync(rootPath);
});
