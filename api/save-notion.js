export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { personalKey, personalDbId, studentName, date, category, content, mode, studentIds, studentNames } = req.body;

    // 1. 공통 속성 (구분, 내용)
    let properties = {
        "구분": { "select": { "name": category } },
        "내용": { "rich_text": [{ "text": { "content": content } }] }
    };

    if (mode === 'relation' && studentIds && studentIds.length > 0) {
        /** [포트폴리오 모드 - 스타일 A 적용] **/
        
        // 제목 칸: "[칭찬] 내용 요약..." 형식으로 생성 (최대 15자 요약)
        const summary = content.length > 15 ? content.substring(0, 15) + "..." : content;
        const displayTitle = `[${category}] ${summary}`;

        properties["이름"] = { 
            "title": [{ "text": { "content": displayTitle } }] 
        };
        
        // 학생 관계형 링크 (여기서 '김가원' 등 학생 페이지가 연결됨)
        properties["학생"] = { 
            "relation": studentIds.map(id => ({ "id": id })) 
        };

        // ★ 생성일시는 노션에서 '생성 일시' 속성으로 설정했으므로 여기서 보내지 않습니다.

    } else {
        /** [일반 기록 모드] **/
        // 일반 모드는 기존처럼 "날짜" 칸(속성: 날짜)을 사용합니다.
        properties["날짜"] = { "date": { "start": date } };
        properties["이름"] = { 
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