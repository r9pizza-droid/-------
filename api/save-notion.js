const { Client } = require('@notionhq/client');

module.exports = async (req, res) => {
  // 웹 배포 전용: 불필요한 CORS 설정 삭제 및 POST 메서드 확인
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // 앱에서 보낸 데이터와 개인 설정값 받기
  const { studentName, date, category, content, personalKey, personalDbId, testMode } = req.body;

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

    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        '이름': { title: [{ text: { content: studentName || "이름 없음" } }] },
        '날짜': { date: { start: date } },
        '분류': { select: { name: category || "기타" } },
        '내용': { rich_text: [{ text: { content: content || "" } }] },
      },
    });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Notion API Error:", error);
    res.status(500).json({ message: `노션 오류: ${error.message}` });
  }
};