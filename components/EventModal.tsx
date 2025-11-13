import React, { useState, useEffect } from 'react';
import { AcademicEvent, EventType, Subject, eventTypes } from '../types';
import { CloseIcon, TrashIcon } from './icons';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: AcademicEvent) => void;
  onDelete?: (eventId: string) => void;
  event: Partial<AcademicEvent> | null;
  subjects: Subject[];
}

export const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, onSave, onDelete, event, subjects }) => {
  const [formData, setFormData] = useState<Partial<AcademicEvent>>({});

  useEffect(() => {
    setFormData(event || { type: 'Tarea', date: new Date().toISOString().split('T')[0] });
  }, [event]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subjectId = e.target.value;
    const selectedSubject = subjects.find(s => s.id === subjectId);
    if(selectedSubject) {
        setFormData(prev => ({ 
            ...prev, 
            subjectId,
            subjectName: selectedSubject.name,
            subjectColor: selectedSubject.color
        }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title && formData.date && formData.type && formData.subjectId) {
        const subject = subjects.find(s => s.id === formData.subjectId);
        if(subject) {
            onSave({
                id: formData.id || new Date().toISOString(),
                ...formData,
                title: formData.title,
                date: formData.date,
                type: formData.type,
                subjectId: subject.id,
                subjectName: subject.name,
                subjectColor: subject.color
            });
        }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{event?.id ? 'Editar Evento' : 'Crear Evento'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título</label>
            <input type="text" name="title" id="title" value={formData.title || ''} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div className="mb-4">
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha</label>
            <input type="date" name="date" id="date" value={formData.date || ''} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
              <select name="type" id="type" value={formData.type || ''} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="subjectId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Materia</label>
              <select name="subjectId" id="subjectId" value={formData.subjectId || ''} onChange={handleSubjectChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="" disabled>Selecciona una materia</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div>
              {event?.id && onDelete && (
                <button type="button" onClick={() => onDelete(event.id!)} className="flex items-center text-red-600 hover:text-red-800 dark:hover:text-red-400">
                  <TrashIcon className="w-5 h-5 mr-2" />
                  Eliminar
                </button>
              )}
            </div>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};