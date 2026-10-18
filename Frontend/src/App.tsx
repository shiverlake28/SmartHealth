import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { ErrorBoundary } from './components/ErrorBoundary';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Attendance from './pages/Attendance';
import Alerts from './pages/Alerts';
import Analytics from './pages/Analytics';
import Centers from './pages/Centers';
import CenterDetail from './pages/CenterDetail';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import './i18n';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home/>}/>
          <Route path='/login' element={<Login/>}/>
          <Route path='/register' element={<Register/>}/>
          <Route element={<AppShell/>}>
            <Route path='/dashboard' element={<Dashboard/>}/>
            <Route path='/inventory' element={<Inventory/>}/>
            <Route path='/attendance' element={<Attendance/>}/>
            <Route path='/alerts' element={<Alerts/>}/>
            <Route path='/analytics' element={<Analytics/>}/>
            <Route path='/centers' element={<Centers/>}/>
            <Route path='/centers/:id' element={<CenterDetail/>}/>
          </Route>
          <Route path='*' element={<Navigate to='/' replace/>}/>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
export default App;
