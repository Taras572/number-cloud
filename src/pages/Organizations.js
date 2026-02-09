import React, { useState, useEffect } from 'react';
import {
  Container, Paper, Typography, Box, Button,
  TextField, Alert, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { db } from '../firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  serverTimestamp 
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

function Organizations() {
  const [organizations, setOrganizations] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contactPerson: '',
    phone: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const orgsRef = collection(db, 'organizations');
      const querySnapshot = await getDocs(orgsRef);
      
      const orgsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => a.name.localeCompare(b.name));
      
      setOrganizations(orgsData);
    } catch (error) {
      console.error('Помилка завантаження організацій:', error);
      setError('Помилка завантаження організацій');
    }
  };

  const handleOpenDialog = (org = null) => {
    if (org) {
      setEditingOrg(org);
      setFormData({
        name: org.name || '',
        description: org.description || '',
        contactPerson: org.contactPerson || '',
        phone: org.phone || '',
        email: org.email || ''
      });
    } else {
      setEditingOrg(null);
      setFormData({
        name: '',
        description: '',
        contactPerson: '',
        phone: '',
        email: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingOrg(null);
    setError('');
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Назва організації обов\'язкова');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const orgData = {
        ...formData,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid
      };

      if (editingOrg) {
        // Оновлення
        const docRef = doc(db, 'organizations', editingOrg.id);
        await updateDoc(docRef, orgData);
        setSuccess('Організацію оновлено');
      } else {
        // Додавання
        orgData.createdAt = serverTimestamp();
        orgData.createdBy = currentUser.uid;
        await addDoc(collection(db, 'organizations'), orgData);
        setSuccess('Організацію додано');
      }

      handleCloseDialog();
      fetchOrganizations();
      
      // Автоматично закрити сповіщення через 3 секунди
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Помилка збереження:', error);
      setError('Помилка збереження: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Видалити організацію "${name}"?`)) return;

    try {
      await deleteDoc(doc(db, 'organizations', id));
      setSuccess(`Організацію "${name}" видалено`);
      fetchOrganizations();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Помилка видалення:', error);
      setError('Помилка видалення: ' + error.message);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Організації</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Додати організацію
        </Button>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Назва</TableCell>
              <TableCell>Контактна особа</TableCell>
              <TableCell>Телефон</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Опис</TableCell>
              <TableCell align="center">Дії</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {organizations.map((org) => (
              <TableRow key={org.id}>
                <TableCell>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {org.name}
                  </Typography>
                </TableCell>
                <TableCell>{org.contactPerson}</TableCell>
                <TableCell>{org.phone}</TableCell>
                <TableCell>{org.email}</TableCell>
                <TableCell>
                  <Typography variant="body2" color="textSecondary">
                    {org.description && org.description.length > 50 
                      ? `${org.description.substring(0, 50)}...` 
                      : org.description}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenDialog(org)}
                    title="Редагувати"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(org.id, org.name)}
                    title="Видалити"
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingOrg ? 'Редагувати організацію' : 'Додати нову організацію'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {error && <Alert severity="error">{error}</Alert>}
            
            <TextField
              label="Назва організації *"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              fullWidth
              required
            />
            
            <TextField
              label="Контактна особа"
              value={formData.contactPerson}
              onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
              fullWidth
            />
            
            <TextField
              label="Телефон"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              fullWidth
            />
            
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              fullWidth
            />
            
            <TextField
              label="Опис"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Скасувати
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading || !formData.name.trim()}
          >
            {loading ? 'Збереження...' : (editingOrg ? 'Оновити' : 'Додати')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Organizations;