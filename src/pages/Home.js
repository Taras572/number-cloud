import React from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Grid,
  Button,
  Typography,
  Box,
  Paper
} from '@mui/material';
import {
  Add,
  List,
  CloudUpload,
  Dashboard as DashboardIcon
} from '@mui/icons-material';

function Home() {
  return (
    <Container maxWidth="md" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom>
          Система управління номерними знаками
        </Typography>
        
        <Typography variant="h6" color="textSecondary" paragraph>
          Оберіть дію для початку роботи
        </Typography>

        <Grid container spacing={3} sx={{ mt: 4 }}>
          <Grid item xs={12} sm={6}>
            <Button
              component={Link}
              to="/plates/add"
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              startIcon={<Add />}
              sx={{ py: 2 }}
            >
              Додати нове авто
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Button
              component={Link}
              to="/plates"
              variant="contained"
              color="secondary"
              size="large"
              fullWidth
              startIcon={<List />}
              sx={{ py: 2 }}
            >
              Переглянути список
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Button
              component={Link}
              to="/import-export"
              variant="contained"
              color="success"
              size="large"
              fullWidth
              startIcon={<CloudUpload />}
              sx={{ py: 2 }}
            >
              Імпорт/Експорт
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Button
              component={Link}
              to="/"
              variant="outlined"
              color="info"
              size="large"
              fullWidth
              startIcon={<DashboardIcon />}
              sx={{ py: 2 }}
            >
              Статистика
            </Button>
          </Grid>
        </Grid>

        <Box sx={{ mt: 6, pt: 3, borderTop: '1px solid #eee' }}>
          <Typography variant="body2" color="textSecondary">
            Система дозволяє управляти базою даних номерних знаків, додавати, редагувати,
            видаляти записи, здійснювати пошук та імпорт/експорт даних.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

export default Home;