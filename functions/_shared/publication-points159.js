import {COLOR_LEVELS} from '../../color-level-catalog.js';
// Used inside INSERT so the equipped card and the new publication share one SQL snapshot.
export const PUBLICATION_POINTS_SQL159="COALESCE((SELECT MAX(CASE si.theme_code "+COLOR_LEVELS.map(l=>"WHEN '"+l.code+"' THEN "+l.power).join(' ')+" ELSE 1 END) FROM user_inventory inv JOIN shop_items si ON si.code=inv.item_code WHERE inv.user_id=? AND inv.is_equipped=1 AND si.category='Tarjetas de color'),1)";
