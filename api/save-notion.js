export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    let { personalKey, personalDbId, studentName, date, category, content, mode, studentIds } = req.body;

    // 1. 안전장치: ID 따옴표 제거 및 날짜/분류 기본값 설정
    const cleanDbId = personalDbId ? personalDbId.toString().replace(/"/g, '') : '';
    const finalDate = date || new Date().toISOString().split('T')[0]; // 날짜 없으면 오늘
    const finalCategory = category || "기록"; // 분류 없으면 "기록"

    if (!cleanDbId) return res.status(400).json({ error: "DB ID가 설정되지 않았습니다." });

    // 2. 선생님의 노션 DB 속성 이름: [날짜, 이름, 분류, 내용]
    let properties = {
        "분류": { "select": { "name": finalCategory } },
        "내용": { "rich_text": [{ "text": { "content": content || "" } }] },
        "이름": { "title": [{ "text": { "content": studentName || "기본 기록" } }] }
    };

    // 포트폴리오 모드(관계형)와 일반 모드에 따른 날짜 처리
    if (mode === 'relation') {
        /** [포트폴리오 모드] **/
        // 생성일시 자동기록을 위해 '날짜' 속성은 보내지 않음
        if (studentIds && studentIds.length > 0) {
            properties["학생"] = { "relation": studentIds.map(id => ({ "id": id })) };
        }
    } else {
        /** [일반 기록 모드] **/
        // 일반 모드에서는 '날짜' 속성을 반드시 보냄
        properties["날짜"] = { "date": { "start": finalDate } };
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