export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    let { personalKey, personalDbId, studentName, date, category, content, mode, studentIds, studentNames } = req.body;

    // ID 따옴표 제거 및 안전장치
    const cleanDbId = personalDbId ? personalDbId.toString().replace(/"/g, '') : '';
    
    // [해결] 카테고리(구분) 값이 없으면 "미분류"로 자동 지정
    const finalCategory = (category && category.trim() !== "") ? category : "미분류";

    if (!cleanDbId) return res.status(400).json({ error: "DB ID가 설정되지 않았습니다." });

    let properties = {
        "구분": { "select": { "name": finalCategory } }, // 비어있지 않도록 보장
        "내용": { "rich_text": [{ "text": { "content": content || "" } }] }
    };

    if (mode === 'relation') {
        const summary = content ? (content.length > 15 ? content.substring(0, 15) + "..." : content) : "내용 없음";
        properties["제목"] = { "title": [{ "text": { "content": `[${finalCategory}] ${summary}` } }] };
        properties["학생"] = { "relation": (studentIds || []).map(id => ({ "id": id })) };
    } else {
        properties["날짜"] = { "date": { "start": date } };
        properties["제목"] = { "title": [{ "text": { "content": studentName || "기본 기록" } }] };
    }

    try {
        const response = await fetch('https://api.notion.com/v1/pages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${personalKey}`,
                'Content-Type': 'application/json',
                'Notion-Version': '2022-06-28'
            },
            body: JSON.stringify({ parent: { database_id: cleanDbId }, properties: properties })
        });

        const data = await response.json();
        if (!response.ok) return res.status(response.status).json(data);
        res.status(200).json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
}