import { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useSearchParams } from 'react-router-dom';
import type { ApiClient } from '../api';
import { useToast } from '../contexts/ToastContext';

interface InstructorDashboardProps {
  api: ApiClient;
  publicApi: ApiClient;
}

export function InstructorDashboard({ api, publicApi }: InstructorDashboardProps) {
  const [courses, setCourses] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);

  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDescription, setModuleDescription] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const [activeAddingLessonModuleId, setActiveAddingLessonModuleId] = useState<string | null>(null);
  const [uploadingLessonId, setUploadingLessonId] = useState<string | null>(null);
  const [uploadingResourceId, setUploadingResourceId] = useState<string | null>(null);

  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editModuleTitle, setEditModuleTitle] = useState('');
  const [editModuleDescription, setEditModuleDescription] = useState('');

  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editLessonTitle, setEditLessonTitle] = useState('');
  const [editLessonDescription, setEditLessonDescription] = useState('');

  const { user } = useAuth0();
  const showToast = useToast();

  const [searchParams, setSearchParams] = useSearchParams();
  const courseIdFromUrl = searchParams.get('courseId');

  const fetchInstructorCourses = async (autoSelectId?: string) => {
    try {
      const data = await publicApi.get<any[]>('/courses');
      const instName = user?.sub || user?.name || user?.email || '';
      const filtered = (data || []).filter((c: any) => c.instructorId === instName);
      setCourses(filtered);
      setLoading(false);

      const targetId = autoSelectId || courseIdFromUrl;
      if (targetId) {
        selectCourseToManage(targetId);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructorCourses();
  }, [user, courseIdFromUrl]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const createdCourse = await api.post<any>('/courses', {
        title,
        description,
        price: Number(price),
        instructorId: user?.sub || user?.name || user?.email || 'Instructor Anon'
      });

      if (coverImageFile && createdCourse.id) {
        const formData = new FormData();
        formData.append('file', coverImageFile);
        await api.upload(`/courses/${createdCourse.id}/cover`, formData);
      }

      showToast('¡Curso guardado con éxito en PostgreSQL!', 'success');
      setTitle('');
      setDescription('');
      setPrice(0);
      setCoverImageFile(null);
      setCoverPreview(null);
      fetchInstructorCourses();
    } catch (e) {
      console.error(e);
      showToast('Error al conectar con el servidor.', 'error');
    }
  };

  const selectCourseToManage = async (courseId: string) => {
    try {
      const data = await publicApi.get<any>(`/courses/${courseId}`);
      setSelectedCourse(data);
      setEditTitle(data.title || '');
      setEditDescription(data.description || '');
    } catch (err) {
      showToast('Error al cargar los detalles del curso.', 'error');
    }
  };

  const handleUpdateCourseInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      await api.put(`/courses/${selectedCourse.id}`, { title: editTitle, description: editDescription });
      showToast('Información del curso actualizada con éxito.', 'success');
      fetchInstructorCourses(selectedCourse.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !moduleTitle) return;
    try {
      await api.post(`/courses/${selectedCourse.id}/modules`, { title: moduleTitle, description: moduleDescription });
      setModuleTitle('');
      setModuleDescription('');
      selectCourseToManage(selectedCourse.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddLesson = async (e: React.FormEvent, moduleId: string) => {
    e.preventDefault();
    if (!lessonTitle) return;
    try {
      await api.post(`/modules/${moduleId}/lessons`, { title: lessonTitle, description: lessonDescription });
      setLessonTitle('');
      setLessonDescription('');
      selectCourseToManage(selectedCourse.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateModule = async (moduleId: string) => {
    try {
      await api.put(`/modules/${moduleId}`, { title: editModuleTitle, description: editModuleDescription });
      showToast('Módulo actualizado con éxito.', 'success');
      setEditingModuleId(null);
      selectCourseToManage(selectedCourse.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateLesson = async (lessonId: string) => {
    try {
      await api.put(`/lessons/${lessonId}`, { title: editLessonTitle, description: editLessonDescription });
      showToast('Lección actualizada con éxito.', 'success');
      setEditingLessonId(null);
      selectCourseToManage(selectedCourse.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>, lessonId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLessonId(lessonId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const data = await api.upload<{ videoUrl: string }>(`/lessons/${lessonId}/video`, formData);
      showToast(`¡Video subido con éxito!\nURL del Stream: ${data.videoUrl}`, 'success');
      selectCourseToManage(selectedCourse.id);
    } catch (err) {
      console.error(err);
      showToast('Error de conexión al subir.', 'error');
    } finally {
      setUploadingLessonId(null);
    }
  };

  const handleResourceUpload = async (e: React.ChangeEvent<HTMLInputElement>, lessonId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingResourceId(lessonId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.upload(`/lessons/${lessonId}/resources`, formData);
      showToast('¡Archivo de recurso adjuntado con éxito!', 'success');
      selectCourseToManage(selectedCourse.id);
    } catch (err) {
      console.error(err);
      showToast('Error al conectar con el servidor.', 'error');
    } finally {
      setUploadingResourceId(null);
    }
  };

  return (
    <div className="container" style={{ padding: '30px 20px', paddingBottom: '80px' }}>
      <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '35px' }}>Panel de Control del Instructor</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div style={{ border: '1px solid #d1d7dc', padding: '24px', background: '#fff' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>1. Crear Nuevo Curso</h3>
            <form onSubmit={handleCreateCourse}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 'bold' }}>Título</label>
                <input type="text" required value={title} placeholder="Ej. Curso Completo de React" onChange={e => setTitle(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #8a8d91', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 'bold' }}>Descripción</label>
                <textarea rows={4} required value={description} placeholder="Escribe de qué trata tu curso..." onChange={e => setDescription(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #8a8d91', outline: 'none', resize: 'vertical' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 'bold' }}>Precio ($ USD)</label>
                <input type="number" step="0.01" required value={price} onChange={e => setPrice(Number(e.target.value))} style={{ width: '100%', padding: '10px', border: '1px solid #8a8d91', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 'bold' }}>Imagen de Portada (opcional)</label>
                {coverPreview && (
                  <div style={{ marginBottom: '10px' }}>
                    <img src={coverPreview} alt="Preview" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #d1d7dc' }} />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setCoverImageFile(file);
                      setCoverPreview(URL.createObjectURL(file));
                    }
                  }}
                  style={{ width: '100%', padding: '8px', border: '1px solid #8a8d91', fontSize: '13px' }}
                />
              </div>
              <button type="submit" style={{ backgroundColor: '#a435f0', color: 'white', padding: '12px 24px', border: 'none', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}>
                Publicar Curso
              </button>
            </form>
          </div>

          <div style={{ border: '1px solid #d1d7dc', padding: '24px', background: '#fff' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px' }}>Tus Cursos Publicados</h3>
            {loading ? (
              <p>Cargando tus cursos...</p>
            ) : courses.length === 0 ? (
              <p style={{ color: '#6a6f73', fontSize: '13px' }}>Aún no has publicado ningún curso con esta cuenta.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {courses.map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSearchParams({ courseId: c.id });
                      selectCourseToManage(c.id);
                    }}
                    style={{
                      textAlign: 'left',
                      padding: '12px',
                      background: selectedCourse?.id === c.id ? '#f7f9fa' : '#fff',
                      border: '1px solid #d1d7dc',
                      cursor: 'pointer',
                      borderLeft: selectedCourse?.id === c.id ? '4px solid #a435f0' : '1px solid #d1d7dc'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{c.title}</div>
                    <div style={{ fontSize: '12px', color: '#6a6f73', marginTop: '4px' }}>Precio: ${c.price}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          {selectedCourse ? (
            <div style={{ border: '1px solid #d1d7dc', padding: '30px', backgroundColor: '#fff' }}>
              <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: '#2d2f31', marginBottom: '8px' }}>Editar: {selectedCourse.title}</h3>
              <p style={{ color: '#6a6f73', fontSize: '13px', marginBottom: '25px' }}>ID del curso: {selectedCourse.id}</p>

              <form onSubmit={handleUpdateCourseInfo} style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #d1d7dc' }}>
                <h4 style={{ fontWeight: 'bold', marginBottom: '15px' }}>Información Básica</h4>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 'bold' }}>Título del Curso</label>
                  <input type="text" required value={editTitle} onChange={e => setEditTitle(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #8a8d91', outline: 'none' }} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 'bold' }}>Descripción</label>
                  <textarea rows={4} required value={editDescription} onChange={e => setEditDescription(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #8a8d91', outline: 'none', resize: 'vertical' }} />
                </div>
                <button type="submit" style={{ backgroundColor: '#2d2f31', color: '#fff', border: 'none', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer' }}>Guardar Cambios</button>
              </form>

              <h4 style={{ fontWeight: 'bold', marginBottom: '15px' }}>Estructura del Curso</h4>
              <form onSubmit={handleAddModule} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px', borderBottom: '1px solid #d1d7dc', paddingBottom: '20px' }}>
                <input type="text" required placeholder="Nombre de la nueva sección/módulo" value={moduleTitle} onChange={e => setModuleTitle(e.target.value)} style={{ padding: '10px', border: '1px solid #8a8d91', outline: 'none' }} />
                <textarea placeholder="Descripción de la sección/módulo (opcional)" value={moduleDescription} onChange={e => setModuleDescription(e.target.value)} style={{ padding: '10px', border: '1px solid #8a8d91', outline: 'none', resize: 'vertical' }} rows={2} />
                <button type="submit" style={{ backgroundColor: '#2d2f31', color: '#fff', border: 'none', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer', alignSelf: 'flex-start' }}>Añadir Módulo</button>
              </form>

              <h4 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>Secciones y Clases</h4>
              {(!selectedCourse.modules || selectedCourse.modules.length === 0) ? (
                <p style={{ color: '#6a6f73', fontSize: '14px', fontStyle: 'italic' }}>Este curso aún no tiene módulos. Escribe el título de uno arriba para comenzar.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {selectedCourse.modules.map((mod: any) => (
                    <div key={mod.id} style={{ border: '1px solid #e4e6e8', padding: '20px', backgroundColor: '#f7f9fa' }}>
                      {editingModuleId === mod.id ? (
                        <div style={{ marginBottom: '15px', padding: '15px', border: '1px solid #a435f0', backgroundColor: '#fff' }}>
                          <div style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Título del Módulo</label>
                            <input type="text" value={editModuleTitle} onChange={e => setEditModuleTitle(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #8a8d91', outline: 'none' }} />
                          </div>
                          <div style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Descripción del Módulo</label>
                            <textarea value={editModuleDescription} onChange={e => setEditModuleDescription(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #8a8d91', outline: 'none', resize: 'vertical' }} rows={2} />
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleUpdateModule(mod.id)} style={{ backgroundColor: '#a435f0', color: 'white', border: 'none', padding: '6px 14px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Guardar Módulo</button>
                            <button onClick={() => setEditingModuleId(null)} style={{ backgroundColor: '#e4e6e8', color: '#2d2f31', border: 'none', padding: '6px 14px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#2d2f31' }}>{mod.title}</div>
                            {mod.description && <p style={{ fontSize: '13px', color: '#6a6f73', margin: '4px 0 0 0', whiteSpace: 'pre-wrap' }}>{mod.description}</p>}
                          </div>
                          <button
                            onClick={() => {
                              setEditingModuleId(mod.id);
                              setEditModuleTitle(mod.title || '');
                              setEditModuleDescription(mod.description || '');
                            }}
                            style={{ backgroundColor: 'transparent', color: '#a435f0', border: '1px solid #a435f0', padding: '4px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            Editar Módulo
                          </button>
                        </div>
                      )}

                      {mod.lessons && mod.lessons.map((les: any) => (
                        <div key={les.id} style={{ backgroundColor: '#fff', border: '1px solid #e4e6e8', padding: '20px', borderRadius: '4px', marginBottom: '12px' }}>
                          {editingLessonId === les.id ? (
                            <div style={{ marginBottom: '15px', padding: '15px', border: '1px solid #a435f0', backgroundColor: '#fff' }}>
                              <div style={{ marginBottom: '10px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Título de la Clase</label>
                                <input type="text" value={editLessonTitle} onChange={e => setEditLessonTitle(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #8a8d91', outline: 'none' }} />
                              </div>
                              <div style={{ marginBottom: '10px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Descripción de la Clase</label>
                                <textarea value={editLessonDescription} onChange={e => setEditLessonDescription(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #8a8d91', outline: 'none', resize: 'vertical' }} rows={2} />
                              </div>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => handleUpdateLesson(les.id)} style={{ backgroundColor: '#a435f0', color: 'white', border: 'none', padding: '6px 14px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Guardar Clase</button>
                                <button onClick={() => setEditingLessonId(null)} style={{ backgroundColor: '#e4e6e8', color: '#2d2f31', border: 'none', padding: '6px 14px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Cancelar</button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                              <div>
                                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{les.title}</span>
                                {les.description && <p style={{ fontSize: '13px', color: '#6a6f73', margin: '4px 0 0 0', whiteSpace: 'pre-wrap' }}>{les.description}</p>}
                                {les.videoUrl ? (
                                  <div style={{ fontSize: '11px', color: 'green', marginTop: '4px' }}>✓ Video cargado (.mp4)</div>
                                ) : (
                                  <div style={{ fontSize: '11px', color: '#b4690e', marginTop: '4px' }}>Falta cargar el video (.mp4)</div>
                                )}
                              </div>

                              <button
                                onClick={() => {
                                  setEditingLessonId(les.id);
                                  setEditLessonTitle(les.title || '');
                                  setEditLessonDescription(les.description || '');
                                }}
                                style={{ backgroundColor: 'transparent', color: '#a435f0', border: '1px solid #a435f0', padding: '4px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                              >
                                Editar Clase
                              </button>
                            </div>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {uploadingLessonId === les.id ? (
                                <span style={{ fontSize: '12px', color: '#a435f0', fontWeight: 'bold' }}>Subiendo Video...</span>
                              ) : (
                                <label style={{ backgroundColor: '#a435f0', color: '#fff', padding: '6px 12px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '2px' }}>
                                  {les.videoUrl ? 'Reemplazar Video' : 'Subir Video (.mp4)'}
                                  <input type="file" accept="video/mp4" onChange={e => handleVideoUpload(e, les.id)} style={{ display: 'none' }} />
                                </label>
                              )}

                              {uploadingResourceId === les.id ? (
                                <span style={{ fontSize: '12px', color: '#2d2f31', fontWeight: 'bold' }}>Adjuntando...</span>
                              ) : (
                                <label style={{ backgroundColor: '#fff', color: '#2d2f31', border: '1px solid #2d2f31', padding: '6px 12px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '2px' }}>
                                  Adjuntar Material (PDF, Zip, Audio...)
                                  <input type="file" accept=".pdf,.zip,.rar,.mp3,.wav,.pdf,.docx,.txt" onChange={e => handleResourceUpload(e, les.id)} style={{ display: 'none' }} />
                                </label>
                              )}
                            </div>
                          </div>

                          {les.resources && les.resources.length > 0 && (
                            <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#f7f9fa', borderLeft: '3px solid #2d2f31' }}>
                              <span style={{ fontSize: '11px', color: '#6a6f73', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Archivos Adjuntos:</span>
                              {les.resources.map((res: any) => (
                                <div key={res.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#2d2f31', padding: '3px 0' }}>
                                  <span>{res.title} ({res.fileType.toUpperCase()})</span>
                                  <a href={res.fileUrl} target="_blank" rel="noreferrer" style={{ color: '#a435f0', textDecoration: 'none', fontWeight: 'bold' }}>Descargar</a>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}

                      {activeAddingLessonModuleId === mod.id ? (
                        <form onSubmit={e => handleAddLesson(e, mod.id)} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '15px', backgroundColor: '#fff', padding: '15px', border: '1px solid #d1d7dc' }}>
                          <h5 style={{ fontWeight: 'bold', margin: '0 0 10px 0', fontSize: '13px' }}>Nueva Clase en {mod.title}</h5>
                          <input type="text" required placeholder="Nombre de la nueva clase/lección" value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} style={{ padding: '8px', border: '1px solid #8a8d91', fontSize: '13px', outline: 'none' }} />
                          <textarea placeholder="Descripción de la clase (opcional)" value={lessonDescription} onChange={e => setLessonDescription(e.target.value)} style={{ padding: '8px', border: '1px solid #8a8d91', fontSize: '13px', outline: 'none', resize: 'vertical' }} rows={2} />
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="submit" style={{ backgroundColor: '#2d2f31', color: '#fff', border: 'none', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}>Guardar Clase</button>
                            <button type="button" onClick={() => setActiveAddingLessonModuleId(null)} style={{ backgroundColor: '#e4e6e8', color: '#2d2f31', border: 'none', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
                          </div>
                        </form>
                      ) : (
                        <button
                          onClick={() => {
                            setActiveAddingLessonModuleId(mod.id);
                            setLessonTitle('');
                            setLessonDescription('');
                          }}
                          style={{ backgroundColor: '#2d2f31', color: '#fff', border: 'none', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}
                        >
                          + Añadir Clase
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ height: '400px', border: '1px dashed #d1d7dc', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6a6f73', textAlign: 'center', padding: '20px' }}>
              <div>
                <h3>Gestor de Estructura y Contenidos</h3>
                <p style={{ marginTop: '10px' }}>Selecciona uno de tus cursos de la lista de la izquierda para agregarle módulos, clases y subir sus videos reales.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
