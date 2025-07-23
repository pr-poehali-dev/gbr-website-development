import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';

type PlotStatus = 'active' | 'inactive' | 'emergency' | 'low_battery' | 'custom';
type PlotType = {
  id: number;
  address: string;
  phone: string;
  status: PlotStatus;
  battery: number;
  customStatus?: { name: string; color: string };
  history: { action: string; time: string }[];
};

type Employee = {
  id: number;
  name: string;
  rank: string;
};

type EmergencyCall = {
  id: number;
  plotId: number;
  type: 'emergency' | 'alarm';
  time: string;
  assignedEmployee?: number;
};

const Index = () => {
  const [activeTab, setActiveTab] = useState('main');
  const [selectedPlot, setSelectedPlot] = useState<number | null>(null);
  const [selectedPlots, setSelectedPlots] = useState<number[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [customStatuses, setCustomStatuses] = useState<{ name: string; color: string }[]>([]);
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('#3B82F6');
  const [employees, setEmployees] = useState<Employee[]>([
    { id: 1, name: 'Иванов И.И.', rank: 'майор' },
    { id: 2, name: 'Петров П.П.', rank: 'капитан' },
    { id: 3, name: 'Сидоров С.С.', rank: 'лейтенант' }
  ]);
  const [newEmployee, setNewEmployee] = useState({ name: '', rank: 'рядовой' });
  const [emergencyCalls, setEmergencyCalls] = useState<EmergencyCall[]>([]);
  const [newPlot, setNewPlot] = useState({ address: '', phone: '' });
  const [managingCall, setManagingCall] = useState<number | null>(null);
  
  // Звуковые уведомления
  const playAlarmSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.3);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    } catch (error) {
      console.log('Звук недоступен');
    }
  };
  
  // Создаем начальные участки (425 штук)
  const [plots, setPlots] = useState<PlotType[]>(() => {
    const initialPlots: PlotType[] = [];
    for (let i = 1; i <= 425; i++) {
      initialPlots.push({
        id: i,
        address: `ул. Охранная, ${i}`,
        phone: `+7${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
        status: Math.random() > 0.5 ? 'active' : 'inactive',
        battery: Math.floor(Math.random() * 100),
        history: [
          { action: 'Создан участок', time: '24.07.2025, 08:00:00' }
        ]
      });
    }
    return initialPlots;
  });

  // Автоматическое срабатывание сигнализации каждые 10 минут
  useEffect(() => {
    const interval = setInterval(() => {
      const activePlots = plots.filter(p => p.status === 'active');
      if (activePlots.length > 0) {
        const randomPlot = activePlots[Math.floor(Math.random() * activePlots.length)];
        triggerAlarm(randomPlot.id);
      }
    }, 600000); // 10 минут

    return () => clearInterval(interval);
  }, [plots]);

  // Разрядка батарей
  useEffect(() => {
    const interval = setInterval(() => {
      setPlots(prevPlots => 
        prevPlots.map(plot => {
          const newBattery = Math.max(0, plot.battery - Math.floor(Math.random() * 3));
          let newStatus = plot.status;
          
          if (newBattery <= 20 && plot.status !== 'emergency') {
            newStatus = 'low_battery';
          }
          
          return {
            ...plot,
            battery: newBattery,
            status: newStatus
          };
        })
      );
    }, 300000); // 5 минут

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: PlotStatus, customStatus?: { name: string; color: string }) => {
    if (status === 'custom' && customStatus) return customStatus.color;
    switch (status) {
      case 'active': return '#10B981'; // зеленый
      case 'inactive': return '#3B82F6'; // синий  
      case 'emergency': return '#EF4444'; // красный
      case 'low_battery': return '#F59E0B'; // оранжевый
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: PlotStatus, customStatus?: { name: string; color: string }) => {
    if (status === 'custom' && customStatus) return customStatus.name;
    switch (status) {
      case 'active': return 'Под охраной';
      case 'inactive': return 'Не охраняется';
      case 'emergency': return 'Выезд ГБР';
      case 'low_battery': return 'Разряжено';
      default: return 'Неизвестно';
    }
  };

  const togglePlotStatus = (plotId: number) => {
    setPlots(prevPlots => 
      prevPlots.map(plot => {
        if (plot.id === plotId) {
          const newStatus = plot.status === 'active' ? 'inactive' : 'active';
          const action = newStatus === 'active' ? 'Поставлен на охрану' : 'Снят с охраны';
          return {
            ...plot,
            status: newStatus,
            history: [{ action, time: new Date().toLocaleString('ru-RU') }, ...plot.history]
          };
        }
        return plot;
      })
    );
  };

  const triggerEmergency = (plotId: number) => {
    playAlarmSound(); // Звуковое уведомление
    
    setPlots(prevPlots => 
      prevPlots.map(plot => {
        if (plot.id === plotId) {
          return {
            ...plot,
            status: 'emergency',
            history: [{ action: 'Экстренный вызов ГБР', time: new Date().toLocaleString('ru-RU') }, ...plot.history]
          };
        }
        return plot;
      })
    );
    
    setEmergencyCalls(prev => [{
      id: Date.now(),
      plotId,
      type: 'emergency',
      time: new Date().toLocaleString('ru-RU')
    }, ...prev]);
  };

  const triggerAlarm = (plotId: number) => {
    playAlarmSound(); // Звуковое уведомление
    
    setPlots(prevPlots => 
      prevPlots.map(plot => {
        if (plot.id === plotId) {
          return {
            ...plot,
            status: 'emergency',
            history: [{ action: 'Сработала сигнализация', time: new Date().toLocaleString('ru-RU') }, ...plot.history]
          };
        }
        return plot;
      })
    );
    
    setEmergencyCalls(prev => [{
      id: Date.now(),
      plotId,
      type: 'alarm',
      time: new Date().toLocaleString('ru-RU')
    }, ...prev]);
  };

  const chargeBattery = (plotId: number) => {
    setPlots(prevPlots => 
      prevPlots.map(plot => {
        if (plot.id === plotId) {
          return {
            ...plot,
            battery: 100,
            status: plot.status === 'low_battery' ? 'active' : plot.status,
            history: [{ action: 'Батарея заряжена', time: new Date().toLocaleString('ru-RU') }, ...plot.history]
          };
        }
        return plot;
      })
    );
  };

  const dischargeBattery = (plotId: number) => {
    setPlots(prevPlots => 
      prevPlots.map(plot => {
        if (plot.id === plotId) {
          return {
            ...plot,
            battery: Math.max(0, plot.battery - 50),
            history: [{ action: 'Батарея разряжена', time: new Date().toLocaleString('ru-RU') }, ...plot.history]
          };
        }
        return plot;
      })
    );
  };

  const assignEmployee = (callId: number, employeeId: number) => {
    setEmergencyCalls(prev => 
      prev.map(call => 
        call.id === callId ? { ...call, assignedEmployee: employeeId } : call
      )
    );
  };

  const endEmergency = (plotId: number) => {
    setPlots(prevPlots => 
      prevPlots.map(plot => {
        if (plot.id === plotId) {
          return {
            ...plot,
            status: 'active', // Возвращаем к обычному режиму
            history: [{ action: 'Конец тревоги', time: new Date().toLocaleString('ru-RU') }, ...plot.history]
          };
        }
        return plot;
      })
    );
    
    // Удаляем вызов из списка
    setEmergencyCalls(prev => prev.filter(call => call.plotId !== plotId));
    setManagingCall(null);
  };

  const addCustomStatus = () => {
    if (newStatusName.trim()) {
      setCustomStatuses(prev => [...prev, { name: newStatusName, color: newStatusColor }]);
      setNewStatusName('');
      setNewStatusColor('#3B82F6');
    }
  };

  const addEmployee = () => {
    if (newEmployee.name.trim()) {
      setEmployees(prev => [...prev, { 
        id: Date.now(), 
        name: newEmployee.name,
        rank: newEmployee.rank
      }]);
      setNewEmployee({ name: '', rank: 'рядовой' });
    }
  };

  const addPlot = () => {
    if (newPlot.address.trim() && newPlot.phone.trim()) {
      setPlots(prev => [...prev, {
        id: Math.max(...prev.map(p => p.id)) + 1,
        address: newPlot.address,
        phone: newPlot.phone,
        status: 'inactive',
        battery: 100,
        history: [{ action: 'Создан участок', time: new Date().toLocaleString('ru-RU') }]
      }]);
      setNewPlot({ address: '', phone: '' });
    }
  };

  const stats = {
    total: plots.length,
    active: plots.filter(p => p.status === 'active').length,
    emergency: plots.filter(p => p.status === 'emergency').length,
    custom: plots.filter(p => p.status === 'custom').length,
    inactive: plots.filter(p => p.status === 'inactive').length
  };

  // Сортировка: сначала экстренные, потом разряженные, потом остальные
  const sortedPlots = [...plots].sort((a, b) => {
    if (a.status === 'emergency' && b.status !== 'emergency') return -1;
    if (b.status === 'emergency' && a.status !== 'emergency') return 1;
    if (a.status === 'low_battery' && b.status !== 'low_battery') return -1;
    if (b.status === 'low_battery' && a.status !== 'low_battery') return 1;
    return a.id - b.id;
  });

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b ${
        theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon name="Shield" className="h-8 w-8 text-blue-500" />
            <h1 className="text-2xl font-bold">Система ГБР</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm opacity-70">24.07.2025, 00:24:22</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <Icon name={theme === 'dark' ? 'Sun' : 'Moon'} className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-6 grid grid-cols-5 gap-4">
        <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Всего участков</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Под охраной</div>
            <div className="text-2xl font-bold text-green-500">{stats.active}</div>
          </CardContent>
        </Card>
        <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Экстренные вызовы</div>
            <div className="text-2xl font-bold text-red-500">{stats.emergency}</div>
          </CardContent>
        </Card>
        <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Кастомные статусы</div>
            <div className="text-2xl font-bold text-purple-500">{stats.custom}</div>
          </CardContent>
        </Card>
        <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Не охраняется</div>
            <div className="text-2xl font-bold text-blue-500">{stats.inactive}</div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`grid w-full grid-cols-8 ${
            theme === 'dark' ? 'bg-slate-800' : ''
          }`}>
            <TabsTrigger value="main">Главная</TabsTrigger>
            <TabsTrigger value="plots">Участки</TabsTrigger>
            <TabsTrigger value="monitoring">Мониторинг</TabsTrigger>
            <TabsTrigger value="alarms">Сигнализация</TabsTrigger>
            <TabsTrigger value="reports">Отчеты</TabsTrigger>
            <TabsTrigger value="settings">Настройки</TabsTrigger>
            <TabsTrigger value="employees">Сотрудники</TabsTrigger>
            <TabsTrigger value="calls">Вызовы</TabsTrigger>
          </TabsList>

          {/* Main Tab */}
          <TabsContent value="main" className="mt-6">
            <div className="grid grid-cols-2 gap-6">
              <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Clock" className="h-5 w-5" />
                    Время реагирования ГБР
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Обработано</span>
                      <span className="text-2xl font-bold text-green-500">0</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Активных</span>
                      <span className="text-2xl font-bold text-red-500">{stats.emergency}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Ср. время (мин)</span>
                      <span className="text-2xl font-bold text-blue-500">0</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Activity" className="h-5 w-5" />
                    История вызовов
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {emergencyCalls.slice(0, 5).map(call => {
                      const plot = plots.find(p => p.id === call.plotId);
                      return (
                        <div key={call.id} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-slate-600">
                          <div>
                            <div className="font-medium">Участок {call.plotId}</div>
                            <div className="text-sm text-gray-500">{call.time}</div>
                          </div>
                          <Badge variant="outline" className="bg-red-500 text-white">
                            {call.type === 'emergency' ? 'Экстренный' : 'Сигнализация'}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Plots Tab */}
          <TabsContent value="plots" className="mt-6">
            <div className="grid grid-cols-2 gap-6">
              <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}>
                <CardHeader>
                  <CardTitle>Охранные участки ({plots.length})</CardTitle>
                  <p className="text-sm text-gray-500">Нажмите на участок для управления</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {sortedPlots.slice(0, 20).map(plot => (
                      <div 
                        key={plot.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedPlot === plot.id 
                            ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500'
                            : theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                        onClick={() => setSelectedPlot(plot.id)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">Участок {plot.id}</div>
                            <div className="text-sm text-gray-500">{plot.address}</div>
                          </div>
                          <div className="text-right">
                            <Badge 
                              style={{ backgroundColor: getStatusColor(plot.status, plot.customStatus) }}
                              className="text-white"
                            >
                              {getStatusText(plot.status, plot.customStatus)}
                            </Badge>
                            <div className="text-xs text-gray-500 mt-1">Батарея: {plot.battery}%</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}>
                <CardHeader>
                  <CardTitle>Выберите участок</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedPlot ? (
                    <div className="space-y-4">
                      {(() => {
                        const plot = plots.find(p => p.id === selectedPlot)!;
                        return (
                          <>
                            <div className="space-y-2">
                              <div><strong>Адрес:</strong> {plot.address}</div>
                              <div><strong>Телефон:</strong> {plot.phone}</div>
                              <div className="flex items-center gap-2">
                                <strong>Статус:</strong>
                                <Badge 
                                  style={{ backgroundColor: getStatusColor(plot.status, plot.customStatus) }}
                                  className="text-white"
                                >
                                  {getStatusText(plot.status, plot.customStatus)}
                                </Badge>
                              </div>
                              <div><strong>Батарея:</strong> {plot.battery}%</div>
                              <Progress value={plot.battery} className="w-full" />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <Button 
                                onClick={() => togglePlotStatus(plot.id)}
                                className={plot.status === 'active' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}
                              >
                                {plot.status === 'active' ? 'Снять с охраны' : 'Поставить на охрану'}
                              </Button>
                              
                              <Button 
                                onClick={() => triggerEmergency(plot.id)}
                                variant="destructive"
                              >
                                Экстренный вызов
                              </Button>
                              
                              <Button 
                                onClick={() => chargeBattery(plot.id)}
                                variant="outline"
                              >
                                Зарядить батарею
                              </Button>
                              
                              <Button 
                                onClick={() => dischargeBattery(plot.id)}
                                variant="outline"
                              >
                                Разрядить батарею
                              </Button>
                            </div>
                            
                            <div className="space-y-2">
                              <h4 className="font-medium">Кастомный статус:</h4>
                              <Select onValueChange={(value) => {
                                const status = customStatuses.find(s => s.name === value);
                                if (status) {
                                  setPlots(prev => prev.map(p => 
                                    p.id === plot.id 
                                      ? { ...p, status: 'custom', customStatus: status }
                                      : p
                                  ));
                                }
                              }}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Выберите статус" />
                                </SelectTrigger>
                                <SelectContent>
                                  {customStatuses.map(status => (
                                    <SelectItem key={status.name} value={status.name}>
                                      <div className="flex items-center gap-2">
                                        <div 
                                          className="w-3 h-3 rounded-full" 
                                          style={{ backgroundColor: status.color }}
                                        />
                                        {status.name}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </>
                        );
                      })()} 
                    </div>
                  ) : (
                    <p className="text-gray-500">Выберите участок из списка слева для управления</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring" className="mt-6">
            <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="BarChart3" className="h-5 w-5" />
                  Мониторинг времени вызова ГБР
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-500">0</div>
                    <div className="text-sm text-gray-500">Обработано</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-500">{stats.emergency}</div>
                    <div className="text-sm text-gray-500">Активных</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-500">0</div>
                    <div className="text-sm text-gray-500">Ср. время (мин)</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alarms Tab */}
          <TabsContent value="alarms" className="mt-6">
            <div className="grid grid-cols-2 gap-6">
              <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}>
                <CardHeader>
                  <CardTitle>Массовое управление участками</CardTitle>
                  <p className="text-sm text-gray-500">Выберите участки для группового управления (0 выбрано)</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => {
                          selectedPlots.forEach(id => {
                            setPlots(prev => prev.map(p => 
                              p.id === id ? { ...p, status: 'active' } : p
                            ));
                          });
                        }}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <Icon name="Shield" className="h-4 w-4 mr-2" />
                        Поставить на охрану (0)
                      </Button>
                      
                      <Button 
                        onClick={() => {
                          selectedPlots.forEach(id => {
                            setPlots(prev => prev.map(p => 
                              p.id === id ? { ...p, status: 'inactive' } : p
                            ));
                          });
                        }}
                        variant="outline"
                      >
                        <Icon name="ShieldOff" className="h-4 w-4 mr-2" />
                        Снять с охраны (0)
                      </Button>
                      
                      <Button 
                        onClick={() => {
                          selectedPlots.forEach(id => triggerEmergency(id));
                        }}
                        variant="destructive"
                      >
                        <Icon name="AlertTriangle" className="h-4 w-4 mr-2" />
                        ВЫЕЗД ГБР (0)
                      </Button>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        onClick={() => setSelectedPlots(plots.filter(p => p.status === 'active').map(p => p.id))}
                      >
                        Выбрать все активные
                      </Button>
                      
                      <Button 
                        variant="outline"
                        onClick={() => setSelectedPlots(plots.map(p => p.id))}
                      >
                        Выбрать всё
                      </Button>
                      
                      <Button 
                        variant="outline"
                        onClick={() => setSelectedPlots([])}
                      >
                        Очистить
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}>
                <CardHeader>
                  <CardTitle>Список участков</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {sortedPlots.slice(0, 15).map(plot => (
                      <div 
                        key={plot.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600' : 'bg-yellow-100 hover:bg-yellow-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox 
                            checked={selectedPlots.includes(plot.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedPlots(prev => [...prev, plot.id]);
                              } else {
                                setSelectedPlots(prev => prev.filter(id => id !== plot.id));
                              }
                            }}
                          />
                          <div className="flex-1">
                            <div className="font-medium">Участок {plot.id}</div>
                            <div className="text-sm text-gray-500">{plot.address}</div>
                          </div>
                          <Badge 
                            style={{ backgroundColor: getStatusColor(plot.status, plot.customStatus) }}
                            className="text-white"
                          >
                            {getStatusText(plot.status, plot.customStatus)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="mt-6">
            <div className="grid grid-cols-2 gap-6">
              <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}>
                <CardHeader>
                  <CardTitle>История участков</CardTitle>
                  <p className="text-sm text-gray-500">Выберите участок для просмотра истории</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {plots.slice(0, 10).map(plot => (
                      <div 
                        key={plot.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedPlot === plot.id 
                            ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500'
                            : theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                        onClick={() => setSelectedPlot(plot.id)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">Участок {plot.id}</div>
                            <div className="text-sm text-gray-500">{plot.address}</div>
                          </div>
                          <Badge 
                            style={{ backgroundColor: getStatusColor(plot.status, plot.customStatus) }}
                            className="text-white"
                          >
                            {getStatusText(plot.status, plot.customStatus)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {selectedPlot && (
                <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}>
                  <CardHeader>
                    <CardTitle>История Участок {selectedPlot}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const plot = plots.find(p => p.id === selectedPlot)!;
                      return (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><strong>Адрес:</strong> {plot.address}</div>
                            <div><strong>Телефон:</strong> {plot.phone}</div>
                            <div><strong>Статус договора:</strong> Активен</div>
                            <div><strong>Последнее обновление:</strong> 24.07.2025, 00:14:21</div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2">История пуска</h4>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {plot.history.map((event, index) => (
                                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-slate-600">
                                  <span className="text-sm">{event.action}</span>
                                  <span className="text-xs text-gray-500">{event.time}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()} 
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-6">
            <div className="grid grid-cols-2 gap-6">
              <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}>
                <CardHeader>
                  <CardTitle>Управление участками</CardTitle>
                  <p className="text-sm text-gray-500">Создание, изменение и управление договорами</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Добавить новый участок</h4>
                      <div className="space-y-2">
                        <div>
                          <Label>Адрес</Label>
                          <Input 
                            placeholder="Введите адрес"
                            value={newPlot.address}
                            onChange={(e) => setNewPlot(prev => ({ ...prev, address: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label>Номер телефона</Label>
                          <Input 
                            placeholder="+7XXXXXXXXXX"
                            value={newPlot.phone}
                            onChange={(e) => setNewPlot(prev => ({ ...prev, phone: e.target.value }))}
                          />
                        </div>
                        <Button onClick={addPlot} className="w-full">
                          <Icon name="Plus" className="h-4 w-4 mr-2" />
                          Создать участок
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Создать кастомный статус</h4>
                      <div className="space-y-2">
                        <div>
                          <Label>Название статуса</Label>
                          <Input 
                            placeholder="Например: Ремонт"
                            value={newStatusName}
                            onChange={(e) => setNewStatusName(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Цвет</Label>
                          <Input 
                            type="color"
                            value={newStatusColor}
                            onChange={(e) => setNewStatusColor(e.target.value)}
                          />
                        </div>
                        <Button onClick={addCustomStatus} className="w-full">
                          <Icon name="Palette" className="h-4 w-4 mr-2" />
                          Создать статус
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}>
                <CardHeader>
                  <CardTitle>Управление договорами</CardTitle>
                  <p className="text-sm text-gray-500">Выберите участок для управления договором</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Быстрый поиск участка</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите участок" />
                        </SelectTrigger>
                        <SelectContent>
                          {plots.slice(0, 20).map(plot => (
                            <SelectItem key={plot.id} value={plot.id.toString()}>
                              Участок {plot.id} - {plot.address}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="text-center text-gray-500">
                      Выберите участок во вкладке "Участки" для управления договором
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Employees Tab */}
          <TabsContent value="employees" className="mt-6">
            <div className="grid grid-cols-2 gap-6">
              <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}>
                <CardHeader>
                  <CardTitle>Список сотрудников</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {employees.map(employee => (
                      <div key={employee.id} className={`p-3 rounded-lg ${
                        theme === 'dark' ? 'bg-slate-700' : 'bg-gray-100'
                      }`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{employee.name}</div>
                            <div className="text-sm text-gray-500 capitalize">{employee.rank}</div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Icon name="Edit" className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => setEmployees(prev => prev.filter(e => e.id !== employee.id))}
                            >
                              <Icon name="Trash2" className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}>
                <CardHeader>
                  <CardTitle>Добавить сотрудника</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>ФИО</Label>
                      <Input 
                        placeholder="Иванов И.И."
                        value={newEmployee.name}
                        onChange={(e) => setNewEmployee(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Звание</Label>
                      <Select 
                        value={newEmployee.rank}
                        onValueChange={(value) => setNewEmployee(prev => ({ ...prev, rank: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="рядовой">Рядовой</SelectItem>
                          <SelectItem value="ефрейтор">Ефрейтор</SelectItem>
                          <SelectItem value="младший сержант">Младший сержант</SelectItem>
                          <SelectItem value="сержант">Сержант</SelectItem>
                          <SelectItem value="старший сержант">Старший сержант</SelectItem>
                          <SelectItem value="старшина">Старшина</SelectItem>
                          <SelectItem value="прапорщик">Прапорщик</SelectItem>
                          <SelectItem value="старший прапорщик">Старший прапорщик</SelectItem>
                          <SelectItem value="младший лейтенант">Младший лейтенант</SelectItem>
                          <SelectItem value="лейтенант">Лейтенант</SelectItem>
                          <SelectItem value="старший лейтенант">Старший лейтенант</SelectItem>
                          <SelectItem value="капитан">Капитан</SelectItem>
                          <SelectItem value="майор">Майор</SelectItem>
                          <SelectItem value="подполковник">Подполковник</SelectItem>
                          <SelectItem value="полковник">Полковник</SelectItem>
                          <SelectItem value="генерал-майор">Генерал-майор</SelectItem>
                          <SelectItem value="генерал-лейтенант">Генерал-лейтенант</SelectItem>
                          <SelectItem value="генерал-полковник">Генерал-полковник</SelectItem>
                          <SelectItem value="генерал">Генерал</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={addEmployee} className="w-full">
                      <Icon name="UserPlus" className="h-4 w-4 mr-2" />
                      Создать сотрудника
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Calls Tab */}
          <TabsContent value="calls" className="mt-6">
            <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}>
              <CardHeader>
                <CardTitle>Активные вызовы</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {emergencyCalls.filter(call => !call.assignedEmployee).map(call => {
                    const plot = plots.find(p => p.id === call.plotId)!;
                    return (
                      <div key={call.id} className={`p-4 rounded-lg border-2 border-red-500 ${
                        theme === 'dark' ? 'bg-red-900/20' : 'bg-red-50'
                      }`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-bold text-red-500">Участок {call.plotId}</div>
                            <div className="text-sm">{plot.address}</div>
                            <div className="text-xs text-gray-500">{call.time}</div>
                            <Badge className="mt-1" variant="destructive">
                              {call.type === 'emergency' ? 'Экстренный вызов' : 'Сработала сигнализация'}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <Select onValueChange={(value) => {
                              assignEmployee(call.id, parseInt(value));
                            }}>
                              <SelectTrigger className="w-48">
                                <SelectValue placeholder="Назначить сотрудника" />
                              </SelectTrigger>
                              <SelectContent>
                                {employees.map(employee => (
                                  <SelectItem key={employee.id} value={employee.id.toString()}>
                                    {employee.name} ({employee.rank})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {emergencyCalls.filter(call => call.assignedEmployee).length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-2">Назначенные вызовы</h4>
                      <div className="space-y-2">
                        {emergencyCalls.filter(call => call.assignedEmployee).map(call => {
                          const plot = plots.find(p => p.id === call.plotId)!;
                          const employee = employees.find(e => e.id === call.assignedEmployee)!;
                          return (
                            <div 
                              key={call.id} 
                              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                theme === 'dark' ? 'bg-green-900/20 border border-green-500 hover:bg-green-900/30' : 'bg-green-50 border border-green-200 hover:bg-green-100'
                              }`}
                              onClick={() => setManagingCall(call.plotId)}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-medium">Участок {call.plotId}</div>
                                  <div className="text-sm text-green-600">Сотрудник выехал: {employee.name}</div>
                                  <div className="text-xs text-gray-500 mt-1">Нажмите для управления</div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <Badge className="bg-green-500 text-white">
                                    Выехал
                                  </Badge>
                                  <Icon name="Settings" className="h-4 w-4 text-gray-400" />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {emergencyCalls.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      Нет активных вызовов
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Индикатор активных вызовов */}
      {emergencyCalls.filter(call => !call.assignedEmployee).length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-red-600 text-white py-3 px-6 z-50">
          <div className="flex items-center justify-center gap-4">
            <Icon name="AlertTriangle" className="h-6 w-6 animate-pulse" />
            <span className="text-lg font-bold animate-pulse">
              ВЫЗОВ - Активных вызовов: {emergencyCalls.filter(call => !call.assignedEmployee).length}
            </span>
            <Icon name="Siren" className="h-6 w-6 animate-pulse" />
          </div>
        </div>
      )}
      
      {/* Модальное окно управления участком */}
      {managingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className={`w-96 max-w-md mx-4 ${
            theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'
          }`}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Управление участком {managingCall}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setManagingCall(null)}
                >
                  <Icon name="X" className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const plot = plots.find(p => p.id === managingCall)!;
                const call = emergencyCalls.find(c => c.plotId === managingCall && c.assignedEmployee);
                const employee = call ? employees.find(e => e.id === call.assignedEmployee) : null;
                
                return (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div><strong>Адрес:</strong> {plot.address}</div>
                      <div><strong>Телефон:</strong> {plot.phone}</div>
                      <div className="flex items-center gap-2">
                        <strong>Статус:</strong>
                        <Badge 
                          style={{ backgroundColor: getStatusColor(plot.status, plot.customStatus) }}
                          className="text-white"
                        >
                          {getStatusText(plot.status, plot.customStatus)}
                        </Badge>
                      </div>
                      {employee && (
                        <div><strong>Назначенный сотрудник:</strong> {employee.name} ({employee.rank})</div>
                      )}
                      <div><strong>Батарея:</strong> {plot.battery}%</div>
                      <Progress value={plot.battery} className="w-full" />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => endEmergency(plot.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Icon name="CheckCircle" className="h-4 w-4 mr-2" />
                        Конец тревоге
                      </Button>
                      
                      <Button 
                        onClick={() => chargeBattery(plot.id)}
                        variant="outline"
                        size="sm"
                      >
                        <Icon name="Battery" className="h-4 w-4 mr-1" />
                        Зарядка
                      </Button>
                    </div>
                    
                    <div className="text-sm">
                      <h4 className="font-medium mb-2">Последние действия:</h4>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {plot.history.slice(0, 5).map((event, index) => (
                          <div key={index} className="flex justify-between text-xs">
                            <span>{event.action}</span>
                            <span className="text-gray-500">{event.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()} 
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Index;