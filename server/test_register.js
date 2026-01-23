
async function testRegister() {
    try {
        const response = await fetch('http://localhost:5000/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'testu_' + Date.now(),
                email: 'test' + Date.now() + '@example.com',
                password: 'password123'
            })
        });

        if (response.ok) {
            console.log('Registration successful');
        } else {
            console.log('Registration failed:', await response.text());
        }
    } catch (error) {
        console.error('Network Error:', error.message);
    }
}

testRegister();
