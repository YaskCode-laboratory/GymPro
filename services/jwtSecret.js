/**
 * GESTOR DEL SECRETO JWT (jwtSecret.js)
 * 
 * - Verifica si JWT_SECRET existe en .env.
 * - Si no existe, genera uno aleatorio criptográficamente seguro.
 * - Lo persiste en el archivo .env para futuros arranques.
 * - Si el .env no se puede escribir, lo usa solo en memoria (con advertencia).
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ENV_PATH = path.join(__dirname, '..', '.env.example');        /* En producción cambiala de .env.example a .env */

/**
 * Genera un secreto aleatorio de 64 caracteres hexadecimales (256 bits).
 */
function generateSecret() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Escribe o actualiza JWT_SECRET en el archivo .env.
 * Si el archivo no existe, lo crea con las variables mínimas.
 */
function persistSecretInEnv(secret) {
    try {
        let content = '';

        if (fs.existsSync(ENV_PATH)) {
            content = fs.readFileSync(ENV_PATH, 'utf8');

            // Si ya existe una línea JWT_SECRET, reemplazarla
            if (/^JWT_SECRET=/m.test(content)) {
                content = content.replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${secret}`);
            } else {
                // Añadirla al final
                if (!content.endsWith('\n')) content += '\n';
                content += `\n# Secreto JWT autogenerado\n`;
                content += `JWT_SECRET=${secret}\n`;
            }
        }

        fs.writeFileSync(ENV_PATH, content, 'utf8');
        return true;
    } catch (err) {
        console.error('⚠️  No se pudo escribir JWT_SECRET en .env:', err.message);
        return false;
    }
}

/**
 * Devuelve el secreto JWT.
 * 
 * Flujo:
 * 1. Si process.env.JWT_SECRET existe → usarlo.
 * 2. Si no existe → generar uno nuevo + persistirlo en .env.
 * 3. Si falla la persistencia → usarlo solo en memoria.
 */
function getOrCreateJwtSecret() {
    // 1. Ya existe en .env
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.trim() !== '') {
        return process.env.JWT_SECRET;
    }

    // 2. Generar uno nuevo
    const newSecret = generateSecret();
    console.log('🔑 JWT_SECRET no encontrado en .env. Generando uno nuevo...');

    // 3. Intentar persistirlo
    const persisted = persistSecretInEnv(newSecret);

    if (persisted) {
        console.log('✅ JWT_SECRET generado y guardado en .env');
        console.log('   → Reinicia el servidor no requerido (ya está en uso)');
    } else {
        console.log('⚠️  JWT_SECRET generado solo en memoria (no se pudo guardar)');
        console.log('   → Los tokens serán inválidos tras reiniciar el servidor');
    }

    // 4. Actualizar process.env para que otras partes del código lo vean
    process.env.JWT_SECRET = newSecret;

    return newSecret;
}

module.exports = { getOrCreateJwtSecret, generateSecret };
