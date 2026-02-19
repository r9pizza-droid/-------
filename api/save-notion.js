export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    let { personalKey, personalDbId, studentName, date, category, content, mode, studentIds } = req.body;

    // 1. ID 따옴표 및 공백 제거
    const cleanDbId = personalDbId ? personalDbId.toString().replace(/"/g, '').trim() : '';
    
    // ★ [핵심 해결책] 앱에서 잘못된 시간 형식이 넘어와도 무조건 앞의 10자리(날짜)만 잘라서 사용합니다!
    const finalDate = date ? date.substring(0, 10) : new Date().toISOString().split('T')[0];
    const finalCategory = category || "관찰";

    if (!cleanDbId) return res.status(400).json({ error: "DB ID가 없습니다." });

    // 2. 공통 속성 및 🍀 페이지 아이콘 설정
    const pageIcon = { type: "emoji", emoji: "🍀" };
    let properties = {
        "분류": { "select": { "name": finalCategory } },
        "내용": { "rich_text": [{ "text": { "content": content || "" } }] }
    };

    if (mode === 'relation') {
        // [포트폴리오 모드]
        const summary = content ? (content.length > 12 ? content.substring(0, 12) + "..." : content) : "기록";
        properties["제목"] = { "title": [{ "text": { "content": `[${finalCategory}] ${summary}` } }] };
        if (studentIds && studentIds.length > 0) {
            properties["학생"] = { "relation": studentIds.map(id => ({ "id": id })) };
        }
    } else {
        // [일반 기록 모드]
        // ★ 에러 없이 깔끔하게 정제된 finalDate를 전송합니다.
        properties["날짜"] = { "date": { "start": finalDate } };
        // 이름에 🍀 빼고 순수 이름만 전송 (페이지 아이콘으로 대체)
        properties["이름"] = { "title": [{ "text": { "content": studentName || "학생" } }] };
    }

    try {
        const response = await fetch('https://api.notion.com/v1/pages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${personalKey}`,
                'Content-Type': 'application/json',
                'Notion-Version': '2022-06-28'
            },
            body: JSON.stringify({ parent: { database_id: cleanDbId }, icon: pageIcon, properties: properties })
        });
        const data = await response.json();
        if (!response.ok) return res.status(response.status).json(data);
        res.status(200).json({ success: true });
    } catch (error) { 
        res.status(500).json({ error: error.message }); 
    }
}