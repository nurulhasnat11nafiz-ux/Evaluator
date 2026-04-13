import { GoogleGenAI, Type } from "@google/genai";
import { ExamData, EvaluationResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const parseQuestionPaper = async (text: string): Promise<ExamData> => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Parse the following exam text into a structured JSON format. 
    The text might be in English or Bangla. 
    Identify if it is MCQs (usually 4 options), True/False, or Short Answers.
    
    CRITICAL: For True/False questions, provide ["True", "False"] (or Bangla equivalents if the paper is in Bangla) as the options array.
    
    Text:
    ${text}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          language: { type: Type.STRING, enum: ["en", "bn"] },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                text: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                type: { type: Type.STRING, enum: ["mcq", "true_false", "short_answer"] }
              },
              required: ["id", "text", "type"]
            }
          }
        },
        required: ["title", "questions", "language"]
      }
    }
  });

  return JSON.parse(response.text || "{}") as ExamData;
};

export const evaluateExam = async (
  examData: ExamData, 
  userAnswers: Record<string, number | string>,
  answerKeyText?: string
): Promise<EvaluationResult> => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Evaluate the following exam submission.
    
    Exam Data: ${JSON.stringify(examData)}
    User Answers: ${JSON.stringify(userAnswers)}
    ${answerKeyText ? `Answer Key Reference: ${answerKeyText}` : "No answer key provided. Solve the questions yourself to evaluate."}
    
    Provide a detailed evaluation including:
    1. Score
    2. Correctness for each question
    3. Feedback/Explanation for each question (especially wrong ones) in the exam's language (${examData.language === 'bn' ? 'Bangla' : 'English'}).
    4. A plagiarism check (assess if the questions are likely copied from common AI outputs or known online sources).
    
    Return the result in JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          totalQuestions: { type: Type.NUMBER },
          answers: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                questionId: { type: Type.STRING },
                userAnswer: { type: Type.STRING },
                isCorrect: { type: Type.BOOLEAN },
                feedback: { type: Type.STRING }
              }
            }
          },
          plagiarismScore: { type: Type.NUMBER },
          plagiarismReport: { type: Type.STRING }
        },
        required: ["score", "totalQuestions", "answers"]
      }
    }
  });

  return JSON.parse(response.text || "{}") as EvaluationResult;
};
