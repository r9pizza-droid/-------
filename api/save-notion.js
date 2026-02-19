export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    let { personalKey, personalDbId, studentName, date, category, content, mode, studentIds, testMode } = req.body;

    const cleanKey = personalKey ? personalKey.replace(/["']/g, '').trim() : '';
    const cleanDbId = personalDbId ? personalDbId.toString().replace(/["']/g, '').trim() : '';

    if (!cleanKey || !cleanDbId) return res.status(400).json({ error: "설정 정보가 누락되었습니다." });

    // [핵심] 모드에 따라 항목 이름을 자동으로 결정합니다.
    // 포트폴리오 모드(relation)면 "제목", 일반 모드면 "이름"을 사용합니다.
    const titlePropertyName = (mode === 'relation') ? "제목" : "이름";

    let properties = {};
    const pageIcon = { type: "emoji", emoji: testMode ? "🧪" : "🍀" };

    if (testMode) {
        /** ✅ 연동 테스트 모드 **/
        properties[titlePropertyName] = { 
            "title": [{ "text": { "content": `✅ [${titlePropertyName}] 칸 연동 테스트 성공!` } }] 
        };
    } else {
        /** 📝 실제 기록 저장 모드 **/
        if (mode === 'relation') {
            // [포트폴리오 모드] '제목' 칸에 요약본 저장
            const summary = content ? (content.length > 15 ? content.substring(0, 15) + "..." : content) : "새로운 기록";
            properties["제목"] = { "title": [{ "text": { "content": `[${category || "관찰"}] ${summary}` } }] };
            properties["분류"] = { "select": { "name": category || "관찰" } };
            properties["내용"] = { "rich_text": [{ "text": { "content": content || "" } }] };
            if (studentIds && studentIds.length > 0) {
                properties["학생"] = { "relation": studentIds.map(id => ({ "id": id })) };
            }
        } else {
            // [일반 모드] '이름' 칸에 학생 이름 저장
            properties["이름"] = { "title": [{ "text": { "content": studentName || "학생" } }] };
            properties["날짜"] = { "date": { "start": date || new Date().toISOString().split('T')[0] } };
            properties["분류"] = { "select": { "name": category || "관찰" } };
            properties["내용"] = { "rich_text": [{ "text": { "content": content || "" } }] };
        }
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