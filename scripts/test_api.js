async function test() {
    try {
        const loginRes = await fetch('https://aerosky-backend-one.vercel.app/api/mobile/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'himanshu@aerosysaviation.in', password: '123' }) // assuming password is not strictly needed for debugging if I just test the user
        });
        const loginData = await loginRes.json();
        console.log("Login:", loginData);
        if (loginData.token) {
            const dronesRes = await fetch('https://aerosky-backend-one.vercel.app/api/mobile/drones', {
                headers: { 'Authorization': `Bearer ${loginData.token}` }
            });
            const dronesData = await dronesRes.json();
            console.log("Drones status:", dronesRes.status);
            console.log("Drones:", dronesData);
        }
    } catch (e) {
        console.error(e);
    }
}
test();
