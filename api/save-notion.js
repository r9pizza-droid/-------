const { Client } = require('@notionhq/client');

module.exports = async (req, res) => {
  // CORS 허용 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // 앱에서 보낸 데이터와 개인 설정값 받기
  const { mode, studentName, studentIds, date, category, content, personalKey, personalDbId, testMode } = req.body;

  if (!personalKey || !personalDbId) {
    return res.status(400).json({ message: "노션 설정 정보가 없습니다. 앱 설정(⚙️)을 확인해주세요." });
  }

  // Database ID 추출 로직 (URL 또는 ID 입력 대응 - 32자리 UUID 추출)
  const idMatch = personalDbId.match(/([a-f0-9]{32})/);
  const databaseId = idMatch ? idMatch[1] : personalDbId.trim();

  const notion = new Client({ auth: personalKey });

  try {
    // 테스트 모드: 데이터베이스 조회 권한 확인 및 DB 이름 반환
    if (testMode) {
      const response = await notion.databases.retrieve({ database_id: databaseId });
      const titleObj = response.title && response.title.length > 0 ? response.title[0] : null;
      const dbName = titleObj ? titleObj.plain_text : "제목 없음";
      return res.status(200).json({ success: true, message: "연동 성공!", dbName });
    }

    // 모드에 따라 '이름' 속성을 다르게 포장하기
    let nameProperty;
    
    if (mode === 'relation' && studentIds && studentIds.length > 0) {
        // [포트폴리오 모드] 관계형(Relation)으로 연결
        nameProperty = { "relation": studentIds.map(id => ({ "id": id })) };
    } else {
        // [기본 모드] 그냥 텍스트(Title/Rich_text)로 저장
        nameProperty = { "title": [{ "text": { "content": studentName || "이름 없음" } }] };
    }

    const response = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${personalKey}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify({
            parent: { database_id: databaseId },
            icon: { type: "emoji", emoji: "🍀" },
            properties: {
                "이름": nameProperty,
                "날짜": { "date": { "start": date } },
                "구분": { "select": { "name": category || "기타" } },
                "내용": { "rich_text": [{ "text": { "content": content || "" } }] }
            }
        })
    });

    const data = await response.json();
    if (!response.ok) {
        console.error('Notion Error:', data);
        return res.status(response.status).json(data);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Notion API Error:", error);
    res.status(500).json({ message: `노션 오류: ${error.message}` });
  }
};