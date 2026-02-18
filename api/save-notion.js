export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    let { personalKey, personalDbId, studentName, date, category, content, mode, studentIds, studentNames } = req.body;

    // ID 따옴표 제거 및 안전장치
    const cleanDbId = personalDbId ? personalDbId.toString().replace(/"/g, '') : '';
    const finalCategory = category || "미분류";

    if (!cleanDbId) return res.status(400).json({ error: "DB ID가 설정되지 않았습니다." });

    let properties = {
        "구분": { "select": { "name": finalCategory } },
        "내용": { "rich_text": [{ "text": { "content": content || "" } }] }
    };

    if (mode === 'relation' && studentIds && studentIds.length > 0) {
        /** [포트폴리오 모드] **/
        // 제목 칸 요약: [칭찬] 내용...
        const summary = content ? (content.length > 15 ? content.substring(0, 15) + "..." : content) : "내용 없음";
        properties["제목"] = { "title": [{ "text": { "content": `[${finalCategory}] ${summary}` } }] };
        
        // 학생 관계형 연동
        properties["학생"] = { "relation": studentIds.map(id => ({ "id": id })) };

        // ★ 핵심: 포트폴리오 모드에서는 '날짜' 속성을 보내지 않음 (노션 자동 생성일시 활용)
    } else {
        /** [일반 기록 모드] **/
        properties["날짜"] = { "date": { "start": date || new Date().toISOString().split('T')[0] } };
        properties["제목"] = { "title": [{ "text": { "content": studentName || "기본 기록" } }] };
    }

    try {
        const response = await fetch('https://api.notion.com/v1/pages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${personalKey}`, 'Content-Type': 'application/json', 'Notion-Version': '2022-06-28'
            },
            body: JSON.stringify({ parent: { database_id: cleanDbId }, properties: properties })
        });
        const data = await response.json();
        if (!response.ok) return res.status(response.status).json(data);
        res.status(200).json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
}