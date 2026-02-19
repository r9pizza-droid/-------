export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    let { personalKey, personalDbId, studentName, date, category, content, mode, studentIds } = req.body;

    // [핵심 수정] API Key와 DB ID에서 모든 종류의 따옴표(" 또는 ')를 강제로 제거합니다.
    const cleanKey = personalKey ? personalKey.replace(/["']/g, '').trim() : '';
    const cleanDbId = personalDbId ? personalDbId.toString().replace(/["']/g, '').trim() : '';

    if (!cleanKey) return res.status(400).json({ error: "API Key가 전달되지 않았습니다." });
    if (!cleanDbId) return res.status(400).json({ error: "DB ID가 없습니다." });

    // 날짜 형식 정제 (YYYY-MM-DD)
    const finalDate = date ? date.substring(0, 10) : new Date().toISOString().split('T')[0];
    const pageIcon = { type: "emoji", emoji: "🍀" };
    
    let properties = {
        "분류": { "select": { "name": category || "관찰" } },
        "내용": { "rich_text": [{ "text": { "content": content || "" } }] }
    };

    if (mode === 'relation') {
        const summary = content ? (content.length > 12 ? content.substring(0, 12) + "..." : content) : "기록";
        properties["제목"] = { "title": [{ "text": { "content": `[${category || "관찰"}] ${summary}` } }] };
        if (studentIds && studentIds.length > 0) {
            properties["학생"] = { "relation": studentIds.map(id => ({ "id": id })) };
        }
    } else {
        properties["날짜"] = { "date": { "start": finalDate } };
        properties["이름"] = { "title": [{ "text": { "content": studentName || "학생" } }] };
    }

    try {
        const response = await fetch('https://api.notion.com/v1/pages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${cleanKey}`, // 정제된 키 사용
                'Content-Type': 'application/json',
                'Notion-Version': '2022-06-28'
            },
            body: JSON.stringify({ parent: { database_id: cleanDbId }, icon: pageIcon, properties: properties })
        });
        const data = await response.json();
        if (!response.ok) return res.status(response.status).json(data);
        res.status(200).json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
}