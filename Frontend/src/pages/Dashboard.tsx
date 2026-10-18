import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KpiCard } from '../components/ui/KpiCard';
import { api } from '../lib/api';
import type { Alert, Center } from '../types/domain';
import { Building, AlertTriangle, BedDouble, UserCheck, FlaskConical } from 'lucide-react';

export default function Dashboard() {
  const { t } = useTranslation();
  const [centers, setCenters] = useState<Center[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [flags, setFlags] = useState<Array<{centerId:string; medicineId:string; severity:string}>>([]);
  useEffect(() => {
    api.get<Center[]>('/api/centers').then(setCenters);
    api.get<Alert[]>('/api/alerts?status=open').then(setAlerts);
    api.get<Array<{centerId:string; medicineId:string; severity:string}>>('/api/ai/warnings').then(setFlags);
  }, []);
  return (
    <div className='space-y-6'>
      <h1 className='text-2xl md:text-3xl font-semibold'>{t('common.dashboard')}</h1>
      <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'>
        <KpiCard title={t('dashboard.kpiCenters')} value={centers.length} icon={<Building size={20}/>} />
        <KpiCard title={t('dashboard.kpiStockRisk')} value={flags.length} icon={<AlertTriangle size={20}/>} />
        <KpiCard title={t('dashboard.kpiBedOccupancy')} value={'0%'} icon={<BedDouble size={20}/>} />
        <KpiCard title={t('dashboard.kpiAttendance')} value={'0%'} icon={<UserCheck size={20}/>} />
        <KpiCard title={t('dashboard.kpiTestAvail')} value={'0%'} icon={<FlaskConical size={20}/>} />
      </div>
      <div className='grid gap-4 grid-cols-1 lg:grid-cols-2'>
        <div className='rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4'>
          <h2 className='font-medium mb-2'>{t('dashboard.alerts')}</h2>
          <ul className='space-y-2 text-sm'>
            {alerts.map(a => <li key={a.id} className='flex justify-between'>{a.message} <span>{a.severity}</span></li>)}
          </ul>
        </div>
        <div className='rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4'>
          <h2 className='font-medium mb-2'>{t('dashboard.aiFlags')}</h2>
          <ul className='space-y-2 text-sm'>
            {flags.map((f,i)=> <li key={i}>{f.centerId}:{f.medicineId} - {f.severity}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}

