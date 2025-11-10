import Head from 'next/head';
import { useEffect } from 'react';
import Script from 'next/script';

export default function Home() {
  useEffect(() => {
    // Dynamically import the DocumentAnalyzer script after component mounts
    const initApp = async () => {
      try {
        // Load PDF.js from CDN
        if (typeof window !== 'undefined' && typeof pdfjsLib === 'undefined') {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        // Load jsPDF from CDN
        if (typeof window !== 'undefined' && typeof window.jspdf === 'undefined') {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        // Load our script
        const script = document.createElement('script');
        script.src = '/script.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
          document.body.removeChild(script);
        };
      } catch (error) {
        console.error('Error loading scripts:', error);
      }
    };

    initApp();
  }, []);

  return (
    <div>
      <Head>
        <title>Analizador de Documentos con AI</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta charSet="UTF-8" />
      </Head>

      <div className="container">
        <h1>Analizador de Documentos con AI</h1>
        
        <div className="api-key-section">
          <input type="password" id="apiKey" className="api-key-input" placeholder="Ingresa tu clave API de Gemini" />
        </div>
        
        <div className="upload-area" id="uploadArea">
          <p>📄 Haz clic para subir o arrastra tu documento PDF</p>
          <p style={{ fontSize: '14px', color: '#666' }}>Formatos soportados: PDF (máximo 100MB)</p>
          <input type="file" id="fileInput" className="file-input" accept=".pdf" />
        </div>
        
        <div className="analysis-options">
          <label><strong>Tipo de Análisis:</strong></label>
          <div className="option-group">
            <button className="option-btn active" data-type="general">Análisis General</button>
            <button className="option-btn" data-type="summary">Resumen Ejecutivo</button>
            <button className="option-btn" data-type="keypoints">Puntos Clave</button>
            <button className="option-btn" data-type="qa">Preguntas y Respuestas</button>
          </div>
        </div>
        
        <div className="button-group">
          <button id="analyzeBtn" className="analyze-btn" disabled>Analizar Documento</button>
          <button id="downloadPdf" className="pdf-btn" disabled>Descargar Reporte PDF</button>
        </div>
        
        <div className="model-info" id="modelInfo">
          Usando modelo: <span id="currentModel"></span>
        </div>
        
        <div className="loading" id="loading">
          <div className="spinner"></div>
          <p>Analizando tu documento con AI...</p>
        </div>
        
        <div className="error" id="error"></div>
        <div className="success" id="success"></div>
        
        <div className="result" id="result">
          <h3>Resultados del Análisis:</h3>
          <div id="analysisContent"></div>
        </div>
      </div>

      <style jsx global>{`
        body {
          font-family: Arial, sans-serif;
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        
        .container {
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .upload-area {
          border: 2px dashed #ccc;
          border-radius: 8px;
          padding: 40px;
          text-align: center;
          margin-bottom: 20px;
          cursor: pointer;
          transition: border-color 0.3s;
        }
        
        .upload-area:hover {
          border-color: #4285f4;
        }
        
        .upload-area.dragover {
          border-color: #4285f4;
          background-color: #f8f9fa;
        }
        
        .file-input {
          display: none;
        }
        
        .analyze-btn {
          background-color: #4285f4;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          margin-top: 10px;
          margin-right: 10px;
        }
        
        .analyze-btn:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        
        .pdf-btn {
          background-color: #d32f2f;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          margin-top: 10px;
        }
        
        .result {
          margin-top: 30px;
          padding: 20px;
          background-color: #f8f9fa;
          border-radius: 8px;
          display: none;
        }
        
        .loading {
          display: none;
          text-align: center;
          margin: 20px 0;
        }
        
        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #4285f4;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .error {
          color: #d32f2f;
          background-color: #ffebee;
          padding: 15px;
          border-radius: 6px;
          margin-top: 20px;
          display: none;
        }
        
        .success {
          color: #388e3c;
          background-color: #e8f5e8;
          padding: 15px;
          border-radius: 6px;
          margin-top: 20px;
          display: none;
        }
        
        .api-key-input {
          width: 100%;
          padding: 10px;
          margin-bottom: 20px;
          border: 1px solid #ccc;
          border-radius: 4px;
          box-sizing: border-box;
        }
        
        .analysis-section {
          margin-bottom: 25px;
          padding: 20px;
          background: white;
          border-radius: 8px;
          border-left: 4px solid #4285f4;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .analysis-section h4 {
          margin-top: 0;
          color: #4285f4;
          border-bottom: 1px solid #e0e0e0;
          padding-bottom: 8px;
        }
        
        .analysis-section ul {
          margin: 10px 0;
          padding-left: 20px;
        }
        
        .analysis-section li {
          margin-bottom: 8px;
          line-height: 1.5;
        }
        
        .button-group {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        
        .model-info {
          margin: 10px 0;
          padding: 10px;
          background: #e8f5e8;
          border-radius: 4px;
          display: none;
        }
        
        .document-type {
          margin: 10px 0;
          padding: 10px;
          background: #e3f2fd;
          border-radius: 4px;
        }
        
        .analysis-options {
          margin: 15px 0;
          padding: 15px;
          background: #f3e5f5;
          border-radius: 4px;
        }
        
        .option-group {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
          margin-top: 10px;
        }
        
        .option-btn {
          background: #7e57c2;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .option-btn.active {
          background: #5e35b1;
        }
      `}</style>
    </div>
  );
}