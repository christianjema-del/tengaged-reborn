import {withStorageGuard} from '../_shared/storage-guard141.js';
import {ensureDesignMarket,settleDesignAuctions} from '../_shared/design-market117.js';
import { ensureProfileSchema, getSessionUser, jsonError } from "../_shared/auth.js";
import { ensureCommunitySchema } from "../_shared/community.js";

async function handle141_onRequest({ request, env }) {
  try {
    await ensureProfileSchema(env.DB);
    await ensureCommunitySchema(env.DB);await ensureDesignMarket(env.DB);
    const user = await getSessionUser(request, env.DB);
    if (request.method === "GET") {
      await settleDesignAuctions(env.DB);
      const rows = await env.DB.prepare(`SELECT a.id,a.design_id,a.starting_bid,a.current_bid,a.ends_at,a.status,
          d.title,d.description,d.theme_code,d.author,CASE WHEN d.image_data IS NULL THEN 0 ELSE 1 END AS has_image,
          seller.username AS seller, bidder.username AS highest_bidder,
          CASE WHEN a.seller_id=? THEN 1 ELSE 0 END AS is_owner
        FROM design_auctions a JOIN community_designs d ON d.id=a.design_id
        JOIN users seller ON seller.id=a.seller_id LEFT JOIN users bidder ON bidder.id=a.highest_bidder_id
        WHERE a.status IN ('open','sold','unsold') ORDER BY CASE a.status WHEN 'open' THEN 0 ELSE 1 END,a.ends_at LIMIT 60`).bind(user?.id || -1).all();
      const history=await env.DB.prepare(`SELECT b.auction_id,b.amount,b.created_at,u.username AS bidder FROM auction_bids b JOIN users u ON u.id=b.bidder_id WHERE b.auction_id IN (SELECT id FROM design_auctions ORDER BY ends_at DESC LIMIT 60) ORDER BY b.created_at DESC,b.id DESC LIMIT 200`).all();
      return Response.json({ok:true,auctions:rows.results||[],bids:history.results||[],signed_in:Boolean(user)},{headers:{"Cache-Control":"no-store"}});
    }
    if (request.method !== "POST") return jsonError("Método no permitido.",405);
    if (!user) return jsonError("Inicia sesión para participar en las subastas.",401);
    if(request.headers.get('Origin')!==new URL(request.url).origin)return jsonError('Origen no permitido.',403);
    const body = await request.json().catch(()=>({}));
    if(body.action==='create')return jsonError('Las subastas se seleccionan automáticamente por votos cada doce horas.',409);
    if (body.action === "bid") {
      const auctionId=Number(body.auction_id), amount=Number(body.amount);
      if(!Number.isInteger(auctionId)||auctionId<1||!Number.isInteger(amount)||amount<1||amount>100000) return jsonError("La puja no es válida.",400);
      const auction=await env.DB.prepare("SELECT id,seller_id,current_bid,starting_bid,ends_at,status FROM design_auctions WHERE id=?").bind(auctionId).first();
      if(!auction||auction.status!=="open"||Date.parse(auction.ends_at.replace(" ","T")+"Z")<=Date.now()) return jsonError("La subasta ya ha terminado.",409);
      const owned=await env.DB.prepare("SELECT 1 FROM user_inventory WHERE user_id=? AND item_code=(SELECT 'userdesign-'||design_id FROM design_auctions WHERE id=?)").bind(user.id,auctionId).first();if(owned)return jsonError('Ya tienes este diseño en tu armario.',409);
      const minimum=Math.max(Number(auction.starting_bid),Number(auction.current_bid)+1);
      if(amount<minimum) return jsonError(`La siguiente puja mínima es ${minimum} T$.`,400);
      const bidder=await env.DB.prepare("SELECT t_money FROM users WHERE id=?").bind(user.id).first();
      if(Number(bidder?.t_money||0)<amount) return jsonError("No tienes suficiente saldo para cubrir esa puja.",400);
      const changes=await env.DB.batch([env.DB.prepare("UPDATE design_auctions SET current_bid=?,highest_bidder_id=? WHERE id=? AND status='open' AND current_bid<? AND ends_at>CURRENT_TIMESTAMP").bind(amount,user.id,auctionId,amount),env.DB.prepare("INSERT INTO auction_bids(auction_id,bidder_id,amount) SELECT ?,?,? WHERE changes()=1").bind(auctionId,user.id,amount)]);const changed=changes[0];
      if(!changed.meta.changes) return jsonError("Otra persona ha actualizado la subasta. Recarga e inténtalo de nuevo.",409);
      return Response.json({ok:true,message:"Puja registrada. El importe se cobrará al cerrar la subasta."});
    }
    return jsonError("Acción de subasta no reconocida.",400);
  } catch(error) {
    console.error("Auction API failed",error);
    return jsonError("No se pudo completar la acción de subasta.",500);
  }
}

export async function onRequest(context){return withStorageGuard(context,handle141_onRequest);}
