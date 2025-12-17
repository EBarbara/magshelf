const http = require('http');

async function testSettings() {
    const baseUrl = 'http://localhost:3000/api/settings';
    const scanUrl = 'http://localhost:3000/api/scan';

    // Helper to request
    const request = (url, method = 'GET', body = null) => {
        return new Promise((resolve, reject) => {
            const options = {
                method,
                headers: { 'Content-Type': 'application/json' }
            };
            const req = http.request(url, options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data || '{}') }));
            });
            req.on('error', reject);
            if (body) req.write(JSON.stringify(body));
            req.end();
        });
    };

    try {
        console.log('1. Setting LIBRARY_PATH to ./data_test');
        const setRes = await request(baseUrl, 'POST', { key: 'LIBRARY_PATH', value: './data_test' });
        console.log('Set Response:', setRes.body);

        console.log('2. Getting Settings');
        const getRes = await request(baseUrl, 'GET');
        console.log('Get Response:', getRes.body);

        if (getRes.body.LIBRARY_PATH === './data_test') {
            console.log('SUCCESS: Settings persisted correctly.');
        } else {
            console.error('FAILURE: Settings mismatch.');
        }

    } catch (e) {
        console.error('Test Failed:', e);
    }
}

testSettings();
