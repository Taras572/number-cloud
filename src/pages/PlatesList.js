import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, TextField, MenuItem, Select, FormControl,
  InputLabel, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, Snackbar, Checkbox, Box, Typography,
  Tooltip, CircularProgress, Pagination
} from '@mui/material';
import { Edit, Delete, Search, Print } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import LicensePlateImage from "../components/LicensePlateImage";

function PlatesList() {
  const [plates, setPlates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedOrganization, setSelectedOrganization] = useState('all');
  const [organizations, setOrganizations] = useState([]);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [plateToDelete, setPlateToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [selectedPlates, setSelectedPlates] = useState(new Set());
  const [printDialog, setPrintDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Пагінація
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(50);

  // Мемоїзована функція форматування дати
  const formatFirebaseDate = useCallback((timestamp) => {
    if (!timestamp) return '-';

    try {
      if (timestamp.toDate) {
        return timestamp.toDate().toLocaleDateString('uk-UA');
      } else if (typeof timestamp === 'string') {
        return new Date(timestamp).toLocaleDateString('uk-UA');
      } else if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString('uk-UA');
      }
      return '-';
    } catch (error) {
      console.error('Помилка форматування дати:', error);
      return '-';
    }
  }, []);

  useEffect(() => {
    fetchPlates();
  }, []);

  const fetchPlates = async () => {
    setIsLoading(true);
    try {
      const platesRef = collection(db, 'license_plates');
      const q = query(platesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const platesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setPlates(platesData);

      const orgs = [...new Set(platesData
        .map(plate => plate.organization)
        .filter(Boolean)
        .sort())];
      setOrganizations(orgs);
    } catch (error) {
      console.error('Помилка завантаження:', error);
      showSnackbar('Помилка завантаження даних', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPlates = useMemo(() => {
    let filtered = plates;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(plate =>
        plate.licensePlate?.toLowerCase().includes(term) ||
        plate.ownerName?.toLowerCase().includes(term) ||
        plate.organization?.toLowerCase().includes(term) ||
        plate.carModel?.toLowerCase().includes(term)
      );
    }

    if (filterType === 'active') {
      filtered = filtered.filter(plate => !plate.withdrawalDate);
    } else if (filterType === 'withdrawn') {
      filtered = filtered.filter(plate => plate.withdrawalDate);
    }

    if (selectedOrganization !== 'all') {
      filtered = filtered.filter(plate => plate.organization === selectedOrganization);
    }

    return filtered;
  }, [plates, searchTerm, filterType, selectedOrganization]);

  // Пагінація
  const paginatedPlates = useMemo(() => {
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    return filteredPlates.slice(indexOfFirstRow, indexOfLastRow);
  }, [filteredPlates, currentPage, rowsPerPage]);

  const pageCount = Math.ceil(filteredPlates.length / rowsPerPage);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  // Скидання сторінки при зміні фільтрів
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, selectedOrganization]);

  const handleDeleteClick = useCallback((plate) => {
    setPlateToDelete(plate);
    setDeleteDialog(true);
  }, []);

  const confirmDelete = async () => {
    try {
      await deleteDoc(doc(db, 'license_plates', plateToDelete.id));
      setPlates(prev => prev.filter(p => p.id !== plateToDelete.id));

      setSelectedPlates(prev => {
        const newSet = new Set(prev);
        newSet.delete(plateToDelete.id);
        return newSet;
      });

      showSnackbar('Номер видалено успішно', 'success');
    } catch (error) {
      console.error('Помилка видалення:', error);
      showSnackbar('Помилка видалення', 'error');
    } finally {
      setDeleteDialog(false);
      setPlateToDelete(null);
    }
  };

  const handleSelectPlate = useCallback((plateId) => {
    setSelectedPlates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(plateId)) {
        newSet.delete(plateId);
      } else {
        if (newSet.size < 4) {
          newSet.add(plateId);
        } else {
          showSnackbar('Можна вибрати максимум 4 працівники для друку', 'warning');
        }
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedPlates(prev => {
      if (prev.size === paginatedPlates.length || paginatedPlates.length === 0) {
        return new Set();
      } else {
        const maxToSelect = Math.min(4, paginatedPlates.length);
        return new Set(paginatedPlates.slice(0, maxToSelect).map(plate => plate.id));
      }
    });
  }, [paginatedPlates]);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handlePrint = useCallback(() => {
    if (selectedPlates.size === 0) {
      showSnackbar('Будь ласка, виберіть хоча б одного працівника для друку', 'warning');
      return;
    }
    setPrintDialog(true);
  }, [selectedPlates]);

  const executePrint = useCallback(() => {
    const selectedPlatesData = plates.filter(plate => selectedPlates.has(plate.id));

    const platesForPrint = [...selectedPlatesData];
    while (platesForPrint.length < 4) {
      platesForPrint.push(null);
    }

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
                padding: 5mm;
                display: flex;
                flex-direction: column;
                position: relative;
                page-break-inside: avoid;
            }
            .permit-header {
                text-align: center;
                font-weight: bold;
                font-size: 22px;
                margin-bottom: 4mm;
                text-transform: uppercase;
                border-bottom: 2px solid #000;
                padding-bottom: 4mm;
                display: flex;
                justify-content: space-between;
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
                width: 53mm;
                flex-shrink: 0;
                font-size: 20px;
            }
            .field-value {
                flex-grow: 1;
                font-size: 20px;
            }
            .photo-container {
                position: absolute;
                bottom: 9mm;
                right: 5mm;
                width: 35mm;
                height: 45mm;
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
            table, th, td {
                border: 1px solid grey;
                text-align: left;
                border-collapse: separate;
            }
            th, td {
                padding: 8px 5px;
            }
            caption {
                font-size: 20px;
                color: blue;
            }
            .logo {
                color: white;
                background-color: red;
                margin-right: 10px;
                padding: 7px;
                font-size: 25px;
            }
            .logo-l{
                color:white;
                background-color: gray;
                font-size: 9px;
                margin-top: 10px;
                margin-right: 10px;
                margin-left: 78px;
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
                        <div class="permit-header">
                            <div>
                                <div><span class="logo">Pro</span><span class="logo">Tec</span></div>
                                <div class="logo-l">logistic</div>
                            </div> 
                            <span>Перепустка №${plate.passNumber || ''}</span>
                        </div>
                        <div class="photo-container">
                            <div class="photo-placeholder">
                                <div style="margin-bottom: 2mm;">ФОТО</div>
                                <div class="photo-text">3x4 см</div>
                            </div>
                        </div>
                        <div class="permit-content">
                            <table>
                                <tr>
                                    <td class="field-label">ПІБ:</td>
                                    <td class="field-value">${plate.ownerName || 'Не вказано'}</td>
                                </tr>
                                <tr>
                                    <td class="field-label">Організація:</td>
                                    <td class="field-value">${plate.organization || 'Не вказано'}</td>
                                </tr>
                                <tr>
                                    <td class="field-label">Держ. номер:</td>
                                    <td class="field-value">${plate.licensePlate || 'Не вказано'}</td>
                                </tr>
                                <tr>
                                    <td class="field-label">Марка авто:</td>
                                    <td class="field-value">${plate.carModel || 'Не вказано'}</td>
                                </tr>
                                <tr>
                                    <td class="field-label">Видана:</td>
                                    <td class="field-value">Новак І.В.</td>
                                </tr>
                                <tr>
                                    <td class="field-label">Підпис:</td>
                                    <td class="field-value"></td>
                                </tr>
                            </table>
                        </div>
                    </div>
                  `;
                }).join('')}
            </div>
        </div>
    </body>
    </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.onafterprint = function() {
        printWindow.close();
      };
    }, 300);

    setPrintDialog(false);
    setSelectedPlates(new Set());
    showSnackbar(`Сформовано перепустки для ${selectedPlates.size} працівників`, 'success');
  }, [plates, selectedPlates]);

  const showSnackbar = useCallback((message, severity) => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const isAllSelected = useMemo(() => {
    if (paginatedPlates.length === 0) return false;
    const maxSelectable = Math.min(4, paginatedPlates.length);
    const selectedOnPage = paginatedPlates.filter(plate => selectedPlates.has(plate.id)).length;
    return selectedOnPage === maxSelectable;
  }, [paginatedPlates, selectedPlates]);

  const isIndeterminate = useMemo(() => {
    if (paginatedPlates.length === 0) return false;
    const maxSelectable = Math.min(4, paginatedPlates.length);
    const selectedOnPage = paginatedPlates.filter(plate => selectedPlates.has(plate.id)).length;
    return selectedOnPage > 0 && selectedOnPage < maxSelectable;
  }, [paginatedPlates, selectedPlates]);

  const indexOfFirstRow = (currentPage - 1) * rowsPerPage + 1;
  const indexOfLastRow = Math.min(currentPage * rowsPerPage, filteredPlates.length);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Список номерних знаків</h1>
        <Button
          variant="contained"
          color="primary"
          component={Link}
          to="/plates/add"
        >
          Додати новий номер
        </Button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto auto',
        gap: '20px',
        marginBottom: '20px',
        alignItems: 'flex-end'
      }}>
        <TextField
          placeholder="Пошук за номером, ПІБ, організації, марці..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: <Search />,
          }}
          variant="outlined"
          size="small"
        />

        <FormControl size="small" style={{ minWidth: '180px' }}>
          <InputLabel>Фільтр по статусу</InputLabel>
          <Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            label="Фільтр по статусу"
          >
            <MenuItem value="all">Всі</MenuItem>
            <MenuItem value="active">Активні</MenuItem>
            <MenuItem value="withdrawn">Вилучені</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" style={{ minWidth: '180px' }}>
          <InputLabel>Організація</InputLabel>
          <Select
            value={selectedOrganization}
            onChange={(e) => setSelectedOrganization(e.target.value)}
            label="Організація"
          >
            <MenuItem value="all">Всі організації</MenuItem>
            {organizations.map((org, index) => (
              <MenuItem key={index} value={org}>{org}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>

      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2,
        p: 2,
        bgcolor: 'background.paper',
        borderRadius: 1,
        boxShadow: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body1">
            <strong>Вибрано для друку: {selectedPlates.size} / 4</strong>
            <Typography variant="caption" display="block" color="textSecondary">
              (4 перепустки на одному аркуші А4 альбомної орієнтації)
            </Typography>
          </Typography>
          {isLoading && <CircularProgress size={20} />}
        </Box>

        <Tooltip title={selectedPlates.size === 0 ? "Виберіть працівників для друку" : ""}>
          <span>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<Print />}
              onClick={handlePrint}
              disabled={selectedPlates.size === 0}
              size="large"
            >
              Друк перепусток
              {selectedPlates.size > 0 && ` (${selectedPlates.size})`}
            </Button>
          </span>
        </Tooltip>
      </Box>

      {/* Інформація про пагінацію */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {filteredPlates.length > 0 ? (
            `Показано ${indexOfFirstRow}-${indexOfLastRow} з ${filteredPlates.length} записів`
          ) : (
            'Немає записів для відображення'
          )}
        </Typography>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width="60" padding="checkbox">
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isIndeterminate}
                  onChange={handleSelectAll}
                  disabled={paginatedPlates.length === 0}
                />
              </TableCell>
              <TableCell><strong>Державний номер</strong></TableCell>
              <TableCell><strong>Авто</strong></TableCell>
              <TableCell><strong>ПІБ Власника</strong></TableCell>
              <TableCell><strong>Організація</strong></TableCell>
              <TableCell><strong>№ перепустки</strong></TableCell>
              <TableCell><strong>Дата видачі</strong></TableCell>
              <TableCell><strong>Дата вилучення</strong></TableCell>
              <TableCell><strong>Дії</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" style={{ padding: '40px' }}>
                  <CircularProgress />
                  <Typography variant="h6" color="textSecondary" style={{ marginTop: '20px' }}>
                    Завантаження даних...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : paginatedPlates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" style={{ padding: '40px' }}>
                  <Typography variant="h6" color="textSecondary">
                    {filteredPlates.length === 0 ? 'Немає даних для відображення' : 'Немає записів на цій сторінці'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedPlates.map((plate) => (
                <TableRow
                  key={plate.id}
                  hover
                  selected={selectedPlates.has(plate.id)}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedPlates.has(plate.id)}
                      onChange={() => handleSelectPlate(plate.id)}
                      disabled={selectedPlates.size >= 4 && !selectedPlates.has(plate.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LicensePlateImage text={plate.licensePlate} />
                    </Box>
                  </TableCell>
                  <TableCell>{plate.carModel || '-'}</TableCell>
                  <TableCell>{plate.ownerName || '-'}</TableCell>
                  <TableCell>{plate.organization || '-'}</TableCell>
                  <TableCell>{plate.passNumber || '-'}</TableCell>
                  <TableCell>{formatFirebaseDate(plate.issueDate)}</TableCell>
                  <TableCell>{formatFirebaseDate(plate.withdrawalDate)}</TableCell>
                  <TableCell>
                    <IconButton
                      component={Link}
                      to={`/plates/edit/${plate.id}`}
                      color="primary"
                      size="small"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteClick(plate)}
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Пагінація */}
      {pageCount > 1 && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          mt: 3, 
          mb: 2 
        }}>
          <Pagination
            count={pageCount}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
            siblingCount={1}
            boundaryCount={1}
          />
        </Box>
      )}

      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Підтвердження видалення</DialogTitle>
        <DialogContent>
          <Typography>
            Ви впевнені, що хочете видалити номер <strong>{plateToDelete?.licensePlate}</strong>?
            <br />
            <span style={{ color: '#666', fontSize: '0.9em' }}>
              Власник: {plateToDelete?.ownerName}
            </span>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Скасувати</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Видалити
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={printDialog} onClose={() => setPrintDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <span>Попередній перегляд друку</span>
            <Typography variant="caption" color="primary">
              4 перепустки на аркуші А4 (альбомна)
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{
            width: '100%',
            height: '300px',
            border: '1px solid #e0e0e0',
            borderRadius: 1,
            background: `linear-gradient(90deg, #f5f5f5 50%, transparent 50%),
    linear-gradient(180deg, #f5f5f5 50%, transparent 50%)`,
            backgroundSize: '50% 50%',
            mb: 3,
            position: 'relative',
            overflow: 'hidden'
          }}>
            <Box sx={{
              position: 'absolute',
              top: '10%',
              left: '10%',
              width: '80%',
              height: '80%',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gridTemplateRows: '1fr 1fr',
              gap: '1px',
              background: '#fff',
              border: '1px solid #ccc'
            }}>
              {Array.from({ length: 4 }).map((_, i) => {
                const plate = plates.find(p => Array.from(selectedPlates)[i]);
                return (
                  <Box key={i} sx={{
                    border: '1px solid #e0e0e0',
                    p: 1,
                    bgcolor: plate ? '#e8f5e9' : '#f5f5f5',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <Typography variant="caption" fontWeight="bold">
                      Перепустка {i + 1}
                    </Typography>
                    {plate ? (
                      <>
                        <Typography variant="caption" noWrap>
                          {plate.ownerName}
                        </Typography>
                        <Typography variant="caption" noWrap>
                          {plate.licensePlate}
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                        Порожня
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>

          <Typography variant="subtitle2" gutterBottom>
            Буде надруковано {selectedPlates.size} перепустки:
          </Typography>

          <Box sx={{
            mt: 1,
            mb: 2,
            p: 2,
            bgcolor: 'grey.50',
            borderRadius: 1,
            maxHeight: '200px',
            overflow: 'auto'
          }}>
            {plates
              .filter(plate => selectedPlates.has(plate.id))
              .map((plate, index) => (
                <Box key={plate.id} sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: 1,
                  p: 1,
                  bgcolor: 'white',
                  borderRadius: 1
                }}>
                  <Typography variant="body2" sx={{ minWidth: '30px', fontWeight: 'bold' }}>
                    {index + 1}.
                  </Typography>
                  <Box sx={{ ml: 2, flexGrow: 1 }}>
                    <Typography variant="body2">
                      <strong>{plate.licensePlate}</strong> - {plate.ownerName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {plate.carModel} • {plate.organization}
                    </Typography>
                  </Box>
                </Box>
              ))}
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            Аркуш буде сформовано в альбомній орієнтації з 4 перепустками.
            На кожній перепустці буде місце для фото 3x4 см.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPrintDialog(false)}>Скасувати</Button>
          <Button onClick={executePrint} variant="contained" color="primary" autoFocus>
            Друкувати
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default React.memo(PlatesList);