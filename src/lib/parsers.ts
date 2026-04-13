import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure PDF.js to run on the main thread to avoid worker loading issues in sandboxed iframes
// We still set a fallback worker source just in case, but we try to avoid it.
const PDFJS_VERSION = '4.10.38';
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the document with specific parameters to maximize compatibility in iframes
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      // These settings help in restricted environments
      useWorkerFetch: false,
      isEvalSupported: false,
    });
    
    const pdf = await loadingTask.promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => (item.str !== undefined ? item.str : ''))
          .join(' ');
        fullText += pageText + '\n';
      } catch (pageErr) {
        console.warn(`Failed to parse page ${i}:`, pageErr);
      }
    }
    
    const trimmedText = fullText.trim();
    if (!trimmedText) {
      throw new Error('No readable text found in PDF. It might be a scanned image or empty.');
    }
    
    return trimmedText;
  } catch (error: any) {
    console.error('PDF Parser Error:', error);
    if (error.name === 'PasswordException') {
      throw new Error('This PDF is password protected and cannot be read.');
    }
    throw new Error(`PDF Parsing Failed: ${error.message || 'Unknown error'}`);
  }
};

export const extractTextFromDOCX = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error('DOCX Parsing Error:', error);
    throw new Error('Failed to parse DOCX file.');
  }
};

export const extractTextFromFile = async (file: File): Promise<string> => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (extension === 'pdf') {
    return extractTextFromPDF(file);
  } else if (extension === 'docx') {
    return extractTextFromDOCX(file);
  } else if (extension === 'txt') {
    return file.text();
  } else {
    throw new Error(`Unsupported file format: .${extension}`);
  }
};
