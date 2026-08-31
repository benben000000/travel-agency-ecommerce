const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(process.cwd(), 'data', 'global-one-travel.db'));

const users = db.prepare("SELECT id, name, email, role FROM users WHERE role IN ('agent', 'admin')").all();
console.log('Admin & Agents in DB:');
console.table(users);

const sampleMsgs = db.prepare("SELECT m.id, m.conversation_id, m.sender_id, u.name as sender_name, u.role as sender_role, m.content FROM messages m LEFT JOIN users u ON m.sender_id = u.id LIMIT 10").all();
console.log('Sample messages:');
console.table(sampleMsgs);

const convs = db.prepare("SELECT c.id, c.user_id, c.agent_id, u.name as user_name, a.name as agent_name FROM conversations c LEFT JOIN users u ON c.user_id = u.id LEFT JOIN users a ON c.agent_id = a.id LIMIT 5").all();
console.log('Sample convs:');
console.table(convs);

db.close();
