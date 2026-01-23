
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NzI3ZGFlNmMxY2FhYmQyNmI5NDI0NiIsImlhdCI6MTc2OTExMDk3M30.brcOtoA30GzsU50zCO-zv-HZ47o0XiCIXBvjinS5YnQ";

async function test() {
    try {
        console.log("Fetching docs...");
        const res = await fetch('http://localhost:5000/docs', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error(`List failed: ${res.status}`);
        const docs = await res.json();
        console.log(`Found ${docs.length} docs.`);

        if (docs.length > 0) {
            const docId = docs[0]._id;
            console.log(`Testing content fetch for ${docId}...`);

            const contentRes = await fetch(`http://localhost:5000/docs/${docId}/content`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log("Content fetch status:", contentRes.status);
            if (contentRes.ok) {
                const data = await contentRes.json();
                console.log("Content length:", data.content ? data.content.length : 'undefined');
            } else {
                console.log("Error body:", await contentRes.text());
            }
        }
    } catch (err) {
        console.error("Error:", err);
    }
}

test();
