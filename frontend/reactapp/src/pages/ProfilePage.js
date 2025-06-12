// frontend/reactapp/src/pages/ProfilePage.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './ProfilePage.module.css';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import FormGroup from '../components/ui/FormGroup';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import apiService from '../services/apiService';
import { toast } from 'react-toastify';
import { FaUserCircle, FaEnvelope, FaMapMarkerAlt, FaCalendarAlt, FaPhone, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
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
    const fileInputRef = useRef(null);

    const mapApiDataToState = (apiData) => ({
        name: apiData.username || '',
        email: apiData.email || '',
        phone: apiData.phone || '',
        location: apiData.location || '',
        bio: apiData.bio || '',
        avatarUrl: apiData.avatarUrl || '',
        memberSince: apiData.createdAt,
        status: apiData.status,
    });

    const fetchPageData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [profileResponse, statsResponse] = await Promise.all([
                apiService.getUserProfile(),
                apiService.getUserProfileStats()
            ]);
            const normalizedProfile = mapApiDataToState(profileResponse);
            setUserData(normalizedProfile);
            setFormData(normalizedProfile);
            setAvatarPreview(normalizedProfile.avatarUrl); //
            setStatsData(statsResponse);
        } catch (err) {
            setError(err.message || t('errors.profileLoadError'));
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchPageData();
    }, [fetchPageData]);

    const handleEditClick = () => {
        setFormError(null);
        setIsEditMode(true);
    };

    const handleCancelEdit = () => {
        setIsEditMode(false);
        setFormError(null);
        setSelectedAvatarFile(null);
        setAvatarPreview(userData.avatarUrl); //
        setFormData(userData);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveChanges = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormError(null);
    
        const submissionData = new FormData(); //
        submissionData.append('username', formData.name); //
        submissionData.append('phone', formData.phone || ''); //
        submissionData.append('location', formData.location || ''); //
        submissionData.append('bio', formData.bio || ''); //
    
        if (selectedAvatarFile) {
            submissionData.append('avatar', selectedAvatarFile); //
        }
    
        try {
            const updatedProfile = await apiService.updateUserProfile(submissionData); //
    
            const normalizedUserData = mapApiDataToState(updatedProfile);
            
            setUserData(normalizedUserData);
            setFormData(normalizedUserData);
            setSelectedAvatarFile(null);
            setAvatarPreview(normalizedUserData.avatarUrl); //
            
            toast.success(t('toast.profileUpdateSuccess'));
            setIsEditMode(false);
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message;
            setFormError(errorMessage);
            toast.error(t('toast.profileUpdateError', { error: errorMessage }));
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleAvatarFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // Límite de 5MB
                toast.error(t('toast.avatarUpload.fileTooLarge'));
                return;
            }
            if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
                toast.error(t('toast.avatarUpload.invalidFormat'));
                return;
            }
            setSelectedAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file)); //
        }
    };
    
    if (isLoading) return <div className={styles.centeredStatus}><LoadingSpinner size="large" text={t('loaders.loadingProfile')} /></div>;
    if (error) return <div className={`${styles.centeredStatus} ${styles.errorText}`}>{error}</div>;

    const formattedMemberSince = userData?.memberSince ? formatDateByPreference(userData.memberSince, settings.dateFormat, settings.language) : t('common.notAvailable');

    return (
        <div className={styles.profilePageContainer}>
            <header className={styles.profileHeader}>
                <div className={styles.avatarContainer}>
                     {avatarPreview ? <img src={avatarPreview} alt={t('profilePage.avatarAlt', { name: formData.name })} className={styles.avatar} /> : <FaUserCircle className={styles.avatarPlaceholder} />}
                     {isEditMode && (
                        <Button size="small" variant="outline" onClick={() => fileInputRef.current?.click()} className={styles.avatarEditButton} disabled={isSubmitting}>{t('profilePage.selectPhoto')}</Button>
                    )}
                </div>
                <div className={styles.userInfoMain}>
                    <h1 className={styles.userName}>{isEditMode ? formData.name : userData.name}</h1>
                    <p className={styles.userInfoDetail}><FaEnvelope /> {userData.email}</p>
                    {!isEditMode && userData.location && <p className={styles.userInfoDetail}><FaMapMarkerAlt /> {userData.location}</p>}
                    {!isEditMode && userData.phone && <p className={styles.userInfoDetail}><FaPhone /> {userData.phone}</p>}
                    <p className={styles.userInfoDetail}><FaCalendarAlt /> {t('profilePage.memberSince', { date: formattedMemberSince })}</p>
                </div>
                <div className={styles.profileActions}>
                    {isEditMode ? (
                        <div className={styles.editHeaderActions}>
                            <Button variant="buttonOutline" onClick={handleCancelEdit} disabled={isSubmitting} leftIcon={<FaTimes />}>{t('common.cancel')}</Button>
                            <Button type="submit" form="profile-form" variant="primary" isLoading={isSubmitting} disabled={isSubmitting} leftIcon={<FaSave />}>{t('common.saveChanges')}</Button>
                        </div>
                    ) : (
                        <Button variant="outline" onClick={handleEditClick} leftIcon={<FaEdit />}>{t('profilePage.editProfile')}</Button>
                    )}
                </div>
            </header>
            
            <div className={styles.profileContentGrid}>
                <section className={`${styles.profileCard} ${styles.personalInfoCard}`}>
                     <h2 className={styles.cardTitle}>{t('profilePage.cards.personalInfo.title')}</h2>
                    {isEditMode ? (
                        <form id="profile-form" onSubmit={handleSaveChanges}>
                            <FormGroup label={t('profilePage.labels.fullName')} htmlFor="name"><Input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} /></FormGroup>
                            <FormGroup label={t('profilePage.labels.email')} htmlFor="email"><Input type="email" id="email" name="email" value={formData.email} readOnly disabled title={t('profilePage.emailReadonly')} /></FormGroup>
                            <FormGroup label={t('profilePage.labels.phone')} htmlFor="phone"><Input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} /></FormGroup>
                            <FormGroup label={t('profilePage.labels.location')} htmlFor="location"><Input type="text" id="location" name="location" value={formData.location} onChange={handleInputChange} /></FormGroup>
                            <FormGroup label={t('profilePage.labels.bio')} htmlFor="bio"><textarea id="bio" name="bio" value={formData.bio} onChange={handleInputChange} className={styles.bioTextarea} rows="4" /></FormGroup>
                            {formError && <p className={styles.formErrorMessage}>{formError}</p>}
                        </form>
                    ) : (
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}><label>{t('profilePage.labels.fullName')}</label><p>{userData.name || '-'}</p></div>
                            <div className={styles.infoItem}><label>{t('profilePage.labels.email')}</label><p>{userData.email || '-'}</p></div>
                            <div className={styles.infoItem}><label>{t('profilePage.labels.phone')}</label><p>{userData.phone || '-'}</p></div>
                            <div className={styles.infoItem}><label>{t('profilePage.labels.location')}</label><p>{userData.location || '-'}</p></div>
                            <div className={styles.infoItemWide}><label>{t('profilePage.labels.bio')}</label><p>{userData.bio || t('profilePage.noBio')}</p></div>
                        </div>
                    )}
                </section>
                <aside className={styles.rightColumn}>
                    {statsData && (
                        <section className={`${styles.profileCard} ${styles.statsCard}`}>
                            <h2 className={styles.cardTitle}>{t('profilePage.cards.stats.title')}</h2>
                            <ul className={styles.statsList}>
                                <li><span>{t('profilePage.cards.stats.total')}</span><span>{statsData.totalObjectives}</span></li>
                                <li><span>{t('profilePage.cards.stats.completed')}</span><span>{statsData.completed}</span></li>
                                <li><span>{t('profilePage.cards.stats.inProgress')}</span><span>{statsData.inProgress}</span></li>
                                <li><span>{t('profilePage.cards.stats.successRate')}</span><span>{statsData.successRate}%</span></li>
                            </ul>
                        </section>
                    )}
                </aside>
            </div>
            <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" ref={fileInputRef} onChange={handleAvatarFileChange} style={{ display: 'none' }} id="avatarUploadInput" />
        </div>
    );
}

export default ProfilePage;