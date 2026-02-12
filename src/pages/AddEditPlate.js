
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container, TextField, Button, Typography, Box,
  FormControl, InputLabel, Select, MenuItem, Alert,
  InputAdornment, IconButton, CircularProgress,
  Paper, Collapse, Chip, Divider
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { db } from '../firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

function AddEditPlate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [usedNumbers, setUsedNumbers] = useState([]);
  const [missingNumbers, setMissingNumbers] = useState([]);
  const [autoPassNumber, setAutoPassNumber] = useState('');
  const [nextAvailableNumber, setNextAvailableNumber] = useState('');
  const [duplicateCheckResult, setDuplicateCheckResult] = useState(null);
  const [showMissingNumbers, setShowMissingNumbers] = useState(false);
  const [loadingNumbers, setLoadingNumbers] = useState(false);
  const isEditMode = !!id;

  const { 
    handleSubmit, 
    reset, 
    formState: { errors }, 
    control,
    setValue,
    watch,
    trigger
  } = useForm({
    defaultValues: {
      licensePlate: '',
      carModel: '',
      ownerName: '',
      passNumber: '',
      organization: '',
      note: ''
    }
  });

  const watchLicensePlate = watch('licensePlate');
  const watchOwnerName = watch('ownerName');
  const watchOrganization = watch('organization');
  const watchPassNumber = watch('passNumber');

  useEffect(() => {
    fetchOrganizations();
    if (isEditMode) {
      fetchPlate();
    }
  }, [id]);

  // Окремий useEffect для завантаження номерів при зміні організації
  useEffect(() => {
    // Очищаємо всі старі дані при зміні організації
    setUsedNumbers([]);
    setMissingNumbers([]);
    setAutoPassNumber('');
    setNextAvailableNumber('');
    setShowMissingNumbers(false);
    
    if (watchOrganization) {
      // Додаємо невелику затримку, щоб уникнути гонки станів
      const timeoutId = setTimeout(() => {
        fetchUsedPassNumbers(watchOrganization);
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [watchOrganization]);

  const fetchOrganizations = async () => {
    try {
      const orgsRef = collection(db, 'organizations');
      const querySnapshot = await getDocs(orgsRef);
      
      const orgsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      })).sort((a, b) => a.name.localeCompare(b.name));
      
      setOrganizations(orgsData);
    } catch (error) {
      console.error('Помилка завантаження організацій:', error);
    }
  };

  const fetchUsedPassNumbers = async (organizationName) => {
    // Якщо організація не вибрана - виходимо
    if (!organizationName) return;
    
    setLoadingNumbers(true);
    
    try {
      console.log('===========');
      console.log('Завантаження номерів для організації:', organizationName);
      
      // Завантажуємо ВСІ номерні знаки для цієї організації
      const platesRef = collection(db, 'license_plates');
      const q = query(
        platesRef, 
        where('organization', '==', organizationName)
      );
      const querySnapshot = await getDocs(q);
      
      console.log('Знайдено документів:', querySnapshot.size);
      
      // Отримуємо всі використані номери перепусток
      const numbers = [];
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.passNumber) {
          const num = parseInt(data.passNumber);
          if (!isNaN(num) && num > 0) {
            numbers.push(num);
          }
        }
      });
      
      // Видаляємо дублікати (на всяк випадок) і сортуємо
      const uniqueNumbers = [...new Set(numbers)].sort((a, b) => a - b);
      console.log('Використані номери:', uniqueNumbers);
      
      // Оновлюємо стан з використаними номерами
      setUsedNumbers(uniqueNumbers);
      
      // Аналізуємо номери
      analyzePassNumbers(uniqueNumbers);
      
    } catch (error) {
      console.error('Помилка завантаження номерів перепусток:', error);
      setUsedNumbers([]);
      setMissingNumbers([]);
      setAutoPassNumber('1');
      setNextAvailableNumber('1');
      
      if (!isEditMode) {
        setValue('passNumber', '1', { shouldValidate: true });
      }
    } finally {
      setLoadingNumbers(false);
    }
  };

  const analyzePassNumbers = (numbers) => {
    console.log('Аналіз номерів:', numbers);
    
    if (!numbers || numbers.length === 0) {
      console.log('Немає використаних номерів');
      setMissingNumbers([]);
      setNextAvailableNumber('1');
      setAutoPassNumber('1');
      if (!isEditMode) {
        setValue('passNumber', '1', { shouldValidate: true });
      }
      return;
    }

    // Знаходимо максимальний номер
    const maxNumber = Math.max(...numbers);
    console.log('Максимальний номер:', maxNumber);
    
    // Знаходимо пропущені номери від 1 до максимального
    const missing = [];
    const numbersSet = new Set(numbers);
    
    for (let i = 1; i <= maxNumber; i++) {
      if (!numbersSet.has(i)) {
        missing.push(i);
      }
    }
    
    console.log('Пропущені номери:', missing);
    setMissingNumbers(missing);
    
    // Наступний доступний номер після максимального
    const nextNumber = maxNumber + 1;
    setNextAvailableNumber(nextNumber.toString());
    
    // Встановлюємо рекомендований номер
    if (!isEditMode) {
      if (missing.length > 0) {
        // Якщо є пропущені - використовуємо найменший пропущений
        const recommended = missing[0].toString();
        setAutoPassNumber(recommended);
        setValue('passNumber', recommended, { shouldValidate: true });
        console.log('Рекомендований пропущений номер:', recommended);
      } else {
        // Якщо немає пропущених - використовуємо наступний
        setAutoPassNumber(nextNumber.toString());
        setValue('passNumber', nextNumber.toString(), { shouldValidate: true });
        console.log('Рекомендований наступний номер:', nextNumber);
      }
    }
  };

  const fetchPlate = async () => {
    try {
      const docRef = doc(db, 'license_plates', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const formData = {
          licensePlate: data.licensePlate || '',
          carModel: data.carModel || '',
          ownerName: data.ownerName || '',
          passNumber: data.passNumber || '',
          organization: data.organization || '',
          note: data.note || ''
        };
        
        reset(formData);
      }
    } catch (error) {
      console.error('Помилка завантаження:', error);
      setError('Помилка завантаження даних');
    }
  };

  const normalizeLicensePlate = (plate) => {
    return plate.toUpperCase().replace(/[\s-]/g, '');
  };

  const normalizeName = (name) => {
    return name.trim().toLowerCase();
  };

  const validateLicensePlate = (plate) => {
    const normalized = normalizeLicensePlate(plate);
    
    if (normalized.length < 1 || normalized.length > 10) {
      return 'Номер повинен містити від 1 до 10 символів';
    }

    const validChars = /^[A-ZА-ЯІЇЄ0-9]+$/;
    if (!validChars.test(normalized)) {
      return 'Дозволені тільки літери (A-Z, А-Я, І, Ї, Є) та цифри (0-9)';
    }

    return true;
  };

  const performDuplicateCheck = async () => {
    if (!watchLicensePlate && !watchOwnerName) return;

    try {
      setCheckingDuplicates(true);
      setDuplicateCheckResult(null);

      const platesRef = collection(db, 'license_plates');
      const conditions = [];

      if (watchLicensePlate && watchLicensePlate.length >= 2) {
        const normalizedPlate = normalizeLicensePlate(watchLicensePlate);
        conditions.push(where('licensePlate', '==', normalizedPlate));
      }

      if (conditions.length === 0) return;

      let q;
      if (conditions.length === 1) {
        q = query(platesRef, conditions[0]);
      } else {
        q = query(platesRef, conditions[0], conditions[1]);
      }

      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const duplicates = querySnapshot.docs
          .filter(doc => !isEditMode || doc.id !== id)
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              licensePlate: data.licensePlate,
              ownerName: data.ownerName,
              organization: data.organization,
              issueDate: data.issueDate
            };
          });

        if (duplicates.length > 0) {
          setDuplicateCheckResult({
            type: 'warning',
            message: `Знайдено ${duplicates.length} співпадінь:`,
            duplicates
          });
        } else {
          setDuplicateCheckResult({
            type: 'success',
            message: 'Дублікатів не знайдено'
          });
        }
      } else {
        setDuplicateCheckResult({
          type: 'success',
          message: 'Дублікатів не знайдено'
        });
      }
    } catch (error) {
      console.error('Помилка перевірки дублікатів:', error);
      setDuplicateCheckResult({
        type: 'error',
        message: 'Помилка перевірки дублікатів'
      });
    } finally {
      setCheckingDuplicates(false);
    }
  };

  const handleRefreshPassNumber = () => {
    if (autoPassNumber) {
      setValue('passNumber', autoPassNumber, { shouldValidate: true });
    }
  };

  const handleSelectNumber = (number) => {
    setValue('passNumber', number.toString(), { shouldValidate: true });
    setShowMissingNumbers(false);
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const isValid = await trigger();
      if (!isValid) {
        setError('Будь ласка, заповніть всі обов\'язкові поля правильно');
        setLoading(false);
        return;
      }

      const normalizedPlate = normalizeLicensePlate(data.licensePlate);
      const normalizedName = normalizeName(data.ownerName);
      
      // Перевірка дублікатів номерного знаку
      const platesRef = collection(db, 'license_plates');
      const plateQuery = query(platesRef, where('licensePlate', '==', normalizedPlate));
      const plateSnapshot = await getDocs(plateQuery);
      
      if (!isEditMode && !plateSnapshot.empty) {
        setError('Номерний знак вже існує в базі');
        setLoading(false);
        return;
      }

      if (isEditMode) {
        const existingDuplicates = plateSnapshot.docs.filter(doc => doc.id !== id);
        if (existingDuplicates.length > 0) {
          setError('Номерний знак вже існує в базі');
          setLoading(false);
          return;
        }
      }

      if (!data.organization) {
        setError('Оберіть організацію');
        setLoading(false);
        return;
      }

      if (!data.passNumber) {
        setError('Номер перепустки обов\'язковий');
        setLoading(false);
        return;
      }

      // Перевірка, чи номер перепустки вільний
      const passNumberInt = parseInt(data.passNumber);
      const isNumberAvailable = !usedNumbers.includes(passNumberInt) || 
        (isEditMode && watchPassNumber === data.passNumber);
      
      if (!isNumberAvailable) {
        setError(`Номер перепустки ${data.passNumber} вже використовується в організації "${data.organization}"`);
        setLoading(false);
        return;
      }

      const currentDate = new Date().toISOString();
      
      if (isEditMode) {
        const docRef = doc(db, 'license_plates', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const existingData = docSnap.data();
          
          await updateDoc(docRef, {
            licensePlate: normalizedPlate,
            carModel: data.carModel,
            ownerName: data.ownerName,
            passNumber: data.passNumber,
            organization: data.organization,
            note: data.note,
            updatedAt: serverTimestamp(),
            updatedBy: currentUser.uid,
            history: [
              ...(existingData.history || []),
              {
                action: 'updated',
                timestamp: currentDate,
                user: currentUser.uid,
                changes: data
              }
            ]
          });
        }
        
        setSuccess('Дані успішно оновлено');
        setTimeout(() => navigate('/plates'), 1500);
      } else {
        const newDocRef = doc(collection(db, 'license_plates'));
        
        await setDoc(newDocRef, {
          licensePlate: normalizedPlate,
          carModel: data.carModel,
          ownerName: data.ownerName,
          passNumber: data.passNumber,
          organization: data.organization,
          note: data.note,
          normalizedName: normalizedName,
          issueDate: serverTimestamp(),
          withdrawalDate: null,
          createdAt: serverTimestamp(),
          createdBy: currentUser.uid,
          updatedAt: serverTimestamp(),
          updatedBy: currentUser.uid,
          id: newDocRef.id,
          history: [
            {
              action: 'created',
              timestamp: currentDate,
              user: currentUser.uid
            }
          ]
        });
        
        setSuccess('Номер успішно додано');
        setTimeout(() => navigate('/plates'), 1500);
      }

    } catch (error) {
      console.error('Помилка збереження:', error);
      setError('Помилка збереження даних: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldName, value) => {
    setValue(fieldName, value, { shouldValidate: true });
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {isEditMode ? 'Редагування номерного знаку' : 'Додати новий номерний знак'}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Alert severity="info" sx={{ mb: 3 }}>
          Система автоматично запропонує вільний номер перепустки для обраної організації.
          При введенні даних автоматично перевіряє наявність дублікатів.
        </Alert>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ display: 'grid', gap: 3 }}>
            <Box>
              <Controller
                name="licensePlate"
                control={control}
                rules={{ 
                  required: 'Обов\'язкове поле',
                  validate: {
                    format: (value) => validateLicensePlate(value)
                  }
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Державний номер *"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message || 'Наприклад: АА1234ББ, VIP001'}
                    fullWidth
                    placeholder="АА1234ББ"
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      field.onChange(value);
                      handleFieldChange('licensePlate', value);
                    }}
                    value={field.value || ''}
                    InputLabelProps={{
                      shrink: !!field.value
                    }}
                  />
                )}
              />
              {checkingDuplicates && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                  <CircularProgress size={16} />
                  <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                    Перевірка на дублікати...
                  </Typography>
                </Box>
              )}
            </Box>

            <Box>
              <Controller
                name="ownerName"
                control={control}
                rules={{ 
                  required: 'Обов\'язкове поле',
                  minLength: {
                    value: 3,
                    message: 'ПІБ повинно містити мінімум 3 символи'
                  }
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="ПІБ Власника *"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    fullWidth
                    value={field.value || ''}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      handleFieldChange('ownerName', e.target.value);
                    }}
                    InputLabelProps={{
                      shrink: !!field.value
                    }}
                  />
                )}
              />
            </Box>

            {duplicateCheckResult && (
              <Alert 
                severity={duplicateCheckResult.type}
                sx={{ mb: 2 }}
                onClose={() => setDuplicateCheckResult(null)}
              >
                <Typography variant="body2" fontWeight="bold">
                  {duplicateCheckResult.message}
                </Typography>
                {duplicateCheckResult.duplicates && duplicateCheckResult.duplicates.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    {duplicateCheckResult.duplicates.map((dup, index) => (
                      <Typography key={index} variant="caption" component="div">
                        • {dup.licensePlate} - {dup.ownerName} ({dup.organization})
                      </Typography>
                    ))}
                  </Box>
                )}
              </Alert>
            )}

            <Controller
              name="organization"
              control={control}
              rules={{ required: 'Оберіть організацію' }}
              render={({ field, fieldState }) => (
                <FormControl fullWidth error={!!fieldState.error}>
                  <InputLabel shrink={!!field.value}>Організація *</InputLabel>
                  <Select
                    {...field}
                    label="Організація *"
                    value={field.value || ''}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      handleFieldChange('organization', e.target.value);
                    }}
                    displayEmpty
                  >
                    {organizations.map((org) => (
                      <MenuItem key={org.id} value={org.name}>
                        {org.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {fieldState.error && (
                    <Typography color="error" variant="caption">
                      {fieldState.error.message}
                    </Typography>
                  )}
                </FormControl>
              )}
            />

            {watchOrganization && (
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  bgcolor: '#f8f9fa',
                  borderColor: missingNumbers.length > 0 ? '#ff9800' : '#4caf50',
                  borderWidth: 2
                }}
              >
                {loadingNumbers ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      Завантаження номерів...
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {missingNumbers.length > 0 ? (
                          <WarningIcon sx={{ color: '#ff9800' }} />
                        ) : (
                          <CheckCircleIcon sx={{ color: '#4caf50' }} />
                        )}
                        <Typography variant="subtitle1" fontWeight="bold">
                          {watchOrganization}
                        </Typography>
                      </Box>
                      <Chip 
                        label={`Всього видано: ${usedNumbers.length}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>

                    {/* Використані номери */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        <strong>Використані номери:</strong>
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {usedNumbers.length > 0 ? (
                          usedNumbers.slice(0, 20).map((num) => (
                            <Chip
                              key={num}
                              label={num}
                              size="small"
                              variant="outlined"
                              sx={{ 
                                backgroundColor: '#e3f2fd',
                                borderColor: '#90caf9',
                                fontWeight: 'bold'
                              }}
                            />
                          ))
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            Немає виданих номерів
                          </Typography>
                        )}
                        {usedNumbers.length > 20 && (
                          <Typography variant="caption" color="textSecondary">
                            +{usedNumbers.length - 20}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {/* Пропущені номери */}
                    {missingNumbers.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                            ⚠️ Пропущені номери ({missingNumbers.length}):
                          </Typography>
                          <Button
                            size="small"
                            onClick={() => setShowMissingNumbers(!showMissingNumbers)}
                            endIcon={showMissingNumbers ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            sx={{ color: '#ff9800' }}
                          >
                            {showMissingNumbers ? 'Сховати' : 'Показати'}
                          </Button>
                        </Box>
                        
                        <Collapse in={showMissingNumbers}>
                          <Box sx={{ 
                            p: 1.5, 
                            bgcolor: '#fff3e0', 
                            borderRadius: 1,
                            display: 'flex',
                            gap: 0.5,
                            flexWrap: 'wrap'
                          }}>
                            {missingNumbers.map((number) => (
                              <Chip
                                key={number}
                                label={number}
                                size="small"
                                onClick={() => handleSelectNumber(number)}
                                sx={{ 
                                  backgroundColor: 'white',
                                  borderColor: '#ff9800',
                                  color: '#ff9800',
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                  '&:hover': {
                                    backgroundColor: '#ff9800',
                                    color: 'white'
                                  }
                                }}
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        </Collapse>
                      </Box>
                    )}

                    {/* Доступні номери після останнього */}
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ color: '#4caf50', fontWeight: 'bold' }} gutterBottom>
                        ✅ Доступні номери після {nextAvailableNumber || '1'}:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                        {[0, 1, 2, 3, 4].map((i) => {
                          const num = parseInt(nextAvailableNumber || '1') + i;
                          return (
                            <Chip
                              key={num}
                              label={num}
                              size="small"
                              onClick={() => handleSelectNumber(num)}
                              sx={{ 
                                backgroundColor: '#e8f5e9',
                                borderColor: '#4caf50',
                                color: '#2e7d32',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                '&:hover': {
                                  backgroundColor: '#4caf50',
                                  color: 'white'
                                }
                              }}
                              variant="outlined"
                            />
                          );
                        })}
                        <Typography variant="caption" color="textSecondary" sx={{ ml: 0.5 }}>
                          ... і далі
                        </Typography>
                      </Box>
                    </Box>

                    {/* Рекомендований номер */}
                    <Divider sx={{ my: 1.5 }} />
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="body2">
                        <strong>Рекомендований номер:</strong>
                      </Typography>
                      <Chip
                        label={autoPassNumber || '1'}
                        color="primary"
                        onClick={() => handleSelectNumber(autoPassNumber || '1')}
                        sx={{ 
                          cursor: 'pointer',
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          minWidth: '60px'
                        }}
                      />
                    </Box>
                  </>
                )}
              </Paper>
            )}

            <Box>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                № перепустки *
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <Controller
                  name="passNumber"
                  control={control}
                  rules={{ 
                    required: 'Номер перепустки обов\'язковий',
                    validate: {
                      isNumber: (value) => !isNaN(value) || 'Має бути числом',
                      isPositive: (value) => parseInt(value) > 0 || 'Має бути більше 0',
                      isAvailable: (value) => {
                        const num = parseInt(value);
                        if (!watchOrganization) return true;
                        if (isEditMode && watchPassNumber === value) return true;
                        return !usedNumbers.includes(num) || 'Цей номер вже використовується';
                      }
                    }
                  }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      fullWidth
                      disabled={!watchOrganization || loadingNumbers}
                      value={field.value || ''}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        handleFieldChange('passNumber', e.target.value);
                      }}
                      InputLabelProps={{
                        shrink: !!field.value
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            {field.value === autoPassNumber ? '✅' : (
                              missingNumbers.includes(parseInt(field.value)) ? '⚠️' : '✏️'
                            )}
                          </InputAdornment>
                        )
                      }}
                    />
                  )}
                />
                {autoPassNumber && watchOrganization && !loadingNumbers && (
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={handleRefreshPassNumber}
                    disabled={loading || watchPassNumber === autoPassNumber}
                    sx={{ height: '56px', minWidth: '100px' }}
                  >
                    Авто
                  </Button>
                )}
              </Box>
              <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                {watchOrganization 
                  ? loadingNumbers 
                    ? 'Завантаження номерів...'
                    : autoPassNumber 
                      ? missingNumbers.length > 0 
                        ? `⚠️ Є пропущені номери. Рекомендуємо спочатку використати номер ${missingNumbers[0]}`
                        : `✅ Всі номери до ${parseInt(nextAvailableNumber) - 1} використано. Наступний вільний: ${autoPassNumber}`
                      : 'Завантаження доступних номерів...'
                  : 'Оберіть організацію для отримання вільного номера'
                }
              </Typography>
            </Box>

            <Controller
              name="carModel"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Марка та модель авто"
                  fullWidth
                  value={field.value || ''}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    handleFieldChange('carModel', e.target.value);
                  }}
                  InputLabelProps={{
                    shrink: !!field.value
                  }}
                />
              )}
            />

            <Controller
              name="note"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Примітка"
                  multiline
                  rows={3}
                  fullWidth
                  value={field.value || ''}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    handleFieldChange('note', e.target.value);
                  }}
                  InputLabelProps={{
                    shrink: !!field.value
                  }}
                />
              )}
            />

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/plates')}
                disabled={loading}
              >
                Скасувати
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading || loadingNumbers}
              >
                {loading ? 'Збереження...' : (isEditMode ? 'Оновити' : 'Додати')}
              </Button>
            </Box>
          </Box>
        </form>
      </Box>
    </Container>
  );
}

export default AddEditPlate;