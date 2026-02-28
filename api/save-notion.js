export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    let { personalKey, personalDbId, studentName, date, category, content, mode, studentIds, testMode } = req.body;

    const cleanKey = personalKey ? String(personalKey).replace(/["']/g, '').trim() : '';
    const cleanDbId = personalDbId ? String(personalDbId).replace(/["']/g, '').trim() : '';

    if (!cleanKey || !cleanDbId) return res.status(400).json({ error: "설정 정보가 누락되었습니다." });

    const titlePropertyName = (mode === 'relation') ? "제목" : "이름";
    let properties = {};
    const pageIcon = { type: "emoji", emoji: testMode ? "🧪" : "🍀" };

    // 🌟 1. 핵심: 에러 방지용 '안전한 관계형 배열' 생성 함수
    // null이나 길이가 맞지 않는 잘못된 ID가 들어오면 서버가 죽지 않고 알아서 걸러줍니다.
    const getCleanRelationArray = (ids) => {
        if (!ids || !Array.isArray(ids)) return [];
        return ids
            .filter(id => id != null && id !== "") 
            .map(id => String(id).replace(/["']/g, '').trim())
            .filter(id => id.length === 32 || id.length === 36) // 노션 ID 길이(32자) 검증
            .map(id => ({ "id": id }));
    };

    if (testMode) {
        /** ✅ 연동 테스트 모드 **/
        properties[titlePropertyName] = { 
            "title": [{ "text": { "content": `✅ [${titlePropertyName}] 칸 연동 테스트 성공!` } }] 
        };
        
        // 🌟 2. 요청하신 기능: 테스트 모드에서도 선택한 학생들(studentIds)이 
        // 노션의 '학생' 관계형 칸에 한꺼번에 잘 들어가는지 테스트합니다.
        if (mode === 'relation' && studentIds) {
            const relationArray = getCleanRelationArray(studentIds);
            if (relationArray.length > 0) {
                properties["학생"] = { "relation": relationArray };
            }
        }
    } else {
        /** 📝 실제 기록 저장 모드 **/
        if (mode === 'relation') {
            const summary = content ? (content.length > 15 ? content.substring(0, 15) + '...' : content) : "포트폴리오 기록";
            properties["제목"] = { "title": [{ "text": { "content": summary } }] };
            properties["날짜"] = { "date": { "start": date || new Date().toISOString().split('T')[0] } };
            properties["내용"] = { "rich_text": [{ "text": { "content": content || "" } }] };
            
            // 안전하게 필터링된 ID들만 노션으로 전송
            const relationArray = getCleanRelationArray(studentIds);
            if (relationArray.length > 0) {
                properties["학생"] = { "relation": relationArray };
            }
        } else {
            properties["이름"] = { "title": [{ "text": { "content": studentName || "학생" } }] };
            properties["날짜"] = { "date": { "start": date || new Date().toISOString().split('T')[0] } };
            properties["분류"] = { "select": { "name": category || "관찰" } };
            properties["내용"] = { "rich_text": [{ "text": { "content": content || "" } }] };
        }
    }

    // 여기서부터 노션으로 실제 쏘는 부분 (에러가 나면 화면에 띄워줌)
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
        if (!response.ok) {
            throw new Error(data.message || "노션 저장에 실패했습니다.");
        }
        
        return res.status(200).json({ success: true, data: data });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}