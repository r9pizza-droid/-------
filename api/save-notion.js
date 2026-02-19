export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    let { personalKey, personalDbId, studentName, date, category, content, mode, studentIds } = req.body;

    // 1. 안전장치: ID 따옴표 제거 및 기본값 설정
    const cleanDbId = personalDbId ? personalDbId.toString().replace(/"/g, '') : '';
    const finalDate = date || new Date().toISOString().split('T')[0]; // 날짜가 비었으면 오늘 날짜
    const finalCategory = category || "기록"; // 분류가 비었으면 "기록"

    if (!cleanDbId) return res.status(400).json({ error: "DB ID가 설정되지 않았습니다." });

    // 2. 선생님의 노션 DB 속성 이름에 맞게 매핑 (날짜, 이름, 분류, 내용)
    let properties = {
        "분류": { "select": { "name": finalCategory } },
        "내용": { "rich_text": [{ "text": { "content": content || "" } }] },
        "날짜": { "date": { "start": finalDate } },
        "이름": { "title": [{ "text": { "content": studentName || "기록" } }] }
    };

    // 3. 포트폴리오 모드(관계형)일 경우 추가 처리
    if (mode === 'relation' && studentIds && studentIds.length > 0) {
        // 관계형 속성 이름이 '학생'인 경우에만 아래 줄이 작동합니다.
        properties["학생"] = { "relation": studentIds.map(id => ({ "id": id })) };
        
        // 포트폴리오 모드일 때 제목을 요약형으로 바꾸고 싶다면 아래 주석을 해제하세요.
        // properties["이름"] = { "title": [{ "text": { "content": `[${finalCategory}] ${content.substring(0, 10)}...` } }] };
    }

    try {
        const response = await fetch('https://api.notion.com/v1/pages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${personalKey}`,
                'Content-Type': 'application/json',
                'Notion-Version': '2022-06-28'
            },
            body: JSON.stringify({
                parent: { database_id: cleanDbId },
                properties: properties
            })
        });

        const data = await response.json();
        if (!response.ok) return res.status(response.status).json(data);
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}