export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    let { personalKey, personalDbId, studentName, date, category, content, mode, studentIds } = req.body;

    const cleanKey = personalKey ? personalKey.replace(/["']/g, '').trim() : '';
    const cleanDbId = personalDbId ? personalDbId.toString().replace(/["']/g, '').trim() : '';

    if (!cleanKey || !cleanDbId) return res.status(400).json({ error: "설정 정보가 누락되었습니다." });

    // 아이콘 설정
    const pageIcon = { type: "emoji", emoji: "🍀" };
    
    // [공통 칸] 분류, 내용
    let properties = {
        "분류": { "select": { "name": category || "관찰" } },
        "내용": { "rich_text": [{ "text": { "content": content || "" } }] }
    };

    if (mode === 'relation') {
        /** [포트폴리오 모드] **/
        // 제목 칸에 "[분류] 요약내용..." 형태로 기록 (선생님이 원하신 요약 기능)
        const summary = content ? (content.length > 15 ? content.substring(0, 15) + "..." : content) : "새로운 기록";
        properties["제목"] = { 
            "title": [{ "text": { "content": `[${category || "관찰"}] ${summary}` } }] 
        };
        
        // 학생 칸: 관계형 연결
        if (studentIds && studentIds.length > 0) {
            properties["학생"] = { "relation": studentIds.map(id => ({ "id": id })) };
        }
    } else {
        /** [일반 기록 모드] **/
        // 일반 모드는 기존처럼 '이름' 칸을 사용 (일반 DB는 '이름' 칸을 유지하시면 됩니다)
        properties["이름"] = { "title": [{ "text": { "content": studentName || "학생" } }] };
        properties["날짜"] = { "date": { "start": date ? date.substring(0, 10) : new Date().toISOString().split('T')[0] } };
    }

    try {
        const response = await fetch('https://api.notion.com/v1/pages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${cleanKey}`,
                'Content-Type': 'application/json',
                'Notion-Version': '2022-06-28'
            },
            body: JSON.stringify({ parent: { database_id: cleanDbId }, icon: pageIcon, properties: properties })
        });
        const data = await response.json();
        if (!response.ok) return res.status(response.status).json(data);
        res.status(200).json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
}