export function canFillBots(user){return !!user?.is_admin&&String(user?.username||'').toLowerCase()==='admin1';}
