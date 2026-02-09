// import React from 'react';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import { AuthProvider } from './contexts/AuthContext';
// import PrivateRoute from './components/PrivateRoute';
// import Login from './pages/Login';
// import Dashboard from './pages/Dashboard';
// import PlatesList from './pages/PlatesList';
// import AddEditPlate from './pages/AddEditPlate';
// import ImportExport from './pages/ImportExport';
// import './App.css';

// function App() {
//   return (
//     <Router>
//       <AuthProvider>
//         <div className="App">
//           <Routes>
//             <Route path="/login" element={<Login />} />
//             <Route path="/" element={
//               <PrivateRoute>
//                 <Dashboard />
//               </PrivateRoute>
//             } />
//             <Route path="/plates" element={
//               <PrivateRoute>
//                 <PlatesList />
//               </PrivateRoute>
//             } />
//             <Route path="/plates/add" element={
//               <PrivateRoute>
//                 <AddEditPlate />
//               </PrivateRoute>
//             } />
//             <Route path="/plates/edit/:id" element={
//               <PrivateRoute>
//                 <AddEditPlate />
//               </PrivateRoute>
//             } />
//             <Route path="/import-export" element={
//               <PrivateRoute>
//                 <ImportExport />
//               </PrivateRoute>
//             } />
//           </Routes>
//         </div>
//       </AuthProvider>
//     </Router>
//   );
// }

// export default App;
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PlatesList from './pages/PlatesList';
import AddEditPlate from './pages/AddEditPlate';
import ImportExport from './pages/ImportExport';
import Home from './pages/Home';
import Organizations from './pages/Organizations';
import './App.css';


function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <PrivateRoute>
                <Navbar />
                <Dashboard />
              </PrivateRoute>
            } />
            {/* <Route path="/" element={
              <PrivateRoute>
                <Navbar />
                <Home />
              </PrivateRoute>
            } /> */}
            <Route path="/organizations" element={
              <PrivateRoute>
                <Navbar />
                <Organizations />
              </PrivateRoute>
            } />
            <Route path="/dashboard" element={
              <PrivateRoute>
                <Navbar />
                <Dashboard />
              </PrivateRoute>
            } />
            <Route path="/plates" element={
              <PrivateRoute>
                <Navbar />
                <PlatesList />
              </PrivateRoute>
            } />
            <Route path="/plates/add" element={
              <PrivateRoute>
                <Navbar />
                <AddEditPlate />
              </PrivateRoute>
            } />
            <Route path="/plates/edit/:id" element={
              <PrivateRoute>
                <Navbar />
                <AddEditPlate />
              </PrivateRoute>
            } />
            <Route path="/import-export" element={
              <PrivateRoute>
                <Navbar />
                <ImportExport />
              </PrivateRoute>
            } />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;