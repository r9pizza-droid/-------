export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    let { personalKey, personalDbId, studentName, date, category, content, mode, studentIds } = req.body;

    // 1. ID 따옴표 제거 및 안전장치
    const cleanDbId = personalDbId ? personalDbId.toString().replace(/"/g, '') : '';
    const finalDate = date || new Date().toISOString().split('T')[0];
    const finalCategory = category || "관찰"; // 기본값

    if (!cleanDbId) return res.status(400).json({ error: "DB ID가 설정되지 않았습니다." });

    // 2. 공통 속성 매핑 (노션 칸 이름: 날짜, 이름, 분류, 내용)
    let properties = {
        "분류": { "select": { "name": finalCategory } },
        "내용": { "rich_text": [{ "text": { "content": content || "" } }] }
    };

    if (mode === 'relation') {
        /** [포트폴리오 모드] **/
        // 제목 요약
        const summary = content ? (content.length > 15 ? content.substring(0, 15) + "..." : content) : "기록";
        properties["이름"] = { "title": [{ "text": { "content": `[${finalCategory}] ${summary}` } }] };
        
        // 관계형 연결 (노션 칸 이름이 '학생'이어야 함)
        if (studentIds && studentIds.length > 0) {
            properties["학생"] = { "relation": studentIds.map(id => ({ "id": id })) };
        }
        // ★ 포트폴리오 모드는 '날짜' 칸을 보내지 않음 (노션 자동 생성일시용)
    } else {
        /** [일반 기록 모드] **/
        properties["날짜"] = { "date": { "start": finalDate } };
        properties["이름"] = { "title": [{ "text": { "content": studentName || "기본 기록" } }] };
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