
// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import {
//   Container, Grid, Paper, Typography, Box,
//   Card, CardContent, LinearProgress, Button
// } from '@mui/material';
// import {
//   DirectionsCar,
//   Business,
//   Person,
//   AccessTime,
//   Add,
//   List,
//   CloudUpload
// } from '@mui/icons-material';
// import { collection, getDocs } from 'firebase/firestore';
// import { db } from '../firebase';

// function Dashboard() {
//   const [stats, setStats] = useState({
//     total: 0,
//     active: 0,
//     withdrawn: 0,
//     organizations: new Set(),
//     lastUpdated: null
//   });
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchStats();
//   }, []);

//   const fetchStats = async () => {
//     try {
//       const platesRef = collection(db, 'license_plates');
//       const querySnapshot = await getDocs(platesRef);
      
//       const plates = querySnapshot.docs.map(doc => doc.data());
//       const organizations = new Set(plates.map(p => p.organization).filter(Boolean));
//       const active = plates.filter(p => !p.withdrawalDate).length;
//       const withdrawn = plates.filter(p => p.withdrawalDate).length;
      
//       setStats({
//         total: plates.length,
//         active,
//         withdrawn,
//         organizations: organizations.size,
//         lastUpdated: new Date().toLocaleString()
//       });
//     } catch (error) {
//       console.error('Помилка завантаження статистики:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) {
//     return <LinearProgress />;
//   }

//   const StatCard = ({ icon: Icon, title, value, color }) => (
//     <Card>
//       <CardContent>
//         <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
//           <Icon sx={{ color, fontSize: 40, mr: 2 }} />
//           <Box>
//             <Typography color="textSecondary" gutterBottom variant="h6">
//               {title}
//             </Typography>
//             <Typography variant="h4">
//               {value}
//             </Typography>
//           </Box>
//         </Box>
//       </CardContent>
//     </Card>
//   );

//   const QuickAction = ({ icon: Icon, title, description, to, color }) => (
//     <Card sx={{ height: '100%', cursor: 'pointer' }} component={Link} to={to} style={{ textDecoration: 'none' }}>
//       <CardContent>
//         <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
//           <Icon sx={{ color, fontSize: 40, mr: 2 }} />
//           <Box>
//             <Typography variant="h6" gutterBottom>
//               {title}
//             </Typography>
//             <Typography variant="body2" color="textSecondary">
//               {description}
//             </Typography>
//           </Box>
//         </Box>
//       </CardContent>
//     </Card>
//   );

//   return (
//     <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
//       <Typography variant="h4" gutterBottom>
//         Панель управління
//       </Typography>

//       <Grid container spacing={3}>
//         <Grid item xs={12} sm={6} md={3}>
//           <StatCard
//             icon={DirectionsCar}
//             title="Всього номерів"
//             value={stats.total}
//             color="#1976d2"
//           />
//         </Grid>
        
//         <Grid item xs={12} sm={6} md={3}>
//           <StatCard
//             icon={AccessTime}
//             title="Активні"
//             value={stats.active}
//             color="#4caf50"
//           />
//         </Grid>
        
//         <Grid item xs={12} sm={6} md={3}>
//           <StatCard
//             icon={Person}
//             title="Вилучені"
//             value={stats.withdrawn}
//             color="#f44336"
//           />
//         </Grid>
        
//         <Grid item xs={12} sm={6} md={3}>
//           <StatCard
//             icon={Business}
//             title="Організацій"
//             value={stats.organizations}
//             color="#ff9800"
//           />
//         </Grid>

//         {/* Швидкі дії */}
//         <Grid item xs={12}>
//           <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
//             Швидкі дії
//           </Typography>
//         </Grid>

//         <Grid item xs={12} sm={6} md={4}>
//           <QuickAction
//             icon={Add}
//             title="Додати авто"
//             description="Додати новий номерний знак"
//             to="/plates/add"
//             color="#1976d2"
//           />
//         </Grid>

//         <Grid item xs={12} sm={6} md={4}>
//           <QuickAction
//             icon={List}
//             title="Переглянути список"
//             description="Всі номерні знаки"
//             to="/plates"
//             color="#4caf50"
//           />
//         </Grid>

//         <Grid item xs={12} sm={6} md={4}>
//           <QuickAction
//             icon={CloudUpload}
//             title="Імпорт/Експорт"
//             description="Завантажити або вивантажити дані"
//             to="/import-export"
//             color="#ff9800"
//           />
//         </Grid>

//         <Grid item xs={12}>
//           <Paper sx={{ p: 2, mt: 2 }}>
//             <Typography variant="h6" gutterBottom>
//               Останнє оновлення
//             </Typography>
//             <Typography variant="body1">
//               {stats.lastUpdated}
//             </Typography>
//           </Paper>
//         </Grid>
//       </Grid>
//     </Container>
//   );
// }

// export default Dashboard;
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container, Grid, Paper, Typography, Box,
  Card, CardContent, LinearProgress, Button, Alert
} from '@mui/material';
import {
  DirectionsCar,
  Business,
  Person,
  AccessTime,
  Add,
  List,
  CloudUpload,
  Refresh,
  VpnKey,
  Groups
} from '@mui/icons-material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

function Dashboard() {
  const [stats, setStats] = useState({
    totalPlates: 0,
    active: 0,
    withdrawn: 0,
    organizations: 0, // Тепер це кількість організацій з колекції organizations
    totalPassNumbers: 0,
    lastUpdated: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    fetchStats();
  }, [retryCount]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Отримуємо дані з ДВОХ колекцій
      const [platesSnapshot, organizationsSnapshot] = await Promise.all([
        getDocs(collection(db, 'license_plates')),
        getDocs(collection(db, 'organizations'))
      ]);
      
      // Обробляємо номерні знаки
      const plates = platesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const active = plates.filter(p => !p.withdrawalDate).length;
      const withdrawn = plates.filter(p => p.withdrawalDate).length;
      
      // Унікальні номери перепусток
      const totalPassNumbers = new Set(
        plates
          .filter(p => p.passNumber && p.organization)
          .map(p => `${p.organization}_${p.passNumber}`)
      ).size;
      
      // Отримуємо кількість організацій з колекції organizations
      const organizationsCount = organizationsSnapshot.size;
      
      setStats({
        totalPlates: plates.length,
        active,
        withdrawn,
        organizations: organizationsCount, // Тепер це реальна кількість організацій
        totalPassNumbers,
        lastUpdated: new Date().toLocaleString('uk-UA')
      });
      
    } catch (error) {
      console.error('Помилка завантаження статистики:', error);
      
      if (error.code === 'permission-denied') {
        setError('Недостатньо прав доступу. Перевірте правила Firestore.');
      } else if (error.code === 'failed-precondition') {
        setError('Firestore не ініціалізовано. Перевірте конфігурацію Firebase.');
      } else {
        setError(`Помилка завантаження: ${error.message}`);
      }
      
      // Встановлюємо нульову статистику при помилці
      setStats({
        totalPlates: 0,
        active: 0,
        withdrawn: 0,
        organizations: 0,
        totalPassNumbers: 0,
        lastUpdated: new Date().toLocaleString('uk-UA')
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color, description, link }) => (
    <Card 
      sx={{ 
        height: '100%',
        cursor: link ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': link ? {
          transform: 'translateY(-4px)',
          boxShadow: 6
        } : {}
      }}
      component={link ? Link : 'div'}
      to={link}
      style={{ textDecoration: 'none' }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Icon sx={{ color, fontSize: 40, mr: 2 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography color="textSecondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              {value}
            </Typography>
            {description && (
              <Typography variant="caption" color="textSecondary">
                {description}
              </Typography>
            )}
          </Box>
        </Box>
        {link && (
          <Typography variant="caption" color="primary" sx={{ display: 'block', textAlign: 'right' }}>
            Перейти →
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  const QuickAction = ({ icon: Icon, title, description, to, color }) => (
    <Card 
      sx={{ 
        height: '100%', 
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6
        }
      }} 
      component={Link} 
      to={to} 
      style={{ textDecoration: 'none' }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Icon sx={{ color, fontSize: 40, mr: 2 }} />
          <Box>
            <Typography variant="h6" gutterBottom>
              {title}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {description}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <LinearProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Завантаження статистики...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Панель управління
        </Typography>
        <Button
          startIcon={<Refresh />}
          onClick={() => setRetryCount(retryCount + 1)}
          variant="outlined"
          size="small"
        >
          Оновити
        </Button>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => setRetryCount(retryCount + 1)}>
              Спробувати знову
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Картка 1: Всього номерів */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={DirectionsCar}
            title="Всього номерів"
            value={stats.totalPlates}
            color="#1976d2"
            description={`Активні: ${stats.active}, Вилучені: ${stats.withdrawn}`}
            link="/plates"
          />
        </Grid>
        
        {/* Картка 2: Активні */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={AccessTime}
            title="Активні"
            value={stats.active}
            color="#4caf50"
            description={`${Math.round((stats.active / stats.totalPlates) * 100) || 0}% від загальної кількості`}
          />
        </Grid>
        
        {/* Картка 3: Вилучені */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={Person}
            title="Вилучені"
            value={stats.withdrawn}
            color="#f44336"
            description={`${Math.round((stats.withdrawn / stats.totalPlates) * 100) || 0}% від загальної кількості`}
          />
        </Grid>
        
        {/* Картка 4: Організації (тепер з колекції organizations) */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={Business}
            title="Організації"
            value={stats.organizations}
            color="#ff9800"
            description="Загальна кількість організацій"
            link="/organizations"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <QuickAction
            icon={Add}
            title="Додати авто"
            description="Додати новий номерний знак"
            to="/plates/add"
            color="#1976d2"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <QuickAction
            icon={List}
            title="Переглянути список"
            description="Всі номерні знаки"
            to="/plates"
            color="#4caf50"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <QuickAction
            icon={Business}
            title="Керування організаціями"
            description="Додати/редагувати організації"
            to="/organizations"
            color="#ff9800"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <QuickAction
            icon={CloudUpload}
            title="Імпорт/Експорт"
            description="Завантажити або вивантажити дані"
            to="/import-export"
            color="#9c27b0"
          />
        </Grid>

        {/* Статистика */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Статистика
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" color="textSecondary">
                  Загальна кількість записів:
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {stats.totalPlates}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" color="textSecondary">
                  Кількість організацій:
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {stats.organizations}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" color="textSecondary">
                  Останнє оновлення:
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {stats.lastUpdated}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Dashboard;