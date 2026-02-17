const { Client } = require('@notionhq/client');

const notion = new Client({
  auth: process.env.NOTION_KEY,
});

module.exports = async (req, res) => {
  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { studentName, date, category, content } = req.body;

  // 환경변수 확인
  if (!process.env.NOTION_KEY || !process.env.NOTION_DATABASE_ID) {
    return res.status(500).json({ message: 'Notion API key or Database ID is missing' });
  }

  try {
    const response = await notion.pages.create({
      parent: {
        database_id: process.env.NOTION_DATABASE_ID,
      },
      properties: {
        // 노션 데이터베이스의 속성(컬럼) 이름과 정확히 일치해야 합니다.
        '이름': { 
          title: [
            {
              text: {
                content: studentName,
              },
            },
          ],
        },
        '날짜': {
          date: {
            start: date, // YYYY-MM-DD 형식
          },
        },
        '분류': {
          select: {
            name: category, // '칭찬' 또는 '관찰'
          },
        },
        '내용': {
          rich_text: [
            {
              text: {
                content: content,
              },
            },
          ],
        },
      },
    });

    res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.error('Notion API Error:', error);
    res.status(500).json({ message: 'Error saving to Notion', error: error.message });
  }
};