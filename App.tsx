import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { AcademicEvent, Subject, User, SyllabusFile } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import { extractTextFromPdf } from './services/pdfService';
import { extractEventsFromSyllabus } from './services/geminiService';
// FIX: Consolidated all icon imports into a single statement to remove duplicates and fix missing icon reference.
import { PlusIcon, CalendarIcon, ListIcon, DownloadIcon, PencilIcon, TrashIcon, SpinnerIcon, CheckCircleIcon, XCircleIcon, UploadIcon, ChevronLeftIcon, ChevronRightIcon, InfoCircleIcon } from './components/icons';
import { EventModal } from './components/EventModal';

declare global {
  interface Window {
    jspdf: any;
  }
}

const COLORS = [
  'bg-red-200', 'bg-yellow-200', 'bg-green-200', 'bg-blue-200', 'bg-indigo-200', 'bg-purple-200', 'bg-pink-200',
  'border-red-500', 'border-yellow-500', 'border-green-500', 'border-blue-500', 'border-indigo-500', 'border-purple-500', 'border-pink-500',
];

const eventTypeColors: { [key in AcademicEvent['type']]: { bg: string; text: string } } = {
  Examen: { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-800 dark:text-red-200' },
  Tarea: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-800 dark:text-blue-200' },
  Lectura: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-800 dark:text-green-200' },
  Proyecto: { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-800 dark:text-yellow-200' },
  Otro: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-200' },
};

// Mocks for F-01
const Login: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            const sanitizedName = name.trim();
            const email = `${sanitizedName.toLowerCase().replace(/\s+/g, '.')}@unsch.edu.pe`;
            onLogin({
                name: sanitizedName,
                email: email,
                avatarUrl: `https://i.pravatar.cc/150?u=${email}`
            });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full">
                <h1 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">¡Bienvenido a PlanUNSCH!</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2 mb-6">Para empezar, por favor ingresa tu nombre.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="sr-only">Nombre</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            autoComplete="name"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Tu Nombre Completo"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                        disabled={!name.trim()}
                    >
                        Continuar
                    </button>
                </form>
            </div>
        </div>
    );
};


// Helper for F-08
const SubjectCard: React.FC<{
  subject: Subject;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onFileUpload: (id: string, file: File) => void;
}> = ({ subject, onRename, onDelete, onFileUpload }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(subject.name);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleRename = () => {
        if (name.trim()) {
            onRename(subject.id, name.trim());
            setIsEditing(false);
        }
    };

    return (
        <div className={`p-4 rounded-lg shadow-md ${subject.color.replace('border-', 'bg-').replace('-500', '-100')} dark:bg-gray-800 border-l-4 ${subject.color}`}>
            <div className="flex justify-between items-center mb-3">
                {isEditing ? (
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={handleRename}
                        onKeyPress={(e) => e.key === 'Enter' && handleRename()}
                        className="text-lg font-bold text-gray-800 dark:text-white bg-transparent border-b-2 border-indigo-500 focus:outline-none w-full"
                        autoFocus
                    />
                ) : (
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">{subject.name}</h3>
                )}
                <div className="flex space-x-2">
                    <button onClick={() => setIsEditing(!isEditing)} className="text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400"><PencilIcon className="w-5 h-5"/></button>
                    <button onClick={() => window.confirm(`¿Estás seguro de que quieres eliminar "${subject.name}"? Esto eliminará todos sus eventos.`) && onDelete(subject.id)} className="text-gray-500 hover:text-red-600 dark:hover:text-red-400"><TrashIcon className="w-5 h-5"/></button>
                </div>
            </div>
            <div className="space-y-2">
                {subject.syllabi.map(syllabus => (
                    <div key={syllabus.id} className="text-sm text-gray-600 dark:text-gray-400 flex items-center space-x-2">
                        {syllabus.status === 'processing' && <SpinnerIcon className="w-4 h-4 text-indigo-500" />}
                        {syllabus.status === 'completed' && <CheckCircleIcon className="w-4 h-4 text-green-500" />}
                        {syllabus.status === 'error' && <XCircleIcon className="w-4 h-4 text-red-500" />}
                        <span className="truncate flex-1" title={syllabus.name}>{syllabus.name}</span>
                    </div>
                ))}
            </div>
            <input 
                type="file" 
                accept=".pdf"
                ref={fileInputRef}
                className="hidden"
                onChange={(e) => e.target.files && onFileUpload(subject.id, e.target.files[0])}
            />
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 w-full text-sm flex items-center justify-center px-3 py-1.5 border border-dashed border-gray-400 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-indigo-500 hover:text-indigo-500 transition-colors"
            >
                <UploadIcon className="w-4 h-4 mr-2" />
                Subir Sílabo
            </button>
        </div>
    );
};

// Helper for F-05, F-06, F-07
const CalendarView: React.FC<{
  events: AcademicEvent[];
  onEventClick: (event: AcademicEvent) => void;
}> = ({ events, onEventClick }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    const endDate = new Date(endOfMonth);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const days = [];
    let day = new Date(startDate);
    while (day <= endDate) {
        days.push(new Date(day));
        day.setDate(day.getDate() + 1);
    }
    
    const eventsByDate = useMemo(() => {
        return events.reduce((acc, event) => {
            const date = event.date;
            if (!acc[date]) acc[date] = [];
            acc[date].push(event);
            return acc;
        }, {} as Record<string, AcademicEvent[]>);
    }, [events]);

    const changeMonth = (amount: number) => {
        setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + amount, 1));
    };

    const isToday = (date: Date) => new Date().toDateString() === date.toDateString();

    return (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronLeftIcon className="w-6 h-6"/></button>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white capitalize">{currentDate.toLocaleString('es-PE', { month: 'long', year: 'numeric' })}</h2>
                <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronRightIcon className="w-6 h-6"/></button>
            </div>
            <div className="grid grid-cols-7 gap-px text-center text-sm text-gray-600 dark:text-gray-400 border-t border-l border-gray-200 dark:border-gray-700">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => <div key={d} className="py-2 font-medium border-b border-gray-200 dark:border-gray-700">{d}</div>)}
                {days.map(d => {
                    const dateStr = d.toISOString().split('T')[0];
                    const dayEvents = eventsByDate[dateStr] || [];
                    return (
                        <div key={d.toString()} className={`relative min-h-[120px] p-1 border-r border-b border-gray-200 dark:border-gray-700 ${d.getMonth() !== currentDate.getMonth() ? 'bg-gray-50 dark:bg-gray-800/50' : ''}`}>
                            <span className={`absolute top-1.5 right-1.5 w-7 h-7 flex items-center justify-center rounded-full text-sm ${isToday(d) ? 'bg-indigo-600 text-white font-bold' : ''}`}>{d.getDate()}</span>
                            <div className="mt-8 space-y-1">
                                {dayEvents.map(event => (
                                    <button key={event.id} onClick={() => onEventClick(event)} className={`w-full text-left text-xs p-1 rounded-md truncate ${eventTypeColors[event.type].bg} ${eventTypeColors[event.type].text}`}>
                                        <span className="font-semibold">{event.type}:</span> {event.title}
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Helper for F-11
const ListView: React.FC<{
  events: AcademicEvent[];
  onEventClick: (event: AcademicEvent) => void;
}> = ({ events, onEventClick }) => {
    const upcomingEvents = events
        .filter(e => new Date(e.date) >= new Date(new Date().toDateString()))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Próximas Entregas</h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {upcomingEvents.length > 0 ? upcomingEvents.map(event => (
                    <div key={event.id} onClick={() => onEventClick(event)} className={`p-3 rounded-lg flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow ${eventTypeColors[event.type].bg}`}>
                        <div>
                            <p className={`font-bold ${eventTypeColors[event.type].text}`}>{event.title}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{event.subjectName} &bull; {event.type}</p>
                        </div>
                        <p className={`text-sm font-medium ${eventTypeColors[event.type].text}`}>{new Date(event.date + 'T00:00:00').toLocaleDateString('es-PE', { month: 'short', day: 'numeric' })}</p>
                    </div>
                )) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">No hay eventos próximos. ¡Hora de relajarse!</p>
                )}
            </div>
        </div>
    );
};

const Dashboard: React.FC<{ user: User; onLogout: () => void }> = ({ user, onLogout }) => {
  const [subjects, setSubjects] = useLocalStorage<Subject[]>('subjects', []);
  const [events, setEvents] = useLocalStorage<AcademicEvent[]>('events', []);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Partial<AcademicEvent> | null>(null);
  const [notifications, setNotifications] = useState<{ id: number, type: 'success' | 'error' | 'info', message: string }[]>([]);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
          if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
              setIsExportMenuOpen(false);
          }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
          document.removeEventListener("mousedown", handleClickOutside);
      };
  }, [exportMenuRef]);

  const addNotification = (type: 'success' | 'error' | 'info', message: string) => {
      const id = Date.now();
      setNotifications(prev => [...prev, {id, type, message}]);
      setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  }

  const handleAddSubject = () => {
    if (newSubjectName.trim()) {
      const newSubject: Subject = {
        id: new Date().toISOString(),
        name: newSubjectName.trim(),
        color: COLORS[subjects.length % COLORS.length],
        syllabi: [],
      };
      setSubjects([...subjects, newSubject]);
      setNewSubjectName('');
    }
  };

  const handleFileUpload = useCallback(async (subjectId: string, file: File) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;

    const syllabusId = new Date().toISOString();
    const newSyllabus: SyllabusFile = { id: syllabusId, name: file.name, file, status: 'processing' };
    
    setSubjects(subs => subs.map(s => s.id === subjectId ? { ...s, syllabi: [...s.syllabi, newSyllabus] } : s));

    try {
        const text = await extractTextFromPdf(file);
        
        if (text.length < 100) {
            throw new Error("Este PDF parece estar basado en imágenes y no se puede leer. Por favor, sube el PDF original.");
        }
        
        const extracted = await extractEventsFromSyllabus(text);
        
        if (extracted.length === 0) {
            addNotification('info', `¡Completado! No se encontraron eventos académicos claros en "${file.name}".`);
        } else {
            const newEvents: AcademicEvent[] = extracted.map(e => ({
                ...e,
                id: `${subjectId}-${new Date().toISOString()}-${Math.random()}`,
                subjectId: subject.id,
                subjectName: subject.name,
                subjectColor: subject.color,
            }));
            setEvents(prev => [...prev, ...newEvents]);
            addNotification('success', `Se extrajeron ${newEvents.length} eventos de "${file.name}" exitosamente.`);
        }

        setSubjects(subs => subs.map(s => s.id === subjectId ? { ...s, syllabi: s.syllabi.map(sy => sy.id === syllabusId ? {...sy, status: 'completed'} : sy) } : s));

    } catch (error: any) {
        console.error(error);
        const errorMessage = error.message || 'Ocurrió un error desconocido.';
        setSubjects(subs => subs.map(s => s.id === subjectId ? { ...s, syllabi: s.syllabi.map(sy => sy.id === syllabusId ? {...sy, status: 'error', error: errorMessage} : sy) } : s));
        addNotification('error', errorMessage);
    }
  }, [subjects, setSubjects, setEvents]);

  const handleSaveEvent = (eventToSave: AcademicEvent) => {
      const index = events.findIndex(e => e.id === eventToSave.id);
      if (index > -1) {
          setEvents(events.map(e => e.id === eventToSave.id ? eventToSave : e));
      } else {
          setEvents([...events, eventToSave]);
      }
      setIsModalOpen(false);
      setSelectedEvent(null);
  };
  
  const handleDeleteEvent = (eventId: string) => {
      setEvents(events.filter(e => e.id !== eventId));
      setIsModalOpen(false);
      setSelectedEvent(null);
  }

  const handleOpenModal = (event: Partial<AcademicEvent> | null) => {
      setSelectedEvent(event);
      setIsModalOpen(true);
  }

  const handleDeleteSubject = (subjectId: string) => {
      setSubjects(subjects.filter(s => s.id !== subjectId));
      setEvents(events.filter(e => e.subjectId !== subjectId));
  }

  const handleRenameSubject = (subjectId: string, newName: string) => {
      setSubjects(subjects.map(s => s.id === subjectId ? { ...s, name: newName } : s));
      setEvents(events.map(e => e.subjectId === subjectId ? { ...e, subjectName: newName } : e));
  }
  
  // F-10
  const exportToICal = () => {
    const cal = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//PlanUNSCH//AI Semester Planner//EN',
    ];
    events.forEach(event => {
        const startDate = event.date.replace(/-/g, '');
        cal.push('BEGIN:VEVENT');
        cal.push(`UID:${event.id}@planunsch`);
        cal.push(`DTSTAMP:${new Date().toISOString().replace(/[-:.]/g, '')}Z`);
        cal.push(`DTSTART;VALUE=DATE:${startDate}`);
        cal.push(`SUMMARY:${event.title} (${event.subjectName})`);
        cal.push(`DESCRIPTION:Tipo: ${event.type}`);
        cal.push('END:VEVENT');
    });
    cal.push('END:VCALENDAR');
    
    const blob = new Blob([cal.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'PlanUNSCH_export.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addNotification('success', 'Calendario exportado a .ics');
  };

  const exportToPdf = () => {
    // @ts-ignore
    const doc = new window.jspdf.jsPDF();
    
    const upcomingEvents = events
        .filter(e => new Date(e.date) >= new Date(new Date().toDateString()))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    doc.setFontSize(20);
    doc.text("PlanUNSCH - Próximas Entregas", 14, 22);
    doc.setFontSize(12);
    doc.text(`Generado para: ${user.name}`, 14, 30);

    const tableColumn = ["Fecha", "Materia", "Título del Evento", "Tipo"];
    const tableRows: (string | undefined)[][] = [];

    upcomingEvents.forEach(event => {
        const eventDate = new Date(event.date + 'T00:00:00').toLocaleDateString('es-PE', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        const eventData = [eventDate, event.subjectName, event.title, event.type];
        tableRows.push(eventData);
    });

    // @ts-ignore
    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        theme: 'grid',
        headStyles: { fillColor: [74, 85, 104] }
    });
    
    doc.save(`PlanUNSCH_proximas_entregas_${new Date().toISOString().split('T')[0]}.pdf`);
    addNotification('success', 'Tu lista de eventos ha sido exportada a PDF.');
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">PlanUNSCH</h1>
        <div className="flex items-center space-x-4">
          <span className="hidden sm:block">{user.name}</span>
          <img src={user.avatarUrl} alt="user avatar" className="w-10 h-10 rounded-full" />
          <button onClick={onLogout} className="text-sm text-gray-600 dark:text-gray-400 hover:underline">Cerrar Sesión</button>
        </div>
      </header>

      <main className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-3">Añadir Materia</h2>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                placeholder="Ej. Cálculo I"
                className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <button onClick={handleAddSubject} className="p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"><PlusIcon className="w-6 h-6"/></button>
            </div>
          </div>
          <div className="space-y-4">
            {subjects.map(subject => <SubjectCard key={subject.id} subject={subject} onRename={handleRenameSubject} onDelete={handleDeleteSubject} onFileUpload={handleFileUpload}/>)}
          </div>
        </aside>

        <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                    <button onClick={() => setView('calendar')} className={`px-4 py-1.5 rounded-md text-sm font-medium flex items-center ${view === 'calendar' ? 'bg-white dark:bg-gray-800 shadow' : ''}`}><CalendarIcon className="w-5 h-5 mr-2"/>Calendario</button>
                    <button onClick={() => setView('list')} className={`px-4 py-1.5 rounded-md text-sm font-medium flex items-center ${view === 'list' ? 'bg-white dark:bg-gray-800 shadow' : ''}`}><ListIcon className="w-5 h-5 mr-2"/>Lista</button>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="relative">
                        <button onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 flex items-center"><DownloadIcon className="w-5 h-5 mr-2"/> Exportar</button>
                        {isExportMenuOpen && (
                            <div ref={exportMenuRef} className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-20 border border-gray-200 dark:border-gray-700">
                                <button onClick={() => { exportToICal(); setIsExportMenuOpen(false); }} className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    Exportar a iCal (.ics)
                                </button>
                                <button onClick={() => { exportToPdf(); setIsExportMenuOpen(false); }} className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    Exportar a PDF (.pdf)
                                </button>
                            </div>
                        )}
                    </div>
                    <button onClick={() => handleOpenModal(null)} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 flex items-center"><PlusIcon className="w-5 h-5 mr-2"/> Nuevo Evento</button>
                </div>
            </div>
            {view === 'calendar' ? <CalendarView events={events} onEventClick={(e) => handleOpenModal(e)} /> : <ListView events={events} onEventClick={(e) => handleOpenModal(e)} />}
        </div>
      </main>
      
      <EventModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveEvent} onDelete={handleDeleteEvent} event={selectedEvent} subjects={subjects}/>

       {/* Notifications */}
      <div className="fixed bottom-4 right-4 w-full max-w-xs space-y-3 z-50">
        {notifications.map(n => (
          <div key={n.id} className={`p-4 rounded-lg shadow-lg flex items-start space-x-3 text-sm font-medium 
            ${n.type === 'success' && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}
            ${n.type === 'error' && 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}
            ${n.type === 'info' && 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}`}>
            <span className="flex-shrink-0 mt-0.5">
              {n.type === 'success' && <CheckCircleIcon className="w-5 h-5"/>}
              {n.type === 'error' && <XCircleIcon className="w-5 h-5"/>}
              {n.type === 'info' && <InfoCircleIcon className="w-5 h-5"/>}
            </span>
            <p>{n.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

function App() {
  const [user, setUser] = useLocalStorage<User | null>('user', null);

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return <Dashboard user={user} onLogout={() => setUser(null)} />;
}

export default App;