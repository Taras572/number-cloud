
// import React, { useState, useEffect } from 'react';
// import { useForm, Controller } from 'react-hook-form';
// import { useNavigate, useParams } from 'react-router-dom';
// import {
//   Container, TextField, Button, Typography, Box,
//   FormControl, InputLabel, Select, MenuItem, Alert,
//   InputAdornment, IconButton, CircularProgress
// } from '@mui/material';
// import RefreshIcon from '@mui/icons-material/Refresh';
// import { db } from '../firebase';
// import { 
//   doc, 
//   setDoc, 
//   getDoc, 
//   updateDoc, 
//   serverTimestamp,
//   collection,
//   query,
//   where,
//   getDocs,
//   orderBy,
//   writeBatch
// } from 'firebase/firestore';
// import { useAuth } from '../contexts/AuthContext';

// function AddEditPlate() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const { currentUser } = useAuth();
//   const [loading, setLoading] = useState(false);
//   const [checkingDuplicates, setCheckingDuplicates] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const [organizations, setOrganizations] = useState([]);
//   const [availablePassNumbers, setAvailablePassNumbers] = useState([]);
//   const [autoPassNumber, setAutoPassNumber] = useState('');
//   const [duplicateCheckResult, setDuplicateCheckResult] = useState(null);
//   const isEditMode = !!id;

//   const { 
//     register, 
//     handleSubmit, 
//     reset, 
//     formState: { errors }, 
//     control,
//     setValue,
//     watch,
//     trigger
//   } = useForm({
//     defaultValues: {
//       licensePlate: '',
//       carModel: '',
//       ownerName: '',
//       passNumber: '',
//       organization: '',
//       note: ''
//     }
//   });

//   const watchLicensePlate = watch('licensePlate');
//   const watchOwnerName = watch('ownerName');
//   const watchOrganization = watch('organization');
//   const watchPassNumber = watch('passNumber');

//   useEffect(() => {
//     fetchOrganizations();
//     if (isEditMode) {
//       fetchPlate();
//     }
//   }, [id]);

//   useEffect(() => {
//     if (watchOrganization) {
//       fetchAvailablePassNumbers(watchOrganization);
//     } else {
//       setAvailablePassNumbers([]);
//       setAutoPassNumber('');
//     }
//   }, [watchOrganization]);

//   // Автоматична перевірка дублікатів при зміні номеру або ПІБ
//   useEffect(() => {
//     const checkForDuplicates = async () => {
//       if ((watchLicensePlate && watchLicensePlate.length >= 2) || 
//           (watchOwnerName && watchOwnerName.length >= 3)) {
//         await performDuplicateCheck();
//       } else {
//         setDuplicateCheckResult(null);
//       }
//     };

//     const timeoutId = setTimeout(checkForDuplicates, 500);
//     return () => clearTimeout(timeoutId);
//   }, [watchLicensePlate, watchOwnerName]);

//   const fetchOrganizations = async () => {
//     try {
//       const orgsRef = collection(db, 'organizations');
//       const querySnapshot = await getDocs(orgsRef);
      
//       const orgsData = querySnapshot.docs.map(doc => ({
//         id: doc.id,
//         name: doc.data().name
//       })).sort((a, b) => a.name.localeCompare(b.name));
      
//       setOrganizations(orgsData);
//     } catch (error) {
//       console.error('Помилка завантаження організацій:', error);
//     }
//   };

//   const fetchAvailablePassNumbers = async (organizationName) => {
//     try {
//       // Знаходимо всі номери перепусток для цієї організації
//       const platesRef = collection(db, 'license_plates');
//       const q = query(
//         platesRef, 
//         where('organization', '==', organizationName),
//         orderBy('passNumber')
//       );
//       const querySnapshot = await getDocs(q);
      
//       // Отримуємо всі використані номери
//       const usedPassNumbers = new Set();
//       querySnapshot.docs.forEach(doc => {
//         const data = doc.data();
//         if (data.passNumber) {
//           const num = parseInt(data.passNumber);
//           if (!isNaN(num) && num > 0) {
//             usedPassNumbers.add(num);
//           }
//         }
//       });
      
//       // Знаходимо перший вільний номер (від 1 до 1000)
//       let freeNumber = 1;
//       while (usedPassNumbers.has(freeNumber) && freeNumber <= 1000) {
//         freeNumber++;
//       }
      
//       // Генеруємо список доступних номерів (перші 20 вільних)
//       const availableNumbers = [];
//       for (let i = 1; i <= 1000; i++) {
//         if (!usedPassNumbers.has(i)) {
//           availableNumbers.push(i);
//           if (availableNumbers.length >= 20) break;
//         }
//       }
      
//       setAvailablePassNumbers(availableNumbers);
//       setAutoPassNumber(freeNumber.toString());
      
//       // Автоматично встановлюємо вільний номер тільки при створенні нового запису
//       if (!isEditMode && freeNumber > 0) {
//         setValue('passNumber', freeNumber.toString(), { shouldValidate: true });
//       }
//     } catch (error) {
//       console.error('Помилка завантаження номерів перепусток:', error);
//       setAvailablePassNumbers([]);
//       setAutoPassNumber('');
//     }
//   };

//   const fetchPlate = async () => {
//     try {
//       const docRef = doc(db, 'license_plates', id);
//       const docSnap = await getDoc(docRef);
      
//       if (docSnap.exists()) {
//         const data = docSnap.data();
//         reset({
//           licensePlate: data.licensePlate || '',
//           carModel: data.carModel || '',
//           ownerName: data.ownerName || '',
//           passNumber: data.passNumber || '',
//           organization: data.organization || '',
//           note: data.note || ''
//         });
        
//         if (data.organization) {
//           fetchAvailablePassNumbers(data.organization);
//         }
//       }
//     } catch (error) {
//       console.error('Помилка завантаження:', error);
//       setError('Помилка завантаження даних');
//     }
//   };

//   const normalizeLicensePlate = (plate) => {
//     return plate.toUpperCase().replace(/[\s-]/g, '');
//   };

//   const normalizeName = (name) => {
//     return name.trim().toLowerCase();
//   };

//   const validateLicensePlate = (plate) => {
//     const normalized = normalizeLicensePlate(plate);
    
//     if (normalized.length < 1 || normalized.length > 10) {
//       return 'Номер повинен містити від 1 до 10 символів';
//     }

//     const validChars = /^[A-ZА-ЯІЇЄ0-9]+$/;
//     if (!validChars.test(normalized)) {
//       return 'Дозволені тільки літери (A-Z, А-Я, І, Ї, Є) та цифри (0-9)';
//     }

//     return true;
//   };

//   const performDuplicateCheck = async () => {
//     if (!watchLicensePlate && !watchOwnerName) return;

//     try {
//       setCheckingDuplicates(true);
//       setDuplicateCheckResult(null);

//       const platesRef = collection(db, 'license_plates');
//       const conditions = [];

//       if (watchLicensePlate && watchLicensePlate.length >= 2) {
//         const normalizedPlate = normalizeLicensePlate(watchLicensePlate);
//         conditions.push(where('licensePlate', '==', normalizedPlate));
//       }

//       // Створюємо запит тільки якщо є умови
//       if (conditions.length === 0) return;

//       let q;
//       if (conditions.length === 1) {
//         q = query(platesRef, conditions[0]);
//       } else {
//         q = query(platesRef, conditions[0], conditions[1]);
//       }

//       const querySnapshot = await getDocs(q);
      
//       if (!querySnapshot.empty) {
//         const duplicates = querySnapshot.docs
//           .filter(doc => !isEditMode || doc.id !== id) // Виключаємо поточний запис при редагуванні
//           .map(doc => {
//             const data = doc.data();
//             return {
//               id: doc.id,
//               licensePlate: data.licensePlate,
//               ownerName: data.ownerName,
//               organization: data.organization,
//               issueDate: data.issueDate
//             };
//           });

//         if (duplicates.length > 0) {
//           setDuplicateCheckResult({
//             type: 'warning',
//             message: `Знайдено ${duplicates.length} співпадінь:`,
//             duplicates
//           });
//         } else {
//           setDuplicateCheckResult({
//             type: 'success',
//             message: 'Дублікатів не знайдено'
//           });
//         }
//       } else {
//         setDuplicateCheckResult({
//           type: 'success',
//           message: 'Дублікатів не знайдено'
//         });
//       }
//     } catch (error) {
//       console.error('Помилка перевірки дублікатів:', error);
//       setDuplicateCheckResult({
//         type: 'error',
//         message: 'Помилка перевірки дублікатів'
//       });
//     } finally {
//       setCheckingDuplicates(false);
//     }
//   };

//   const handleRefreshPassNumber = () => {
//     if (autoPassNumber) {
//       setValue('passNumber', autoPassNumber, { shouldValidate: true });
//     }
//   };

//   const handleManualChange = (e) => {
//     setValue('passNumber', e.target.value, { shouldValidate: true });
//   };

//   const onSubmit = async (data) => {
//     try {
//       setLoading(true);
//       setError('');
//       setSuccess('');

//       // Перевірка валідації форми
//       const isValid = await trigger();
//       if (!isValid) {
//         setError('Будь ласка, заповніть всі обов\'язкові поля правильно');
//         setLoading(false);
//         return;
//       }

//       const normalizedPlate = normalizeLicensePlate(data.licensePlate);
//       const normalizedName = normalizeName(data.ownerName);
      
//       // Перевірка дублікатів перед збереженням
//       const platesRef = collection(db, 'license_plates');
//       const plateQuery = query(platesRef, where('licensePlate', '==', normalizedPlate));
//       const plateSnapshot = await getDocs(plateQuery);
      
//       if (!isEditMode && !plateSnapshot.empty) {
//         setError('Номерний знак вже існує в базі');
//         setLoading(false);
//         return;
//       }

//       // Перевірка при редагуванні (не дозволяємо змінити на існуючий номер)
//       if (isEditMode) {
//         const existingDuplicates = plateSnapshot.docs.filter(doc => doc.id !== id);
//         if (existingDuplicates.length > 0) {
//           setError('Номерний знак вже існує в базі');
//           setLoading(false);
//           return;
//         }
//       }

//       if (!data.organization) {
//         setError('Оберіть організацію');
//         setLoading(false);
//         return;
//       }

//       if (!data.passNumber) {
//         setError('Номер перепустки обов\'язковий');
//         setLoading(false);
//         return;
//       }

//       // Перевірка, чи номер перепустки вільний
//       const passNumberQuery = query(
//         platesRef, 
//         where('organization', '==', data.organization),
//         where('passNumber', '==', data.passNumber)
//       );
//       const passNumberSnapshot = await getDocs(passNumberQuery);
      
//       const isPassNumberTaken = passNumberSnapshot.docs.some(doc => {
//         if (isEditMode) {
//           return doc.id !== id; // При редагуванні ігноруємо поточний запис
//         }
//         return true;
//       });

//       if (isPassNumberTaken) {
//         setError(`Номер перепустки ${data.passNumber} вже використовується в організації "${data.organization}"`);
//         setLoading(false);
//         return;
//       }

//       const currentDate = new Date().toISOString();
      
//       if (isEditMode) {
//         const docRef = doc(db, 'license_plates', id);
//         const docSnap = await getDoc(docRef);
        
//         if (docSnap.exists()) {
//           const existingData = docSnap.data();
          
//           await updateDoc(docRef, {
//             licensePlate: normalizedPlate,
//             carModel: data.carModel,
//             ownerName: data.ownerName,
//             passNumber: data.passNumber,
//             organization: data.organization,
//             note: data.note,
//             updatedAt: serverTimestamp(),
//             updatedBy: currentUser.uid,
//             history: [
//               ...(existingData.history || []),
//               {
//                 action: 'updated',
//                 timestamp: currentDate,
//                 user: currentUser.uid,
//                 changes: data
//               }
//             ]
//           });
//         }
        
//         setSuccess('Дані успішно оновлено');
//         setTimeout(() => navigate('/plates'), 1500);
//       } else {
//         const newDocRef = doc(collection(db, 'license_plates'));
        
//         await setDoc(newDocRef, {
//           licensePlate: normalizedPlate,
//           carModel: data.carModel,
//           ownerName: data.ownerName,
//           passNumber: data.passNumber,
//           organization: data.organization,
//           note: data.note,
//           normalizedName: normalizedName, // Зберігаємо для пошуку
//           issueDate: serverTimestamp(),
//           withdrawalDate: null,
//           createdAt: serverTimestamp(),
//           createdBy: currentUser.uid,
//           updatedAt: serverTimestamp(),
//           updatedBy: currentUser.uid,
//           id: newDocRef.id,
//           history: [
//             {
//               action: 'created',
//               timestamp: currentDate,
//               user: currentUser.uid
//             }
//           ]
//         });
        
//         setSuccess('Номер успішно додано');
//         setTimeout(() => navigate('/plates'), 1500);
//       }

//     } catch (error) {
//       console.error('Помилка збереження:', error);
//       setError('Помилка збереження даних: ' + error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Container maxWidth="md">
//       <Box sx={{ mt: 4, mb: 4 }}>
//         <Typography variant="h4" gutterBottom>
//           {isEditMode ? 'Редагування номерного знаку' : 'Додати новий номерний знак'}
//         </Typography>

//         {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
//         {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

//         <Alert severity="info" sx={{ mb: 3 }}>
//           Система автоматично запропонує вільний номер перепустки для обраної організації.
//           При введенні даних автоматично перевіряє наявність дублікатів.
//         </Alert>

//         <form onSubmit={handleSubmit(onSubmit)}>
//           <Box sx={{ display: 'grid', gap: 3 }}>
//             <Box>
//               <TextField
//                 label="Державний номер *"
//                 {...register('licensePlate', { 
//                   required: 'Обов\'язкове поле',
//                   validate: {
//                     format: (value) => validateLicensePlate(value)
//                   }
//                 })}
//                 error={!!errors.licensePlate}
//                 helperText={errors.licensePlate?.message || 'Наприклад: АА1234ББ, VIP001'}
//                 fullWidth
//                 placeholder="АА1234ББ"
//                 inputProps={{
//                   style: { textTransform: 'uppercase' }
//                 }}
//                 onChange={(e) => {
//                   e.target.value = e.target.value.toUpperCase();
//                 }}
//               />
//               {checkingDuplicates && (
//                 <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
//                   <CircularProgress size={16} />
//                   <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
//                     Перевірка на дублікати...
//                   </Typography>
//                 </Box>
//               )}
//             </Box>

//             <Box>
//               <TextField
//                 label="ПІБ Власника *"
//                 {...register('ownerName', { 
//                   required: 'Обов\'язкове поле',
//                   minLength: {
//                     value: 3,
//                     message: 'ПІБ повинно містити мінімум 3 символи'
//                   }
//                 })}
//                 error={!!errors.ownerName}
//                 helperText={errors.ownerName?.message}
//                 fullWidth
//               />
//             </Box>

//             {duplicateCheckResult && (
//               <Alert 
//                 severity={duplicateCheckResult.type}
//                 sx={{ mb: 2 }}
//                 onClose={() => setDuplicateCheckResult(null)}
//               >
//                 <Typography variant="body2" fontWeight="bold">
//                   {duplicateCheckResult.message}
//                 </Typography>
//                 {duplicateCheckResult.duplicates && duplicateCheckResult.duplicates.length > 0 && (
//                   <Box sx={{ mt: 1 }}>
//                     {duplicateCheckResult.duplicates.map((dup, index) => (
//                       <Typography key={index} variant="caption" component="div">
//                         • {dup.licensePlate} - {dup.ownerName} ({dup.organization})
//                       </Typography>
//                     ))}
//                   </Box>
//                 )}
//               </Alert>
//             )}

//             <Controller
//               name="organization"
//               control={control}
//               rules={{ required: 'Оберіть організацію' }}
//               render={({ field, fieldState }) => (
//                 <FormControl fullWidth error={!!fieldState.error}>
//                   <InputLabel>Організація *</InputLabel>
//                   <Select
//                     {...field}
//                     label="Організація *"
//                   >
//                     <MenuItem value="">
//                       <em>Не обрано</em>
//                     </MenuItem>
//                     {organizations.map((org) => (
//                       <MenuItem key={org.id} value={org.name}>
//                         {org.name}
//                       </MenuItem>
//                     ))}
//                   </Select>
//                   {fieldState.error && (
//                     <Typography color="error" variant="caption">
//                       {fieldState.error.message}
//                     </Typography>
//                   )}
//                 </FormControl>
//               )}
//             />

//             <Box>
//               <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
//                 № перепустки *
//               </Typography>
//               <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
//                 <TextField
//                   {...register('passNumber', { 
//                     required: 'Номер перепустки обов\'язковий',
//                     validate: {
//                       isNumber: (value) => !isNaN(value) || 'Має бути числом',
//                       isPositive: (value) => parseInt(value) > 0 || 'Має бути більше 0'
//                     }
//                   })}
//                   error={!!errors.passNumber}
//                   helperText={errors.passNumber?.message}
//                   fullWidth
//                   disabled={!watchOrganization}
//                   onChange={handleManualChange}
//                   value={watchPassNumber || ''}
//                   InputProps={{
//                     startAdornment: (
//                       <InputAdornment position="start">
//                         {watchPassNumber === autoPassNumber ? '✅' : '✏️'}
//                       </InputAdornment>
//                     )
//                   }}
//                 />
//                 {autoPassNumber && watchOrganization && (
//                   <Button
//                     variant="outlined"
//                     startIcon={<RefreshIcon />}
//                     onClick={handleRefreshPassNumber}
//                     disabled={loading || watchPassNumber === autoPassNumber}
//                     sx={{ height: '56px', minWidth: '100px' }}
//                   >
//                     Авто
//                   </Button>
//                 )}
//               </Box>
//               <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
//                 {watchOrganization 
//                   ? autoPassNumber 
//                     ? `Запропонований вільний номер: ${autoPassNumber}. ${watchPassNumber === autoPassNumber ? 'Використовується запропонований номер.' : 'Ви вручну змінили номер.'}`
//                     : 'Завантаження доступних номерів...'
//                   : 'Оберіть організацію для отримання вільного номера'
//                 }
//               </Typography>
//             </Box>

//             <TextField
//               label="Марка та модель авто"
//               {...register('carModel')}
//               fullWidth
//             />

//             <TextField
//               label="Примітка"
//               {...register('note')}
//               multiline
//               rows={3}
//               fullWidth
//             />

//             <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
//               <Button
//                 variant="outlined"
//                 onClick={() => navigate('/plates')}
//                 disabled={loading}
//               >
//                 Скасувати
//               </Button>
//               <Button
//                 type="submit"
//                 variant="contained"
//                 disabled={loading}
//               >
//                 {loading ? 'Збереження...' : (isEditMode ? 'Оновити' : 'Додати')}
//               </Button>
//             </Box>
//           </Box>
//         </form>
//       </Box>
//     </Container>
//   );
// }

// export default AddEditPlate;

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container, TextField, Button, Typography, Box,
  FormControl, InputLabel, Select, MenuItem, Alert,
  InputAdornment, IconButton, CircularProgress
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
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
  getDocs,
  orderBy,
  writeBatch
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
  const [availablePassNumbers, setAvailablePassNumbers] = useState([]);
  const [autoPassNumber, setAutoPassNumber] = useState('');
  const [duplicateCheckResult, setDuplicateCheckResult] = useState(null);
  const isEditMode = !!id;

  const { 
    register, 
    handleSubmit, 
    reset, 
    formState: { errors }, 
    control,
    setValue,
    watch,
    trigger,
    getValues
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

  useEffect(() => {
    if (watchOrganization) {
      fetchAvailablePassNumbers(watchOrganization);
    } else {
      setAvailablePassNumbers([]);
      setAutoPassNumber('');
    }
  }, [watchOrganization]);

  // Автоматична перевірка дублікатів при зміні номеру або ПІБ
  useEffect(() => {
    const checkForDuplicates = async () => {
      if ((watchLicensePlate && watchLicensePlate.length >= 2) || 
          (watchOwnerName && watchOwnerName.length >= 3)) {
        await performDuplicateCheck();
      } else {
        setDuplicateCheckResult(null);
      }
    };

    const timeoutId = setTimeout(checkForDuplicates, 500);
    return () => clearTimeout(timeoutId);
  }, [watchLicensePlate, watchOwnerName]);

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

  const fetchAvailablePassNumbers = async (organizationName) => {
    try {
      // Знаходимо всі номери перепусток для цієї організації
      const platesRef = collection(db, 'license_plates');
      const q = query(
        platesRef, 
        where('organization', '==', organizationName),
        orderBy('passNumber')
      );
      const querySnapshot = await getDocs(q);
      
      // Отримуємо всі використані номери
      const usedPassNumbers = new Set();
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.passNumber) {
          const num = parseInt(data.passNumber);
          if (!isNaN(num) && num > 0) {
            usedPassNumbers.add(num);
          }
        }
      });
      
      // Знаходимо перший вільний номер (від 1 до 1000)
      let freeNumber = 1;
      while (usedPassNumbers.has(freeNumber) && freeNumber <= 1000) {
        freeNumber++;
      }
      
      // Генеруємо список доступних номерів (перші 20 вільних)
      const availableNumbers = [];
      for (let i = 1; i <= 1000; i++) {
        if (!usedPassNumbers.has(i)) {
          availableNumbers.push(i);
          if (availableNumbers.length >= 20) break;
        }
      }
      
      setAvailablePassNumbers(availableNumbers);
      setAutoPassNumber(freeNumber.toString());
      
      // Автоматично встановлюємо вільний номер тільки при створенні нового запису
      if (!isEditMode && freeNumber > 0) {
        setValue('passNumber', freeNumber.toString(), { shouldValidate: true });
      }
    } catch (error) {
      console.error('Помилка завантаження номерів перепусток:', error);
      setAvailablePassNumbers([]);
      setAutoPassNumber('');
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
        
        if (data.organization) {
          fetchAvailablePassNumbers(data.organization);
        }
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

      // Створюємо запит тільки якщо є умови
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
          .filter(doc => !isEditMode || doc.id !== id) // Виключаємо поточний запис при редагуванні
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

  const handleManualChange = (e) => {
    setValue('passNumber', e.target.value, { shouldValidate: true });
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Перевірка валідації форми
      const isValid = await trigger();
      if (!isValid) {
        setError('Будь ласка, заповніть всі обов\'язкові поля правильно');
        setLoading(false);
        return;
      }

      const normalizedPlate = normalizeLicensePlate(data.licensePlate);
      const normalizedName = normalizeName(data.ownerName);
      
      // Перевірка дублікатів перед збереженням
      const platesRef = collection(db, 'license_plates');
      const plateQuery = query(platesRef, where('licensePlate', '==', normalizedPlate));
      const plateSnapshot = await getDocs(plateQuery);
      
      if (!isEditMode && !plateSnapshot.empty) {
        setError('Номерний знак вже існує в базі');
        setLoading(false);
        return;
      }

      // Перевірка при редагуванні (не дозволяємо змінити на існуючий номер)
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
      const passNumberQuery = query(
        platesRef, 
        where('organization', '==', data.organization),
        where('passNumber', '==', data.passNumber)
      );
      const passNumberSnapshot = await getDocs(passNumberQuery);
      
      const isPassNumberTaken = passNumberSnapshot.docs.some(doc => {
        if (isEditMode) {
          return doc.id !== id; // При редагуванні ігноруємо поточний запис
        }
        return true;
      });

      if (isPassNumberTaken) {
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
          normalizedName: normalizedName, // Зберігаємо для пошуку
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

  // Функція для обробки зміни значення полів
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
              {/* Державний номер - використовуємо Controller для кращого контролю */}
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
              {/* ПІБ Власника - використовуємо Controller */}
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
                    <MenuItem value="">
                      <em>Не обрано</em>
                    </MenuItem>
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
                      isPositive: (value) => parseInt(value) > 0 || 'Має бути більше 0'
                    }
                  }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      fullWidth
                      disabled={!watchOrganization}
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
                            {field.value === autoPassNumber ? '✅' : '✏️'}
                          </InputAdornment>
                        ),
                        readOnly: false
                      }}
                    />
                  )}
                />
                {autoPassNumber && watchOrganization && (
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
                  ? autoPassNumber 
                    ? `Запропонований вільний номер: ${autoPassNumber}. ${watchPassNumber === autoPassNumber ? 'Використовується запропонований номер.' : 'Ви вручну змінили номер.'}`
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
                disabled={loading}
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