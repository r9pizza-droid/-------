export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    let { personalKey, personalDbId, studentName, date, category, content, mode, studentIds, studentNames } = req.body;

    // [수정] ID 앞뒤에 붙은 따옴표(")를 강제로 제거하는 안전장치
    const cleanDbId = personalDbId ? personalDbId.toString().replace(/"/g, '') : '';

    if (!cleanDbId) return res.status(400).json({ error: "데이터베이스 ID가 설정되지 않았습니다." });

    let properties = {
        "구분": { "select": { "name": category } },
        "내용": { "rich_text": [{ "text": { "content": content } }] }
    };

    if (mode === 'relation') {
        /** [포트폴리오 모드] **/
        // 사진 속 노션 칸 이름인 "제목"과 "학생"을 사용합니다.
        const summary = content.length > 15 ? content.substring(0, 15) + "..." : content;
        properties["제목"] = { "title": [{ "text": { "content": `[${category}] ${summary}` } }] };
        properties["학생"] = { "relation": studentIds.map(id => ({ "id": id })) };
    } else {
        /** [일반 기록 모드] **/
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