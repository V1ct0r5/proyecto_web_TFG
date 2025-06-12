// backend/src/api/services/profileService.js
const fs = require('fs').promises;
const path = require('path');
const db = require('../../config/database');
const { User, Objective } = db;
const AppError = require('../../utils/AppError');
const userRepository = require('../repositories/userRepository');

const AVATAR_UPLOAD_DIR = path.resolve(__dirname, '../../../public/uploads/avatars');

class ProfileService {
    async fetchUserProfile(userId) {
        const user = await User.findByPk(userId, {
            attributes: ['id', 'username', 'email', 'createdAt', 'phone', 'location', 'bio', 'avatarUrl']
        });
        if (!user) {
            throw new AppError('Perfil de usuario no encontrado.', 404);
        }
        return user.toJSON();
    }

    async fetchUserStats(userId) {
        const objectives = await Objective.findAll({ where: { userId } });
        if (objectives.length === 0) {
            return { totalObjectives: 0, completed: 0, inProgress: 0, successRate: 0 };
        }
        
        const totalObjectives = objectives.length;
        const completed = objectives.filter(o => o.status === 'COMPLETED').length;
        const inProgress = objectives.filter(o => o.status === 'IN_PROGRESS').length;
        const successRate = totalObjectives > 0 ? Math.round((completed / totalObjectives) * 100) : 0;

        return { totalObjectives, completed, inProgress, successRate };
    }
    
    async updateUserProfile(userId, profileData, newAvatarFile) {
        const user = await User.findByPk(userId); //
        if (!user) {
            throw new AppError('Usuario no encontrado para actualizar.', 404); //
        }

        user.username = profileData.username ?? user.username; //
        user.phone = profileData.phone ?? user.phone; //
        user.location = profileData.location ?? user.location; //
        user.bio = profileData.bio ?? user.bio; //
        
        if (newAvatarFile) {
            const newAvatarUrl = `/uploads/avatars/${newAvatarFile.filename}`; //
            const oldAvatarUrl = user.avatarUrl;
            
            user.avatarUrl = newAvatarUrl; //

            if (oldAvatarUrl && oldAvatarUrl.includes('/uploads/avatars/')) { //
                try {
                    const oldFileName = path.basename(oldAvatarUrl);
                    const oldAvatarPath = path.join(AVATAR_UPLOAD_DIR, oldFileName);
                    if (oldAvatarPath.startsWith(AVATAR_UPLOAD_DIR)) {
                        await fs.unlink(oldAvatarPath);
                    }
                } catch (e) {
                    console.error(`[ProfileService] No se pudo eliminar el avatar antiguo: ${e.message}`);
                }
            }
        }

        await user.save(); //
        return user.toJSON(); //
    }
}

module.exports = new ProfileService();