const { Client } = require('@notionhq/client');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  // 1. 환경 변수에서 값을 가져오되, 앞뒤 공백과 대괄호([, ])를 강제로 제거합니다.
  let rawDatabaseId = (process.env.NOTION_DATABASE_ID || "").trim().replace(/[\[\]]/g, "");

  // 2. 만약 주소 전체(https://...)가 들어왔다면, 32자리 ID만 추출하는 안전장치입니다.
  const databaseId = rawDatabaseId.includes("notion.so") 
    ? rawDatabaseId.split("/").pop().split("?")[0] 
    : rawDatabaseId;

  const notion = new Client({ auth: process.env.NOTION_KEY });

  const { studentName, date, category, content } = req.body;

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
    console.error("Notion API Error:", error);
    // 에러 메시지에 어떤 ID가 실제로 쓰였는지 출력하도록 수정했습니다 (확인용)
    res.status(500).json({ message: `사용된 ID: [${databaseId}] / 오류: ${error.message}` });
  }
};