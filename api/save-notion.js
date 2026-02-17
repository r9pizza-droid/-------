const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Only POST allowed' });

  const { studentName, date, category, content } = req.body;

  try {
    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        '이름': { title: [{ text: { content: studentName } }] },
        '날짜': { date: { start: date } },
        '분류': { select: { name: category } },
        '내용': { rich_text: [{ text: { content: content } }] },
      },
    });
    res.status(200).json({ message: 'Success' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}