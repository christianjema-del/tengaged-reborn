    export const avatarDesigns = [
      { code: "classic-blue", name: "Chica · Azul", bg: "#d9f0f5", skin: "#f4c69b", hair: "#49382f", shirt: "#329db8", style: "long", shape: "feminine" },
      { code: "classic-rose", name: "Chica · Rosa", bg: "#f7e1e9", skin: "#e9ad86", hair: "#742f48", shirt: "#d96c91", style: "fringe", shape: "feminine" },
      { code: "classic-gold", name: "Chico · Dorado", bg: "#f7edc9", skin: "#f3c89a", hair: "#68472e", shirt: "#d6a640", style: "spiky", shape: "masculine" },
      { code: "classic-mint", name: "Chico · Menta", bg: "#dff1e6", skin: "#9b6246", hair: "#302d28", shirt: "#49a982", style: "curly", shape: "masculine" },
      { code: "classic-lilac", name: "Chica · Lila", bg: "#ece3f6", skin: "#edc29d", hair: "#644b87", shirt: "#9172bd", style: "long", shape: "feminine" },
      { code: "classic-sunset", name: "Chico · Atardecer", bg: "#f8e2d3", skin: "#bf7956", hair: "#3f2928", shirt: "#d77d4d", style: "short", shape: "masculine" },
      { code: "classic-ocean", name: "Chico · Océano", bg: "#dce7f8", skin: "#eac19f", hair: "#3b3531", shirt: "#577db8", style: "cap", shape: "masculine" },
      { code: "classic-coral", name: "Chica · Coral", bg: "#ffe3d8", skin: "#a96548", hair: "#211e22", shirt: "#df795e", style: "curly", shape: "feminine" }
    ];

import {renderAvatar,legacyAvatar} from './avatar-art.js';
export function avatarSvg(code,label='Avatar de Tengaged'){return renderAvatar(legacyAvatar(code));}
