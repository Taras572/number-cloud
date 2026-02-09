# License Plate Management System - AI Coding Agent Guide

## Architecture Overview

This is a **React + Firebase** web application for managing license plate records in Ukrainian. The system is built with:
- **Frontend**: React 19 with Material-UI (MUI) components
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Routing**: React Router v7 with private route protection
- **Forms**: React Hook Form for form state management
- **Data Exchange**: XLSX for import/export functionality

### Key Data Flow
1. **Authentication**: Firebase Auth → `AuthContext` provider wraps entire app
2. **Protected Routes**: `PrivateRoute` component checks `useAuth()` before rendering pages
3. **Data Operations**: All CRUD operations use Firestore collection `license_plates`
4. **State Management**: Local React state + Firebase listeners (no Redux/Zustand)

### Core Collections
- **`license_plates`**: Main entity with fields: `licensePlate`, `carModel`, `ownerName`, `organization`, `passNumber`, `issueDate`, `withdrawalDate`, `note`, `createdAt`, `history`

## Project Structure

```
src/
├── pages/           # Route pages (Login, Dashboard, PlatesList, AddEditPlate, ImportExport)
├── components/      # Reusable components (Navbar, PrivateRoute)
├── contexts/        # AuthContext for auth state
└── firebase.js      # Firebase config and service exports
```

## Critical Patterns & Conventions

### Authentication & Authorization
- Use `useAuth()` hook from `AuthContext` to access `currentUser`
- Always wrap pages requiring authentication with `<PrivateRoute>` in `App.js`
- Firebase config is in `src/firebase.js` - exports `auth`, `db`, `storage`

### Form Handling (see `AddEditPlate.js`)
- Use `react-hook-form` with `useForm()` hook
- Pattern: `const { register, handleSubmit, reset, formState: { errors } } = useForm()`
- Firestore timestamps: Use `serverTimestamp()` for server-side timestamps
- Edit vs Create: Detect with `const isEditMode = !!id` from URL params

### Data Querying (see `PlatesList.js`)
- Use Firestore queries: `query()`, `getDocs()`, `orderBy()`, `where()`
- Transform results: Map docs with `doc.id` + `doc.data()`
- Always include `.toLocaleDateString()` for date display

### State Management Pattern
- Local component state for UI (search, filters, dialogs)
- Firestore listeners for data persistence
- Show feedback with Snackbar: `showSnackbar(message, severity)` helper
- Dialog confirmations for destructive actions (delete)

### Import/Export Workflow (see `ImportExport.js`)
- Excel parsing: Use `XLSX` library to read workbook sheets
- Column mapping: Ukrainian column names map to data fields
- Batch operations: Use `Promise.all()` with `addDoc()` for bulk imports
- History tracking: Include `history` array with action timestamps

### UI Components (MUI-based)
- All components from `@mui/material` and `@mui/icons-material`
- Standard patterns: `TableContainer`, `Dialog`, `Snackbar`, `Alert`
- Icons: `Edit`, `Delete`, `Search` from MUI Icons
- Form controls: `TextField`, `Select`, `MenuItem`, `FormControl`

## Common Development Tasks

### Add New License Plate Field
1. Add to Firestore schema in `AddEditPlate.js` defaultValues
2. Add form input with `register()` call
3. Update table columns in `PlatesList.js` and `ImportExport.js`
4. If queryable, consider adding to `filterPlates()` logic

### Add New Route/Page
1. Create page component in `src/pages/`
2. Add route in `App.js` with `<PrivateRoute>` wrapper
3. Add navigation link in `Navbar.js`

### Error Handling Pattern
```javascript
try {
  // operation
  showSnackbar('Success message', 'success');
} catch (error) {
  console.error('Error context:', error);
  showSnackbar('Error message', 'error');
}
```

### Date Handling
- Store as ISO string: `new Date(dateValue).toISOString()`
- Display: `new Date(isoString).toLocaleDateString()`
- Firestore: Use `serverTimestamp()` for automated timestamps

## Specific File Patterns

- **`src/pages/*.js`**: Follow existing pattern with navbar, layout div (padding: 20px), and content
- **Forms**: Always use `react-hook-form` with validation errors displayed inline
- **Dialogs**: Confirm destructive operations; use `plateToDelete?.licensePlate` pattern for safe access
- **Search/Filter**: Implement `.toLowerCase().includes()` for case-insensitive matching

## Commands

```bash
npm start      # Dev server on localhost:3000
npm test       # Jest test runner
npm run build  # Production build
```

## Notes on Ukrainian Content
- All UI text is in Ukrainian (Cyrillic characters)
- Date formats use Ukrainian locale
- Column headers in Excel exports are Ukrainian
- Error messages follow existing Ukrainian patterns
