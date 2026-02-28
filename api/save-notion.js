export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    let { personalKey, personalDbId, studentName, date, category, content, mode, studentIds, testMode } = req.body;

    const cleanKey = personalKey ? String(personalKey).replace(/["']/g, '').trim() : '';
    const cleanDbId = personalDbId ? String(personalDbId).replace(/["']/g, '').trim() : '';

    if (!cleanKey || !cleanDbId) return res.status(400).json({ error: "설정 정보가 누락되었습니다." });

    const titlePropertyName = (mode === 'relation') ? "제목" : "이름";
    let properties = {};
    const pageIcon = { type: "emoji", emoji: testMode ? "🧪" : "🍀" };

    const getCleanRelationArray = (ids) => {
        if (!ids || !Array.isArray(ids)) return [];
        return ids
            .filter(id => id != null && id !== "") 
            .map(id => String(id).replace(/["']/g, '').trim())
            .filter(id => id.length === 32 || id.length === 36)
            .map(id => ({ "id": id }));
    };

    if (testMode) {
        /** ✅ 연동 테스트 모드 **/
        properties[titlePropertyName] = { 
            "title": [{ "text": { "content": `✅ [${titlePropertyName}] 칸 연동 테스트 성공!` } }] 
        };
        
        if (mode === 'relation' && studentIds) {
            const relationArray = getCleanRelationArray(studentIds);
            if (relationArray.length > 0) {
                properties["학생"] = { "relation": relationArray };
            }
        }
    } else {
        /** 📝 실제 기록 저장 모드 **/
        if (mode === 'relation') {
            
            // 🌟 수정된 부분: 요약 내용 앞에 [카테고리] 말머리를 붙입니다.
            const summaryText = content ? (content.length > 15 ? content.substring(0, 15) + '...' : content) : "기록 내용 없음";
            const categoryPrefix = category ? `[${category}]` : "[기록]"; // 카테고리가 없으면 기본값 [기록]
            const finalTitle = `${categoryPrefix} ${summaryText}`;

            properties["제목"] = { "title": [{ "text": { "content": finalTitle } }] };
            properties["날짜"] = { "date": { "start": date || new Date().toISOString().split('T')[0] } };
            properties["내용"] = { "rich_text": [{ "text": { "content": content || "" } }] };
            
            const relationArray = getCleanRelationArray(studentIds);
            if (relationArray.length > 0) {
                properties["학생"] = { "relation": relationArray };
            }
        } else {
            // [일반 모드]
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
        if (!response.ok) {
            let errorMsg = data.message || "노션 저장에 실패했습니다.";
            
            if (data.code === 'unauthorized') {
                errorMsg = "API 키가 잘못되었습니다. (Unauthorized)";
            } else if (data.code === 'object_not_found') {
                errorMsg = "데이터베이스 ID를 찾을 수 없습니다. (Object Not Found)";
            } else if (data.code === 'validation_error') {
                errorMsg = `데이터 형식이 올바르지 않습니다. (${data.message})`;
            } else if (data.code === 'rate_limited') {
                errorMsg = "요청이 너무 많습니다. 잠시 후 다시 시도해주세요. (Rate Limited)";
            } else if (data.code === 'internal_server_error') {
                errorMsg = "노션 서버 오류입니다. (Internal Server Error)";
            } else if (data.code === 'service_unavailable') {
                errorMsg = "노션 서비스가 점검 중입니다. (Service Unavailable)";
            }

            throw new Error(errorMsg);
        }
        
        return res.status(200).json({ success: true, data: data });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}