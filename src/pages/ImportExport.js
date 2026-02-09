import React, { useState } from 'react';
import {
  Button, Container, Typography, Box, Alert, Paper,
  TextField, CircularProgress, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  Chip, LinearProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import { db } from '../firebase';
import { collection, getDocs, addDoc, serverTimestamp, writeBatch, doc } from 'firebase/firestore';

function ImportExport() {
  const [importStatus, setImportStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [csvData, setCsvData] = useState('');
  const [previewData, setPreviewData] = useState([]);
  const [stats, setStats] = useState(null);
  const [showFormatDialog, setShowFormatDialog] = useState(false);
  const [organizations, setOrganizations] = useState({});
  const [passNumberCounter, setPassNumberCounter] = useState({});

  // Зразок правильно сформованих даних для імпорту
  const sampleFormattedData = `licensePlate,carModel,ownerName,passNumber,organization,issueDate,withdrawalDate,note
ВС0172РІ,Шевроле,Питльований Роман Володимирович,1,Хлібпром,2024-03-25,,
ВС5054ТМ,Nissan,Майдан Назар Степанович,2,Хлібпром,2024-03-25,,
ВС5967ОМ,Renault,Гладун Ростислав Володимирович,3,Хлібпром,2024-03-25,,
ВС7470YC,Тесла,Калагурський Ігор,4,Хлібпром,,,
ВК6038НА,Renault,Гонта Юрай Вікторович,5,Хлібпром,2024-03-25,,
ВС7249АР,BA3-21099,Балан Сергій Олексійович,6,Хлібпром,2024-03-25,,
ВС2015РН,Volkswagen,Качмарик Тарас Романович,7,Хлібпром,2024-03-25,,
ВС3372ХС,Форд,Пехович Д.І.,8,Хлібпром,,,
ВС1731TО,Шевроле,Карпець Р.П.,9,Хлібпром,,,
ВС9425МВ,Рено,Євочка М.О.,10,Хлібпром,,,`;

  // Функція для перетворення Excel у правильний формат
  const convertExcelToProperFormat = (excelText) => {
    // Ваш Excel має такі стовпці:
    // A: Державнийномер, B: Авто, C: ПІБ. Власника, D: №перепустки, 
    // E: Організація, F: Дата видачі, G: Дата вилучення, H: Примітка
    
    const lines = excelText.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length === 0) return '';
    
    // Заголовки для нового формату
    let result = 'licensePlate,carModel,ownerName,passNumber,organization,issueDate,withdrawalDate,note\n';
    
    // Пропускаємо заголовок Excel
    const startLine = lines[0].includes('Державнийномер') ? 1 : 0;
    
    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i];
      
      // Пропускаємо порожні рядки
      if (!line.trim() || line.trim() === ',') continue;
      
      // Розділяємо по комах (це CSV)
      const cells = line.split(',').map(cell => cell.trim());
      
      // Перевіряємо, чи є номерний знак
      if (cells[0] && cells[0].trim()) {
        const newRow = [
          cells[0] || '', // licensePlate
          cells[1] || '', // carModel
          cells[2] || '', // ownerName
          cells[3] || '', // passNumber
          cells[4] || '', // organization
          cells[5] || '', // issueDate
          cells[6] || '', // withdrawalDate
          cells[7] || ''  // note
        ].join(',');
        
        result += newRow + '\n';
      }
    }
    
    return result;
  };

  const handleLoadSample = () => {
    setCsvData(sampleFormattedData);
    parseCSV(sampleFormattedData);
  };

  const parseCSV = (csvText) => {
    try {
      const lines = csvText.split('\n').filter(line => line.trim() !== '');
      if (lines.length < 2) {
        setPreviewData([]);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const preview = [];

      for (let i = 1; i < Math.min(11, lines.length); i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        
        // Перевіряємо обов'язкові поля
        if (row.licensePlate || row.carModel || row.ownerName) {
          preview.push(row);
        }
      }

      setPreviewData(preview);
    } catch (err) {
      console.error('Помилка парсингу CSV:', err);
      setError('Помилка парсингу CSV: ' + err.message);
    }
  };

  const handleCSVChange = (e) => {
    const value = e.target.value;
    setCsvData(value);
    
    // Автоматично конвертуємо якщо виглядає як Excel експорт
    if (value.includes('Державнийномер')) {
      const converted = convertExcelToProperFormat(value);
      if (converted !== value) {
        setCsvData(converted);
        parseCSV(converted);
        return;
      }
    }
    
    parseCSV(value);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setError('');
    setImportStatus('Читання файлу...');

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        
        // Автоматична конвертація Excel формату
        let processedText = text;
        if (text.includes('Державнийномер')) {
          processedText = convertExcelToProperFormat(text);
          setImportStatus('Файл Excel конвертовано у правильний формат');
        }
        
        setCsvData(processedText);
        parseCSV(processedText);
        setImportStatus('Файл успішно завантажено. Перевірте попередній перегляд.');
      } catch (err) {
        setError('Помилка читання файлу: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    reader.onerror = () => {
      setError('Помилка читання файлу');
      setLoading(false);
    };
    
    // Визначаємо тип файлу
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      setError('Для Excel файлів (.xlsx, .xls) потрібна бібліотека xlsx. Збережіть файл як CSV.');
      setLoading(false);
    } else {
      reader.readAsText(file, 'UTF-8');
    }
  };

  // Автоматична нумерація перепусток по організаціях
  const generatePassNumbers = (data) => {
    const orgCounters = {};
    const organizationsSet = new Set();
    
    // Рахуємо організації
    data.forEach(row => {
      if (row.organization) {
        organizationsSet.add(row.organization);
        if (!orgCounters[row.organization]) {
          orgCounters[row.organization] = 1;
        }
      }
    });
    
    // Генеруємо номери
    return data.map(row => {
      if (row.organization && (!row.passNumber || row.passNumber === '0')) {
        const org = row.organization;
        const number = orgCounters[org];
        orgCounters[org]++;
        return { ...row, passNumber: number.toString() };
      }
      return row;
    });
  };

  const handleImport = async () => {
    if (!csvData.trim()) {
      setError('Введіть або завантажте CSV дані');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setStats(null);
      setProgress(0);

      const lines = csvData.split('\n').filter(line => line.trim() !== '');
      if (lines.length < 2) {
        setError('CSV містить тільки заголовки або порожній');
        setLoading(false);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Перевіряємо наявність обов'язкових полів
      const requiredFields = ['licenseplate', 'organization', 'ownername'];
      const missingFields = requiredFields.filter(field => !headers.includes(field));
      
      if (missingFields.length > 0) {
        setError(`Відсутні обов'язкові поля: ${missingFields.join(', ')}`);
        setLoading(false);
        return;
      }

      // Парсимо всі дані
      const allRows = [];
      for (let i = 1; i < lines.length; i++) {
        try {
          const values = lines[i].split(',').map(v => v.trim());
          const row = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          
          // Пропускаємо порожні рядки
          if (row.licenseplate && row.licenseplate.trim()) {
            allRows.push(row);
          }
        } catch (rowError) {
          console.warn(`Помилка в рядку ${i+1}:`, rowError);
        }
      }

      if (allRows.length === 0) {
        setError('Не знайдено жодного запису для імпорту');
        setLoading(false);
        return;
      }

      // Генеруємо номери перепусток
      const rowsWithPassNumbers = generatePassNumbers(allRows);

      // Статистика
      const importStats = {
        total: rowsWithPassNumbers.length,
        imported: 0,
        skipped: 0,
        errors: [],
        organizations: new Set()
      };

      // Імпортуємо порціями по 50 записів
      const batchSize = 50;
      const totalBatches = Math.ceil(rowsWithPassNumbers.length / batchSize);

      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const start = batchIndex * batchSize;
        const end = Math.min(start + batchSize, rowsWithPassNumbers.length);
        const batchRows = rowsWithPassNumbers.slice(start, end);

        // Створюємо пакет для Firestore
        const batch = writeBatch(db);

        for (const row of batchRows) {
          try {
            const licensePlate = row.licenseplate.toUpperCase().replace(/[\s-]/g, '');
            const organization = row.organization.trim();
            const passNumber = row.passnumber || '1';
            
            if (!licensePlate || !organization) {
              importStats.skipped++;
              importStats.errors.push(`Пропущено: відсутній номер або організація`);
              continue;
            }

            // Обробляємо дати
            let issueDate = serverTimestamp();
            if (row.issuedate) {
              const dateStr = row.issuedate.toString().trim();
              if (dateStr) {
                try {
                  const date = new Date(dateStr);
                  if (!isNaN(date.getTime())) {
                    issueDate = date.toISOString();
                  }
                } catch (dateError) {
                  // Використовуємо serverTimestamp при помилці
                }
              }
            }

            // Створюємо новий документ
            const docRef = doc(collection(db, 'license_plates'));
            const plateData = {
              licensePlate: licensePlate,
              carModel: row.carmodel || '',
              ownerName: row.ownername || '',
              passNumber: passNumber,
              organization: organization,
              note: row.note || '',
              issueDate: issueDate,
              withdrawalDate: row.withdrawaldate || null,
              createdAt: serverTimestamp(),
              createdBy: 'system_import',
              updatedAt: serverTimestamp(),
              updatedBy: 'system_import',
              id: docRef.id
            };

            batch.set(docRef, plateData);
            importStats.imported++;
            importStats.organizations.add(organization);

          } catch (rowError) {
            importStats.skipped++;
            importStats.errors.push(`Помилка в записі: ${rowError.message}`);
          }
        }

        // Виконуємо пакет
        await batch.commit();

        // Оновлюємо прогрес
        const newProgress = Math.round(((batchIndex + 1) / totalBatches) * 100);
        setProgress(newProgress);
        setImportStatus(`Імпортовано ${importStats.imported} з ${importStats.total} записів...`);
      }

      // Фінальна статистика
      setStats({
        ...importStats,
        organizationsCount: importStats.organizations.size
      });

      setImportStatus(`Імпорт завершено! Успішно: ${importStats.imported}, Пропущено: ${importStats.skipped}, Організацій: ${importStats.organizations.size}`);

    } catch (error) {
      console.error('Помилка імпорту:', error);
      setError('Помилка імпорту: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      setError('');
      setImportStatus('Експорт даних...');

      // Отримуємо всі дані
      const querySnapshot = await getDocs(collection(db, 'license_plates'));
      const plates = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Формуємо CSV
      const headers = [
        'Державний номер',
        'Авто',
        'ПІБ Власника',
        '№ перепустки',
        'Організація',
        'Дата видачі',
        'Дата вилучення',
        'Примітка',
        'Дата створення'
      ];

      let csvContent = headers.join(',') + '\n';
      
      plates.forEach(plate => {
        const row = [
          `"${plate.licensePlate || ''}"`,
          `"${plate.carModel || ''}"`,
          `"${plate.ownerName || ''}"`,
          `"${plate.passNumber || ''}"`,
          `"${plate.organization || ''}"`,
          `"${plate.issueDate ? formatDateForExport(plate.issueDate) : ''}"`,
          `"${plate.withdrawalDate ? formatDateForExport(plate.withdrawalDate) : ''}"`,
          `"${plate.note || ''}"`,
          `"${plate.createdAt ? formatDateForExport(plate.createdAt) : ''}"`
        ];
        csvContent += row.join(',') + '\n';
      });

      // Створюємо файл
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `номерні_знаки_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setImportStatus(`Експортовано ${plates.length} записів у CSV файл`);
      
    } catch (error) {
      console.error('Помилка експорту:', error);
      setError('Помилка експорту: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDateForExport = (dateValue) => {
    if (!dateValue) return '';
    
    try {
      let date;
      
      if (dateValue.toDate) {
        date = dateValue.toDate();
      } else if (typeof dateValue === 'string') {
        date = new Date(dateValue);
      } else if (dateValue instanceof Date) {
        date = dateValue;
      } else {
        return '';
      }
      
      return date.toLocaleDateString('uk-UA');
    } catch {
      return '';
    }
  };

  const handleShowFormat = () => {
    setShowFormatDialog(true);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Імпорт та експорт даних
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {importStatus && <Alert severity="info" sx={{ mb: 2 }}>{importStatus}</Alert>}

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleShowFormat}
          >
            Формат файлу
          </Button>
          <Button
            variant="outlined"
            onClick={handleExport}
            startIcon={<DownloadIcon />}
            disabled={loading}
          >
            Експорт в CSV
          </Button>
        </Box>

        <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Імпорт даних з Excel/CSV
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
            >
              Завантажити CSV/Excel файл
              <input
                type="file"
                accept=".csv,.txt"
                hidden
                onChange={handleFileUpload}
                disabled={loading}
              />
            </Button>
            
            <Button
              variant="outlined"
              onClick={handleLoadSample}
              disabled={loading}
            >
              Завантажити приклад
            </Button>
          </Box>

          {loading && (
            <Box sx={{ width: '100%', mb: 2 }}>
              <LinearProgress variant="determinate" value={progress} />
              <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 1 }}>
                {progress}% завершено
              </Typography>
            </Box>
          )}

          <TextField
            label="CSV дані для імпорту"
            multiline
            rows={10}
            value={csvData}
            onChange={handleCSVChange}
            fullWidth
            placeholder="Вставте CSV дані або завантажте файл"
            variant="outlined"
            sx={{ mb: 3 }}
            disabled={loading}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleImport}
              disabled={loading || !csvData.trim()}
              startIcon={loading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
            >
              {loading ? 'Імпорт...' : 'Почати імпорт'}
            </Button>
          </Box>
        </Paper>

        {previewData.length > 0 && (
          <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Попередній перегляд ({previewData.length} записів)
            </Typography>
            
            <TableContainer sx={{ maxHeight: 300 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>№</TableCell>
                    <TableCell>Номер</TableCell>
                    <TableCell>Авто</TableCell>
                    <TableCell>Власник</TableCell>
                    <TableCell>Організація</TableCell>
                    <TableCell>Перепустка</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewData.map((row, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Chip 
                          label={row.licenseplate || row.licensePlate || 'Немає'} 
                          size="small" 
                          color={(row.licenseplate || row.licensePlate) ? 'primary' : 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{row.carmodel || row.carModel || '-'}</TableCell>
                      <TableCell>{row.ownername || row.ownerName || '-'}</TableCell>
                      <TableCell>{row.organization || '-'}</TableCell>
                      <TableCell>{row.passnumber || row.passNumber || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {stats && (
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom>
              Результати імпорту
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <Chip 
                label={`Всього: ${stats.total}`} 
                color="default" 
                variant="outlined" 
              />
              <Chip 
                label={`Успішно: ${stats.imported}`} 
                color="success" 
              />
              <Chip 
                label={`Пропущено: ${stats.skipped}`} 
                color="warning" 
              />
              <Chip 
                label={`Організацій: ${stats.organizationsCount}`} 
                color="info" 
                variant="outlined"
              />
            </Box>

            {stats.errors.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Помилки ({stats.errors.length}):
                </Typography>
                <Box sx={{ maxHeight: 200, overflow: 'auto', bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                  {stats.errors.slice(0, 20).map((error, index) => (
                    <Typography key={index} variant="caption" component="div" color="error" sx={{ mb: 0.5 }}>
                      • {error}
                    </Typography>
                  ))}
                  {stats.errors.length > 20 && (
                    <Typography variant="caption" color="textSecondary">
                      ... і ще {stats.errors.length - 20} помилок
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
          </Paper>
        )}
      </Box>

      <Dialog open={showFormatDialog} onClose={() => setShowFormatDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Формат файлу для імпорту
          <IconButton
            aria-label="close"
            onClick={() => setShowFormatDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Правильний формат CSV:
            </Typography>
            
            <Paper elevation={1} sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5', overflow: 'auto' }}>
              <pre style={{ margin: 0, fontSize: '12px' }}>
{`licensePlate,carModel,ownerName,passNumber,organization,issueDate,withdrawalDate,note
ВС0172РІ,Шевроле,Питльований Роман Володимирович,1,Хлібпром,2024-03-25,,
ВС5054ТМ,Nissan,Майдан Назар Степанович,2,Хлібпром,2024-03-25,,`}
              </pre>
            </Paper>

            <Typography variant="body1" gutterBottom>
              <strong>Обов'язкові поля:</strong>
            </Typography>
            <ul>
              <li><code>licensePlate</code> - Державний номер (обов'язково)</li>
              <li><code>organization</code> - Організація (обов'язково)</li>
              <li><code>ownerName</code> - ПІБ Власника (обов'язково)</li>
            </ul>

            <Typography variant="body1" gutterBottom>
              <strong>Необов'язкові поля:</strong>
            </Typography>
            <ul>
              <li><code>carModel</code> - Марка авто</li>
              <li><code>passNumber</code> - № перепустки (якщо немає - буде згенеровано автоматично)</li>
              <li><code>issueDate</code> - Дата видачі (формат: YYYY-MM-DD)</li>
              <li><code>withdrawalDate</code> - Дата вилучення</li>
              <li><code>note</code> - Примітка</li>
            </ul>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Порада:</strong> Збережіть ваш Excel файл як CSV (File → Save As → CSV UTF-8),
                а потім завантажте його в систему. Система автоматично конвертує формат.
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFormatDialog(false)}>Закрити</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default ImportExport;