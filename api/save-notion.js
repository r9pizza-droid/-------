const { Client } = require('@notionhq/client');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  // 앱(프론트엔드)에서 직접 보낸 개인 키와 ID를 받습니다.
  const { studentName, date, category, content, personalKey, personalDbId } = req.body;

  // 개인 키가 없으면 실행하지 않습니다.
  if (!personalKey || !personalDbId) {
    return res.status(400).json({ message: "노션 설정 정보가 없습니다." });
  }

  // ID에서 주소 형식을 제거하고 순수 ID만 추출 (안전장치)
  const databaseId = personalDbId.includes("notion.so") 
    ? personalDbId.split("/").pop().split("?")[0] 
    : personalDbId.trim().replace(/[\[\]]/g, "");

  const notion = new Client({ auth: personalKey });

  try {
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
    res.status(500).json({ message: `노션 오류: ${error.message}` });
  }
};