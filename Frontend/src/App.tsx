import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Attendance from './pages/Attendance';
import Alerts from './pages/Alerts';
import Analytics from './pages/Analytics';
import CenterDetail from './pages/CenterDetail';
import './i18n';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Navigate to='/dashboard' replace/>}/>
        <Route element={<AppShell/>}>
          <Route path='/dashboard' element={<Dashboard/>}/>
          <Route path='/inventory' element={<Inventory/>}/>
          <Route path='/attendance' element={<Attendance/>}/>
          <Route path='/alerts' element={<Alerts/>}/>
          <Route path='/analytics' element={<Analytics/>}/>
          <Route path='/centers/:id' element={<CenterDetail/>}/>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
export default App;

