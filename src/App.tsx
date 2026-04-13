import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileUp, 
  ClipboardList, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  BookOpen, 
  History,
  Languages,
  Trash2,
  FileText,
  Info,
  Mail,
  Cpu,
  User,
  Moon,
  Sun
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { ExamData, EvaluationResult } from './types';
import { extractTextFromFile } from './lib/parsers';
import { parseQuestionPaper, evaluateExam } from './lib/gemini';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [step, setStep] = useState<'upload' | 'exam' | 'result'>('upload');
  const [isExamLoading, setIsExamLoading] = useState(false);
  const [isKeyLoading, setIsKeyLoading] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isParsingPaste, setIsParsingPaste] = useState(false);
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, number | string>>({});
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [answerKeyText, setAnswerKeyText] = useState<string>('');
  const [pasteText, setPasteText] = useState<string>('');

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'exam' | 'key') => {
    const file = e.target.files?.[0];
    if (!file) return;

    toast.info(`File selected: ${file.name}. Processing...`);

    if (type === 'exam') setIsExamLoading(true);
    else setIsKeyLoading(true);

    try {
      console.log(`Starting upload for ${type}: ${file.name} (${file.type})`);
      const text = await extractTextFromFile(file);
      console.log(`Extracted text length: ${text.length}`);
      
      if (!text.trim()) {
        throw new Error('The file appears to be empty.');
      }

      if (type === 'exam') {
        const parsed = await parseQuestionPaper(text);
        setExamData(parsed);
        toast.success('Question paper scanned successfully!');
      } else {
        setAnswerKeyText(text);
        toast.success('Answer key uploaded!');
      }
    } catch (error: any) {
      console.error('Upload Error:', error);
      toast.error(error.message || 'Failed to process file. Please try again.');
    } finally {
      setIsExamLoading(false);
      setIsKeyLoading(false);
      // Reset input value to allow re-uploading the same file
      e.target.value = '';
    }
  };

  const handlePasteSubmit = async () => {
    if (!pasteText.trim()) return;
    setIsParsingPaste(true);
    try {
      const parsed = await parseQuestionPaper(pasteText);
      setExamData(parsed);
      toast.success('Questions parsed successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to parse text.');
    } finally {
      setIsParsingPaste(false);
    }
  };

  const startExam = () => {
    if (!examData) return;
    setStep('exam');
  };

  const submitExam = async () => {
    setIsEvaluating(true);
    try {
      if (!examData) return;
      const result = await evaluateExam(examData, userAnswers, answerKeyText);
      setEvaluationResult(result);
      setStep('result');
      toast.success('Evaluation complete!');
    } catch (error) {
      console.error(error);
      toast.error('Evaluation failed.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const reset = () => {
    setStep('upload');
    setExamData(null);
    setUserAnswers({});
    setEvaluationResult(null);
    setAnswerKeyText('');
    setPasteText('');
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="mb-12 text-center relative">
          <div className="absolute right-0 top-0 flex gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full hover:bg-secondary"
              onClick={toggleTheme}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </Button>
            <Dialog>
              <DialogTrigger
                render={
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary" />
                }
              >
                <Info className="w-5 h-5 text-muted-foreground" />
              </DialogTrigger>
              <DialogContent className="glass-card border-border/50">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold mb-2">About Smart Evaluator</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Project Information & Credits
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary/30 border border-border/50">
                    <User className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1">Created By</p>
                      <p className="text-lg font-medium">Nurul Hasnat Nafiz</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary/30 border border-border/50">
                    <Cpu className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1">AI Engine</p>
                      <p className="text-lg font-medium">Gemini 3.1 Pro</p>
                      <p className="text-xs text-muted-foreground mt-1">Advanced multimodal reasoning for accurate evaluation.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary/30 border border-border/50">
                    <Mail className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1">Contact</p>
                      <p className="text-lg font-medium">data82654@gmail.com</p>
                    </div>
                  </div>
                </div>
                <div className="text-center text-[10px] text-muted-foreground pt-4 border-t border-border/50">
                  Built with precision for academic excellence.
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium mb-4"
          >
            <BookOpen className="w-3 h-3" />
            AI-Powered Exam Evaluator
          </motion.div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Smart Evaluator
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Upload your question paper, fill the answers, and get instant AI feedback with automated scoring.
          </p>
        </header>

        <AnimatePresence mode="wait">
          {step === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8"
            >
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger value="upload" className="gap-2">
                    <FileUp className="w-4 h-4" /> Upload File
                  </TabsTrigger>
                  <TabsTrigger value="paste" className="gap-2">
                    <ClipboardList className="w-4 h-4" /> Paste Text
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="glass-card">
                      <CardHeader>
                        <CardTitle className="text-lg">Question Paper</CardTitle>
                        <CardDescription>PDF, DOCX, or TXT</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted rounded-lg p-8 hover:border-primary/50 transition-colors cursor-pointer relative min-h-[200px]">
                          {isExamLoading ? (
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="w-10 h-10 text-primary animate-spin" />
                              <p className="text-sm text-muted-foreground">Processing...</p>
                            </div>
                          ) : (
                            <>
                              <input 
                                type="file" 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                onChange={(e) => handleFileUpload(e, 'exam')}
                                accept=".pdf,.docx,.txt"
                              />
                              <FileText className="w-10 h-10 text-muted-foreground mb-4" />
                              <p className="text-sm text-center text-muted-foreground">
                                {examData ? examData.title : 'Click or drag to upload question paper'}
                              </p>
                              {examData && (
                                <Badge variant="secondary" className="mt-4">
                                  {examData.questions.length} Questions Found
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="glass-card">
                      <CardHeader>
                        <CardTitle className="text-lg">Answer Key (Optional)</CardTitle>
                        <CardDescription>Help AI evaluate accurately</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted rounded-lg p-8 hover:border-primary/50 transition-colors cursor-pointer relative min-h-[200px]">
                          {isKeyLoading ? (
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="w-10 h-10 text-primary animate-spin" />
                              <p className="text-sm text-muted-foreground">Processing...</p>
                            </div>
                          ) : (
                            <>
                              <input 
                                type="file" 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                onChange={(e) => handleFileUpload(e, 'key')}
                                accept=".pdf,.docx,.txt"
                              />
                              <CheckCircle2 className="w-10 h-10 text-muted-foreground mb-4" />
                              <p className="text-sm text-center text-muted-foreground">
                                {answerKeyText ? 'Answer key uploaded' : 'Click or drag to upload answer key'}
                              </p>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="paste">
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle>Paste Questions</CardTitle>
                      <CardDescription>Directly paste text from ChatGPT, Gemini, or other sources</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Textarea 
                        placeholder="Paste your questions here..." 
                        className="min-h-[300px] font-mono text-sm bg-secondary/50"
                        value={pasteText}
                        onChange={(e) => setPasteText(e.target.value)}
                      />
                      <Button 
                        onClick={handlePasteSubmit} 
                        className="w-full"
                        disabled={!pasteText.trim() || isParsingPaste}
                      >
                        {isParsingPaste ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Parse Questions
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="flex justify-center">
                <Button 
                  size="lg" 
                  className="px-12 py-6 text-lg rounded-full shadow-lg shadow-primary/20"
                  disabled={!examData || isExamLoading || isKeyLoading}
                  onClick={startExam}
                >
                  Start Evaluation
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'exam' && examData && (
            <motion.div
              key="exam"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold">{examData.title}</h2>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="gap-1">
                      <Languages className="w-3 h-3" /> {examData.language === 'bn' ? 'Bangla' : 'English'}
                    </Badge>
                    <Badge variant="outline">
                      {examData.questions.length} Questions
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" onClick={reset} className="text-muted-foreground">
                  <Trash2 className="w-4 h-4 mr-2" /> Cancel
                </Button>
              </div>

              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-12">
                  {examData.questions.map((q, idx) => (
                    <div key={q.id} className="space-y-6 p-6 rounded-2xl bg-secondary/20 border border-border/50">
                      <div className="flex gap-4">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                          {idx + 1}
                        </span>
                        <p className="text-lg font-medium pt-1">{q.text}</p>
                      </div>

                      {(q.type === 'mcq' || q.type === 'true_false') && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-12">
                          {q.options.map((opt, optIdx) => (
                            <button
                              key={optIdx}
                              onClick={() => setUserAnswers(prev => ({ ...prev, [q.id]: optIdx }))}
                              className={`text-left p-4 rounded-xl border transition-all ${
                                userAnswers[q.id] === optIdx 
                                  ? 'bg-primary text-primary-foreground border-primary' 
                                  : 'bg-secondary/50 border-border hover:border-primary/50'
                              }`}
                            >
                              <span className="inline-block w-6 h-6 rounded-md bg-background/20 text-center mr-3 text-xs font-bold leading-6">
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}

                      {q.type === 'short_answer' && (
                        <div className="ml-12">
                          <Textarea 
                            placeholder="Type your answer here..."
                            className="bg-secondary/50"
                            value={userAnswers[q.id] as string || ''}
                            onChange={(e) => setUserAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex justify-center pt-8">
                <Button 
                  size="lg" 
                  className="px-12 py-6 text-lg rounded-full"
                  onClick={submitExam}
                  disabled={isEvaluating}
                >
                  {isEvaluating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Submit for Evaluation
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'result' && evaluationResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <Card className="glass-card overflow-hidden">
                <div className="bg-primary p-8 text-primary-foreground text-center">
                  <p className="text-sm uppercase tracking-widest opacity-80 mb-2">Final Score</p>
                  <h2 className="text-7xl font-bold">
                    {evaluationResult.score}<span className="text-2xl opacity-60">/{evaluationResult.totalQuestions}</span>
                  </h2>
                </div>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <div className="space-y-4">
                      <h3 className="font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500" /> Performance
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        You answered {evaluationResult.score} questions correctly out of {evaluationResult.totalQuestions}.
                        That's {Math.round((evaluationResult.score / evaluationResult.totalQuestions) * 100)}% accuracy.
                      </p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-bold flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-500" /> Integrity Check
                      </h3>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 bg-secondary h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-yellow-500 h-full" 
                            style={{ width: `${evaluationResult.plagiarismScore || 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold">{evaluationResult.plagiarismScore || 0}% AI Pattern</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {evaluationResult.plagiarismReport || 'No significant plagiarism detected.'}
                      </p>
                    </div>
                  </div>

                  <Separator className="my-8" />

                  <h3 className="text-xl font-bold mb-6">Detailed Feedback</h3>
                  <div className="space-y-6">
                    {evaluationResult.answers.map((ans, idx) => {
                      const question = examData?.questions.find(q => q.id === ans.questionId);
                      return (
                        <div key={ans.questionId} className={`p-6 rounded-2xl border ${ans.isCorrect ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex gap-3">
                              <span className="font-bold text-muted-foreground">Q{idx + 1}.</span>
                              <p className="font-medium">{question?.text}</p>
                            </div>
                            <Badge variant={ans.isCorrect ? 'default' : 'destructive'}>
                              {ans.isCorrect ? 'Correct' : 'Incorrect'}
                            </Badge>
                          </div>
                          <div className="ml-8 space-y-3">
                            <p className="text-sm">
                              <span className="text-muted-foreground">Your Answer:</span>{' '}
                              <span className="font-bold">
                                {question?.type === 'mcq' 
                                  ? question.options[Number(ans.userAnswer)] 
                                  : ans.userAnswer}
                              </span>
                            </p>
                            <div className="p-4 rounded-xl bg-background/50 text-sm italic text-muted-foreground">
                              {ans.feedback}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-center mt-12">
                    <Button onClick={reset} variant="outline" size="lg" className="rounded-full px-12">
                      Evaluate Another Exam
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="mt-24 text-center text-muted-foreground text-xs">
          <p>© 2026 Smart Evaluator • AI-Powered Academic Integrity</p>
        </footer>
      </div>
      <Toaster position="bottom-center" theme="dark" />
    </div>
  );
}
