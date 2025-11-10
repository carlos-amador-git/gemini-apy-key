class DocumentAnalyzer {
    constructor() {
        this.apiKey = null; // Will be set from input or environment
        this.pdfFile = null;
        this.pdfText = '';
        this.analysisResult = null;
        this.currentModel = '';
        this.analysisType = 'general'; // Tipo de análisis por defecto
        
        this.initializePDFJS();
        this.initializeElements();
        this.setupEventListeners();
    }
    
    initializePDFJS() {
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
        } else {
            console.error('PDF.js library not loaded');
        }
    }
    
    initializeElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.downloadPdfBtn = document.getElementById('downloadPdf');
        this.loading = document.getElementById('loading');
        this.result = document.getElementById('result');
        this.error = document.getElementById('error');
        this.success = document.getElementById('success');
        this.analysisContent = document.getElementById('analysisContent');
        this.apiKeyInput = document.getElementById('apiKey');
        this.modelInfo = document.getElementById('modelInfo');
        this.currentModelSpan = document.getElementById('currentModel');
        this.optionButtons = document.querySelectorAll('.option-btn');
    }
    
    setupEventListeners() {
        // Upload de archivos
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Drag and drop
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('dragover');
        });
        
        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('dragover');
        });
        
        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
            this.handleFileDrop(e);
        });
        
        // Botones principales
        this.analyzeBtn.addEventListener('click', () => this.analyzeDocument());
        this.downloadPdfBtn.addEventListener('click', () => this.generatePDFReport());
        this.apiKeyInput.addEventListener('input', () => {
            this.apiKey = this.apiKeyInput.value.trim();
            this.updateAnalyzeButton();
        });
        
        // Botones de tipo de análisis
        this.optionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.optionButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.analysisType = e.target.dataset.type;
            });
        });
    }
    
    handleFileSelect(event) {
        const files = event.target.files;
        if (files && files.length > 0) {
            this.processFile(files[0]);
        }
    }
    
    handleFileDrop(event) {
        const files = event.dataTransfer.files;
        if (files && files.length > 0) {
            this.processFile(files[0]);
        }
    }
    
    processFile(file) {
        if (!file) {
            this.showError('No se seleccionó ningún archivo');
            return;
        }
        
        if (file.type !== 'application/pdf') {
            this.showError('Por favor sube un archivo PDF');
            return;
        }
        
        if (file.size > 100 * 1024 * 1024) {
            this.showError('El tamaño del archivo debe ser menor a 100MB');
            return;
        }
        
        this.pdfFile = file;
        this.uploadArea.innerHTML = `
            <p>✅ <strong>${file.name}</strong></p>
            <p style="font-size: 14px; color: #666;">Haz clic para cambiar el archivo</p>
        `;
        this.updateAnalyzeButton();
    }
    
    updateAnalyzeButton() {
        this.analyzeBtn.disabled = !(this.pdfFile && this.apiKey);
    }
    
    async analyzeDocument() {
        if (!this.pdfFile || !this.apiKey) {
            this.showError('Por favor selecciona un archivo PDF e ingresa tu clave API');
            return;
        }
        
        this.showLoading();
        this.hideError();
        this.hideSuccess();
        this.hideResult();
        this.downloadPdfBtn.disabled = true;
        
        try {
            // Extraer texto del PDF
            this.pdfText = await this.extractTextFromPDF(this.pdfFile);
            
            if (!this.pdfText || !this.pdfText.trim()) {
                throw new Error('No se pudo extraer texto del PDF. El archivo puede estar escaneado o contener solo imágenes.');
            }
            
            console.log('Texto extraído del PDF:', this.pdfText.substring(0, 500));
            
            // Analizar con Gemini API según el tipo seleccionado
            const analysis = await this.callGeminiAPI(this.pdfText);
            this.analysisResult = analysis;
            this.displayAnalysis(analysis);
            this.downloadPdfBtn.disabled = false;
            this.showSuccess('Análisis completado correctamente');
            
        } catch (error) {
            console.error('Error en el análisis:', error);
            this.showError(error.message || 'Ocurrió un error inesperado');
        } finally {
            this.hideLoading();
        }
    }
    
    async extractTextFromPDF(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('No se proporcionó ningún archivo'));
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = async function(e) {
                try {
                    if (typeof pdfjsLib === 'undefined') {
                        reject(new Error('La biblioteca PDF.js no está cargada'));
                        return;
                    }
                    
                    const typedarray = new Uint8Array(e.target.result);
                    const loadingTask = pdfjsLib.getDocument(typedarray);
                    const pdf = await loadingTask.promise;
                    
                    let fullText = '';
                    const numPages = pdf.numPages;
                    
                    for (let i = 1; i <= numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        
                        if (textContent && textContent.items && Array.isArray(textContent.items)) {
                            const pageText = textContent.items.map(item => item.str).join(' ');
                            fullText += pageText + '\n\n';
                        }
                    }
                    
                    resolve(fullText);
                } catch (error) {
                    console.error('Error en extracción PDF:', error);
                    reject(new Error('Error al extraer texto del PDF: ' + error.message));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Error al leer el archivo PDF'));
            };
            
            try {
                reader.readAsArrayBuffer(file);
            } catch (error) {
                reject(new Error('Error al leer el archivo: ' + error.message));
            }
        });
    }
    
    getPromptForAnalysisType(text) {
        const prompts = {
            general: `Analiza el siguiente documento y proporciona un análisis completo. Responde en español con esta estructura:

ANÁLISIS GENERAL DEL DOCUMENTO

1. RESUMEN EJECUTIVO
   - Tema principal del documento
   - Objetivos identificados
   - Público objetivo potencial

2. CONTENIDO PRINCIPAL
   - Ideas y argumentos centrales
   - Información más relevante
   - Datos y estadísticas importantes

3. ESTRUCTURA Y ORGANIZACIÓN
   - Cómo está organizado el contenido
   - Flujo de información
   - Calidad de la presentación

4. CONCLUSIONES Y RECOMENDACIONES
   - Conclusiones principales
   - Aplicaciones prácticas
   - Sugerencias de mejora

Documento:
${text}`,

            summary: `Proporciona un resumen ejecutivo conciso del siguiente documento. Responde en español con esta estructura:

RESUMEN EJECUTIVO

• OBJETIVO PRINCIPAL: [Objetivo del documento]
• PUNTOS CLAVE: [3-5 puntos más importantes]
• CONCLUSIONES: [Conclusiones principales]
• APLICACIONES: [Posibles usos o aplicaciones]

Documento:
${text}`,

            keypoints: `Extrae los puntos clave del siguiente documento. Responde en español con esta estructura:

PUNTOS CLAVE DEL DOCUMENTO

📌 INFORMACIÓN ESENCIAL:
   - [Lista de puntos importantes]

🔍 DATOS RELEVANTES:
   - [Datos, estadísticas o cifras]

💡 CONCLUSIONES PRINCIPALES:
   - [Conclusiones más significativas]

🎯 RECOMENDACIONES:
   - [Recomendaciones o llamados a la acción]

Documento:
${text}`,

            qa: `Analiza el siguiente documento y genera preguntas y respuestas relevantes. Responde en español:

PREGUNTAS Y RESPUESTAS SOBRE EL DOCUMENTO

❓ **Pregunta 1:** [Pregunta importante sobre el contenido]
   **Respuesta:** [Respuesta basada en el documento]

❓ **Pregunta 2:** [Otra pregunta relevante]
   **Respuesta:** [Respuesta basada en el documento]

❓ **Pregunta 3:** [Pregunta sobre implicaciones]
   **Respuesta:** [Respuesta basada en el documento]

❓ **Pregunta 4:** [Pregunta sobre aplicación práctica]
   **Respuesta:** [Respuesta basada en el documento]

Documento:
${text}`
        };

        return prompts[this.analysisType] || prompts.general;
    }
    
    async callGeminiAPI(documentText) {
        if (!documentText || !documentText.trim()) {
            throw new Error('No hay texto para analizar');
        }
        
        if (!this.apiKey) {
            throw new Error('Se requiere la clave API');
        }

        // Limitar el texto si es muy largo
        const truncatedText = documentText.length > 30000 
            ? documentText.substring(0, 30000) + "... [texto truncado]"
            : documentText;

        const prompt = this.getPromptForAnalysisType(truncatedText);

        const models = [
            'gemini-2.0-flash'
            //'gemini-pro',
            //'gemini-1.5-pro-latest', 
            //'gemini-1.0-pro',
            //'gemini-1.5-flash-latest'
        ];

        let lastError = null;

        for (const model of models) {
            try {
                console.log(`Probando modelo: ${model}`);
                // Updated to use a backend endpoint instead of direct API call
                const API_URL = `/api/gemini`; // Proxy through our own backend

                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        apiKey: this.apiKey,
                        model: model,
                        prompt: prompt
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    lastError = errorData.error?.message || `HTTP ${response.status}`;
                    console.log(`Modelo ${model} falló:`, lastError);
                    continue;
                }

                const data = await response.json();
                
                // Verificar estructura de respuesta
                if (data && 
                    data.response &&
                    data.response.candidates && 
                    Array.isArray(data.response.candidates) && 
                    data.response.candidates.length > 0 &&
                    data.response.candidates[0] &&
                    data.response.candidates[0].content &&
                    data.response.candidates[0].content.parts &&
                    Array.isArray(data.response.candidates[0].content.parts) &&
                    data.response.candidates[0].content.parts.length > 0 &&
                    data.response.candidates[0].content.parts[0].text) {
                    
                    this.currentModel = model;
                    this.showModelInfo(model);
                    return data.response.candidates[0].content.parts[0].text;
                } else {
                    lastError = 'Formato de respuesta inesperado de Gemini API';
                    console.log(`Modelo ${model} - Respuesta inesperada:`, data);
                    continue;
                }
                
            } catch (error) {
                lastError = error.message;
                console.log(`Error con modelo ${model}:`, error.message);
            }
        }
        
        throw new Error(`Todos los modelos fallaron. Último error: ${lastError || 'Error desconocido'}`);
    }
    
    showModelInfo(model) {
        this.currentModelSpan.textContent = model;
        this.modelInfo.style.display = 'block';
    }
    
    displayAnalysis(analysis) {
        if (!analysis) {
            this.showError('No se recibieron resultados del análisis');
            return;
        }
        
        this.analysisContent.innerHTML = this.formatAnalysisForHTML(analysis);
        this.showResult();
    }
    
    formatAnalysisForHTML(text) {
        if (!text) return '<p>No hay análisis disponible</p>';
        
        // Limpiar y formatear el texto para HTML
        let formattedText = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Convertir emojis y símbolos especiales
        formattedText = formattedText
            .replace(/📌/g, '📍')
            .replace(/🔍/g, '🔎')
            .replace(/💡/g, '💡')
            .replace(/🎯/g, '🎯')
            .replace(/❓/g, '❓');
        
        // Dividir en secciones basadas en líneas que parecen títulos
        const lines = formattedText.split('\n').filter(line => line.trim());
        let html = '';
        let currentSection = '';
        
        lines.forEach(line => {
            const trimmedLine = line.trim();
            
            // Detectar líneas que parecen títulos de sección
            if (trimmedLine && 
                (trimmedLine.toUpperCase() === trimmedLine || 
                 trimmedLine.match(/^[❓📍🔎💡🎯]/) ||
                 trimmedLine.match(/^[A-Z][A-Za-z\s]+:$/) ||
                 trimmedLine.match(/^\d+\./))) {
                
                if (currentSection) {
                    html += `</div>`;
                }
                html += `<div class="analysis-section">`;
                html += `<h4>${trimmedLine}</h4>`;
                currentSection = trimmedLine;
            } else if (trimmedLine) {
                // Es contenido normal
                if (trimmedLine.startsWith('-') || trimmedLine.startsWith('•')) {
                    html += `<ul><li>${trimmedLine.substring(1).trim()}</li></ul>`;
                } else {
                    html += `<p>${trimmedLine}</p>`;
                }
            }
        });
        
        if (currentSection) {
            html += `</div>`;
        }
        
        // Si no se detectaron secciones, mostrar el texto completo
        if (!html) {
            html = `<div class="analysis-section"><p>${formattedText.replace(/\n/g, '<br>')}</p></div>`;
        }
        
        return html;
    }
    
    generatePDFReport() {
        if (!this.analysisResult) {
            this.showError('No hay resultados de análisis para generar el PDF');
            return;
        }

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Configuración
            doc.setFont('helvetica');
            let yPosition = 20;
            const margin = 20;
            const pageWidth = doc.internal.pageSize.width;
            const maxWidth = pageWidth - (2 * margin);

            // Título basado en el tipo de análisis
            const titles = {
                general: 'ANÁLISIS GENERAL DE DOCUMENTO',
                summary: 'RESUMEN EJECUTIVO',
                keypoints: 'PUNTOS CLAVE DEL DOCUMENTO',
                qa: 'PREGUNTAS Y RESPUESTAS'
            };
            
            const title = titles[this.analysisType] || 'ANÁLISIS DE DOCUMENTO';

            // Título principal
            doc.setFontSize(18);
            doc.setTextColor(66, 133, 244);
            doc.text(title, 105, yPosition, { align: 'center' });
            yPosition += 15;

            // Información del reporte
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, margin, yPosition);
            doc.text(`Modelo usado: ${this.currentModel}`, margin, yPosition + 5);
            doc.text(`Archivo: ${this.pdfFile.name}`, margin, yPosition + 10);
            doc.text(`Tipo de análisis: ${this.getAnalysisTypeName()}`, margin, yPosition + 15);
            yPosition += 25;

            // Contenido del análisis
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(11);

            // Limpiar el análisis de markdown
            const cleanAnalysis = this.analysisResult
                .replace(/\*\*/g, '')
                .replace(/\*/g, '')
                .replace(/📌/g, '•')
                .replace(/🔍/g, '•')
                .replace(/💡/g, '•')
                .replace(/🎯/g, '•')
                .replace(/❓/g, 'P:');

            // Dividir el análisis en líneas
            const lines = doc.splitTextToSize(cleanAnalysis, maxWidth);

            // Agregar contenido
            for (let i = 0; i < lines.length; i++) {
                // Verificar si necesita nueva página
                if (yPosition > 270) {
                    doc.addPage();
                    yPosition = 20;
                }

                const line = lines[i];

                // Detectar secciones (líneas en mayúsculas o que empiezan con números)
                if (line.match(/^[A-Z][A-Z\s]+$/) || line.match(/^\d+\./) || line.match(/^[A-Z]/)) {
                    if (yPosition > 250) {
                        doc.addPage();
                        yPosition = 20;
                    }
                    
                    doc.setFont(undefined, 'bold');
                    doc.setTextColor(66, 133, 244);
                    doc.text(line, margin, yPosition);
                    yPosition += 8;
                    doc.setFont(undefined, 'normal');
                    doc.setTextColor(0, 0, 0);
                } else {
                    doc.text(line, margin, yPosition);
                    yPosition += 6;
                }
            }

            // Pie de página
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text(`Página ${i} de ${pageCount}`, 105, 287, { align: 'center' });
                doc.text('Generado por Analizador de Documentos con Gemini AI', 105, 292, { align: 'center' });
            }

            // Descargar PDF
            const fileName = `analisis-${this.analysisType}-${this.pdfFile.name.replace('.pdf', '')}.pdf`;
            doc.save(fileName);
            this.showSuccess('PDF generado y descargado correctamente');

        } catch (error) {
            console.error('Error al generar PDF:', error);
            this.showError('Error al generar el reporte PDF: ' + error.message);
        }
    }
    
    getAnalysisTypeName() {
        const names = {
            general: 'Análisis General',
            summary: 'Resumen Ejecutivo',
            keypoints: 'Puntos Clave',
            qa: 'Preguntas y Respuestas'
        };
        return names[this.analysisType] || 'General';
    }
    
    showLoading() {
        if (this.loading) {
            this.loading.style.display = 'block';
        }
        if (this.analyzeBtn) {
            this.analyzeBtn.disabled = true;
        }
    }
    
    hideLoading() {
        if (this.loading) {
            this.loading.style.display = 'none';
        }
        if (this.analyzeBtn) {
            this.analyzeBtn.disabled = false;
        }
    }
    
    showResult() {
        if (this.result) {
            this.result.style.display = 'block';
        }
    }
    
    hideResult() {
        if (this.result) {
            this.result.style.display = 'none';
        }
    }
    
    showError(message) {
        if (this.error) {
            this.error.textContent = message || 'Ocurrió un error inesperado';
            this.error.style.display = 'block';
        }
        this.hideSuccess();
    }
    
    hideError() {
        if (this.error) {
            this.error.style.display = 'none';
        }
    }
    
    showSuccess(message) {
        if (this.success) {
            this.success.textContent = message;
            this.success.style.display = 'block';
        }
        this.hideError();
    }
    
    hideSuccess() {
        if (this.success) {
            this.success.style.display = 'none';
        }
    }
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    try {
        new DocumentAnalyzer();
    } catch (error) {
        console.error('Error al inicializar DocumentAnalyzer:', error);
        const errorElement = document.getElementById('error');
        if (errorElement) {
            errorElement.textContent = 'Error al inicializar la aplicación: ' + error.message;
            errorElement.style.display = 'block';
        }
    }
});