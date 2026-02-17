const { Client } = require('@notionhq/client');

module.exports = async (req, res) => {
  // 1. 환경 변수 체크
  if (!process.env.NOTION_KEY) {
    return res.status(500).json({ message: "Vercel 설정 오류: NOTION_KEY가 없습니다." });
  }
  if (!process.env.NOTION_DATABASE_ID) {
    return res.status(500).json({ message: "Vercel 설정 오류: NOTION_DATABASE_ID가 없습니다." });
  }

  const notion = new Client({ auth: process.env.NOTION_KEY });
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { studentName, date, category, content } = req.body;

  try {
    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        // 노션 데이터베이스의 컬럼명과 정확히 일치해야 합니다.
        '이름': { 
          title: [
            {
              text: {
                content: studentName || "이름 없음",
              },
            },
          ],
        },
        '날짜': {
          date: {
            start: date,
          },
        },
        '분류': {
          select: {
            name: category || "기타",
          },
        },
        '내용': {
          rich_text: [
            {
              text: {
                content: content || "",
              },
            },
          ],
        },
      },
    });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Notion API Error:", error);
    res.status(500).json({ message: `Notion 오류: ${error.message}` });
  }
};