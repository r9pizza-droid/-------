export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    let { personalKey, personalDbId, studentName, date, category, content, mode, studentIds } = req.body;

    // 따옴표 및 공백 제거
    const cleanKey = personalKey ? personalKey.replace(/["']/g, '').trim() : '';
    const cleanDbId = personalDbId ? personalDbId.toString().replace(/["']/g, '').trim() : '';

    if (!cleanKey || !cleanDbId) return res.status(400).json({ error: "설정 정보가 부족합니다." });

    // 기본 공통 속성
    let properties = {
        "분류": { "select": { "name": category || "관찰" } },
        "내용": { "rich_text": [{ "text": { "content": content || "" } }] }
    };

    if (mode === 'relation') {
        /** [포트폴리오 모드] **/
        // 제목 구성
        const summary = content ? (content.length > 12 ? content.substring(0, 12) + "..." : content) : "기록";
        properties["제목"] = { "title": [{ "text": { "content": `[${category || "관찰"}] ${summary}` } }] };
        
        // 학생 관계형 연결
        if (studentIds && studentIds.length > 0) {
            properties["학생"] = { "relation": studentIds.map(id => ({ "id": id })) };
        }
        // ★ '생성 일시'는 노션이 자동으로 기록하므로 여기서는 날짜를 보내지 않습니다!
    } else {
        /** [일반 기록 모드] **/
        const finalDate = date ? date.substring(0, 10) : new Date().toISOString().split('T')[0];
        properties["날짜"] = { "date": { "start": finalDate } };
        properties["이름"] = { "title": [{ "text": { "content": studentName || "학생" } }] };
    }

    try {
        const response = await fetch('https://api.notion.com/v1/pages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${cleanKey}`,
                'Content-Type': 'application/json',
                'Notion-Version': '2022-06-28'
            },
            body: JSON.stringify({ 
                parent: { database_id: cleanDbId }, 
                icon: { type: "emoji", emoji: "🍀" }, 
                properties: properties 
            })
        });
        const data = await response.json();
        if (!response.ok) return res.status(response.status).json(data);
        res.status(200).json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
}