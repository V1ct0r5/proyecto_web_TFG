// frontend/reactapp/src/pages/ProfilePage.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ProfilePage.module.css';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import FormGroup from '../components/ui/FormGroup';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import apiService from '../services/apiService';
import { toast } from 'react-toastify';
import { FaUserCircle, FaEnvelope, FaMapMarkerAlt, FaCalendarAlt, FaPhone, FaEdit, FaUpload } from 'react-icons/fa';
import { IoShieldCheckmark } from 'react-icons/io5';
import { formatDateByPreference } from '../utils/dateUtils';
import { useSettings } from '../context/SettingsContext';

function ProfilePage() {
    const { settings } = useSettings();
    const [userData, setUserData] = useState(null);
    const [statsData, setStatsData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formError, setFormError] = useState(null);

    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const fileInputRef = useRef(null);

    const navigate = useNavigate();

    const fetchPageData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setFormError(null);
        let fetchedUserData = null;
        let fetchedStatsData = { totalObjectives: 0, completed: 0, inProgress: 0, successRate: 0 };

        try {
            const results = await Promise.allSettled([
                apiService.getUserProfile(),
                apiService.getUserProfileStats()
            ]);

            const [profileResult, statsResult] = results;

            if (profileResult.status === 'fulfilled' && profileResult.value) {
                fetchedUserData = profileResult.value;
                setUserData(fetchedUserData);
                const initialFormData = {
                    name: fetchedUserData.name || '',
                    email: fetchedUserData.email || '',
                    phone: fetchedUserData.phone || '',
                    location: fetchedUserData.location || '',
                    bio: fetchedUserData.bio || '',
                    avatarUrl: fetchedUserData.avatarUrl || ''
                };
                setFormData(initialFormData);
                setAvatarPreview(fetchedUserData.avatarUrl || null);
            } else {
                const profileErrorReason = profileResult.reason;
                const errMsg = profileErrorReason?.data?.message || profileErrorReason?.message || "No se pudieron cargar los detalles del perfil.";
                console.error("Error fetching profile details:", profileErrorReason);
                throw new Error(errMsg);
            }

            if (statsResult.status === 'fulfilled' && statsResult.value) {
                fetchedStatsData = statsResult.value;
            } else {
                console.warn("Error fetching profile stats:", statsResult.reason);
                toast.warn("No se pudieron cargar las estadísticas del perfil.");
            }
            setStatsData(fetchedStatsData);

        } catch (err) {
            const errorMessage = err.message || "No se pudieron cargar los datos del perfil.";
            setError(errorMessage);
            setUserData(null); 
            setStatsData(null);
        } finally {
            setIsLoading(false);
        }
    }, []); // Dependencias vacías para que solo se ejecute al montar

    useEffect(() => {
        fetchPageData();
    }, [fetchPageData]);

    const handleEditClick = () => {
        if (!userData) return;
        setFormError(null);
        setFormData({
            name: userData.name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            location: userData.location || '',
            bio: userData.bio || '',
            avatarUrl: userData.avatarUrl || ''
        });
        setAvatarPreview(userData.avatarUrl || null);
        setSelectedAvatarFile(null);
        setIsEditMode(true);
    };

    const handleCancelEdit = () => {
        setIsEditMode(false);
        setFormError(null);
        setSelectedAvatarFile(null);
        if (userData) {
            setAvatarPreview(userData.avatarUrl || null);
            setFormData({
                name: userData.name || '', email: userData.email || '',
                phone: userData.phone || '', location: userData.location || '',
                bio: userData.bio || '', avatarUrl: userData.avatarUrl || ''
            });
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveChanges = async () => {
        setIsSubmitting(true);
        setFormError(null);
        try {
            const payloadToUpdate = {
                nombre_usuario: formData.name,
                telefono: formData.phone,
                ubicacion: formData.location,
                biografia: formData.bio,
            };
            Object.keys(payloadToUpdate).forEach(key => {
                if (payloadToUpdate[key] == null || payloadToUpdate[key] === '') { // Enviar string vacíos como null o no enviarlos
                    payloadToUpdate[key] = null; // o delete payloadToUpdate[key]; según prefiera el backend
                }
            });

            const updatedUserDataFromAPI = await apiService.updateUserProfile(payloadToUpdate);
            setUserData(prevUserData => ({ ...prevUserData, ...updatedUserDataFromAPI }));
            setFormData(prevData => ({ ...prevData, ...updatedUserDataFromAPI })); // Sincronizar formData también
            toast.success("Perfil actualizado con éxito!");
            setIsEditMode(false);
        } catch (err) {
            const errorMessage = err.data?.message || (err.data?.validationErrors && err.data.validationErrors.map(e => e.msg).join(', ')) || err.message || "Error al actualizar el perfil.";
            setFormError(errorMessage);
            toast.error(`Error: ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAvatarFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                toast.error("El archivo es demasiado grande. Máximo 2MB.");
                return;
            }
            if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
                toast.error("Formato de archivo no válido. Solo JPG, PNG, GIF.");
                return;
            }
            setSelectedAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleAvatarUpload = async () => {
        console.log("Intentando subir:", selectedAvatarFile);
        if (!selectedAvatarFile) {
            toast.info("Por favor, selecciona un archivo primero.");
            return;
        }
        setIsUploadingAvatar(true);
        setFormError(null);
        try {
            const formDataToSubmit = new FormData();
            formDataToSubmit.append('avatar', selectedAvatarFile);

            const response = await apiService.uploadAvatar(formDataToSubmit);
            
            // Actualizar userData y formData con la nueva URL del avatar
            const newAvatarUrl = response.avatarUrl;
            setUserData(prevData => ({ ...prevData, avatarUrl: newAvatarUrl }));
            setFormData(prevData => ({ ...prevData, avatarUrl: newAvatarUrl }));
            setAvatarPreview(newAvatarUrl); // Actualizar previsualización con la URL del servidor
            setSelectedAvatarFile(null); // Limpiar archivo seleccionado
            toast.success("Foto de perfil actualizada con éxito.");
        } catch (err) {
            const errorMessage = err.data?.message || err.message || "Error al subir la foto de perfil.";
            setFormError(errorMessage);
            toast.error(`Error: ${errorMessage}`);
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    if (isLoading && !userData) {
        return <div className={styles.centeredStatus}><LoadingSpinner size="large" text="Cargando perfil..." /></div>;
    }
    if (error && !userData) {
        return <div className={`${styles.centeredStatus} ${styles.errorText}`}>{error}</div>;
    }
    if (!userData) {
        return <div className={styles.centeredStatus}>No se encontraron datos del perfil o la carga falló.</div>;
    }

    const formattedMemberSince = userData.memberSince
        ? formatDateByPreference(userData.memberSince, settings.dateFormat, settings.language)
        : 'N/A';

    return (
        <div className={styles.profilePageContainer}>
            <header className={styles.profileHeader}>
                <div className={styles.avatarContainer}>
                    {isEditMode ? (
                        avatarPreview ? (
                            <img src={avatarPreview} alt="Previsualización del avatar" className={styles.avatar} />
                        ) : (
                            <FaUserCircle className={styles.avatarPlaceholder} />
                        )
                    ) : (
                        userData.avatarUrl ? (
                            <img src={userData.avatarUrl} alt={userData.name || 'Avatar del usuario'} className={styles.avatar} />
                        ) : (
                            <FaUserCircle className={styles.avatarPlaceholder} />
                        )
                    )}
                    {isEditMode && (
                        <>
                            <input
                                type="file"
                                accept="image/jpeg, image/png, image/gif"
                                ref={fileInputRef}
                                onChange={handleAvatarFileChange}
                                style={{ display: 'none' }}
                                id="avatarUploadInput"
                            />
                            <Button
                                type="button"
                                size="small"
                                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                                className={styles.avatarEditButton}
                                disabled={isUploadingAvatar || isSubmitting}
                            >
                                Seleccionar Foto
                            </Button>
                            {selectedAvatarFile && (
                                <Button
                                    type="button"
                                    size="small"
                                    variant="success"
                                    onClick={handleAvatarUpload}
                                    isLoading={isUploadingAvatar}
                                    disabled={isUploadingAvatar || isSubmitting}
                                    className={styles.avatarUploadButton}
                                >
                                    <FaUpload /> Subir Foto
                                </Button>
                            )}
                        </>
                    )}
                </div>
                <div className={styles.userInfoMain}>
                    <div className={styles.userNameStatus}>
                        <h1 className={styles.userName}>{isEditMode ? (formData.name || '') : (userData.name || 'Usuario')}</h1>
                        {userData.status && !isEditMode && (
                            <span className={`${styles.statusBadge} ${styles['status' + userData.status.replace(/\s+/g, '')]}`}>
                                <IoShieldCheckmark className={styles.statusIcon} /> {userData.status}
                            </span>
                        )}
                    </div>
                    <p className={styles.userInfoDetail}><FaEnvelope /> {userData.email || '-'}</p>
                    {!isEditMode && userData.location && <p className={styles.userInfoDetail}><FaMapMarkerAlt /> {userData.location}</p>}
                    {!isEditMode && userData.phone && <p className={styles.userInfoDetail}><FaPhone /> {userData.phone}</p>}
                    <p className={styles.userInfoDetail}><FaCalendarAlt /> Miembro desde {formattedMemberSince}</p>
                </div>
                <div className={styles.profileActions}>
                    {!isEditMode && (
                        <Button variant="primary" onClick={handleEditClick}>
                            <FaEdit /> Editar Perfil
                        </Button>
                    )}
                </div>
            </header>

            <div className={styles.profileContentGrid}>
                <section className={`${styles.profileCard} ${styles.personalInfoCard}`}>
                    <div className={styles.personalInfoHeader}>
                        <h2 className={styles.cardTitle}>Información Personal</h2>
                        <p className={styles.cardSubtitle}>
                            {isEditMode ? "Actualiza tu información personal y de contacto." : "Aquí puedes ver tu información personal y de contacto."}
                        </p>
                    </div>
                    
                    {isEditMode ? (
                        <form onSubmit={(e) => { e.preventDefault(); handleSaveChanges(); }}>
                            <div className={styles.infoGrid}>
                                <FormGroup label="Nombre completo:" htmlFor="name" className={styles.infoItem}>
                                    <Input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} />
                                </FormGroup>
                                <FormGroup label="Correo electrónico:" htmlFor="email" className={styles.infoItem}>
                                    <Input type="email" id="email" name="email" value={formData.email} readOnly disabled title="El correo electrónico no se puede modificar." />
                                </FormGroup>
                                <FormGroup label="Teléfono:" htmlFor="phone" className={styles.infoItem}>
                                    <Input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Ej: +34 123 456 789"/>
                                </FormGroup>
                                <FormGroup label="Ubicación:" htmlFor="location" className={styles.infoItem}>
                                     <Input type="text" id="location" name="location" value={formData.location} onChange={handleInputChange} placeholder="Ej: Madrid, España"/>
                                </FormGroup>
                                <FormGroup label="Biografía:" htmlFor="bio" className={styles.infoItemWide}>
                                    <textarea id="bio" name="bio" value={formData.bio} onChange={handleInputChange} className={styles.bioTextarea} rows="5" placeholder="Cuéntanos un poco sobre ti..."/>
                                </FormGroup>
                            </div>
                            {formError && <p className={styles.formErrorMessage}>{formError}</p>}
                            <div className={styles.editFormActions}>
                                <Button type="button" variant="secondary" onClick={handleCancelEdit} disabled={isSubmitting || isUploadingAvatar}>
                                    Cancelar
                                </Button>
                                <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting || isUploadingAvatar}>
                                    {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}><label className={styles.infoLabel}>Nombre completo</label><p className={styles.infoValue}>{userData.name || '-'}</p></div>
                            <div className={styles.infoItem}><label className={styles.infoLabel}>Correo electrónico</label><p className={styles.infoValue}>{userData.email || '-'}</p></div>
                            <div className={styles.infoItem}><label className={styles.infoLabel}>Teléfono</label><p className={styles.infoValue}>{userData.phone || '-'}</p></div>
                            <div className={styles.infoItem}><label className={styles.infoLabel}>Ubicación</label><p className={styles.infoValue}>{userData.location || '-'}</p></div>
                            <div className={styles.infoItemWide}><label className={styles.infoLabel}>Biografía</label><p className={`${styles.infoValue} ${styles.bioText}`}>{userData.bio || 'No has añadido una biografía aún.'}</p></div>
                        </div>
                    )}
                </section>

                <div className={styles.rightColumn}>
                    {statsData && (
                        <section className={`${styles.profileCard} ${styles.statsCard}`}>
                            <h2 className={styles.cardTitle}>Estadísticas</h2>
                            <p className={styles.cardSubtitle}>Tu progreso en Objectify</p>
                            <ul className={styles.statsList}>
                                <li><span>Objetivos Totales</span><span className={styles.statValue}>{statsData.totalObjectives}</span></li>
                                <li><span>Completados</span><span className={`${styles.statValue} ${styles.statCompleted}`}>{statsData.completed}</span></li>
                                <li><span>En Progreso</span><span className={`${styles.statValue} ${styles.statInProgress}`}>{statsData.inProgress}</span></li>
                                <li><span>Tasa de Éxito</span><span className={`${styles.statValue} ${styles.statSuccessRate}`}>{statsData.successRate}%</span></li>
                            </ul>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;