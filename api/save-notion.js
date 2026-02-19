export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    let { personalKey, personalDbId, studentName, date, category, content, mode, studentIds } = req.body;

    const cleanDbId = personalDbId ? personalDbId.toString().replace(/"/g, '') : '';
    const finalCategory = category || "관찰"; // 분류 기본값

    if (!cleanDbId) return res.status(400).json({ error: "DB ID가 없습니다." });

    // 공통 속성 (분류, 내용)
    let properties = {
        "분류": { "select": { "name": finalCategory } },
        "내용": { "rich_text": [{ "text": { "content": content || "" } }] }
    };

    if (mode === 'relation') {
        /** [포트폴리오 모드] **/
        // 제목 칸 요약 (노션 속성명: 제목)
        const summary = content ? (content.length > 12 ? content.substring(0, 12) + "..." : content) : "기록";
        properties["제목"] = { "title": [{ "text": { "content": `[${finalCategory}] ${summary}` } }] };
        
        // 학생 관계형 연동 (노션 속성명: 학생)
        if (studentIds && studentIds.length > 0) {
            properties["학생"] = { "relation": studentIds.map(id => ({ "id": id })) };
        }
        // ★ 날짜는 보내지 않음 (노션 자동 생성일시 활용)
    } else {
        /** [기록 모드] 선생님의 요청: 날짜, 이름, 분류, 내용 **/
        properties["날짜"] = { "date": { "start": date || new Date().toISOString().split('T')[0] } };
        properties["이름"] = { "title": [{ "text": { "content": studentName || "기본 기록" } }] };
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