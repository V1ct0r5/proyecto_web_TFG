import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { useTranslation } from 'react-i18next';

function ProfilePage() {
    const { settings } = useSettings();
    const { t } = useTranslation();
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

    const fetchPageData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setFormError(null);
        try {
            const [profileResult, statsResult] = await Promise.allSettled([
                apiService.getUserProfile(),
                apiService.getUserProfileStats()
            ]);

            if (profileResult.status === 'fulfilled' && profileResult.value) {
                const fetchedUserData = profileResult.value;
                setUserData(fetchedUserData);
                setFormData({
                    name: fetchedUserData.name || '',
                    email: fetchedUserData.email || '',
                    phone: fetchedUserData.phone || '',
                    location: fetchedUserData.location || '',
                    bio: fetchedUserData.bio || '',
                    avatarUrl: fetchedUserData.avatarUrl || ''
                });
                setAvatarPreview(fetchedUserData.avatarUrl || null);
            } else {
                const profileErrorReason = profileResult.reason;
                throw new Error(profileErrorReason?.data?.message || profileErrorReason?.message || t('errors.profileLoadError'));
            }

            if (statsResult.status === 'fulfilled' && statsResult.value) {
                setStatsData(statsResult.value);
            } else {
                toast.warn(t('toast.statsLoadError', 'No se pudieron cargar las estadísticas del perfil.'));
                setStatsData({ totalObjectives: 0, completed: 0, inProgress: 0, successRate: 0 });
            }

        } catch (err) {
            setError(err.message);
            setUserData(null); 
            setStatsData(null);
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchPageData();
    }, [fetchPageData]);

    const handleEditClick = () => {
        if (!userData) return;
        setFormError(null);
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

    const handleSaveChanges = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormError(null);
        try {
            const payloadToUpdate = {
                nombre_usuario: formData.name,
                telefono: formData.phone || null,
                ubicacion: formData.location || null,
                biografia: formData.bio || null,
            };

            const updatedUserDataFromAPI = await apiService.updateUserProfile(payloadToUpdate);
            setUserData(prevUserData => ({ ...prevUserData, ...updatedUserDataFromAPI }));
            setFormData(prevData => ({ ...prevData, ...updatedUserDataFromAPI }));
            toast.success(t('toast.profileUpdateSuccess'));
            setIsEditMode(false);
        } catch (err) {
            const errorMessage = err.data?.message || err.message;
            setFormError(errorMessage);
            toast.error(t('toast.profileUpdateError', { error: errorMessage }));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAvatarFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error(t('toast.avatarUpload.fileTooLarge'));
                return;
            }
            if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
                toast.error(t('toast.avatarUpload.invalidFormat'));
                return;
            }
            setSelectedAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleAvatarUpload = async () => {
        if (!selectedAvatarFile) {
            toast.info(t('toast.avatarUpload.selectFirst'));
            return;
        }
        setIsUploadingAvatar(true);
        setFormError(null);
        try {
            const formDataToSubmit = new FormData();
            formDataToSubmit.append('avatar', selectedAvatarFile);
            const response = await apiService.uploadAvatar(formDataToSubmit);
            
            const newAvatarUrl = response.avatarUrl;
            setUserData(prevData => ({ ...prevData, avatarUrl: newAvatarUrl }));
            setFormData(prevData => ({ ...prevData, avatarUrl: newAvatarUrl }));
            setAvatarPreview(newAvatarUrl);
            setSelectedAvatarFile(null);
            toast.success(t('toast.avatarUpload.updateSuccess'));
        } catch (err) {
            const errorMessage = err.data?.message || err.message;
            setFormError(errorMessage);
            toast.error(t('toast.avatarUpload.updateError', { error: errorMessage }));
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    if (isLoading && !userData) {
        return <div className={styles.centeredStatus}><LoadingSpinner size="large" text={t('loaders.loadingProfile')} /></div>;
    }
    if (error && !userData) {
        return <div className={`${styles.centeredStatus} ${styles.errorText}`}>{error}</div>;
    }
    if (!userData) {
        return <div className={styles.centeredStatus}>{t('errors.profileLoadError')}</div>;
    }

    const formattedMemberSince = userData.memberSince ? formatDateByPreference(userData.memberSince, settings.dateFormat, settings.language) : t('common.notAvailable');

    return (
        <div className={styles.profilePageContainer}>
            <header className={styles.profileHeader}>
                <div className={styles.avatarContainer}>
                    {isEditMode ? (
                        avatarPreview ? <img src={avatarPreview} alt={t('profilePage.avatarPreviewAlt')} className={styles.avatar} /> : <FaUserCircle className={styles.avatarPlaceholder} />
                    ) : (
                        userData.avatarUrl ? <img src={userData.avatarUrl} alt={t('profilePage.avatarAlt', { name: userData.name })} className={styles.avatar} /> : <FaUserCircle className={styles.avatarPlaceholder} />
                    )}
                    {isEditMode && (
                        <>
                            <input type="file" accept="image/jpeg, image/png, image/gif" ref={fileInputRef} onChange={handleAvatarFileChange} style={{ display: 'none' }} id="avatarUploadInput" />
                            <Button type="button" size="small" onClick={() => fileInputRef.current?.click()} className={styles.avatarEditButton} disabled={isUploadingAvatar || isSubmitting}>{t('profilePage.selectPhoto')}</Button>
                            {selectedAvatarFile && (<Button type="button" size="small" variant="success" onClick={handleAvatarUpload} isLoading={isUploadingAvatar} disabled={isUploadingAvatar || isSubmitting} className={styles.avatarUploadButton}><FaUpload /> {t('profilePage.uploadPhoto')}</Button>)}
                        </>
                    )}
                </div>
                <div className={styles.userInfoMain}>
                    <div className={styles.userNameStatus}>
                        <h1 className={styles.userName}>{isEditMode ? (formData.name || '') : (userData.name || t('common.userFallback'))}</h1>
                        {userData.status && !isEditMode && (<span className={`${styles.statusBadge} ${styles['status' + userData.status.replace(/\s+/g, '')]}`}><IoShieldCheckmark className={styles.statusIcon} /> {userData.status}</span>)}
                    </div>
                    <p className={styles.userInfoDetail}><FaEnvelope /> {userData.email || '-'}</p>
                    {!isEditMode && userData.location && <p className={styles.userInfoDetail}><FaMapMarkerAlt /> {userData.location}</p>}
                    {!isEditMode && userData.phone && <p className={styles.userInfoDetail}><FaPhone /> {userData.phone}</p>}
                    <p className={styles.userInfoDetail}><FaCalendarAlt /> {t('profilePage.memberSince', { date: formattedMemberSince })}</p>
                </div>
                <div className={styles.profileActions}>
                    {!isEditMode && (<Button variant="primary" onClick={handleEditClick}><FaEdit /> {t('profilePage.editProfile')}</Button>)}
                </div>
            </header>
            <div className={styles.profileContentGrid}>
                <section className={`${styles.profileCard} ${styles.personalInfoCard}`}>
                    <div className={styles.personalInfoHeader}>
                        <h2 className={styles.cardTitle}>{t('profilePage.cards.personalInfo.title')}</h2>
                        <p className={styles.cardSubtitle}>{isEditMode ? t('profilePage.cards.personalInfo.subtitleEdit') : t('profilePage.cards.personalInfo.subtitleView')}</p>
                    </div>
                    {isEditMode ? (
                        <form onSubmit={handleSaveChanges}>
                            <div className={styles.infoGrid}>
                                <FormGroup label={t('profilePage.labels.fullName')} htmlFor="name"><Input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} /></FormGroup>
                                <FormGroup label={t('profilePage.labels.email')} htmlFor="email"><Input type="email" id="email" name="email" value={formData.email} readOnly disabled title={t('profilePage.emailReadonly')} /></FormGroup>
                                <FormGroup label={t('profilePage.labels.phone')} htmlFor="phone"><Input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} placeholder={t('profilePage.placeholders.phone')}/></FormGroup>
                                <FormGroup label={t('profilePage.labels.location')} htmlFor="location"><Input type="text" id="location" name="location" value={formData.location} onChange={handleInputChange} placeholder={t('profilePage.placeholders.location')}/></FormGroup>
                                <FormGroup label={t('profilePage.labels.bio')} htmlFor="bio"><textarea id="bio" name="bio" value={formData.bio} onChange={handleInputChange} className={styles.bioTextarea} rows="5" placeholder={t('profilePage.placeholders.bio')}/></FormGroup>
                            </div>
                            {formError && <p className={styles.formErrorMessage}>{formError}</p>}
                            <div className={styles.editFormActions}>
                                <Button type="button" variant="secondary" onClick={handleCancelEdit} disabled={isSubmitting || isUploadingAvatar}>{t('common.cancel')}</Button>
                                <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting || isUploadingAvatar}>{isSubmitting ? t('common.saving') : t('common.saveChanges')}</Button>
                            </div>
                        </form>
                    ) : (
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}><label className={styles.infoLabel}>{t('profilePage.labels.fullName')}</label><p className={styles.infoValue}>{userData.name || '-'}</p></div>
                            <div className={styles.infoItem}><label className={styles.infoLabel}>{t('profilePage.labels.email')}</label><p className={styles.infoValue}>{userData.email || '-'}</p></div>
                            <div className={styles.infoItem}><label className={styles.infoLabel}>{t('profilePage.labels.phone')}</label><p className={styles.infoValue}>{userData.phone || '-'}</p></div>
                            <div className={styles.infoItem}><label className={styles.infoLabel}>{t('profilePage.labels.location')}</label><p className={styles.infoValue}>{userData.location || '-'}</p></div>
                            <div className={styles.infoItemWide}><label className={styles.infoLabel}>{t('profilePage.labels.bio')}</label><p className={`${styles.infoValue} ${styles.bioText}`}>{userData.bio || t('profilePage.noBio')}</p></div>
                        </div>
                    )}
                </section>
                <div className={styles.rightColumn}>
                    {statsData && (
                        <section className={`${styles.profileCard} ${styles.statsCard}`}>
                            <h2 className={styles.cardTitle}>{t('profilePage.cards.stats.title')}</h2>
                            <p className={styles.cardSubtitle}>{t('profilePage.cards.stats.subtitle')}</p>
                            <ul className={styles.statsList}>
                                <li><span>{t('profilePage.cards.stats.total')}</span><span className={styles.statValue}>{statsData.totalObjectives}</span></li>
                                <li><span>{t('profilePage.cards.stats.completed')}</span><span className={`${styles.statValue} ${styles.statCompleted}`}>{statsData.completed}</span></li>
                                <li><span>{t('profilePage.cards.stats.inProgress')}</span><span className={`${styles.statValue} ${styles.statInProgress}`}>{statsData.inProgress}</span></li>
                                <li><span>{t('profilePage.cards.stats.successRate')}</span><span className={`${styles.statValue} ${styles.statSuccessRate}`}>{statsData.successRate}%</span></li>
                            </ul>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;