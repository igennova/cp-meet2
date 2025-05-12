import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Question from './Models/question.js';

const MONGO_URI = 'mongodb://127.0.0.1:27017/questions';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function insertQuestions() {
  try {
  
    await mongoose.connect(MONGO_URI);
    

    
    const filePath = path.join(__dirname, 'question.json');
    

    const rawData = fs.readFileSync(filePath, 'utf-8');
    let questions = JSON.parse(rawData); 

    

    if (!Array.isArray(questions)) {
      questions = [questions];
    }

    for (const question of questions) {
      if (
        question.question_id &&
        question.title &&
        question.description &&
        question.input_format &&
        question.output_format &&
        question.constraints &&
        question.example &&
        question.test_cases
      ) {
        await Question.create(question);
        console.log(`Inserted question: ${question.title}`);
      } else {
        console.warn(`Skipped invalid question syntax: ${question.title || 'Unknown Title'}`);
      }
    }

    // console.log('Questions inserted successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error inserting questions:', error);
    process.exit(1);
  }
}

insertQuestions();
