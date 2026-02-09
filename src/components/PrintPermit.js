

export default function PrintPremit({ text }) {

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Перепустки</title>
        <meta charset="UTF-8">
        <style>
          @page {
            size: A4 landscape;
            margin: 0;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .a4-sheet {
            width: 297mm;
            height: 210mm;
            position: relative;
            page-break-after: always;
            background: white;
          }
          
          .grid-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 1fr 1fr;
            width: 100%;
            height: 100%;
            border: 1px solid #000;
          }
          
          .permit {
            border: 1px solid #000;
            padding: 8mm;
            display: flex;
            flex-direction: column;
            position: relative;
            page-break-inside: avoid;
          }
          
          .permit-header {
            text-align: center;
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 5mm;
            text-transform: uppercase;
            border-bottom: 2px solid #000;
            padding-bottom: 2mm;
          }
          
          .permit-content {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            gap: 3mm;
          }
          
          .field-row {
            display: flex;
            align-items: flex-start;
          }
          
          .field-label {
            font-weight: bold;
            min-width: 25mm;
            flex-shrink: 0;
          }
          
          .field-value {
            flex-grow: 1;
          }
          
          .photo-container {
            position: absolute;
            top: 15mm;
            right: 8mm;
            width: 30mm;
            height: 40mm;
            border: 1px solid #000;
            background: #f5f5f5;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            color: #666;
          }
          
          .photo-placeholder {
            text-align: center;
          }
          
          .photo-text {
            font-size: 9px;
            color: #999;
          }
          
          .issuer-info {
            margin-top: 5mm;
            padding-top: 3mm;
            border-top: 1px solid #000;
            display: flex;
            flex-direction: column;
            gap: 2mm;
          }
          
          .signature-line {
            margin-top: 8mm;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          
          .signature-block {
            text-align: center;
            width: 40%;
          }
          
          .signature-space {
            height: 15mm;
            border-bottom: 1px solid #000;
            margin-bottom: 2mm;
          }
          
          .signature-text {
            font-size: 10px;
          }
          
          .empty-permit {
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            color: #999;
            font-style: italic;
            border: 1px dashed #ccc;
            background: #fafafa;
          }
          
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            
            .a4-sheet {
              width: 297mm;
              height: 210mm;
              page-break-after: always;
            }
            
            .permit {
              page-break-inside: avoid;
              break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="a4-sheet">
          <div class="grid-container">
            ${platesForPrint.map((plate, index) => {
              if (!plate) {
                return `<div class="empty-permit">Порожня перепустка</div>`;
              }
              
              return `
                <div class="permit">
                  <div class="permit-header">Перепустка №${plate.passNumber || index + 1}</div>
                  
                  <div class="photo-container">
                    <div class="photo-placeholder">
                      <div style="margin-bottom: 2mm;">ФОТО</div>
                      <div class="photo-text">3x4 см</div>
                    </div>
                  </div>
                  
                  <div class="permit-content">
                    <div class="field-row">
                      <div class="field-label">ПІБ:</div>
                      <div class="field-value">${plate.ownerName || 'Не вказано'}</div>
                    </div>
                    
                    <div class="field-row">
                      <div class="field-label">Держ. номер:</div>
                      <div class="field-value">${plate.licensePlate || 'Не вказано'}</div>
                    </div>
                    
                    <div class="field-row">
                      <div class="field-label">Марка авто:</div>
                      <div class="field-value">${plate.carModel || 'Не вказано'}</div>
                    </div>
                    
                    <div class="field-row">
                      <div class="field-label">Дата видачі:</div>
                      <div class="field-value">${formatFirebaseDate(plate.issueDate)}</div>
                    </div>
                    
                    ${plate.withdrawalDate ? `
                      <div class="field-row">
                        <div class="field-label">Дата вилучення:</div>
                        <div class="field-value">${formatFirebaseDate(plate.withdrawalDate)}</div>
                      </div>
                    ` : ''}
                    
                    <div class="issuer-info">
                      <div class="field-row">
                        <div class="field-label">Видана:</div>
                        <div class="field-value">Новак І.В.</div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="signature-line">
                    <div class="signature-block">
                      <div class="signature-space"></div>
                      <div class="signature-text">Підпис водія</div>
                    </div>
                    
                    <div class="signature-block">
                      <div class="signature-space"></div>
                      <div class="signature-text">Підпис видавця</div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </body>
      </html>
    `;
  return (
    <div style={{ position: "relative", width: 220 }}>
     

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "53%",
          transform: "translate(-50%, -50%)",
          fontSize: "28px",
          fontWeight: "400",
          letterSpacing: "4px",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          backgroundColor: "white",
          width: "190px",
          height: "40px",
          textAlign: "center"
        }}
      >
        {text}
      </div> 
    </div>
  );
}
