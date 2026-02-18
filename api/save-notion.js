export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { personalKey, personalDbId, studentName, date, category, content, mode, studentIds, studentNames } = req.body;

    // ID가 비어있는지 서버에서도 한 번 더 체크
    if (!personalDbId) return res.status(400).json({ error: "데이터베이스 ID가 없습니다. 설정에서 확인해주세요." });

    let properties = {
        "구분": { "select": { "name": category } },
        "내용": { "rich_text": [{ "text": { "content": content } }] }
    };

    if (mode === 'relation' && studentIds && studentIds.length > 0) {
        /** [포트폴리오 모드] **/
        const summary = content.length > 15 ? content.substring(0, 15) + "..." : content;
        const displayTitle = `[${category}] ${summary}`;

        // ★ 선생님의 사진에 맞춰 "이름" -> "제목"으로 수정했습니다.
        properties["제목"] = { 
            "title": [{ "text": { "content": displayTitle } }] 
        };
        
        properties["학생"] = { "relation": studentIds.map(id => ({ "id": id })) };
        // "생성 일시"는 노션에서 자동 기록하므로 생략
    } else {
        /** [일반 기록 모드] **/
        properties["날짜"] = { "date": { "start": date } };
        // 일반 모드도 "이름" 대신 "제목"을 쓸 수 있도록 처리
        properties["제목"] = { 
            "title": [{ "text": { "content": Array.isArray(studentNames) ? studentNames.join(', ') : (studentName || "이름 없음") } }] 
        };
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
                parent: { database_id: personalDbId },
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