import {schemaReady170,markSchema170} from './schema-ready170.js';
export const TEMPORARY_PASSWORD_MS=24*3600000;
const ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export async function ensurePasswordReset(db){
 if(await schemaReady170(db,'password-reset267'))return;
 for(const sql of ['ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0','ALTER TABLE users ADD COLUMN temporary_password_until TEXT'])
  try{await db.prepare(sql).run();}catch(error){if(!/duplicate column/i.test(String(error?.message||error)))throw error;}
 await markSchema170(db,'password-reset267');
}
// 32 simbolos sin O, 0, I ni 1: se puede dictar sin confusiones.
export function temporaryPassword(){return Array.from(crypto.getRandomValues(new Uint8Array(12)),byte=>ALPHABET[byte&31]).join('');}
export async function hashPassword(password){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(password)))].map(b=>b.toString(16).padStart(2,'0')).join('');}
