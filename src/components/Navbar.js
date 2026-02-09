import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useAuth } from '../contexts/AuthContext';

function Navbar({ onSearch }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Помилка виходу:', error);
    }
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Система номерних знаків
        </Typography>

        <TextField
          size="small"
          placeholder="Пошук..."
          onChange={(e) => onSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mr: 2, backgroundColor: 'white', borderRadius: 1 }}
        />

        <Button color="inherit" component={Link} to="/">Головна</Button>
        <Button color="inherit" component={Link} to="/plates">Список</Button>
        {/* <Button color="inherit" component={Link} to="/plates/add">Додати</Button> */}
        <Button color="inherit" component={Link} to="/import-export">Імпорт/Експорт</Button>
        <Button color="inherit" component={Link} to="/organizations">Організації</Button>

        {currentUser && (
          <>
            <Typography sx={{ mr: 2 }}>{currentUser.email}</Typography>
            <Button color="inherit" onClick={handleLogout}>Вихід</Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;